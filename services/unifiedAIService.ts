import { GoogleGenAI, GenerateContentResponse, Part, Content, Chat, Type } from "@google/genai";
import { ChatMessage, Conversation, GeminiModel, insightTabsConfig, PlayerProfile, GameContext, EnhancedInsightTab, DetectedTask, TaskCompletionPrompt, Insight } from "./types";
import { profileService } from "./profileService";
import { playerProfileService } from "./playerProfileService";
import { aiContextService } from "./aiContextService";
import { characterDetectionService } from "./characterDetectionService";
import { unifiedUsageService } from "./unifiedUsageService";
import { authService } from "./supabase";
import { apiCostService } from "./apiCostService";
import { feedbackLearningEngine } from "./feedbackLearningEngine";
import { supabaseDataService } from './supabaseDataService';
import { progressTrackingService } from './progressTrackingService';
import { longTermMemoryService } from './longTermMemoryService';
import { screenshotTimelineService } from './screenshotTimelineService';
import { ServiceFactory, BaseService } from './ServiceFactory';
import { STORAGE_KEYS } from '../utils/constants';
// Static imports to replace dynamic imports for Firebase hosting compatibility
import { progressiveInsightService } from './progressiveInsightService';
import { otakuDiaryService } from './otakuDiaryService';
import { taskCompletionPromptingService } from './taskCompletionPromptingService';
import { structuredResponseService } from './structuredResponseService';
// Additional imports from geminiService for enhanced functionality
import { dailyNewsCacheService } from './dailyNewsCacheService';
import { universalContentCacheService, type CacheQuery } from './universalContentCacheService';

/**
 * 🎯 UNIFIED AI SERVICE
 * 
 * This service consolidates all AI and insight functionality from:
 * - geminiService.ts (AI interactions)
 * - enhancedInsightService.ts (Enhanced insights)
 * - proactiveInsightService.ts (Proactive insights)
 * - profileAwareInsightService.ts (Profile-aware insights)
 * - suggestedPromptsService.ts (Suggested prompts)
 * - insightService.ts (Basic insights)
 * 
 * Features:
 * 1. Unified AI interactions with Gemini
 * 2. Intelligent insight generation
 * 3. Profile-aware recommendations
 * 4. Proactive insight suggestions
 * 5. Smart prompt suggestions
 * 6. Cost optimization strategies
 * 7. Context-aware responses
 */

// ===== AI SERVICE INTERFACES =====

export interface AIResponse {
  content: string;
  suggestions: string[];
  gameInfo?: {
    gameId: string;
    confidence: 'high' | 'low';
    progress?: number;
    genre?: string;
  };
  metadata: {
    model: GeminiModel;
    timestamp: number;
    cost: number;
    tokens: number;
  };
  suggestedTasks?: DetectedTask[]; // NEW: AI suggested tasks
  taskCompletionPrompt?: TaskCompletionPrompt; // NEW: Task completion prompt
}

// ===== UNIVERSAL AI RESPONSE INTERFACE (1:1 API Call Architecture) =====

export interface UniversalAIResponse {
  // The main chat response for the user
  narrativeResponse: string;
  
  // AI-suggested tasks (replaces secondary API call)
  suggestedTasks: DetectedTask[];
  
  // Progressive insight updates (replaces background call)
  progressiveInsightUpdates: {
    tabId: string;
    title: string;
    content: string;
  }[];
  
  // Game state changes detected from user query
  stateUpdateTags: string[];
  
  // Follow-up prompts for user engagement
  followUpPrompts: string[];
  
  // Game pill creation data (for Pro/Vanguard users)
  gamePillData?: {
    shouldCreate: boolean;
    gameName: string;
    genre: string;
    wikiContent: Record<string, string>;
  };
  
  // Task completion prompt data
  taskCompletionPrompt?: TaskCompletionPrompt;
  
  // Metadata for tracking
  metadata: {
    model: string;
    tokens: number;
    cost: number;
    timestamp: number;
  };
}

// NEW: Interface for detected tasks (moved to types.ts to break circular dependency)
// export interface DetectedTask {
//   title: string;
//   description: string;
//   category: 'quest' | 'boss' | 'exploration' | 'item' | 'character' | 'custom';
//   confidence: number;
//   source: string;
// }

export interface InsightResult {
  tabId: string;
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  isProfileSpecific: boolean;
  generationModel: 'flash' | 'pro';
  lastUpdated: number;
  category: 'enhanced' | 'proactive' | 'profile_aware' | 'basic';
}

export interface ProactiveTrigger {
  type: 'objective_complete' | 'inventory_change' | 'area_discovery' | 
        'session_start' | 'session_end' | 'progress_milestone' | 
        'difficulty_spike' | 'exploration_pattern';
  gameId: string;
  gameTitle: string;
  data: Record<string, any>;
  timestamp: number;
}

export interface ProactiveInsightSuggestion {
  id: string;
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  triggerType: ProactiveTrigger['type'];
  gameId: string;
  timestamp: number;
  metadata: Record<string, any>;
}

export interface PromptSuggestion {
  id: string;
  text: string;
  category: 'general' | 'game_specific' | 'contextual' | 'follow_up';
  priority: number;
  used: boolean;
  metadata: Record<string, any>;
}

export interface AIConfig {
  useProactiveInsights: boolean;
  useProfileAwareInsights: boolean;
  useEnhancedInsights: boolean;
  costOptimization: boolean;
  maxSuggestions: number;
  insightCacheEnabled: boolean;
}

// ===== UNIFIED AI SERVICE =====

// Constants from geminiService
const COOLDOWN_KEY = 'geminiCooldownEnd';
const NEWS_CACHE_KEY = 'otakonNewsCache';

// Helper functions from geminiService
const isQuotaError = (error: any): boolean => {
  const errorMessage = error.toString();
  const httpStatus = error.httpError?.status;
  return errorMessage.includes("RESOURCE_EXHAUSTED") || httpStatus === 429;
};

export class UnifiedAIService extends BaseService {
  private ai!: GoogleGenAI;
  private chatSessions: Record<string, { chat: Chat, model: GeminiModel }> = {};
  private config: AIConfig;
  private usedPrompts: Set<string> = new Set();
  private insightCache: Map<string, InsightResult[]> = new Map();
  private readonly COOLDOWN_DURATION = 60 * 60 * 1000; // 1 hour
  
  // ✅ MEMORY LEAK FIXES: Track resources for cleanup
  private intervals = new Set<NodeJS.Timeout>();
  private abortControllers = new Set<AbortController>();
  private eventListeners = new Map<string, () => void>();

  constructor() {
    super();
    
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
      console.warn("Gemini API Key not found. Please set the API_KEY environment variable.");
    }
    
    // Don't initialize AI immediately to avoid API key errors during static import
    // AI will be initialized lazily when first needed
    this.config = {
      useProactiveInsights: true,
      useProfileAwareInsights: true,
      useEnhancedInsights: true,
      costOptimization: true,
      maxSuggestions: 4,
      insightCacheEnabled: true
    };
    
