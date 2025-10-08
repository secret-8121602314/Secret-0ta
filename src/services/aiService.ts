import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { parseOtakonTags } from './otakonTags';
import { AIResponse, Conversation, User, insightTabsConfig } from '../types';
import { cacheService } from './cacheService';
import { getPromptForPersona } from './promptSystem';
import { sessionSummaryService } from './sessionSummaryService';
import { errorRecoveryService } from './errorRecoveryService';
import { characterImmersionService } from './characterImmersionService';

const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

class AIService {
  private genAI: GoogleGenerativeAI;
  private flashModel: GenerativeModel;
  private proModel: GenerativeModel;

  constructor() {
    if (!API_KEY) {
      throw new Error("VITE_GEMINI_API_KEY is not set in the environment variables.");
    }
    this.genAI = new GoogleGenerativeAI(API_KEY);
    // Using the latest stable models as recommended
    this.flashModel = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    this.proModel = this.genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
  }

  /**
   * Main method to get AI chat response
   */
  public async getChatResponse(
    conversation: Conversation,
    user: User,
    userMessage: string,
    isActiveSession: boolean,
    hasImages: boolean = false,
    imageData?: string
  ): Promise<AIResponse> {
    // Create cache key for this request
    const cacheKey = `ai_response_${conversation.id}_${userMessage.substring(0, 50)}_${isActiveSession}`;
    
    // Check cache first
    const cachedResponse = await cacheService.get<AIResponse>(cacheKey);
    if (cachedResponse) {
      return { ...cachedResponse, metadata: { ...cachedResponse.metadata, fromCache: true } };
    }

    // Get session context if available
    let sessionContext = '';
    try {
      const latestSummary = await sessionSummaryService.getLatestSessionSummary(conversation.id);
      if (latestSummary) {
        sessionContext = `\n\n**Previous Session Context:**\n${latestSummary.summary}`;
      }
    } catch (error) {
      console.warn('Failed to get session context:', error);
    }

    // Use the enhanced prompt system with session context
    const basePrompt = getPromptForPersona(conversation, userMessage, user, isActiveSession, hasImages);
    
    // Add immersion context for game conversations
    let immersionContext = '';
    if (conversation.id !== 'everything-else' && conversation.gameTitle && conversation.genre) {
      immersionContext = characterImmersionService.generateImmersionContext({
        gameTitle: conversation.gameTitle,
        genre: conversation.genre,
        currentLocation: conversation.activeObjective,
        playerProgress: conversation.gameProgress
      });
    }
    
    const prompt = basePrompt + sessionContext + '\n\n' + immersionContext;
    
    console.log('🤖 [AIService] Processing request:', { 
      hasImages, 
      hasImageData: !!imageData, 
      imageDataLength: imageData?.length,
      conversationId: conversation.id 
    });
    
    try {
      const modelToUse = conversation.id === 'everything-else' ? this.flashModel : this.flashModel;
      
      // Prepare content for Gemini API
      let content: any;
      if (hasImages && imageData) {
        // Extract MIME type from data URL
        const mimeType = imageData.split(';')[0].split(':')[1] || 'image/jpeg';
        const base64Data = imageData.split(',')[1];
        
        // For image analysis, we need to send both text and image
        content = [
          {
            text: prompt
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          }
        ];
      } else {
        // For text-only requests
        content = prompt;
      }
      
      const result = await modelToUse.generateContent(content);
      const rawContent = await result.response.text();
      const { cleanContent, tags } = parseOtakonTags(rawContent);

      const aiResponse: AIResponse = {
        content: cleanContent,
        suggestions: tags.get('SUGGESTIONS') || [],
        otakonTags: tags,
        rawContent: rawContent,
        metadata: {
          model: 'gemini-2.5-flash',
          timestamp: Date.now(),
          cost: 0, // Placeholder
          tokens: 0, // Placeholder
        }
      };
      
      // Cache the response for 1 hour
      await cacheService.set(cacheKey, aiResponse, 60 * 60 * 1000);
      
      return aiResponse;

    } catch (error) {
      console.error("AI Service Error:", error);
      
      // Use error recovery service
      const recoveryAction = await errorRecoveryService.handleAIError(
        error as Error,
        {
          operation: 'getChatResponse',
          conversationId: conversation.id,
          userId: user.id,
          timestamp: Date.now(),
          retryCount: 0
        }
      );
      
      if (recoveryAction.type === 'retry') {
        // Retry the request
        return this.getChatResponse(conversation, user, userMessage, isActiveSession, hasImages, imageData);
      } else if (recoveryAction.type === 'user_notification') {
        // Return a user-friendly error response
        return {
          content: recoveryAction.message || "I'm having trouble thinking right now. Please try again later.",
          suggestions: ["Try again", "Check your connection", "Contact support"],
          otakonTags: new Map(),
          rawContent: recoveryAction.message || "Error occurred",
          metadata: {
            model: 'error',
            timestamp: Date.now(),
            cost: 0,
            tokens: 0
          }
        };
      }
      
      throw new Error("Failed to get response from AI service.");
    }
  }


  /**
   * Generates initial sub-tab content for a new game
   */
  public async generateInitialInsights(gameTitle: string, genre: string): Promise<Record<string, string>> {
    const cacheKey = `insights_${gameTitle.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Check cache first
    const cachedInsights = await cacheService.get<Record<string, string>>(cacheKey);
    if (cachedInsights) {
      return cachedInsights;
    }

    const config = insightTabsConfig[genre] || insightTabsConfig['Default'];
    const instructions = config
      .map(tab => `- ${tab.title} (${tab.id}): ${tab.instruction}`)
      .join('\n');

    const prompt = `
      **Task:** Generate initial content for ${gameTitle} (${genre} game)
      **Format:** Respond with a single JSON object where keys are tab IDs and values are content strings
      
      **Instructions:**
      ${instructions}
      
      **Rules:**
      - Content must be concise, spoiler-free, and suitable for new players
      - Output must be valid JSON: {"walkthrough":"content","tips":"content",...}
      - Each content should be 2-3 paragraphs maximum
      - Use markdown formatting for better readability
    `;

    try {
      const result = await this.proModel.generateContent(prompt);
      const rawJson = await result.response.text();
      const cleanedJson = rawJson.replace(/```json\n?|\n?```/g, '').trim();
      const insights = JSON.parse(cleanedJson);

      // Cache for 24 hours
      await cacheService.set(cacheKey, insights, 24 * 60 * 60 * 1000);
      return insights;

    } catch (error) {
      console.error("Failed to generate initial insights:", error);
      return {};
    }
  }
}

export const aiService = new AIService();
