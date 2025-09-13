import { supabase } from './supabase';
import { feedbackSecurityService } from './feedbackSecurityService';
import { authService } from './supabase';
import { userPreferencesService } from './userPreferencesService';
import { characterDetectionService, CharacterInfo, GameLanguageProfile } from './characterDetectionService';

export interface AIContext {
  id?: string;
  user_id: string;
  context_type: 'preferences' | 'behavior' | 'feedback' | 'learning' | 'game_specific';
  context_data: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface AIFeedback {
  id?: string;
  user_id: string;
  conversation_id: string;
  message_id?: string;
  insight_id?: string;
  feedback_type: 'up' | 'down' | 'submitted';
  feedback_text?: string;
  ai_response_context: Record<string, any>;
  user_context: Record<string, any>;
  created_at?: string;
}

export interface AILearning {
  id?: string;
  learning_type: 'response_pattern' | 'user_preference' | 'error_correction' | 'success_pattern';
  pattern_data: Record<string, any>;
  confidence_score: number;
  usage_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserBehavior {
  id?: string;
  user_id: string;
  action_type: string;
  action_data: Record<string, any>;
  timestamp?: string;
  session_id?: string;
  metadata: Record<string, any>;
}

class AIContextService {
  private static instance: AIContextService;
  private userContextCache: Map<string, AIContext[]> = new Map();
  private globalLearningCache: AILearning[] = [];

  static getInstance(): AIContextService {
    if (!AIContextService.instance) {
      AIContextService.instance = new AIContextService();
    }
    return AIContextService.instance;
  }

  // Get current user ID
  private async getCurrentUserId(): Promise<string | null> {
    const authState = authService.getCurrentState();
    return authState.user?.id || null;
  }

  // Store user context data
  async storeUserContext(
    contextType: AIContext['context_type'],
    contextData: Record<string, any>
  ): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      // Get current user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('app_state')
        .eq('auth_user_id', userId)
        .single();

      if (userError) throw userError;

      // Update app_state with AI context
      const currentAppState = userData.app_state || {};
      const currentAIContext = currentAppState.aiContext || {};
      
      const updatedAIContext = {
        ...currentAIContext,
        [contextType]: {
          context_data: contextData,
          updated_at: new Date().toISOString()
        }
      };

      const updatedAppState = {
        ...currentAppState,
        aiContext: updatedAIContext
      };

      // Update user's app_state
      const { error } = await supabase
        .from('users')
        .update({ app_state: updatedAppState })
        .eq('auth_user_id', userId);

      if (error) throw error;

      // Update cache
      this.updateContextCache(userId, contextType, contextData);
      return true;
    } catch (error) {
      console.error('Error in storeUserContext:', error);
      return false;
    }
  }

