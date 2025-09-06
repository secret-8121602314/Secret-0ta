import { GoogleGenAI, GenerateContentResponse, Part, Content, Chat, Type } from "@google/genai";
import { ChatMessage, Conversation, GeminiModel, insightTabsConfig, PlayerProfile, GameContext, EnhancedInsightTab } from "./types";
import { profileService } from "./profileService";
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
import type { TaskCompletionPrompt } from './taskCompletionPromptingService';

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

// NEW: Interface for detected tasks
export interface DetectedTask {
  title: string;
  description: string;
  category: 'quest' | 'boss' | 'exploration' | 'item' | 'character' | 'custom';
  confidence: number;
  source: string;
}

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

export class UnifiedAIService extends BaseService {
  private ai: GoogleGenAI;
  private chatSessions: Record<string, { chat: Chat, model: GeminiModel }> = {};
  private config: AIConfig;
  private usedPrompts: Set<string> = new Set();
  private insightCache: Map<string, InsightResult[]> = new Map();
  private readonly COOLDOWN_DURATION = 60 * 60 * 1000; // 1 hour

  constructor() {
    super();
    
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
      console.warn("Gemini API Key not found. Please set the API_KEY environment variable.");
    }
    
    this.ai = new GoogleGenAI({ apiKey: API_KEY! });
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
        content: processedResponse.text,
        relevance: 1.0
      });
      
      // Update usage tracking
      await this.updateUsageTracking(processedResponse.metadata);

      // Generate progressive insight updates in the background (non-blocking)
      let progressiveUpdates: Record<string, { title: string; content: string }> = {};
      if (conversation.id !== 'everything-else' && conversation.insights) {
        try {
          const { progressiveInsightService } = await import('./progressiveInsightService');
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
              processedResponse.text,
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
          const { otakuDiaryService } = await import('./otakuDiaryService');
          
          // Get central tasks (user-created + AI-generated tasks they added)
          const centralTasks = await otakuDiaryService.getCentralTasks(conversation.id);
          
          // Get AI-generated tasks (for Pro/Vanguard users when no central tasks)
          const aiGeneratedTasks = await otakuDiaryService.getAISuggestedTasks(conversation.id);
          
          const { taskCompletionPromptingService } = await import('./taskCompletionPromptingService');
          taskCompletionPrompt = taskCompletionPromptingService.generateCompletionPrompt(
            conversation.id,
            userTier,
            centralTasks,
            aiGeneratedTasks
          );
          
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
            tab.instruction,
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

  private getOptimalModel(task: 'chat' | 'insight_generation' | 'image_analysis'): GeminiModel {
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
    const userFirstName = await profileService.getFirstName();
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
    const suggestionsMatch = response.match(/\[OTAKON_SUGGESTIONS:\s*\[(.*?)\]\]/s);
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
      .replace(/\[OTAKON_SUGGESTIONS:.*?\]/gs, '')
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
    const baseInstruction = await this.getSystemInstruction(conversation, hasImages);
    
    // Get long-term context
    const longTermContext = longTermMemoryService.getLongTermContext(conversation.id);
    
    // Get screenshot timeline context
    const screenshotTimelineContext = screenshotTimelineService.getTimelineContext(conversation.id);
    
    // Get game-specific timeline context if we have a game name
    const gameSpecificTimelineContext = conversation.title && conversation.title !== 'Everything Else' ?
      screenshotTimelineService.getGameSpecificTimelineContext(conversation.id, conversation.title) : '';
    
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

  // NEW: Get insight tab context to prevent repetition
  private getInsightTabContext(conversation: Conversation): string {
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
      // Import context summarization service dynamically
      const { contextSummarizationService } = require('./contextSummarizationService');
      return contextSummarizationService.getContextSummaryForAI(conversationId);
    } catch (error) {
      console.warn('Context summarization service not available:', error);
      return '';
    }
  }

  // NEW: Get completed tasks context for AI awareness
  private async getCompletedTasksContext(conversationId: string): Promise<string> {
    try {
      const { otakuDiaryService } = await import('./otakuDiaryService');
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
          contextString += `   Details: ${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}\n`;
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
  private async generateSuggestedTasks(
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

  cleanup(): void {
    console.log('🧹 UnifiedAIService: Cleanup called');
    this.chatSessions = {};
    this.insightCache.clear();
    this.usedPrompts.clear();
  }
}

// Export singleton instance
export const unifiedAIService = ServiceFactory.create(UnifiedAIService);
