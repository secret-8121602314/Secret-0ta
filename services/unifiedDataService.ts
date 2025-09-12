import { supabase } from './supabase';
import { supabaseDataService } from './supabaseDataService';

// Constants for localStorage keys that align with Supabase tables
export const STORAGE_KEYS = {
  // User usage data (aligns with user_usage table)
  USER_TIER: 'otakonUserTier',
  TEXT_COUNT: 'otakonTextQueryCount',
  IMAGE_COUNT: 'otakonImageQueryCount',
  LAST_USAGE_DATE: 'otakonLastUsageDate',
  
  // User app state (aligns with users.app_state JSONB)
  APP_STATE: 'otakonAppState',
  LAST_VISITED: 'otakonLastVisited',
  UI_PREFERENCES: 'otakonUIPreferences',
  FEATURE_FLAGS: 'otakonFeatureFlags',
  APP_SETTINGS: 'otakonAppSettings',
  LAST_INTERACTION: 'otakonLastInteraction',
  PWA_ANALYTICS: 'otakonPWAAnalytics',
  WISHLIST: 'otakonWishlist',
  OTAKU_DIARY: 'otakonOtakuDiary',
  API_COST_RECORDS: 'otakonAPICostRecords',
  PROACTIVE_INSIGHTS: 'otakonProactiveInsights',
  PWA_INSTALLED: 'otakonPWAInstalled',
  PWA_GLOBAL_INSTALLED: 'otakonPWAGlobalInstalled',
  
  // User preferences (aligns with users.preferences JSONB)
  USER_PREFERENCES: 'otakonUserPreferences',
  GAME_GENRE: 'otakonGameGenre',
  DETAIL_LEVEL: 'otakonDetailLevel',
  AI_PERSONALITY: 'otakonAIPersonality',
  PREFERRED_RESPONSE_FORMAT: 'otakonPreferredResponseFormat',
  SKILL_LEVEL: 'otakonSkillLevel',
  NOTIFICATION_PREFERENCES: 'otakonNotificationPreferences',
  ACCESSIBILITY_SETTINGS: 'otakonAccessibilitySettings',
  TTS_SETTINGS: 'otakonTTSSettings',
  PWA_SETTINGS: 'otakonPWASettings',
  PROFILE_NAME: 'otakonProfileName',
  
  // Daily engagement (aligns with daily_engagement table)
  DAILY_ENGAGEMENT: 'otakonDailyEngagement',
  DAILY_GOALS: 'otakonDailyGoals',
  DAILY_STREAKS: 'otakonDailyStreaks',
  CHECKIN_COMPLETED: 'otakonCheckinCompleted',
  LAST_SESSION_TIME: 'otakonLastSessionTime',
  
  // App cache (aligns with app_cache table)
  APP_CACHE: 'otakonAppCache',
  
  // Otaku Diary specific (aligns with users.app_state.otakuDiary)
  TASKS_PREFIX: 'otakon_tasks_',
  FAVORITES_PREFIX: 'otakon_favorites_',
  
  // PWA specific
  PWA_INSTALLS: 'otakon_pwa_installs',
  PWA_ENGAGEMENT: 'otakon_pwa_engagement',
  
  // App state
  APP_CLOSED_TIME: 'otakon_app_closed_time',
  WELCOME_MESSAGE_SHOWN: 'otakon_welcome_message_shown'
} as const;

export interface UnifiedDataResult<T> {
  data: T;
  source: 'supabase' | 'localStorage' | 'fallback';
  authenticated: boolean;
}

export class UnifiedDataService {
  private static instance: UnifiedDataService;
  private isAuthenticated: boolean = false;
  private isDeveloperMode: boolean = false;

  static getInstance(): UnifiedDataService {
    if (!UnifiedDataService.instance) {
      UnifiedDataService.instance = new UnifiedDataService();
    }
    return UnifiedDataService.instance;
  }

  constructor() {
    this.checkAuthStatus();
    this.checkDeveloperMode();
  }