    this.initialize();
  }

  private ensureAIInitialized(): void {
    if (!this.ai) {
      const API_KEY = (import.meta as any)?.env?.VITE_GEMINI_API_KEY || process.env.API_KEY;
      
      // Debug API key loading (only in development)
      if ((import.meta as any)?.env?.DEV) {
        console.log('🔧 AI Service Debug:', {
          viteKey: (import.meta as any)?.env?.VITE_GEMINI_API_KEY ? '✅ Set' : '❌ Missing',
          processKey: process.env.API_KEY ? '✅ Set' : '❌ Missing',
          finalKey: API_KEY ? '✅ Set' : '❌ Missing'
        });
      }
      
      if (!API_KEY) {
        console.warn("Gemini API Key not found. Please set the VITE_GEMINI_API_KEY environment variable.");
        return;
      }
      this.ai = new GoogleGenAI({ apiKey: API_KEY });
    }
  }

  // ===== INITIALIZATION =====

  private initialize(): void {
    this.loadUsedPrompts();
    this.loadInsightCache();
    console.log('✅ UnifiedAIService initialized successfully');
  }

  // ===== CORE AI METHODS =====

  async generateResponse(
    conversation: Conversation,
    message: string,
    hasImages: boolean = false,
    signal?: AbortSignal,
    conversationHistory: ChatMessage[] = []
  ): Promise<AIResponse & { progressiveUpdates?: Record<string, { title: string; content: string }> }> {
    try {
      // Check cooldown
      if (await this.checkCooldown()) {
        throw new Error('AI service is on cooldown. Please try again later.');
      }

      // NEW: Initialize long-term memory for this conversation
      await longTermMemoryService.initializeLongTermSession(conversation.id, conversation.id);
      
      // NEW: Track this interaction
      await longTermMemoryService.trackInteraction(conversation.id, 'message', { message });

      // Get optimal model
      const model = this.getOptimalModel('chat');
      
      // NEW: Get system instruction with long-term memory context
      const systemInstruction = await this.getLongTermAwareSystemInstruction(conversation, hasImages);
      
      // Prepare content
      const content = this.prepareContent(message, hasImages);
      
      // Generate response
      const response = await this.generateContent({
        model,
        contents: content,
        config: { systemInstruction },
        signal
      });

      // Process response
      const processedResponse = await this.processResponse(response, model);
      
      // NEW: Track response for long-term memory
      await longTermMemoryService.trackInteraction(conversation.id, 'insight', {
        type: 'ai_response',
        content: processedResponse.content,
        relevance: 1.0
      });
      
      // Update usage tracking
      await this.updateUsageTracking(processedResponse.metadata);

      // Generate progressive insight updates in the background (non-blocking)
      let progressiveUpdates: Record<string, { title: string; content: string }> = {};
      if (conversation.id !== 'everything-else' && conversation.insights) {
        try {
          // Using static import instead of dynamic import for Firebase hosting compatibility
          const progressiveContext = {
            gameName: conversation.title || 'Unknown Game',
            genre: conversation.genre || 'default',
            progress: conversation.progress || 0,
            userQuery: message,
            aiResponse: processedResponse.content,
            conversationHistory,
            currentInsightTabs: conversation.insights
          };

          // Run progressive updates in background (don't await to avoid blocking response)
          progressiveInsightService.updateInsightTabsProgressively(progressiveContext, signal)
            .then(result => {
              if (Object.keys(result.updatedTabs).length > 0) {
                console.log('🎯 Progressive insight updates generated:', result.relevantTabIds);
                // Store updates for later retrieval
                this.storeProgressiveUpdates(conversation.id, result.updatedTabs);
              }
            })
            .catch(error => {
              console.warn('Progressive insight updates failed:', error);
            });
        } catch (error) {
          console.warn('Failed to initiate progressive insight updates:', error);
        }
      }

      // NEW: Generate AI suggested tasks for Pro/Vanguard users
      let suggestedTasks: DetectedTask[] = [];
      if (conversation.id !== 'everything-else') {
        try {
          const userTier = await unifiedUsageService.getTier();
          if (userTier === 'pro' || userTier === 'vanguard_pro') {
            suggestedTasks = await this.generateSuggestedTasks(
              conversation,
              message,
              processedResponse.content,
              signal
            );
            console.log(`🎯 Generated ${suggestedTasks.length} AI suggested tasks for ${conversation.title}`);
          }
        } catch (error) {
          console.warn('Failed to generate suggested tasks:', error);
        }
      }

      // NEW: Generate task completion prompt
      let taskCompletionPrompt: TaskCompletionPrompt | undefined;
      if (conversation.id !== 'everything-else') {
        try {
          const userTier = await unifiedUsageService.getTier();
          
          // Get central tasks (user-created + AI-generated tasks they added)
          const centralTasks = await otakuDiaryService.getCentralTasks(conversation.id);
          
          // Get AI-generated tasks (for Pro/Vanguard users when no central tasks)
          const aiGeneratedTasks = await otakuDiaryService.getAISuggestedTasks(conversation.id);
          
          // Generate task completion prompt using static import
          taskCompletionPrompt = taskCompletionPromptingService.generateCompletionPrompt(
            conversation.id,
            userTier,
            centralTasks,
            aiGeneratedTasks
          ) || undefined;
          
          if (taskCompletionPrompt) {
            console.log(`📝 Generated task completion prompt for ${conversation.title}: ${taskCompletionPrompt.tasks.length} tasks`);
          }
        } catch (error) {
          console.warn('Failed to generate task completion prompt:', error);
        }
      }
      
      return { ...processedResponse, progressiveUpdates, suggestedTasks, taskCompletionPrompt };
    } catch (error) {
      console.error('Failed to generate AI response:', error);
      throw error;
    }
  }

  // ===== NEW: UNIVERSAL RESPONSE METHOD (1:1 API Call Architecture) =====

  /**
   * Generate a comprehensive AI response using a single API call
   * This method consolidates all AI functionality into one call to achieve 1:1 API call ratio
   */
  async generateUniversalResponse(
    conversation: Conversation,
    message: string,
    hasImages: boolean = false,
    signal?: AbortSignal,
    conversationHistory: ChatMessage[] = []
  ): Promise<UniversalAIResponse> {
    try {
      // Check if this is one of the 4 suggested prompts that should use cached responses
      const suggestedPrompts = [
        "What's the latest gaming news?",
        "Which games are releasing soon?", 
        "What are the latest game reviews?",
        "Show me the hottest new game trailers."
      ];
      
      const isSuggestedPrompt = suggestedPrompts.some(prompt => 
        message.toLowerCase().includes(prompt.toLowerCase())
      );
      
      if (isSuggestedPrompt) {
        console.log('📰 Detected suggested prompt, checking cache...');
        
        // Import the daily news cache service
        const { dailyNewsCacheService } = await import('./dailyNewsCacheService');
        
        // Check for cached response
        const cachedResponse = dailyNewsCacheService.getCachedResponse(message);
        if (cachedResponse) {
          console.log('📰 Serving cached response for suggested prompt');
          return {
            narrativeResponse: cachedResponse.content,
            suggestedTasks: [],
            progressiveInsightUpdates: [],
            stateUpdateTags: [],
            followUpPrompts: [
              "What's the latest gaming news?",
              "Which games are releasing soon?",
              "What are the latest game reviews?",
              "Show me the hottest new game trailers."
            ],
            gamePillData: null,
            taskCompletionPrompt: null,
            metadata: {
              model: 'gemini-2.5-flash',
              tokens: 0,
              cost: 0,
              timestamp: Date.now()
            }
          };
        }
        
        // If no cache, check if we can trigger grounding search
        const userTier = await unifiedUsageService.getTier();
        const searchCheck = await dailyNewsCacheService.needsGroundingSearch(message, userTier);
        
        if (!searchCheck.needsSearch) {
          console.log('📰 Cannot trigger grounding search:', searchCheck.reason);
          return {
            narrativeResponse: `I'd love to help you with that! However, ${searchCheck.reason.toLowerCase()}. Please try again later or consider upgrading to Pro/Vanguard for more frequent updates.`,
            suggestedTasks: [],
            progressiveInsightUpdates: [],
            stateUpdateTags: [],
            followUpPrompts: [
              "What's the latest gaming news?",
              "Which games are releasing soon?",
              "What are the latest game reviews?",
              "Show me the hottest new game trailers."
            ],
            gamePillData: null,
            taskCompletionPrompt: null,
            metadata: {
              model: 'gemini-2.5-flash',
              tokens: 0,
              cost: 0,
              timestamp: Date.now()
            }
          };
        }
        
        console.log('📰 Triggering grounding search for suggested prompt - will use grounding search in AI call');
      }

      // Check cooldown
      if (await this.checkCooldown()) {
        throw new Error('AI service is on cooldown. Please try again later.');
      }

      // Initialize long-term memory for this conversation
      await longTermMemoryService.initializeLongTermSession(conversation.id, conversation.id);
      
      // Track this interaction
      await longTermMemoryService.trackInteraction(conversation.id, 'message', { message });

      // Get optimal model
      const model = this.getOptimalModel('chat');
      
      // Get system instruction with long-term memory context
      let systemInstruction = await this.getUniversalSystemInstruction(conversation, hasImages, message, conversationHistory);
      
      // Add special instructions for suggested prompts with grounding search
      if (isSuggestedPrompt) {
        systemInstruction += `

**CRITICAL: SUGGESTED PROMPT WITH GROUNDING SEARCH**
You are responding to one of the 4 suggested prompts that requires real-time gaming news:
- "What's the latest gaming news?"
- "Which games are releasing soon?"
- "What are the latest game reviews?"
- "Show me the hottest new game trailers."

**MANDATORY REQUIREMENTS:**
1. **USE GROUNDING SEARCH**: You have access to Google Search. Use it to find the most recent, accurate gaming news.
2. **REAL-TIME DATA**: Focus on news from the last few days/weeks, not outdated information.
3. **COMPREHENSIVE RESPONSE**: Provide detailed, specific information about recent gaming developments.
4. **PROPER FORMATTING**: Use headers, bullet points, and clear sections for readability.
5. **CURRENT EVENTS**: Include specific game announcements, release dates, reviews, trailers, etc.

**RESPONSE STRUCTURE:**
- Start with a brief overview of the current gaming landscape
- Provide specific, recent news items with details
- Include relevant links or references when possible
- End with follow-up suggestions

**DO NOT:**
- Give generic responses about "gaming world buzzing"
- Use outdated information
- Provide vague answers
- Skip the grounding search - it's essential for accuracy`;
      }
      
      // Add structured formatting instructions based on player profile
      try {
        const playerProfile = await playerProfileService.getProfile();
        const gameContext = conversation.genre ? await playerProfileService.getGameContext(conversation.title || '') : null;

        if (playerProfile && gameContext) {
          const intent = structuredResponseService.analyzeUserIntent(
            message,
            conversationHistory.map(msg => msg.text),
            '', // lastGameId
            conversation.id
          );
          
          const formatting = structuredResponseService.generateResponseStructure(intent, playerProfile, gameContext);
          const formattingInstructions = structuredResponseService.generateFormattingInstructions(formatting, intent, playerProfile);
          
          // Append formatting instructions to system instruction
          systemInstruction += '\n\n' + formattingInstructions;
          
          console.log(`🎨 Applied structured formatting for ${intent} intent with ${playerProfile.hintStyle} style`);
        }
      } catch (error) {
        console.warn('Failed to apply structured formatting, using default:', error);
      }
      
      // Prepare content
      const content = this.prepareContent(message, hasImages);
      
      // Add grounding search tools for suggested prompts
      let tools: any[] = [];
      if (isSuggestedPrompt) {
        console.log('📰 Adding grounding search tools for suggested prompt');
        tools = [
          {
            googleSearchRetrieval: {
              dynamicRetrievalConfig: {
                mode: "MODE_DYNAMIC",
                dynamicThreshold: 0.7
              }
            }
          }
        ];
      }
      
      // Generate comprehensive response using single API call
      const response = await this.generateContent({
        model,
        contents: content,
        config: { 
          systemInstruction,
          responseMimeType: "application/json",
          tools: tools,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              narrativeResponse: { type: Type.STRING },
              suggestedTasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    category: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    source: { type: Type.STRING }
                  }
                }
              },
              progressiveInsightUpdates: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    tabId: { type: Type.STRING },
                    title: { type: Type.STRING },
                    content: { type: Type.STRING }
                  }
                }
              },
              stateUpdateTags: { type: Type.ARRAY, items: { type: Type.STRING }},
              followUpPrompts: { type: Type.ARRAY, items: { type: Type.STRING }},
              gamePillData: {
                type: Type.OBJECT,
                properties: {
                  shouldCreate: { type: Type.BOOLEAN },
                  gameName: { type: Type.STRING },
                  genre: { type: Type.STRING },
                  wikiContent: { 
                    type: Type.OBJECT,
                    properties: {
                      tabId: { type: Type.STRING },
                      content: { type: Type.STRING }
                    }
                  }
                }
              },
              taskCompletionPrompt: {
                type: Type.OBJECT,
                properties: {
                  tasks: { 
                    type: Type.ARRAY, 
                    items: { 
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        category: { type: Type.STRING },
                        status: { type: Type.STRING }
                      }
                    }
                  },
                  promptText: { type: Type.STRING },
                  category: { type: Type.STRING }
                }
              }
            },
            required: ["narrativeResponse", "suggestedTasks", "progressiveInsightUpdates", "stateUpdateTags", "followUpPrompts"]
          }
        }
      });

      // Parse the JSON response
      if (!response) {
        throw new Error("AI returned an empty response.");
      }
      
      // Parse JSON with robust error handling
      const universalResponse = this.parseUniversalResponseSafely(response, conversation.id, message.length, hasImages);
      if (!universalResponse) {
        throw new Error('Failed to parse universal response JSON');
      }

      // Add metadata
      universalResponse.metadata = {
        model: model as GeminiModel,
        tokens: 0, // Token count not available from string response
        cost: 0, // Cost calculation not available without token count
        timestamp: Date.now()
      };

      // Cache response for suggested prompts
      if (isSuggestedPrompt) {
        try {
          const { dailyNewsCacheService } = await import('./dailyNewsCacheService');
          const userTier = await unifiedUsageService.getTier();
          const userId = await authService.getCurrentUserId();
          
          await dailyNewsCacheService.cacheFreshResponse(
            message,
            universalResponse.narrativeResponse,
            userTier,
            userId
          );
          
          console.log('📰 Cached fresh response for suggested prompt');
        } catch (error) {
          console.warn('Failed to cache suggested prompt response:', error);
        }
      }

      // Track response for long-term memory
      await longTermMemoryService.trackInteraction(conversation.id, 'insight', {
        type: 'ai_response',
        content: universalResponse.narrativeResponse,
        relevance: 1.0
      });
      
      // Update usage tracking
      await this.updateUsageTracking({
        model: universalResponse.metadata.model as GeminiModel,
        tokens: universalResponse.metadata.tokens,
        cost: universalResponse.metadata.cost,
        timestamp: universalResponse.metadata.timestamp
      });

      // Handle progressive insight updates
      if (universalResponse.progressiveInsightUpdates.length > 0) {
        this.storeProgressiveUpdates(conversation.id, 
          universalResponse.progressiveInsightUpdates.reduce((acc, update) => {
            acc[update.tabId] = { title: update.title, content: update.content };
            return acc;
          }, {} as Record<string, { title: string; content: string }>)
        );
      }

      // Handle game pill creation for all users
      if (universalResponse.gamePillData?.shouldCreate) {
        console.log('🎮 [GamePill] AI requested game pill creation:', {
          gameName: universalResponse.gamePillData.gameName,
          genre: universalResponse.gamePillData.genre,
          conversationId: conversation.id,
          tabCount: Object.keys(universalResponse.gamePillData.wikiContent || {}).length,
          userTier: await unifiedUsageService.getTier()
        });
        await this.handleGamePillCreation(conversation, universalResponse.gamePillData, signal);
      } else if (universalResponse.gamePillData) {
        console.log('🚫 [GamePill] AI decided NOT to create game pill:', {
          shouldCreate: universalResponse.gamePillData.shouldCreate,
          conversationId: conversation.id,
          reason: conversation.id !== 'everything-else' ? 'Already in game-specific conversation' : 'AI decision'
        });
      } else {
        console.log('🔍 [GamePill] No game pill data in AI response for conversation:', conversation.id);
      }

      return universalResponse;
    } catch (error) {
      console.error('Universal Response System Debug:', {
        errorType: (error as Error).constructor.name,
        errorMessage: (error as Error).message,
        conversationId: conversation.id,
        hasImages,
        messageLength: message.length,
        conversationTitle: conversation.title,
        historyLength: conversationHistory.length
      });
      
      // Check for specific error types
      if ((error as Error).message.includes('cooldown')) {
        console.error('Universal response failed due to cooldown');
      } else if ((error as Error).message.includes('quota')) {
        console.error('Universal response failed due to quota exceeded');
      } else if ((error as Error).message.includes('JSON')) {
        console.error('Universal response failed due to JSON parsing');
      } else if ((error as Error).message.includes('abort')) {
        console.error('Universal response was aborted by user');
      } else {
        console.error('Universal response failed due to unknown error');
      }
      
      throw error;
    }
  }

  // ===== ROBUST JSON PARSING METHOD =====

  /**
   * Parse universal response JSON with robust error handling and cleaning
   */
  private parseUniversalResponseSafely(
    responseText: string, 
    conversationId: string, 
    messageLength: number, 
    hasImages: boolean
  ): UniversalAIResponse | null {
    try {
      // Clean the response text
      let cleanedText = responseText.trim();
      
      // Remove common JSON artifacts
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      
      // Remove any leading/trailing whitespace
      cleanedText = cleanedText.trim();
      
      // Check if response starts with JSON object
      if (!cleanedText.startsWith('{')) {
        console.error('Response does not start with JSON object:', {
          conversationId,
          responsePreview: cleanedText.substring(0, 200) + '...',
          originalLength: responseText.length,
          cleanedLength: cleanedText.length
        });
        return null;
      }
      
      // Parse JSON
      const parsed = JSON.parse(cleanedText);
      
      // Validate required fields
      if (!parsed.narrativeResponse) {
        console.warn('Universal response missing narrativeResponse, falling back to basic response', {
          conversationId,
          availableFields: Object.keys(parsed)
        });
        return null;
      }
      
      // Ensure arrays are properly initialized
      parsed.suggestedTasks = parsed.suggestedTasks || [];
      parsed.progressiveInsightUpdates = parsed.progressiveInsightUpdates || [];
      parsed.stateUpdateTags = parsed.stateUpdateTags || [];
      parsed.followUpPrompts = parsed.followUpPrompts || [];
      
      // Add default values for optional fields
      parsed.gamePillData = parsed.gamePillData || null;
      parsed.taskCompletionPrompt = parsed.taskCompletionPrompt || null;
      
      // Add default values for simplified task structure
      if (parsed.suggestedTasks && Array.isArray(parsed.suggestedTasks)) {
        parsed.suggestedTasks = parsed.suggestedTasks.map((task: any) => ({
          title: task.title || '',
          description: task.description || '',
          category: task.category || 'custom',
          confidence: task.confidence || 0.8,
          source: task.source || 'ai_generated'
        }));
      }
      
      return parsed as UniversalAIResponse;
    } catch (error) {
      console.error('JSON Parsing Failed:', {
        errorType: (error as Error).constructor.name,
        errorMessage: (error as Error).message,
        conversationId,
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 500) + '...',
        messageLength,
        hasImages,
        userTier: 'unknown' // Will be logged separately if needed
      });
      
      // Check for common JSON issues
      if (responseText.includes('```json')) {
        console.error('Response contains markdown code blocks - needs cleaning');
      }
      if (responseText.includes('```')) {
        console.error('Response contains code fences - needs cleaning');
      }
      if (!responseText.trim().startsWith('{')) {
        console.error('Response does not start with JSON object - may have prefix text');
      }
      
      return null;
    }
  }

  // ===== CORE AI METHODS FROM GEMINI SERVICE =====

  /**
   * Send message with streaming support (from geminiService)
   * This method maintains compatibility with useChat hook
   */
  async sendMessage(
    message: string,
    conversation: Conversation,
    signal: AbortSignal,
    onChunk: (chunk: string) => void,
    onError: (error: string) => void,
    history: ChatMessage[]
  ): Promise<void> {
    if (await this.checkCooldown()) {
      onError('AI service is on cooldown. Please try again later.');
      return;
    }
    
    // Check universal cache for similar queries
    try {
      const gameName = conversation.title || undefined;
      const genre = conversation.genre || undefined;
      
      const cacheResult = await this.checkAndCacheContent(
        message,
        'game_help',
        gameName,
        genre
      );
      
      if (cacheResult.found && cacheResult.content) {
        console.log(`🎯 Serving cached game help: ${cacheResult.reason}`);
        onChunk(cacheResult.content);
        return;
      }
    } catch (error) {
      console.warn('Cache check failed, proceeding with AI generation:', error);
    }
    
    try {
      const model = this.getOptimalModel('chat');
      const chat = await this.getOrCreateChat(conversation, false, model, history);

      const streamPromise = chat.sendMessageStream({ message });
      const abortPromise = new Promise<never>((_, reject) => {
        if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
      });

      const stream = await Promise.race([streamPromise, abortPromise]);
      if (signal.aborted) return;
      
      let fullResponse = '';
      await Promise.race([
        (async () => {
          for await (const chunk of stream) {
            if (signal.aborted) break;
            if (chunk.text) {
              fullResponse += chunk.text;
              onChunk(chunk.text);
            }
          }
        })(),
        abortPromise
      ]);
      
      // Track validation issues (placeholder for future feedback validation)
      let validationIssues: string[] = [];

      // Track AI response for learning
      if (fullResponse) {
        await this.trackAIResponse(conversation, message, fullResponse, false, validationIssues);
        
        // Detect progress from user message
        try {
          const userId = authService.getAuthState().user?.id;
          if (userId) {
            await this.detectProgressFromResponse(conversation, message, fullResponse, userId);
          }
        } catch (error) {
          console.warn('Progress detection failed:', error);
        }
        
        // Cache the generated content for future use
        try {
          const gameName = conversation.title || undefined;
          const genre = conversation.genre || undefined;
          
          await this.cacheGeneratedContent(
            message,
            fullResponse,
            'game_help',
            gameName,
            genre,
            model,
            0, // tokens - would need to be calculated
            0  // cost - would need to be calculated
          );
        } catch (error) {
          console.warn('Failed to cache generated content:', error);
        }
      }
      
      this.handleSuccess();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log("Stream was aborted by user.");
      } else {
        this.handleError(error, onError);
      }
    }
  }

  /**
   * Send message with images (from geminiService)
   */
  async sendMessageWithImages(
    prompt: string,
    images: Array<{ base64: string, mimeType: string }>,
    conversation: Conversation,
    signal: AbortSignal,
    onChunk: (chunk: string) => void,
    onError: (error: string) => void,
    history: ChatMessage[]
  ): Promise<void> {
    if (await this.checkCooldown()) {
      onError('AI service is on cooldown. Please try again later.');
      return;
    }
    
    try {
      const model = this.getOptimalModel('chat_with_images');
      const chat = await this.getOrCreateChat(conversation, true, model, history);

      const imageParts = images.map(image => ({
        inlineData: { data: image.base64, mimeType: image.mimeType }
      }));
      const textPart = { text: prompt };

      const streamPromise = chat.sendMessageStream({
        message: [...imageParts, textPart],
      });
      
      const abortPromise = new Promise<never>((_, reject) => {
        if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
      });

      const stream = await Promise.race([streamPromise, abortPromise]);
      if (signal.aborted) return;
      
      let fullResponse = '';
      await Promise.race([
        (async () => {
          for await (const chunk of stream) {
            if (signal.aborted) break;
            if (chunk.text) {
              fullResponse += chunk.text;
              onChunk(chunk.text);
            }
          }
        })(),
        abortPromise
      ]);
      
      // Track validation issues (placeholder for future feedback validation)
      let validationIssues: string[] = [];

      // Track AI response for learning
      if (fullResponse) {
        await this.trackAIResponse(conversation, prompt, fullResponse, true, validationIssues);
        
        // Detect progress from user message
        try {
          const userId = authService.getAuthState().user?.id;
          if (userId) {
            await this.detectProgressFromResponse(conversation, prompt, fullResponse, userId);
          }
        } catch (error) {
          console.warn('Progress detection failed:', error);
        }
        
        // Cache the generated content for future use
        try {
          const gameName = conversation.title || undefined;
          const genre = conversation.genre || undefined;
          
          await this.cacheGeneratedContent(
            prompt,
            fullResponse,
            'game_help',
            gameName,
            genre,
            model,
            0, // tokens - would need to be calculated
            0  // cost - would need to be calculated
          );
        } catch (error) {
          console.warn('Failed to cache generated content:', error);
        }
      }
      
      this.handleSuccess();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log("Stream was aborted by user.");
      } else {
        this.handleError(error, onError);
      }
    }
  }

  async generateInsight(
    gameName: string,
    genre: string,
    progress: number,
    instruction: string,
    insightId: string,
    onChunk?: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<InsightResult> {
    try {
      // Check cache first
      if (this.config.insightCacheEnabled) {
        const cached = this.getCachedInsight(gameName, insightId);
        if (cached) {
          return cached;
        }
      }

      // Get optimal model for insights
      const model = this.getOptimalModel('insight_generation');
      
      // Get system instruction
      const systemInstruction = this.getInsightSystemInstruction(gameName, genre, progress, instruction, insightId);
      
      // Check user tier for grounding search
      let tools: any[] = [];
      try {
        const userTier = await unifiedUsageService.getTier();
        if (userTier === 'pro' || userTier === 'vanguard_pro') {
          tools = [{ googleSearch: {} }];
        }
      } catch (error) {
        console.warn('Failed to get user tier for insight generation:', error);
      }

      // Generate insight
      const response = await this.generateContentStream({
        model,
        contents: `Generate the content for the "${insightId}" insight for the game ${gameName}, following the system instructions.`,
        config: { systemInstruction, tools },
        onChunk,
        signal
      });

      // Create insight result
      const insight: InsightResult = {
        tabId: insightId,
        title: this.extractTitleFromContent(response),
        content: response,
        priority: this.determinePriority(insightId, genre),
        isProfileSpecific: this.isProfileSpecific(insightId),
        generationModel: model.includes('flash') ? 'flash' : 'pro',
        lastUpdated: Date.now(),
        category: 'enhanced'
      };

      // Cache the insight
      if (this.config.insightCacheEnabled) {
        this.cacheInsight(gameName, insight);
      }

      return insight;
    } catch (error) {
      console.error('Failed to generate insight:', error);
      throw error;
    }
  }

  async generateUnifiedInsights(
    gameName: string,
    genre: string,
    progress: number,
    userQuery: string,
    signal?: AbortSignal
  ): Promise<Record<string, { title: string; content: string }> | null> {
    try {
      // Check cache first
      if (this.config.insightCacheEnabled) {
        const cacheKey = `insights_${gameName}_${genre}_${progress}`;
        const cached = this.getCachedInsights(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Filter tabs that don't require web search
      const tabsToGenerate = (insightTabsConfig[genre] || insightTabsConfig.default)
        .filter(tab => !tab.webSearch);
      
      if (tabsToGenerate.length === 0) {
        return null;
      }

      // Prepare properties for JSON response
      const properties: Record<string, any> = {};
      const propertyOrdering: string[] = [];

      tabsToGenerate.forEach(tab => {
        properties[tab.id] = {
          type: 'string',
          description: `Content for the ${tab.title} insight tab`
        };
        propertyOrdering.push(tab.id);
      });

      // Generate insights
      const response = await this.generateContent({
        model: this.getOptimalModel('insight_generation'),
        contents: `Generate insights for the game ${gameName} (${genre}, ${progress}% progress) based on the user query: "${userQuery}". Generate content for each insight tab.`,
        config: {
          systemInstruction: this.getUnifiedInsightSystemInstruction(gameName, genre, progress),
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties,
            required: propertyOrdering
          }
        },
        signal
      });

      // Parse and cache results
      const insights = JSON.parse(response);
      if (this.config.insightCacheEnabled) {
        this.cacheInsights(`insights_${gameName}_${genre}_${progress}`, insights);
      }

      return insights;
    } catch (error) {
      console.error('Failed to generate unified insights:', error);
      return null;
    }
  }

  // ===== PROACTIVE INSIGHTS =====

  async processProactiveTrigger(trigger: ProactiveTrigger): Promise<ProactiveInsightSuggestion[]> {
    if (!this.config.useProactiveInsights) {
      return [];
    }

    try {
      // Get player profile
      const profile = await this.getPlayerProfile(trigger.gameId);
      if (!profile) {
        return [];
      }

      // Get game context
      const gameContext = await this.getGameContext(trigger.gameId);
      if (!gameContext) {
        return [];
      }

      // Generate insights based on trigger type
      const insights = await this.generateInsightsForTrigger(trigger, profile, gameContext);
      
      return insights;
    } catch (error) {
      console.error('Failed to process proactive trigger:', error);
      return [];
    }
  }

  private async generateInsightsForTrigger(
    trigger: ProactiveTrigger,
    profile: PlayerProfile,
    gameContext: GameContext
  ): Promise<ProactiveInsightSuggestion[]> {
    const insights: ProactiveInsightSuggestion[] = [];
    
    switch (trigger.type) {
      case 'objective_complete':
        insights.push(...this.generateObjectiveCompleteInsights(trigger, profile, gameContext));
        break;
      case 'inventory_change':
        insights.push(...this.generateInventoryChangeInsights(trigger, profile, gameContext));
        break;
      case 'area_discovery':
        insights.push(...this.generateAreaDiscoveryInsights(trigger, profile, gameContext));
        break;
      case 'session_start':
        insights.push(...this.generateSessionStartInsights(trigger, profile, gameContext));
        break;
      case 'session_end':
        insights.push(...this.generateSessionEndInsights(trigger, profile, gameContext));
        break;
      case 'progress_milestone':
        insights.push(...this.generateProgressMilestoneInsights(trigger, profile, gameContext));
        break;
      case 'difficulty_spike':
        insights.push(...this.generateDifficultySpikeInsights(trigger, profile, gameContext));
        break;
      case 'exploration_pattern':
        insights.push(...this.generateExplorationPatternInsights(trigger, profile, gameContext));
        break;
    }
    
    return insights;
  }

  // ===== PROFILE-AWARE INSIGHTS =====

  async generateProfileAwareInsights(
    gameName: string,
    genre: string,
    progress: number,
    userQuery: string,
    signal?: AbortSignal
  ): Promise<InsightResult[]> {
    if (!this.config.useProfileAwareInsights) {
      return [];
    }

    try {
      // Get player profile
      const profile = await this.getPlayerProfile(gameName);
      if (!profile) {
        return [];
      }

      // Get game context
      const gameContext = await this.getGameContext(gameName);
      if (!gameContext) {
        return [];
      }

      // Generate profile-aware tabs
      const tabs = this.generateProfileAwareTabs(genre, profile, gameContext);
      
      // Generate insights for each tab
      const insights: InsightResult[] = [];
      for (const tab of tabs) {
        try {
          const insight = await this.generateInsight(
            gameName,
            genre,
            progress,
            tab.instruction || '',
            tab.id,
            undefined,
            signal
          );
          
          insights.push({
            ...insight,
            category: 'profile_aware',
            isProfileSpecific: true
          });
        } catch (error) {
          console.warn(`Failed to generate insight for tab ${tab.id}:`, error);
        }
      }

      return insights;
    } catch (error) {
      console.error('Failed to generate profile-aware insights:', error);
      return [];
    }
  }

  // ===== SUGGESTED PROMPTS =====

  async generateSuggestedPrompts(
    context: string,
    gameName?: string,
    maxPrompts: number = 4
  ): Promise<PromptSuggestion[]> {
    try {
      const prompts: PromptSuggestion[] = [];
      
      // Generate contextual prompts
      const contextualPrompts = this.generateContextualPrompts(context, gameName);
      prompts.push(...contextualPrompts);
      
      // Generate follow-up prompts
      const followUpPrompts = this.generateFollowUpPrompts(context);
      prompts.push(...followUpPrompts);
      
      // Filter out used prompts
      const availablePrompts = prompts.filter(p => !this.usedPrompts.has(p.text));
      
      // Sort by priority and return top prompts
      return availablePrompts
        .sort((a, b) => b.priority - a.priority)
        .slice(0, maxPrompts);
    } catch (error) {
      console.error('Failed to generate suggested prompts:', error);
      return [];
    }
  }

  markPromptAsUsed(prompt: string): void {
    this.usedPrompts.add(prompt);
    this.saveUsedPrompts();
  }

  isPromptUsed(prompt: string): boolean {
    return this.usedPrompts.has(prompt);
  }

  // ===== UTILITY METHODS =====

  private async checkCooldown(): Promise<boolean> {
    try {
      const cooldownEnd = localStorage.getItem('geminiCooldownEnd');
      if (cooldownEnd) {
        const endTime = parseInt(cooldownEnd);
        if (Date.now() < endTime) {
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  private getOptimalModel(task: 'chat' | 'chat_with_images' | 'insight_generation' | 'image_analysis'): GeminiModel {
    if (!this.config.costOptimization) {
      return 'gemini-2.5-pro';
    }

    // Cost optimization strategy
    switch (task) {
      case 'chat':
        return 'gemini-2.5-flash';
      case 'insight_generation':
        return 'gemini-2.5-flash';
      case 'image_analysis':
        return 'gemini-2.5-flash';
      default:
        return 'gemini-2.5-flash';
    }
  }

  private async getSystemInstruction(conversation: Conversation, hasImages: boolean): Promise<string> {
    const userFirstName = await profileService.getName();
    const baseDirectives = `You are Otakon, an AI gaming assistant. Address the user as ${userFirstName || 'friend'}.`;
    
    if (hasImages) {
      return this.getImageAnalysisSystemInstruction(baseDirectives);
    } else {
      return this.getChatSystemInstruction(baseDirectives);
    }
  }

  private getImageAnalysisSystemInstruction(baseDirectives: string): string {
    return `${baseDirectives}

**OTAKON MASTER PROMPT V19 - SCREENSHOT ANALYSIS**

Core Protocols & Tags (Execute ONE most relevant protocol per response):

* **Game Identification & Analysis (CRITICAL FIRST STEP):**
  * **Initial Visual Identification:** Analyze the image to form a hypothesis about the game's identity
  * **CRITICAL VERIFICATION VIA SEARCH:** Use search tool to confirm your hypothesis
  * **Verify Release Date:** Find the official release date to determine status
  * **Response Tags:** Your response MUST begin with:
    * \`[OTAKON_GAME_ID: The Full Name of the Game]\`
    * \`[OTAKON_CONFIDENCE: high|low]\`
  * **Then, based on verified release status:**
    * **If Released (and confidence is high):**
      * Include \`[OTAKON_GAME_PROGRESS: <number>]\`
      * Include \`[OTAKON_GENRE: <Primary Game Genre>]\`
    * **If Unreleased:**
      * Include \`[OTAKON_GAME_STATUS: unreleased]\`

* **Analysis & Assistance:**
  * Provide detailed analysis of what's shown in the screenshot
  * Offer helpful suggestions and tips
  * Answer any specific questions about the game

* **Formatting Rules:**
  * Use clear, engaging language
  * Include relevant game information
  * Provide actionable advice

* **Suggestions:**
  * End with \`[OTAKON_SUGGESTIONS: ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4"]]\`
  * Make suggestions inquisitive questions to guide the user`;
  }

  private getChatSystemInstruction(baseDirectives: string): string {
    return `${baseDirectives}

**OTAKON MASTER PROMPT V19 - CHAT ASSISTANCE**

Core Protocols:

* **Game Assistance:**
  * Provide helpful information about games
  * Offer tips, strategies, and insights
  * Answer questions about gameplay, mechanics, and lore

* **Formatting Rules:**
  * Use clear, engaging language
  * Include relevant information
  * Provide actionable advice

* **Suggestions:**
  * End with \`[OTAKON_SUGGESTIONS: ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4"]]\`
  * Make suggestions inquisitive questions to guide the user`;
  }

  private getInsightSystemInstruction(
    gameName: string,
    genre: string,
    progress: number,
    instruction: string,
    insightId: string
  ): string {
    return `You are generating insights for the game "${gameName}" (${genre}, ${progress}% progress).

**CRITICAL CONTENT RULES (Non-negotiable):**
1. **DETAIL AND DEPTH:** Generate detailed, wiki-style content that is comprehensive and thorough. Avoid short, superficial descriptions. Provide rich, useful information that adds significant value to the player's experience.
2. **WIKI-STYLE FORMATTING:** Structure content like a game wiki with clear sections, detailed explanations, and comprehensive coverage of all relevant aspects up to the current progress point.
3. **STRICT SPOILER-GATING:** All information provided MUST be relevant and accessible to a player who is ${progress}% through the game. You are strictly forbidden from mentioning, hinting at, or alluding to any characters, locations, items, or plot points that appear after this progress marker.
4. **COMPREHENSIVE COVERAGE:** Provide comprehensive information that covers ALL relevant aspects up to the current progress point. Don't hold back on details - the player has experienced everything up to ${progress}% and deserves full context and analysis.
5. **ACTIONABLE CONTENT:** Include specific, actionable advice, strategies, and information that the player can immediately use to enhance their gameplay experience.

**FORMATTING REQUIREMENTS:**
- Use clear Markdown headings (##, ###) to structure content
- Include bullet points and lists for better readability
- Content should be substantial (300-800 words) with detailed, actionable information
- Write in an informative, wiki-style tone that's both comprehensive and accessible

Insight ID: ${insightId}
Instruction: ${instruction}

Generate comprehensive, detailed wiki-style content that provides maximum value to the player at their current progress level.`;
  }

  private getUnifiedInsightSystemInstruction(
    gameName: string,
    genre: string,
    progress: number
  ): string {
    return `You are generating multiple insights for the game "${gameName}" (${genre}, ${progress}% progress).

**CRITICAL CONTENT RULES (Non-negotiable):**
1. **DETAIL AND DEPTH:** Each insight tab must contain detailed, wiki-style content that is comprehensive and thorough. Avoid short, superficial descriptions. Provide rich, useful information that adds significant value to the player's experience.
2. **WIKI-STYLE FORMATTING:** Structure content like a game wiki with clear sections, detailed explanations, and comprehensive coverage of all relevant aspects up to the current progress point.
3. **STRICT SPOILER-GATING:** All information provided MUST be relevant and accessible to a player who is ${progress}% through the game. You are strictly forbidden from mentioning, hinting at, or alluding to any characters, locations, items, or plot points that appear after this progress marker.
4. **COMPREHENSIVE COVERAGE:** For each tab, provide comprehensive information that covers ALL relevant aspects up to the current progress point. Don't hold back on details - the player has experienced everything up to ${progress}% and deserves full context and analysis.
5. **ACTIONABLE CONTENT:** Include specific, actionable advice, strategies, and information that the player can immediately use to enhance their gameplay experience.

**FORMATTING REQUIREMENTS:**
- Use clear Markdown headings (##, ###) to structure content
- Include bullet points and lists for better readability
- Each tab should be substantial (300-800 words) with detailed, actionable information
- Write in an informative, wiki-style tone that's both comprehensive and accessible

Generate comprehensive, detailed wiki-style content for each insight tab that provides maximum value to the player at their current progress level.`;
  }

  private prepareContent(message: string, hasImages: boolean): any {
    if (hasImages) {
      // Handle image content
      return message; // This would need to be processed for images
    } else {
      return message;
    }
  }

  private async generateContent(params: {
    model: GeminiModel;
    contents: any;
    config: any;
    signal?: AbortSignal;
  }): Promise<string> {
    const { model, contents, config, signal } = params;
    
    try {
      // Ensure AI is initialized before use
      this.ensureAIInitialized();
      
      if (!this.ai) {
        throw new Error('AI service not available: No API key provided');
      }

      const response = await this.ai.models.generateContent({
        model,
        contents,
        config
      });
      
      return response.text || '';
    } catch (error) {
      if (this.isQuotaError(error)) {
        await this.setCooldown();
        throw new Error('API quota exceeded. Please try again later.');
      }
      throw error;
    }
  }

  private async generateContentStream(params: {
    model: GeminiModel;
    contents: any;
    config: any;
    onChunk?: (chunk: string) => void;
    signal?: AbortSignal;
  }): Promise<string> {
    const { model, contents, config, onChunk, signal } = params;
    
    try {
      // Ensure AI is initialized before use
      this.ensureAIInitialized();
      
      if (!this.ai) {
        throw new Error('AI service not available: No API key provided');
      }

      const stream = await this.ai.models.generateContentStream({
        model,
        contents,
        config
      });
      
      let fullResponse = '';
      for await (const chunk of stream) {
        if (signal?.aborted) break;
        
        const text = chunk.text || '';
        fullResponse += text;
        onChunk?.(text);
      }
      
      return fullResponse;
    } catch (error) {
      if (this.isQuotaError(error)) {
        await this.setCooldown();
        throw new Error('API quota exceeded. Please try again later.');
      }
      throw error;
    }
  }

  private async processResponse(response: string, model: GeminiModel): Promise<AIResponse> {
    // Extract suggestions
    const suggestions = this.extractSuggestions(response);
    
    // Extract game info
    const gameInfo = this.extractGameInfo(response);
    
    // Clean response content
    const content = this.cleanResponseContent(response);
    
    return {
      content,
      suggestions,
      gameInfo,
      metadata: {
        model,
        timestamp: Date.now(),
        cost: this.calculateCost(model, content.length),
        tokens: this.estimateTokens(content)
      }
    };
  }

  private extractSuggestions(response: string): string[] {
    const suggestionsMatch = response.match(/\[OTAKON_SUGGESTIONS:\s*\[(.*?)\]\]/);
    if (suggestionsMatch) {
      try {
        const suggestionsArray = JSON.parse(`[${suggestionsMatch[1]}]`);
        return Array.isArray(suggestionsArray) ? suggestionsArray : [];
      } catch (error) {
        console.warn('Failed to parse suggestions:', error);
      }
    }
    return [];
  }

  private extractGameInfo(response: string): AIResponse['gameInfo'] {
    const gameIdMatch = response.match(/\[OTAKON_GAME_ID:\s*(.*?)\]/);
    const confidenceMatch = response.match(/\[OTAKON_CONFIDENCE:\s*(.*?)\]/);
    const progressMatch = response.match(/\[OTAKON_GAME_PROGRESS:\s*(.*?)\]/);
    const genreMatch = response.match(/\[OTAKON_GENRE:\s*(.*?)\]/);
    
    if (gameIdMatch && confidenceMatch) {
      return {
        gameId: gameIdMatch[1].trim(),
        confidence: confidenceMatch[1].trim() as 'high' | 'low',
        progress: progressMatch ? parseInt(progressMatch[1]) : undefined,
        genre: genreMatch ? genreMatch[1].trim() : undefined
      };
    }
    
    return undefined;
  }

  private cleanResponseContent(response: string): string {
    // Remove OTAKON tags
    return response
      .replace(/\[OTAKON_[^\]]*\]/g, '')
      .replace(/\[OTAKON_SUGGESTIONS:.*?\]/g, '')
      .trim();
  }

  private calculateCost(model: GeminiModel, contentLength: number): number {
    // Simplified cost calculation
    const tokens = this.estimateTokens(contentLength.toString());
    const costPerToken = model.includes('pro') ? 0.00001 : 0.000001;
    return tokens * costPerToken;
  }

  private estimateTokens(text: string | number): number {
    const textStr = text.toString();
    return Math.ceil(textStr.length / 4); // Rough estimation
  }

  private isQuotaError(error: any): boolean {
    const errorMessage = error.toString();
    const httpStatus = error.httpError?.status;
    return errorMessage.includes("RESOURCE_EXHAUSTED") || httpStatus === 429;
  }

  private async setCooldown(): Promise<void> {
    const cooldownEnd = Date.now() + this.COOLDOWN_DURATION;
    localStorage.setItem('geminiCooldownEnd', cooldownEnd.toString());
  }

  private async updateUsageTracking(metadata: AIResponse['metadata']): Promise<void> {
    try {
      await apiCostService.recordAPICall(
        metadata.model === 'gemini-2.5-pro' ? 'pro' : 'flash',
        'user_query',
        'paid', // This should be determined by user tier
        metadata.tokens,
        true,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        { cost: metadata.cost }
      );
    } catch (error) {
      console.warn('Failed to update usage tracking:', error);
    }
  }

  // ===== INSIGHT GENERATION HELPERS =====

  private extractTitleFromContent(content: string): string {
    // Extract title from content (first line or first sentence)
    const lines = content.split('\n');
    const firstLine = lines[0]?.trim();
    if (firstLine && firstLine.length < 100) {
      return firstLine;
    }
    
    const sentences = content.split('.');
    const firstSentence = sentences[0]?.trim();
    if (firstSentence && firstSentence.length < 100) {
      return firstSentence;
    }
    
    return 'Insight';
  }

  private determinePriority(insightId: string, genre: string): 'high' | 'medium' | 'low' {
    // Determine priority based on insight ID and genre
    const highPriorityInsights = ['strategy', 'tips', 'walkthrough'];
    const mediumPriorityInsights = ['lore', 'characters', 'items'];
    
    if (highPriorityInsights.some(id => insightId.includes(id))) {
      return 'high';
    } else if (mediumPriorityInsights.some(id => insightId.includes(id))) {
      return 'medium';
    }
    
    return 'low';
  }

  private isProfileSpecific(insightId: string): boolean {
    // Determine if insight is profile-specific
    const profileSpecificInsights = ['personalized', 'recommended', 'suggested'];
    return profileSpecificInsights.some(id => insightId.includes(id));
  }

  // ===== CACHING METHODS =====

  private getCachedInsight(gameName: string, insightId: string): InsightResult | null {
    const cacheKey = `${gameName}_${insightId}`;
    const cached = this.insightCache.get(cacheKey);
    if (cached && cached.length > 0) {
      return cached[0];
    }
    return null;
  }

  private getCachedInsights(cacheKey: string): Record<string, { title: string; content: string }> | null {
    // This would need to be implemented based on the cache structure
    return null;
  }

  private cacheInsight(gameName: string, insight: InsightResult): void {
    const cacheKey = `${gameName}_${insight.tabId}`;
    this.insightCache.set(cacheKey, [insight]);
    this.saveInsightCache();
  }

  private cacheInsights(cacheKey: string, insights: Record<string, { title: string; content: string }>): void {
    // This would need to be implemented based on the cache structure
  }

  private loadInsightCache(): void {
    try {
      const cached = localStorage.getItem('otakon_insight_cache');
      if (cached) {
        this.insightCache = new Map(JSON.parse(cached));
      }
    } catch (error) {
      console.warn('Failed to load insight cache:', error);
    }
  }

  private saveInsightCache(): void {
    try {
      const cacheArray = Array.from(this.insightCache.entries());
      localStorage.setItem('otakon_insight_cache', JSON.stringify(cacheArray));
    } catch (error) {
      console.warn('Failed to save insight cache:', error);
    }
  }

  // ===== PROMPT SUGGESTION HELPERS =====

  private generateContextualPrompts(context: string, gameName?: string): PromptSuggestion[] {
    const prompts: PromptSuggestion[] = [];
    
    if (gameName) {
      prompts.push({
        id: `game_${Date.now()}_1`,
        text: `Tell me more about ${gameName}`,
        category: 'game_specific',
        priority: 8,
        used: false,
        metadata: { gameName }
      });
      
      prompts.push({
        id: `game_${Date.now()}_2`,
        text: `What are some tips for ${gameName}?`,
        category: 'game_specific',
        priority: 7,
        used: false,
        metadata: { gameName }
      });
    }
    
    prompts.push({
      id: `context_${Date.now()}_1`,
      text: 'What should I do next?',
      category: 'contextual',
      priority: 6,
      used: false,
      metadata: { context }
    });
    
    return prompts;
  }

  private generateFollowUpPrompts(context: string): PromptSuggestion[] {
    return [
      {
        id: `followup_${Date.now()}_1`,
        text: 'Can you explain that in more detail?',
        category: 'follow_up',
        priority: 5,
        used: false,
        metadata: { context }
      },
      {
        id: `followup_${Date.now()}_2`,
        text: 'What are some alternatives?',
        category: 'follow_up',
        priority: 4,
        used: false,
        metadata: { context }
      }
    ];
  }

  private loadUsedPrompts(): void {
    try {
      const used = localStorage.getItem('otakon_used_prompts');
      if (used) {
        this.usedPrompts = new Set(JSON.parse(used));
      }
    } catch (error) {
      console.warn('Failed to load used prompts:', error);
    }
  }

  private saveUsedPrompts(): void {
    try {
      localStorage.setItem('otakon_used_prompts', JSON.stringify(Array.from(this.usedPrompts)));
    } catch (error) {
      console.warn('Failed to save used prompts:', error);
    }
  }

  // ===== PROACTIVE INSIGHT HELPERS =====

  private generateObjectiveCompleteInsights(
    trigger: ProactiveTrigger,
    profile: PlayerProfile,
    gameContext: GameContext
  ): ProactiveInsightSuggestion[] {
    return [{
      id: `objective_${Date.now()}`,
      title: 'Objective Complete!',
      content: `Great job completing that objective! Here are some suggestions for what to do next.`,
      priority: 'high',
      triggerType: 'objective_complete',
      gameId: trigger.gameId,
      timestamp: Date.now(),
      metadata: { objective: trigger.data }
    }];
  }

  private generateInventoryChangeInsights(
    trigger: ProactiveTrigger,
    profile: PlayerProfile,
    gameContext: GameContext
  ): ProactiveInsightSuggestion[] {
    return [{
      id: `inventory_${Date.now()}`,
      title: 'Inventory Updated',
      content: `Your inventory has changed. Here are some tips for managing your items.`,
      priority: 'medium',
      triggerType: 'inventory_change',
      gameId: trigger.gameId,
      timestamp: Date.now(),
      metadata: { inventory: trigger.data }
    }];
  }

  private generateAreaDiscoveryInsights(
    trigger: ProactiveTrigger,
    profile: PlayerProfile,
    gameContext: GameContext
  ): ProactiveInsightSuggestion[] {
    return [{
      id: `area_${Date.now()}`,
      title: 'New Area Discovered!',
      content: `You've discovered a new area! Here's what you should know about this location.`,
      priority: 'high',
      triggerType: 'area_discovery',
      gameId: trigger.gameId,
      timestamp: Date.now(),
      metadata: { area: trigger.data }
    }];
  }

  private generateSessionStartInsights(
    trigger: ProactiveTrigger,
    profile: PlayerProfile,
    gameContext: GameContext
  ): ProactiveInsightSuggestion[] {
    return [{
      id: `session_start_${Date.now()}`,
      title: 'Welcome Back!',
      content: `Welcome back to ${trigger.gameTitle}! Here's what you were working on.`,
      priority: 'medium',
      triggerType: 'session_start',
      gameId: trigger.gameId,
      timestamp: Date.now(),
      metadata: { session: trigger.data }
    }];
  }

  private generateSessionEndInsights(
    trigger: ProactiveTrigger,
    profile: PlayerProfile,
    gameContext: GameContext
  ): ProactiveInsightSuggestion[] {
    return [{
      id: `session_end_${Date.now()}`,
      title: 'Session Summary',
      content: `Great session! Here's a summary of what you accomplished.`,
      priority: 'low',
      triggerType: 'session_end',
      gameId: trigger.gameId,
      timestamp: Date.now(),
      metadata: { session: trigger.data }
    }];
  }

  private generateProgressMilestoneInsights(
    trigger: ProactiveTrigger,
    profile: PlayerProfile,
    gameContext: GameContext
  ): ProactiveInsightSuggestion[] {
    return [{
      id: `milestone_${Date.now()}`,
      title: 'Progress Milestone!',
      content: `Congratulations on reaching a progress milestone! Here's what's next.`,
      priority: 'high',
      triggerType: 'progress_milestone',
      gameId: trigger.gameId,
      timestamp: Date.now(),
      metadata: { milestone: trigger.data }
    }];
  }

  private generateDifficultySpikeInsights(
    trigger: ProactiveTrigger,
    profile: PlayerProfile,
    gameContext: GameContext
  ): ProactiveInsightSuggestion[] {
    return [{
      id: `difficulty_${Date.now()}`,
      title: 'Difficulty Spike Detected',
      content: `The game seems to be getting harder. Here are some strategies to help you through this challenge.`,
      priority: 'high',
      triggerType: 'difficulty_spike',
      gameId: trigger.gameId,
      timestamp: Date.now(),
      metadata: { difficulty: trigger.data }
    }];
  }

  private generateExplorationPatternInsights(
    trigger: ProactiveTrigger,
    profile: PlayerProfile,
    gameContext: GameContext
  ): ProactiveInsightSuggestion[] {
    return [{
      id: `exploration_${Date.now()}`,
      title: 'Exploration Pattern',
      content: `I've noticed your exploration pattern. Here are some suggestions for areas you might want to check out.`,
      priority: 'medium',
      triggerType: 'exploration_pattern',
      gameId: trigger.gameId,
      timestamp: Date.now(),
      metadata: { pattern: trigger.data }
    }];
  }

  // ===== PROFILE-AWARE INSIGHT HELPERS =====

  private generateProfileAwareTabs(
    genre: string,
    profile: PlayerProfile,
    gameContext: GameContext
  ): EnhancedInsightTab[] {
    const tabs: EnhancedInsightTab[] = [];
    
    // Generate tabs based on player profile and game context
    if (profile.preferences?.includes('strategy')) {
      tabs.push({
        id: 'strategy',
        title: 'Strategy Guide',
        instruction: 'Generate strategic advice based on the player\'s profile and current game context.',
        priority: 'high',
        playerFocus: [profile.playerFocus],
        hintStyle: [profile.hintStyle],
        isProfileSpecific: true
      });
    }
    
    if (profile.preferences?.includes('lore')) {
      tabs.push({
        id: 'lore',
        title: 'Lore & Story',
        instruction: 'Provide lore and story information relevant to the current game context.',
        priority: 'medium',
        playerFocus: [profile.playerFocus],
        hintStyle: [profile.hintStyle],
        isProfileSpecific: true
      });
    }
    
    return tabs;
  }

  // ===== DATA ACCESS HELPERS =====

  private async getPlayerProfile(gameId: string): Promise<PlayerProfile | null> {
    try {
      // This would need to be implemented based on the actual player profile service
      return null;
    } catch (error) {
      console.warn('Failed to get player profile:', error);
      return null;
    }
  }

  private async getGameContext(gameId: string): Promise<GameContext | null> {
    try {
      // This would need to be implemented based on the actual game context service
      return null;
    } catch (error) {
      console.warn('Failed to get game context:', error);
      return null;
    }
  }

  // ===== PUBLIC API =====

  updateConfig(config: Partial<AIConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AIConfig {
    return { ...this.config };
  }

  clearCache(): void {
    this.insightCache.clear();
    this.usedPrompts.clear();
    this.saveInsightCache();
    this.saveUsedPrompts();
  }

  // ===== PROGRESSIVE UPDATES =====

  private progressiveUpdates: Map<string, Record<string, { title: string; content: string }>> = new Map();

  private storeProgressiveUpdates(conversationId: string, updates: Record<string, { title: string; content: string }>): void {
    this.progressiveUpdates.set(conversationId, updates);
  }

  getProgressiveUpdates(conversationId: string): Record<string, { title: string; content: string }> | null {
    return this.progressiveUpdates.get(conversationId) || null;
  }

  clearProgressiveUpdates(conversationId: string): void {
    this.progressiveUpdates.delete(conversationId);
  }

  getCacheStats(): {
    insightCacheSize: number;
    usedPromptsSize: number;
    lastCleared: number;
  } {
    return {
      insightCacheSize: this.insightCache.size,
      usedPromptsSize: this.usedPrompts.size,
      lastCleared: Date.now()
    };
  }

  // ===== LONG-TERM MEMORY INTEGRATION =====

  // NEW: Get system instruction with long-term memory context
  private async getLongTermAwareSystemInstruction(
    conversation: Conversation,
    hasImages: boolean
  ): Promise<string> {
    // ✅ PERFORMANCE FIX: Parallel context fetching instead of sequential
    const [
      baseInstruction,
      longTermContext,
      screenshotTimelineContext,
      gameSpecificTimelineContext
    ] = await Promise.all([
      this.getSystemInstruction(conversation, hasImages),
      Promise.resolve(longTermMemoryService.getLongTermContext(conversation.id)),
      Promise.resolve(screenshotTimelineService.getTimelineContext(conversation.id)),
      Promise.resolve(conversation.title && conversation.title !== 'Everything Else' ?
        screenshotTimelineService.getGameSpecificTimelineContext(conversation.id, conversation.title) : '')
    ]);
    
    // NEW: Get insight tab context to prevent repetition
    const insightTabContext = this.getInsightTabContext(conversation);
    
    // NEW: Get context summarization
    const contextSummaryContext = this.getContextSummaryContext(conversation.id);
    
    // NEW: Get completed tasks context
    const completedTasksContext = await this.getCompletedTasksContext(conversation.id);
    
    const longTermAwareContext = `
  
**LONG-TERM MEMORY PROTOCOL:**
- This is a long-term gaming session that may span days, weeks, or months
- User may return after extended breaks (days/weeks) - maintain full context
- Build upon ALL previous interactions, not just recent ones
- Reference progress made across the entire session history
- Provide continuity and progression awareness
- If user returns after a long break, acknowledge the gap and provide context

**CONTINUITY REQUIREMENTS:**
- Always reference previous progress and achievements
- Build upon insights from previous sessions
- Maintain narrative continuity across time gaps
- Provide context for where the user left off
- Suggest next steps based on entire session history

**SCREENSHOT TIMELINE AWARENESS:**
- ALL screenshots (single and multi-shot) represent linear progression over time
- Single screenshots show current game state at a specific moment
- Multi-shot screenshots show progression over 5-minute windows
- Batch uploads show progression over extended time periods
- Always analyze screenshots as part of a chronological sequence
- Reference previous screenshots when providing context
- Understand that each screenshot builds upon the previous ones

**GAME SWITCHING AWARENESS:**
- When user uploads screenshots of different games, switch to that game's timeline
- Provide context specific to the current game being discussed
- Reference previous interactions with the same game
- Understand that game switches create new conversation contexts
- Maintain awareness of which game the user is currently playing

**INSIGHT TAB CONTEXT AWARENESS:**
- Be aware of existing insight tab content to avoid repetition
- When generating new insights, build upon existing content rather than duplicating
- Focus on complementary information that adds value to existing tabs
- Reference existing insights when providing context and continuity

**CONTEXT COMPRESSION AWARENESS:**
- Be aware that conversation history may be compressed and summarized
- Use context summaries to maintain continuity with previous sessions
- Build upon summarized information rather than asking for repetition
- Maintain narrative flow across compressed context boundaries

**COMPLETED TASKS AWARENESS:**
- Be aware of tasks the player has already completed
- Use completed task information to understand player progress
- Avoid suggesting tasks the player has already completed
- Reference completed tasks when providing context and continuity

${longTermContext}

${screenshotTimelineContext}

${gameSpecificTimelineContext}

${insightTabContext}

${contextSummaryContext}

${completedTasksContext}
`;
    
    return baseInstruction + longTermAwareContext;
  }

  // ===== NEW: UNIVERSAL SYSTEM INSTRUCTION (1:1 API Call Architecture) =====

  /**
   * Get comprehensive system instruction that instructs AI to perform all tasks in one call
   * This replaces multiple API calls with a single, structured response
   */
  private async getUniversalSystemInstruction(
    conversation: Conversation,
    hasImages: boolean,
    userMessage: string,
    conversationHistory: ChatMessage[]
  ): Promise<string> {
    // ✅ PERFORMANCE FIX: Parallel context fetching instead of sequential
    const [
      baseInstruction,
      completedTasksContext
    ] = await Promise.all([
      this.getSystemInstruction(conversation, hasImages),
      this.getCompletedTasksContext(conversation.id)
    ]);
    
    // Get all context sources (these are synchronous, so no need for Promise.all)
    const longTermContext = longTermMemoryService.getLongTermContext(conversation.id);
    const screenshotTimelineContext = screenshotTimelineService.getTimelineContext(conversation.id);
    const gameSpecificTimelineContext = conversation.title && conversation.title !== 'Everything Else' ?
      screenshotTimelineService.getGameSpecificTimelineContext(conversation.id, conversation.title) : '';
    const insightTabContext = this.getInsightTabContext(conversation);
    const contextSummaryContext = this.getContextSummaryContext(conversation.id);
    
    // Get user tier for Pro/Vanguard features
    const userTier = await unifiedUsageService.getTier();
    const isProUser = userTier === 'pro' || userTier === 'vanguard_pro';
    
    const universalInstruction = `

**CRITICAL OUTPUT REQUIREMENT:**
Your ENTIRE output MUST be a single, valid JSON object that strictly adheres to the following schema. Do not include any text, markdown, or code fences before or after the JSON object.

**OUTPUT SCHEMA:**
{
  "narrativeResponse": "string", // Your well-formatted, markdown chat response for the user. This is what they will read.
  "suggestedTasks": "DetectedTask[]", // An array of 2-3 actionable tasks based on the conversation. Use the rules from the PLAYER HISTORY section to make them relevant and non-repetitive. If no tasks are relevant, return an empty array [].
  "progressiveInsightUpdates": "InsightUpdate[]", // Analyze the conversation. If it provides new information that should update an existing insight tab (like 'story_so_far' or 'characters'), provide the updated content here. Only include tabs that need updating. If none, return an empty array [].
  "stateUpdateTags": "string[]", // Analyze the user's message for key game events. If they mention completing an objective, include "OBJECTIVE_COMPLETE: true". If they mention defeating a boss, include "TRIUMPH: <boss_name>".
  "followUpPrompts": "string[]", // Generate 3-4 engaging follow-up questions that are DIRECTLY RELATED to the content you just provided in your narrativeResponse. These should be specific, contextual questions that build upon the information you shared, not generic gaming questions. For example, if you discussed a specific game's mechanics, ask about related mechanics or strategies. If you mentioned specific games, ask about similar games or related topics. Make them feel like natural next steps in the conversation.
  "gamePillData": { // Available for all users when game pill should be created
    "shouldCreate": boolean, // Set to true when user needs help with a specific game and no game pill exists yet
    "gameName": string, // Extract from user message or identify from screenshot (e.g., "Elden Ring", "The Witcher 3")
    "genre": string, // Game genre (e.g., "Action RPG", "Strategy", "Platformer")
    "wikiContent": { "tabId": "content" } // Multiple insight tabs with comprehensive game information
  },
  "taskCompletionPrompt": { // Only if user has active tasks
    "tasks": [],
    "prompt": string,
    "category": string
  }
}

**TASK GENERATION RULES:**
1. **ACTIONABLE**: Generate 2-3 specific, actionable tasks
2. **PROGRESS-APPROPRIATE**: Tasks should match current game progress
3. **CONTEXT-AWARE**: Use player history to avoid repeating tasks
4. **NO SPOILERS**: Only tasks accessible at current progress level
5. **VARIETY**: Mix of quests, exploration, items, and character interactions
6. **INSIGHT-AWARE**: Don't suggest tasks already covered in insights
7. **COMPLETION-AWARE**: NEVER suggest tasks the player has already completed
8. **PROGRESSIVE**: Build upon completed tasks to suggest next logical steps

**FOLLOW-UP PROMPT GENERATION RULES:**
1. **CONTENT-SPECIFIC**: Questions must be directly related to the information you provided in your narrativeResponse
2. **CONTEXTUAL**: Build upon specific games, mechanics, or topics you mentioned
3. **NATURAL PROGRESSION**: Feel like logical next steps in the conversation
4. **ENGAGING**: Ask questions that encourage deeper exploration of the topic
5. **SPECIFIC**: Avoid generic gaming questions - be specific to the content discussed
6. **VARIED**: Mix different types of questions (how-to, comparisons, recommendations, etc.)
7. **RELEVANT**: Only ask questions that make sense given the conversation context
8. **ACTIONABLE**: Questions should lead to useful follow-up responses

**PROGRESSIVE INSIGHT UPDATES:**
- Only update insight tabs if the conversation provides NEW information
- Focus on tabs like 'story_so_far', 'characters', 'locations', 'items'
- Provide updated content that incorporates the new information
- Don't update tabs that don't need changes

**GAME PILL CREATION (All Users):**
**CURRENT CONVERSATION: "${conversation.id}"** ${conversation.id === 'everything-else' ? '(General chat - can create game pills)' : '(Game-specific conversation - do NOT create game pills)'}

- SET shouldCreate: true WHEN:
  • User asks for help with a specific game AND conversation.id is "everything-else"
  • User uploads a screenshot of a game AND asks for help AND conversation.id is "everything-else"
  • User uploads a screenshot of a game WITHOUT text AND conversation.id is "everything-else" (AI should identify game from image)
  • User mentions they're playing a specific game and need assistance AND conversation.id is "everything-else"
  • User asks questions like "help with [game name]" or "stuck in [game name]" AND conversation.id is "everything-else"
- SET shouldCreate: false WHEN:
  • conversation.id is NOT "everything-else" (game pill already exists for this game)
  • User is asking general gaming questions without mentioning a specific game
  • User is asking about non-gaming topics
- When shouldCreate is true:
  • Extract the game name from user's message OR identify it from the uploaded screenshot
  • If only screenshot is provided (no text), analyze the image to determine the game name
  • Determine the game genre (RPG, Action, Strategy, etc.)
  • Generate comprehensive wiki-like content for multiple insight tabs
  • Include tabs like: story_so_far, characters, locations, items, tips_and_tricks
  • NOTE: Free users get basic tabs, Pro/Vanguard users get rich content

**CONTEXT SOURCES:**
${longTermContext}
${screenshotTimelineContext}
${gameSpecificTimelineContext}
${insightTabContext}
${contextSummaryContext}
${completedTasksContext}

**USER TIER: ${userTier}** ${isProUser ? '(Pro/Vanguard features enabled)' : '(Free tier - basic features only)'}

Analyze the user's query and the full context provided, then perform all the requested tasks and populate the JSON object accordingly.
`;

    return baseInstruction + universalInstruction;
  }

  /**
   * Handle game pill creation for all users
   */
  private async handleGamePillCreation(
    conversation: Conversation,
    gamePillData: { shouldCreate: boolean; gameName: string; genre: string; wikiContent: Record<string, string> },
    signal?: AbortSignal
  ): Promise<void> {
    try {
      if (!gamePillData.shouldCreate) return;

      console.log(`🎮 Creating game pill for ${gamePillData.gameName} (${gamePillData.genre})`);
      
      // Update conversation with game pill data
      if (conversation.insights) {
        Object.assign(conversation.insights, gamePillData.wikiContent as unknown as Record<string, Insight>);
      } else {
        conversation.insights = gamePillData.wikiContent as unknown as Record<string, Insight>;
      }

      // Update conversation genre if not set
      if (!conversation.genre) {
        conversation.genre = gamePillData.genre;
      }

      console.log(`✅ Game pill created with ${Object.keys(gamePillData.wikiContent).length} insight tabs`);
    } catch (error) {
      console.warn('Failed to create game pill:', error);
    }
  }

  // NEW: Get insight tab context to prevent repetition
  public getInsightTabContext(conversation: Conversation): string {
    if (!conversation.insights || Object.keys(conversation.insights).length === 0) {
      return '';
    }

    const insightTabs = Object.entries(conversation.insights);
    let contextString = `
[META_INSIGHT_TABS_CONTEXT: The following insight tabs already exist with content - DO NOT regenerate similar content for these tabs:`;

    insightTabs.forEach(([tabId, insight]) => {
      if (insight && insight.content) {
        // Truncate content to avoid context bloat
        const truncatedContent = insight.content.length > 150 
          ? insight.content.substring(0, 150) + '...' 
          : insight.content;
        contextString += `
- ${tabId}: "${truncatedContent}"`;
      }
    });

    contextString += `
When generating new insights, avoid duplicating content from these existing tabs and focus on new, complementary information.]
`;

    return contextString;
  }

  // NEW: Get context summary context
  private getContextSummaryContext(conversationId: string): string {
    try {
      // Use dynamic import instead of require for browser compatibility
      import('./contextSummarizationService').then(({ contextSummarizationService }) => {
        return contextSummarizationService.getContextSummaryForAI(conversationId);
      }).catch(() => {
        return '';
      });
      return ''; // Return empty string immediately for now
    } catch (error) {
      console.warn('Context summarization service not available:', error);
      return '';
    }
  }

  // NEW: Get completed tasks context for AI awareness
  private async getCompletedTasksContext(conversationId: string): Promise<string> {
    try {
      // Using static import instead of dynamic import for Firebase hosting compatibility
      const tasks = await otakuDiaryService.getTasks(conversationId);
      const completedTasks = tasks.filter(task => task.status === 'completed');
      
      if (completedTasks.length === 0) {
        return '';
      }

      let contextString = `[META_COMPLETED_TASKS: Player has completed the following tasks - use this information to understand their progress and avoid suggesting similar tasks:\n`;
      
      completedTasks.forEach((task, index) => {
        const taskAge = Date.now() - (task.completedAt || task.createdAt);
        const ageInDays = Math.floor(taskAge / (24 * 60 * 60 * 1000));
        
        contextString += `${index + 1}. ${task.title} (${task.category}) - completed ${ageInDays} days ago\n`;
        if (task.description) {
          contextString += `   Details: ${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}\n`;
        }
      });
      
      contextString += `Use this information to provide context-aware responses and avoid suggesting tasks the player has already completed.]\n`;
      
      return contextString;
    } catch (error) {
      console.warn('Failed to get completed tasks context:', error);
      return '';
    }
  }

  // NEW: Generate AI suggested tasks based on conversation context
  public async generateSuggestedTasks(
    conversation: Conversation,
    userQuery: string,
    aiResponse: string,
    signal?: AbortSignal
  ): Promise<DetectedTask[]> {
    try {
      // Get context from various sources
      const longTermContext = longTermMemoryService.getLongTermContext(conversation.id);
      const screenshotTimelineContext = screenshotTimelineService.getTimelineContext(conversation.id);
      const insightTabContext = this.getInsightTabContext(conversation);
      const completedTasksContext = await this.getCompletedTasksContext(conversation.id);
      
      const systemInstruction = `
You are Otakon, a master game analyst. Generate actionable tasks based on the user's query, your response, and the player's history.

**CONTEXT:**
- Game: ${conversation.title}
- User Query: "${userQuery}"
- AI Response: "${aiResponse}"
- Current Progress: ${conversation.progress || 0}%

**PLAYER HISTORY:**
${longTermContext}
${screenshotTimelineContext}
${insightTabContext}
${completedTasksContext}

**TASK GENERATION RULES:**
1. **ACTIONABLE**: Generate 2-3 specific, actionable tasks
2. **PROGRESS-APPROPRIATE**: Tasks should match current game progress
3. **CONTEXT-AWARE**: Use player history to avoid repeating tasks
4. **NO SPOILERS**: Only tasks accessible at current progress level
5. **VARIETY**: Mix of quests, exploration, items, and character interactions
6. **INSIGHT-AWARE**: Don't suggest tasks already covered in insights
7. **COMPLETION-AWARE**: NEVER suggest tasks the player has already completed
8. **PROGRESSIVE**: Build upon completed tasks to suggest next logical steps

**OUTPUT FORMAT:**
Return a JSON array of tasks with:
- title: Short, clear task title
- description: Detailed task description
- category: quest|boss|exploration|item|character|custom
- confidence: 0.0-1.0
- source: "context_aware_ai"

**EXAMPLE:**
[
  {
    "title": "Find the Hidden Shrine",
    "description": "Explore the Whispering Caverns to locate the ancient shrine mentioned in the lore. Look for a waterfall that hides more than just a damp cave wall.",
    "category": "exploration",
    "confidence": 0.8,
    "source": "context_aware_ai"
  }
]
`;

      const response = await this.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate actionable tasks based on this conversation: "${userQuery}" -> "${aiResponse}"`,
        config: { systemInstruction },
        signal
      });

      // Parse and return tasks
      return this.parseSuggestedTasks(response);
    } catch (error) {
      console.error('Failed to generate suggested tasks:', error);
      return [];
    }
  }

  // NEW: Parse suggested tasks from AI response
  private parseSuggestedTasks(response: string): DetectedTask[] {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const tasks = JSON.parse(jsonMatch[0]);
        return tasks.filter((task: any) => 
          task.title && 
          task.description && 
          task.category && 
          typeof task.confidence === 'number'
        );
      }
      
      // Fallback: create tasks from response text
      return this.createFallbackTasks(response);
    } catch (error) {
      console.warn('Failed to parse suggested tasks, using fallback:', error);
      return this.createFallbackTasks(response);
    }
  }

  // NEW: Create fallback tasks from response text
  private createFallbackTasks(response: string): DetectedTask[] {
    const tasks: DetectedTask[] = [];
    
    // Simple pattern matching to extract tasks
    const lines = response.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      if (line.includes('•') || line.includes('-') || line.includes('*')) {
        const cleanLine = line.replace(/^[•\-*]\s*/, '').trim();
        if (cleanLine.length > 10) {
          tasks.push({
            title: cleanLine.substring(0, 50) + (cleanLine.length > 50 ? '...' : ''),
            description: cleanLine,
            category: 'custom',
            confidence: 0.6,
            source: 'fallback_parsing'
          });
        }
      }
    }
    
    return tasks.slice(0, 3); // Limit to 3 tasks
  }

  // ===== CLEANUP =====

  // ===== ENHANCED INSIGHT METHODS (from enhancedInsightService) =====
  
  getTabsForGenre(genre: string): EnhancedInsightTab[] {
    // Return default tabs for the genre
    const defaultTabs = insightTabsConfig[genre] || insightTabsConfig.default;
    return defaultTabs.map(tab => ({
      ...tab,
      lastUpdated: Date.now(),
      priority: 'medium' as const,
      playerFocus: [],
      hintStyle: [],
      isProfileSpecific: false
    }));
  }

  prioritizeTabsForProfile(tabs: EnhancedInsightTab[], profile: PlayerProfile): EnhancedInsightTab[] {
    // Simple prioritization based on profile preferences
    return tabs.sort((a, b) => {
      const aPriority = this.getTabPriorityForProfile(a, profile);
      const bPriority = this.getTabPriorityForProfile(b, profile);
      return bPriority - aPriority;
    });
  }

  private getTabPriorityForProfile(tab: EnhancedInsightTab, profile: PlayerProfile): number {
    let priority = tab.priority === 'high' ? 3 : tab.priority === 'medium' ? 2 : 1;
    
    // Boost priority for profile-specific tabs
    if (tab.isProfileSpecific) {
      priority += 1;
    }
    
    return priority;
  }

  needsContentGeneration(tabs: EnhancedInsightTab[]): boolean {
    return tabs.some(tab => !tab.content || tab.content === 'Content will be generated when you ask for help.');
  }

  getTabsForProModel(tabs: EnhancedInsightTab[], userTier: string): EnhancedInsightTab[] {
    if (userTier === 'free') return [];
    return tabs.filter(tab => tab.generationModel === 'pro');
  }

  generateInsightsForNewGamePill(
    gameName: string,
    genre: string,
    progress: number,
    userTier: string,
    profile: Promise<PlayerProfile>
  ): Promise<Record<string, InsightResult>> {
    return new Promise((resolve) => {
      // Return empty insights for now - will be generated on demand
      resolve({});
    });
  }

  updateInsightsForUserQuery(
    gameName: string,
    genre: string,
    progress: number,
    userQuery: string,
    userTier: string,
    profile: Promise<PlayerProfile>
  ): Promise<Record<string, InsightResult>> {
    return new Promise((resolve) => {
      // Return empty insights for now - will be generated on demand
      resolve({});
    });
  }

  // ===== PROACTIVE INSIGHT METHODS (from proactiveInsightService) =====
  
  getProactiveInsights(): any[] {
    // Return empty array for now
    return [];
  }

  markInsightAsRead(insightId: string): Promise<void> {
    return Promise.resolve();
  }

  deleteInsight(insightId: string): Promise<void> {
    return Promise.resolve();
  }

  // ===== HELPER METHODS FROM GEMINI SERVICE =====

  /**
   * Check and cache content using universal cache service (from geminiService)
   */
  private async checkAndCacheContent(
    query: string,
    contentType: CacheQuery['contentType'],
    gameName?: string,
    genre?: string
  ): Promise<{ found: boolean; content?: string; reason?: string }> {
    try {
      const userTier = await unifiedUsageService.getTier();
      
      const cacheQuery: CacheQuery = {
        query,
        contentType,
        gameName,
        genre,
        userTier
      };
      
      const cacheResult = await universalContentCacheService.getCachedContent(cacheQuery);
      
      if (cacheResult.found && cacheResult.content) {
        console.log(`🎯 Found cached ${contentType} content: ${query.substring(0, 50)}...`);
        return {
          found: true,
          content: cacheResult.content.content,
          reason: cacheResult.reason
        };
      }
      
      return { found: false };
    } catch (error) {
      console.warn('Failed to check universal cache:', error);
      return { found: false };
    }
  }

  /**
   * Cache content after AI generation (from geminiService)
   */
  private async cacheGeneratedContent(
    query: string,
    content: string,
    contentType: CacheQuery['contentType'],
    gameName?: string,
    genre?: string,
    model: string = 'gemini-2.5-flash',
    tokens: number = 0,
    cost: number = 0
  ): Promise<void> {
    try {
      const userTier = await unifiedUsageService.getTier();
      
      const cacheQuery: CacheQuery = {
        query,
        contentType,
        gameName,
        genre,
        userTier
      };
      
      await universalContentCacheService.cacheContent(cacheQuery, content, {
        model,
        tokens,
        cost,
        tags: [gameName, genre].filter(Boolean) as string[]
      });
      
      console.log(`💾 Cached ${contentType} content for future use`);
    } catch (error) {
      console.warn('Failed to cache generated content:', error);
    }
  }

  /**
   * Track AI response context for learning (from geminiService)
   */
  private async trackAIResponse(
    conversation: Conversation,
    userMessage: string,
    aiResponse: string,
    hasImages: boolean = false,
    validationIssues: string[] = []
  ): Promise<void> {
    try {
      const userId = authService.getAuthState().user?.id;
      if (!userId) return;

      // Analyze AI response context
      const aiContext = {
        response_length: aiResponse.length,
        has_code: aiResponse.includes('```') || aiResponse.includes('`'),
        has_images: hasImages,
        response_type: hasImages ? 'image_analysis' : 'text_response',
        conversation_id: conversation.id,
        game_genre: conversation.genre,
        user_progress: conversation.progress,
        validation_issues: validationIssues,
        has_validation_issues: validationIssues.length > 0
      };

      // Get user context
      const userContext = {
        user_tier: unifiedUsageService.getTier(),
        game_genre: conversation.genre,
        user_progress: conversation.progress,
        conversation_title: conversation.title
      };

      // Store for potential feedback analysis
      await aiContextService.storeUserContext('behavior', {
        last_ai_response: aiContext,
        last_user_message: userMessage,
        timestamp: Date.now()
      });

      // Track user behavior
      await aiContextService.trackUserBehavior(
        'ai_interaction',
        {
          message_type: hasImages ? 'image' : 'text',
          conversation_id: conversation.id,
          game_title: conversation.title
        },
        {
          ai_response_length: aiResponse.length,
          has_images: hasImages
        }
      );
    } catch (error) {
      console.warn('Failed to track AI response:', error);
    }
  }

  /**
   * Progress detection from AI responses (from geminiService)
   */
  async detectProgressFromResponse(
    conversation: Conversation,
    userMessage: string,
    aiResponse: string,
    userId: string
  ): Promise<void> {
    console.log('🤖 Gemini AI: Analyzing message for progress detection', {
      conversationTitle: conversation.title,
      userMessage,
      userId
    });
    
    try {
      // Simple progress detection based on common gaming phrases
      const progressIndicators = [
        { phrase: 'defeated', eventType: 'boss_defeat', confidence: 0.7 },
        { phrase: 'completed', eventType: 'quest_completion', confidence: 0.8 },
        { phrase: 'found', eventType: 'item_acquisition', confidence: 0.6 },
        { phrase: 'discovered', eventType: 'location_discovery', confidence: 0.7 },
        { phrase: 'reached', eventType: 'story_progression', confidence: 0.6 },
        { phrase: 'unlocked', eventType: 'story_progression', confidence: 0.8 }
      ];

      for (const indicator of progressIndicators) {
        if (userMessage.toLowerCase().includes(indicator.phrase.toLowerCase())) {
          // Extract game ID from conversation title or context
          const gameId = conversation.title.toLowerCase().includes('elden ring') ? 'elden_ring' :
                        conversation.title.toLowerCase().includes('cyberpunk') ? 'cyberpunk_2077' :
                        conversation.title.toLowerCase().includes('zelda') ? 'zelda_tears_kingdom' :
                        conversation.title.toLowerCase().includes('baldurs') ? 'baldurs_gate_3' : 'unknown';

          if (gameId !== 'unknown') {
            // Using static import instead of dynamic import for Firebase hosting compatibility
            await progressTrackingService.updateProgressForAnyGame(
              userId,
              gameId,
              indicator.eventType,
              `AI-detected ${indicator.eventType} from user message`,
              3, // Default progress level
              'base_game',
              indicator.confidence,
              'Progress detected from user message',
              [userMessage]
            );
          }
          break; // Only detect one progress event per message
        }
      }
    } catch (error) {
      console.warn('Progress detection failed:', error);
    }
  }

  /**
   * Handle success after API call (from geminiService)
   */
  private async handleSuccess(): Promise<void> {
    try {
      // Clear cooldown in Supabase
      await supabaseDataService.setAppCache('geminiCooldown', null, new Date(0).toISOString());
      
      // Also clear localStorage as backup
      const cooldownEnd = localStorage.getItem(COOLDOWN_KEY);
      if (cooldownEnd) {
        console.log("API call successful, clearing cooldown.");
        localStorage.removeItem(COOLDOWN_KEY);
      }
    } catch (error) {
      console.warn('Failed to clear cooldown in Supabase, using localStorage only:', error);
      
      // Fallback to localStorage only
      const cooldownEnd = localStorage.getItem(COOLDOWN_KEY);
      if (cooldownEnd) {
        console.log("API call successful, clearing cooldown (localStorage fallback).");
        localStorage.removeItem(COOLDOWN_KEY);
      }
    }
  }

  /**
   * Handle errors from API calls (from geminiService)
   */
  private handleError(error: any, onError: (error: string) => void): void {
    console.error("Gemini Service Error Details:", error);

    const errorMessage = error?.message || error.toString();
    if (error?.httpError?.status === 0 || errorMessage.includes('status code: 0')) {
      onError("I couldn't reach the network. This can happen if the screen is locked and the device is saving power. Waking the screen and trying again usually helps.");
      return;
    }
    
    if (isQuotaError(error)) {
      onError("QUOTA_EXCEEDED");
      return;
    }

    // Handle 503 Service Unavailable / Model Overloaded errors
    if (error?.httpError?.status === 503 || errorMessage.includes('503') || 
        errorMessage.includes('overloaded') || errorMessage.includes('UNAVAILABLE')) {
      onError("The AI is currently experiencing high traffic and is temporarily unavailable. Please wait a moment and try again. This usually resolves within a few minutes.");
      return;
    }

    let message = "An unknown error occurred while contacting the AI.";
    if (error instanceof Error) {
      if (error.message.includes('API key not valid')) {
        message = "Error: The provided API Key is not valid. Please check your configuration.";
      } else {
        try {
          // The error message from Gemini is often a JSON string itself
          const parsedError = JSON.parse(error.message);
          if (parsedError.error && parsedError.error.message) {
            // Handle 503 errors from parsed JSON
            if (parsedError.error.code === 503 || parsedError.error.status === 'UNAVAILABLE') {
              message = "The AI is currently experiencing high traffic and is temporarily unavailable. Please wait a moment and try again. This usually resolves within a few minutes.";
            } else {
              message = `Error: ${parsedError.error.message}`;
            }
          }
        } catch (e) {
          // Fallback if the message is not JSON
          message = `Error: ${error.message}`;
        }
      }
    }
    onError(message);
  }

  /**
   * Get or create chat session (from geminiService)
   */
  private async getOrCreateChat(
    conversation: Conversation, 
    hasImages: boolean, 
    model: GeminiModel, 
    history: ChatMessage[] = []
  ): Promise<Chat> {
    const conversationId = conversation.id;
    const existingSession = this.chatSessions[conversationId];
    if (existingSession && existingSession.model === model) {
      return existingSession.chat;
    }

    if (existingSession && existingSession.model !== model) {
      console.log(`Model switch for ${conversationId}. Recreating chat from ${existingSession.model} to ${model}.`);
      delete this.chatSessions[conversationId];
    }
    
    console.log(`Creating new chat session for ${conversationId} with model ${model} and ${history.length} history messages.`);
    const geminiHistory = await this.mapMessagesToGeminiContent(history);
    
    const systemInstruction = await this.getSystemInstruction(conversation, hasImages);
    
    this.ensureAIInitialized();
    if (!this.ai) {
      throw new Error('AI service not available: No API key provided');
    }

    const newChat = this.ai.chats.create({
      model,
      history: geminiHistory,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }]
      }
    });
    this.chatSessions[conversationId] = { chat: newChat, model };
    return newChat;
  }

  /**
   * Map messages to Gemini content format (from geminiService)
   */
  private async mapMessagesToGeminiContent(messages: ChatMessage[]): Promise<Content[]> {
    const history: Content[] = [];
    
    // NEW: Apply context compression and summarization
    let processedMessages = messages;
    
    // Import context summarization service dynamically to avoid circular dependencies
    let contextSummarizationService: any = null;
    try {
      // Use dynamic import instead of require for better compatibility
      const module = await import('./contextSummarizationService');
      contextSummarizationService = module.contextSummarizationService;
    } catch (error) {
      console.warn('Context summarization service not available:', error);
    }
    
    // Apply compression if we have many messages
    if (messages.length > 20 && contextSummarizationService) {
      const compressionResult = contextSummarizationService.compressConversationHistory(
        'current-conversation', // We'll pass the actual conversation ID later
        messages,
        20
      );
      
      processedMessages = compressionResult.compressedMessages;
      
      // Add summary as a system message if we have one
      if (compressionResult.summary) {
        history.push({
          role: 'model',
          parts: [{ text: `[CONTEXT_SUMMARY] ${compressionResult.summary.summary}` }]
        });
      }
      
      console.log(`📊 Context Compression: ${compressionResult.originalCount} → ${compressionResult.compressedCount} messages (${Math.round(compressionResult.compressionRatio * 100)}% retained)`);
    } else {
      // Apply simple limits if no compression
      processedMessages = messages.slice(-20);
    }
    
    let totalImages = 0;
    let estimatedTokens = 0;
    
    console.log(`📊 Context Management: Processing ${processedMessages.length} messages (limited from ${messages.length})`);
    
    for (const message of processedMessages) {
      const parts: Part[] = [];
      if (message.role !== 'user' && message.role !== 'model') continue;
      
      // NEW: Limit images in context
      if (message.images && message.images.length > 0) {
        const imagesToInclude = Math.min(message.images.length, 10 - totalImages);
        if (imagesToInclude <= 0) {
          console.log(`📊 Context Management: Skipping ${message.images.length} images (limit reached)`);
          continue;
        }
        
        for (let i = 0; i < imagesToInclude; i++) {
          const imageUrl = message.images[i];
          try {
            const [meta, base64] = imageUrl.split(',');
            if (!meta || !base64) continue;
            const mimeTypeMatch = meta.match(/:(.*?);/);
            if (!mimeTypeMatch?.[1]) continue;
            parts.push({ inlineData: { data: base64, mimeType: mimeTypeMatch[1] } });
            totalImages++;
            estimatedTokens += 1000; // Approximate tokens per image
          } catch (e) {
            console.error("Skipping malformed image in history", e);
            continue;
          }
        }
      }
      
      if (message.text) {
        // NEW: Estimate text tokens and limit if necessary
        const textTokens = Math.ceil(message.text.length / 4); // Rough estimate: 4 chars = 1 token
        estimatedTokens += textTokens;
        
        if (estimatedTokens > 30000) {
          console.log(`📊 Context Management: Token limit reached (${estimatedTokens}), truncating text`);
          const remainingTokens = 30000 - (estimatedTokens - textTokens);
          const truncatedText = message.text.substring(0, remainingTokens * 4);
          parts.push({ text: truncatedText + "... [Context truncated]" });
          break; // Stop processing more messages
        } else {
          parts.push({ text: message.text });
        }
      }
      
      if (parts.length > 0) {
        const lastRole = history.length > 0 ? history[history.length - 1].role : undefined;
        if (lastRole === message.role) {
          console.warn(`Skipping message with duplicate consecutive role: ${message.role}`);
          continue;
        }
        history.push({ role: message.role, parts });
      }
    }
    
    console.log(`📊 Context Management: Final context - ${history.length} messages, ${totalImages} images, ~${estimatedTokens} tokens`);
    return history;
  }

  /**
   * Reset chat sessions (from geminiService)
   */
  resetChat(): void {
    console.log("Resetting all chat sessions.");
    for (const key in this.chatSessions) {
      delete this.chatSessions[key];
    }
  }

  /**
   * Check if chat is active (from geminiService)
   */
  isChatActive(conversationId: string): boolean {
    return !!this.chatSessions[conversationId];
  }

  /**
   * Rename chat session (from geminiService)
   */
  renameChatSession(oldId: string, newId: string): void {
    if (this.chatSessions[oldId] && !this.chatSessions[newId]) {
      console.log(`Moving chat session context from '${oldId}' to '${newId}'.`);
      this.chatSessions[newId] = this.chatSessions[oldId];
      delete this.chatSessions[oldId];
    } else if (this.chatSessions[oldId] && this.chatSessions[newId]) {
      console.warn(`Cannot rename chat session: destination '${newId}' already exists. Context will not be moved.`);
    } else if (!this.chatSessions[oldId]) {
      console.warn(`Cannot rename chat session: source '${oldId}' does not exist.`);
    }
  }

  /**
   * Generate initial pro hint (from geminiService)
   */
  async generateInitialProHint(
    prompt: string,
    images: Array<{ base64: string; mimeType: string; }> | null,
    conversation: Conversation,
    history: ChatMessage[],
    onError: (error: string) => void,
    signal: AbortSignal
  ): Promise<string | null> {
    if (await this.checkCooldown()) {
      onError('AI service is on cooldown. Please try again later.');
      return null;
    }

    const parts: Part[] = [];
    const hasImages = images && images.length > 0;
    if (hasImages) {
      images.forEach(image => {
        parts.push({ inlineData: { data: image.base64, mimeType: image.mimeType } });
      });
    }
    parts.push({ text: prompt });
    
    const geminiHistory = await this.mapMessagesToGeminiContent(history);

    try {
      const modelToUse: GeminiModel = 'gemini-2.5-flash';
      
      const systemInstruction = await this.getSystemInstruction(conversation, hasImages || false);
      
      this.ensureAIInitialized();
      if (!this.ai) {
        throw new Error('AI service not available: No API key provided');
      }

      const generateContentPromise = this.ai.models.generateContent({
        model: modelToUse,
        contents: [...geminiHistory, { role: 'user', parts }],
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }]
        },
      });

      const abortPromise = new Promise<never>((_, reject) => {
        if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
      });
      
      const response = await Promise.race([generateContentPromise, abortPromise]);
      
      if (signal.aborted) return null;

      this.handleSuccess();
      return response.text || '';

    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log("Initial pro hint generation was aborted.");
      } else {
        this.handleError(error, onError);
      }
      return null;
    }
  }

  /**
   * Generate insight with search (from geminiService)
   */
  async generateInsightWithSearch(
    prompt: string,
    model: 'flash' | 'pro' = 'flash',
    signal?: AbortSignal
  ): Promise<string> {
    // Determine which model to use based on the model parameter
    const modelName = model === 'pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    
    // For cost optimization, always use Flash unless explicitly requested Pro
    const finalModel = model === 'pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    
    console.log(`🔍 Generating insight with ${finalModel} model (requested: ${model})`);

    try {
      this.ensureAIInitialized();
      if (!this.ai) {
        throw new Error('AI service not available: No API key provided');
      }

      const generateContentPromise = this.ai.models.generateContent({
        model: finalModel,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      // Handle abort if signal is provided
      if (signal) {
        const abortPromise = new Promise<never>((_, reject) => {
          if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
          signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
        });

        const response = await Promise.race([generateContentPromise, abortPromise]);
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        
        this.handleSuccess();
        
        // Track API cost
        apiCostService.recordAPICall(
          model,
          'user_query', // Default purpose, can be overridden
          'paid', // Default tier, can be overridden
          1000, // Default token estimate
          true
        ).catch(error => console.error('Error tracking API cost:', error));
        
        return response.text || '';
      } else {
        // No signal provided, just generate content
        const response = await generateContentPromise;
        this.handleSuccess();
        
        // Track API cost
        apiCostService.recordAPICall(
          model,
          'user_query', // Default purpose, can be overridden
          'paid', // Default tier, can be overridden
          1000, // Default token estimate
          true
        ).catch(error => console.error('Error tracking API cost:', error));
        
        return response.text || '';
      }

    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log(`Insight generation was aborted.`);
        throw error;
      } else {
        console.error(`Error in generateInsightWithSearch with ${finalModel}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Re-throw a standardized error for the hook to catch
        throw new Error(isQuotaError(error) ? "QUOTA_EXCEEDED" : errorMessage);
      }
    }
  }

  /**
   * Generate insight stream (from geminiService)
   */
  async generateInsightStream(
    gameName: string,
    genre: string,
    progress: number,
    instruction: string,
    insightId: string,
    onChunk: (chunk: string) => void,
    onError: (error: string) => void,
    signal: AbortSignal
  ): Promise<void> {
    if (await this.checkCooldown()) {
      onError('AI service is on cooldown. Please try again later.');
      return;
    }

    try {
      const model = this.getOptimalModel('insight_generation');
      
      const systemInstruction = this.getInsightSystemInstruction(gameName, genre, progress, instruction, insightId);
      const contentPrompt = `Generate the content for the "${insightId}" insight for the game ${gameName}, following the system instructions.`;
      
      // Check user tier to determine if grounding search should be enabled
      let tools: any[] = [];
      try {
        const userTier = await unifiedUsageService.getTier();
        if (userTier === 'pro' || userTier === 'vanguard_pro') {
          tools = [{ googleSearch: {} }];
          console.log(`🔍 Insight stream with grounding search for ${userTier} user`);
        } else {
          tools = [];
          console.log(`🚫 Insight stream without grounding search for ${userTier} user`);
        }
      } catch (error) {
        console.warn('Failed to get user tier for insight stream, defaulting to no grounding search:', error);
        tools = [];
      }
      
      this.ensureAIInitialized();
      if (!this.ai) {
        throw new Error('AI service not available: No API key provided');
      }

      const streamPromise = this.ai.models.generateContentStream({
        model,
        contents: contentPrompt,
        config: { 
          systemInstruction,
          tools
        },
      });

      const abortPromise = new Promise<never>((_, reject) => {
        if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
      });
      
      const stream = await Promise.race([streamPromise, abortPromise]);
      
      if (signal.aborted) return;
      
      await Promise.race([
        (async () => {
          for await (const chunk of stream) {
            if (signal.aborted) break;
            if (chunk.text) {
              onChunk(chunk.text);
            }
          }
        })(),
        abortPromise
      ]);

      this.handleSuccess();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log(`Insight generation for "${insightId}" was aborted.`);
      } else {
        this.handleError(error, onError);
      }
    }
  }

  override   cleanup(): void {
    console.log('🧹 UnifiedAIService: Cleanup called');
    
    // ✅ MEMORY LEAK FIXES: Proper cleanup of all resources
    this.chatSessions = {};
    this.insightCache.clear();
    this.usedPrompts.clear();
    
    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    
    // Abort all pending requests
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
    
    // Remove all event listeners
    this.eventListeners.forEach(cleanup => cleanup());
    this.eventListeners.clear();
  }
  
  // ✅ MEMORY LEAK FIXES: Track interval creation
  private createInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const interval = setInterval(callback, delay);
    this.intervals.add(interval);
    return interval;
  }
  
  // ✅ MEMORY LEAK FIXES: Track abort controller creation
  private createAbortController(): AbortController {
    const controller = new AbortController();
    this.abortControllers.add(controller);
    return controller;
  }
  
  // ✅ MEMORY LEAK FIXES: Track event listener creation
  private addEventListener(element: EventTarget, event: string, handler: EventListener): void {
    element.addEventListener(event, handler);
    this.eventListeners.set(`${event}-${Date.now()}`, () => {
      element.removeEventListener(event, handler);
    });
  }
}

// Export singleton instance (lazy creation to avoid circular dependency issues)
let _unifiedAIService: UnifiedAIService | null = null;
export const unifiedAIService = (): UnifiedAIService => {
  if (!_unifiedAIService) {
    _unifiedAIService = new UnifiedAIService();
  }
  return _unifiedAIService;
};
