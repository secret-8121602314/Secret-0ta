import { supabase } from './supabase';

export interface UserUsageData {
  tier: string;
  textCount: number;
  imageCount: number;
  lastMonth: string;
  usageHistory: any[];
  tierHistory: any[];
  lastReset: string;
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

  constructor() {
    this.initializeUserId();
  }

  private async initializeUserId() {
    const { data: { user } } = await supabase.auth.getUser();
    this.userId = user?.id || null;
  }

  private async getUserId(): Promise<string> {
    if (!this.userId) {
      await this.initializeUserId();
    }
    if (!this.userId) {
      throw new Error('User not authenticated');
    }
    return this.userId;
  }

  // =====================================================
  // USER USAGE DATA MANAGEMENT
  // =====================================================

  async getUserUsageData(): Promise<UserUsageData> {
    try {
      const userId = await this.getUserId();
      const { data, error } = await supabase.rpc('migrate_user_usage_data', {
        p_user_id: userId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Supabase usage data fetch failed, using localStorage fallback:', error);
      return this.getLocalStorageUsageData();
    }
  }

  async updateUserUsage(field: string, value: any): Promise<void> {
    try {
      const userId = await this.getUserId();
      const { error } = await supabase.rpc('update_user_usage', {
        p_user_id: userId,
        p_field: field,
        p_value: value
      });

      if (error) throw error;
      
      // Also update localStorage as backup
      this.updateLocalStorageUsage(field, value);
    } catch (error) {
      console.warn('Supabase usage update failed, using localStorage fallback:', error);
      this.updateLocalStorageUsage(field, value);
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
      const userId = await this.getUserId();
      const { data, error } = await supabase.rpc('migrate_user_app_state', {
        p_user_id: userId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Supabase app state fetch failed, using localStorage fallback:', error);
      return this.getLocalStorageAppState();
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
      
      // Also update localStorage as backup
      this.updateLocalStorageAppState(field, value);
    } catch (error) {
      console.warn('Supabase app state update failed, using localStorage fallback:', error);
      this.updateLocalStorageAppState(field, value);
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
      console.warn('Supabase preferences fetch failed, using localStorage fallback:', error);
      return this.getLocalStoragePreferences();
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
      
      // Also update localStorage as backup
      this.updateLocalStoragePreferences(field, value);
    } catch (error) {
      console.warn('Supabase preferences update failed, using localStorage fallback:', error);
      this.updateLocalStoragePreferences(field, value);
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
      console.warn('Supabase daily engagement fetch failed, using localStorage fallback:', error);
      return this.getLocalStorageDailyEngagement(date);
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
      
      // Also update localStorage as backup
      this.updateLocalStorageDailyEngagement(field, value, date);
    } catch (error) {
      console.warn('Supabase daily engagement update failed, using localStorage fallback:', error);
      this.updateLocalStorageDailyEngagement(field, value, date);
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
      const userId = await this.getUserId();
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
      const userId = await this.getUserId();
      const { error } = await supabase.rpc('set_app_cache', {
        p_user_id: userId,
        p_cache_key: cacheKey,
        p_cache_data: cacheData,
        p_expires_at: expiresAt
      });

      if (error) throw error;
      
      // Also update localStorage as backup
      this.setLocalStorageCache(cacheKey, cacheData, expiresAt);
    } catch (error) {
      console.warn('Supabase cache set failed, using localStorage fallback:', error);
      this.setLocalStorageCache(cacheKey, cacheData, expiresAt);
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
      const userId = await this.getUserId();
      const { data, error } = await supabase.rpc('should_show_welcome_message', {
        p_user_id: userId
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.warn('Supabase welcome message check failed, using localStorage fallback:', error);
      return this.shouldShowLocalStorageWelcome();
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
      
      // Also update localStorage as backup
      this.updateLocalStorageWelcomeShown();
    } catch (error) {
      console.warn('Supabase welcome message update failed, using localStorage fallback:', error);
      this.updateLocalStorageWelcomeShown();
    }
  }

  async markFirstRunCompleted(): Promise<void> {
    try {
      const userId = await this.getUserId();
      const { error } = await supabase.rpc('mark_first_run_completed', {
        p_user_id: userId
      });

      if (error) throw error;
      
      // Also update localStorage as backup
      this.updateLocalStorageFirstRunCompleted();
    } catch (error) {
      console.warn('Supabase first run completion failed, using localStorage fallback:', error);
      this.updateLocalStorageFirstRunCompleted();
    }
  }

  async resetWelcomeMessageTracking(): Promise<void> {
    try {
      const userId = await this.getUserId();
      const { error } = await supabase.rpc('reset_welcome_message_tracking', {
        p_user_id: userId
      });

      if (error) throw error;
      
      // Also update localStorage as backup
      this.resetLocalStorageWelcomeTracking();
    } catch (error) {
      console.warn('Supabase welcome message reset failed, using localStorage fallback:', error);
      this.resetLocalStorageWelcomeTracking();
    }
  }

  // =====================================================
  // MIGRATION AND UTILITY FUNCTIONS
  // =====================================================

  async checkMigrationStatus(): Promise<any> {
    try {
      const userId = await this.getUserId();
      const { data, error } = await supabase.rpc('check_user_migration_status', {
        p_user_id: userId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Migration status check failed:', error);
      return { needsMigration: true, migrationStatus: 'unknown' };
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
      migrationComplete: false,
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

  // =====================================================
  // COMPREHENSIVE LOCALSTORAGE MIGRATION
  // =====================================================

  async migrateAllLocalStorageData(): Promise<void> {
    try {
      const userId = await this.getUserId();
      
      // Migrate usage data
      const usageData = this.getLocalStorageUsageData();
      await this.updateUserUsage('tier', usageData.tier);
      await this.updateUserUsage('textCount', usageData.textCount);
      await this.updateUserUsage('imageCount', usageData.imageCount);
      await this.updateUserUsage('lastMonth', usageData.lastMonth);
      await this.updateUserUsage('usageHistory', usageData.usageHistory);
      await this.updateUserUsage('tierHistory', usageData.tierHistory);
      await this.updateUserUsage('lastReset', usageData.lastReset);

      // Migrate app state
      const appState = this.getLocalStorageAppState();
      await this.updateUserAppState('lastVisited', appState.lastVisited);
      await this.updateUserAppState('uiPreferences', appState.uiPreferences);
      await this.updateUserAppState('featureFlags', appState.featureFlags);
      await this.updateUserAppState('appSettings', appState.appSettings);
      await this.updateUserAppState('lastInteraction', appState.lastInteraction);

      // Migrate preferences
      const preferences = this.getLocalStoragePreferences();
      await this.updateUserPreferences('gameGenre', preferences.gameGenre);
      await this.updateUserPreferences('detailLevel', preferences.detailLevel);
      await this.updateUserPreferences('aiPersonality', preferences.aiPersonality);
      await this.updateUserPreferences('preferredResponseFormat', preferences.preferredResponseFormat);
      await this.updateUserPreferences('skillLevel', preferences.skillLevel);
      await this.updateUserPreferences('notificationPreferences', preferences.notificationPreferences);
      await this.updateUserPreferences('accessibilitySettings', preferences.accessibilitySettings);

      // Migrate additional localStorage keys
      await this.migrateAdditionalLocalStorageKeys();

      console.log('✅ All localStorage data migrated to Supabase successfully');
    } catch (error) {
      console.error('❌ Failed to migrate localStorage data:', error);
    }
  }

  private async migrateAdditionalLocalStorageKeys(): Promise<void> {
    try {
      const userId = await this.getUserId();
      
      // Migrate profile setup and welcome message tracking
      const profileSetupCompleted = localStorage.getItem('otakon_profile_setup_completed');
      const welcomeMessageShown = localStorage.getItem('otakon_welcome_message_shown');
      const lastWelcomeTime = localStorage.getItem('otakon_last_welcome_time');
      const lastSessionDate = localStorage.getItem('otakon_last_session_date');
      const firstRunCompleted = localStorage.getItem('otakon_first_run_completed');
      const firstGameConversationDate = localStorage.getItem('otakon_first_game_conversation_date');
      const appClosedTime = localStorage.getItem('otakon_app_closed_time');
      const hasInteractedWithChat = localStorage.getItem('otakon_has_interacted_with_chat');
      const onboardingComplete = localStorage.getItem('otakonOnboardingComplete');
      const hasConnectedBefore = localStorage.getItem('otakonHasConnectedBefore');
      const authMethod = localStorage.getItem('otakonAuthMethod');
      const installDismissed = localStorage.getItem('otakonInstallDismissed');
      const lastConnectionCode = localStorage.getItem('lastConnectionCode');
      const lastSuggestedPromptsShown = localStorage.getItem('lastSuggestedPromptsShown');

      // Migrate to app_state
      const appStateUpdates: Record<string, any> = {};
      if (profileSetupCompleted) appStateUpdates.profileSetupCompleted = profileSetupCompleted === 'true';
      if (welcomeMessageShown) appStateUpdates.welcomeMessageShown = welcomeMessageShown === 'true';
      if (lastWelcomeTime) appStateUpdates.lastWelcomeTime = parseInt(lastWelcomeTime, 10);
      if (lastSessionDate) appStateUpdates.lastSessionDate = lastSessionDate;
      if (firstRunCompleted) appStateUpdates.firstRunCompleted = firstRunCompleted === 'true';
      if (firstGameConversationDate) appStateUpdates.firstGameConversationDate = firstGameConversationDate;
      if (appClosedTime) appStateUpdates.appClosedTime = parseInt(appClosedTime, 10);
      if (hasInteractedWithChat) appStateUpdates.hasInteractedWithChat = hasInteractedWithChat === 'true';
      if (onboardingComplete) appStateUpdates.onboardingComplete = onboardingComplete === 'true';
      if (hasConnectedBefore) appStateUpdates.hasConnectedBefore = hasConnectedBefore === 'true';
      if (authMethod) appStateUpdates.authMethod = authMethod;
      if (installDismissed) appStateUpdates.installDismissed = installDismissed === 'true';
      if (lastConnectionCode) appStateUpdates.lastConnectionCode = lastConnectionCode;
      if (lastSuggestedPromptsShown) appStateUpdates.lastSuggestedPromptsShown = lastSuggestedPromptsShown;

      // Update app_state in Supabase
      if (Object.keys(appStateUpdates).length > 0) {
        await this.updateUserAppState('bulk', appStateUpdates);
      }

      // Migrate TTS preferences
      const speechRate = localStorage.getItem('otakonSpeechRate');
      const preferredVoiceURI = localStorage.getItem('otakonPreferredVoiceURI');
      if (speechRate || preferredVoiceURI) {
        const ttsPreferences: Record<string, any> = {};
        if (speechRate) ttsPreferences.speechRate = speechRate;
        if (preferredVoiceURI) ttsPreferences.preferredVoiceURI = preferredVoiceURI;
        await this.updateUserPreferences('tts', ttsPreferences);
      }

      // Migrate PWA preferences
      const handsFreeEnabled = localStorage.getItem('otakonHandsFreeEnabled');
      if (handsFreeEnabled) {
        await this.updateUserPreferences('pwa', { handsFreeEnabled: handsFreeEnabled === 'true' });
      }

      // Migrate PWA analytics
      const pwaInstalls = localStorage.getItem('otakon_pwa_installs');
      const pwaEngagement = localStorage.getItem('otakon_pwa_engagement');
      if (pwaInstalls || pwaEngagement) {
        const pwaData: Record<string, any> = {};
        if (pwaInstalls) pwaData.installs = JSON.parse(pwaInstalls);
        if (pwaEngagement) pwaData.engagement = JSON.parse(pwaEngagement);
        await this.updateUserAppState('pwaAnalytics', pwaData);
      }

      // Migrate proactive insights
      const proactiveInsights = localStorage.getItem('otakon_proactive_insights');
      const triggerHistory = localStorage.getItem('otakon_trigger_history');
      if (proactiveInsights || triggerHistory) {
        const insightsData: Record<string, any> = {};
        if (proactiveInsights) insightsData.insights = JSON.parse(proactiveInsights);
        if (triggerHistory) insightsData.triggerHistory = JSON.parse(triggerHistory);
        await this.updateUserAppState('proactiveInsights', insightsData);
      }

      // Migrate character detection cache
      const characterCache = localStorage.getItem('otakon_character_cache');
      const gameLanguageProfiles = localStorage.getItem('otakon_game_language_profiles');
      if (characterCache || gameLanguageProfiles) {
        const characterData: Record<string, any> = {};
        if (characterCache) characterData.characterCache = JSON.parse(characterCache);
        if (gameLanguageProfiles) characterData.gameLanguageProfiles = JSON.parse(gameLanguageProfiles);
        await this.setAppCache('characterDetection', characterData, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
      }

      // Migrate API cost records
      const apiCostRecords = localStorage.getItem('otakon_api_cost_records');
      if (apiCostRecords) {
        await this.updateUserAppState('apiCostRecords', JSON.parse(apiCostRecords));
      }

      // Migrate wishlist data
      const wishlist = localStorage.getItem('otakon_wishlist');
      if (wishlist) {
        await this.updateUserAppState('wishlist', JSON.parse(wishlist));
      }

      // Migrate tasks and favorites (Otaku Diary)
      const taskKeys = Object.keys(localStorage).filter(key => key.startsWith('otakon_tasks_'));
      const favoriteKeys = Object.keys(localStorage).filter(key => key.startsWith('otakon_favorites_'));
      
      if (taskKeys.length > 0 || favoriteKeys.length > 0) {
        const diaryData: Record<string, any> = {};
        
        // Migrate tasks
        taskKeys.forEach(key => {
          const gameId = key.replace('otakon_tasks_', '');
          const tasks = JSON.parse(localStorage.getItem(key) || '[]');
          if (tasks.length > 0) {
            diaryData[`tasks_${gameId}`] = tasks;
          }
        });

        // Migrate favorites
        favoriteKeys.forEach(key => {
          const gameId = key.replace('otakon_favorites_', '');
          const favorites = JSON.parse(localStorage.getItem(key) || '[]');
          if (favorites.length > 0) {
            diaryData[`favorites_${gameId}`] = favorites;
          }
        });

        if (Object.keys(diaryData).length > 0) {
          await this.updateUserAppState('otakuDiary', diaryData);
        }
      }

      // Migrate daily goals and streaks
      const dailyGoals = localStorage.getItem('dailyGoals_' + new Date().toDateString());
      const userStreaks = localStorage.getItem('userStreaks');
      const lastSessionTime = localStorage.getItem('lastSessionTime');
      
      if (dailyGoals || userStreaks || lastSessionTime) {
        const engagementData: Record<string, any> = {};
        if (dailyGoals) engagementData.dailyGoals = JSON.parse(dailyGoals);
        if (userStreaks) engagementData.userStreaks = JSON.parse(userStreaks);
        if (lastSessionTime) engagementData.lastSessionTime = lastSessionTime;
        
        await this.updateDailyEngagement('bulk', engagementData);
      }

      // Migrate feedback data
      const feedbackData = localStorage.getItem('otakonFeedbackData');
      if (feedbackData) {
        await this.updateUserAppState('feedbackData', JSON.parse(feedbackData));
      }

      console.log('✅ Additional localStorage keys migrated successfully');
    } catch (error) {
      console.error('❌ Failed to migrate additional localStorage keys:', error);
    }
  }

  async clearAllLocalStorageData(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      const otakonKeys = keys.filter(key => key.startsWith('otakon_'));
      
      otakonKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log(`✅ Cleared ${otakonKeys.length} localStorage items`);
    } catch (error) {
      console.error('❌ Failed to clear localStorage data:', error);
    }
  }
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
  checkMigrationStatus,
  getCompleteUserData,
  migrateAllLocalStorageData,
  clearAllLocalStorageData
} = supabaseDataService;
