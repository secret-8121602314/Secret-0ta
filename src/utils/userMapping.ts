import { User, UserTier } from '../types';
import { TIER_LIMITS } from '../constants';

/**
 * Helper to safely parse JSON fields from database
 */
function jsonToRecord(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) {
    return {};
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  return {};
}

/**
 * Map database user data to User type
 * Consolidates duplicate mapping logic from authService and supabaseService
 */
export function mapUserData(userData: Record<string, unknown>, authUserId?: string): User {
  const tier = (userData.tier as UserTier) || 'free';
  const textLimit = (userData.text_limit as number) || TIER_LIMITS[tier]?.text || 55;
  const imageLimit = (userData.image_limit as number) || TIER_LIMITS[tier]?.image || 25;
  const textCount = (userData.text_count as number) || 0;
  const imageCount = (userData.image_count as number) || 0;
  const totalRequests = (userData.total_requests as number) || 0;
  const lastReset = userData.last_reset 
    ? new Date(userData.last_reset as string).getTime() 
    : Date.now();

  return {
    id: userData.id as string,
    authUserId: (userData.auth_user_id as string) || authUserId || '',
    email: userData.email as string,
    tier,
    hasProfileSetup: (userData.has_profile_setup as boolean) || false,
    hasSeenSplashScreens: (userData.has_seen_splash_screens as boolean) || false,
    hasSeenHowToUse: (userData.has_seen_how_to_use as boolean) || false,
    hasSeenFeaturesConnected: (userData.has_seen_features_connected as boolean) || false,
    hasSeenProFeatures: (userData.has_seen_pro_features as boolean) || false,
    pcConnected: (userData.pc_connected as boolean) || false,
    pcConnectionSkipped: (userData.pc_connection_skipped as boolean) || false,
    onboardingCompleted: (userData.onboarding_completed as boolean) || false,
    hasWelcomeMessage: (userData.has_welcome_message as boolean) || false,
    isNewUser: (userData.is_new_user as boolean) ?? true,
    hasUsedTrial: (userData.has_used_trial as boolean) || false,
    lastActivity: Date.now(),
    
    // Query-based usage limits (top-level for easy access)
    textCount,
    imageCount,
    textLimit,
    imageLimit,
    totalRequests,
    lastReset,
    
    // PC Connection fields
    connectionCode: userData.connection_code as string | undefined,
    connectionCodeCreatedAt: userData.connection_code_created_at 
      ? new Date(userData.connection_code_created_at as string).getTime() 
      : undefined,
    connectionActive: userData.connection_active as boolean | undefined,
    connectionDeviceInfo: jsonToRecord(userData.connection_device_info),
    lastConnectionAt: userData.last_connection_at 
      ? new Date(userData.last_connection_at as string).getTime() 
      : undefined,
    
    // Trial fields
    trialStartedAt: userData.trial_started_at 
      ? new Date(userData.trial_started_at as string).getTime() 
      : undefined,
    trialExpiresAt: userData.trial_expires_at 
      ? new Date(userData.trial_expires_at as string).getTime() 
      : undefined,
    
    preferences: jsonToRecord(userData.preferences),
    
    // Legacy nested usage object (kept for backward compatibility)
    usage: {
      textCount,
      imageCount,
      textLimit,
      imageLimit,
      totalRequests,
      lastReset,
      tier,
    },
    
    appState: jsonToRecord(userData.app_state),
    profileData: jsonToRecord(userData.profile_data),
    onboardingData: jsonToRecord(userData.onboarding_data),
    behaviorData: jsonToRecord(userData.behavior_data),
    feedbackData: jsonToRecord(userData.feedback_data),
    usageData: jsonToRecord(userData.usage_data),
    
    createdAt: userData.created_at 
      ? new Date(userData.created_at as string).getTime() 
      : Date.now(),
    updatedAt: userData.updated_at 
      ? new Date(userData.updated_at as string).getTime() 
      : Date.now(),
  };
}
