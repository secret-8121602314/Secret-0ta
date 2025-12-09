/**
 * HQ Supabase Sync Service
 * 
 * Syncs Gaming HQ data between localStorage and Supabase for cross-device access
 * - Library (own, wishlist, favorites, disliked)
 * - Timeline events
 * - Screenshots
 * 
 * Strategy: Dual-write with eventual consistency
 * - Writes go to both localStorage (instant) and Supabase (background)
 * - Reads prefer Supabase, fallback to localStorage
 * - On app load, sync localStorage → Supabase for offline changes
 */

import { supabase } from '../lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { 
  GameLibraryItem, 
  TimelineEvent, 
  GameplayScreenshot,
  LibraryCategory,
  CompletionStatus 
} from './gamingExplorerStorage';
import { IGDBGameData } from './igdbService';

// ============================================================================
// LIBRARY SYNC
// ============================================================================

export const librarySupabaseSync = {
  /**
   * Get all library items from Supabase
   */
  async getAll(userId: string): Promise<GameLibraryItem[]> {
    try {
      const { data, error } = await (supabase as unknown as SupabaseClient)
        .from('user_library')
        .select('*')
        .eq('auth_user_id', userId)
        .order('date_added', { ascending: false });
      
      if (error) {
        console.error('[LibrarySync] Error fetching library:', error);
        return [];
      }
      
      return (data || []).map(row => ({
        id: row.id,
        igdbGameId: row.igdb_game_id,
        gameName: row.game_title,
        category: row.category as LibraryCategory,
        platform: row.platform,
        personalRating: row.personal_rating,
        completionStatus: row.completion_status as CompletionStatus,
        hoursPlayed: row.hours_played ? parseFloat(row.hours_played) : undefined,
        notes: row.notes,
        igdbData: row.igdb_data as IGDBGameData,
        dateAdded: new Date(row.date_added).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
      }));
    } catch (error) {
      console.error('[LibrarySync] Error in getAll:', error);
      return [];
    }
  },

  /**
   * Add game to library in Supabase
   */
  async add(userId: string, item: GameLibraryItem): Promise<boolean> {
    try {
      const { error } = await (supabase as unknown as SupabaseClient)
        .from('user_library')
        .insert({
          auth_user_id: userId,
          igdb_game_id: item.igdbGameId,
          game_title: item.gameName,
          category: item.category,
          platform: item.platform,
          personal_rating: item.personalRating,
          completion_status: item.completionStatus,
          hours_played: item.hoursPlayed,
          notes: item.notes,
          igdb_data: item.igdbData || {},
          date_added: new Date(item.dateAdded).toISOString(),
          updated_at: new Date(item.updatedAt).toISOString(),
        });
      
      if (error) {
        // Ignore duplicate key errors (already exists)
        if (error.code === '23505') {
          console.log('[LibrarySync] Item already exists, updating instead');
          return this.update(userId, item);
        }
        console.error('[LibrarySync] Error adding to library:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[LibrarySync] Error in add:', error);
      return false;
    }
  },

  /**
   * Update library item in Supabase
   */
  async update(userId: string, item: GameLibraryItem): Promise<boolean> {
    try {
      const { error } = await (supabase as unknown as SupabaseClient)
        .from('user_library')
        .update({
          platform: item.platform,
          personal_rating: item.personalRating,
          completion_status: item.completionStatus,
          hours_played: item.hoursPlayed,
          notes: item.notes,
          igdb_data: item.igdbData || {},
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', userId)
        .eq('igdb_game_id', item.igdbGameId)
        .eq('category', item.category);
      
      if (error) {
        console.error('[LibrarySync] Error updating library:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[LibrarySync] Error in update:', error);
      return false;
    }
  },

  /**
   * Remove game from library in Supabase
   */
  async remove(userId: string, igdbGameId: number, category: LibraryCategory): Promise<boolean> {
    try {
      const { error } = await (supabase as unknown as SupabaseClient)
        .from('user_library')
        .delete()
        .eq('auth_user_id', userId)
        .eq('igdb_game_id', igdbGameId)
        .eq('category', category);
      
      if (error) {
        console.error('[LibrarySync] Error removing from library:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[LibrarySync] Error in remove:', error);
      return false;
    }
  },

  /**
   * Sync localStorage → Supabase (on app load)
   */
  async syncFromLocalStorage(userId: string, localItems: GameLibraryItem[]): Promise<void> {
    console.log(`[LibrarySync] Syncing ${localItems.length} items from localStorage to Supabase...`);
    
    for (const item of localItems) {
      await this.add(userId, item);
    }
    
    console.log('[LibrarySync] Sync complete');
  },
};

// ============================================================================
// TIMELINE SYNC
// ============================================================================

export const timelineSupabaseSync = {
  /**
   * Get all timeline events from Supabase
   */
  async getAll(userId: string): Promise<TimelineEvent[]> {
    try {
      const { data, error } = await (supabase as unknown as SupabaseClient)
        .from('user_timeline')
        .select('*')
        .eq('auth_user_id', userId)
        .order('event_date', { ascending: false });
      
      if (error) {
        console.error('[TimelineSync] Error fetching timeline:', error);
        return [];
      }
      
      return (data || []).map(row => ({
        id: row.id,
        type: row.event_type,
        eventDate: new Date(row.event_date).toISOString().split('T')[0],
        year: new Date(row.event_date).getFullYear(),
        title: row.event_title,
        description: row.event_description,
        specs: row.event_data?.specs,
        photos: row.event_data?.photos,
        igdbGameId: row.igdb_game_id,
        igdbData: row.event_data?.igdbData as IGDBGameData,
        screenshotCount: row.event_data?.screenshotCount,
        aiSummary: row.event_data?.aiSummary,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.created_at).getTime(),
      }));
    } catch (error) {
      console.error('[TimelineSync] Error in getAll:', error);
      return [];
    }
  },

  /**
   * Add timeline event to Supabase
   */
  async add(userId: string, event: TimelineEvent): Promise<boolean> {
    try {
      const { error } = await (supabase as unknown as SupabaseClient)
        .from('user_timeline')
        .insert({
          auth_user_id: userId,
          event_type: event.type,
          event_title: event.title,
          event_description: event.description,
          event_data: {
            specs: event.specs,
            photos: event.photos,
            igdbData: event.igdbData,
            screenshotCount: event.screenshotCount,
            aiSummary: event.aiSummary,
          },
          game_title: event.igdbData?.name,
          igdb_game_id: event.igdbGameId,
          event_date: new Date(event.eventDate).toISOString(),
          created_at: new Date(event.createdAt).toISOString(),
        });
      
      if (error) {
        console.error('[TimelineSync] Error adding event:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[TimelineSync] Error in add:', error);
      return false;
    }
  },

  /**
   * Remove timeline event from Supabase
   */
  async remove(userId: string, eventId: string): Promise<boolean> {
    try {
      const { error } = await (supabase as unknown as SupabaseClient)
        .from('user_timeline')
        .delete()
        .eq('auth_user_id', userId)
        .eq('id', eventId);
      
      if (error) {
        console.error('[TimelineSync] Error removing event:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[TimelineSync] Error in remove:', error);
      return false;
    }
  },

  /**
   * Sync localStorage → Supabase (on app load)
   */
  async syncFromLocalStorage(userId: string, localEvents: TimelineEvent[]): Promise<void> {
    console.log(`[TimelineSync] Syncing ${localEvents.length} events from localStorage to Supabase...`);
    
    for (const event of localEvents) {
      await this.add(userId, event);
    }
    
    console.log('[TimelineSync] Sync complete');
  },
};

// ============================================================================
// SCREENSHOTS SYNC
// ============================================================================

export const screenshotsSupabaseSync = {
  /**
   * Get all screenshots from Supabase
   */
  async getAll(userId: string): Promise<GameplayScreenshot[]> {
    try {
      const { data, error } = await (supabase as unknown as SupabaseClient)
        .from('user_screenshots')
        .select('*')
        .eq('auth_user_id', userId)
        .order('captured_at', { ascending: false });
      
      if (error) {
        console.error('[ScreenshotsSync] Error fetching screenshots:', error);
        return [];
      }
      
      return (data || []).map(row => ({
        id: row.id,
        sessionId: '', // Not stored in Supabase
        messageId: '', // Not stored in Supabase
        conversationId: row.conversation_id || '',
        screenshotUrl: row.screenshot_url,
        aiAnalysis: '', // Not stored in Supabase
        capturedAt: new Date(row.captured_at).getTime(),
      }));
    } catch (error) {
      console.error('[ScreenshotsSync] Error in getAll:', error);
      return [];
    }
  },

  /**
   * Add screenshot to Supabase
   */
  async add(userId: string, screenshot: GameplayScreenshot, gameTitle?: string): Promise<boolean> {
    try {
      const { error } = await (supabase as unknown as SupabaseClient)
        .from('user_screenshots')
        .insert({
          auth_user_id: userId,
          screenshot_url: screenshot.screenshotUrl,
          game_title: gameTitle,
          conversation_id: screenshot.conversationId,
          captured_at: new Date(screenshot.capturedAt).toISOString(),
        });
      
      if (error) {
        console.error('[ScreenshotsSync] Error adding screenshot:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[ScreenshotsSync] Error in add:', error);
      return false;
    }
  },
};
