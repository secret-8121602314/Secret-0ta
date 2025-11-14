import { supabase } from '../lib/supabase';

// ========================================
// TYPES
// ========================================

export type OnboardingStep = 
  | 'login'               // LoginSplashScreen
  | 'loading'             // Loading screen during auth processing
  | 'initial'             // InitialSplashScreen  
  | 'how-to-use'          // SplashScreen (PC Connection with 6-digit code)
  | 'features-connected'  // HowToUseSplashScreen (Only if PC connection successful)
  | 'pro-features'        // ProFeaturesSplashScreen (Supercharge with Otagon Pro)
  | 'profile-setup'       // Profile Setup Modal (sets has_profile_setup flag)
  | 'complete';           // Main App (Onboarding fully complete)

export interface OnboardingProgress {
  step: OnboardingStep;
  completed_at: string;
  data: any;
}

export interface OnboardingStatus {
  is_new_user: boolean;
  has_seen_splash_screens: boolean;
  has_profile_setup: boolean;
  has_welcome_message: boolean;
  has_seen_how_to_use: boolean;
  has_seen_features_connected: boolean;
  has_seen_pro_features: boolean;
  pc_connected: boolean;
  pc_connection_skipped: boolean;
  onboarding_completed: boolean;
  tier: string;
}

// ========================================
// ONBOARDING SERVICE
// ========================================

class OnboardingService {
  private static instance: OnboardingService;

  private constructor() {}

  public static getInstance(): OnboardingService {
    if (!OnboardingService.instance) {
      OnboardingService.instance = new OnboardingService();
    }
    return OnboardingService.instance;
  }

  // ========================================
  // ONBOARDING STATUS MANAGEMENT
  // ========================================

  async getOnboardingStatus(userId: string): Promise<OnboardingStatus | null> {
    try {
      console.log('🎯 [OnboardingService] Getting onboarding status for user:', userId);
      const { data, error } = await supabase.rpc('get_user_onboarding_status', {
        p_user_id: userId
      });

      if (error) {
        console.error('🎯 [OnboardingService] Error getting onboarding status:', error);
        return null;
      }

      console.log('🎯 [OnboardingService] Onboarding status raw data:', data);
      
      // The RPC function returns a TABLE (array), so we need to get the first element
      if (!data || data.length === 0) {
        console.log('🎯 [OnboardingService] No onboarding data found for user');
        return null;
      }
      
      const status = data[0];
      console.log('🎯 [OnboardingService] Onboarding status (first element):', status);
      return status;

    } catch (error) {
      console.error('🎯 [OnboardingService] Error getting onboarding status:', error);
      return null;
    }
  }

  async updateOnboardingStatus(userId: string, status: OnboardingStep, data: any = {}): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('update_user_onboarding_status', {
        p_user_id: userId,
        p_step: status,
        p_data: data
      });

      if (error) {
        console.error('Error updating onboarding status:', error);
        return false;
      }