  private async checkAuthStatus(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      this.isAuthenticated = !!user;
    } catch (error) {
      this.isAuthenticated = false;
    }
  }

  private checkDeveloperMode(): void {
    // Check if we're in development mode (no authenticated user AND auth method is 'skip')
    const authMethod = localStorage.getItem('otakonAuthMethod');
    this.isDeveloperMode = !this.isAuthenticated && authMethod === 'skip';
  }

  /**
   * Generic method to get data with strict mode separation
   * For authenticated users: Supabase only (no fallbacks)
   * For developer mode: localStorage only (no Supabase)
   */
  async getData<T>(
    key: string,
    supabaseGetter: () => Promise<T>,
    localStorageKey: string,
    defaultValue: T
  ): Promise<UnifiedDataResult<T>> {
    try {
      // For authenticated users: Supabase only
      if (this.isAuthenticated) {
        const data = await supabaseGetter();
        return {
          data,
          source: 'supabase',
          authenticated: true
        };
      }

      // For developer mode: localStorage only
      const localData = this.getLocalStorageData(localStorageKey, defaultValue);
      return {
        data: localData,
        source: 'localStorage',
        authenticated: false
      };
    } catch (error) {
      console.error(`Failed to get data for ${key}:`, error);
      
      // For authenticated users, throw error (no fallback)
      if (this.isAuthenticated) {
        throw error;
      }
      
      // For developer mode, return default value
      return {
        data: defaultValue,
        source: 'fallback',
        authenticated: false
      };
    }
  }

  /**
   * Generic method to set data with strict mode separation
   * For authenticated users: Supabase only (no fallbacks)
   * For developer mode: localStorage only (no Supabase)
   */
  async setData<T>(
    key: string,
    value: T,
    supabaseSetter: () => Promise<void>,
    localStorageKey: string
  ): Promise<UnifiedDataResult<void>> {
    try {
      // For authenticated users, only use Supabase
      if (this.isAuthenticated) {
        await supabaseSetter();
        return {
          data: undefined as any,
          source: 'supabase',
          authenticated: true
        };
      }

      // For developer mode: localStorage only
      this.setLocalStorageData(localStorageKey, value);
      return {
        data: undefined as any,
        source: 'localStorage',
        authenticated: false
      };
    } catch (error) {
      console.error(`Failed to set data for ${key}:`, error);
      
      // For authenticated users, throw error (no fallback)
      if (this.isAuthenticated) {
        throw error;
      }
      
      // For developer mode, still try to save to localStorage
      this.setLocalStorageData(localStorageKey, value);
      return {
        data: undefined as any,
        source: 'localStorage',
        authenticated: false
      };
    }
  }

  // Helper methods for localStorage operations
  private setLocalStorageData<T>(key: string, value: T): void {
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.warn(`Failed to set localStorage for ${key}:`, error);
    }
  }

  private getLocalStorageData<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) return defaultValue;
      
      try {
        return JSON.parse(stored);
      } catch {
        return stored as T;
      }
    } catch (error) {
      console.warn(`Failed to get localStorage for ${key}:`, error);
      return defaultValue;
    }
  }

  // Specific data operation methods that use the unified pattern

  // User Usage Data
  async getUserUsageData() {
    return this.getData(
      'userUsageData',
      () => supabaseDataService.getUserUsageData(),
      STORAGE_KEYS.USER_TIER,
      {
        tier: 'free',
        textCount: 0,
        imageCount: 0,
        textLimit: 50,
        imageLimit: 10,
        lastMonth: new Date().toISOString().slice(0, 7),
        usageHistory: [],
        tierHistory: [],
        lastReset: new Date().toISOString()
      }
    );
  }

  async updateUserUsage(field: string, value: any) {
    return this.setData(
      'userUsageData',
      undefined,
      () => supabaseDataService.updateUserUsage(field, value),
      STORAGE_KEYS.USER_TIER
    );
  }

  // User App State
  async getUserAppState() {
    return this.getData(
      'userAppState',
      () => supabaseDataService.getUserAppState(),
      STORAGE_KEYS.APP_STATE,
      {
        lastVisited: new Date().toISOString(),
        uiPreferences: {},
        featureFlags: {},
        appSettings: {},
        lastInteraction: new Date().toISOString(),
        pwaAnalytics: {},
        wishlist: {},
        otakuDiary: {},
        apiCostRecords: [],
        proactiveInsights: [],
        pwaInstalled: false,
        pwaGlobalInstalled: false
      }
    );
  }

  async updateUserAppState(field: string, value: any) {
    return this.setData(
      'userAppState',
      undefined,
      () => supabaseDataService.updateUserAppState(field, value),
      STORAGE_KEYS.APP_STATE
    );
  }

  // User Preferences
  async getUserPreferences() {
    return this.getData(
      'userPreferences',
      () => supabaseDataService.getUserPreferences(),
      STORAGE_KEYS.USER_PREFERENCES,
      {
        gameGenre: 'general',
        detailLevel: 'medium',
        aiPersonality: 'helpful',
        preferredResponseFormat: 'conversational',
        skillLevel: 'beginner',
        notificationPreferences: {},
        accessibilitySettings: {},
        tts: {},
        pwa: {},
        profileName: 'Player'
      }
    );
  }

  async updateUserPreferences(field: string, value: any) {
    return this.setData(
      'userPreferences',
      undefined,
      () => supabaseDataService.updateUserPreferences(field as any, value),
      STORAGE_KEYS.USER_PREFERENCES
    );
  }

  // Daily Engagement
  async getDailyEngagement(date?: string) {
    return this.getData(
      'dailyEngagement',
      () => supabaseDataService.getDailyEngagement(date),
      STORAGE_KEYS.DAILY_ENGAGEMENT,
      {
        goals: [],
        streaks: {
          dailyCheckin: 0,
          weeklyGoals: 0,
          monthlyStreak: 0
        },
        checkinCompleted: false,
        lastSessionTime: null
      }
    );
  }

  async updateDailyEngagement(field: string, value: any, date?: string) {
    return this.setData(
      'dailyEngagement',
      undefined,
      () => supabaseDataService.updateDailyEngagement(field, value, date),
      STORAGE_KEYS.DAILY_ENGAGEMENT
    );
  }

  // App Cache
  async getAppCache(cacheKey: string) {
    return this.getData(
      'appCache',
      () => supabaseDataService.getAppCache(cacheKey),
      `${STORAGE_KEYS.APP_CACHE}_${cacheKey}`,
      null
    );
  }

  async setAppCache(cacheKey: string, cacheData: any, expiresAt?: string) {
    return this.setData(
      'appCache',
      undefined,
      () => supabaseDataService.setAppCache(cacheKey, cacheData, expiresAt),
      `${STORAGE_KEYS.APP_CACHE}_${cacheKey}`
    );
  }

  // Otaku Diary specific methods
  async getOtakuDiaryData(gameId: string) {
    const tasksKey = `${STORAGE_KEYS.TASKS_PREFIX}${gameId}`;
    const favoritesKey = `${STORAGE_KEYS.FAVORITES_PREFIX}${gameId}`;
    
    const tasks = this.getLocalStorageData(tasksKey, []);
    const favorites = this.getLocalStorageData(favoritesKey, []);
    
    return {
      tasks,
      favorites,
      source: 'localStorage' as const,
      authenticated: false
    };
  }

  async setOtakuDiaryData(gameId: string, data: { tasks?: any[], favorites?: any[] }) {
    if (data.tasks !== undefined) {
      const tasksKey = `${STORAGE_KEYS.TASKS_PREFIX}${gameId}`;
      this.setLocalStorageData(tasksKey, data.tasks);
    }
    
    if (data.favorites !== undefined) {
      const favoritesKey = `${STORAGE_KEYS.FAVORITES_PREFIX}${gameId}`;
      this.setLocalStorageData(favoritesKey, data.favorites);
    }
    
    // Try to sync to Supabase if possible
    try {
      if (this.isAuthenticated) {
        await supabaseDataService.updateUserAppState('otakuDiary', {
          [`tasks_${gameId}`]: data.tasks || [],
          [`favorites_${gameId}`]: data.favorites || []
        });
      }
    } catch (error) {
      console.warn('Failed to sync Otaku Diary data to Supabase:', error);
    }
  }

  // Utility methods
  isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  isInDeveloperMode(): boolean {
    return this.isDeveloperMode;
  }

  // Force refresh auth status (useful after login/logout)
  async refreshAuthStatus(): Promise<void> {
    await this.checkAuthStatus();
    this.checkDeveloperMode();
  }
}

// Export singleton instance
export const unifiedDataService = UnifiedDataService.getInstance();
