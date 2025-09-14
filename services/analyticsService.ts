import { supabase } from './supabase';
import { authService } from './supabase';

export interface OnboardingStep {
  stepName: string;
  stepOrder: number;
  startTime: number;
  metadata?: Record<string, any>;
}

export interface OnboardingFunnelEvent {
  stepName: string;
  stepOrder: number;
  stepDurationMs: number;
  droppedOff: boolean;
  dropOffReason?: string;
  metadata?: Record<string, any>;
}

export interface TierUpgradeAttempt {
  fromTier: string;
  toTier: string;
  attemptSource: 'splash_screen' | 'upgrade_modal' | 'usage_limit' | 'manual';
  success: boolean;
  paymentMethod?: string;
  amount?: number;
  currency?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface FeatureUsageEvent {
  featureName: string;
  featureCategory: 'chat' | 'insights' | 'voice' | 'hands_free' | 'pwa' | 'settings' | 'other';
  usageCount?: number;
  durationMs?: number;
  metadata?: Record<string, any>;
}

export interface OnboardingFunnelStats {
  stepName: string;
  stepOrder: number;
  totalUsers: number;
  completedUsers: number;
  droppedOffUsers: number;
  completionRate: number;
  avgDurationMs: number;
}

export interface TierConversionStats {
  fromTier: string;
  toTier: string;
  totalAttempts: number;
  successfulUpgrades: number;
  conversionRate: number;
  avgAmount: number;
}

export interface FeatureUsageStats {
  featureName: string;
  featureCategory: string;
  totalUsers: number;
  totalUsageCount: number;
  avgUsagePerUser: number;
  mostActiveUsers: number;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private onboardingSteps: Map<string, OnboardingStep> = new Map();
  private featureTimers: Map<string, number> = new Map();

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // ===== ONBOARDING FUNNEL TRACKING =====

  /**
   * Start tracking an onboarding step
   */
  startOnboardingStep(stepName: string, stepOrder: number, metadata?: Record<string, any>): void {
    const stepKey = `${stepName}_${stepOrder}`;
    this.onboardingSteps.set(stepKey, {
      stepName,
      stepOrder,
      startTime: Date.now(),
      metadata
    });

    console.log(`🚀 Onboarding step started: ${stepName} (${stepOrder})`);
  }

  /**
   * Complete an onboarding step
   */
  async completeOnboardingStep(stepName: string, stepOrder: number, metadata?: Record<string, any>): Promise<void> {
    const stepKey = `${stepName}_${stepOrder}`;
    const step = this.onboardingSteps.get(stepKey);
    
    if (!step) {
      console.warn(`Onboarding step not found: ${stepName} (${stepOrder})`);
      return;
    }

    const stepDurationMs = Date.now() - step.startTime;
    
    const event: OnboardingFunnelEvent = {
      stepName,
      stepOrder,
      stepDurationMs,
      droppedOff: false,
      metadata: { ...step.metadata, ...metadata }
    };

    await this.trackOnboardingEvent(event);
    this.onboardingSteps.delete(stepKey);

    console.log(`✅ Onboarding step completed: ${stepName} (${stepDurationMs}ms)`);
  }

  /**
   * Track when a user drops off during onboarding
   */
  async trackOnboardingDropOff(
    stepName: string, 
    stepOrder: number, 
    reason: string, 
    metadata?: Record<string, any>
  ): Promise<void> {
    const stepKey = `${stepName}_${stepOrder}`;
    const step = this.onboardingSteps.get(stepKey);
    
    if (!step) {
      console.warn(`Onboarding step not found for drop-off: ${stepName} (${stepOrder})`);
      return;
    }

    const stepDurationMs = Date.now() - step.startTime;
    
    const event: OnboardingFunnelEvent = {
      stepName,
      stepOrder,
      stepDurationMs,
      droppedOff: true,
      dropOffReason: reason,
      metadata: { ...step.metadata, ...metadata }
    };

    await this.trackOnboardingEvent(event);
    this.onboardingSteps.delete(stepKey);

    console.log(`❌ Onboarding drop-off tracked: ${stepName} - ${reason} (${stepDurationMs}ms)`);
  }

  /**
   * Track onboarding event in database
   */
  private async trackOnboardingEvent(event: OnboardingFunnelEvent): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const { error } = await supabase
        .from('onboarding_funnel')
        .insert({
          user_id: userId,
          step_name: event.stepName,
          step_order: event.stepOrder,
          step_duration_ms: event.stepDurationMs,
          dropped_off: event.droppedOff,
          drop_off_reason: event.dropOffReason,
          metadata: event.metadata
        });

      if (error) {
        console.error('Error tracking onboarding event:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in trackOnboardingEvent:', error);
      return false;
    }
  }

  // ===== TIER UPGRADE TRACKING =====

  /**
   * Track a tier upgrade attempt
   */
  async trackTierUpgradeAttempt(attempt: TierUpgradeAttempt): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const { error } = await supabase
        .from('tier_upgrade_attempts')
        .insert({
          user_id: userId,
          from_tier: attempt.fromTier,
          to_tier: attempt.toTier,
          attempt_source: attempt.attemptSource,
          success: attempt.success,
          payment_method: attempt.paymentMethod,
          amount: attempt.amount,
          currency: attempt.currency,
          error_message: attempt.errorMessage,
          metadata: attempt.metadata
        });

