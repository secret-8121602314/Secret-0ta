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

  // =====================================================
  // GAMING ENHANCEMENT METHODS
  // =====================================================

  // Enhanced Otaku Diary Tasks
  async addOtakuDiaryTask(task: any): Promise<void> {
    try {
      const userId = await this.getUserId();
      const { error } = await supabase
        .from('enhanced_otaku_diary_tasks')
        .insert({
          ...task,
          user_id: userId
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to add Otaku Diary task:', error);
      throw error;
    }
  }

  async getOtakuDiaryTasks(): Promise<any[]> {
    try {
      const userId = await this.getUserId();
      const { data, error } = await supabase
        .from('enhanced_otaku_diary_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get Otaku Diary tasks:', error);
      return [];
    }
  }

  async updateOtakuDiaryTask(taskId: string, updates: any): Promise<void> {
    try {
      const userId = await this.getUserId();
      const { error } = await supabase
        .from('enhanced_otaku_diary_tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update Otaku Diary task:', error);
      throw error;
    }
  }

  // Gaming Progress Tracking
  async updateGamingProgress(gameName: string, progressData: any): Promise<void> {
    try {
      const userId = await this.getUserId();
      
      // Check if progress record exists
      const { data: existing } = await supabase
        .from('gaming_progress_tracking')
        .select('id')
        .eq('user_id', userId)
        .eq('game_name', gameName)
        .single();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('gaming_progress_tracking')
          .update({
            ...progressData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('gaming_progress_tracking')
          .insert({
            user_id: userId,
            game_name: gameName,
            ...progressData
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Failed to update gaming progress:', error);
      throw error;
    }
  }

  async getGamingProgress(gameName?: string): Promise<any[]> {
    try {
      const userId = await this.getUserId();
      let query = supabase
        .from('gaming_progress_tracking')
        .select('*')
        .eq('user_id', userId);

      if (gameName) {
        query = query.eq('game_name', gameName);
      }

      const { data, error } = await query.order('last_played', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get gaming progress:', error);
      return [];
    }
  }

  // Gaming Wiki Sources
  async getGamingWikiSources(category?: string, year?: number): Promise<any[]> {
    try {
      let query = supabase
        .from('gaming_wiki_sources')
        .select('*')
        .eq('is_active', true);

      if (category) {
        query = query.eq('category', category);
      }

      if (year) {
        query = query.eq('year', year);
      }

      const { data, error } = await query.order('relevance_score', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get gaming wiki sources:', error);
      return [];
    }
  }

  // Cache Management
  async getWikiSearchCache(searchQuery: string, gameContext?: any): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('gaming_wiki_search_cache')
        .select('*')
        .eq('search_query', searchQuery)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) return null;

      // Update cache hits
      await supabase
        .from('gaming_wiki_search_cache')
        .update({ cache_hits: (data.cache_hits || 0) + 1 })
        .eq('id', data.id);

      return data;
    } catch (error) {
      console.error('Failed to get wiki search cache:', error);
      return null;
    }
  }

  async setWikiSearchCache(searchQuery: string, results: any, gameContext?: any, searchTime?: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('gaming_wiki_search_cache')
        .upsert({
          search_query: searchQuery,
          game_context: gameContext || {},
          search_results: results,
          total_results: results?.length || 0,
          search_time_ms: searchTime || 0,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to set wiki search cache:', error);
    }
  }

  async getIGDBCache(igdbId: number): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('igdb_game_cache')
        .select('*')
        .eq('igdb_id', igdbId)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) return null;

      // Update cache hits
      await supabase
        .from('igdb_game_cache')
        .update({ cache_hits: (data.cache_hits || 0) + 1 })
        .eq('id', data.id);

      return data;
    } catch (error) {
      console.error('Failed to get IGDB cache:', error);
      return null;
    }
  }

  async setIGDBCache(igdbId: number, gameData: any, searchQueries?: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('igdb_game_cache')
        .upsert({
          igdb_id: igdbId,
          game_name: gameData.name,
          game_data: gameData,
          search_queries: searchQueries || [],
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to set IGDB cache:', error);
    }
  }

  // User Gaming Context Enhancement
  async updateUserGamingContext(gameName: string, contextData: any): Promise<void> {
    try {
      const userId = await this.getUserId();
      
      // Check if context exists
      const { data: existing } = await supabase
        .from('user_gaming_context')
        .select('id')
        .eq('user_id', userId)
        .eq('game_name', gameName)
        .single();

      if (existing) {
        // Update existing context
        const { error } = await supabase
          .from('user_gaming_context')
          .update({
            ...contextData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new context
        const { error } = await supabase
          .from('user_gaming_context')
          .insert({
            user_id: userId,
            game_name: gameName,
            ...contextData
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Failed to update user gaming context:', error);
      throw error;
    }
  }

  async getUserGamingContext(gameName?: string): Promise<any[]> {
    try {
      const userId = await this.getUserId();
      let query = supabase
        .from('user_gaming_context')
        .select('*')
        .eq('user_id', userId);

      if (gameName) {
        query = query.eq('game_name', gameName);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get user gaming context:', error);
      return [];
    }
  }

  async getUserUsageData(): Promise<UserUsageData> {
    try {
      const userId = await this.getUserId();
      const { data, error } = await supabase.rpc('migrate_user_usage_data', {
        p_user_id: userId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Supabase usage data fetch failed:', error);
      throw error;
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
      const userId = await this.getUserId();
      const { data, error } = await supabase.rpc('migrate_user_app_state', {
        p_user_id: userId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Supabase app state fetch failed:', error);
      throw error;
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
      const userId = await this.getUserId();
      const { data, error } = await supabase.rpc('should_show_welcome_message', {
        p_user_id: userId
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.warn('Supabase welcome message check failed:', error);
      
      // In development mode, return false to avoid showing welcome messages
      if (import.meta.env.DEV) {
        console.warn('⚠️ Using fallback welcome message state for development mode');
        return false;
      }
      
      // Return false instead of localStorage fallback - we want Supabase only
      return false;
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
      throw error; // Let the caller handle the error
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
      throw error; // Let the caller handle the error
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

  // Helper method to get localStorage data safely
  private getLocalStorageData(key: string): any {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  async migrateAllLocalStorageData(): Promise<void> {
    try {
      const userId = await this.getUserId();
      
      // Migrate usage data from localStorage directly
      const usageData = this.getLocalStorageData('otakon_usage_data');
      if (usageData) {
        await this.updateUserUsage('tier', usageData.tier);
        await this.updateUserUsage('textCount', usageData.textCount);
        await this.updateUserUsage('imageCount', usageData.imageCount);
        await this.updateUserUsage('lastMonth', usageData.lastMonth);
        await this.updateUserUsage('usageHistory', usageData.usageHistory);
        await this.updateUserUsage('tierHistory', usageData.tierHistory);
        await this.updateUserUsage('lastReset', usageData.lastReset);
      }

      // Migrate app state from localStorage directly
      const appState = this.getLocalStorageData('otakon_app_state');
      if (appState) {
        await this.updateUserAppState('lastVisited', appState.lastVisited);
        await this.updateUserAppState('uiPreferences', appState.uiPreferences);
        await this.updateUserAppState('featureFlags', appState.featureFlags);
        await this.updateUserAppState('appSettings', appState.appSettings);
        await this.updateUserAppState('lastInteraction', appState.lastInteraction);
      }

      // Migrate preferences from localStorage directly
      const preferences = this.getLocalStorageData('otakon_preferences');
      if (preferences) {
        await this.updateUserPreferences('gameGenre', preferences.gameGenre);
        await this.updateUserPreferences('detailLevel', preferences.detailLevel);
        await this.updateUserPreferences('aiPersonality', preferences.aiPersonality);
        await this.updateUserPreferences('preferredResponseFormat', preferences.preferredResponseFormat);
        await this.updateUserPreferences('skillLevel', preferences.skillLevel);
        await this.updateUserPreferences('notificationPreferences', preferences.notificationPreferences);
        await this.updateUserPreferences('accessibilitySettings', preferences.accessibilitySettings);
      }

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
