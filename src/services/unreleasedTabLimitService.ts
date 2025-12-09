/**
 * Unreleased Tab Limit Service
 * 
 * Enforces tier-based limits on unreleased game tabs:
 * - Free: 2-3 tabs
 * - Pro/Vanguard: 10 tabs
 */

import { supabase } from '../lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

const LIMITS = {
  free: 3,
  pro: 10,
  vanguard_pro: 10,
} as const;

export const unreleasedTabLimitService = {
  /**
   * Check if user can create another unreleased game tab
   */
  async canCreateUnreleasedTab(userId: string, userTier: string): Promise<{ canCreate: boolean; currentCount: number; limit: number }> {
    const limit = LIMITS[userTier as keyof typeof LIMITS] || LIMITS.free;
    
    // Count existing unreleased tabs for this user
    const { count, error } = await (supabase as unknown as SupabaseClient)
      .from('unreleased_game_tabs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (error) {
      console.error('[UnreleasedTabLimit] Error counting tabs:', error);
      return { canCreate: true, currentCount: 0, limit }; // Fail open
    }
    
    const currentCount = count || 0;
    return {
      canCreate: currentCount < limit,
      currentCount,
      limit,
    };
  },

  /**
   * Track a new unreleased game tab
   */
  async trackUnreleasedTab(userId: string, conversationId: string, gameId: number, gameTitle: string): Promise<boolean> {
    const { error } = await (supabase as unknown as SupabaseClient)
      .from('unreleased_game_tabs')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        game_id: gameId,
        game_title: gameTitle,
      });
    
    if (error) {
      console.error('[UnreleasedTabLimit] Error tracking tab:', error);
      return false;
    }
    
    return true;
  },

  /**
   * Remove tracking when tab is deleted or game is released
   */
  async untrackUnreleasedTab(conversationId: string): Promise<boolean> {
    const { error } = await (supabase as unknown as SupabaseClient)
      .from('unreleased_game_tabs')
      .delete()
      .eq('conversation_id', conversationId);
    
    if (error) {
      console.error('[UnreleasedTabLimit] Error untracking tab:', error);
      return false;
    }
    
    return true;
  },

  /**
   * Get user's unreleased tabs
   */
  async getUserUnreleasedTabs(userId: string): Promise<Array<{ conversationId: string; gameTitle: string; createdAt: string }>> {
    const { data, error } = await (supabase as unknown as SupabaseClient)
      .from('unreleased_game_tabs')
      .select('conversation_id, game_title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[UnreleasedTabLimit] Error getting tabs:', error);
      return [];
    }
    
    return (data || []).map((row: { conversation_id: string; game_title: string; created_at: string }) => ({
      conversationId: row.conversation_id,
      gameTitle: row.game_title,
      createdAt: row.created_at,
    }));
  },
};
