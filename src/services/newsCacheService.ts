/**
 * News Cache Service
 * 
 * Global Supabase cache for gaming news with 24-hour expiry
 * Replaces localStorage-only approach for cross-user caching
 */

import { supabase } from '../lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  source?: string;
  igdbGameId?: number;
  publishedAt?: number;
}

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export const newsCacheService = {
  /**
   * Get cached news for a prompt type (global cache)
   */
  async getCache(promptType: string): Promise<NewsItem[] | null> {
    try {
      const { data, error } = await (supabase as unknown as SupabaseClient)
        .from('news_cache')
        .select('*')
        .eq('prompt_type', promptType)
        .gte('expires_at', new Date().toISOString())
        .order('cached_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return null;
        }
        console.error('[NewsCache] Error fetching cache:', error);
        return null;
      }
      
      if (!data) {
        return null;
      }
      
      // Parse news_items JSONB
      const newsItems = data.news_items as NewsItem[];
      return newsItems;
    } catch (_error) {
      console.error('[NewsCache] Error in getCache:', _error);
      return null;
    }
  },

  /**
   * Store news in global cache with 24-hour expiry
   */
  async setCache(promptType: string, items: NewsItem[]): Promise<boolean> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + CACHE_DURATION_MS);
      
      // Delete old cache for this prompt type
      await (supabase as unknown as SupabaseClient)
        .from('news_cache')
        .delete()
        .eq('prompt_type', promptType);
      
      // Insert new cache
      const { error } = await (supabase as unknown as SupabaseClient)
        .from('news_cache')
        .insert({
          prompt_type: promptType,
          news_items: items,
          cached_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        });
      
      if (error) {
        console.error('[NewsCache] Error storing cache:', error);
        return false;
      }
      
      console.log(`[NewsCache] Stored ${items.length} items for "${promptType}" (expires in 24h)`);
      return true;
    } catch (_error) {
      console.error('[NewsCache] Error in setCache:', _error);
      return false;
    }
  },

  /**
   * Check if cache exists and is valid for a prompt type
   */
  async hasValidCache(promptType: string): Promise<boolean> {
    const cache = await this.getCache(promptType);
    return cache !== null && cache.length > 0;
  },

  /**
   * Clear expired cache entries (maintenance)
   */
  async clearExpired(): Promise<number> {
    try {
      const { data, error } = await (supabase as unknown as SupabaseClient)
        .from('news_cache')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select();
      
      if (error) {
        console.error('[NewsCache] Error clearing expired:', error);
        return 0;
      }
      
      const count = data?.length || 0;
      console.log(`[NewsCache] Cleared ${count} expired entries`);
      return count;
    } catch (_error) {
      console.error('[NewsCache] Error in clearExpired:', _error);
      return 0;
    }
  },

  /**
   * Get cache age in hours
   */
  async getCacheAge(promptType: string): Promise<number | null> {
    try {
      const { data, error } = await (supabase as unknown as SupabaseClient)
        .from('news_cache')
        .select('cached_at')
        .eq('prompt_type', promptType)
        .gte('expires_at', new Date().toISOString())
        .order('cached_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      const cachedAt = new Date(data.cached_at).getTime();
      const ageMs = Date.now() - cachedAt;
      return ageMs / (60 * 60 * 1000); // Convert to hours
    } catch (_error) {
      return null;
    }
  },
};