      return true;

    } catch (error) {
      console.error('Error updating onboarding status:', error);
      return false;
    }
  }

  async getOnboardingProgress(userId: string): Promise<OnboardingProgress[]> {
    try {
      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: true });

      if (error) {
        console.error('Error getting onboarding progress:', error);
        return [];
      }

      return (data || []).map(item => ({
        step: item.step as OnboardingStep,
        completed_at: item.created_at || '',
        data: item.data || {}
      }));

    } catch (error) {
      console.error('Error getting onboarding progress:', error);
      return [];
    }
  }

  // ========================================
  // STEP-SPECIFIC METHODS
  // ========================================

  async markSplashScreensSeen(userId: string): Promise<boolean> {
    return this.updateOnboardingStatus(userId, 'initial', {
      splash_screens_seen: true,
      timestamp: new Date().toISOString()
    });
  }

  async markProfileSetupComplete(userId: string, profileData: any): Promise<boolean> {
    // Profile setup is now handled in the chat screen, not as part of onboarding
    // This function is kept for backward compatibility but doesn't affect onboarding flow
    try {
      const { error } = await supabase
        .from('users')
        .update({
          has_profile_setup: true,
          profile_data: profileData,
          updated_at: new Date().toISOString()
        })
        .eq('auth_user_id', userId);

      if (error) {
        console.error('Error marking profile setup complete:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking profile setup complete:', error);
      return false;
    }
  }

  async markWelcomeMessageShown(userId: string): Promise<boolean> {
    return this.updateOnboardingStatus(userId, 'complete', {
      welcome_message_shown: true,
      timestamp: new Date().toISOString()
    });
  }

  async markOnboardingComplete(userId: string): Promise<boolean> {
    return this.updateOnboardingStatus(userId, 'complete', {
      onboarding_complete: true,
      timestamp: new Date().toISOString()
    });
  }

  // ========================================
  // ONBOARDING FLOW LOGIC
  // ========================================

  // Helper function to safely get boolean values with defaults
  private getBooleanValue(value: any, defaultValue: boolean = false): boolean {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    return Boolean(value);
  }

  async getNextOnboardingStep(userId: string): Promise<OnboardingStep> {
    try {
      console.log('🎯 [OnboardingService] Getting next step for user:', userId);
      const status = await this.getOnboardingStatus(userId);
      console.log('🎯 [OnboardingService] User status:', status);
      
      if (!status) {
        console.log('🎯 [OnboardingService] No status found, returning login');
        return 'login';
      }


      // Safely get boolean values with defaults
      const hasSeenSplashScreens = this.getBooleanValue(status.has_seen_splash_screens);
      const hasSeenHowToUse = this.getBooleanValue(status.has_seen_how_to_use);
      const hasSeenFeaturesConnected = this.getBooleanValue(status.has_seen_features_connected);
      const hasSeenProFeatures = this.getBooleanValue(status.has_seen_pro_features);
      const pcConnected = this.getBooleanValue(status.pc_connected);
      const pcConnectionSkipped = this.getBooleanValue(status.pc_connection_skipped);

      console.log('🎯 [OnboardingService] Processed values:', {
        hasSeenSplashScreens,
        hasSeenHowToUse,
        hasSeenFeaturesConnected,
        hasSeenProFeatures,
        pcConnected,
        pcConnectionSkipped
      });

      // Check onboarding steps in order (matching old build logic)
      if (!hasSeenSplashScreens) {
        console.log('🎯 [OnboardingService] User hasn\'t seen splash screens, returning initial');
        return 'initial';
      }

      // After initial splash, go to how-to-use (PC connection)
      if (hasSeenSplashScreens && !hasSeenHowToUse) {
        console.log('🎯 [OnboardingService] User needs to see how-to-use screen, returning how-to-use');
        return 'how-to-use';
      }

      // If PC connection was successful, show features-connected
      if (hasSeenHowToUse && pcConnected && !hasSeenFeaturesConnected) {
        console.log('🎯 [OnboardingService] PC connected, showing features-connected screen');
        return 'features-connected';
      }

      // If PC connection was skipped, go to pro-features
      if (hasSeenHowToUse && !pcConnected && pcConnectionSkipped && !hasSeenProFeatures) {
        console.log('🎯 [OnboardingService] PC connection skipped, showing pro-features screen');
        return 'pro-features';
      }

      // If PC connection failed (not skipped), go back to how-to-use
      if (hasSeenHowToUse && !pcConnected && !pcConnectionSkipped) {
        console.log('🎯 [OnboardingService] PC connection failed, returning to how-to-use screen');
        return 'how-to-use';
      }

      // After features-connected, go to pro-features
      if (hasSeenFeaturesConnected && !hasSeenProFeatures) {
        console.log('🎯 [OnboardingService] User needs to see pro-features screen, returning pro-features');
        return 'pro-features';
      }

      // After pro features, onboarding is complete (profile setup is now an overlay)
      if (hasSeenProFeatures) {
        console.log('🎯 [OnboardingService] User has seen pro features, onboarding complete');
        return 'complete';
      }

      // ✅ FIX: If we reach here, the flow logic has a bug - throw error instead of silently recovering
      // This makes flow bugs visible rather than masking them with fallback behavior
      console.error('🎯 [OnboardingService] ERROR: Unexpected onboarding flow state', {
        hasSeenSplashScreens,
        hasSeenHowToUse,
        hasSeenFeaturesConnected,
        hasSeenProFeatures,
        pcConnected,
        pcConnectionSkipped
      });
      
      // For production stability, return to a safe screen rather than crashing
      // But log the full state so we can diagnose and fix the underlying issue
      return 'how-to-use';

    } catch (error) {
      console.error('🎯 [OnboardingService] Error getting next onboarding step:', error);
      return 'login';
    }
  }

  async shouldShowOnboarding(userId: string): Promise<boolean> {
    try {
      const status = await this.getOnboardingStatus(userId);
      
      if (!status) {
        return true;
      }

      // Check if onboarding is complete
      return !status.onboarding_completed;

    } catch (error) {
      console.error('Error checking if should show onboarding:', error);
      return true;
    }
  }

  // ========================================
  // ONBOARDING ANALYTICS
  // ========================================

  async trackOnboardingStep(userId: string, step: OnboardingStep, action: string, data: any = {}): Promise<void> {
    try {
      await supabase
        .from('user_analytics')
        .insert({
          user_id: userId,
          event_type: 'onboarding_step',
          event_data: {
            step,
            action,
            data,
            timestamp: new Date().toISOString()
          }
        });

    } catch (error) {
      console.error('Error tracking onboarding step:', error);
    }
  }

  async trackOnboardingDropOff(userId: string, step: OnboardingStep, reason: string, data: any = {}): Promise<void> {
    try {
      await supabase
        .from('user_analytics')
        .insert({
          user_id: userId,
          event_type: 'onboarding_dropoff',
          event_data: {
            step,
            reason,
            data,
            timestamp: new Date().toISOString()
          }
        });

    } catch (error) {
      console.error('Error tracking onboarding dropoff:', error);
    }
  }

  // ========================================
  // ONBOARDING RESET
  // ========================================

  async resetOnboarding(userId: string): Promise<boolean> {
    try {
      // Clear onboarding progress
      const { error: progressError } = await supabase
        .from('onboarding_progress')
        .delete()
        .eq('user_id', userId);

      if (progressError) {
        console.error('Error clearing onboarding progress:', progressError);
        return false;
      }

      // Reset user onboarding flags
      const { error: userError } = await supabase
        .from('users')
        .update({
          is_new_user: true,
          has_seen_splash_screens: false,
          has_profile_setup: false,
          has_welcome_message: false,
          onboarding_completed: false,
          onboarding_data: {}
        })
        .eq('id', userId);

      if (userError) {
        console.error('Error resetting user onboarding flags:', userError);
        return false;
      }

      return true;

    } catch (error) {
      console.error('Error resetting onboarding:', error);
      return false;
    }
  }

  // ========================================
  // ONBOARDING STATISTICS
  // ========================================

  async getOnboardingStats(): Promise<{
    total_users: number;
    completed_onboarding: number;
    dropoff_by_step: Record<string, number>;
  }> {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get users who completed onboarding
      const { count: completedUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('onboarding_completed', true);

      // Get dropoff by step
      const { data: dropoffData } = await supabase
        .from('user_analytics')
        .select('event_data')
        .eq('event_type', 'onboarding_dropoff');

      const dropoffByStep: Record<string, number> = {};
      if (dropoffData) {
        dropoffData.forEach(record => {
          const eventData = record.event_data;
          if (typeof eventData === 'object' && eventData !== null && !Array.isArray(eventData)) {
            const step = (eventData as Record<string, unknown>).step;
            if (typeof step === 'string') {
              dropoffByStep[step] = (dropoffByStep[step] || 0) + 1;
            }
          }
        });
      }

      return {
        total_users: totalUsers || 0,
        completed_onboarding: completedUsers || 0,
        dropoff_by_step: dropoffByStep
      };

    } catch (error) {
      console.error('Error getting onboarding stats:', error);
      return {
        total_users: 0,
        completed_onboarding: 0,
        dropoff_by_step: {}
      };
    }
  }
}

// ========================================
// EXPORT SINGLETON INSTANCE
// ========================================

export const onboardingService = OnboardingService.getInstance();
export default onboardingService;
