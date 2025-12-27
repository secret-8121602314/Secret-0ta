/**
 * Gaming Explorer Storage Service
 * 
 * Handles all localStorage operations for the Gaming Explorer mini-app.
 * This is a temporary solution before database integration.
 * 
 * Storage Keys:
 * - otagon_gaming_library: Game library (own, wishlist, favorites, disliked)
 * - otagon_gaming_timeline: Timeline events (consoles, games, PC builds, albums)
 * - otagon_gaming_news_cache: Cached gaming news from grounding search
 * - otagon_game_knowledge: Extracted game knowledge for AI context
 * - otagon_user_gaming_profile: User's gaming profile (start year, stats)
 * - otagon_gameplay_sessions: Grouped gameplay screenshots by day
 */

import { IGDBGameData } from './igdbService';
import { newsCacheService } from './newsCacheService';
import { librarySupabaseSync, timelineSupabaseSync, screenshotsSupabaseSync } from './hqSupabaseSync';
import { authService } from './authService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type LibraryCategory = 'own' | 'wishlist' | 'favorite' | 'disliked';
export type CompletionStatus = 'not_started' | 'playing' | 'completed' | 'abandoned';
export type TimelineEventType = 'console' | 'game' | 'pc_build' | 'album' | 'gameplay_session';
export type NewsPromptType = 'latest_news' | 'trending_games' | 'upcoming_releases' | 'new_reviews';

export interface GameLibraryItem {
  id: string;
  igdbGameId: number;
  gameName: string;
  category: LibraryCategory;
  platform?: string;
  personalRating?: number; // 1-5
  completionStatus?: CompletionStatus;
  hoursPlayed?: number;
  notes?: string;
  igdbData?: IGDBGameData; // Cached IGDB data
  dateAdded: number;
  updatedAt: number;
}

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  eventDate: string; // ISO date string YYYY-MM-DD
  year: number;
  title: string;
  description?: string;
  specs?: Record<string, string>; // For PC builds
  photos?: string[]; // URLs
  igdbGameId?: number; // For game events
  igdbData?: IGDBGameData; // Cached IGDB data
  screenshotCount?: number; // For gameplay sessions
  aiSummary?: string; // AI analysis summary
  createdAt: number;
  updatedAt: number;
}

export interface TimelinePhotoAlbum {
  id: string;
  eventId: string;
  albumName: string;
  coverPhotoUrl?: string;
  photoCount: number;
  createdAt: number;
}

export interface TimelinePhoto {
  id: string;
  albumId: string;
  photoUrl: string;
  caption?: string;
  source: 'manual' | 'gameplay';
  uploadedAt: number;
}

export interface GameplayScreenshotSession {
  id: string;
  igdbGameId: number;
  gameName: string;
  sessionDate: string; // ISO date string YYYY-MM-DD
  screenshots: GameplayScreenshot[];
  createdAt: number;
}

export interface GameplayScreenshot {
  id: string;
  sessionId: string;
  messageId: string; // Link to original message
  conversationId: string;
  screenshotUrl: string;
  aiAnalysis: string;
  capturedAt: number;
}

export interface GamingNewsItem {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  source?: string;
  igdbGameId?: number;
  igdbData?: IGDBGameData;
  publishedAt?: number;
  cachedAt: number;
}

export interface GamingNewsCache {
  promptType: NewsPromptType;
  items: GamingNewsItem[];
  cachedAt: number;
  expiresAt: number;
  generatedByUserId?: string;
}

export interface NewsGenerationLog {
  promptType: NewsPromptType;
  generatedAt: number;
}

export interface GameKnowledgeBase {
  igdbGameId: number;
  gameName: string;
  walkthroughData?: string;
  storyProgression?: Record<string, unknown>;
  collectibles?: Record<string, unknown>;
  achievements?: Record<string, unknown>;
  tipsAndTricks?: string;
  bossStrategies?: Record<string, unknown>;
  characterBuilds?: Record<string, unknown>;
  gameMechanics?: string;
  extractedAt: number;
  lastUpdated: number;
}

