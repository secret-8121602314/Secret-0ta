import { GoogleGenerativeAI, GenerativeModel, SchemaType, HarmCategory, HarmBlockThreshold, SafetySetting } from "@google/generative-ai";
import { parseOtakonTags } from './otakonTags';
import { AIResponse, Conversation, User, insightTabsConfig, PlayerProfile } from '../types';
import { cacheService } from './cacheService';
import { getPromptForPersona } from './promptSystem';
import { errorRecoveryService } from './errorRecoveryService';
import { characterImmersionService } from './characterImmersionService';
import { profileAwareTabService } from './profileAwareTabService';
import { toastService } from './toastService';
import { supabase } from '../lib/supabase';

// ✅ SECURITY FIX: Use Edge Function proxy instead of exposed API key
const USE_EDGE_FUNCTION = true; // Set to true to use secure server-side proxy
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY; // Only used if USE_EDGE_FUNCTION = false

// ✅ FIX 1: Gemini API Safety Settings
const SAFETY_SETTINGS: SafetySetting[] = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

class AIService {
  private genAI: GoogleGenerativeAI;
  private flashModel: GenerativeModel;
  private proModel: GenerativeModel;
  private flashModelWithGrounding: GenerativeModel;
  private edgeFunctionUrl: string;
  
  // ✅ REQUEST DEDUPLICATION: Track pending requests to prevent duplicate API calls
  private pendingRequests: Map<string, Promise<AIResponse>> = new Map();

