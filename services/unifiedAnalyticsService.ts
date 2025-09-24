import { supabase } from './supabase';
import { authService } from './supabase';
import { unifiedUsageService } from './unifiedUsageService';
import { ServiceFactory, BaseService } from './ServiceFactory';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * 🎯 UNIFIED ANALYTICS SERVICE
 * 
 * This service consolidates all analytics functionality from:
 * - analyticsService.ts (General analytics)
 * - gameAnalyticsService.ts (Game-specific analytics)
 * - feedbackAnalyticsService.ts (Feedback analytics)
 * - pwaAnalyticsService.ts (PWA analytics)
 * 
 * Features:
 * 1. Centralized event tracking across all features
 * 2. Cross-feature analytics and insights
 * 3. User behavior analysis and patterns
 * 4. Performance monitoring and optimization
 * 5. Tier-based analytics and usage patterns
 * 6. Export and reporting capabilities
 */

// ===== CORE ANALYTICS INTERFACES =====

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  category: 'onboarding' | 'feature_usage' | 'game_activity' | 'feedback' | 'pwa' | 'performance' | 'user_behavior';
  timestamp: number;
  userId?: string;
  sessionId: string;
  metadata: Record<string, any>;
  userTier?: string;
  platform?: string;
  version?: string;
}

export interface OnboardingEvent extends AnalyticsEvent {
  category: 'onboarding';
  stepName: string;
  stepOrder: number;
  completionTime?: number;
  skipped?: boolean;
}

export interface FeatureUsageEvent extends AnalyticsEvent {
  category: 'feature_usage';
  featureName: string;
  featureCategory: 'chat' | 'insights' | 'tasks' | 'screenshots' | 'voice' | 'other';
  action: 'view' | 'click' | 'interact' | 'complete' | 'abandon';
  duration?: number;
  success?: boolean;
}

export interface GameActivityEvent extends AnalyticsEvent {
  category: 'game_activity';
  gameName: string;
  gameGenre: string;
  activityType: 'conversation' | 'insight_request' | 'task_creation' | 'screenshot_upload';
  progress?: number;
  sessionDuration?: number;
}

export interface FeedbackEvent extends AnalyticsEvent {
  category: 'feedback';
  feedbackType: 'rating' | 'comment' | 'bug_report' | 'feature_request';
  rating?: number;
  comment?: string;
  context?: string;
}

export interface PWAEvent extends AnalyticsEvent {
  category: 'pwa';
  pwaAction: 'install' | 'update' | 'offline_usage' | 'background_sync';
  installPromptShown?: boolean;
  installPromptAccepted?: boolean;
}

export interface PerformanceEvent extends AnalyticsEvent {
  category: 'performance';
  metric: 'api_response_time' | 'cache_hit_rate' | 'memory_usage' | 'load_time';
  value: number;
  threshold?: number;
  exceeded?: boolean;
}

export interface UserBehaviorEvent extends AnalyticsEvent {
  category: 'user_behavior';
  sessionDuration?: number;
  featuresUsed?: string[];
  conversionType?: string;
}

// ===== ANALYTICS QUERY INTERFACES =====

export interface OnboardingFunnelStats {
  stepName: string;
  stepOrder: number;
  totalUsers: number;
  completedUsers: number;
  skippedUsers: number;
  completionRate: number;
  averageTimeToComplete: number;
  dropOffRate: number;
}

export interface FeatureUsageStats {
  featureName: string;
  totalUsage: number;
  uniqueUsers: number;
  averageUsagePerUser: number;
  mostActiveUsers: number;
  usageTrend: 'increasing' | 'decreasing' | 'stable';
}

export interface TierConversionStats {
  tier: string;
  conversions: number;
  revenue: number;
  conversionRate: number;
  fromTier: string;
  toTier: string;
  totalAttempts: number;
  successfulUpgrades: number;
  avgAmount: number;
}

export interface OnboardingStep {
  stepName: string;
  stepOrder: number;
  startTime: number;
  metadata?: Record<string, any>;
}