export interface UserGamingProfile {
  gamingStartYear?: number;
  libraryStats: {
    ownedCount: number;
    completedCount: number;
    wishlistCount: number;
    favoritesCount: number;
    dislikedCount: number;
    totalHoursPlayed: number;
  };
  lastUpdated: number;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  LIBRARY: 'otagon_gaming_library',
  TIMELINE: 'otagon_gaming_timeline',
  TIMELINE_ALBUMS: 'otagon_timeline_albums',
  TIMELINE_PHOTOS: 'otagon_timeline_photos',
  NEWS_CACHE: 'otagon_gaming_news_cache',
  NEWS_GENERATION_LOG: 'otagon_news_generation_log',
  GAME_KNOWLEDGE: 'otagon_game_knowledge',
  USER_PROFILE: 'otagon_user_gaming_profile',
  GAMEPLAY_SESSIONS: 'otagon_gameplay_sessions',
  IGDB_HOME_CACHE: 'otagon_igdb_home_cache',
  SEARCH_HISTORY: 'otagon_game_search_history',
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateId(): string {
  return crypto.randomUUID?.() || 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

function safeGetItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`[GamingExplorerStorage] Error reading ${key}:`, error);
    return defaultValue;
  }
}

function safeSetItem(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`[GamingExplorerStorage] Error writing ${key}:`, error);
    return false;
  }
}

// ============================================================================
// LIBRARY MANAGEMENT
// ============================================================================

