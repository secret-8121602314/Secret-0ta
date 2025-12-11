/**
 * Gaming Explorer Supabase Service
 * 
 * Handles all Supabase operations for the Gaming Explorer mini-app.
 * Provides sync between localStorage (offline-first) and Supabase (cloud backup).
 * 
 * Strategy:
 * - localStorage remains the primary source for instant access
 * - Supabase syncs in background for cloud backup and cross-device access
 * - Migration functions to move existing localStorage data to Supabase
 */

import { supabase } from '../lib/supabase';
import { IGDBGameData } from './igdbService';
import {
  GameLibraryItem,
  TimelineEvent,
  GameKnowledgeBase,
  UserGamingProfile,
  LibraryCategory,
  CompletionStatus,
  libraryStorage,
  timelineStorage,
  gameKnowledgeStorage,
  userProfileStorage,
  searchHistoryStorage,
} from './gamingExplorerStorage';

// ============================================================================
// TYPE DEFINITIONS FOR SUPABASE
// ============================================================================

interface SupabaseLibraryItem {
  id: string;
  auth_user_id: string;
  igdb_game_id: number;
  game_name: string;
  category: string;
  platform: string | null;
  personal_rating: number | null;
  completion_status: string | null;
  hours_played: number | null;
  notes: string | null;
  igdb_data: IGDBGameData | null;
  date_added: string;
  updated_at: string;
}

interface SupabaseTimelineEvent {
  id: string;
  auth_user_id: string;
  event_type: string;
  event_date: string;
  year: number;
  title: string;
  description: string | null;
  specs: Record<string, string> | null;
  photos: string[] | null;
  igdb_game_id: number | null;
  igdb_data: IGDBGameData | null;
  screenshot_count: number | null;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
}

interface SupabaseGamingProfile {
  id: string;
  auth_user_id: string;
  gaming_start_year: number | null;
  owned_count: number;
  completed_count: number;
  wishlist_count: number;
  favorites_count: number;
  disliked_count: number;
  total_hours_played: number;
  last_updated: string;
}

// Generic Supabase response types
type SupabaseResponse<T> = {
  data: T | null;
  error: { message: string } | null;
};

type SupabaseMutationResponse = {
  error: { message: string } | null;
};

// ============================================================================
// LIBRARY SYNC SERVICE
// ============================================================================

