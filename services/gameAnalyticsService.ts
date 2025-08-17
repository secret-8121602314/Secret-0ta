import { supabase } from './supabase';
import { authService } from './supabase';
import { unifiedUsageService } from './unifiedUsageService';

export interface GameActivity {
  activityType: 'pill_created' | 'pill_deleted' | 'pill_modified' |
                'insight_created' | 'insight_deleted' | 'insight_modified' |
                'insight_tab_created' | 'insight_tab_deleted' | 'insight_tab_modified' |
                'insight_content_updated' | 'insight_feedback_given' |
                'game_progress_updated' | 'inventory_changed' | 'objective_set';
  gameId: string;
  gameTitle?: string;
  conversationId: string;
  insightId?: string;
  pillId?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
}

export interface InsightTab {
  conversationId: string;
  tabId: string;
  tabTitle: string;
  tabContent?: string;
  tabType: 'objective' | 'inventory' | 'progress' | 'suggestions' | 'custom';
  isPinned?: boolean;
  orderIndex?: number;
  metadata?: Record<string, any>;
}

export interface InsightModification {
  conversationId: string;
  insightId: string;
  modificationType: 'created' | 'updated' | 'deleted' | 'pinned' | 'reordered';
  oldContent?: string;
  newContent?: string;
  changeSummary?: string;
  metadata?: Record<string, any>;
}

export interface UserFeedback {
  conversationId: string;
  targetType: 'insight' | 'ai_response' | 'pill' | 'tab';
  targetId: string;
  feedbackType: 'up' | 'down' | 'submitted' | 'helpful' | 'not_helpful';
  feedbackText?: string;
  aiResponseContext?: Record<string, any>;
  userContext?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ApiCall {
  apiEndpoint: string;
  apiMethod: string;
  requestSizeBytes?: number;
  responseSizeBytes?: number;
  responseTimeMs: number;
  success: boolean;
  errorMessage?: string;
  requestMetadata?: Record<string, any>;
  responseMetadata?: Record<string, any>;
}

export interface UserQuery {
  conversationId: string;
  queryType: 'text' | 'image' | 'voice' | 'screenshot';
  queryText?: string;
  hasImages?: boolean;
  imageCount?: number;
  queryLength?: number;
  queryTokens?: number;
  aiResponseLength?: number;
  aiResponseTokens?: number;
  responseTimeMs: number;
  success: boolean;
  errorMessage?: string;
  gameContext?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface GameActivitySummary {
  totalActivities: number;
  pillsCreated: number;
  insightsCreated: number;
  tabsCreated: number;
  feedbackGiven: number;
  avgResponseTimeMs: number;
}

export interface GlobalApiUsageStats {
  apiEndpoint: string;
  totalCalls: number;
  successRate: number;
  avgResponseTimeMs: number;
  callsByTier: Record<string, number>;
  totalDataTransferredMb: number;
}

export interface TierUsageComparison {
  userTier: string;
  totalUsers: number;
  totalQueries: number;
  avgQueriesPerUser: number;
  totalApiCalls: number;
  avgResponseTimeMs: number;
  totalFeedbackGiven: number;
}

class GameAnalyticsService {
  private static instance: GameAnalyticsService;

  static getInstance(): GameAnalyticsService {
    if (!GameAnalyticsService.instance) {
      GameAnalyticsService.instance = new GameAnalyticsService();
    }
    return GameAnalyticsService.instance;
  }

  // ===== GAME ACTIVITY TRACKING =====

  /**
   * Track a game-related activity
   */
  async trackGameActivity(activity: GameActivity): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const { error } = await supabase
        .from('game_activities')
        .insert({
          user_id: userId,
          activity_type: activity.activityType,
          game_id: activity.gameId,
          game_title: activity.gameTitle,
          conversation_id: activity.conversationId,
          insight_id: activity.insightId,
          pill_id: activity.pillId,
          old_value: activity.oldValue,
          new_value: activity.newValue,
          metadata: activity.metadata
        });

      if (error) {
        console.error('Error tracking game activity:', error);
        return false;
      }

      console.log(`🎮 Game activity tracked: ${activity.activityType} for ${activity.gameId}`);
      return true;
    } catch (error) {
      console.error('Error in trackGameActivity:', error);
      return false;
    }
  }

  /**
   * Track insight tab creation/modification
   */
  async trackInsightTab(tab: InsightTab, action: 'created' | 'updated' | 'deleted'): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      if (action === 'created' || action === 'updated') {
        const { error } = await supabase
          .from('insight_tabs')
          .upsert({
            user_id: userId,
            conversation_id: tab.conversationId,
            tab_id: tab.tabId,
            tab_title: tab.tabTitle,
            tab_content: tab.tabContent,
            tab_type: tab.tabType,
            is_pinned: tab.isPinned || false,
            order_index: tab.orderIndex || 0,
            metadata: tab.metadata
          }, {
            onConflict: 'conversation_id,tab_id'
          });

        if (error) {
          console.error('Error tracking insight tab:', error);
          return false;
        }
      }