export const libraryStorage = {
  /**
   * Load library from Supabase and merge with localStorage
   * Call this on app initialization
   */
  async loadFromSupabase(userId: string): Promise<void> {
    try {
      console.log('[LibraryStorage] Loading from Supabase...');
      const supabaseItems = await librarySupabaseSync.getAll(userId);
      const localItems = this.getAll();
      
      if (supabaseItems.length === 0 && localItems.length > 0) {
        // First sync: Upload localStorage to Supabase
        console.log('[LibraryStorage] First sync: Uploading localStorage to Supabase');
        await librarySupabaseSync.syncFromLocalStorage(userId, localItems);
      } else if (supabaseItems.length > 0) {
        // Merge: Supabase is source of truth
        console.log(`[LibraryStorage] Loaded ${supabaseItems.length} items from Supabase`);
        safeSetItem(STORAGE_KEYS.LIBRARY, supabaseItems);
        this.updateStats();
      }
    } catch (error) {
      console.error('[LibraryStorage] Failed to load from Supabase:', error);
    }
  },
  
  /**
   * Get all library items
   */
  getAll(): GameLibraryItem[] {
    return safeGetItem<GameLibraryItem[]>(STORAGE_KEYS.LIBRARY, []);
  },

  /**
   * Get library items by category
   */
  getByCategory(category: LibraryCategory): GameLibraryItem[] {
    const all = this.getAll();
    return all.filter(item => item.category === category);
  },

  /**
   * Get a specific game from library
   */
  getByIgdbId(igdbGameId: number): GameLibraryItem | undefined {
    const all = this.getAll();
    return all.find(item => item.igdbGameId === igdbGameId);
  },

  /**
   * Get a game by title (case-insensitive) - useful when only game title is known
   */
  getByGameTitle(gameTitle: string): GameLibraryItem | undefined {
    const all = this.getAll();
    const normalizedTitle = gameTitle.toLowerCase().trim();
    return all.find(item => item.gameName.toLowerCase().trim() === normalizedTitle);
  },

  /**
   * Check if a game is in any library category
   */
  getGameCategories(igdbGameId: number): LibraryCategory[] {
    const all = this.getAll();
    return all
      .filter(item => item.igdbGameId === igdbGameId)
      .map(item => item.category);
  },

  /**
   * Add a game to library
   */
  addGame(
    igdbGameId: number,
    gameName: string,
    category: LibraryCategory,
    igdbData?: IGDBGameData,
    options?: {
      platform?: string;
      personalRating?: number;
      completionStatus?: CompletionStatus;
    }
  ): GameLibraryItem {
    const all = this.getAll();
    
    // Check if already exists in this category
    const existing = all.find(
      item => item.igdbGameId === igdbGameId && item.category === category
    );
    
    if (existing) {
      // Update existing entry
      existing.updatedAt = Date.now();
      if (options?.platform) {
        existing.platform = options.platform;
      }
      if (options?.personalRating) {
        existing.personalRating = options.personalRating;
      }
      if (options?.completionStatus) {
        existing.completionStatus = options.completionStatus;
      }
      if (igdbData) {
        existing.igdbData = igdbData;
      }
      safeSetItem(STORAGE_KEYS.LIBRARY, all);
      this.updateStats();
      return existing;
    }

    // Create new entry
    const newItem: GameLibraryItem = {
      id: generateId(),
      igdbGameId,
      gameName,
      category,
      platform: options?.platform,
      personalRating: options?.personalRating,
      completionStatus: options?.completionStatus || (category === 'own' ? 'not_started' : undefined),
      igdbData,
      dateAdded: Date.now(),
      updatedAt: Date.now(),
    };

    all.push(newItem);
    safeSetItem(STORAGE_KEYS.LIBRARY, all);
    this.updateStats();
    
    // NOTE: We intentionally do NOT trigger game knowledge fetch here
    // Users might add many games at once when building their library
    // Game knowledge will be fetched lazily when they create a game tab
    if (category === 'own') {
      console.log(`🎮 [LibraryStorage] Game added as OWNED: "${gameName}" (IGDB ID: ${igdbGameId})`);
      console.log(`🎮 [LibraryStorage] Knowledge fetch will happen when user creates a game tab`);
    }
    
    // ☁️ SUPABASE SYNC: Dual-write to Supabase for cross-device sync
    const user = authService.getCurrentUser();
    if (user?.authUserId) {
      librarySupabaseSync.add(user.authUserId, newItem).catch(err => {
        console.error('[LibraryStorage] Failed to sync to Supabase:', err);
      });
    }
    
    return newItem;
  },

  /**
   * Update a library item
   */
  updateGame(id: string, updates: Partial<GameLibraryItem>): GameLibraryItem | null {
    const all = this.getAll();
    const index = all.findIndex(item => item.id === id);
    
    if (index === -1) {
      return null;
    }

    all[index] = {
      ...all[index],
      ...updates,
      updatedAt: Date.now(),
    };
    
    safeSetItem(STORAGE_KEYS.LIBRARY, all);
    this.updateStats();
    
    // ☁️ SUPABASE SYNC: Update in Supabase
    const user = authService.getCurrentUser();
    if (user?.authUserId) {
      librarySupabaseSync.update(user.authUserId, all[index]).catch(err => {
        console.error('[LibraryStorage] Failed to update in Supabase:', err);
      });
    }
    
    return all[index];
  },

  /**
   * Remove a game from a specific category
   */
  removeGame(igdbGameId: number, category: LibraryCategory): boolean {
    const all = this.getAll();
    const filtered = all.filter(
      item => !(item.igdbGameId === igdbGameId && item.category === category)
    );
    
    if (filtered.length === all.length) {
      return false; // Nothing was removed
    }
    
    safeSetItem(STORAGE_KEYS.LIBRARY, filtered);
    this.updateStats();
    
    // ☁️ SUPABASE SYNC: Remove from Supabase
    const user = authService.getCurrentUser();
    if (user?.authUserId) {
      librarySupabaseSync.remove(user.authUserId, igdbGameId, category).catch(err => {
        console.error('[LibraryStorage] Failed to remove from Supabase:', err);
      });
    }
    
    return true;
  },

  /**
   * Move a game to a different category
   */
  moveGame(igdbGameId: number, fromCategory: LibraryCategory, toCategory: LibraryCategory): boolean {
    const all = this.getAll();
    const item = all.find(
      i => i.igdbGameId === igdbGameId && i.category === fromCategory
    );
    
    if (!item) {
      return false;
    }

    item.category = toCategory;
    item.updatedAt = Date.now();
    
    safeSetItem(STORAGE_KEYS.LIBRARY, all);
    this.updateStats();
    return true;
  },

  /**
   * Toggle a category for a game (add if not present, remove if present)
   */
  toggleCategory(
    igdbGameId: number,
    gameName: string,
    category: LibraryCategory,
    igdbData?: IGDBGameData
  ): { added: boolean; item?: GameLibraryItem } {
    const all = this.getAll();
    const existing = all.find(
      item => item.igdbGameId === igdbGameId && item.category === category
    );

    if (existing) {
      // Remove
      this.removeGame(igdbGameId, category);
      return { added: false };
    } else {
      // Add
      const item = this.addGame(igdbGameId, gameName, category, igdbData);
      return { added: true, item };
    }
  },

  /**
   * Update library stats in user profile
   */
  updateStats(): void {
    const all = this.getAll();
    const profile = userProfileStorage.get();
    
    profile.libraryStats = {
      ownedCount: all.filter(i => i.category === 'own').length,
      completedCount: all.filter(i => i.category === 'own' && i.completionStatus === 'completed').length,
      wishlistCount: all.filter(i => i.category === 'wishlist').length,
      favoritesCount: all.filter(i => i.category === 'favorite').length,
      dislikedCount: all.filter(i => i.category === 'disliked').length,
      totalHoursPlayed: all.reduce((sum, i) => sum + (i.hoursPlayed || 0), 0),
    };
    profile.lastUpdated = Date.now();
    
    userProfileStorage.save(profile);
  },
};

