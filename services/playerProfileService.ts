import { PlayerProfile, GameContext, ProactiveInsight } from './types';
import { supabase } from './supabase';
import { supabaseDataService } from './supabaseDataService';

// Re-export the interface for components to use
export type { PlayerProfile, GameContext, ProactiveInsight };

class PlayerProfileService {
  private static instance: PlayerProfileService;
  private profileCache: PlayerProfile | null = null;
  private gameContextsCache: Map<string, GameContext> = new Map();

  static getInstance(): PlayerProfileService {
    if (!PlayerProfileService.instance) {
      PlayerProfileService.instance = new PlayerProfileService();
      // Auto-migrate localStorage data to Supabase
      PlayerProfileService.instance.autoMigrateData();
    }
    return PlayerProfileService.instance;
  }

  private async autoMigrateData(): Promise<void> {
    try {
      // Check if user needs migration
      const migrationStatus = await supabaseDataService.checkMigrationStatus();
      if (migrationStatus.needsMigration) {
        console.log('🔄 Auto-migrating localStorage data to Supabase...');
        await supabaseDataService.migrateAllLocalStorageData();
        console.log('✅ Auto-migration complete');
      }
    } catch (error) {
      console.warn('Auto-migration failed, continuing with localStorage fallback:', error);
    }
  }

  // Get player profile
  async getProfile(): Promise<PlayerProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Check cache first
      if (this.profileCache) return this.profileCache;

      // Get profile from new consolidated users table
      const { data: userData, error } = await supabase
        .from('users_new')
        .select('profile_data')
        .eq('auth_user_id', user.id)
        .single();

      if (error || !userData?.profile_data) return null;

      const profile: PlayerProfile = {
        hintStyle: userData.profile_data.hint_style || 'Balanced',
        playerFocus: userData.profile_data.player_focus || 'Story-Driven',
        preferredTone: userData.profile_data.preferred_tone || 'Encouraging',
        spoilerTolerance: userData.profile_data.spoiler_tolerance || 'Strict',
        isFirstTime: userData.profile_data.is_first_time !== false,
        createdAt: userData.profile_data.created_at || Date.now(),
        lastUpdated: userData.profile_data.last_updated || Date.now()
      };