      if (error) {
        console.error('Error tracking tier upgrade attempt:', error);
        return false;
      }

      console.log(`💰 Tier upgrade tracked: ${attempt.fromTier} → ${attempt.toTier} (${attempt.success ? 'success' : 'failed'})`);
      return true;
    } catch (error) {
      console.error('Error in trackTierUpgradeAttempt:', error);
      return false;
    }
  }

  // ===== FEATURE USAGE TRACKING =====

  /**
   * Start tracking feature usage duration
   */
  startFeatureTimer(featureName: string): void {
    this.featureTimers.set(featureName, Date.now());
    console.log(`⏱️ Feature timer started: ${featureName}`);
  }

  /**
   * Stop tracking feature usage and record the event
   */
  async stopFeatureTimer(featureName: string, metadata?: Record<string, any>): Promise<void> {
    const startTime = this.featureTimers.get(featureName);
    if (!startTime) {
      console.warn(`Feature timer not found: ${featureName}`);
      return;
    }

    const durationMs = Date.now() - startTime;
    this.featureTimers.delete(featureName);

    await this.trackFeatureUsage({
      featureName,
      featureCategory: this.categorizeFeature(featureName),
      durationMs,
      metadata
    });

    console.log(`⏱️ Feature timer stopped: ${featureName} (${durationMs}ms)`);
  }

  /**
   * Track a feature usage event
   */
  async trackFeatureUsage(event: FeatureUsageEvent): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      // Check if user already has a record for this feature
      const { data: existingUsage } = await supabase
        .from('feature_usage')
        .select('*')
        .eq('user_id', userId)
        .eq('feature_name', event.featureName)
        .single();

      if (existingUsage) {
        // Update existing record
        const { error } = await supabase
          .from('feature_usage')
          .update({
            usage_count: existingUsage.usage_count + (event.usageCount || 1),
            last_used_at: new Date().toISOString(),
            total_duration_ms: existingUsage.total_duration_ms + (event.durationMs || 0),
            metadata: { ...existingUsage.metadata, ...event.metadata }
          })
          .eq('id', existingUsage.id);

        if (error) {
          console.error('Error updating feature usage:', error);
          return false;
        }
      } else {
        // Create new record
        const { error } = await supabase
          .from('feature_usage')
          .insert({
            user_id: userId,
            feature_name: event.featureName,
            feature_category: event.featureCategory,
            usage_count: event.usageCount || 1,
            total_duration_ms: event.durationMs || 0,
            metadata: event.metadata
          });

        if (error) {
          console.error('Error creating feature usage:', error);
          return false;
        }
      }

      console.log(`📊 Feature usage tracked: ${event.featureName} (${event.featureCategory})`);
      return true;
    } catch (error) {
      console.error('Error in trackFeatureUsage:', error);
      return false;
    }
  }

  /**
   * Categorize features for analytics
   */
  private categorizeFeature(featureName: string): FeatureUsageEvent['featureCategory'] {
    const featureMap: Record<string, FeatureUsageEvent['featureCategory']> = {
      // Chat features
      'send_message': 'chat',
      'retry_message': 'chat',
      'voice_input': 'chat',
      'image_upload': 'chat',
      
      // Insights features
      'create_insight': 'insights',
      'edit_insight': 'insights',
      'delete_insight': 'insights',
      'pin_insight': 'insights',
      
      // Voice features
      'voice_chat': 'voice',
      'tts_enable': 'voice',
      'tts_disable': 'voice',
      
      // Hands-free features
      'hands_free_mode': 'hands_free',
      'screenshot_analysis': 'hands_free',
      
      // PWA features
      'pwa_install': 'pwa',
      'offline_mode': 'pwa',
      'app_shortcut': 'pwa',
      
      // Settings features
      'settings_open': 'settings',
      'tier_change': 'settings',
      'preferences_update': 'settings'
    };

    return featureMap[featureName] || 'other';
  }

  // ===== ANALYTICS QUERIES =====

  /**
   * Get onboarding funnel statistics
   */
  async getOnboardingFunnelStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<OnboardingFunnelStats[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_onboarding_funnel_stats', {
          start_date: startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: endDate?.toISOString() || new Date().toISOString()
        });

      if (error) {
        console.error('Error getting onboarding funnel stats:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getOnboardingFunnelStats:', error);
      return [];
    }
  }

  /**
   * Get tier conversion statistics
   */
  async getTierConversionStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<TierConversionStats[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_tier_conversion_stats', {
          start_date: startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: endDate?.toISOString() || new Date().toISOString()
        });

      if (error) {
        console.error('Error getting tier conversion stats:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTierConversionStats:', error);
      return [];
    }
  }

  /**
   * Get feature usage statistics
   */
  async getFeatureUsageStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<FeatureUsageStats[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_feature_usage_stats', {
          start_date: startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: endDate?.toISOString() || new Date().toISOString()
        });

      if (error) {
        console.error('Error getting feature usage stats:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getFeatureUsageStats:', error);
      return [];
    }
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
   * Clean up any active timers (useful for page unload)
   */
  cleanup(): void {
    this.featureTimers.clear();
    this.onboardingSteps.clear();
  }
}

export const analyticsService = AnalyticsService.getInstance();
