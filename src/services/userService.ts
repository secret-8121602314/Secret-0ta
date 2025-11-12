import { StorageService } from './storageService';
import { User, Usage, UserTier } from '../types';
import { STORAGE_KEYS, TIER_LIMITS, USER_TIERS } from '../constants';
import { supabase } from '../lib/supabase';
import { jsonToRecord, safeParseDate, safeNumber } from '../utils/typeHelpers';

export class UserService {
  static getCurrentUser(): User | null {
    return StorageService.get(STORAGE_KEYS.USER, null);
  }

  static setCurrentUser(user: User): void {
    StorageService.set(STORAGE_KEYS.USER, user);
  }

  static createUser(email: string, tier: UserTier = USER_TIERS.FREE): User {
    const now = Date.now();
    const limits = TIER_LIMITS[tier];
    
    return {
      id: `user_${now}`,
      authUserId: `user_${now}`,
      email,
      tier,
      hasProfileSetup: false,
      hasSeenSplashScreens: false,
      hasSeenHowToUse: false,
      hasSeenFeaturesConnected: false,
      hasSeenProFeatures: false,
      pcConnected: false,
      pcConnectionSkipped: false,
      onboardingCompleted: false,
      hasWelcomeMessage: false,
      isNewUser: true,
      hasUsedTrial: false,
      lastActivity: now,
      preferences: {},
      // Add these required fields from User interface
      textCount: 0,
      imageCount: 0,
      textLimit: limits.text,
      imageLimit: limits.image,
      totalRequests: 0,
      lastReset: now,
      usage: {
        textCount: 0,
        imageCount: 0,
        textLimit: limits.text,
        imageLimit: limits.image,
        totalRequests: 0,
        lastReset: now,
        tier,
      },
      appState: {},
      profileData: {},
      onboardingData: {},
      behaviorData: {},
      feedbackData: {},
      usageData: {},
      createdAt: now,
      updatedAt: now,
    };
  }

  static updateUser(updates: Partial<User>): void {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return;
    }

    const updatedUser = {
      ...currentUser,
      ...updates,
      updatedAt: Date.now(),
    };