// ============================================================================
// TIMELINE MANAGEMENT
// ============================================================================

export const timelineStorage = {
  /**
   * Load timeline from Supabase and merge with localStorage
   * Call this on app initialization
   */
  async loadFromSupabase(userId: string): Promise<void> {
    try {
      console.log('[TimelineStorage] Loading from Supabase...');
      const supabaseEvents = await timelineSupabaseSync.getAll(userId);
      const localEvents = this.getAll();
      
      if (supabaseEvents.length === 0 && localEvents.length > 0) {
        // First sync: Upload localStorage to Supabase
        console.log('[TimelineStorage] First sync: Uploading localStorage to Supabase');
        await timelineSupabaseSync.syncFromLocalStorage(userId, localEvents);
      } else if (supabaseEvents.length > 0) {
        // Merge: Supabase is source of truth
        console.log(`[TimelineStorage] Loaded ${supabaseEvents.length} events from Supabase`);
        safeSetItem(STORAGE_KEYS.TIMELINE, supabaseEvents);
      }
    } catch (error) {
      console.error('[TimelineStorage] Failed to load from Supabase:', error);
    }
  },

  /**
   * Get all timeline events sorted by date
   */
  getAll(): TimelineEvent[] {
    const events = safeGetItem<TimelineEvent[]>(STORAGE_KEYS.TIMELINE, []);
    return events.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
  },

  /**
   * Get timeline events by year
   */
  getByYear(year: number): TimelineEvent[] {
    const all = this.getAll();
    return all.filter(event => event.year === year);
  },

  /**
   * Get all unique years in timeline
   */
  getYears(): number[] {
    const all = this.getAll();
    const years = [...new Set(all.map(e => e.year))];
    return years.sort((a, b) => b - a); // Descending
  },

  /**
   * Add a timeline event
   */
  addEvent(event: Omit<TimelineEvent, 'id' | 'createdAt' | 'updatedAt'>): TimelineEvent {
    const all = this.getAll();
    
    const newEvent: TimelineEvent = {
      ...event,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    all.push(newEvent);
    safeSetItem(STORAGE_KEYS.TIMELINE, all);
    
    // ☁️ SUPABASE SYNC: Dual-write to Supabase for cross-device sync
    const user = authService.getCurrentUser();
    if (user?.authUserId) {
      timelineSupabaseSync.add(user.authUserId, newEvent).catch(err => {
        console.error('[TimelineStorage] Failed to sync to Supabase:', err);
      });
    }
    
    return newEvent;
  },

  /**
   * Update a timeline event
   */
  updateEvent(id: string, updates: Partial<TimelineEvent>): TimelineEvent | null {
    const all = safeGetItem<TimelineEvent[]>(STORAGE_KEYS.TIMELINE, []);
    const index = all.findIndex(event => event.id === id);
    
    if (index === -1) {
      return null;
    }

    all[index] = {
      ...all[index],
      ...updates,
      updatedAt: Date.now(),
    };
    
    safeSetItem(STORAGE_KEYS.TIMELINE, all);
    return all[index];
  },

  /**
   * Delete a timeline event
   */
  deleteEvent(id: string): boolean {
    const all = safeGetItem<TimelineEvent[]>(STORAGE_KEYS.TIMELINE, []);
    const filtered = all.filter(event => event.id !== id);
    
    if (filtered.length === all.length) {
      return false;
    }
    
    safeSetItem(STORAGE_KEYS.TIMELINE, filtered);
    
    // ☁️ SUPABASE SYNC: Remove from Supabase
    const user = authService.getCurrentUser();
    if (user?.authUserId) {
      timelineSupabaseSync.remove(user.authUserId, id).catch(err => {
        console.error('[TimelineStorage] Failed to remove from Supabase:', err);
      });
    }
    
    return true;
  },

  /**
   * Add console event
   */
  addConsole(
    consoleName: string,
    year: number,
    description?: string,
    photo?: string
  ): TimelineEvent {
    return this.addEvent({
      type: 'console',
      eventDate: `${year}-01-01`,
      year,
      title: consoleName,
      description,
      photos: photo ? [photo] : undefined,
    });
  },

  /**
   * Add PC build event
   */
  addPCBuild(
    buildName: string,
    year: number,
    specs: Record<string, string>,
    photos?: string[]
  ): TimelineEvent {
    return this.addEvent({
      type: 'pc_build',
      eventDate: `${year}-01-01`,
      year,
      title: buildName,
      specs,
      photos,
    });
  },

  /**
   * Add game milestone event
   */
  addGameMilestone(
    gameName: string,
    igdbGameId: number,
    year: number,
    description?: string,
    igdbData?: IGDBGameData
  ): TimelineEvent {
    return this.addEvent({
      type: 'game',
      eventDate: `${year}-01-01`,
      year,
      title: gameName,
      description,
      igdbGameId,
      igdbData,
    });
  },
};

// ============================================================================
// GAMEPLAY SESSIONS (Screenshots grouped by day)
// ============================================================================

export const gameplaySessionsStorage = {
  /**
   * Get all gameplay sessions
   */
  getAll(): GameplayScreenshotSession[] {
    return safeGetItem<GameplayScreenshotSession[]>(STORAGE_KEYS.GAMEPLAY_SESSIONS, []);
  },

  /**
   * Get sessions for a specific game
   */
  getByGame(igdbGameId: number): GameplayScreenshotSession[] {
    const all = this.getAll();
    return all.filter(session => session.igdbGameId === igdbGameId);
  },

  /**
   * Get session by date and game
   */
  getByDateAndGame(date: string, igdbGameId: number): GameplayScreenshotSession | undefined {
    const all = this.getAll();
    return all.find(
      session => session.sessionDate === date && session.igdbGameId === igdbGameId
    );
  },

  /**
   * Add a screenshot to a session (creates session if doesn't exist)
   */
  addScreenshot(
    igdbGameId: number,
    gameName: string,
    screenshot: Omit<GameplayScreenshot, 'id' | 'sessionId'>
  ): GameplayScreenshotSession {
    const all = this.getAll();
    const today = new Date().toISOString().split('T')[0];
    
    // Find or create session for today
    let session = all.find(
      s => s.sessionDate === today && s.igdbGameId === igdbGameId
    );

    if (!session) {
      session = {
        id: generateId(),
        igdbGameId,
        gameName,
        sessionDate: today,
        screenshots: [],
        createdAt: Date.now(),
      };
      all.push(session);
    }

    // Add screenshot
    const newScreenshot: GameplayScreenshot = {
      ...screenshot,
      id: generateId(),
      sessionId: session.id,
    };
    session.screenshots.push(newScreenshot);

    safeSetItem(STORAGE_KEYS.GAMEPLAY_SESSIONS, all);
    
    // ☁️ SUPABASE SYNC: Save screenshot to Supabase
    const user = authService.getCurrentUser();
    if (user?.authUserId) {
      screenshotsSupabaseSync.add(user.authUserId, newScreenshot, gameName).catch(err => {
        console.error('[GameplaySessionsStorage] Failed to sync screenshot to Supabase:', err);
      });
    }
    
    return session;
  },

  /**
   * Get total screenshot count for a game
   */
  getScreenshotCount(igdbGameId: number): number {
    const sessions = this.getByGame(igdbGameId);
    return sessions.reduce((sum, s) => sum + s.screenshots.length, 0);
  },
};

// ============================================================================
// NEWS CACHE
// ============================================================================

export const newsCacheStorage = {
  /**
   * Get cached news for a prompt type
   * Checks Supabase global cache first, then falls back to localStorage
   */
  get(promptType: NewsPromptType): GamingNewsCache | null {
    // Note: Supabase check is async, so we only use localStorage here
    // Use getAsync() for Supabase-first lookup
    const all = safeGetItem<GamingNewsCache[]>(STORAGE_KEYS.NEWS_CACHE, []);
    const cache = all.find(c => c.promptType === promptType);
    
    // Check if expired
    if (cache && cache.expiresAt > Date.now()) {
      return cache;
    }
    
    return null;
  },
  
  /**
   * Get cached news (async) - checks Supabase global cache first
   */
  async getAsync(promptType: NewsPromptType): Promise<GamingNewsCache | null> {
    // Check Supabase global cache first
    const supabaseItems = await newsCacheService.getCache(promptType);
    if (supabaseItems) {
      const now = Date.now();
      return {
        promptType,
        items: supabaseItems.map(item => ({
          ...item,
          cachedAt: now,
        })),
        cachedAt: now,
        expiresAt: now + (24 * 60 * 60 * 1000),
      };
    }
    
    // Fallback to localStorage
    return this.get(promptType);
  },

  /**
   * Save news cache to both Supabase and localStorage
   */
  save(cache: GamingNewsCache): void {
    const all = safeGetItem<GamingNewsCache[]>(STORAGE_KEYS.NEWS_CACHE, []);
    
    // Replace existing cache for this prompt type
    const index = all.findIndex(c => c.promptType === cache.promptType);
    if (index >= 0) {
      all[index] = cache;
    } else {
      all.push(cache);
    }
    
    safeSetItem(STORAGE_KEYS.NEWS_CACHE, all);
    
    // Also save to Supabase global cache
    newsCacheService.setCache(cache.promptType, cache.items).catch(err => {
      console.error('[NewsCache] Failed to save to Supabase:', err);
    });
  },

  /**
   * Check if user can generate news (24hr rate limit)
   */
  canGenerate(userId: string, promptType: NewsPromptType): { allowed: boolean; nextAvailableAt?: number } {
    const logs = safeGetItem<(NewsGenerationLog & { userId: string })[]>(STORAGE_KEYS.NEWS_GENERATION_LOG, []);
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    const recentLog = logs.find(
      log => log.userId === userId && log.promptType === promptType && log.generatedAt > twentyFourHoursAgo
    );
    
    if (recentLog) {
      return {
        allowed: false,
        nextAvailableAt: recentLog.generatedAt + (24 * 60 * 60 * 1000),
      };
    }
    
    return { allowed: true };
  },

  /**
   * Log a news generation
   */
  logGeneration(userId: string, promptType: NewsPromptType): void {
    const logs = safeGetItem<(NewsGenerationLog & { userId: string })[]>(STORAGE_KEYS.NEWS_GENERATION_LOG, []);
    
    // Remove old logs for this user/prompt (keep only most recent)
    const filtered = logs.filter(
      log => !(log.userId === userId && log.promptType === promptType)
    );
    
    filtered.push({
      userId,
      promptType,
      generatedAt: Date.now(),
    });
    
    safeSetItem(STORAGE_KEYS.NEWS_GENERATION_LOG, filtered);
  },

  /**
   * Get cache age in hours
   */
  getCacheAge(promptType: NewsPromptType): number | null {
    const cache = this.get(promptType);
    if (!cache) {
      return null;
    }
    
    return Math.floor((Date.now() - cache.cachedAt) / (60 * 60 * 1000));
  },
};

// ============================================================================
// GAME KNOWLEDGE BASE
// ============================================================================

export const gameKnowledgeStorage = {
  /**
   * Get knowledge for a game
   */
  get(igdbGameId: number): GameKnowledgeBase | null {
    const all = safeGetItem<GameKnowledgeBase[]>(STORAGE_KEYS.GAME_KNOWLEDGE, []);
    return all.find(k => k.igdbGameId === igdbGameId) || null;
  },

  /**
   * Check if knowledge exists for a game
   */
  exists(igdbGameId: number): boolean {
    return this.get(igdbGameId) !== null;
  },

  /**
   * Save game knowledge
   */
  save(knowledge: GameKnowledgeBase): void {
    const all = safeGetItem<GameKnowledgeBase[]>(STORAGE_KEYS.GAME_KNOWLEDGE, []);
    
    const index = all.findIndex(k => k.igdbGameId === knowledge.igdbGameId);
    if (index >= 0) {
      all[index] = { ...knowledge, lastUpdated: Date.now() };
    } else {
      all.push(knowledge);
    }
    
    safeSetItem(STORAGE_KEYS.GAME_KNOWLEDGE, all);
  },

  /**
   * Get all games with extracted knowledge
   */
  getAllExtracted(): number[] {
    const all = safeGetItem<GameKnowledgeBase[]>(STORAGE_KEYS.GAME_KNOWLEDGE, []);
    return all.map(k => k.igdbGameId);
  },
};

// ============================================================================
// USER GAMING PROFILE
// ============================================================================

export const userProfileStorage = {
  /**
   * Get user gaming profile
   */
  get(): UserGamingProfile {
    return safeGetItem<UserGamingProfile>(STORAGE_KEYS.USER_PROFILE, {
      libraryStats: {
        ownedCount: 0,
        completedCount: 0,
        wishlistCount: 0,
        favoritesCount: 0,
        dislikedCount: 0,
        totalHoursPlayed: 0,
      },
      lastUpdated: Date.now(),
    });
  },

  /**
   * Save user gaming profile
   */
  save(profile: UserGamingProfile): void {
    safeSetItem(STORAGE_KEYS.USER_PROFILE, profile);
  },

  /**
   * Set gaming start year
   */
  setGamingStartYear(year: number): void {
    const profile = this.get();
    profile.gamingStartYear = year;
    profile.lastUpdated = Date.now();
    this.save(profile);
  },

  /**
   * Get gaming start year
   */
  getGamingStartYear(): number | undefined {
    return this.get().gamingStartYear;
  },

  /**
   * Check if onboarding is needed
   */
  needsOnboarding(): boolean {
    return this.get().gamingStartYear === undefined;
  },
};

// ============================================================================
// PHOTO STORAGE LIMITS
// ============================================================================

export const photoLimitsStorage = {
  /**
   * Get photo count for a user tier
   */
  getPhotoLimit(tier: 'free' | 'pro' | 'vanguard_pro'): number {
    switch (tier) {
      case 'free': return 100;
      case 'pro': return 500;
      case 'vanguard_pro': return Infinity;
      default: return 100;
    }
  },

  /**
   * Get current photo count
   */
  getCurrentPhotoCount(): number {
    const albums = safeGetItem<TimelinePhotoAlbum[]>(STORAGE_KEYS.TIMELINE_ALBUMS, []);
    return albums.reduce((sum, album) => sum + album.photoCount, 0);
  },

  /**
   * Check if user can upload more photos
   */
  canUploadPhoto(tier: 'free' | 'pro' | 'vanguard_pro'): boolean {
    const limit = this.getPhotoLimit(tier);
    const current = this.getCurrentPhotoCount();
    return current < limit;
  },

  /**
   * Get remaining photo slots
   */
  getRemainingSlots(tier: 'free' | 'pro' | 'vanguard_pro'): number {
    const limit = this.getPhotoLimit(tier);
    const current = this.getCurrentPhotoCount();
    return Math.max(0, limit - current);
  },
};

// ============================================================================
// IGDB HOME CACHE - Cache for Gaming Explorer Home tab data
// ============================================================================

interface IGDBHomeCache {
  featuredGames: IGDBGameData[];
  latestGames: IGDBGameData[];
  newReleases?: IGDBGameData[];
  highestRatedGames?: IGDBGameData[];
  categoryGamesMap: Record<string, IGDBGameData[]>;
  cachedAt: number;
}

// Cache expires after 24 hours
const IGDB_HOME_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export const igdbHomeCacheStorage = {
  /**
   * Get cached IGDB home data if still valid
   */
  get(): IGDBHomeCache | null {
    const cache = safeGetItem<IGDBHomeCache | null>(STORAGE_KEYS.IGDB_HOME_CACHE, null);
    if (!cache) { return null; }
    
    // Check if cache is expired
    if (Date.now() - cache.cachedAt > IGDB_HOME_CACHE_TTL) {
      this.clear();
      return null;
    }
    
    return cache;
  },

  /**
   * Save IGDB home data to cache
   */
  set(data: Omit<IGDBHomeCache, 'cachedAt'>): void {
    const cache: IGDBHomeCache = {
      ...data,
      cachedAt: Date.now(),
    };
    safeSetItem(STORAGE_KEYS.IGDB_HOME_CACHE, cache);
  },

  /**
   * Clear the cache
   */
  clear(): void {
    localStorage.removeItem(STORAGE_KEYS.IGDB_HOME_CACHE);
  },

  /**
   * Check if cache is valid and has data
   */
  isValid(): boolean {
    return this.get() !== null;
  },
};

// ============================================================================
// GAME SEARCH HISTORY - Track recently searched games
// ============================================================================

interface SearchHistoryItem {
  gameData: IGDBGameData;
  searchedAt: number;
}

const MAX_SEARCH_HISTORY = 12; // Maximum games to keep in history

export const searchHistoryStorage = {
  /**
   * Get all search history items
   */
  getAll(): SearchHistoryItem[] {
    return safeGetItem<SearchHistoryItem[]>(STORAGE_KEYS.SEARCH_HISTORY, []);
  },

  /**
   * Get just the game data from history
   */
  getGames(): IGDBGameData[] {
    return this.getAll().map(item => item.gameData);
  },

  /**
   * Add a game to search history
   */
  add(gameData: IGDBGameData): void {
    const history = this.getAll();
    
    // Remove if already exists (to move to front)
    const filtered = history.filter(item => item.gameData.id !== gameData.id);
    
    // Add to front
    const newHistory: SearchHistoryItem[] = [
      { gameData, searchedAt: Date.now() },
      ...filtered,
    ].slice(0, MAX_SEARCH_HISTORY); // Keep only latest MAX items
    
    safeSetItem(STORAGE_KEYS.SEARCH_HISTORY, newHistory);
  },

  /**
   * Remove a game from search history
   */
  remove(gameId: number): void {
    const history = this.getAll();
    const filtered = history.filter(item => item.gameData.id !== gameId);
    safeSetItem(STORAGE_KEYS.SEARCH_HISTORY, filtered);
  },

  /**
   * Clear all search history
   */
  clear(): void {
    localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
  },

  /**
   * Check if history has items
   */
  hasHistory(): boolean {
    return this.getAll().length > 0;
  },
};

// ============================================================================
// EXPORT COMBINED SERVICE
// ============================================================================

export const gamingExplorerStorage = {
  library: libraryStorage,
  timeline: timelineStorage,
  gameplaySessions: gameplaySessionsStorage,
  newsCache: newsCacheStorage,
  gameKnowledge: gameKnowledgeStorage,
  userProfile: userProfileStorage,
  photoLimits: photoLimitsStorage,
  igdbHomeCache: igdbHomeCacheStorage,
  searchHistory: searchHistoryStorage,
  
  /**
   * Clear all Gaming Explorer data (for testing/reset)
   */
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('[GamingExplorerStorage] All data cleared');
  },
};

export default gamingExplorerStorage;
