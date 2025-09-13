import { useCallback, useEffect, useRef } from 'react';
import { gameAnalyticsService, GameActivity, InsightTab, InsightModification, UserFeedback, ApiCall, UserQuery } from '../services/gameAnalyticsService';

/**
 * Hook for easy game analytics tracking in React components
 */
export const useGameAnalytics = () => {
  const apiCallTimers = useRef<Map<string, number>>(new Map());
  const queryTimers = useRef<Map<string, number>>(new Map());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up any active timers
      apiCallTimers.current.clear();
      queryTimers.current.clear();
    };
  }, []);

  // ===== GAME ACTIVITY TRACKING =====

  const trackGameActivity = useCallback((
    activity: GameActivity
  ) => {
    return gameAnalyticsService.trackGameActivity(activity);
  }, []);

  const trackPillCreated = useCallback((
    gameId: string,
    gameTitle: string,
    conversationId: string,
    pillId: string,
    pillContent: any,
    metadata?: Record<string, any>
  ) => {
    return gameAnalyticsService.trackPillCreated(
      gameId,
      gameTitle,
      conversationId,
      pillId,
      pillContent,
      metadata
    );
  }, []);

  const trackPillDeleted = useCallback((
    gameId: string,
    gameTitle: string,
    conversationId: string,
    pillId: string,
    oldPillContent: any,
    metadata?: Record<string, any>
  ) => {
    return gameAnalyticsService.trackGameActivity({
      activityType: 'pill_deleted',
      gameId,
      gameTitle,
      conversationId,
      pillId,
      oldValue: oldPillContent,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        deletedAt: new Date().toISOString()
      }
    });
  }, []);

  const trackPillModified = useCallback((
    gameId: string,
    gameTitle: string,
    conversationId: string,
    pillId: string,
    oldPillContent: any,
    newPillContent: any,
    metadata?: Record<string, any>
  ) => {
    return gameAnalyticsService.trackGameActivity({
      activityType: 'pill_modified',
      gameId,
      gameTitle,
      conversationId,
      pillId,
      oldValue: oldPillContent,
      newValue: newPillContent,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      }
    });
  }, []);

  // ===== INSIGHT TRACKING =====

  const trackInsightCreated = useCallback((
    gameId: string,
    gameTitle: string,
    conversationId: string,
    insightId: string,
    insightContent: any,
    metadata?: Record<string, any>
  ) => {
    return gameAnalyticsService.trackInsightCreated(
      gameId,
      gameTitle,
      conversationId,
      insightId,
      insightContent,
      metadata
    );
  }, []);

  const trackInsightDeleted = useCallback((
    gameId: string,
    gameTitle: string,
    conversationId: string,
    insightId: string,
    oldInsightContent: any,
    metadata?: Record<string, any>
  ) => {
    return gameAnalyticsService.trackGameActivity({
      activityType: 'insight_deleted',
      gameId,
      gameTitle,
      conversationId,
      insightId,
      oldValue: oldInsightContent,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        deletedAt: new Date().toISOString()
      }
    });
  }, []);

  const trackInsightModified = useCallback((
    gameId: string,
    gameTitle: string,
    conversationId: string,
    insightId: string,
    oldInsightContent: any,
    newInsightContent: any,
    metadata?: Record<string, any>
  ) => {
    return gameAnalyticsService.trackGameActivity({
      activityType: 'insight_modified',
      gameId,
      gameTitle,
      conversationId,
      insightId,
      oldValue: oldInsightContent,
      newValue: newInsightContent,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      }
    });
  }, []);

  const trackInsightTab = useCallback((
    tab: InsightTab,
    action: 'created' | 'updated' | 'deleted'
  ) => {
    return gameAnalyticsService.trackInsightTab(tab, action);
  }, []);

  const trackInsightTabCreated = useCallback((
    conversationId: string,
    tabId: string,
    tabTitle: string,
    tabType: InsightTab['tabType'],
    metadata?: Record<string, any>
  ) => {
    return gameAnalyticsService.trackInsightTabCreated(
      conversationId,
      tabId,
      tabTitle,
      tabType,
      metadata
    );
  }, []);

  const trackInsightModification = useCallback((
    modification: InsightModification
  ) => {
    return gameAnalyticsService.trackInsightModification(modification);
  }, []);

  // ===== USER FEEDBACK TRACKING =====

  const trackUserFeedback = useCallback((
    feedback: UserFeedback
  ) => {
    return gameAnalyticsService.trackUserFeedback(feedback);
  }, []);

  const trackAIResponseFeedback = useCallback((
    conversationId: string,
    messageId: string,
    feedbackType: UserFeedback['feedbackType'],
    feedbackText?: string,
    aiResponseContext?: Record<string, any>,
    metadata?: Record<string, any>
  ) => {
    return gameAnalyticsService.trackAIResponseFeedback(
      conversationId,
      messageId,
      feedbackType,
      feedbackText,
      aiResponseContext,
      metadata
    );
  }, []);

  const trackInsightFeedback = useCallback((
    conversationId: string,
    insightId: string,
    feedbackType: UserFeedback['feedbackType'],
    feedbackText?: string,
    metadata?: Record<string, any>
  ) => {
    return gameAnalyticsService.trackUserFeedback({
      conversationId,
      targetType: 'insight',
      targetId: insightId,
      feedbackType,
      feedbackText,
      metadata
    });
  }, []);

  // ===== API USAGE TRACKING =====

  const startApiCallTimer = useCallback((endpoint: string) => {
    apiCallTimers.current.set(endpoint, Date.now());
  }, []);

  const stopApiCallTimer = useCallback((
    endpoint: string,
    method: string,
    success: boolean,
    requestSize?: number,
    responseSize?: number,
    errorMessage?: string,
    metadata?: Record<string, any>
  ) => {
    const startTime = apiCallTimers.current.get(endpoint);
    if (!startTime) {
      console.warn(`API call timer not found: ${endpoint}`);
      return;
    }

    const responseTimeMs = Date.now() - startTime;
    apiCallTimers.current.delete(endpoint);

    const apiCall: ApiCall = {
      apiEndpoint: endpoint,
      apiMethod: method,
      requestSizeBytes: requestSize,
      responseSizeBytes: responseSize,
      responseTimeMs,
      success,
      errorMessage,
      requestMetadata: metadata,
      responseMetadata: {
        timestamp: new Date().toISOString(),
        endpoint,
        method
      }
    };

    gameAnalyticsService.trackApiCall(apiCall);
  }, []);

  const trackApiCall = useCallback((
    apiCall: ApiCall
  ) => {
    return gameAnalyticsService.trackApiCall(apiCall);
  }, []);

  // ===== USER QUERY TRACKING =====

  const startQueryTimer = useCallback((queryId: string) => {
    queryTimers.current.set(queryId, Date.now());
  }, []);

  const stopQueryTimer = useCallback((
    queryId: string,
    query: UserQuery
  ) => {
    const startTime = queryTimers.current.get(queryId);
    if (!startTime) {
      console.warn(`Query timer not found: ${queryId}`);
      return;
    }

    const responseTimeMs = Date.now() - startTime;
    queryTimers.current.delete(queryId);

    // Update query with actual response time
    const updatedQuery = { ...query, responseTimeMs };
    gameAnalyticsService.trackUserQuery(updatedQuery);
  }, []);

  const trackUserQuery = useCallback((
    query: UserQuery
  ) => {
    return gameAnalyticsService.trackUserQuery(query);
  }, []);

  // ===== QUICK TRACKING HELPERS =====

  const trackGameProgressUpdate = useCallback((
    gameId: string,
    gameTitle: string,
    conversationId: string,
    oldProgress: any,
    newProgress: any,
    metadata?: Record<string, any>
  ) => {
    return gameAnalyticsService.trackGameActivity({
      activityType: 'game_progress_updated',
      gameId,
      gameTitle,
      conversationId,
      oldValue: oldProgress,
      newValue: newProgress,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        progressUpdatedAt: new Date().toISOString()
      }
    });
  }, []);

  const trackInventoryChange = useCallback((
    gameId: string,
    gameTitle: string,
    conversationId: string,
    oldInventory: any,
    newInventory: any,
    metadata?: Record<string, any>
  ) => {
    return gameAnalyticsService.trackGameActivity({
      activityType: 'inventory_changed',
      gameId,
      gameTitle,
      conversationId,
      oldValue: oldInventory,
      newValue: newInventory,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        inventoryChangedAt: new Date().toISOString()
      }
    });
  }, []);

  const trackObjectiveSet = useCallback((
    gameId: string,
    gameTitle: string,
    conversationId: string,
    objective: any,
    metadata?: Record<string, any>
  ) => {
    return gameAnalyticsService.trackGameActivity({
      activityType: 'objective_set',
      gameId,
      gameTitle,
      conversationId,
      newValue: objective,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        objectiveSetAt: new Date().toISOString()
      }
    });
  }, []);

  // ===== ANALYTICS QUERIES =====

  const getUserGameSummary = useCallback((
    startDate?: Date,
    endDate?: Date
  ) => {
    return gameAnalyticsService.getUserGameSummary(startDate, endDate);
  }, []);

  const getGlobalApiUsageStats = useCallback((
    startDate?: Date,
    endDate?: Date
  ) => {
    return gameAnalyticsService.getGlobalApiUsageStats(startDate, endDate);
  }, []);

  const getTierUsageComparison = useCallback((
    startDate?: Date,
    endDate?: Date
  ) => {
    return gameAnalyticsService.getTierUsageComparison(startDate, endDate);
  }, []);

  return {
    // Game activity tracking
    trackGameActivity,
    trackPillCreated,
    trackPillDeleted,
    trackPillModified,
    
    // Insight tracking
    trackInsightCreated,
    trackInsightDeleted,
    trackInsightModified,
    trackInsightTab,
    trackInsightTabCreated,
    trackInsightModification,
    
    // User feedback tracking
    trackUserFeedback,
    trackAIResponseFeedback,
    trackInsightFeedback,
    
    // API usage tracking
    startApiCallTimer,
    stopApiCallTimer,
    trackApiCall,
    
    // User query tracking
    startQueryTimer,
    stopQueryTimer,
    trackUserQuery,
    
    // Quick tracking helpers
    trackGameProgressUpdate,
    trackInventoryChange,
    trackObjectiveSet,
    
    // Analytics queries
    getUserGameSummary,
    getGlobalApiUsageStats,
    getTierUsageComparison,
  };
};