    this.setCurrentUser(updatedUser);
  }

  static updateUsage(usage: Partial<Usage>): void {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return;
    }

    this.updateUser({
      usage: {
        ...currentUser.usage,
        ...usage,
      },
    });
  }

  static resetUsage(): void {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return;
    }

    const limits = TIER_LIMITS[currentUser.tier];
    this.updateUsage({
      textCount: 0,
      imageCount: 0,
      totalRequests: 0,
      lastReset: Date.now(),
      textLimit: limits.text,
      imageLimit: limits.image,
    });
  }

  static canMakeRequest(type: 'text' | 'image'): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return false;
    }

    const { usage } = currentUser;
    if (type === 'text') {
      return usage.textCount < usage.textLimit;
    } else {
      return usage.imageCount < usage.imageLimit;
    }
  }

  static incrementUsage(type: 'text' | 'image'): void {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return;
    }

    const updates: Partial<Usage> = {
      totalRequests: currentUser.usage.totalRequests + 1,
    };

    if (type === 'text') {
      updates.textCount = currentUser.usage.textCount + 1;
    } else {
      updates.imageCount = currentUser.usage.imageCount + 1;
    }

    this.updateUsage(updates);
  }

  static logout(): void {
    StorageService.remove(STORAGE_KEYS.USER);
  }

  /**
   * ✅ FIX 8: Get current user with Supabase sync
   * Falls back to localStorage if Supabase unavailable
   */
  static async getCurrentUserAsync(): Promise<User | null> {
    try {
      // 1. Check localStorage first (fast path)
      const cached = StorageService.get<User | null>(STORAGE_KEYS.USER, null);
      
      // 2. Get current auth session
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        return cached;
      }
      
      // 3. Fetch latest from Supabase (source of truth)
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();
      
      if (dbError || !dbUser) {
        console.error('Failed to fetch user from Supabase:', dbError);
        return cached; // Fallback to cached
      }
      
      // 4. Map database user to User type
      const user: User = {
        id: dbUser.id,
        authUserId: dbUser.auth_user_id,
        email: dbUser.email,
        tier: dbUser.tier as UserTier,
        
        // Query limits from database
        textCount: dbUser.text_count || 0,
        imageCount: dbUser.image_count || 0,
        textLimit: safeNumber(dbUser.text_limit),
        imageLimit: safeNumber(dbUser.image_limit),
        totalRequests: dbUser.total_requests || 0,
        lastReset: safeParseDate(dbUser.last_reset),
        
        // Onboarding flags
        hasProfileSetup: dbUser.has_profile_setup || false,
        hasSeenSplashScreens: dbUser.has_seen_splash_screens || false,
        hasSeenHowToUse: dbUser.has_seen_how_to_use || false,
        hasSeenFeaturesConnected: dbUser.has_seen_features_connected || false,
        hasSeenProFeatures: dbUser.has_seen_pro_features || false,
        pcConnected: dbUser.pc_connected || false,
        pcConnectionSkipped: dbUser.pc_connection_skipped || false,
        onboardingCompleted: dbUser.onboarding_completed || false,
        hasWelcomeMessage: dbUser.has_welcome_message || false,
        isNewUser: dbUser.is_new_user || false,
        hasUsedTrial: dbUser.has_used_trial || false,
        
        // Other fields
        lastActivity: safeParseDate(dbUser.updated_at),
        preferences: jsonToRecord(dbUser.preferences),
        
        // Legacy nested usage (for backward compatibility)
        usage: {
          textCount: dbUser.text_count || 0,
          imageCount: dbUser.image_count || 0,
          textLimit: safeNumber(dbUser.text_limit),
          imageLimit: safeNumber(dbUser.image_limit),
          totalRequests: dbUser.total_requests || 0,
          lastReset: safeParseDate(dbUser.last_reset),
          tier: dbUser.tier as UserTier,
        },
        
        appState: jsonToRecord(dbUser.app_state),
        profileData: jsonToRecord(dbUser.profile_data),
        onboardingData: jsonToRecord(dbUser.onboarding_data),
        behaviorData: jsonToRecord(dbUser.behavior_data),
        feedbackData: jsonToRecord(dbUser.feedback_data),
        usageData: jsonToRecord(dbUser.usage_data),
        
        createdAt: safeParseDate(dbUser.created_at),
        updatedAt: safeParseDate(dbUser.updated_at),
      };
      
      // 5. Update cache
      StorageService.set(STORAGE_KEYS.USER, user);
      
      return user;
    } catch (error) {
      console.error('Error in getCurrentUserAsync:', error);
      // Fallback to cached user
      return StorageService.get<User | null>(STORAGE_KEYS.USER, null);
    }
  }

  /**
   * ✅ FIX 8: Set current user with Supabase sync
   * Updates localStorage immediately (optimistic update)
   * Syncs to Supabase in background
   */
  static async setCurrentUserAsync(user: User): Promise<void> {
    try {
      // 1. Update localStorage immediately (optimistic update)
      StorageService.set(STORAGE_KEYS.USER, user);
      
      // 2. Sync to Supabase
      const { error } = await supabase
        .from('users')
        .update({
          tier: user.tier,
          text_count: user.textCount,
          image_count: user.imageCount,
          text_limit: user.textLimit,
          image_limit: user.imageLimit,
          total_requests: user.totalRequests,
          last_reset: new Date(user.lastReset).toISOString(),
          
          // Onboarding flags
          has_profile_setup: user.hasProfileSetup,
          has_seen_splash_screens: user.hasSeenSplashScreens,
          has_seen_how_to_use: user.hasSeenHowToUse,
          has_seen_features_connected: user.hasSeenFeaturesConnected,
          has_seen_pro_features: user.hasSeenProFeatures,
          pc_connected: user.pcConnected,
          pc_connection_skipped: user.pcConnectionSkipped,
          onboarding_completed: user.onboardingCompleted,
          has_welcome_message: user.hasWelcomeMessage,
          has_used_trial: user.hasUsedTrial,
          
          // Data objects
          preferences: user.preferences,
          profile_data: user.profileData,
          app_state: user.appState,
          onboarding_data: user.onboardingData,
          behavior_data: user.behaviorData,
          feedback_data: user.feedbackData,
          usage_data: user.usageData,
          
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', user.authUserId);
      
      if (error) {
        console.error('Failed to sync user to Supabase:', error);
        // Don't throw - optimistic update already done
        // User will sync on next getCurrentUserAsync()
      }
    } catch (error) {
      console.error('Error in setCurrentUserAsync:', error);
      // Don't throw - localStorage update succeeded
    }
  }

  /**
   * ✅ FIX 8: Update usage with Supabase sync
   */
  static async updateUsageAsync(usage: Partial<Usage>): Promise<void> {
    const currentUser = await this.getCurrentUserAsync();
    if (!currentUser) {
      return;
    }

    const updatedUser = {
      ...currentUser,
      usage: {
        ...currentUser.usage,
        ...usage,
      },
      // Also update top-level fields
      textCount: usage.textCount ?? currentUser.textCount,
      imageCount: usage.imageCount ?? currentUser.imageCount,
      totalRequests: usage.totalRequests ?? currentUser.totalRequests,
      lastReset: usage.lastReset ?? currentUser.lastReset,
      updatedAt: Date.now(),
    };

    await this.setCurrentUserAsync(updatedUser);
  }
}


