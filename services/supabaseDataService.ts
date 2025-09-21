import { supabase } from './supabase';
import { userCreationService } from './userCreationService';

export interface UserUsageData {
  tier: string;
  textCount: number;
  imageCount: number;
  textLimit: number;
  imageLimit: number;
  lastMonth?: string;
  usageHistory?: any[];
  tierHistory?: any[];
  lastReset?: string;
}

export interface UserAppState {
  lastVisited: string;
  uiPreferences: any;
  featureFlags: any;
  appSettings: any;
  lastInteraction: string;
  pwaAnalytics?: any;
  wishlist?: any;
  otakuDiary?: any;
  apiCostRecords?: any;
  proactiveInsights?: any;
  onboardingData?: any;
  profileData?: any;
  pwaInstalled?: boolean;
  pwaGlobalInstalled?: boolean;
}

export interface UserPreferences {
  gameGenre: string;
  detailLevel: string;
  aiPersonality: string;
  preferredResponseFormat: string;
  skillLevel: string;
  notificationPreferences: any;
  accessibilitySettings: any;
  tts?: any;
  pwa?: any;
  profileName?: string;
}

export interface DailyEngagement {
  goals: any[];
  streaks: {
    dailyCheckin: number;
    weeklyGoals: number;
    monthlyStreak: number;
  };
  checkinCompleted: boolean;
  lastSessionTime: string | null;
}

export interface AppCache {
  cacheData: any;
  expiresAt: string | null;
}

