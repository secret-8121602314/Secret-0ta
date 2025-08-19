import { PlayerProfile, GameContext, ProactiveInsight } from './types';

class PlayerProfileService {
  private static instance: PlayerProfileService;
  private readonly PROFILE_KEY = 'otakon_player_profile';
  private readonly GAME_CONTEXTS_KEY = 'otakon_game_contexts';

  static getInstance(): PlayerProfileService {
    if (!PlayerProfileService.instance) {
      PlayerProfileService.instance = new PlayerProfileService();
    }
    return PlayerProfileService.instance;
  }

  // Get player profile
  getProfile(): PlayerProfile | null {
    try {
      const stored = localStorage.getItem(this.PROFILE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load player profile:', error);
      return null;
    }
  }

  // Create/Update player profile
  async saveProfile(profile: Partial<PlayerProfile>): Promise<boolean> {
    try {
      const existing = this.getProfile();
      const newProfile: PlayerProfile = {
        ...existing,
        ...profile,
        lastUpdated: Date.now(),
      };

      if (!existing) {
        newProfile.createdAt = Date.now();
        newProfile.isFirstTime = true;
      }

      localStorage.setItem(this.PROFILE_KEY, JSON.stringify(newProfile));
      
      // TODO: Sync with backend if user is authenticated
      // const authState = authService.getAuthState();
      // if (authState.user?.id) {
      //   await this.syncProfileToBackend(authState.user.id, newProfile);
      // }

      return true;
    } catch (error) {
      console.error('Failed to save player profile:', error);
      return false;
    }
  }

  // Mark first-time setup as complete
  completeFirstTimeSetup(): void {
    const profile = this.getProfile();
    if (profile) {
      this.saveProfile({ ...profile, isFirstTime: false });
    }
  }

  // Get game context for specific game
  getGameContext(gameId: string): GameContext {
    try {
      const contexts = localStorage.getItem(this.GAME_CONTEXTS_KEY);
      const gameContexts = contexts ? JSON.parse(contexts) : {};
      
      return gameContexts[gameId] || {
        playthroughCount: 1,
        lastSessionDate: Date.now(),
        totalPlayTime: 0,
        objectivesCompleted: [],
        secretsFound: [],
        buildHistory: [],
        sessionSummaries: []
      };
    } catch (error) {
      console.error('Failed to load game context:', error);
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
  }

  // Update game context
  async updateGameContext(gameId: string, updates: Partial<GameContext>): Promise<void> {
    try {
      const contexts = localStorage.getItem(this.GAME_CONTEXTS_KEY);
      const gameContexts = contexts ? JSON.parse(contexts) : {};
      
      gameContexts[gameId] = {
        ...this.getGameContext(gameId),
        ...updates,
        lastSessionDate: Date.now()
      };

      localStorage.setItem(this.GAME_CONTEXTS_KEY, JSON.stringify(gameContexts));
    } catch (error) {
      console.error('Failed to update game context:', error);
    }
  }

  // Increment playthrough count for a game
  async incrementPlaythrough(gameId: string): Promise<number> {
    const context = this.getGameContext(gameId);
    const newCount = context.playthroughCount + 1;
    
    await this.updateGameContext(gameId, {
      playthroughCount: newCount,
      objectivesCompleted: [], // Reset for new playthrough
      secretsFound: []
    });

    return newCount;
  }

  // Get profile context for AI injection
  getProfileContext(): string {
    const profile = this.getProfile();
    if (!profile) return '';

    return `[META_PLAYER_PROFILE: {"style": "${profile.hintStyle}", "focus": "${profile.playerFocus}", "tone": "${profile.preferredTone}", "spoilerTolerance": "${profile.spoilerTolerance}"}]`;
  }

  // Get game context for AI injection
  getGameContextForAI(gameId: string): string {
    const context = this.getGameContext(gameId);
    return `[META_PLAYTHROUGH_COUNT: ${context.playthroughCount}]\n[META_TOTAL_PLAYTIME: ${Math.floor(context.totalPlayTime / 60000)} minutes]`;
  }

  // Check if user needs profile setup
  needsProfileSetup(): boolean {
    const profile = this.getProfile();
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

  // TODO: Sync profile to backend (to be implemented when auth is ready)
  private async syncProfileToBackend(userId: string, profile: PlayerProfile): Promise<void> {
    try {
      // Implementation for backend sync
      console.log('Backend sync not yet implemented');
    } catch (error) {
      console.error('Backend sync error:', error);
    }
  }
}

export const playerProfileService = PlayerProfileService.getInstance();