  // Get user context data
  async getUserContext(contextType?: AIContext['context_type']): Promise<AIContext[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return [];

      // Check cache first
      const cached = this.userContextCache.get(userId);
      if (cached && !contextType) return cached;

      // Get current user data
      const { data: userData, error } = await supabase
        .from('users')
        .select('app_state')
        .eq('auth_user_id', userId)
        .single();

      if (error) throw error;

      // Extract AI context from app_state
      const currentAppState = userData.app_state || {};
      const aiContext = currentAppState.aiContext || {};
      
      let contexts: AIContext[] = [];
      
      if (contextType) {
        // Return specific context type
        if (aiContext[contextType]) {
          contexts = [{
            user_id: userId,
            context_type: contextType,
            context_data: aiContext[contextType].context_data,
            updated_at: aiContext[contextType].updated_at
          }];
        }
      } else {
        // Return all context types
        contexts = Object.entries(aiContext).map(([type, data]) => ({
          user_id: userId,
          context_type: type as AIContext['context_type'],
          context_data: (data as any).context_data,
          updated_at: (data as any).updated_at
        }));
      }

      // Update cache
      if (!contextType) {
        this.userContextCache.set(userId, contexts);
      }

      return contexts;
    } catch (error) {
      console.error('Error in getUserContext:', error);
      return [];
    }
  }

  // Store AI feedback for learning
  async storeAIFeedback(feedback: Omit<AIFeedback, 'id' | 'created_at'>): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      // Get current user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('feedback_data')
        .eq('auth_user_id', userId)
        .single();

      if (userError) throw userError;

      // Update feedback_data with new feedback
      const currentFeedbackData = userData.feedback_data || {};
      const currentFeedback = currentFeedbackData.aiFeedback || [];
      
      const newFeedback = {
        ...feedback,
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString()
      };

      const updatedFeedback = [...currentFeedback, newFeedback];
      const updatedFeedbackData = {
        ...currentFeedbackData,
        aiFeedback: updatedFeedback
      };

      // Update user's feedback_data
      const { error } = await supabase
        .from('users')
        .update({ feedback_data: updatedFeedbackData })
        .eq('auth_user_id', userId);

      if (error) throw error;

      // Trigger learning analysis
      await this.analyzeFeedbackForLearning(feedback);
      return true;
    } catch (error) {
      console.error('Error in storeAIFeedback:', error);
      return false;
    }
  }

  // Store user behavior data
  async trackUserBehavior(
    actionType: string,
    actionData: Record<string, any> = {},
    metadata: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const sessionId = this.getSessionId();

      const behavior: Omit<UserBehavior, 'id' | 'timestamp'> = {
        user_id: userId,
        action_type: actionType,
        action_data: actionData,
        session_id: sessionId,
        metadata
      };

      // Get current user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('behavior_data')
        .eq('auth_user_id', userId)
        .single();

      if (userError) throw userError;

      // Update behavior_data with new behavior entry
      const currentBehaviorData = userData.behavior_data || {};
      const currentBehavior = currentBehaviorData.userBehavior || [];
      
      const newBehaviorEntry = {
        ...behavior,
        id: `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      };

      const updatedBehavior = [...currentBehavior, newBehaviorEntry];
      const updatedBehaviorData = {
        ...currentBehaviorData,
        userBehavior: updatedBehavior
      };

      // Update user's behavior_data
      const { error } = await supabase
        .from('users')
        .update({ behavior_data: updatedBehaviorData })
        .eq('auth_user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error in trackUserBehavior:', error);
      return false;
    }
  }

  // Get global AI learning patterns
  async getGlobalLearningPatterns(): Promise<AILearning[]> {
    try {
      // Check cache first
      if (this.globalLearningCache.length > 0) {
        return this.globalLearningCache;
      }

      // Get learning patterns from app_level table
      const { data, error } = await supabase
        .from('app_level')
        .select('value')
        .eq('key', 'ai_learning_patterns')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      const learningPatterns = data?.value || [];
      
      // Update cache
      this.globalLearningCache = learningPatterns;
      return this.globalLearningCache;
    } catch (error) {
      console.error('Error in getGlobalLearningPatterns:', error);
      return [];
    }
  }

  // Generate comprehensive user context for AI
  async generateUserContextForAI(conversation?: { id: string; title: string; messages?: any[] }): Promise<string> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return '';

      const [
        userContexts,
        userBehavior,
        globalPatterns
      ] = await Promise.all([
        this.getUserContext(),
        this.getUserBehaviorSummary(userId),
        this.getGlobalLearningPatterns()
      ]);

      let contextString = '';

      // Add character and game language context if conversation is provided
      if (conversation) {
        const characterContext = await this.generateCharacterAndGameContext(conversation);
        if (characterContext) {
          contextString += characterContext;
        }
      }

      // Get user preferences for AI personalization
      const userPrefs = await userPreferencesService.getPreferences();
      
      // Add game-specific context (using fallback since method was removed)
      if (userPrefs?.game_genre) {
        const gameContextMap: Record<string, string> = {
          rpg: 'RPG games focus on character development, story progression, and strategic combat.',
          fps: 'FPS games emphasize quick reflexes, map knowledge, and weapon mastery.',
          strategy: 'Strategy games require long-term planning, resource management, and tactical thinking.',
          adventure: 'Adventure games focus on exploration, puzzle-solving, and story discovery.',
          puzzle: 'Puzzle games challenge logical thinking and pattern recognition.',
          simulation: 'Simulation games model real-world systems and require understanding of complex mechanics.',
          sports: 'Sports games require understanding of rules, strategies, and player management.',
          racing: 'Racing games focus on vehicle control, track knowledge, and racing lines.',
          fighting: 'Fighting games require frame data knowledge, combo execution, and matchup understanding.',
          mmo: 'MMO games involve social interaction, group coordination, and long-term progression.'
        };
        const gameSpecificContext = gameContextMap[userPrefs.game_genre] || gameContextMap.rpg;
        contextString += `[GAME_GENRE_CONTEXT: ${gameSpecificContext}]\n`;
      }

      // Add personalized AI instructions (using fallback since method was removed)
      if (userPrefs) {
        const personalizedInstructions = [
          `**User Preferences:**`,
          `- Game Genre: ${userPrefs.game_genre?.toUpperCase() || 'RPG'}`,
          `- Hint Style: ${userPrefs.hint_style?.replace('_', ' ') || 'progressive'}`,
          `- Detail Level: ${userPrefs.detail_level || 'concise'}`,
          `- Spoiler Sensitivity: ${userPrefs.spoiler_sensitivity?.replace('_', ' ') || 'moderate'}`,
          `- AI Personality: ${userPrefs.ai_personality || 'encouraging'}`,
          `- Response Format: ${userPrefs.preferred_response_format?.replace('_', ' ') || 'text with bullets'}`,
          `- Skill Level: ${userPrefs.skill_level || 'intermediate'}`,
          `- Gaming Patterns: ${userPrefs.gaming_patterns?.session_duration || 'medium'} sessions, ${userPrefs.gaming_patterns?.frequency || 'weekly'} play`,
          ``,
          `**Adaptation Instructions:**`,
          `- Adjust response detail based on user's detail level preference`,
          `- Use the specified hint style (${userPrefs.hint_style || 'progressive'})`,
          `- Maintain spoiler sensitivity level: ${userPrefs.spoiler_sensitivity || 'moderate'}`,
          `- Match the ${userPrefs.ai_personality || 'encouraging'} personality style`,
          `- Format responses according to ${userPrefs.preferred_response_format || 'text_with_bullets'} preference`,
          `- Consider user's ${userPrefs.skill_level || 'intermediate'} skill level`,
          `- Adapt to ${userPrefs.gaming_patterns?.session_duration || 'medium'} session preferences`
        ].join('\n');
        
        contextString += `[PERSONALIZED_INSTRUCTIONS: ${personalizedInstructions}]\n`;
      }

      // User preferences and behavior
      const preferences = userContexts.find(c => c.context_type === 'preferences');
      if (preferences?.context_data) {
        contextString += `[USER_PREFERENCES: ${JSON.stringify(preferences.context_data)}]\n`;
      }

      // User behavior patterns
      if (userBehavior) {
        contextString += `[USER_BEHAVIOR: ${JSON.stringify(userBehavior)}]\n`;
      }

      // Global learning patterns
      if (globalPatterns.length > 0) {
        const topPatterns = globalPatterns
          .filter(p => p.confidence_score > 0.7)
          .slice(0, 3);
        
        if (topPatterns.length > 0) {
          contextString += `[GLOBAL_LEARNING: ${JSON.stringify(topPatterns)}]\n`;
        }
      }

      return contextString;
    } catch (error) {
      console.error('Error generating user context for AI:', error);
      return '';
    }
  }

  // Generate character and game-specific language context
  private async generateCharacterAndGameContext(conversation: { id: string; title: string; messages?: any[] }): Promise<string> {
    try {
      let contextString = '';

      // Detect character from messages if available
      if (conversation.messages && conversation.messages.length > 0) {
        const characterInfo = characterDetectionService.detectCharacterFromMessages(conversation.messages);
        if (characterInfo) {
          contextString += `[CHARACTER_INFO: ${JSON.stringify(characterInfo)}]\n`;
        }
      }

      // Get or create game language profile
      const gameId = this.extractGameId(conversation.title);
      if (gameId) {
        const gameProfile = characterDetectionService.getGameLanguageProfile(gameId, conversation.title);
        contextString += `[GAME_LANGUAGE_PROFILE: ${JSON.stringify(gameProfile)}]\n`;
        
        // Add immersive language patterns
        const languagePatterns = characterDetectionService.getImmersiveLanguagePatterns(gameId);
        contextString += `[IMMERSIVE_LANGUAGE_PATTERNS: ${JSON.stringify(languagePatterns)}]\n`;
      }

      return contextString;
    } catch (error) {
      console.warn('Failed to generate character and game context:', error);
      return '';
    }
  }

  // Extract game ID from conversation title
  private extractGameId(title: string): string | null {
    if (!title || title === 'everything-else') return null;
    
    // Convert title to lowercase for matching
    const lowerTitle = title.toLowerCase();
    
    // Common game patterns
    const gamePatterns = [
      { pattern: /elden\s*ring/i, id: 'elden-ring' },
      { pattern: /baldur['']s?\s*gate\s*3/i, id: 'baldurs-gate-3' },
      { pattern: /cyberpunk\s*2077/i, id: 'cyberpunk-2077' },
      { pattern: /zelda.*tears.*kingdom/i, id: 'zelda-tears-kingdom' },
      { pattern: /god\s*of\s*war.*ragnarok/i, id: 'god-of-war-ragnarok' },
      { pattern: /final\s*fantasy\s*xvi/i, id: 'final-fantasy-16' },
      { pattern: /starfield/i, id: 'starfield' },
      { pattern: /diablo\s*iv/i, id: 'diablo-4' },
      { pattern: /hogwarts\s*legacy/i, id: 'hogwarts-legacy' },
      { pattern: /resident\s*evil\s*4/i, id: 'resident-evil-4' }
    ];

    for (const game of gamePatterns) {
      if (game.pattern.test(lowerTitle)) {
        return game.id;
      }
    }

    // Generate a generic ID from the title
    return lowerTitle.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  // Get user behavior summary
  private async getUserBehaviorSummary(userId: string): Promise<Record<string, any> | null> {
    try {
      // Get current user data
      const { data: userData, error } = await supabase
        .from('users')
        .select('behavior_data')
        .eq('auth_user_id', userId)
        .single();

      if (error) throw error;

      // Extract user behavior from behavior_data
      const currentBehaviorData = userData.behavior_data || {};
      const userBehavior = currentBehaviorData.userBehavior || [];
      
      // Filter for last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const recentBehavior = userBehavior.filter((behavior: any) => 
        behavior.timestamp >= thirtyDaysAgo
      );

      // Sort by timestamp descending
      recentBehavior.sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      if (!recentBehavior.length) return null;

      // Analyze behavior patterns
      const behaviorSummary = {
        total_actions: recentBehavior.length,
        action_frequency: {} as Record<string, number>,
        recent_actions: recentBehavior.slice(0, 10).map((b: any) => ({
          type: b.action_type,
          data: b.action_data,
          timestamp: b.timestamp
        }))
      };

      // Count action frequencies
      recentBehavior.forEach((behavior: any) => {
        behaviorSummary.action_frequency[behavior.action_type] = 
          (behaviorSummary.action_frequency[behavior.action_type] || 0) + 1;
      });

      return behaviorSummary;
    } catch (error) {
      console.error('Error getting user behavior summary:', error);
      return null;
    }
  }

  // Analyze feedback for learning
  private async analyzeFeedbackForLearning(feedback: AIFeedback): Promise<void> {
    try {
      // Extract patterns from feedback
      const patterns = this.extractPatternsFromFeedback(feedback);
      
      if (patterns.length === 0) return;

      // Store or update learning patterns
      for (const pattern of patterns) {
        await this.updateLearningPattern(pattern);
      }
    } catch (error) {
      console.error('Error analyzing feedback for learning:', error);
    }
  }

  // Extract patterns from feedback (with security validation)
  private extractPatternsFromFeedback(feedback: AIFeedback): Array<{
    learning_type: AILearning['learning_type'];
    pattern_data: Record<string, any>;
    confidence_score: number;
  }> {
    const patterns: any[] = [];

    // Response pattern analysis
    if (feedback.ai_response_context) {
      const responseLength = feedback.ai_response_context.response_length || 0;
      const hasCode = feedback.ai_response_context.has_code || false;
      const hasImages = feedback.ai_response_context.has_images || false;

      const responsePattern = {
        learning_type: 'response_pattern' as const,
        pattern_data: {
          response_length: responseLength,
          has_code: hasCode,
          has_images: hasImages,
          feedback_type: feedback.feedback_type,
          success: feedback.feedback_type === 'up'
        },
        confidence_score: 0.8
      };

      // SECURITY VALIDATION: Ensure response pattern learning is allowed
      if (feedbackSecurityService.validateLearningScope('response_pattern', responsePattern.pattern_data)) {
        patterns.push(responsePattern);
      }
    }

    // Enhanced feedback analysis for AI learning
    if (feedback.ai_response_context.feedback_category) {
      const feedbackCategory = feedback.ai_response_context.feedback_category;
      const severity = feedback.ai_response_context.severity || 'medium';
      
      const errorCorrectionPattern = {
        learning_type: 'error_correction' as const,
        pattern_data: {
          feedback_category: feedbackCategory,
          severity: severity,
          feedback_type: feedback.feedback_type,
          original_text_length: feedback.ai_response_context.original_text?.length || 0,
          timestamp: feedback.created_at
        },
        confidence_score: severity === 'high' ? 0.9 : severity === 'medium' ? 0.7 : 0.5
      };

      // SECURITY VALIDATION: Ensure error correction learning is allowed
      if (feedbackSecurityService.validateLearningScope('error_correction', errorCorrectionPattern.pattern_data)) {
        patterns.push(errorCorrectionPattern);
      }
    }

    // User preference analysis (ENHANCED - allows broader user experience improvements)
    if (feedback.user_context) {
      const userTier = feedback.user_context.user_tier || 'free';
      const gameGenre = feedback.user_context.game_genre;
      const userProgress = feedback.user_context.user_progress;

      const userPreferencePattern = {
        learning_type: 'user_preference' as const,
        pattern_data: {
          // ENHANCED: Allow broader AI response and user experience preferences
          response_style: feedback.ai_response_context?.response_style || 'default',
          response_length: feedback.ai_response_context?.response_length || 'medium',
          response_tone: feedback.ai_response_context?.response_tone || 'neutral',
          response_detail_level: feedback.ai_response_context?.response_detail_level || 'medium',
          response_format: feedback.ai_response_context?.response_format || 'text',
          response_personality: feedback.ai_response_context?.response_personality || 'helpful',
          response_helpfulness: feedback.ai_response_context?.response_helpfulness || 'high',
          response_clarity: feedback.ai_response_context?.response_clarity || 'high',
          response_engagement: feedback.ai_response_context?.response_engagement || 'medium',
          response_personalization: feedback.ai_response_context?.response_personalization || 'medium',
          response_quality: feedback.ai_response_context?.response_quality || 'high',
          response_effectiveness: feedback.ai_response_context?.response_effectiveness || 'high',
          user_satisfaction: feedback.feedback_type === 'up' ? 'high' : 'low',
          user_engagement: feedback.ai_response_context?.user_engagement || 'medium',
          user_learning: feedback.ai_response_context?.user_learning || 'medium',
          user_progress: feedback.ai_response_context?.user_progress || 'medium',
          user_guidance: feedback.ai_response_context?.user_guidance || 'high',
          user_support: feedback.ai_response_context?.user_support || 'high',
          user_help: feedback.ai_response_context?.user_help || 'high',
          user_assistance: feedback.ai_response_context?.user_assistance || 'high',
          feedback_type: feedback.feedback_type,
          success: feedback.feedback_type === 'up',
          feedback_category: feedback.ai_response_context.feedback_category,
          severity: feedback.ai_response_context.severity,
          game_genre: gameGenre,
          user_tier: userTier,
          current_user_progress: userProgress
        },
        confidence_score: 0.7
      };

      // SECURITY VALIDATION: Ensure user preference learning is allowed for broader improvements
      if (feedbackSecurityService.validateLearningScope('user_preference', userPreferencePattern.pattern_data)) {
        patterns.push(userPreferencePattern);
      }
    }

    // Gaming content analysis (NEW - for gaming-specific improvements)
    if (feedback.ai_response_context?.feedback_category) {
      const gamingContentPattern = {
        learning_type: 'gaming_content' as const,
        pattern_data: {
          gaming_help: feedback.ai_response_context?.gaming_help || 'high',
          gaming_guidance: feedback.ai_response_context?.gaming_guidance || 'high',
          gaming_tips: feedback.ai_response_context?.gaming_tips || 'high',
          gaming_strategy: feedback.ai_response_context?.gaming_strategy || 'medium',
          gaming_advice: feedback.ai_response_context?.gaming_advice || 'high',
          gaming_support: feedback.ai_response_context?.gaming_support || 'high',
          gaming_education: feedback.ai_response_context?.gaming_education || 'medium',
          gaming_learning: feedback.ai_response_context?.gaming_learning || 'medium',
          gaming_progress: feedback.ai_response_context?.gaming_progress || 'medium',
          gaming_improvement: feedback.ai_response_context?.gaming_improvement || 'high',
          gaming_optimization: feedback.ai_response_context?.gaming_optimization || 'medium',
          gaming_enhancement: feedback.ai_response_context?.gaming_enhancement || 'high',
          feedback_type: feedback.feedback_type,
          success: feedback.feedback_type === 'up',
          feedback_category: feedback.ai_response_context.feedback_category,
          severity: feedback.ai_response_context.severity,
          timestamp: feedback.created_at
        },
        confidence_score: 0.8
      };

      // SECURITY VALIDATION: Ensure gaming content learning is allowed
      if (feedbackSecurityService.validateLearningScope('gaming_content', gamingContentPattern.pattern_data)) {
        patterns.push(gamingContentPattern);
      }
    }

    // Success pattern analysis (for thumbs up)
    if (feedback.feedback_type === 'up') {
      const successPattern = {
        learning_type: 'success_pattern' as const,
        pattern_data: {
          response_type: 'positive_feedback',
          user_satisfaction: 'high',
          feedback_type: feedback.feedback_type,
          timestamp: feedback.created_at
        },
        confidence_score: 0.8
      };

      // SECURITY VALIDATION: Ensure success pattern learning is allowed
      if (feedbackSecurityService.validateLearningScope('success_pattern', successPattern.pattern_data)) {
        patterns.push(successPattern);
      }
    }

    return patterns;
  }

  // Update learning pattern
  private async updateLearningPattern(pattern: {
    learning_type: AILearning['learning_type'];
    pattern_data: Record<string, any>;
    confidence_score: number;
  }): Promise<void> {
    try {
      // Get learning patterns from app_level table
      const { data: appLevelData, error: appLevelError } = await supabase
        .from('app_level')
        .select('value')
        .eq('key', 'ai_learning_patterns')
        .single();

      if (appLevelError && appLevelError.code !== 'PGRST116') throw appLevelError;

      const currentPatterns = appLevelData?.value || [];
      
      // Check if pattern already exists
      const existingPatternIndex = currentPatterns.findIndex((p: any) => 
        p.learning_type === pattern.learning_type && 
        JSON.stringify(p.pattern_data) === JSON.stringify(pattern.pattern_data)
      );

      let updatedPatterns: any[];

      if (existingPatternIndex !== -1) {
        // Update existing pattern
        const existingPattern = currentPatterns[existingPatternIndex];
        const newConfidence = (existingPattern.confidence_score + pattern.confidence_score) / 2;
        const newUsageCount = existingPattern.usage_count + 1;

        updatedPatterns = [...currentPatterns];
        updatedPatterns[existingPatternIndex] = {
          ...existingPattern,
          confidence_score: newConfidence,
          usage_count: newUsageCount,
          updated_at: new Date().toISOString()
        };
      } else {
        // Create new pattern
        const newPattern = {
          id: `learning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          learning_type: pattern.learning_type,
          pattern_data: pattern.pattern_data,
          confidence_score: pattern.confidence_score,
          usage_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        updatedPatterns = [...currentPatterns, newPattern];
      }

      // Update app_level table
      const { error: updateError } = await supabase
        .from('app_level')
        .upsert({
          key: 'ai_learning_patterns',
          value: updatedPatterns,
          description: 'AI learning patterns for global knowledge',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (updateError) throw updateError;

      // Clear cache to refresh data
      this.globalLearningCache = [];
    } catch (error) {
      console.error('Error updating learning pattern:', error);
    }
  }

  // Update context cache
  private updateContextCache(
    userId: string,
    contextType: AIContext['context_type'],
    contextData: Record<string, any>
  ): void {
    const existing = this.userContextCache.get(userId) || [];
    const existingIndex = existing.findIndex(c => c.context_type === contextType);

    if (existingIndex >= 0) {
      existing[existingIndex].context_data = contextData;
      existing[existingIndex].updated_at = new Date().toISOString();
    } else {
      existing.push({
        user_id: userId,
        context_type: contextType,
        context_data: contextData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    this.userContextCache.set(userId, existing);
  }

  // Generate session ID
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('otakon_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('otakon_session_id', sessionId);
    }
    return sessionId;
  }

  // Clear cache (useful for testing or logout)
  clearCache(): void {
    this.userContextCache.clear();
    this.globalLearningCache = [];
  }
}

export const aiContextService = AIContextService.getInstance();