      this.profileCache = profile;
      return profile;
    } catch (error) {
      console.error('Failed to load player profile:', error);
      return null;
    }
  }

  // Create/Update player profile
  async saveProfile(profile: Partial<PlayerProfile>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const existing = await this.getProfile();
      const newProfile: PlayerProfile = {
        hintStyle: 'Balanced',
        playerFocus: 'Story-Driven',
        preferredTone: 'Encouraging',
        spoilerTolerance: 'Moderate',
        isFirstTime: false,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        ...(existing || {}),
        ...profile,
      };

      if (!existing) {
        newProfile.createdAt = Date.now();
        newProfile.isFirstTime = true;
      }

      // Update profile in new consolidated users table
      const { error } = await supabase
        .from('users_new')
        .upsert({
          auth_user_id: user.id,
          email: user.email || '',
          display_name: newProfile.playerFocus || 'Player',
                  profile_data: {
          hint_style: newProfile.hintStyle || 'Balanced',
          player_focus: newProfile.playerFocus || 'Story-Driven',
          preferred_tone: newProfile.preferredTone || 'Encouraging',
          spoiler_tolerance: newProfile.spoilerTolerance || 'Moderate',
          created_at: newProfile.createdAt,
          last_updated: newProfile.lastUpdated,
          is_first_time: newProfile.isFirstTime
        }
        });

      if (error) throw error;

      // Update cache
      this.profileCache = newProfile;
      
      return true;
    } catch (error) {
      console.error('Failed to save player profile:', error);
      return false;
    }
  }

  // Mark first-time setup as complete
  async completeFirstTimeSetup(): Promise<void> {
    const profile = await this.getProfile();
    if (profile) {
      await this.saveProfile({ ...profile, isFirstTime: false });
    }
  }

  // Welcome Message Tracking Methods
  async getWelcomeMessageState(): Promise<{
    welcomeMessageShown: boolean;
    firstRunCompleted: boolean;
    lastWelcomeTime: number | null;
    lastSessionDate: string | null;
    welcomeMessageCount: number;
    firstGameConversationDate: string | null;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Fallback to localStorage
        return this.getLocalStorageWelcomeState();
      }

      // Call Supabase function
      const { data, error } = await supabase.rpc('get_welcome_message_state', {
        p_user_id: user.id
      });

      if (error) {
        console.warn('Failed to get welcome message state from Supabase, falling back to localStorage:', error);
        return this.getLocalStorageWelcomeState();
      }

      return {
        welcomeMessageShown: data?.welcome_message_shown || false,
        firstRunCompleted: data?.first_run_completed || false,
        lastWelcomeTime: data?.last_welcome_time || null,
        lastSessionDate: data?.last_session_date || null,
        welcomeMessageCount: data?.welcome_message_count || 0,
        firstGameConversationDate: data?.first_game_conversation_date || null
      };
    } catch (error) {
      console.warn('Error getting welcome message state, falling back to localStorage:', error);
      return this.getLocalStorageWelcomeState();
    }
  }

  async updateWelcomeMessageShown(messageType: string = 'standard'): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Fallback to localStorage
        this.updateLocalStorageWelcomeShown();
        return true;
      }

      // Call Supabase function
      const { error } = await supabase.rpc('update_welcome_message_shown', {
        p_user_id: user.id,
        p_message_type: messageType
      });

      if (error) {
        console.warn('Failed to update welcome message shown in Supabase, falling back to localStorage:', error);
        this.updateLocalStorageWelcomeShown();
        return true;
      }

      return true;
    } catch (error) {
      console.warn('Error updating welcome message shown, falling back to localStorage:', error);
      this.updateLocalStorageWelcomeShown();
      return true;
    }
  }

  async markFirstRunCompleted(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Fallback to localStorage
        this.updateLocalStorageFirstRunCompleted();
        return true;
      }

      // Call Supabase function
      const { error } = await supabase.rpc('mark_first_run_completed', {
        p_user_id: user.id
      });

      if (error) {
        console.warn('Failed to mark first run completed in Supabase, falling back to localStorage:', error);
        this.updateLocalStorageFirstRunCompleted();
        return true;
      }

      return true;
    } catch (error) {
      console.warn('Error marking first run completed, falling back to localStorage:', error);
      this.updateLocalStorageFirstRunCompleted();
      return true;
    }
  }

  async shouldShowWelcomeMessage(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Fallback to localStorage
        return this.shouldShowLocalStorageWelcome();
      }

      // Call Supabase function
      const { data, error } = await supabase.rpc('should_show_welcome_message', {
        p_user_id: user.id
      });

      if (error) {
        console.warn('Failed to check welcome message from Supabase, falling back to localStorage:', error);
        return this.shouldShowLocalStorageWelcome();
      }

      return data || false;
    } catch (error) {
      console.warn('Error checking welcome message, falling back to localStorage:', error);
      return this.shouldShowLocalStorageWelcome();
    }
  }

  async resetWelcomeMessageTracking(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Fallback to localStorage
        this.resetLocalStorageWelcomeTracking();
        return true;
      }

      // Call Supabase function
      const { error } = await supabase.rpc('reset_welcome_message_tracking', {
        p_user_id: user.id
      });

      if (error) {
        console.warn('Failed to reset welcome message tracking in Supabase, falling back to localStorage:', error);
        this.resetLocalStorageWelcomeTracking();
        return true;
      }

      return true;
    } catch (error) {
      console.warn('Error resetting welcome message tracking, falling back to localStorage:', error);
      this.resetLocalStorageWelcomeTracking();
      return true;
    }
  }

  // LocalStorage Fallback Methods
  private getLocalStorageWelcomeState() {
    return {
      welcomeMessageShown: localStorage.getItem('otakon_welcome_message_shown') === 'true',
      firstRunCompleted: localStorage.getItem('otakon_first_run_completed') === 'true',
      lastWelcomeTime: localStorage.getItem('otakon_last_welcome_time') ? parseInt(localStorage.getItem('otakon_last_welcome_time')!, 10) : null,
      lastSessionDate: localStorage.getItem('otakon_last_session_date'),
      welcomeMessageCount: localStorage.getItem('otakon_welcome_message_count') ? parseInt(localStorage.getItem('otakon_welcome_message_count')!, 10) : 0,
      firstGameConversationDate: localStorage.getItem('otakon_first_game_conversation_date')
    };
  }

  private updateLocalStorageWelcomeShown() {
    localStorage.setItem('otakon_welcome_message_shown', 'true');
    localStorage.setItem('otakon_last_welcome_time', Date.now().toString());
    localStorage.setItem('otakon_last_session_date', new Date().toDateString());
    const currentCount = parseInt(localStorage.getItem('otakon_welcome_message_count') || '0', 10);
    localStorage.setItem('otakon_welcome_message_count', (currentCount + 1).toString());
  }

  private updateLocalStorageFirstRunCompleted() {
    localStorage.setItem('otakon_first_run_completed', 'true');
    localStorage.setItem('otakon_first_game_conversation_date', new Date().toISOString());
  }

  private shouldShowLocalStorageWelcome(): boolean {
    const hasSeenWelcome = localStorage.getItem('otakon_welcome_message_shown') === 'true';
    if (!hasSeenWelcome) return true;

    const lastWelcomeTime = localStorage.getItem('otakon_last_welcome_time');
    if (!lastWelcomeTime) return true;

    const timeSinceLastWelcome = Date.now() - parseInt(lastWelcomeTime, 10);
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
    
    return timeSinceLastWelcome >= TWELVE_HOURS_MS;
  }

  private resetLocalStorageWelcomeTracking() {
    localStorage.removeItem('otakon_welcome_message_shown');
    localStorage.removeItem('otakon_last_welcome_time');
    localStorage.removeItem('otakon_last_session_date');
    localStorage.removeItem('otakon_first_run_completed');
    localStorage.removeItem('otakon_first_game_conversation_date');
    localStorage.removeItem('otakon_app_closed_time');
  }

  // Get game context for specific game
  async getGameContext(gameId: string): Promise<GameContext> {
    try {
      // Check cache first
      if (this.gameContextsCache.has(gameId)) {
        return this.gameContextsCache.get(gameId)!;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return this.getDefaultGameContext();

      // Get game context from new consolidated games table
      const { data: gameData, error } = await supabase
        .from('games_new')
        .select('session_data')
        .eq('user_id', user.id)
        .eq('title', gameId)
        .single();

      if (error || !gameData?.session_data) {
        return this.getDefaultGameContext();
      }

      const context: GameContext = {
        playthroughCount: gameData.session_data.playthrough_count || 1,
        lastSessionDate: gameData.session_data.last_session_date || Date.now(),
        totalPlayTime: gameData.session_data.total_play_time || 0,
        objectivesCompleted: gameData.session_data.objectives_completed || [],
        secretsFound: gameData.session_data.secrets_found || [],
        buildHistory: gameData.session_data.build_history || [],
        sessionSummaries: gameData.session_data.session_summaries || []
      };

      this.gameContextsCache.set(gameId, context);
      return context;
    } catch (error) {
      console.error('Failed to load game context:', error);
      return this.getDefaultGameContext();
    }
  }

  // Update game context
  async updateGameContext(gameId: string, updates: Partial<GameContext>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const existingContext = await this.getGameContext(gameId);
      const updatedContext = { ...existingContext, ...updates };

      // Update game context in new consolidated games table
      const { error } = await supabase
        .from('games_new')
        .upsert({
          user_id: user.id,
          title: gameId,
          status: 'active',
          session_data: {
            playthrough_count: updatedContext.playthroughCount,
            last_session_date: updatedContext.lastSessionDate,
            total_play_time: updatedContext.totalPlayTime,
            objectives_completed: updatedContext.objectivesCompleted,
            secrets_found: updatedContext.secretsFound,
            build_history: updatedContext.buildHistory,
            session_summaries: updatedContext.sessionSummaries
          }
        });

      if (error) throw error;

      // Update cache
      this.gameContextsCache.set(gameId, updatedContext);
    } catch (error) {
      console.error('Failed to update game context:', error);
    }
  }

  // Get all game contexts
  async getAllGameContexts(): Promise<Record<string, GameContext>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};

      // Get all games from new consolidated games table
      const { data: gamesData, error } = await supabase
        .from('games_new')
        .select('title, session_data')
        .eq('user_id', user.id);

      if (error) throw error;

      const contexts: Record<string, GameContext> = {};
      gamesData.forEach(game => {
        if (game.session_data) {
          contexts[game.title] = {
            playthroughCount: game.session_data.playthrough_count || 1,
            lastSessionDate: game.session_data.last_session_date || Date.now(),
            totalPlayTime: game.session_data.total_play_time || 0,
            objectivesCompleted: game.session_data.objectives_completed || [],
            secretsFound: game.session_data.secrets_found || [],
            buildHistory: game.session_data.build_history || [],
            sessionSummaries: game.session_data.session_summaries || []
          };
        }
      });

      return contexts;
    } catch (error) {
      console.error('Failed to load all game contexts:', error);
      return {};
    }
  }

  // Clear game context
  async clearGameContext(gameId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete game from new consolidated games table
      await supabase
        .from('games_new')
        .delete()
        .eq('user_id', user.id)
        .eq('title', gameId);

      // Remove from cache
      this.gameContextsCache.delete(gameId);
    } catch (error) {
      console.error('Failed to clear game context:', error);
    }
  }

  // Get default game context for new users
  getDefaultGameContext(): GameContext {
    return {
      playthroughCount: 1,
      lastSessionDate: Date.now(),
      totalPlayTime: 0,
      objectivesCompleted: [],
      secretsFound: [],
      buildHistory: [],
      sessionSummaries: []
    };
  }

  // Clear all cached data
  clearCache(): void {
    this.profileCache = null;
    this.gameContextsCache.clear();
  }

  // Check if user needs profile setup
  async needsProfileSetup(): Promise<boolean> {
    const profile = await this.getProfile();
    return !profile || profile.isFirstTime;
  }

  // Get default profile
  getDefaultProfile(): PlayerProfile {
    return {
      hintStyle: 'Balanced',
      playerFocus: 'Story-Driven',
      preferredTone: 'Encouraging',
      spoilerTolerance: 'Strict',
      isFirstTime: true,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };
  }

  // Get profile context for AI injection
  async getProfileContext(): Promise<string> {
    const profile = await this.getProfile();
    if (!profile) return '';

    return `[META_PLAYER_PROFILE: {"style": "${profile.hintStyle}", "focus": "${profile.playerFocus}", "tone": "${profile.preferredTone}", "spoilerTolerance": "${profile.spoilerTolerance}"}]`;
  }

  // Get game context for AI injection
  async getGameContextForAI(gameId: string): Promise<string> {
    const context = await this.getGameContext(gameId);
    return `[META_PLAYTHROUGH_COUNT: ${context.playthroughCount}]\n[META_TOTAL_PLAYTIME: ${Math.floor(context.totalPlayTime / 60000)} minutes]`;
  }

  // Increment playthrough count for a game
  async incrementPlaythrough(gameId: string): Promise<number> {
    const context = await this.getGameContext(gameId);
    const newCount = context.playthroughCount + 1;
    
    await this.updateGameContext(gameId, {
      playthroughCount: newCount,
      objectivesCompleted: [], // Reset for new playthrough
      secretsFound: []
    });

    return newCount;
  }
}

export const playerProfileService = PlayerProfileService.getInstance();