class SupabaseDataService {
  private userId: string | null = null;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Don't call async function in constructor
    // Initialize lazily when first needed
  }

  private async initializeUserId() {
    // Prevent multiple simultaneous initializations
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._doInitializeUserId();
    return this.initializationPromise;
  }

  private async _doInitializeUserId() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get the internal user ID from the users table
        const { data: userData, error } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();
        
        if (error || !userData) {
          console.warn('User not found in users table:', error);
          
          // Try to create the user record manually
          console.log('🔐 [SupabaseDataService] Attempting to create user record...');
          const createResult = await userCreationService.ensureUserRecord(user.id, user.email || '');
          
          if (createResult.success && createResult.userId) {
            console.log('🔐 [SupabaseDataService] User record created successfully:', createResult.userId);
            this.userId = createResult.userId;
          } else {
            console.error('🔐 [SupabaseDataService] Failed to create user record:', createResult.error);
            this.userId = null;
          }
        } else {
          this.userId = userData.id;
        }
      } else {
        this.userId = null;
      }
    } catch (error) {
      console.error('🔐 [SupabaseDataService] Error initializing user ID:', error);
      this.userId = null;
    }
  }

  private async getUserId(): Promise<string | null> {
    if (!this.userId) {
      await this.initializeUserId();
    }
    return this.userId;
  }

  private async isAuthenticated(): Promise<boolean> {
    if (this.userId !== null) {
      return true;
    }
    // If userId is null, try to initialize it
    await this.initializeUserId();
    return this.userId !== null;
  }

  // =====================================================
  // USER USAGE DATA MANAGEMENT
  // =====================================================

  async getUserUsageData(): Promise<UserUsageData> {
    try {
      if (!(await this.isAuthenticated())) {
        // Return default usage data for unauthenticated users
        return {
          tier: 'free',
          textCount: 0,
          imageCount: 0,
          textLimit: 50,
          imageLimit: 10
        };
      }
      const userId = await this.getUserId();
      if (!userId) {
        // Return default usage data if no user ID
        return {
          tier: 'free',
          textCount: 0,
          imageCount: 0,
          textLimit: 50,
          imageLimit: 10
        };
      }
      const { data, error } = await supabase.rpc('migrate_user_usage_data', {
        p_user_id: userId
      });

      if (error) {
        console.error('Supabase usage data fetch failed:', error);
        // Return default usage data if function doesn't exist
        return {
          tier: 'free',
          textCount: 0,
          imageCount: 0,
          textLimit: 50,
          imageLimit: 10
        };
      }
      return data;
    } catch (error) {
      console.error('Supabase usage data fetch failed:', error);
      // Return default usage data if function doesn't exist
      return {
        tier: 'free',
        textCount: 0,
        imageCount: 0,
        textLimit: 50,
        imageLimit: 10
      };
    }
  }

  async updateUserUsage(field: string, value: any): Promise<void> {
    try {
      if (!(await this.isAuthenticated())) {
        throw new Error('User not authenticated');
      }
      const userId = await this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      const { error } = await supabase.rpc('update_user_usage', {
        p_user_id: userId,
        p_field: field,
        p_value: value
      });

      if (error) throw error;
      
      console.log('✅ Usage data updated in Supabase');
    } catch (error) {
      console.error('❌ Supabase usage update failed:', error);
      throw error;
    }
  }

  async incrementUsageCount(type: 'text' | 'image'): Promise<void> {
    const currentUsage = await this.getUserUsageData();
    const field = type === 'text' ? 'textCount' : 'imageCount';
    const newCount = currentUsage[field] + 1;
    
    await this.updateUserUsage(field, newCount);
  }

  // =====================================================
  // USER APP STATE MANAGEMENT
  // =====================================================

  async getUserAppState(): Promise<UserAppState> {
    try {
      if (!(await this.isAuthenticated())) {
        // Return default app state for unauthenticated users
        return {
          lastVisited: new Date().toISOString(),
          appSettings: {},
          uiPreferences: {},
          featureFlags: {},
          lastInteraction: new Date().toISOString(),
          onboardingData: {},
          profileData: {}
        };
      }
      const userId = await this.getUserId();
      if (!userId) {
        // Return default app state if no user ID
        return {
          lastVisited: new Date().toISOString(),
          appSettings: {},
          uiPreferences: {},
          featureFlags: {},
          lastInteraction: new Date().toISOString(),
          onboardingData: {},
          profileData: {}
        };
      }
      const { data, error } = await supabase.rpc('migrate_user_app_state', {
        p_user_id: userId
      });

      if (error) {
        console.error('Supabase app state fetch failed:', error);
        // Return default app state if function doesn't exist
        return {
          lastVisited: new Date().toISOString(),
          appSettings: {},
          uiPreferences: {},
          featureFlags: {},
          lastInteraction: new Date().toISOString(),
          onboardingData: {},
          profileData: {}
        };
      }
      return data;
    } catch (error) {
      console.error('Supabase app state fetch failed:', error);
      // Return default app state if function doesn't exist
      return {
        lastVisited: new Date().toISOString(),
        appSettings: {},
        uiPreferences: {},
        featureFlags: {},
        lastInteraction: new Date().toISOString(),
        onboardingData: {},
        profileData: {}
      };
    }
  }

  async updateUserAppState(field: string, value: any): Promise<void> {
    try {
      const userId = await this.getUserId();
      const { error } = await supabase.rpc('update_user_app_state', {
        p_user_id: userId,
        p_field: field,
        p_value: value
      });

      if (error) throw error;
      
      console.log('✅ App state updated in Supabase');
    } catch (error) {
      console.error('❌ Supabase app state update failed:', error);
      throw error;
    }
  }

  async updateLastInteraction(): Promise<void> {
    await this.updateUserAppState('lastInteraction', new Date().toISOString());
  }

  // =====================================================
  // USER PREFERENCES MANAGEMENT
  // =====================================================

  async getUserPreferences(): Promise<UserPreferences> {
    try {
      const userId = await this.getUserId();
      const { data, error } = await supabase.rpc('get_user_preferences', {
        p_user_id: userId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Supabase preferences fetch failed:', error);
      throw error;
    }
  }

  async updateUserPreferences(field: keyof UserPreferences, value: any): Promise<void> {
    try {
      const userId = await this.getUserId();
      const { error } = await supabase.rpc('update_user_app_state', {
        p_user_id: userId,
        p_field: `preferences.${field}`,
        p_value: value
      });

      if (error) throw error;
      
      console.log('✅ User preferences updated in Supabase');
    } catch (error) {
      console.error('❌ Supabase preferences update failed:', error);
      throw error;
    }
  }

  // =====================================================
  // DAILY ENGAGEMENT MANAGEMENT
  // =====================================================

  async getDailyEngagement(date?: string): Promise<DailyEngagement> {
    try {
      const userId = await this.getUserId();
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase.rpc('get_daily_engagement', {
        p_user_id: userId,
        p_date: targetDate
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Supabase daily engagement fetch failed:', error);
      throw error;
    }
  }

  async updateDailyEngagement(field: string, value: any, date?: string): Promise<void> {
    try {
      const userId = await this.getUserId();
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const { error } = await supabase.rpc('update_daily_engagement', {
        p_user_id: userId,
        p_date: targetDate,
        p_field: field,
        p_value: value
      });

      if (error) throw error;
      
      console.log('✅ Daily engagement updated in Supabase');
    } catch (error) {
      console.error('❌ Supabase daily engagement update failed:', error);
      throw error;
    }
  }

  async completeDailyCheckin(): Promise<void> {
    await this.updateDailyEngagement('checkinCompleted', true);
  }

  async updateStreak(type: 'dailyCheckin' | 'weeklyGoals' | 'monthlyStreak', value: number): Promise<void> {
    const currentEngagement = await this.getDailyEngagement();
    const newStreaks = { ...currentEngagement.streaks, [type]: value };
    await this.updateDailyEngagement('streaks', newStreaks);
  }

  // =====================================================
  // APP CACHE MANAGEMENT
  // =====================================================

  async getAppCache(cacheKey: string): Promise<AppCache | null> {
    try {
      if (!(await this.isAuthenticated())) {
        throw new Error('User not authenticated');
      }
      const userId = await this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      const { data, error } = await supabase.rpc('get_app_cache', {
        p_user_id: userId,
        p_cache_key: cacheKey
      });

      if (error) throw error;
      return data ? { cacheData: data, expiresAt: null } : null;
    } catch (error) {
      console.warn('Supabase cache fetch failed, using localStorage fallback:', error);
      return this.getLocalStorageCache(cacheKey);
    }
  }

  async setAppCache(cacheKey: string, cacheData: any, expiresAt?: string): Promise<void> {
    try {
      if (!(await this.isAuthenticated())) {
        throw new Error('User not authenticated');
      }
      
      const userId = await this.getUserId();
      const { error } = await supabase.rpc('set_app_cache', {
        p_user_id: userId,
        p_cache_key: cacheKey,
        p_cache_data: cacheData,
        p_expires_at: expiresAt
      });

      if (error) throw error;
      
      console.log('✅ App cache set in Supabase');
    } catch (error) {
      console.error('❌ Supabase cache set failed:', error);
      throw error;
    }
  }

  async clearExpiredCache(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('clear_expired_app_cache');
      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.warn('Supabase cache cleanup failed:', error);
      return 0;
    }
  }

  // =====================================================
  // WELCOME MESSAGE MANAGEMENT
  // =====================================================

  async shouldShowWelcomeMessage(): Promise<boolean> {
    try {
      const isDevMode = ((import.meta as any)?.env?.DEV === true) || (typeof window !== 'undefined' && localStorage.getItem('otakon_developer_mode') === 'true');
      
      // Check if we've already determined welcome status for this session to avoid repeated calls
      const sessionKey = 'otakon_welcome_status_determined';
      const cachedStatus = sessionStorage.getItem(sessionKey);
      if (cachedStatus !== null) {
        return cachedStatus === 'true';
      }
      
      if (!(await this.isAuthenticated())) {
        // In dev/developer mode, fall back to localStorage-based welcome logic
        if (isDevMode) {
          const result = this.shouldShowLocalStorageWelcome();
          sessionStorage.setItem(sessionKey, result.toString());
          return result;
        }
        // Cache negative result to prevent repeated calls
        sessionStorage.setItem(sessionKey, 'false');
        return false;
      }
      
      const userId = await this.getUserId();
      if (!userId) {
        if (isDevMode) {
          const result = this.shouldShowLocalStorageWelcome();
          sessionStorage.setItem(sessionKey, result.toString());
          return result;
        }
        // Cache negative result to prevent repeated calls
        sessionStorage.setItem(sessionKey, 'false');
        return false;
      }
      
      const { data, error } = await supabase.rpc('should_show_welcome_message', {
        p_user_id: userId
      });

      if (error) {
        // Only log error in development mode to reduce console noise
        if (isDevMode) {
          console.warn('Supabase welcome message check failed:', error);
        }
        // In dev/developer mode, fall back to localStorage-based welcome logic
        const isDev = ((import.meta as any)?.env?.DEV === true) || (typeof window !== 'undefined' && localStorage.getItem('otakon_developer_mode') === 'true');
        const result = isDev ? this.shouldShowLocalStorageWelcome() : false;
        sessionStorage.setItem(sessionKey, result.toString());
        return result;
      }
      
      const result = data || false;
      sessionStorage.setItem(sessionKey, result.toString());
      return result;
    } catch (error) {
      // Only log error in development mode to reduce console noise
      const isDevMode = ((import.meta as any)?.env?.DEV === true) || (typeof window !== 'undefined' && localStorage.getItem('otakon_developer_mode') === 'true');
      if (isDevMode) {
        console.warn('Supabase welcome message check failed:', error);
      }
      // In dev/developer mode, fall back to localStorage-based welcome logic
      const isDev = ((import.meta as any)?.env?.DEV === true) || (typeof window !== 'undefined' && localStorage.getItem('otakon_developer_mode') === 'true');
      const result = isDev ? this.shouldShowLocalStorageWelcome() : false;
      sessionStorage.setItem('otakon_welcome_status_determined', result.toString());
      return result;
    }
  }

  async updateWelcomeMessageShown(messageType: string = 'standard'): Promise<void> {
    try {
      const userId = await this.getUserId();
      const { error } = await supabase.rpc('update_welcome_message_shown', {
        p_user_id: userId,
        p_message_type: messageType
      });

      if (error) throw error;
      
      console.log('✅ Welcome message state updated in Supabase');
    } catch (error) {
      console.error('❌ Supabase welcome message update failed:', error);
      // In dev/developer mode, update localStorage fallback to keep UX consistent
      const isDev = ((import.meta as any)?.env?.DEV === true) || (typeof window !== 'undefined' && localStorage.getItem('otakon_developer_mode') === 'true');
      if (isDev) {
        this.updateLocalStorageWelcomeShown();
        return;
      }
      throw error; // Let the caller handle the error outside dev
    }
  }

  async markFirstRunCompleted(): Promise<void> {
    try {
      const userId = await this.getUserId();
      const { error } = await supabase.rpc('mark_first_run_completed', {
        p_user_id: userId
      });

      if (error) throw error;
      
      console.log('✅ First run completed marked in Supabase');
    } catch (error) {
      console.error('❌ Supabase first run completion failed:', error);
      throw error; // Let the caller handle the error
    }
  }

  // =====================================================
  // APP STATE PERSISTENCE
  // =====================================================

  async saveAppState(appState: any): Promise<void> {
    try {
      if (!(await this.isAuthenticated())) {
        throw new Error('User not authenticated');
      }
      const userId = await this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const { error } = await supabase.rpc('save_app_state', {
        p_user_id: userId,
        p_app_state: appState
      });

      if (error) throw error;
      
      console.log('✅ App state saved to Supabase');
    } catch (error) {
      console.error('Error saving app state:', error);
      // Fallback to localStorage
      localStorage.setItem('otakon_app_state_backup', JSON.stringify(appState));
      throw error;
    }
  }

  async getAppState(): Promise<any> {
    try {
      if (!(await this.isAuthenticated())) {
        throw new Error('User not authenticated');
      }
      const userId = await this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase.rpc('get_app_state', {
        p_user_id: userId
      });

      if (error) throw error;
      
      return data || {};
    } catch (error) {
      console.error('Error getting app state:', error);
      // Fallback to localStorage
      const backup = localStorage.getItem('otakon_app_state_backup');
      return backup ? JSON.parse(backup) : {};
    }
  }

  async resetWelcomeMessageTracking(): Promise<void> {
    try {
      const userId = await this.getUserId();
      const { error } = await supabase.rpc('reset_welcome_message_tracking', {
        p_user_id: userId
      });

      if (error) throw error;
      
      console.log('✅ Welcome message tracking reset in Supabase');
    } catch (error) {
      console.error('❌ Supabase welcome message reset failed:', error);
      // In dev/developer mode, reset localStorage fallback for welcome state
      const isDev = ((import.meta as any)?.env?.DEV === true) || (typeof window !== 'undefined' && localStorage.getItem('otakon_developer_mode') === 'true');
      if (isDev) {
        this.resetLocalStorageWelcomeTracking();
        return;
      }
      throw error; // Let the caller handle the error outside dev
    }
  }


  async getCompleteUserData(): Promise<any> {
    try {
      const userId = await this.getUserId();
      const { data, error } = await supabase.rpc('get_complete_user_data', {
        p_user_id: userId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Complete user data fetch failed:', error);
      return this.getLocalStorageCompleteData();
    }
  }

  // =====================================================
  // LOCALSTORAGE FALLBACK METHODS
  // =====================================================

  private getLocalStorageUsageData(): UserUsageData {
    const defaultData: UserUsageData = {
      tier: 'free',
      textCount: 0,
      imageCount: 0,
      textLimit: 50,
      imageLimit: 10,
      lastMonth: new Date().toISOString().slice(0, 7),
      usageHistory: [],
      tierHistory: [],
      lastReset: new Date().toISOString()
    };

    try {
      const stored = localStorage.getItem('otakon_usage_data');
      return stored ? { ...defaultData, ...JSON.parse(stored) } : defaultData;
    } catch {
      return defaultData;
    }
  }

  private updateLocalStorageUsage(field: string, value: any): void {
    try {
      const current = this.getLocalStorageUsageData();
      const updated = { ...current, [field]: value };
      localStorage.setItem('otakon_usage_data', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update localStorage usage:', error);
    }
  }

  private getLocalStorageAppState(): UserAppState {
    const defaultData: UserAppState = {
      lastVisited: new Date().toISOString(),
      uiPreferences: {},
      featureFlags: {},
      appSettings: {},
      lastInteraction: new Date().toISOString()
    };

    try {
      const stored = localStorage.getItem('otakon_app_state');
      return stored ? { ...defaultData, ...JSON.parse(stored) } : defaultData;
    } catch {
      return defaultData;
    }
  }

  private updateLocalStorageAppState(field: string, value: any): void {
    try {
      const current = this.getLocalStorageAppState();
      const updated = { ...current, [field]: value };
      localStorage.setItem('otakon_app_state', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update localStorage app state:', error);
    }
  }

  private getLocalStoragePreferences(): UserPreferences {
    const defaultData: UserPreferences = {
      gameGenre: 'rpg',
      detailLevel: 'concise',
      aiPersonality: 'encouraging',
      preferredResponseFormat: 'text_with_bullets',
      skillLevel: 'intermediate',
      notificationPreferences: {},
      accessibilitySettings: {}
    };

    try {
      const stored = localStorage.getItem('otakon_preferences');
      return stored ? { ...defaultData, ...JSON.parse(stored) } : defaultData;
    } catch {
      return defaultData;
    }
  }

  private updateLocalStoragePreferences(field: keyof UserPreferences, value: any): void {
    try {
      const current = this.getLocalStoragePreferences();
      const updated = { ...current, [field]: value };
      localStorage.setItem('otakon_preferences', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update localStorage preferences:', error);
    }
  }

  private getLocalStorageDailyEngagement(date?: string): DailyEngagement {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const defaultData: DailyEngagement = {
      goals: [],
      streaks: {
        dailyCheckin: 0,
        weeklyGoals: 0,
        monthlyStreak: 0
      },
      checkinCompleted: false,
      lastSessionTime: null
    };

    try {
      const stored = localStorage.getItem(`otakon_daily_engagement_${targetDate}`);
      return stored ? { ...defaultData, ...JSON.parse(stored) } : defaultData;
    } catch {
      return defaultData;
    }
  }

  private updateLocalStorageDailyEngagement(field: string, value: any, date?: string): void {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const current = this.getLocalStorageDailyEngagement(targetDate);
      const updated = { ...current, [field]: value };
      localStorage.setItem(`otakon_daily_engagement_${targetDate}`, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update localStorage daily engagement:', error);
    }
  }

  private getLocalStorageCache(cacheKey: string): AppCache | null {
    try {
      const stored = localStorage.getItem(`otakon_cache_${cacheKey}`);
      if (!stored) return null;

      const data = JSON.parse(stored);
      if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
        localStorage.removeItem(`otakon_cache_${cacheKey}`);
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  private setLocalStorageCache(cacheKey: string, cacheData: any, expiresAt?: string): void {
    try {
      const data = { cacheData, expiresAt };
      localStorage.setItem(`otakon_cache_${cacheKey}`, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to set localStorage cache:', error);
    }
  }

  private getLocalStorageCompleteData(): any {
    return {
      profile: this.getLocalStorageUsageData(),
      usage: this.getLocalStorageUsageData(),
      appState: this.getLocalStorageAppState(),
      preferences: this.getLocalStoragePreferences(),
      lastUpdated: new Date().toISOString()
    };
  }

  // =====================================================
  // LOCALSTORAGE WELCOME MESSAGE FALLBACKS
  // =====================================================

  private shouldShowLocalStorageWelcome(): boolean {
    const hasSeenWelcome = localStorage.getItem('otakon_welcome_message_shown') === 'true';
    if (!hasSeenWelcome) return true;

    const lastWelcomeTime = localStorage.getItem('otakon_last_welcome_time');
    if (!lastWelcomeTime) return true;

    const timeSinceLastWelcome = Date.now() - parseInt(lastWelcomeTime, 10);
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
    
    return timeSinceLastWelcome >= TWELVE_HOURS_MS;
  }

  private updateLocalStorageWelcomeShown(): void {
    localStorage.setItem('otakon_welcome_message_shown', 'true');
    localStorage.setItem('otakon_last_welcome_time', Date.now().toString());
    localStorage.setItem('otakon_last_session_date', new Date().toDateString());
    const currentCount = parseInt(localStorage.getItem('otakon_welcome_message_count') || '0', 10);
    localStorage.setItem('otakon_welcome_message_count', (currentCount + 1).toString());
  }

  private updateLocalStorageFirstRunCompleted(): void {
    localStorage.setItem('otakon_first_run_completed', 'true');
    localStorage.setItem('otakon_first_game_conversation_date', new Date().toISOString());
  }

  private resetLocalStorageWelcomeTracking(): void {
    localStorage.removeItem('otakon_welcome_message_shown');
    localStorage.removeItem('otakon_last_welcome_time');
    localStorage.removeItem('otakon_last_session_date');
    localStorage.removeItem('otakon_first_run_completed');
    localStorage.removeItem('otakon_first_game_conversation_date');
    localStorage.removeItem('otakon_app_closed_time');
  }

  // =====================================================
  // BULK OPERATIONS
  // =====================================================
}

// Export singleton instance
export const supabaseDataService = new SupabaseDataService();

// Export individual methods for convenience
export const {
  getUserUsageData,
  updateUserUsage,
  incrementUsageCount,
  getUserAppState,
  updateUserAppState,
  updateLastInteraction,
  getUserPreferences,
  updateUserPreferences,
  getDailyEngagement,
  updateDailyEngagement,
  completeDailyCheckin,
  updateStreak,
  getAppCache,
  setAppCache,
  clearExpiredCache,
  shouldShowWelcomeMessage,
  updateWelcomeMessageShown,
  markFirstRunCompleted,
  resetWelcomeMessageTracking,
  getCompleteUserData,
  saveAppState,
  getAppState
} = supabaseDataService;