  constructor() {
    // ✅ SECURITY: Initialize Edge Function URL
    const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
    this.edgeFunctionUrl = `${supabaseUrl}/functions/v1/ai-proxy`;

    if (!USE_EDGE_FUNCTION) {
      // Legacy: Direct API mode (only for development/testing)
      if (!API_KEY) {
        throw new Error("VITE_GEMINI_API_KEY is not set in the environment variables.");
      }
      this.genAI = new GoogleGenerativeAI(API_KEY);
      // Using gemini-2.5-flash-preview-09-2025 for all operations (enhanced performance)
      // ✅ FIX 2: Apply safety settings to all model initializations
      this.flashModel = this.genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-preview-09-2025",
        safetySettings: SAFETY_SETTINGS
      });
      this.proModel = this.genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-preview-09-2025",
        safetySettings: SAFETY_SETTINGS
      });
      // ✅ NEW: Model with Google Search grounding enabled
      this.flashModelWithGrounding = this.genAI.getGenerativeModel({
        model: "gemini-2.5-flash-preview-09-2025",
        safetySettings: SAFETY_SETTINGS,
        tools: [{
          googleSearchRetrieval: {}
        }]
      });
    } else {
      // Edge Function mode: Initialize dummy models (won't be used)
      this.genAI = {} as GoogleGenerativeAI;
      this.flashModel = {} as GenerativeModel;
      this.proModel = {} as GenerativeModel;
      this.flashModelWithGrounding = {} as GenerativeModel;
    }
  }

  /**
   * ✅ SECURITY: Call Edge Function proxy instead of direct API
   */
  private async callEdgeFunction(request: {
    prompt: string;
    image?: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    requestType: 'text' | 'image';
    model?: string;
    tools?: any[];
  }): Promise<{ response: string; success: boolean; usage?: any; groundingMetadata?: any }> {
    // Get user's JWT token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Call Edge Function (server-side proxy)
    const response = await fetch(this.edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'AI service error');
    }

    return await response.json();
  }

  /**
   * ✅ FIX 3: Check if AI response was blocked by safety filters
   */
  private checkSafetyResponse(result: any): { safe: boolean; reason?: string } {
    // Check if prompt was blocked
    if (result.response.promptFeedback?.blockReason) {
      return {
        safe: false,
        reason: `Content blocked: ${result.response.promptFeedback.blockReason}`
      };
    }
    
    // Check if response was blocked by safety filters
    const candidate = result.response.candidates?.[0];
    if (!candidate) {
      return {
        safe: false,
        reason: 'No response generated'
      };
    }
    
    if (candidate.finishReason === 'SAFETY') {
      return {
        safe: false,
        reason: 'Response blocked by safety filters'
      };
    }
    
    return { safe: true };
  }

  /**
   * ✅ REQUEST DEDUPLICATION: Wrapper to prevent duplicate API calls
   * If same request is already in progress, return the existing promise
   */
  private async getChatResponseWithDeduplication(
    conversation: Conversation,
    user: User,
    userMessage: string,
    isActiveSession: boolean,
    hasImages: boolean = false,
    imageData?: string,
    abortSignal?: AbortSignal
  ): Promise<AIResponse> {
    // Create deduplication key (conversation + message + session state)
    const dedupKey = `${conversation.id}_${userMessage}_${isActiveSession}_${hasImages}`;
    
    // Check if identical request is already pending
    const pendingRequest = this.pendingRequests.get(dedupKey);
    if (pendingRequest) {
      console.warn('⚠️ [AIService] Duplicate request detected, returning existing promise');
      return pendingRequest;
    }
    
    // Create new request promise
    const requestPromise = this.getChatResponseInternal(
      conversation,
      user,
      userMessage,
      isActiveSession,
      hasImages,
      imageData,
      abortSignal
    );
    
    // Store pending request
    this.pendingRequests.set(dedupKey, requestPromise);
    
    // Clean up after completion (success or failure)
    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(dedupKey);
    }
  }

  /**
   * Main method to get AI chat response (public API)
   */
  public async getChatResponse(
    conversation: Conversation,
    user: User,
    userMessage: string,
    isActiveSession: boolean,
    hasImages: boolean = false,
    imageData?: string,
    abortSignal?: AbortSignal
  ): Promise<AIResponse> {
    // Use deduplication wrapper
    return this.getChatResponseWithDeduplication(
      conversation,
      user,
      userMessage,
      isActiveSession,
      hasImages,
      imageData,
      abortSignal
    );
  }

  /**
   * Internal method to get AI chat response (actual implementation)
   */
  private async getChatResponseInternal(
    conversation: Conversation,
    user: User,
    userMessage: string,
    isActiveSession: boolean,
    hasImages: boolean = false,
    imageData?: string,
    abortSignal?: AbortSignal
  ): Promise<AIResponse> {
    // ✅ QUERY LIMIT: Check if user can send this query
    const { ConversationService } = await import('./conversationService');
    const queryCheck = hasImages 
      ? await ConversationService.canSendImageQuery()
      : await ConversationService.canSendTextQuery();
    
    if (!queryCheck.allowed) {
      // Throw error with upgrade prompt
      throw new Error(queryCheck.reason || 'Query limit reached. Please upgrade your tier.');
    }
    
    console.log(`📊 [AIService] Query limit check passed. ${hasImages ? 'Image' : 'Text'} queries: ${queryCheck.used}/${queryCheck.limit}`);
    
    // Create cache key for this request - use full message hash to avoid collisions
    // Simple hash function for cache key
    const hashString = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash.toString(36);
    };
    
    const messageHash = hashString(userMessage + (imageData || ''));
    const cacheKey = `ai_response_${conversation.id}_${messageHash}_${isActiveSession}_${hasImages}`;
    
    // Check cache first (memory only for speed - skip Supabase for real-time operations)
    const cachedResponse = await cacheService.get<AIResponse>(cacheKey, true); // true = memory only
    if (cachedResponse) {
      return { ...cachedResponse, metadata: { ...cachedResponse.metadata, fromCache: true } };
    }

    // Skip session context for now - it's returning null and slowing things down
    // TODO: Implement proper session context when needed
    const sessionContext = '';

    // Get player profile from user preferences
    const playerProfile = user.profileData as any; // PlayerProfile is stored in profileData
    
    // Use the enhanced prompt system with session context and player profile
    const basePrompt = getPromptForPersona(
      conversation, 
      userMessage, 
      user, 
      isActiveSession, 
      hasImages,
      playerProfile
    );
    
    // Add immersion context for game conversations (not Game Hub)
    let immersionContext = '';
    if (!conversation.isGameHub && conversation.gameTitle && conversation.genre) {
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
    
    // Check if request was aborted before starting
    if (abortSignal?.aborted) {
      throw new DOMException('Request was aborted', 'AbortError');
    }
    
    try {
      // ✅ NEW: Determine if we should use grounding (web search)
      // Use grounding for ANY query that might need current information
      const needsWebSearch = 
        // Keywords that indicate need for current information
        userMessage.toLowerCase().includes('release') ||
        userMessage.toLowerCase().includes('new games') ||
        userMessage.toLowerCase().includes('coming out') ||
        userMessage.toLowerCase().includes('this week') ||
        userMessage.toLowerCase().includes('this month') ||
        userMessage.toLowerCase().includes('latest') ||
        userMessage.toLowerCase().includes('news') ||
        userMessage.toLowerCase().includes('announced') ||
        userMessage.toLowerCase().includes('update') ||
        userMessage.toLowerCase().includes('patch') ||
        userMessage.toLowerCase().includes('current') ||
        userMessage.toLowerCase().includes('recent') ||
        // Check if conversation is for a potentially new/unreleased game
        (conversation.gameTitle && (
          conversation.gameTitle.toLowerCase().includes('2025') ||
          conversation.gameTitle.toLowerCase().includes('2024')
        ));
      
      // Use grounding model for queries that need current information
      // ✅ SECURITY: Use Edge Function if enabled
      let rawContent: string;

      if (USE_EDGE_FUNCTION) {
        // Extract base64 image data if present
        let imageBase64: string | undefined;
        if (hasImages && imageData) {
          imageBase64 = imageData.split(',')[1];
        }

        // Determine which model and tools to use
        const modelName = 'gemini-2.5-flash-preview-09-2025';
        
        const tools = needsWebSearch && !hasImages 
          ? [{ googleSearchRetrieval: {} }]
          : [];

        // Call Edge Function proxy
        const edgeResponse = await this.callEdgeFunction({
          prompt,
          image: imageBase64,
          temperature: 0.7,
          maxTokens: 2048,
          requestType: hasImages ? 'image' : 'text',
          model: modelName,
          tools: tools.length > 0 ? tools : undefined
        });

        if (!edgeResponse.success) {
          throw new Error(edgeResponse.response || 'AI request failed');
        }

        rawContent = edgeResponse.response;

      } else {
        // Legacy: Direct API mode (only for development)
        // Note: Grounding doesn't work with image inputs, so fallback to regular model
        const modelToUse = needsWebSearch && !hasImages 
          ? this.flashModelWithGrounding 
          : this.flashModel;
        
        if (needsWebSearch && !hasImages) {
          console.log('🌐 [AIService] Using Google Search grounding for current information:', {
            gameTitle: conversation.gameTitle,
            query: userMessage.substring(0, 50) + '...'
          });
        }
        
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
        
        // ✅ FIX 4: Check safety response
        const safetyCheck = this.checkSafetyResponse(result);
        if (!safetyCheck.safe) {
          toastService.error('Unable to generate response due to content policy');
          throw new Error(safetyCheck.reason);
        }
        
        // Check if request was aborted after API call but before processing
        if (abortSignal?.aborted) {
          throw new DOMException('Request was aborted', 'AbortError');
        }
        
        rawContent = await result.response.text();
      }
      
      // Check if request was aborted after API call but before processing
      if (abortSignal?.aborted) {
        throw new DOMException('Request was aborted', 'AbortError');
      }
      const { cleanContent, tags } = parseOtakonTags(rawContent);

      const aiResponse: AIResponse = {
        content: cleanContent,
        suggestions: [],
        otakonTags: tags,
        rawContent: rawContent,
        metadata: {
          model: 'gemini-flash',
          timestamp: Date.now(),
          cost: 0, // Placeholder
          tokens: 0, // Placeholder
        }
      };
      
      // ✅ QUERY TRACKING: Record usage in database (non-blocking)
      const { SupabaseService } = await import('./supabaseService');
      const supabaseService = SupabaseService.getInstance();
      supabaseService.recordQuery(user.authUserId, hasImages ? 'image' : 'text')
        .catch(error => console.warn('Failed to record query usage:', error));
      
      // Invalidate user cache so next request gets fresh usage data
      const { authService } = await import('./authService');
      authService.refreshUser()
        .catch(error => console.warn('Failed to refresh user after query:', error));
      
      // Cache the response for 1 hour (non-blocking - fire and forget)
      cacheService.set(cacheKey, aiResponse, 60 * 60 * 1000)
        .catch(error => console.warn('Failed to cache AI response:', error));
      
      return aiResponse;

    } catch (error) {
      console.error("AI Service Error:", error);
      
      // ✅ FIX 4: Enhanced error handling for safety blocks
      const errorMessage = (error as Error).message || '';
      if (errorMessage.includes('blocked') || errorMessage.includes('SAFETY') || errorMessage.includes('content policy')) {
        toastService.error('Your message contains inappropriate content');
        throw new Error('Content blocked by safety filters');
      }
      
      toastService.error('AI response failed. Please try again.');
      
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
        return this.getChatResponse(conversation, user, userMessage, isActiveSession, hasImages, imageData, abortSignal);
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
   * Enhanced method to get AI chat response with structured data
   * Returns enhanced AIResponse with optional fields for better integration
   * Falls back to OTAKON_TAG parsing if JSON mode fails
   */
  public async getChatResponseWithStructure(
    conversation: Conversation,
    user: User,
    userMessage: string,
    isActiveSession: boolean,
    hasImages: boolean = false,
    imageData?: string,
    abortSignal?: AbortSignal
  ): Promise<AIResponse> {
    // Create cache key for this request - use full message hash to avoid collisions
    const hashString = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return hash.toString(36);
    };
    
    const messageHash = hashString(userMessage + (imageData || ''));
    const cacheKey = `ai_structured_${conversation.id}_${messageHash}_${isActiveSession}_${hasImages}`;
    
    // Check cache first
    const cachedResponse = await cacheService.get<AIResponse>(cacheKey, true);
    if (cachedResponse) {
      return { ...cachedResponse, metadata: { ...cachedResponse.metadata, fromCache: true } };
    }

    // Get enhanced prompt with context
    const basePrompt = getPromptForPersona(conversation, userMessage, user, isActiveSession, hasImages);
    
    // Add immersion context for game conversations (not Game Hub)
    let immersionContext = '';
    if (!conversation.isGameHub && conversation.gameTitle && conversation.genre) {
      immersionContext = characterImmersionService.generateImmersionContext({
        gameTitle: conversation.gameTitle,
        genre: conversation.genre,
        currentLocation: conversation.activeObjective,
        playerProgress: conversation.gameProgress
      });
    }

    // Add structured response instructions
    const structuredInstructions = `

**ENHANCED RESPONSE FORMAT:**
In addition to your regular response, provide structured data in the following optional fields:

1. **followUpPrompts** (array of 3-4 strings): Generate contextual follow-up questions directly related to your response content
   ${!conversation.isGameHub ? `
   - Session Mode: ${isActiveSession ? 'PLAYING MODE - User is actively playing' : 'PLANNING MODE - User is preparing/strategizing'}
   - ${isActiveSession 
       ? 'Generate immediate, actionable prompts (e.g., "How do I beat this boss?", "What should I do next?")'
       : 'Generate strategic, planning prompts (e.g., "What should I prepare?", "What builds are recommended?")'
     }` : ''}
2. **progressiveInsightUpdates** (array): If conversation provides new info, update existing subtabs (e.g., story_so_far, characters)
3. **stateUpdateTags** (array): Detect game events (e.g., "OBJECTIVE_COMPLETE: true", "TRIUMPH: Boss Name")
4. **gamePillData** (object): ${conversation.isGameHub ? 'Set shouldCreate: true if user asks about a specific game, and include game details with pre-filled wikiContent' : 'Set shouldCreate: false (already in game tab)'}

Note: These are optional enhancements. If not applicable, omit or return empty arrays.
`;
    
    const prompt = basePrompt + immersionContext + structuredInstructions;
    
    console.log('🤖 [AIService] Processing structured request:', { 
      hasImages, 
      conversationId: conversation.id,
      useStructuredMode: !hasImages // Only use JSON mode for text
    });
    
    // Check if request was aborted
    if (abortSignal?.aborted) {
      throw new DOMException('Request was aborted', 'AbortError');
    }
    
    try {
      // ✅ NEW: Also use grounding for structured requests when appropriate
      const needsWebSearch = 
        userMessage.toLowerCase().includes('release') ||
        userMessage.toLowerCase().includes('new games') ||
        userMessage.toLowerCase().includes('latest') ||
        userMessage.toLowerCase().includes('news') ||
        userMessage.toLowerCase().includes('announced') ||
        userMessage.toLowerCase().includes('update') ||
        userMessage.toLowerCase().includes('patch') ||
        userMessage.toLowerCase().includes('current') ||
        userMessage.toLowerCase().includes('recent') ||
        (conversation.gameTitle && (
          conversation.gameTitle.toLowerCase().includes('2025') ||
          conversation.gameTitle.toLowerCase().includes('2024')
        ));
      
      // ✅ SECURITY: Use Edge Function for structured responses
      if (USE_EDGE_FUNCTION) {
        // Extract base64 image data if present
        let imageBase64: string | undefined;
        if (hasImages && imageData) {
          imageBase64 = imageData.split(',')[1];
        }

        const modelName = 'gemini-2.5-flash-preview-09-2025';
        
        const tools = needsWebSearch && !hasImages 
          ? [{ googleSearchRetrieval: {} }]
          : [];

        const edgeResponse = await this.callEdgeFunction({
          prompt,
          image: imageBase64,
          temperature: 0.7,
          maxTokens: 2048,
          requestType: hasImages ? 'image' : 'text',
          model: modelName,
          tools: tools.length > 0 ? tools : undefined
        });

        if (!edgeResponse.success) {
          throw new Error(edgeResponse.response || 'AI request failed');
        }

        const rawContent = edgeResponse.response;
        const { cleanContent, tags } = parseOtakonTags(rawContent);

        const aiResponse: AIResponse = {
          content: cleanContent,
          suggestions: tags.get('SUGGESTIONS') || [],
          otakonTags: tags,
          rawContent: rawContent,
          metadata: {
            model: modelName,
            timestamp: Date.now(),
            cost: 0,
            tokens: 0,
          }
        };

        cacheService.set(cacheKey, aiResponse, 60 * 60 * 1000).catch(err => console.warn(err));
        return aiResponse;
      }

      // Legacy: Direct API mode
      const modelToUse = needsWebSearch && !hasImages 
        ? this.flashModelWithGrounding 
        : this.flashModel;
      
      if (needsWebSearch && !hasImages) {
        console.log('🌐 [AIService] Using Google Search grounding for structured response:', {
          gameTitle: conversation.gameTitle,
          query: userMessage.substring(0, 50) + '...'
        });
      }
      
      // Prepare content
      let content: any;
      if (hasImages && imageData) {
        const mimeType = imageData.split(';')[0].split(':')[1] || 'image/jpeg';
        const base64Data = imageData.split(',')[1];
        
        content = [
          { text: prompt },
          { inlineData: { mimeType, data: base64Data } }
        ];
        
        // For images, use regular mode (not JSON) because images don't work well with JSON schema
        const result = await modelToUse.generateContent(content);
        const rawContent = await result.response.text();
        const { cleanContent, tags } = parseOtakonTags(rawContent);
        
        const aiResponse: AIResponse = {
          content: cleanContent,
          suggestions: tags.get('SUGGESTIONS') || [],
          otakonTags: tags,
          rawContent: rawContent,
          metadata: {
            model: 'gemini-2.5-flash-preview-09-2025',
            timestamp: Date.now(),
            cost: 0,
            tokens: 0,
          }
        };
        
        cacheService.set(cacheKey, aiResponse, 60 * 60 * 1000).catch(err => console.warn(err));
        return aiResponse;
      }
      
      // For text-only, try JSON schema mode for structured response
      try {
        const result = await modelToUse.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: {
                content: { type: SchemaType.STRING, description: "The main chat response for the user" },
                followUpPrompts: { 
                  type: SchemaType.ARRAY, 
                  items: { type: SchemaType.STRING },
                  description: "3-4 contextual follow-up questions"
                },
                progressiveInsightUpdates: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      tabId: { type: SchemaType.STRING },
                      title: { type: SchemaType.STRING },
                      content: { type: SchemaType.STRING }
                    }
                  }
                },
                stateUpdateTags: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING }
                },
                gamePillData: {
                  type: SchemaType.OBJECT,
                  properties: {
                    shouldCreate: { type: SchemaType.BOOLEAN },
                    gameName: { type: SchemaType.STRING },
                    genre: { type: SchemaType.STRING },
                    wikiContent: { 
                      type: SchemaType.STRING,
                      description: "JSON string containing pre-filled subtab content"
                    }
                  }
                }
              },
              required: ["content"]
            }
          }
        });
        
        // ✅ FIX 5: Check safety response
        const safetyCheck = this.checkSafetyResponse(result);
        if (!safetyCheck.safe) {
          toastService.error('Unable to generate response due to content policy');
          throw new Error(safetyCheck.reason);
        }
        
        const rawResponse = await result.response.text();
        const structuredData = JSON.parse(rawResponse);
        
        // ✅ Clean content: Remove any JSON-like structured data from the main content
        let cleanContent = structuredData.content || '';
        
        // Remove structured fields if AI accidentally includes them in content
        // This handles cases where AI outputs: "Hint: ... followUpPrompts: [...]"
        cleanContent = cleanContent
          // ✅ FIX: Remove ANY leading brackets/JSON artifacts more aggressively
          .replace(/^[\s\]}\[{),]+/g, '') // eslint-disable-line no-useless-escape
          // ✅ CRITICAL: Remove entire JSON block at the end (starts with { and contains "followUpPrompts")
          .replace(/\s*\{[\s\S]*?"followUpPrompts"[\s\S]*?\}\s*$/gi, '')
          // Alternative: Remove JSON block if it starts with newline + {
          .replace(/\n\s*\{[\s\S]*$/g, '')
          // ✅ FIX: Remove trailing brackets/JSON at the end (before metadata sections)
          .replace(/\s*[\]}\s]*(?=\s*(?:Enhanced Response Data|followUpPrompts|progressiveInsightUpdates|stateUpdateTags|gamePillData|$))/gi, '')
          // Remove "Enhanced Response Data" header if present
          .replace(/Enhanced Response Data\s*/gi, '')
          // Remove followUpPrompts section (non-JSON format)
          .replace(/followUpPrompts:\s*\[[\s\S]*?\](?=\s*(?:progressiveInsightUpdates|stateUpdateTags|gamePillData|$))/gi, '')
          // Remove progressiveInsightUpdates section
          .replace(/progressiveInsightUpdates:\s*\[[\s\S]*?\](?=\s*(?:followUpPrompts|stateUpdateTags|gamePillData|$))/gi, '')
          // Remove stateUpdateTags section
          .replace(/stateUpdateTags:\s*\[[\s\S]*?\](?=\s*(?:followUpPrompts|progressiveInsightUpdates|gamePillData|$))/gi, '')
          // Remove gamePillData section (most complex - handles multi-line objects)
          .replace(/gamePillData:\s*\{[\s\S]*?\}(?=\s*$)/gi, '')
          // ✅ FIX: Remove any standalone brackets that might appear in the middle
          .replace(/^\s*[\]}]\s*$/gm, '')
          // Clean up any remaining JSON artifacts
          .replace(/\{[\s\S]*?"OTAKON_[A-Z_]+":[\s\S]*?\}/g, '')
          // ✅ Fix malformed bold markers (spaces between ** and text)
          .replace(/\*\*\s+([^*]+?)\s+\*\*/g, '**$1**') // Fix ** text ** → **text**
          .replace(/\*\*\s+([^*]+?):/g, '**$1:**') // Fix ** Header: → **Header:**
          // ✅ Format section headers (ONLY for structured responses like images)
          .replace(/^Hint:/i, '**Hint:**') // First Hint
          .replace(/\nHint:/gi, '\n\n**Hint:**') // Subsequent Hints
          .replace(/\nLore:/gi, '\n\n**Lore:**') // Lore sections
          .replace(/\nPlaces of Interest:/gi, '\n\n**Places of Interest:**') // Places
          .replace(/\nStrategy:/gi, '\n\n**Strategy:**') // Strategy
          // Remove excessive newlines (but keep double newlines for paragraphs)
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        
        // Parse wikiContent if it's a JSON string
        let gamePillData = structuredData.gamePillData;
        if (gamePillData && typeof gamePillData.wikiContent === 'string') {
          try {
            gamePillData = {
              ...gamePillData,
              wikiContent: JSON.parse(gamePillData.wikiContent)
            };
          } catch {
            // If parsing fails, keep it as is
            console.warn('Failed to parse wikiContent as JSON');
          }
        }
        
        // Build enhanced AIResponse
        const aiResponse: AIResponse = {
          content: cleanContent,
          suggestions: structuredData.followUpPrompts || [],
          otakonTags: new Map(), // Empty for JSON mode
          rawContent: rawResponse,
          metadata: {
            model: 'gemini-2.5-flash-preview-09-2025',
            timestamp: Date.now(),
            cost: 0,
            tokens: 0,
          },
          // Enhanced fields
          followUpPrompts: structuredData.followUpPrompts,
          progressiveInsightUpdates: structuredData.progressiveInsightUpdates,
          stateUpdateTags: structuredData.stateUpdateTags,
          gamePillData
        };
        
        cacheService.set(cacheKey, aiResponse, 60 * 60 * 1000).catch(err => console.warn(err));
        return aiResponse;
        
      } catch (jsonError) {
        console.warn('JSON mode failed, falling back to OTAKON_TAG parsing:', jsonError);
        
        // Fallback to regular OTAKON_TAG parsing
        let rawContent: string;

        if (USE_EDGE_FUNCTION) {
          // Use Edge Function for fallback
          const edgeResponse = await this.callEdgeFunction({
            prompt,
            temperature: 0.7,
            maxTokens: 2048,
            requestType: 'text',
            model: 'gemini-2.5-flash-preview-09-2025'
          });

          if (!edgeResponse.success) {
            throw new Error(edgeResponse.response || 'AI request failed');
          }

          rawContent = edgeResponse.response;
        } else {
          // Legacy: Direct API
          const result = await modelToUse.generateContent(prompt);
          
          // ✅ FIX 5: Check safety response in fallback
          const safetyCheck = this.checkSafetyResponse(result);
          if (!safetyCheck.safe) {
            toastService.error('Unable to generate response due to content policy');
            throw new Error(safetyCheck.reason);
          }
          
          rawContent = await result.response.text();
        }

        const { cleanContent, tags } = parseOtakonTags(rawContent);
        
        const aiResponse: AIResponse = {
          content: cleanContent,
          suggestions: tags.get('SUGGESTIONS') || [],
          otakonTags: tags,
          rawContent: rawContent,
          metadata: {
            model: 'gemini-2.5-flash-preview-09-2025',
            timestamp: Date.now(),
            cost: 0,
            tokens: 0,
          }
        };
        
        cacheService.set(cacheKey, aiResponse, 60 * 60 * 1000).catch(err => console.warn(err));
        return aiResponse;
      }
      
    } catch (error) {
      console.error("Structured AI Service Error:", error);
      
      // ✅ FIX 5: Enhanced error handling for safety blocks
      const errorMessage = (error as Error).message || '';
      if (errorMessage.includes('blocked') || errorMessage.includes('SAFETY') || errorMessage.includes('content policy')) {
        toastService.error('Your message contains inappropriate content');
        throw new Error('Content blocked by safety filters');
      }
      
      toastService.error('AI response failed. Please try again.');
      
      // Use error recovery
      const recoveryAction = await errorRecoveryService.handleAIError(
        error as Error,
        {
          operation: 'getChatResponseWithStructure',
          conversationId: conversation.id,
          userId: user.id,
          timestamp: Date.now(),
          retryCount: 0
        }
      );
      
      if (recoveryAction.type === 'retry') {
        return this.getChatResponseWithStructure(conversation, user, userMessage, isActiveSession, hasImages, imageData, abortSignal);
      } else if (recoveryAction.type === 'user_notification') {
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
      
      throw new Error("Failed to get structured response from AI service.");
    }
  }

  /**
   * Generates initial sub-tab content for a new game
   */
  public async generateInitialInsights(
    gameTitle: string, 
    genre: string,
    playerProfile?: PlayerProfile,
    conversationContext?: string // ✅ NEW: Actual conversation messages for context-aware generation
  ): Promise<Record<string, string>> {
    // ✅ CRITICAL: Use conversation context in cache key if provided
    const contextHash = conversationContext 
      ? conversationContext.substring(0, 50).replace(/[^a-z0-9]/gi, '') 
      : 'default';
    const cacheKey = `insights_${gameTitle.toLowerCase().replace(/\s+/g, '-')}_${contextHash}`;
    
    // Check cache first
    const cachedInsights = await cacheService.get<Record<string, string>>(cacheKey);
    if (cachedInsights) {
      return cachedInsights;
    }

    const config = insightTabsConfig[genre] || insightTabsConfig['Default'];
    const instructions = config
      .map(tab => `- ${tab.title} (${tab.id}): ${tab.instruction}`)
      .join('\n');

    // Get player profile context if available
    const profile = playerProfile || profileAwareTabService.getDefaultProfile();
    const profileContext = profileAwareTabService.buildProfileContext(profile);

    // ✅ CRITICAL: Include conversation context for relevant subtab generation
    const contextSection = conversationContext 
      ? `\nConversation Context:\n${conversationContext}\n\n✅ USE THIS CONTEXT to generate relevant subtab content based on what was discussed!\n` 
      : '';

    const prompt = `
You are a gaming assistant generating initial content for ${gameTitle} (${genre} game).

Player Profile:
${profileContext}
${contextSection}
Instructions for each tab:
${instructions}

CRITICAL FORMATTING RULES:
1. Return ONLY valid JSON, nothing else (no markdown fences, no explanations)
2. Use this exact format: {"tab_id": "content", "tab_id": "content"}
3. Each content value should be 2-4 detailed paragraphs (150-250 words per tab for comprehensive insights)
4. Keep content STRUCTURED and informative:
   - Use **bold** for key terms and important points
   - Use *italic* for emphasis
   - Use \\n\\n for paragraph breaks (double newline)
   - Escape ALL quotes with \\"
   - NO line breaks inside strings (use \\n instead)
   - Use bullet points with • for lists when appropriate
5. Content should be detailed, spoiler-free, and helpful for players at this stage
6. Adapt content style based on the Player Profile above
7. YOU MUST generate comprehensive content for ALL ${config.length} tab IDs listed below
8. Provide actionable advice, specific details, and contextual information

Example valid JSON (TARGET THIS LEVEL OF DETAIL):
{
  "story_so_far": "Following the disastrous **Konpeki Plaza heist**, you barely escaped with your life. The Relic, an advanced biochip containing the digital ghost of legendary rockerboy **Johnny Silverhand**, is now killing you from the inside. You have mere weeks to find a solution.\\n\\nYou've been working with **Takemura**, a disgraced Arasaka bodyguard seeking to clear his name and expose the conspiracy behind the assassination of his former boss. The investigation has led you through Night City's criminal underworld, uncovering corporate secrets and dangerous truths.\\n\\nYour current location in **Jig-Jig Street** suggests you're deep in the heart of Westbrook, a district known for high-end entertainment and corporate intrigue. Every decision matters as you race against time.",
  "quest_log": "**Main Quest: The Space in Between**\\nTakemura has information crucial to your survival. His message indicated urgency and possible security concerns. Meeting him could provide vital leads on removing the Relic or expose you to Arasaka operatives still hunting you both.\\n\\n**Recommended Side Activities:**\\n• Explore Jig-Jig Street for vendors offering rare cyberware upgrades\\n• Check nearby ripperdocs for health monitoring and neural optimization\\n• Investigate gig opportunities from local fixers to build street cred",
  "build_optimization": "Based on your current progress, consider these optimization strategies:\\n\\n**Cyberware Focus:** Invest in neural processors and reflex boosters to improve combat responsiveness. The **Sandevistan** operating system offers time dilation for tactical advantages during firefights.\\n\\n**Skill Synergies:** Balance Technical Ability for crafting legendary gear with Intelligence for quickhacking capabilities. This combination allows both direct combat and stealthy netrunning approaches.\\n\\n**Weapon Loadout:** Maintain variety - keep a silenced pistol for stealth, a tech weapon for cover penetration, and a power weapon for raw damage.",
  "boss_strategy": "Upcoming encounters in this arc will test your combat adaptability. **Tactical Recommendations:**\\n\\nYour opponents likely use advanced corporate-grade cyberware and coordinated tactics. Prioritize cover-based gameplay and use the environment to your advantage. Explosive barrels and electrical panels can turn the battlefield in your favor.\\n\\n**Key Strategies:**\\n• Maintain distance and use tech weapons to attack through walls\\n• Neutralize enemy netrunners first to prevent quickhacks\\n• Stock up on MaxDoc inhalers and bounce-back injectors\\n• Save frequently before major confrontations",
  "hidden_paths": "**Jig-Jig Street Secrets:**\\nLook for the **Clouds** entertainment establishment - there's a hidden databank terminal behind the reception desk containing valuable corporate intel. Access requires moderate Technical Ability or convincing dialogue options.\\n\\n**Exploration Tip:**\\nThe alleyways near the main street have vertical access points leading to rooftop areas. These elevated positions offer tactical advantages and often contain loot crates with rare crafting components. Watch for glowing yellow ledges indicating climbable surfaces."
}

NOW generate COMPREHENSIVE valid JSON for ALL these tab IDs (MUST include every single one): ${config.map(t => t.id).join(', ')}
`;

    try {
      let responseText: string;

      if (USE_EDGE_FUNCTION) {
        // Use Edge Function for insights generation
        const edgeResponse = await this.callEdgeFunction({
          prompt,
          temperature: 0.7,
          maxTokens: 5000, // ✅ Increased to 5000 to accommodate comprehensive 150-250 word insights per tab
          requestType: 'text',
          model: 'gemini-2.5-flash-preview-09-2025' // Back to Flash model
        });

        if (!edgeResponse.success) {
          throw new Error(edgeResponse.response || 'AI request failed');
        }

        responseText = edgeResponse.response;
      } else {
        // Legacy: Direct API
        const result = await this.proModel.generateContent(prompt);
        
        // ✅ FIX 6: Check safety response
        const safetyCheck = this.checkSafetyResponse(result);
        if (!safetyCheck.safe) {
          toastService.error('Unable to generate insights due to content policy');
          throw new Error(safetyCheck.reason);
        }

        responseText = await result.response.text();
      }
      
      const cleanedJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
      
      // ✅ FIX: Better JSON parsing with fallback
      let insights: Record<string, string>;
      try {
        insights = JSON.parse(cleanedJson);
      } catch (parseError) {
        console.error("JSON parse failed, attempting to fix malformed JSON:", parseError);
        console.error("Raw response (first 500 chars):", responseText.substring(0, 500));
        
        // Try to fix common JSON issues
        let fixedJson = cleanedJson;
        
        // ✅ IMPROVED: More robust unterminated string fixing
        // Step 1: Find the last complete property before truncation
        const lastCompleteProperty = fixedJson.lastIndexOf('",');
        if (lastCompleteProperty > 0 && !fixedJson.endsWith('}')) {
          // Truncate at last complete property and close JSON
          fixedJson = fixedJson.substring(0, lastCompleteProperty + 1) + '\n}';
          console.error("⚠️ Detected truncated response, using last complete property");
        } else {
          // Try pattern-based fixes
          // Fix unterminated strings by adding closing quote
          fixedJson = fixedJson.replace(/("(?:[^"\\]|\\.)*?)(?=\n\s*"[^"]+"\s*:|$)/gm, (match) => {
            if (!match.endsWith('"')) {
              return match + '"';
            }
            return match;
          });
          
          // Fix missing commas between properties
          fixedJson = fixedJson.replace(/"\s*\n\s*"/g, '",\n"');
          
          // Fix missing closing brace
          if (!fixedJson.endsWith('}')) {
            const openBraces = (fixedJson.match(/{/g) || []).length;
            const closeBraces = (fixedJson.match(/}/g) || []).length;
            for (let i = 0; i < openBraces - closeBraces; i++) {
              fixedJson += '\n}';
            }
          }
        }
        
        try {
          insights = JSON.parse(fixedJson);
          console.error("✅ Successfully fixed malformed JSON");
          console.error("✅ Recovered", Object.keys(insights).length, "insights");
          
          // ✅ NEW: If AI only returned some insights, generate fallback for missing ones
          const config = insightTabsConfig[genre] || insightTabsConfig['Default'];
          const missingTabs = config.filter(tab => !insights[tab.id]);
          if (missingTabs.length > 0) {
            console.error(`⚠️ AI only generated ${Object.keys(insights).length}/${config.length} insights, filling ${missingTabs.length} missing tabs with fallback`);
            missingTabs.forEach(tab => {
              insights[tab.id] = `Welcome to **${tab.title}** for ${gameTitle}!\n\nThis section will be populated as you explore and chat about the game.`;
            });
          }
        } catch (_secondError) {
          console.error("❌ Could not fix JSON, using fallback content for all tabs");
          console.error("❌ Raw response that failed (first 1000 chars):", responseText.substring(0, 1000));
          console.error("❌ This may be an AI generation issue - consider retrying or checking prompt");
          
          // Return generic welcome content for each tab
          const config = insightTabsConfig[genre] || insightTabsConfig['Default'];
          insights = config.reduce((acc, tab) => {
            acc[tab.id] = `Welcome to **${tab.title}** for ${gameTitle}!\n\nThis section will be populated as you explore and chat about the game.`;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Cache for 24 hours
      await cacheService.set(cacheKey, insights, 24 * 60 * 60 * 1000);
      return insights;

    } catch (error) {
      console.error("Failed to generate initial insights:", error);
      
      // ✅ FIX 6: Enhanced error handling for safety blocks
      const errorMessage = (error as Error).message || '';
      if (errorMessage.includes('blocked') || errorMessage.includes('SAFETY') || errorMessage.includes('content policy')) {
        toastService.warning('Unable to generate insights due to content policy');
        return {};
      }
      
      toastService.warning('Failed to generate game insights. You can still continue chatting!');
      return {};
    }
  }
}

export const aiService = new AIService();