      // Track the activity
      await this.trackGameActivity({
        activityType: `insight_tab_${action}` as any,
        gameId: 'unknown', // Will be extracted from conversation context
        conversationId: tab.conversationId,
        newValue: tab,
        metadata: { action, tabType: tab.tabType }
      });

      console.log(`📊 Insight tab ${action}: ${tab.tabTitle}`);
      return true;
    } catch (error) {
      console.error('Error in trackInsightTab:', error);
      return false;
    }
  }

  /**
   * Track insight modifications
   */
  async trackInsightModification(modification: InsightModification): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const { error } = await supabase
        .from('insight_modifications')
        .insert({
          user_id: userId,
          conversation_id: modification.conversationId,
          insight_id: modification.insightId,
          modification_type: modification.modificationType,
          old_content: modification.oldContent,
          new_content: modification.newContent,
          change_summary: modification.changeSummary,
          metadata: modification.metadata
        });

      if (error) {
        console.error('Error tracking insight modification:', error);
        return false;
      }

      console.log(`✏️ Insight modification tracked: ${modification.modificationType}`);
      return true;
    } catch (error) {
      console.error('Error in trackInsightModification:', error);
      return false;
    }
  }

  // ===== USER FEEDBACK TRACKING =====

  /**
   * Track user feedback on insights, AI responses, etc.
   */
  async trackUserFeedback(feedback: UserFeedback): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const { error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: userId,
          conversation_id: feedback.conversationId,
          target_type: feedback.targetType,
          target_id: feedback.targetId,
          feedback_type: feedback.feedbackType,
          feedback_text: feedback.feedbackText,
          ai_response_context: feedback.aiResponseContext,
          user_context: feedback.userContext,
          metadata: feedback.metadata
        });

      if (error) {
        console.error('Error tracking user feedback:', error);
        return false;
      }

      console.log(`👍 User feedback tracked: ${feedback.feedbackType} on ${feedback.targetType}`);
      return true;
    } catch (error) {
      console.error('Error in trackUserFeedback:', error);
      return false;
    }
  }

  // ===== API USAGE TRACKING =====

  /**
   * Track an API call made by the user
   */
  async trackApiCall(apiCall: ApiCall): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const userTier = unifiedUsageService.getTier();

      const { error } = await supabase
        .from('api_calls')
        .insert({
          user_id: userId,
          api_endpoint: apiCall.apiEndpoint,
          api_method: apiCall.apiMethod,
          user_tier: userTier,
          request_size_bytes: apiCall.requestSizeBytes,
          response_size_bytes: apiCall.responseSizeBytes,
          response_time_ms: apiCall.responseTimeMs,
          success: apiCall.success,
          error_message: apiCall.errorMessage,
          request_metadata: apiCall.requestMetadata,
          response_metadata: apiCall.responseMetadata
        });

      if (error) {
        console.error('Error tracking API call:', error);
        return false;
      }

      console.log(`🌐 API call tracked: ${apiCall.apiMethod} ${apiCall.apiEndpoint} (${apiCall.responseTimeMs}ms)`);
      return true;
    } catch (error) {
      console.error('Error in trackApiCall:', error);
      return false;
    }
  }

  // ===== USER QUERY TRACKING =====

  /**
   * Track a user query and AI response
   */
  async trackUserQuery(query: UserQuery): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const userTier = unifiedUsageService.getTier();

      const { error } = await supabase
        .from('user_queries')
        .insert({
          user_id: userId,
          conversation_id: query.conversationId,
          query_type: query.queryType,
          query_text: query.queryText,
          has_images: query.hasImages || false,
          image_count: query.imageCount || 0,
          user_tier: userTier,
          query_length: query.queryLength || (query.queryText ? query.queryText.length : 0),
          query_tokens: query.queryTokens,
          ai_response_length: query.aiResponseLength,
          ai_response_tokens: query.aiResponseTokens,
          response_time_ms: query.responseTimeMs,
          success: query.success,
          error_message: query.errorMessage,
          game_context: query.gameContext,
          metadata: query.metadata
        });

      if (error) {
        console.error('Error tracking user query:', error);
        return false;
      }

      console.log(`💬 User query tracked: ${query.queryType} (${query.responseTimeMs}ms)`);
      return true;
    } catch (error) {
      console.error('Error in trackUserQuery:', error);
      return false;
    }
  }

  // ===== ANALYTICS QUERIES =====

  /**
   * Get user's game activity summary
   */
  async getUserGameSummary(
    startDate?: Date,
    endDate?: Date
  ): Promise<GameActivitySummary | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .rpc('get_user_game_summary', {
          user_uuid: userId,
          start_date: startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: endDate?.toISOString() || new Date().toISOString()
        });

      if (error) {
        console.error('Error getting user game summary:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error in getUserGameSummary:', error);
      return null;
    }
  }

  /**
   * Get global API usage statistics
   */
  async getGlobalApiUsageStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<GlobalApiUsageStats[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_global_api_usage_stats', {
          start_date: startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: endDate?.toISOString() || new Date().toISOString()
        });

      if (error) {
        console.error('Error getting global API usage stats:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getGlobalApiUsageStats:', error);
      return [];
    }
  }

  /**
   * Get tier usage comparison
   */
  async getTierUsageComparison(
    startDate?: Date,
    endDate?: Date
  ): Promise<TierUsageComparison[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_tier_usage_comparison', {
          start_date: startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: endDate?.toISOString() || new Date().toISOString()
        });

      if (error) {
        console.error('Error getting tier usage comparison:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTierUsageComparison:', error);
      return [];
    }
  }

  // ===== QUICK TRACKING HELPERS =====

  /**
   * Track pill creation
   */
  async trackPillCreated(
    gameId: string,
    gameTitle: string,
    conversationId: string,
    pillId: string,
    pillContent: any,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    return this.trackGameActivity({
      activityType: 'pill_created',
      gameId,
      gameTitle,
      conversationId,
      pillId,
      newValue: pillContent,
      metadata
    });
  }

  /**
   * Track insight creation
   */
  async trackInsightCreated(
    gameId: string,
    gameTitle: string,
    conversationId: string,
    insightId: string,
    insightContent: any,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    return this.trackGameActivity({
      activityType: 'insight_created',
      gameId,
      gameTitle,
      conversationId,
      insightId,
      newValue: insightContent,
      metadata
    });
  }

  /**
   * Track insight tab creation
   */
  async trackInsightTabCreated(
    conversationId: string,
    tabId: string,
    tabTitle: string,
    tabType: InsightTab['tabType'],
    metadata?: Record<string, any>
  ): Promise<boolean> {
    return this.trackInsightTab({
      conversationId,
      tabId,
      tabTitle,
      tabType,
      metadata
    }, 'created');
  }

  /**
   * Track feedback on AI response
   */
  async trackAIResponseFeedback(
    conversationId: string,
    messageId: string,
    feedbackType: UserFeedback['feedbackType'],
    feedbackText?: string,
    aiResponseContext?: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    return this.trackUserFeedback({
      conversationId,
      targetType: 'ai_response',
      targetId: messageId,
      feedbackType,
      feedbackText,
      aiResponseContext,
      metadata
    });
  }

  // ===== UTILITY METHODS =====

  /**
   * Get current user ID
   */
  private async getCurrentUserId(): Promise<string | null> {
    try {
      const authState = authService.getAuthState();
      return authState.user?.id || null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  }

  /**
   * Extract game context from conversation
   */
  extractGameContext(conversation: any): { gameId: string; gameTitle: string } {
    // Handle undefined/null conversations gracefully
    if (!conversation) {
      return {
        gameId: 'unknown',
        gameTitle: 'Unknown Game'
      };
    }

    // Extract game information from conversation context with better fallbacks
    const gameId = conversation.gameId || 
                   conversation.id || 
                   conversation.title || 
                   'unknown';
    
    const gameTitle = conversation.title || 
                      conversation.gameTitle || 
                      conversation.gameId || 
                      'Unknown Game';

    return {
      gameId: String(gameId), // Ensure it's a string
      gameTitle: String(gameTitle) // Ensure it's a string
    };
  }

  /**
   * Calculate response size in bytes
   */
  calculateResponseSize(response: any): number {
    try {
      return new Blob([JSON.stringify(response)]).size;
    } catch {
      return 0;
    }
  }

  /**
   * Track knowledge base usage
   */
  async trackKnowledgeBaseUsage(
    gameTitle: string,
    query: string,
    confidence: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('api_calls')
        .insert([{
          api_endpoint: 'knowledge_base',
          api_method: 'GET',
          request_size_bytes: query.length,
          response_size_bytes: 0, // Knowledge base responses are instant
          response_time_ms: 0,
          success: true,
          request_metadata: {
            game_title: gameTitle,
            query,
            confidence,
            source: 'knowledge_base',
            ...metadata,
          },
        }]);

      if (error) throw error;
      console.log('Knowledge base usage tracked:', gameTitle, confidence);
    } catch (error) {
      console.error('Error tracking knowledge base usage:', error);
    }
  }

  /**
   * Track knowledge learning
   */
  async trackKnowledgeLearning(
    gameTitle: string,
    query: string,
    responseLength: number,
    source: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('api_calls')
        .insert([{
          api_endpoint: 'knowledge_learning',
          api_method: 'POST',
          request_size_bytes: query.length,
          response_size_bytes: responseLength,
          response_time_ms: 0,
          success: true,
          request_metadata: {
            game_title: gameTitle,
            query,
            response_length: responseLength,
            source,
            learning_type: 'ai_response',
            ...metadata,
          },
        }]);

      if (error) throw error;
      console.log('Knowledge learning tracked:', gameTitle, source);
    } catch (error) {
      console.error('Error tracking knowledge learning:', error);
    }
  }
}

export const gameAnalyticsService = GameAnalyticsService.getInstance();