export const supabaseLibraryService = {
  /**
   * Sync all localStorage library items to Supabase
   */
  async syncToSupabase(authUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const localItems = libraryStorage.getAll();
      
      if (localItems.length === 0) {
        return { success: true };
      }

      // Transform to Supabase format
      const supabaseItems = localItems.map(item => ({
        auth_user_id: authUserId,
        igdb_game_id: item.igdbGameId,
        game_name: item.gameName,
        category: item.category,
        platform: item.platform || null,
        personal_rating: item.personalRating || null,
        completion_status: item.completionStatus || null,
        hours_played: item.hoursPlayed || null,
        notes: item.notes || null,
        igdb_data: item.igdbData || null,
        date_added: new Date(item.dateAdded).toISOString(),
        updated_at: new Date(item.updatedAt).toISOString(),
      }));

      // Upsert all items
      const { error } = (await supabase
        .from('gaming_library')
        .upsert(supabaseItems, {
          onConflict: 'auth_user_id,igdb_game_id,category',
          ignoreDuplicates: false,
        })) as SupabaseMutationResponse;

      if (error) {
        console.error('[SupabaseLibrary] Sync error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[SupabaseLibrary] Sync exception:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Fetch library from Supabase and merge with localStorage
   */
  async fetchAndMerge(authUserId: string): Promise<GameLibraryItem[]> {
    try {
      const { data, error } = (await supabase
        .from('gaming_library')
        .select('*')
        .eq('auth_user_id', authUserId)) as SupabaseResponse<SupabaseLibraryItem[]>;

      if (error) {
        console.error('[SupabaseLibrary] Fetch error:', error);
        return libraryStorage.getAll(); // Fallback to local
      }

      if (!data || data.length === 0) {
        return libraryStorage.getAll();
      }

      // Transform from Supabase format
      const cloudItems: GameLibraryItem[] = (data as SupabaseLibraryItem[]).map(item => ({
        id: item.id,
        igdbGameId: item.igdb_game_id,
        gameName: item.game_name,
        category: item.category as LibraryCategory,
        platform: item.platform || undefined,
        personalRating: item.personal_rating || undefined,
        completionStatus: item.completion_status as CompletionStatus | undefined,
        hoursPlayed: item.hours_played || undefined,
        notes: item.notes || undefined,
        igdbData: item.igdb_data || undefined,
        dateAdded: new Date(item.date_added).getTime(),
        updatedAt: new Date(item.updated_at).getTime(),
      }));

      // Merge: use the most recent version of each item
      const localItems = libraryStorage.getAll();
      const mergedMap = new Map<string, GameLibraryItem>();

      // Key: igdbGameId + category
      [...localItems, ...cloudItems].forEach(item => {
        const key = `${item.igdbGameId}_${item.category}`;
        const existing = mergedMap.get(key);
        if (!existing || item.updatedAt > existing.updatedAt) {
          mergedMap.set(key, item);
        }
      });

      return Array.from(mergedMap.values());
    } catch (error) {
      console.error('[SupabaseLibrary] Fetch exception:', error);
      return libraryStorage.getAll();
    }
  },

  /**
   * Add a single game to Supabase
   */
  async addGame(
    authUserId: string,
    item: GameLibraryItem
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = (await supabase
        .from('gaming_library')
        .upsert({
          auth_user_id: authUserId,
          igdb_game_id: item.igdbGameId,
          game_name: item.gameName,
          category: item.category,
          platform: item.platform || null,
          personal_rating: item.personalRating || null,
          completion_status: item.completionStatus || null,
          hours_played: item.hoursPlayed || null,
          notes: item.notes || null,
          igdb_data: item.igdbData || null,
          date_added: new Date(item.dateAdded).toISOString(),
          updated_at: new Date(item.updatedAt).toISOString(),
        }, {
          onConflict: 'auth_user_id,igdb_game_id,category',
        })) as SupabaseMutationResponse;

      if (error) {
        console.error('[SupabaseLibrary] Add error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[SupabaseLibrary] Add exception:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Remove a game from Supabase
   */
  async removeGame(
    authUserId: string,
    igdbGameId: number,
    category: LibraryCategory
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = (await supabase
        .from('gaming_library')
        .delete()
        .eq('auth_user_id', authUserId)
        .eq('igdb_game_id', igdbGameId)
        .eq('category', category)) as SupabaseMutationResponse;

      if (error) {
        console.error('[SupabaseLibrary] Remove error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[SupabaseLibrary] Remove exception:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// ============================================================================
// TIMELINE SYNC SERVICE
// ============================================================================

export const supabaseTimelineService = {
  /**
   * Sync all localStorage timeline events to Supabase
   */
  async syncToSupabase(authUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const localEvents = timelineStorage.getAll();
      
      if (localEvents.length === 0) {
        return { success: true };
      }

      const supabaseEvents = localEvents.map(event => ({
        auth_user_id: authUserId,
        event_type: event.type,
        event_date: event.eventDate,
        year: event.year,
        title: event.title,
        description: event.description || null,
        specs: event.specs || null,
        photos: event.photos || null,
        igdb_game_id: event.igdbGameId || null,
        igdb_data: event.igdbData || null,
        screenshot_count: event.screenshotCount || null,
        ai_summary: event.aiSummary || null,
        created_at: new Date(event.createdAt).toISOString(),
        updated_at: new Date(event.updatedAt).toISOString(),
      }));

      const { error } = (await supabase
        .from('gaming_timeline')
        .insert(supabaseEvents)) as SupabaseMutationResponse;

      if (error) {
        console.error('[SupabaseTimeline] Sync error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[SupabaseTimeline] Sync exception:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Fetch timeline events from Supabase
   */
  async fetchAll(authUserId: string): Promise<TimelineEvent[]> {
    try {
      const { data, error } = (await supabase
        .from('gaming_timeline')
        .select('*')
        .eq('auth_user_id', authUserId)
        .order('event_date', { ascending: false })) as SupabaseResponse<SupabaseTimelineEvent[]>;

      if (error) {
        console.error('[SupabaseTimeline] Fetch error:', error);
        return timelineStorage.getAll();
      }

      if (!data || data.length === 0) {
        return timelineStorage.getAll();
      }

      return (data as SupabaseTimelineEvent[]).map(event => ({
        id: event.id,
        type: event.event_type as TimelineEvent['type'],
        eventDate: event.event_date,
        year: event.year,
        title: event.title,
        description: event.description || undefined,
        specs: event.specs || undefined,
        photos: event.photos || undefined,
        igdbGameId: event.igdb_game_id || undefined,
        igdbData: event.igdb_data || undefined,
        screenshotCount: event.screenshot_count || undefined,
        aiSummary: event.ai_summary || undefined,
        createdAt: new Date(event.created_at).getTime(),
        updatedAt: new Date(event.updated_at).getTime(),
      }));
    } catch (error) {
      console.error('[SupabaseTimeline] Fetch exception:', error);
      return timelineStorage.getAll();
    }
  },

  /**
   * Add a single timeline event to Supabase
   */
  async addEvent(
    authUserId: string,
    event: TimelineEvent
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = (await supabase
        .from('gaming_timeline')
        .insert({
          auth_user_id: authUserId,
          event_type: event.type,
          event_date: event.eventDate,
          year: event.year,
          title: event.title,
          description: event.description || null,
          specs: event.specs || null,
          photos: event.photos || null,
          igdb_game_id: event.igdbGameId || null,
          igdb_data: event.igdbData || null,
          screenshot_count: event.screenshotCount || null,
          ai_summary: event.aiSummary || null,
        })
        .select('id')
        .single()) as SupabaseResponse<{ id: string }>;

      if (error) {
        console.error('[SupabaseTimeline] Add error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, id: data?.id };
    } catch (error) {
      console.error('[SupabaseTimeline] Add exception:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// ============================================================================
// GAMING PROFILE SYNC SERVICE
// ============================================================================

export const supabaseProfileService = {
  /**
   * Sync user gaming profile to Supabase
   */
  async syncToSupabase(authUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const profile = userProfileStorage.get();

      const { error } = (await supabase
        .from('gaming_profiles')
        .upsert({
          auth_user_id: authUserId,
          gaming_start_year: profile.gamingStartYear || null,
          owned_count: profile.libraryStats.ownedCount,
          completed_count: profile.libraryStats.completedCount,
          wishlist_count: profile.libraryStats.wishlistCount,
          favorites_count: profile.libraryStats.favoritesCount,
          disliked_count: profile.libraryStats.dislikedCount,
          total_hours_played: profile.libraryStats.totalHoursPlayed,
          last_updated: new Date(profile.lastUpdated).toISOString(),
        }, {
          onConflict: 'auth_user_id',
        })) as SupabaseMutationResponse;

      if (error) {
        console.error('[SupabaseProfile] Sync error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[SupabaseProfile] Sync exception:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Fetch user gaming profile from Supabase
   */
  async fetch(authUserId: string): Promise<UserGamingProfile | null> {
    try {
      const { data, error } = (await supabase
        .from('gaming_profiles')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single()) as SupabaseResponse<SupabaseGamingProfile>;

      if (error || !data) {
        return null;
      }

      const profile = data as SupabaseGamingProfile;
      return {
        gamingStartYear: profile.gaming_start_year || undefined,
        libraryStats: {
          ownedCount: profile.owned_count,
          completedCount: profile.completed_count,
          wishlistCount: profile.wishlist_count,
          favoritesCount: profile.favorites_count,
          dislikedCount: profile.disliked_count,
          totalHoursPlayed: profile.total_hours_played,
        },
        lastUpdated: new Date(profile.last_updated).getTime(),
      };
    } catch (error) {
      console.error('[SupabaseProfile] Fetch exception:', error);
      return null;
    }
  },
};

// ============================================================================
// SEARCH HISTORY SYNC SERVICE
// ============================================================================

export const supabaseSearchHistoryService = {
  /**
   * Sync search history to Supabase
   */
  async syncToSupabase(authUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const localHistory = searchHistoryStorage.getAll();
      
      if (localHistory.length === 0) {
        return { success: true };
      }

      const supabaseItems = localHistory.map(item => ({
        auth_user_id: authUserId,
        igdb_game_id: item.gameData.id,
        game_data: item.gameData,
        searched_at: new Date(item.searchedAt).toISOString(),
      }));

      const { error } = (await supabase
        .from('gaming_search_history')
        .upsert(supabaseItems, {
          onConflict: 'auth_user_id,igdb_game_id',
        })) as SupabaseMutationResponse;

      if (error) {
        console.error('[SupabaseSearchHistory] Sync error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[SupabaseSearchHistory] Sync exception:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Add a single search to history
   */
  async addSearch(authUserId: string, gameData: IGDBGameData): Promise<void> {
    try {
      await supabase
        .from('gaming_search_history')
        .upsert({
          auth_user_id: authUserId,
          igdb_game_id: gameData.id,
          game_data: gameData,
          searched_at: new Date().toISOString(),
        }, {
          onConflict: 'auth_user_id,igdb_game_id',
        }) as unknown as SupabaseMutationResponse;
    } catch (error) {
      console.error('[SupabaseSearchHistory] Add error:', error);
    }
  },
};

// ============================================================================
// GAME KNOWLEDGE SYNC SERVICE
// ============================================================================

export const supabaseKnowledgeService = {
  /**
   * Sync game knowledge to Supabase
   */
  async syncToSupabase(authUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const extractedGames = gameKnowledgeStorage.getAllExtracted();
      
      if (extractedGames.length === 0) {
        return { success: true };
      }

      const knowledgeItems = extractedGames
        .map(igdbGameId => gameKnowledgeStorage.get(igdbGameId))
        .filter((k): k is GameKnowledgeBase => k !== null)
        .map(k => ({
          auth_user_id: authUserId,
          igdb_game_id: k.igdbGameId,
          game_name: k.gameName,
          walkthrough_data: k.walkthroughData || null,
          story_progression: k.storyProgression || null,
          collectibles: k.collectibles || null,
          achievements: k.achievements || null,
          tips_and_tricks: k.tipsAndTricks || null,
          boss_strategies: k.bossStrategies || null,
          character_builds: k.characterBuilds || null,
          game_mechanics: k.gameMechanics || null,
          extracted_at: new Date(k.extractedAt).toISOString(),
          last_updated: new Date(k.lastUpdated).toISOString(),
        }));

      const { error } = (await supabase
        .from('gaming_knowledge')
        .upsert(knowledgeItems, {
          onConflict: 'auth_user_id,igdb_game_id',
        })) as SupabaseMutationResponse;

      if (error) {
        console.error('[SupabaseKnowledge] Sync error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[SupabaseKnowledge] Sync exception:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// ============================================================================
// FULL MIGRATION SERVICE
// ============================================================================

export const gamingExplorerMigrationService = {
  /**
   * Migrate all localStorage data to Supabase
   */
  async migrateAllToSupabase(authUserId: string): Promise<{
    success: boolean;
    results: {
      library: { success: boolean; error?: string };
      timeline: { success: boolean; error?: string };
      profile: { success: boolean; error?: string };
      searchHistory: { success: boolean; error?: string };
      knowledge: { success: boolean; error?: string };
    };
  }> {
    console.log('[Migration] Starting full migration to Supabase...');

    const results = {
      library: await supabaseLibraryService.syncToSupabase(authUserId),
      timeline: await supabaseTimelineService.syncToSupabase(authUserId),
      profile: await supabaseProfileService.syncToSupabase(authUserId),
      searchHistory: await supabaseSearchHistoryService.syncToSupabase(authUserId),
      knowledge: await supabaseKnowledgeService.syncToSupabase(authUserId),
    };

    const success = Object.values(results).every(r => r.success);
    
    console.log('[Migration] Migration complete:', { success, results });
    
    return { success, results };
  },

  /**
   * Check if migration is needed (localStorage has data, Supabase doesn't)
   */
  async checkMigrationNeeded(authUserId: string): Promise<boolean> {
    const localLibrary = libraryStorage.getAll();
    
    // If no local data, no migration needed
    if (localLibrary.length === 0) {
      return false;
    }

    // Check if Supabase has data
    const { data, error } = (await supabase
      .from('gaming_library')
      .select('id', { count: 'exact', head: true })
      .eq('auth_user_id', authUserId)) as SupabaseResponse<{ id: string }[]>;

    if (error) {
      console.error('[Migration] Check error:', error);
      return false;
    }

    // If local has data but Supabase doesn't, migration needed
    return !data || data.length === 0;
  },
};

export default {
  library: supabaseLibraryService,
  timeline: supabaseTimelineService,
  profile: supabaseProfileService,
  searchHistory: supabaseSearchHistoryService,
  knowledge: supabaseKnowledgeService,
  migration: gamingExplorerMigrationService,
};