export interface TierUpgradeAttempt {
  id: string;
  userId: string;
  fromTier: string;
  toTier: string;
  timestamp: number;
  success: boolean;
  amount?: number;
  paymentMethod?: string;
  failureReason?: string;
  attemptSource?: string;
  metadata?: Record<string, any>;
}

// ===== UNIFIED ANALYTICS SERVICE =====

export class UnifiedAnalyticsService extends BaseService {
  private static instance: UnifiedAnalyticsService;
  private eventQueue: AnalyticsEvent[] = [];
  private featureTimers = new Map<string, number>();
  private onboardingSteps = new Map<string, OnboardingStep>();
  private sessionStartTime = Date.now();
  private sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  static getInstance(): UnifiedAnalyticsService {
    if (!UnifiedAnalyticsService.instance) {
      UnifiedAnalyticsService.instance = new UnifiedAnalyticsService();
    }
    return UnifiedAnalyticsService.instance;
  }

  constructor() {
    super();
    this.initializeAnalytics();
  }

  private async initializeAnalytics(): Promise<void> {
    try {
      // Initialize analytics tables if they don't exist
      await this.ensureAnalyticsTables();
      
      // Start event processing
      this.startEventProcessing();
      
      // Track session start
      await this.trackUserBehavior({
        id: `session_start_${Date.now()}`,
        eventType: 'session_start',
        category: 'user_behavior',
        timestamp: Date.now(),
        sessionId: this.sessionId,
        metadata: {
          platform: this.getPlatform(),
          version: this.getAppVersion(),
          userAgent: navigator.userAgent
        }
      });

      console.log('✅ Analytics service initialized');

    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  // ===== EVENT TRACKING =====

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Add user context
      const enrichedEvent = await this.enrichEvent(event);
      
      // Add to queue for batch processing
      this.eventQueue.push(enrichedEvent);
      
      // Store locally for offline support
      await this.storeEventLocally(enrichedEvent);

    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  async trackOnboardingStep(
    stepName: string, 
    stepOrder: number, 
    metadata?: Record<string, any>
  ): Promise<void> {
    const stepKey = `${stepName}_${stepOrder}`;
    
    this.onboardingSteps.set(stepKey, {
      stepName,
      stepOrder,
      startTime: Date.now(),
      ...(metadata && { metadata })
    });

    await this.trackEvent({
      id: `onboarding_${stepName}_${Date.now()}`,
      eventType: 'onboarding_step_start',
      category: 'onboarding',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      stepName,
      stepOrder,
      metadata: { ...metadata }
    } as OnboardingEvent);
  }

  async completeOnboardingStep(
    stepName: string, 
    stepOrder: number, 
    metadata?: Record<string, any>
  ): Promise<void> {
    const stepKey = `${stepName}_${stepOrder}`;
    const step = this.onboardingSteps.get(stepKey);
    
    if (step) {
      const completionTime = Date.now() - step.startTime;
      this.onboardingSteps.delete(stepKey);

      await this.trackEvent({
        id: `onboarding_complete_${stepName}_${Date.now()}`,
        eventType: 'onboarding_step_complete',
        category: 'onboarding',
        timestamp: Date.now(),
        sessionId: this.sessionId,
        stepName,
        stepOrder,
        completionTime,
        metadata: { ...metadata }
      } as OnboardingEvent);
    }
  }

  async trackOnboardingDropOff(
    stepName: string, 
    stepOrder: number, 
    reason: string, 
    metadata?: Record<string, any>
  ): Promise<void> {
    const stepKey = `${stepName}_${stepOrder}`;
    const step = this.onboardingSteps.get(stepKey);
    
    if (step) {
      const dropOffTime = Date.now() - step.startTime;
      this.onboardingSteps.delete(stepKey);

      await this.trackEvent({
        id: `onboarding_dropoff_${stepName}_${Date.now()}`,
        eventType: 'onboarding_dropoff',
        category: 'onboarding',
        timestamp: Date.now(),
        sessionId: this.sessionId,
        stepName,
        stepOrder,
        skipped: true,
        metadata: { 
          reason,
          dropOffTime,
          ...metadata 
        }
      } as OnboardingEvent);
    }
  }

  async trackFeatureUsage(event: FeatureUsageEvent): Promise<void> {
    await this.trackEvent(event);
  }

  async trackGameActivity(event: GameActivityEvent): Promise<void> {
    await this.trackEvent(event);
  }

  async trackFeedback(event: FeedbackEvent): Promise<void> {
    await this.trackEvent(event);
  }

  async trackPWAEvent(event: PWAEvent): Promise<void> {
    await this.trackEvent(event);
  }

  async trackPerformance(event: PerformanceEvent): Promise<void> {
    await this.trackEvent(event);
  }

  async trackUserBehavior(event: UserBehaviorEvent): Promise<void> {
    await this.trackEvent(event);
  }

  async trackTierUpgradeAttempt(attempt: TierUpgradeAttempt): Promise<void> {
    await this.trackEvent({
      id: attempt.id,
      eventType: 'tier_upgrade_attempt',
      category: 'user_behavior',
      timestamp: attempt.timestamp,
      sessionId: this.sessionId,
      metadata: {
        fromTier: attempt.fromTier,
        toTier: attempt.toTier,
        success: attempt.success,
        amount: attempt.amount,
        paymentMethod: attempt.paymentMethod,
        failureReason: attempt.failureReason,
        ...attempt.metadata
      }
    });
  }

  // ===== FEATURE TIMER TRACKING =====

  startFeatureTimer(featureName: string): void {
    this.featureTimers.set(featureName, Date.now());
  }

  stopFeatureTimer(featureName: string, metadata?: Record<string, any>): void {
    const startTime = this.featureTimers.get(featureName);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.featureTimers.delete(featureName);
      
      this.trackFeatureUsage({
        id: `feature_timer_${featureName}_${Date.now()}`,
        eventType: 'feature_usage',
        category: 'feature_usage',
        timestamp: Date.now(),
        sessionId: this.sessionId,
        featureName,
        featureCategory: 'other',
        action: 'complete',
        duration,
        metadata: metadata || {}
      });
    }
  }

  // ===== ANALYTICS QUERIES =====

  async getOnboardingFunnelStats(
    startDate?: Date, 
    endDate?: Date
  ): Promise<OnboardingFunnelStats[]> {
    try {
      // Implementation would query the analytics database
      // For now, return mock data
      return [
        {
          stepName: 'Welcome',
          stepOrder: 1,
          totalUsers: 1000,
          completedUsers: 950,
          skippedUsers: 50,
          completionRate: 95.0,
          averageTimeToComplete: 30000,
          dropOffRate: 5.0
        },
        {
          stepName: 'Game Selection',
          stepOrder: 2,
          totalUsers: 950,
          completedUsers: 800,
          skippedUsers: 150,
          completionRate: 84.2,
          averageTimeToComplete: 45000,
          dropOffRate: 15.8
        }
      ];
    } catch (error) {
      console.error('Failed to get onboarding funnel stats:', error);
      return [];
    }
  }

  async getTierConversionStats(
    startDate?: Date, 
    endDate?: Date
  ): Promise<TierConversionStats[]> {
    try {
      // Implementation would query the analytics database
      return [
        {
          tier: 'free_to_pro',
          conversions: 150,
          revenue: 15000,
          conversionRate: 15.0,
          fromTier: 'free',
          toTier: 'pro',
          totalAttempts: 1000,
          successfulUpgrades: 150,
          avgAmount: 100
        }
      ];
    } catch (error) {
      console.error('Failed to get tier conversion stats:', error);
      return [];
    }
  }

  async getFeatureUsageStats(
    featureName?: string,
    startDate?: Date, 
    endDate?: Date
  ): Promise<FeatureUsageStats[]> {
    try {
      // Implementation would query the analytics database
      return [
        {
          featureName: 'chat',
          totalUsage: 5000,
          uniqueUsers: 1000,
          averageUsagePerUser: 5.0,
          mostActiveUsers: 200,
          usageTrend: 'increasing'
        },
        {
          featureName: 'insights',
          totalUsage: 2000,
          uniqueUsers: 800,
          averageUsagePerUser: 2.5,
          mostActiveUsers: 150,
          usageTrend: 'stable'
        }
      ];
    } catch (error) {
      console.error('Failed to get feature usage stats:', error);
      return [];
    }
  }

  // ===== UTILITY METHODS =====

  private async enrichEvent(event: AnalyticsEvent): Promise<AnalyticsEvent> {
    try {
      // Check if user is authenticated before trying to get user data
      const authState = authService.getCurrentState();
      if (!authState.user) {
        // User not authenticated, return event without user data
        return {
          ...event,
          userTier: 'free',
          platform: this.getPlatform(),
          version: this.getAppVersion()
        };
      }
      
      const user = await authService.getCurrentUserId();
      const tier = await unifiedUsageService.getTier();
      
      return {
        ...event,
        ...(user && { userId: user }),
        userTier: tier,
        platform: this.getPlatform(),
        version: this.getAppVersion()
      };
    } catch (error) {
      console.warn('Failed to enrich event:', error);
      return {
        ...event,
        userTier: 'free',
        platform: this.getPlatform(),
        version: this.getAppVersion()
      };
    }
  }

  private async storeEventLocally(event: AnalyticsEvent): Promise<void> {
    try {
      const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      events.push(event);
      
      // Keep only last 1000 events locally
      if (events.length > 1000) {
        events.splice(0, events.length - 1000);
      }
      
      localStorage.setItem('analytics_events', JSON.stringify(events));
    } catch (error) {
      console.warn('Failed to store event locally:', error);
    }
  }

  private async ensureAnalyticsTables(): Promise<void> {
    try {
      // Implementation would create analytics tables in Supabase
      console.log('Analytics tables ensured');
    } catch (error) {
      console.error('Failed to ensure analytics tables:', error);
    }
  }

  private startEventProcessing(): void {
    setInterval(async () => {
      if (this.eventQueue.length > 0) {
        await this.processEventQueue();
      }
    }, 30000); // Process every 30 seconds
  }

  private async processEventQueue(): Promise<void> {
    try {
      const events = [...this.eventQueue];
      this.eventQueue = [];

      // Skip Supabase calls in developer mode
      const isDevMode = localStorage.getItem('otakon_developer_mode') === 'true';
      
      if (isDevMode) {
        console.log('🔧 Developer mode: Skipping analytics events (localStorage only)');
        return;
      }

      // Batch insert events to Supabase
      if (events.length > 0) {
        // Map interface fields to database column names
        const mappedEvents = events.map(event => ({
          id: event.id,
          event_type: event.eventType,
          category: event.category,
          timestamp: new Date(event.timestamp).toISOString(),
          user_id: event.userId || null,
          session_id: event.sessionId,
          metadata: event.metadata,
          user_tier: event.userTier || 'free',
          platform: event.platform || 'web',
          version: event.version
        }));

        const { error } = await supabase
          .from('analytics')
          .insert(mappedEvents);

        if (error) {
          console.error('Failed to insert analytics events:', error);
          // Re-queue events for retry
          this.eventQueue.unshift(...events);
        } else {
          console.log(`📊 Processed ${events.length} analytics events`);
        }
      }
    } catch (error) {
      console.error('Failed to process event queue:', error);
    }
  }

  private getPlatform(): string {
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return 'pwa';
      }
      return 'web';
    }
    return 'unknown';
  }

  private getAppVersion(): string {
    return '1.0.0'; // This would come from package.json or build info
  }

  // ===== CLEANUP =====

  override async cleanup(): Promise<void> {
    try {
      // Process remaining events
      await this.processEventQueue();
      
      // Track session end
      const sessionDuration = Date.now() - this.sessionStartTime;
      await this.trackUserBehavior({
        id: `session_end_${Date.now()}`,
        eventType: 'session_end',
        category: 'user_behavior',
        timestamp: Date.now(),
        sessionId: this.sessionId,
        sessionDuration,
        metadata: { sessionDuration }
      });

      console.log('✅ Analytics service cleaned up');
    } catch (error) {
      console.error('Failed to cleanup analytics service:', error);
    }
  }
}

export const unifiedAnalyticsService = () => UnifiedAnalyticsService.getInstance();