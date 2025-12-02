import { GoogleGenerativeAI, GenerativeModel, SchemaType, HarmCategory, HarmBlockThreshold, SafetySetting, Part, InlineDataPart, TextPart } from "@google/generative-ai";
import { parseOtakonTags } from './otakonTags';
import { AIResponse, Conversation, User, insightTabsConfig, PlayerProfile } from '../types';
import type { ViteImportMeta, UserProfileData } from '../types/enhanced';
import { cacheService } from './cacheService';
import { aiCacheService } from './aiCacheService';
import { getPromptForPersona } from './promptSystem';
import { errorRecoveryService } from './errorRecoveryService';
import { characterImmersionService } from './characterImmersionService';
import { profileAwareTabService } from './profileAwareTabService';
import { toastService } from './toastService';
import { supabase } from '../lib/supabase';
import { ConversationService } from './conversationService';

// ? SECURITY FIX: Use Edge Function proxy instead of exposed API key
const USE_EDGE_FUNCTION = true; // Set to true to use secure server-side proxy
const API_KEY = (import.meta as ViteImportMeta).env.VITE_GEMINI_API_KEY; // Only used if USE_EDGE_FUNCTION = false

// ? FIX 1: Gemini API Safety Settings
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
  
  // ? REQUEST DEDUPLICATION: Track pending requests to prevent duplicate API calls
  private pendingRequests: Map<string, Promise<AIResponse>> = new Map();

  constructor() {
    // ? SECURITY: Initialize Edge Function URL
    const supabaseUrl = (import.meta as ViteImportMeta).env.VITE_SUPABASE_URL;
    this.edgeFunctionUrl = `${supabaseUrl}/functions/v1/ai-proxy`;

    if (!USE_EDGE_FUNCTION) {
      // Legacy: Direct API mode (only for development/testing)
      if (!API_KEY) {
        throw new Error("VITE_GEMINI_API_KEY is not set in the environment variables.");
      }
      this.genAI = new GoogleGenerativeAI(API_KEY);
      // Using gemini-2.5-flash-preview-09-2025 for all operations (enhanced performance)
      // ? FIX 2: Apply safety settings to all model initializations
      this.flashModel = this.genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-preview-09-2025",
        safetySettings: SAFETY_SETTINGS
      });
      this.proModel = this.genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-preview-09-2025",
        safetySettings: SAFETY_SETTINGS
      });
      // ? NEW: Model with Google Search grounding enabled
      // Note: google_search is a valid Gemini 2.5 tool but not in the @google/generative-ai types yet
      this.flashModelWithGrounding = this.genAI.getGenerativeModel({
        model: "gemini-2.5-flash-preview-09-2025",
        safetySettings: SAFETY_SETTINGS,
        tools: [{
          google_search: {}  // ? Gemini 2.5 syntax, works for both text and images
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }] as any
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
   * ? SECURITY: Call Edge Function proxy instead of direct API
   */
  private async callEdgeFunction(request: {
    prompt: string;
    image?: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    requestType: 'text' | 'image';
    model?: string;
    tools?: Array<Record<string, unknown>>;
    abortSignal?: AbortSignal;
  }): Promise<{ response: string; success: boolean; usage?: Record<string, unknown>; groundingMetadata?: Record<string, unknown> }> {
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
      body: JSON.stringify(request),
      signal: request.abortSignal
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'AI service error');
    }

    return await response.json();
  }

  /**
   * ? FIX 3: Check if AI response was blocked by safety filters
   */
  private checkSafetyResponse(result: { response: { promptFeedback?: { blockReason?: string }; candidates?: Array<{ finishReason?: string }> } }): { safe: boolean; reason?: string } {
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
   * ? REQUEST DEDUPLICATION: Wrapper to prevent duplicate API calls
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
    // ? QUERY LIMIT: Check if user can send this query
    const queryCheck = hasImages 
      ? await ConversationService.canSendImageQuery()
      : await ConversationService.canSendTextQuery();
    
    if (!queryCheck.allowed) {
      // Throw error with upgrade prompt
      throw new Error(queryCheck.reason || 'Query limit reached. Please upgrade your tier.');
    }
    
        // ? AI RESPONSE CACHING: Check if we should cache this query
    const cacheContext = {
      gameTitle: conversation.gameTitle,
      mode: isActiveSession ? 'playing' : 'planning',
      hasImages,
      conversationId: conversation.id,
      hasUserContext: false // Don't cache user-specific responses
    };
    
    const shouldUseCache = aiCacheService.shouldCache(userMessage, cacheContext);
    console.log(`?? [AIService] shouldUseCache: ${shouldUseCache} for message: "${userMessage.substring(0, 50)}..."`);
        // Generate cache key for AI responses (persistent cache)
    const aiCacheKey = shouldUseCache 
      ? aiCacheService.generateCacheKey(userMessage, cacheContext)
      : '';
    
    if (aiCacheKey) {
          }
    
    // Check AI cache first (persistent, cross-user for global/game queries)
    if (shouldUseCache && aiCacheKey) {
            const cachedAIResponse = await aiCacheService.getCachedResponse(aiCacheKey);
      if (cachedAIResponse) {
                // Parse the cached content and return as AIResponse
        const { cleanContent, tags } = parseOtakonTags(cachedAIResponse.content || '');
        return {
          content: cleanContent,
          rawContent: cachedAIResponse.content || '',
          otakonTags: tags,
          suggestions: cachedAIResponse.suggestions || [],
          followUpPrompts: cachedAIResponse.followUpPrompts,
          metadata: {
            model: cachedAIResponse.metadata?.model || 'cached',
            timestamp: cachedAIResponse.metadata?.timestamp || Date.now(),
            cost: cachedAIResponse.metadata?.cost || 0,
            tokens: cachedAIResponse.metadata?.tokens || 0,
            fromCache: true,
            cacheType: 'ai_persistent'
          }
        };
      } else {
              }
    } else {
      console.log(`?? [AIService] Skipping AI cache check (shouldUseCache=${shouldUseCache}, hasKey=${!!aiCacheKey})`);
    }
    
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
    
    // Check memory cache second (fast, conversation-specific)
    const cachedResponse = await cacheService.get<AIResponse>(cacheKey, true); // true = memory only
    if (cachedResponse) {
      return { ...cachedResponse, metadata: { ...cachedResponse.metadata, fromCache: true, cacheType: 'memory' } };
    }

    // Skip session context for now - it's returning null and slowing things down
    // TODO: Implement proper session context when needed
    const sessionContext = '';

    // Get player profile from user preferences - convert with defaults if needed
    const userProfileData = user.profileData as UserProfileData;
    const playerProfile: PlayerProfile | undefined = userProfileData?.hintStyle && userProfileData?.playerFocus && userProfileData?.preferredTone && userProfileData?.spoilerTolerance 
      ? {
          hintStyle: userProfileData.hintStyle,
          playerFocus: userProfileData.playerFocus,
          preferredTone: userProfileData.preferredTone,
          spoilerTolerance: userProfileData.spoilerTolerance
        }
      : undefined;
    
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
    
        // Check if request was aborted before starting
    if (abortSignal?.aborted) {
      throw new DOMException('Request was aborted', 'AbortError');
    }
    
    try {
      // ? ENABLE GROUNDING FOR ALL QUERIES (text and image)
      const needsWebSearch = true;
      
      // Use grounding model for queries that need current information
      // ? SECURITY: Use Edge Function if enabled
      let rawContent: string;

      if (USE_EDGE_FUNCTION) {
        // Extract base64 image data if present
        let imageBase64: string | undefined;
        if (hasImages && imageData) {
          imageBase64 = imageData.split(',')[1];
        }

        // Determine which model and tools to use
        const modelName = 'gemini-2.5-flash-preview-09-2025';
        
        // ? ENHANCEMENT: Enable Google Search grounding for both text AND images
        // This allows game detection from screenshots to access current information
        const tools = needsWebSearch 
          ? [{ google_search: {} }]  // Updated to Gemini 2.5 syntax
          : [];

        // Call Edge Function proxy
        const edgeResponse = await this.callEdgeFunction({
          prompt,
          image: imageBase64,
          temperature: 0.7,
          maxTokens: 2048,
          requestType: hasImages ? 'image' : 'text',
          model: modelName,
          tools: tools.length > 0 ? tools : undefined,
          abortSignal
        });

        if (!edgeResponse.success) {
          throw new Error(edgeResponse.response || 'AI request failed');
        }

        rawContent = edgeResponse.response;

      } else {
        // Legacy: Direct API mode (only for development)
        // ? Grounding now works with both text and images in Gemini 2.5
        const modelToUse = needsWebSearch
          ? this.flashModelWithGrounding 
          : this.flashModel;
        
        if (needsWebSearch) {
          console.log('?? [AIService] Using Google Search grounding for current information:', {
            gameTitle: conversation.gameTitle,
            query: userMessage.substring(0, 50) + '...',
            hasImages: hasImages
          });
        }
        
        // Prepare content for Gemini API
        let content: string | Part[];
        if (hasImages && imageData) {
          // Extract MIME type from data URL
          const mimeType = imageData.split(';')[0].split(':')[1] || 'image/jpeg';
          const base64Data = imageData.split(',')[1];
          
          // For image analysis, we need to send both text and image
          const textPart: TextPart = { text: prompt };
          const imagePart: InlineDataPart = {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          };
          content = [textPart, imagePart];
        } else {
          // For text-only requests
          content = prompt;
        }
        
        const result = await modelToUse.generateContent(content);
        
        // ? FIX 4: Check safety response
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
      
      // ? QUERY TRACKING: Record usage in database (non-blocking)
      const { SupabaseService } = await import('./supabaseService');
      const supabaseService = SupabaseService.getInstance();
      supabaseService.recordQuery(user.authUserId, hasImages ? 'image' : 'text')
        .catch(error => console.warn('Failed to record query usage:', error));
      
      // Invalidate user cache so next request gets fresh usage data
      const { authService } = await import('./authService');
      authService.refreshUser()
        .catch(error => console.warn('Failed to refresh user after query:', error));
      
      // Cache the response for 1 hour in memory (non-blocking - fire and forget)
      cacheService.set(cacheKey, aiResponse, 60 * 60 * 1000)
        .catch(error => console.warn('Failed to cache AI response in memory:', error));
      
      // ? AI PERSISTENT CACHE: Store in database cache if appropriate
      if (shouldUseCache && aiCacheKey) {
        const cacheType = aiCacheService.determineCacheType(cacheContext);
        const ttl = aiCacheService.determineTTL(cacheType, cacheContext);
        
        aiCacheService.cacheResponse(aiCacheKey, {
          content: rawContent,
          suggestions: aiResponse.suggestions,
          otakonTags: Object.fromEntries(aiResponse.otakonTags),
          metadata: aiResponse.metadata
        }, {
          cacheType,
          gameTitle: conversation.gameTitle,
          conversationId: conversation.id,
          modelUsed: 'gemini-2.5-flash-preview-09-2025',
          tokensUsed: aiResponse.metadata.tokens || 0,
          ttlHours: ttl
        }).catch(error => console.warn('Failed to cache AI response in database:', error));
      }
      
      // ? GAME HUB INTERACTION LOGGING: Track Game Hub queries and responses
      if (conversation.isGameHub) {
        this.logGameHubInteraction({
          user,
          userMessage,
          aiResponse,
          otakonTags: tags
        }).catch(error => console.warn('Failed to log Game Hub interaction:', error));
      }
      
      // ? API USAGE TRACKING: Log all Gemini API calls for analytics and cost tracking
      this.logApiUsage({
        userId: user.id,
        authUserId: user.authUserId,
        requestType: conversation.isGameHub ? 'game_hub' : hasImages ? 'image_analysis' : 'chat',
        tokensUsed: aiResponse.metadata.tokens || 0,
        aiModel: 'gemini-2.5-flash-preview-09-2025',
        endpoint: '/generateContent'
      }).catch(error => console.warn('Failed to log API usage:', error));
      
      return aiResponse;

    } catch (error) {
      console.error("AI Service Error:", error);
      
      // ? FIX 4: Enhanced error handling for safety blocks
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

    // Detect if this is a gaming news query
    const isGamingNewsQuery = 
      userMessage.toLowerCase().includes('latest') ||
      userMessage.toLowerCase().includes('news') ||
      userMessage.toLowerCase().includes('new games') ||
      userMessage.toLowerCase().includes('announced') ||
      userMessage.toLowerCase().includes('upcoming') ||
      userMessage.toLowerCase().includes('release');

    // Add structured response instructions
    const structuredInstructions = `

**ENHANCED RESPONSE FORMAT:**
In addition to your regular response, provide structured data in the following optional fields:

1. **followUpPrompts** (array of 3-4 strings): Generate contextual follow-up questions DIRECTLY RELATED to the specific content of your response
   ${isGamingNewsQuery ? `
   - NEWS MODE: Generate follow-ups about the SPECIFIC games/news you just mentioned
   - Example: If you mentioned "Elden Ring DLC", ask "When is the Elden Ring DLC releasing?"
   - Example: If you mentioned "Dragon's Dogma 2", ask "What's new in Dragon's Dogma 2?"
   - DO NOT use generic questions like "Who are the main demigods?" unless you specifically discussed demigods` : 
   !conversation.isGameHub ? `
   - GAME MODE (${conversation.gameTitle}): Generate follow-ups about the SPECIFIC topic you just discussed
   - Session Mode: ${isActiveSession ? 'PLAYING MODE - User is actively playing' : 'PLANNING MODE - User is preparing/strategizing'}
   - ${isActiveSession 
       ? 'Generate immediate, actionable prompts about what you just explained (e.g., "How do I counter [specific enemy]?", "Where do I go after [location]?")'
       : 'Generate strategic prompts about what you just discussed (e.g., "What items do I need for [specific build]?", "How do I prepare for [specific boss]?")'
     }
   - Example: If you explained boss mechanics, ask about strategies for THAT boss
   - Example: If you explained a location, ask about secrets or NPCs in THAT location` :
   `
   - GAME HUB MODE: Generate follow-ups about the SPECIFIC games/topics you just discussed
   - Example: If you explained a game's story, ask about specific characters or plot points from that game
   - DO NOT use generic gaming questions - tie them to what you just said`}
2. **progressiveInsightUpdates** (array): If conversation provides new info, update existing subtabs (e.g., story_so_far, characters)
3. **stateUpdateTags** (array of strings): Track game state changes. ALWAYS include these for game conversations:
   - "PROGRESS: XX" (0-100) - **REQUIRED for game tabs**: Estimate player's game completion percentage
     * Consider: story chapter/act, areas unlocked, bosses defeated, main quest progress, abilities obtained
     * Early game (tutorial, first area): 5-15%
     * Early-mid game (first major boss, new mechanics): 15-30%
     * Mid game (multiple areas explored): 30-50%
     * Late-mid game (most content accessible): 50-75%
     * Late game (final areas, optional content): 75-90%
     * End game (final boss, post-game): 90-100%
   - "OBJECTIVE: current goal" - Player's current main objective or quest
   - "OBJECTIVE_COMPLETE: true" - When player completes an objective
   - "TRIUMPH: Boss Name" - When player defeats a major boss
   ${!conversation.isGameHub ? `
   **⚠️ MANDATORY PROGRESS TRACKING - NEVER SKIP THIS:**
   Current game: ${conversation.gameTitle}
   Current tracked progress: ${conversation.gameProgress || 0}%
   
   You MUST include "PROGRESS: XX" in stateUpdateTags for EVERY response.
   Based on the user's message or screenshot, estimate progress:
   - Beating/defeating something (boss, level, area) → increase progress
   - Being stuck or just starting an area → estimate progress for that area
   - Story events or cutscenes → estimate story progress
   - Screenshots showing game location/state → estimate from visual cues
   - Questions about late-game content → they're likely far in the game
   
   Example stateUpdateTags: ["PROGRESS: 35", "OBJECTIVE: Defeat Margit the Fell Omen"]
   
   For Elden Ring locations → progress estimates:
   - Limgrave/Church of Elleh → 5-10%
   - Stormveil Castle → 15-20%
   - Liurnia/Raya Lucaria → 25-35%
   - Altus Plateau/Leyndell → 45-55%
   - Mountaintops → 65-75%
   - Farum Azula → 80-85%
   - Elden Throne → 90%+` : ''}
4. **gamePillData** (object): ${conversation.isGameHub ? 'Set shouldCreate: true if user asks about a specific game, and include game details with pre-filled wikiContent' : 'Set shouldCreate: false (already in game tab)'}

**CRITICAL**: Only include the content field in your response. DO NOT add "Internal Data Structure" or any JSON after your main content. The system will extract the structured fields automatically.
`;
    
    const prompt = basePrompt + immersionContext + structuredInstructions;
    
        // Check if request was aborted
    if (abortSignal?.aborted) {
      throw new DOMException('Request was aborted', 'AbortError');
    }
    
    try {
      // ? NEW: Also use grounding for structured requests when appropriate
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
      
      // ? SECURITY: Use Edge Function for structured responses
      if (USE_EDGE_FUNCTION) {
        // Extract base64 image data if present
        let imageBase64: string | undefined;
        if (hasImages && imageData) {
          imageBase64 = imageData.split(',')[1];
        }

        const modelName = 'gemini-2.5-flash-preview-09-2025';
        
        // ? Enable Google Search grounding for current game information
        // Works with both text and images in Gemini 2.5
        const tools = needsWebSearch
          ? [{ google_search: {} }]  // ? Gemini 2.5 syntax, works for images too
          : [];

        const edgeResponse = await this.callEdgeFunction({
          prompt,
          image: imageBase64,
          temperature: 0.7,
          maxTokens: 2048,
          requestType: hasImages ? 'image' : 'text',
          model: modelName,
          tools: tools,
          abortSignal
        });

        if (!edgeResponse.success) {
          throw new Error(edgeResponse.response || 'AI request failed');
        }

        const rawContent = edgeResponse.response;
        
        // 🔍 DEBUG: Log raw AI response to see if progress tags are present
        console.log('🤖 [AIService] Raw AI response (last 500 chars):', rawContent.slice(-500));
        console.log('🤖 [AIService] Checking for PROGRESS in raw response:', 
          rawContent.includes('PROGRESS') ? '✅ FOUND' : '❌ NOT FOUND',
          rawContent.includes('OTAKON_PROGRESS') ? '(OTAKON_PROGRESS format)' : '(other format or missing)'
        );
        
        const { cleanContent, tags } = parseOtakonTags(rawContent);
        
        // 🔍 DEBUG: Log extracted tags
        console.log('🏷️ [AIService] Extracted otakonTags:', {
          tagCount: tags.size,
          tagKeys: Array.from(tags.keys()),
          progressValue: tags.get('PROGRESS'),
          objectiveValue: tags.get('OBJECTIVE')
        });

        const suggestions = (tags.get('SUGGESTIONS') as string[]) || [];
        
        // ✅ FIX: Build stateUpdateTags from otakonTags for consistency with JSON mode
        const stateUpdateTags: string[] = [];
        if (tags.has('PROGRESS')) {
          const progress = tags.get('PROGRESS');
          stateUpdateTags.push(`PROGRESS: ${progress}`);
          console.log('📊 [AIService] Added PROGRESS to stateUpdateTags:', progress);
        }
        if (tags.has('OBJECTIVE')) {
          const objective = tags.get('OBJECTIVE');
          stateUpdateTags.push(`OBJECTIVE: ${objective}`);
          console.log('🎯 [AIService] Added OBJECTIVE to stateUpdateTags:', objective);
        }
        
        const aiResponse: AIResponse = {
          content: cleanContent,
          suggestions: suggestions,
          followUpPrompts: suggestions, // ✅ Match JSON mode - set followUpPrompts from SUGGESTIONS tag
          otakonTags: tags,
          rawContent: rawContent,
          stateUpdateTags: stateUpdateTags, // ✅ NEW: Include stateUpdateTags from parsed tags
          metadata: {
            model: modelName,
            timestamp: Date.now(),
            cost: 0,
            tokens: 0,
          }
        };
        
        console.log('📤 [AIService] Final aiResponse:', {
          hasContent: !!aiResponse.content,
          contentLength: aiResponse.content?.length,
          stateUpdateTags: aiResponse.stateUpdateTags,
          otakonTagKeys: Array.from(aiResponse.otakonTags.keys())
        });

        cacheService.set(cacheKey, aiResponse, 60 * 60 * 1000).catch(err => console.warn(err));
        return aiResponse;
      }

      // Legacy: Direct API mode
      // ? ENHANCEMENT: Enable grounding for both text and images in Gemini 2.5
      const modelToUse = needsWebSearch
        ? this.flashModelWithGrounding 
        : this.flashModel;
      
      if (needsWebSearch) {
        console.log('?? [AIService] Using Google Search grounding for structured response:', {
          gameTitle: conversation.gameTitle,
          query: userMessage.substring(0, 50) + '...',
          hasImages: hasImages
        });
      }
      
      // Prepare content
      let content: string | Part[];
      if (hasImages && imageData) {
        const mimeType = imageData.split(';')[0].split(':')[1] || 'image/jpeg';
        const base64Data = imageData.split(',')[1];
        
        const textPart: TextPart = { text: prompt };
        const imagePart: InlineDataPart = {
          inlineData: { mimeType, data: base64Data }
        };
        content = [textPart, imagePart];
        
        // For images, use regular mode (not JSON) because images don't work well with JSON schema
        const result = await modelToUse.generateContent(content);
        const rawContent = await result.response.text();
        const { cleanContent, tags } = parseOtakonTags(rawContent);
        
        const suggestions = tags.get('SUGGESTIONS') as string[] || [];
        const aiResponse: AIResponse = {
          content: cleanContent,
          suggestions: suggestions,
          followUpPrompts: suggestions, // ? Set followUpPrompts from SUGGESTIONS tag
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
                  items: { type: SchemaType.STRING },
                  description: "MANDATORY: Array of state updates. MUST include 'PROGRESS: XX' (0-100) to track game completion percentage."
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
              required: ["content", "followUpPrompts", "stateUpdateTags"]
            }
          }
        });
        
        // ? FIX 5: Check safety response
        const safetyCheck = this.checkSafetyResponse(result);
        if (!safetyCheck.safe) {
          toastService.error('Unable to generate response due to content policy');
          throw new Error(safetyCheck.reason);
        }
        
        const rawResponse = await result.response.text();
        const structuredData = JSON.parse(rawResponse);
        
        // ? DEBUG: Log what Gemini actually returns
        console.log('🤖 [AIService] Gemini response keys:', Object.keys(structuredData));
        console.log('🤖 [AIService] stateUpdateTags:', structuredData.stateUpdateTags);
        
        // ✅ FALLBACK: If stateUpdateTags is empty/missing, try to extract progress from content
        let stateUpdateTags = structuredData.stateUpdateTags || [];
        if (!stateUpdateTags.length || !stateUpdateTags.some((tag: string) => tag.includes('PROGRESS'))) {
          // Look for progress mentions in the content
          const progressMatch = (structuredData.content || '').match(/(?:\[OTAKON_)?PROGRESS[:\s]+(\d+)/i);
          if (progressMatch) {
            const progress = parseInt(progressMatch[1], 10);
            if (progress >= 0 && progress <= 100) {
              console.log(`🤖 [AIService] Extracted fallback progress from content: ${progress}%`);
              stateUpdateTags = [...stateUpdateTags, `PROGRESS: ${progress}`];
            }
          }
        }
        
        // ? Clean content: Remove any JSON-like structured data from the main content
        let cleanContent = structuredData.content || '';
        
        // ---------------------------------------------------------
        // 🚨 CRITICAL FIX: AGGRESSIVE PRE-CLEANING
        // ---------------------------------------------------------

        // 1. Unescape asterisks (Fixes \*\* issues)
        cleanContent = cleanContent.replace(/\\\*/g, '*');

        // 2. Fix headers with MISSING closing ** (AI sends "** Lore:**" without closing **)
        cleanContent = cleanContent.replace(/\*\*\s*Hint\s*:\*\*\s*/gi, '\n\nHint:\n');
        cleanContent = cleanContent.replace(/\*\*\s*Lore\s*:\*\*\s*/gi, '\n\nLore:\n');
        cleanContent = cleanContent.replace(/\*\*\s*Places\s+of\s+Interest\s*:\*\*\s*/gi, '\n\nPlaces of Interest:\n');
        cleanContent = cleanContent.replace(/\*\*\s*Strategy\s*:\*\*\s*/gi, '\n\nStrategy:\n');
        cleanContent = cleanContent.replace(/\*\*\s*What\s+to\s+focus\s+on\s*:\*\*\s*/gi, '\n\nWhat to focus on:\n');

        // 3. Fix headers WITHOUT any closing ** (AI sends "** Lore:" with no ** at end)
        cleanContent = cleanContent.replace(/\n\*\*\s*Hint\s*:\s*\n/gi, '\n\nHint:\n');
        cleanContent = cleanContent.replace(/\n\*\*\s*Lore\s*:\s*\n/gi, '\n\nLore:\n');
        cleanContent = cleanContent.replace(/\n\*\*\s*Places\s+of\s+Interest\s*:\s*\n/gi, '\n\nPlaces of Interest:\n');
        cleanContent = cleanContent.replace(/\n\*\*\s*Strategy\s*:\s*\n/gi, '\n\nStrategy:\n');
        cleanContent = cleanContent.replace(/\n\*\*\s*What\s+to\s+focus\s+on\s*:\s*\n/gi, '\n\nWhat to focus on:\n');

        // 4. Fix standalone headers on their own line
        cleanContent = cleanContent.replace(/^\*\*\s*Hint\s*:\s*\**\s*$/gim, 'Hint:');
        cleanContent = cleanContent.replace(/^\*\*\s*Lore\s*:\s*\**\s*$/gim, 'Lore:');
        cleanContent = cleanContent.replace(/^\*\*\s*Places\s+of\s+Interest\s*:\s*\**\s*$/gim, 'Places of Interest:');
        cleanContent = cleanContent.replace(/^\*\*\s*Strategy\s*:\s*\**\s*$/gim, 'Strategy:');
        cleanContent = cleanContent.replace(/^\*\*\s*What\s+to\s+focus\s+on\s*:\s*\**\s*$/gim, 'What to focus on:');

        // 5. Fix the "Space inside Bold" issue GLOBALLY
        cleanContent = cleanContent.replace(/\*\*\s+([^*]+?)\*\*/g, '**$1**');
        cleanContent = cleanContent.replace(/\*\*([^*]+?)\s+\*\*/g, '**$1**');

        // 6. Fix "Header inside Bold" with space before colon
        cleanContent = cleanContent.replace(/\*\*\s*([A-Za-z ]+?)\s*:\s*\*\*/g, '**$1:**');

        // ---------------------------------------------------------
        
                console.log('?? [AIService] Last 200 chars:', cleanContent.slice(-200));
        
        // Remove structured fields if AI accidentally includes them in content
        // Apply cleaning in order of most specific to most general
        cleanContent = cleanContent
          // ? STEP 1: Remove EVERYTHING after "Internal Data Structure" (most aggressive first)
          .replace(/\*+\s*#+\s*Internal Data Structure[\s\S]*$/gi, '') // ***## Internal Data Structure
          .replace(/\*+\s*Internal Data Structure[\s\S]*$/gi, '') // *** Internal Data Structure  
          .replace(/#+\s*Internal Data Structure[\s\S]*$/gi, '') // ## Internal Data Structure
          .replace(/Internal Data Structure[\s\S]*$/gi, '') // Internal Data Structure (any case)
          // ? STEP 2: Remove JSON blocks with specific fields (before general JSON removal)
          .replace(/\{[\s\S]*?"followUpPrompts"[\s\S]*?\}/gi, '')
          .replace(/\{[\s\S]*?"progressiveInsightUpdates"[\s\S]*?\}/gi, '')
          .replace(/\{[\s\S]*?"gamePillData"[\s\S]*?\}/gi, '')
          .replace(/\{[\s\S]*?"stateUpdateTags"[\s\S]*?\}/gi, '')
          // ? STEP 3: Remove code blocks
          .replace(/```json[\s\S]*?```/gi, '')
          .replace(/```\s*\{[\s\S]*?```/gi, '')
          // ? STEP 4: Remove "Enhanced Response Data" sections
          .replace(/Enhanced Response Data[\s\S]*$/gi, '')
          .replace(/\*\*Enhanced Response Data\*\*[\s\S]*$/gi, '')
          // ? STEP 5: Remove standalone artifacts at end
          .replace(/\*+\s*\]\s*$/g, '') // ***]
          .replace(/\]\s*$/g, '') // ]
          .replace(/\*+\s*$/g, '') // ***
          // ? STEP 6: Remove any JSON structure at the end
          .replace(/\n\s*\{[\s\S]*$/g, '')
          .replace(/\s*[\]}]\s*$/g, '')
          // ? STEP 7: Remove OTAKON tags
          .replace(/\{[\s\S]*?"OTAKON_[A-Z_]+":[\s\S]*?\}/g, '')
          // ? STEP 8: Remove separator lines
          .replace(/_{3,}/g, '')
          // ? STEP 9: Clean leading/trailing junk
          .replace(/^[\s\]}[{),]+/g, '')
          .replace(/\s*[\]}\s]*$/g, '')
          // Clean up any remaining JSON artifacts
          .replace(/\{[\s\S]*?"OTAKON_[A-Z_]+":[\s\S]*?\}/g, '')
          // ? STEP 9b: Fix orphaned ** after game title headers (e.g., "Game - Location** You stand")
          .replace(/^([^*\n]*?\s-\s[^*\n]*?)\*\*\s+/gm, '$1\n\n')
          // ? STEP 10: UNIFIED HEADER CLEANUP
          // First normalize all header variations to a standard form without newlines
          // Handle "** Lore:**" (space after **) and "** Lore :**" (spaces around colon)
          .replace(/\*\*\s*Hint\s*:\s*\*\*/gi, '##HINT##')
          .replace(/\*\*\s*Lore\s*:\s*\*\*/gi, '##LORE##')
          .replace(/\*\*\s*Places\s+of\s+Interest\s*:\s*\*\*/gi, '##POI##')
          .replace(/\*\*\s*Strategy\s*:\s*\*\*/gi, '##STRATEGY##')
          .replace(/\*\*\s*What\s+to\s+focus\s+on\s*:\s*\*\*/gi, '##FOCUS##')
          // Handle plain headers without bold
          .replace(/^Hint:\s*/im, '##HINT##')
          .replace(/\nHint:\s*/gi, '##HINT##')
          .replace(/\nLore:\s*/gi, '##LORE##')
          .replace(/\nPlaces of Interest:\s*/gi, '##POI##')
          .replace(/\nStrategy:\s*/gi, '##STRATEGY##')
          .replace(/\nWhat to focus on:\s*/gi, '##FOCUS##')
          // Handle headers after punctuation
          .replace(/([.!?])\s*Hint:/gi, '$1##HINT##')
          .replace(/([.!?])\s*Lore:/gi, '$1##LORE##')
          .replace(/([.!?])\s*Places of Interest:/gi, '$1##POI##')
          .replace(/([.!?])\s*Strategy:/gi, '$1##STRATEGY##')
          .replace(/([.!?])\s*What to focus on:/gi, '$1##FOCUS##')
          // ? STEP 11: Fix malformed generic bold markers (spaces between ** and text)
          .replace(/\*\*\s+([^*#]+?)\s+\*\*/g, '**$1**')
          .replace(/\*\*\s+([^*#:]+?):\s*(?!\*)/g, '**$1:** ')
          // ? STEP 12: Replace placeholder tokens with properly formatted headers
          .replace(/##HINT##\s*/g, '\n\n**Hint:**\n')
          .replace(/##LORE##\s*/g, '\n\n**Lore:**\n')
          .replace(/##POI##\s*/g, '\n\n**Places of Interest:**\n')
          .replace(/##STRATEGY##\s*/g, '\n\n**Strategy:**\n')
          .replace(/##FOCUS##\s*/g, '\n\n**What to focus on:**\n')
          // ? STEP 13: Clean up any stray **** (four asterisks from double-processing)
          .replace(/\*{4,}/g, '**')
          // Remove orphaned ** in middle of text (e.g., "text** More text")
          .replace(/([a-z])\*\*\s+([A-Z])/g, '$1 $2')
          // ? STEP 14: Fix paragraph formatting (use [^*\n]+ to prevent matching across newlines!)
          .replace(/(\*\*[^*\n]+\*\*:?)([A-Z])/g, '$1\n\n$2') // Break after bold headers on same line
          .replace(/\.([A-Z][a-z])/g, '.\n\n$1') // Period + Capital = new paragraph
          .replace(/\.(\*\*[A-Z])/g, '.\n\n$1') // Period + Bold = new paragraph
          // ? STEP 15: Final cleanup
          .replace(/^\n+/, '') // Remove leading newlines
          .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
          // ? FINAL SAFETY NET: Catch any remaining malformed headers with spaces
          .replace(/\*\*\s+(Hint|Lore|Strategy):\*\*/gi, '**$1:**')
          .replace(/\*\*\s+Places\s+of\s+Interest:\*\*/gi, '**Places of Interest:**')
          .replace(/\*\*\s+What\s+to\s+focus\s+on:\*\*/gi, '**What to focus on:**')
          .trim();
        
                console.log('?? [AIService] Last 200 chars after cleaning:', cleanContent.slice(-200));
        
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
          stateUpdateTags: stateUpdateTags,
          gamePillData
        };
        
        cacheService.set(cacheKey, aiResponse, 60 * 60 * 1000).catch(err => console.warn(err));
        
        // Note: AI persistent cache not implemented for structured responses yet
        // The shouldUseCache/aiCacheKey/cacheContext variables would need to be
        // defined in this function scope to enable persistent caching
        
        return aiResponse;
        
      } catch (_jsonError) {
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
          
          // ? FIX 5: Check safety response in fallback
          const safetyCheck = this.checkSafetyResponse(result);
          if (!safetyCheck.safe) {
            toastService.error('Unable to generate response due to content policy');
            throw new Error(safetyCheck.reason);
          }
          
          rawContent = await result.response.text();
        }

        const { cleanContent, tags } = parseOtakonTags(rawContent);
        
        const suggestions = (tags.get('SUGGESTIONS') as string[]) || [];
        const aiResponse: AIResponse = {
          content: cleanContent,
          suggestions: suggestions,
          followUpPrompts: suggestions, // ? Set followUpPrompts from SUGGESTIONS tag
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
      
      // ? FIX 5: Enhanced error handling for safety blocks
      const errorMessage = (error as Error).message || '';
      if (errorMessage.includes('blocked') || errorMessage.includes('SAFETY') || errorMessage.includes('content policy')) {
        toastService.error('Your message contains inappropriate content');
        throw new Error('Content blocked by safety filters');
      }
      
      toastService.error('AI response failed. Please try again.');
      
      // Use error recovery with proper retry tracking
      const context = {
        operation: 'getChatResponseWithStructure',
        conversationId: conversation.id,
        userId: user.id,
        timestamp: Date.now(),
        retryCount: 0
      };
      
      const recoveryAction = await errorRecoveryService.handleAIError(
        error as Error,
        context
      );
      
      if (recoveryAction.type === 'retry') {
        errorRecoveryService.incrementRetryCount(context);
        return this.getChatResponseWithStructure(conversation, user, userMessage, isActiveSession, hasImages, imageData, abortSignal);
      } else if (recoveryAction.type === 'user_notification') {
        errorRecoveryService.resetRetryCount(context);
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
    conversationContext?: string // ? NEW: Actual conversation messages for context-aware generation
  ): Promise<Record<string, string>> {
    // ? CRITICAL: Use conversation context in cache key if provided
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

    // ? CRITICAL: Include conversation context for relevant subtab generation
    const contextSection = conversationContext 
      ? `\nConversation Context:\n${conversationContext}\n\n? USE THIS CONTEXT to generate relevant subtab content based on what was discussed!\n` 
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
   - Use bullet points with � for lists when appropriate
5. Content should be detailed, spoiler-free, and helpful for players at this stage
6. Adapt content style based on the Player Profile above
7. YOU MUST generate comprehensive content for ALL ${config.length} tab IDs listed below
8. Provide actionable advice, specific details, and contextual information

Example valid JSON (TARGET THIS LEVEL OF DETAIL):
{
  "story_so_far": "Following the disastrous **Konpeki Plaza heist**, you barely escaped with your life. The Relic, an advanced biochip containing the digital ghost of legendary rockerboy **Johnny Silverhand**, is now killing you from the inside. You have mere weeks to find a solution.\\n\\nYou've been working with **Takemura**, a disgraced Arasaka bodyguard seeking to clear his name and expose the conspiracy behind the assassination of his former boss. The investigation has led you through Night City's criminal underworld, uncovering corporate secrets and dangerous truths.\\n\\nYour current location in **Jig-Jig Street** suggests you're deep in the heart of Westbrook, a district known for high-end entertainment and corporate intrigue. Every decision matters as you race against time.",
  "quest_log": "**Main Quest: The Space in Between**\\nTakemura has information crucial to your survival. His message indicated urgency and possible security concerns. Meeting him could provide vital leads on removing the Relic or expose you to Arasaka operatives still hunting you both.\\n\\n**Recommended Side Activities:**\\n� Explore Jig-Jig Street for vendors offering rare cyberware upgrades\\n� Check nearby ripperdocs for health monitoring and neural optimization\\n� Investigate gig opportunities from local fixers to build street cred",
  "build_optimization": "Based on your current progress, consider these optimization strategies:\\n\\n**Cyberware Focus:** Invest in neural processors and reflex boosters to improve combat responsiveness. The **Sandevistan** operating system offers time dilation for tactical advantages during firefights.\\n\\n**Skill Synergies:** Balance Technical Ability for crafting legendary gear with Intelligence for quickhacking capabilities. This combination allows both direct combat and stealthy netrunning approaches.\\n\\n**Weapon Loadout:** Maintain variety - keep a silenced pistol for stealth, a tech weapon for cover penetration, and a power weapon for raw damage.",
  "boss_strategy": "Upcoming encounters in this arc will test your combat adaptability. **Tactical Recommendations:**\\n\\nYour opponents likely use advanced corporate-grade cyberware and coordinated tactics. Prioritize cover-based gameplay and use the environment to your advantage. Explosive barrels and electrical panels can turn the battlefield in your favor.\\n\\n**Key Strategies:**\\n� Maintain distance and use tech weapons to attack through walls\\n� Neutralize enemy netrunners first to prevent quickhacks\\n� Stock up on MaxDoc inhalers and bounce-back injectors\\n� Save frequently before major confrontations",
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
          maxTokens: 5000, // ? Increased to 5000 to accommodate comprehensive 150-250 word insights per tab
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
        
        // ? FIX 6: Check safety response
        const safetyCheck = this.checkSafetyResponse(result);
        if (!safetyCheck.safe) {
          toastService.error('Unable to generate insights due to content policy');
          throw new Error(safetyCheck.reason);
        }

        responseText = await result.response.text();
      }
      
      const cleanedJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
      
      // ? FIX: Better JSON parsing with fallback
      let insights: Record<string, string>;
      try {
        insights = JSON.parse(cleanedJson);
      } catch (parseError) {
        console.error("JSON parse failed, attempting to fix malformed JSON:", parseError);
        console.error("Raw response (first 500 chars):", responseText.substring(0, 500));
        
        // Try to fix common JSON issues
        let fixedJson = cleanedJson;
        
        // ? IMPROVED: More robust unterminated string fixing
        // Step 1: Find the last complete property before truncation
        const lastCompleteProperty = fixedJson.lastIndexOf('",');
        if (lastCompleteProperty > 0 && !fixedJson.endsWith('}')) {
          // Truncate at last complete property and close JSON
          fixedJson = fixedJson.substring(0, lastCompleteProperty + 1) + '\n}';
          console.error("?? Detected truncated response, using last complete property");
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
          console.error("? Successfully fixed malformed JSON");
          console.error("? Recovered", Object.keys(insights).length, "insights");
          
          // ? NEW: If AI only returned some insights, generate fallback for missing ones
          const config = insightTabsConfig[genre] || insightTabsConfig['Default'];
          const missingTabs = config.filter(tab => !insights[tab.id]);
          if (missingTabs.length > 0) {
            console.error(`?? AI only generated ${Object.keys(insights).length}/${config.length} insights, filling ${missingTabs.length} missing tabs with fallback`);
            missingTabs.forEach(tab => {
              insights[tab.id] = `Welcome to **${tab.title}** for ${gameTitle}!\n\nThis section will be populated as you explore and chat about the game.`;
            });
          }
        } catch (_secondError) {
          console.error("? Could not fix JSON, using fallback content for all tabs");
          console.error("? Raw response that failed (first 1000 chars):", responseText.substring(0, 1000));
          console.error("? This may be an AI generation issue - consider retrying or checking prompt");
          
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
      
      // ? FIX 6: Enhanced error handling for safety blocks
      const errorMessage = (error as Error).message || '';
      if (errorMessage.includes('blocked') || errorMessage.includes('SAFETY') || errorMessage.includes('content policy')) {
        toastService.warning('Unable to generate insights due to content policy');
        return {};
      }
      
      toastService.warning('Failed to generate game insights. You can still continue chatting!');
      return {};
    }
  }

  /**
   * ? GAME HUB INTERACTION LOGGING: Track queries and responses in Game Hub
   * Stores metadata about game detections, user actions, and AI responses
   */
  private async logGameHubInteraction(data: {
    user: User;
    userMessage: string;
    aiResponse: AIResponse;
    otakonTags: Map<string, unknown>;
  }): Promise<void> {
    try {
      const { user, userMessage, aiResponse, otakonTags } = data;
      
      // Extract OTAKON tags for game detection (cast to string for Map values)
      const detectedGame = (otakonTags.get('GAME_ID') || otakonTags.get('GAME_TITLE') || null) as string | null;
      const detectedGenre = (otakonTags.get('GENRE') || null) as string | null;
      const confidence = (otakonTags.get('CONFIDENCE') || 'low') as string;
      const gameStatus = otakonTags.get('GAME_STATUS') || null;
      
      // Determine query type based on whether a game was detected
      let queryType: 'general' | 'game_specific' | 'recommendation' = 'general';
      if (detectedGame) {
        queryType = 'game_specific';
      } else if (userMessage.toLowerCase().includes('recommend') || userMessage.toLowerCase().includes('suggest')) {
        queryType = 'recommendation';
      }
      
      // Insert into game_hub_interactions table
      // Note: table may not be in generated types yet - using type assertion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('game_hub_interactions')
        .insert({
          user_id: user.id,
          auth_user_id: user.authUserId,
          query_text: userMessage,
          query_timestamp: new Date(),
          response_text: aiResponse.content,
          response_timestamp: new Date(),
          detected_game: detectedGame,
          detection_confidence: confidence.toLowerCase() as 'high' | 'low',
          detected_genre: detectedGenre,
          game_status: gameStatus as 'released' | 'unreleased' | null,
          ai_model: 'gemini-2.5-flash-preview-09-2025',
          tokens_used: aiResponse.metadata.tokens || 0,
          query_type: queryType
        });
      
      if (error) {
        console.error('Failed to log Game Hub interaction:', error);
      } else {
              }
    } catch (error) {
      console.error('Error logging Game Hub interaction:', error);
    }
  }

  /**
   * ? GAME HUB TAB CREATION TRACKING: Update interaction when tab is created
   * Call this when user creates a game tab from Game Hub suggestion
   */
  public async markGameHubTabCreated(
    authUserId: string,
    gameTitle: string,
    conversationId: string
  ): Promise<void> {
    try {
      // Find the most recent Game Hub interaction for this game and user
      // Note: table may not be in generated types yet - using type assertion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('game_hub_interactions')
        .update({
          tab_created: true,
          tab_created_at: new Date(),
          created_conversation_id: conversationId
        })
        .eq('auth_user_id', authUserId)
        .eq('detected_game', gameTitle)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Failed to mark Game Hub tab created:', error);
      } else {
              }
    } catch (error) {
      console.error('Error marking Game Hub tab created:', error);
    }
  }

  /**
   * ? API USAGE TRACKING: Log Gemini API calls to api_usage table
   * Call this after every successful AI response to track costs and usage
   */
  private async logApiUsage(params: {
    userId: string;
    authUserId: string;
    requestType: string; // 'chat', 'game_hub', 'image_analysis', etc.
    tokensUsed: number;
    aiModel: string;
    endpoint?: string;
  }): Promise<void> {
    try {
      // Calculate approximate cost in cents
      // Gemini 2.5 Flash pricing: ~$0.10 per 1M tokens
      const costCents = (params.tokensUsed / 1_000_000) * 10;

      const { error } = await supabase
        .from('api_usage')
        .insert({
          user_id: params.userId,
          auth_user_id: params.authUserId,
          request_type: params.requestType,
          tokens_used: params.tokensUsed,
          cost_cents: costCents,
          ai_model: params.aiModel,
          endpoint: params.endpoint
        });
      
      if (error) {
        console.error('Failed to log API usage:', error);
      }
    } catch (error) {
      console.error('Error logging API usage:', error);
    }
  }
}

export const aiService = new AIService();
