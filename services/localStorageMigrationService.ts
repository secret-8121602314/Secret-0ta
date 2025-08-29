import { SupabaseClient } from '@supabase/supabase-js';

export interface MigrationResult {
  success: boolean;
  migratedTables: string[];
  errors: string[];
  totalItems: number;
}

export interface MigrationProgress {
  current: number;
  total: number;
  currentTable: string;
  status: 'idle' | 'migrating' | 'completed' | 'error';
}

export class LocalStorageMigrationService {
  private supabase: SupabaseClient;
  private isMigrating = false;
  
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // Check if user is authenticated
  private async isAuthenticated(): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return !!user;
  }

  // Get current user ID
  private async getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user?.id || null;
  }

  // Safe migration that won't break the app
  async migrateAllData(): Promise<MigrationResult> {
    if (this.isMigrating) {
      throw new Error('Migration already in progress');
    }

    this.isMigrating = true;
    const result: MigrationResult = {
      success: false,
      migratedTables: [],
      errors: [],
      totalItems: 0
    };

    try {
      // Check authentication
      if (!(await this.isAuthenticated())) {
        result.errors.push('User not authenticated');
        return result;
      }

      const userId = await this.getCurrentUserId();
      if (!userId) {
        result.errors.push('Could not get user ID');
        return result;
      }

      // 1. Migrate user preferences (TTS, PWA, onboarding)
      try {
        const prefsResult = await this.migrateUserPreferences(userId);
        if (prefsResult.success) {
          result.migratedTables.push('user_preferences');
          result.totalItems += prefsResult.count;
        }
      } catch (error) {
        result.errors.push(`User preferences: ${error}`);
      }

      // 2. Migrate app state (onboarding, connection history)
      try {
        const stateResult = await this.migrateAppState(userId);
        if (stateResult.success) {
          result.migratedTables.push('app_state');
          result.totalItems += stateResult.count;
        }
      } catch (error) {
        result.errors.push(`App state: ${error}`);
      }

      // 3. Migrate analytics data (feedback, PWA, daily goals)
      try {
        const analyticsResult = await this.migrateAnalytics(userId);
        if (analyticsResult.success) {
          result.migratedTables.push('user_analytics');
          result.totalItems += analyticsResult.count;
        }
      } catch (error) {
        result.errors.push(`Analytics: ${error}`);
      }

      // 4. Migrate session data (daily goals, streaks, check-ins)
      try {
        const sessionsResult = await this.migrateSessionData(userId);
        if (sessionsResult.success) {
          result.migratedTables.push('user_sessions');
          result.totalItems += sessionsResult.count;
        }
      } catch (error) {
        result.errors.push(`Sessions: ${error}`);
      }

      result.success = result.migratedTables.length > 0;
      
    } catch (error) {
      result.errors.push(`General error: ${error}`);
    } finally {
      this.isMigrating = false;
    }

    return result;
  }

  // Migrate user preferences (TTS, PWA, general settings)
  private async migrateUserPreferences(userId: string): Promise<{ success: boolean; count: number }> {
    const preferences = [
      { key: 'otakonPreferredVoiceURI', category: 'tts' },
      { key: 'otakonHandsFreeEnabled', category: 'pwa' },
      { key: 'otakonOnboardingComplete', category: 'onboarding' },
      { key: 'otakonInstallDismissed', category: 'pwa' }
    ];

    let count = 0;
    
    for (const pref of preferences) {
      const value = localStorage.getItem(pref.key);
      if (value) {
        try {
          await this.supabase
            .from('users_new')
            .upsert({
              auth_user_id: userId,
              preferences: { [pref.category]: { [pref.key]: value } }
            });
          count++;
        } catch (error) {
          console.warn(`Failed to migrate preference ${pref.key}:`, error);
        }
      }
    }

    return { success: count > 0, count };
  }

  // Migrate app state (onboarding, connection history)
  private async migrateAppState(userId: string): Promise<{ success: boolean; count: number }> {
    const stateKeys = [
      'otakonHasConnectedBefore',
      'otakonAuthMethod',
      'otakon_profile_setup_completed',
      'otakon_welcome_message_shown'
    ];

    let count = 0;
    
    for (const key of stateKeys) {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          await this.supabase
            .from('users_new')
            .upsert({
              auth_user_id: userId,
              app_state: { [key]: value }
            });
          count++;
        } catch (error) {
          console.warn(`Failed to migrate app state ${key}:`, error);
        }
      }
    }

    return { success: count > 0, count };
  }

  // Migrate analytics data (feedback, PWA, usage)
  private async migrateAnalytics(userId: string): Promise<{ success: boolean; count: number }> {
    let count = 0;

    // Migrate feedback data
    const feedbackData = localStorage.getItem('otakonFeedbackData');
    if (feedbackData) {
      try {
        await this.supabase
          .from('analytics_new')
          .insert({
            user_id: userId,
            category: 'feedback',
            event_type: 'localStorage_migration',
            data: { feedback: feedbackData }
          });
        count++;
      } catch (error) {
        console.warn('Failed to migrate feedback data:', error);
      }
    }

    // Migrate PWA analytics
    const pwaInstalls = localStorage.getItem('otakonPWAInstalls');
    const pwaEngagement = localStorage.getItem('otakonPWAEngagement');
    
    if (pwaInstalls || pwaEngagement) {
      try {
        await this.supabase
          .from('analytics_new')
          .insert({
            user_id: userId,
            category: 'pwa',
            event_type: 'localStorage_migration',
            data: { 
              installs: pwaInstalls ? JSON.parse(pwaInstalls) : null,
              engagement: pwaEngagement ? JSON.parse(pwaEngagement) : null
            }
          });
        count++;
      } catch (error) {
        console.warn('Failed to migrate PWA data:', error);
      }
    }

    // Migrate usage data
    const usageData = {
      textCount: localStorage.getItem('otakonTextCount'),
      imageCount: localStorage.getItem('otakonImageCount'),
      tier: localStorage.getItem('otakonTier'),
      lastMonth: localStorage.getItem('otakonLastMonth')
    };

    if (Object.values(usageData).some(v => v)) {
      try {
        await this.supabase
          .from('user_analytics')
          .upsert({
            user_id: userId,
            category: 'usage',
            data: usageData
          });
        count++;
      } catch (error) {
        console.warn('Failed to migrate usage data:', error);
      }
    }

    return { success: count > 0, count };
  }

  // Migrate session data (daily goals, streaks, check-ins)
  private async migrateSessionData(userId: string): Promise<{ success: boolean; count: number }> {
    let count = 0;
    const today = new Date().toDateString();

    // Migrate daily goals
    const dailyGoals = localStorage.getItem(`dailyGoals_${today}`);
    if (dailyGoals) {
      try {
        await this.supabase
          .from('analytics_new')
          .insert({
            user_id: userId,
            category: 'sessions',
            event_type: 'daily_goals',
            data: { dailyGoals: JSON.parse(dailyGoals), date: today }
          });
        count++;
      } catch (error) {
        console.warn('Failed to migrate daily goals:', error);
      }
    }

    // Migrate user streaks
    const userStreaks = localStorage.getItem('userStreaks');
    if (userStreaks) {
      try {
        await this.supabase
          .from('analytics_new')
          .insert({
            user_id: userId,
            category: 'sessions',
            event_type: 'user_streaks',
            data: { userStreaks: JSON.parse(userStreaks) }
          });
        count++;
      } catch (error) {
        console.warn('Failed to migrate user streaks:', error);
      }
    }

    // Migrate session time
    const lastSessionTime = localStorage.getItem('lastSessionTime');
    if (lastSessionTime) {
      try {
        await this.supabase
          .from('analytics_new')
          .insert({
            user_id: userId,
            category: 'sessions',
            event_type: 'session_time',
            data: { lastSessionTime }
          });
        count++;
      } catch (error) {
        console.warn('Failed to migrate session time:', error);
      }
    }

    return { success: count > 0, count };
  }

  // Check migration status
  async getMigrationStatus(): Promise<{ migrated: boolean; tables: string[] }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return { migrated: false, tables: [] };

      const { data: userData } = await this.supabase
        .from('users_new')
        .select('preferences, app_state')
        .eq('auth_user_id', userId);

      const { data: analytics } = await this.supabase
        .from('analytics_new')
        .select('category')
        .eq('user_id', userId);

      const tables = [
        ...(userData?.[0]?.preferences ? Object.keys(userData[0].preferences) : []),
        ...(analytics?.map(a => a.category) || [])
      ];

      return {
        migrated: tables.length > 0,
        tables: [...new Set(tables)]
      };
    } catch (error) {
      console.warn('Failed to get migration status:', error);
      return { migrated: false, tables: [] };
    }
  }

  // Clear migrated data from localStorage (optional, after verification)
  async clearMigratedLocalStorage(): Promise<void> {
    if (!(await this.isAuthenticated())) {
      throw new Error('User not authenticated');
    }

    const status = await this.getMigrationStatus();
    if (!status.migrated) {
      throw new Error('No data has been migrated yet');
    }

    // Only clear after successful migration and verification
    const keysToRemove = [
      'otakonPreferredVoiceURI',
      'otakonHandsFreeEnabled',
      'otakonOnboardingComplete',
      'otakonInstallDismissed',
      'otakonHasConnectedBefore',
      'otakonAuthMethod',
      'otakon_profile_setup_completed',
      'otakon_welcome_message_shown',
      'otakonFeedbackData',
      'otakonPWAInstalls',
      'otakonPWAEngagement',
      'otakonTextCount',
      'otakonImageCount',
      'otakonTier',
      'otakonLastMonth',
      'dailyGoals_' + new Date().toDateString(),
      'userStreaks',
      'lastSessionTime'
    ];

    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });
  }
}
