/**
 * Game Knowledge Cache Service
 * 
 * Dual-layer caching system for game knowledge:
 * - Layer 1: Memory cache (fast, session-scoped)
 * - Layer 2: Supabase global cache (persistent, shared across all users)
 * 
 * Features:
 * - Global cache: Pro/Vanguard users populate cache, ALL users benefit
 * - Request deduplication: Prevents duplicate fetches for same game
 * - Post-cutoff prioritization: Games after Jan 2025 get priority
 * - Access logging: Track cache hits for analytics
 * 
 * @created December 8, 2025
 */

import { supabase } from '../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface GameKnowledgeCache {
  id: string;
  igdb_id: number;
  game_name: string;
  game_slug?: string;
  comprehensive_knowledge: string;
  knowledge_summary?: string;
  tokens_used: number;
  fetched_with_grounding: boolean;
  is_post_cutoff: boolean;
  is_unreleased: boolean;
  release_date?: string;
  version: number;
  last_refreshed_at?: string;
  created_at: string;
  updated_at: string;
  access_count: number;
  last_accessed_at?: string;
}

export interface CacheResult {
  knowledge: string;
  cached: boolean;
  version: number;
  source: 'memory' | 'supabase' | 'none';
}

// Type for Supabase query result
interface GameKnowledgeRow {
  comprehensive_knowledge: string;
  version: number;
}

// ============================================================================
// MEMORY CACHE (Session-scoped, fast access)
// ============================================================================

const memoryCache = new Map<number, {
  knowledge: string;
  version: number;
  timestamp: number;
}>();

// Memory cache TTL: 30 minutes (for hot games in session)
const MEMORY_CACHE_TTL = 30 * 60 * 1000;

// Track in-flight requests to prevent duplicates
const pendingRequests = new Map<number, Promise<CacheResult>>();

// ============================================================================
// MAIN SERVICE
// ============================================================================

class GameKnowledgeCacheService {
  
  /**
   * Get game knowledge from cache (memory first, then Supabase)
   * Returns null if not cached - caller should trigger fetch
   */
  async get(igdbId: number): Promise<CacheResult> {
    // Check if there's already a request in flight
    const pending = pendingRequests.get(igdbId);
    if (pending) {
      console.log(`🎮 [GameKnowledgeCache] Waiting for in-flight request: ${igdbId}`);
      return pending;
    }

    // Create promise for this request
    const requestPromise = this._fetchFromCache(igdbId);
    pendingRequests.set(igdbId, requestPromise);

    try {
      return await requestPromise;
    } finally {
      pendingRequests.delete(igdbId);
    }
  }

  /**
   * Internal: Fetch from cache layers
   */
  private async _fetchFromCache(igdbId: number): Promise<CacheResult> {
    // Layer 1: Check memory cache
    const memEntry = memoryCache.get(igdbId);
    if (memEntry && Date.now() - memEntry.timestamp < MEMORY_CACHE_TTL) {
      console.log(`🎮 [GameKnowledgeCache] Memory hit for igdbId: ${igdbId}`);
      return {
        knowledge: memEntry.knowledge,
        cached: true,
        version: memEntry.version,
        source: 'memory'
      };
    }

    // Layer 2: Check Supabase global cache
    // Using type assertion since this table is new and not in generated types yet
    try {
      const { data, error } = await (supabase
        .from('game_knowledge_cache' as 'games') // Type assertion for new table
        .select('comprehensive_knowledge, version')
        .eq('igdb_id', igdbId)
        .single() as unknown as Promise<{ data: GameKnowledgeRow | null; error: { code?: string; message?: string } | null }>);

      if (error) {
        if (error.code !== 'PGRST116') { // Not "no rows returned"
          console.warn(`🎮 [GameKnowledgeCache] Supabase error:`, error);
        }
        return { knowledge: '', cached: false, version: 0, source: 'none' };
      }

      if (data) {
        console.log(`🎮 [GameKnowledgeCache] Supabase hit for igdbId: ${igdbId}`);
        
        // Update memory cache
        memoryCache.set(igdbId, {
          knowledge: data.comprehensive_knowledge,
          version: data.version,
          timestamp: Date.now()
        });

        // Update access stats in background (fire-and-forget)
        this._updateAccessStats(igdbId).catch(() => {});

        return {
          knowledge: data.comprehensive_knowledge,
          cached: true,
          version: data.version,
          source: 'supabase'
        };
      }
    } catch (err) {
      console.warn(`🎮 [GameKnowledgeCache] Failed to fetch from Supabase:`, err);
    }

    return { knowledge: '', cached: false, version: 0, source: 'none' };
  }

  /**
   * Store game knowledge in global cache
   * Called after successful Gemini fetch
   */
  async store(
    igdbId: number,
    gameName: string,
    knowledge: string,
    options: {
      gameSlug?: string;
      tokensUsed?: number;
      fetchedWithGrounding?: boolean;
      isPostCutoff?: boolean;
      isUnreleased?: boolean;
      releaseDate?: Date;
      knowledgeSummary?: string;
    } = {}
  ): Promise<boolean> {
    try {
      // Using raw SQL-like approach since table is new and not in generated types
      // The table exists in Supabase, just not in TypeScript types yet
      const payload = {
        igdb_id: igdbId,
        game_name: gameName,
        game_slug: options.gameSlug || null,
        comprehensive_knowledge: knowledge,
        knowledge_summary: options.knowledgeSummary || null,
        tokens_used: options.tokensUsed || 0,
        fetched_with_grounding: options.fetchedWithGrounding ?? true,
        is_post_cutoff: options.isPostCutoff ?? false,
        is_unreleased: options.isUnreleased ?? false,
        release_date: options.releaseDate?.toISOString().split('T')[0] || null,
        version: 1,
        updated_at: new Date().toISOString(),
        access_count: 0
      };

      // Use any type to bypass TypeScript checks for new table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('game_knowledge_cache')
        .upsert(payload, {
          onConflict: 'igdb_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`🎮 [GameKnowledgeCache] Failed to store:`, error);
        return false;
      }

      // Update memory cache
      memoryCache.set(igdbId, {
        knowledge,
        version: 1,
        timestamp: Date.now()
      });

      console.log(`🎮 [GameKnowledgeCache] ✅ Stored knowledge for: ${gameName}`);
      return true;
    } catch (err) {
      console.error(`🎮 [GameKnowledgeCache] Store error:`, err);
      return false;
    }
  }

  /**
   * Check if knowledge exists in cache (fast check)
   */
  async exists(igdbId: number): Promise<boolean> {
    // Check memory first
    const memEntry = memoryCache.get(igdbId);
    if (memEntry && Date.now() - memEntry.timestamp < MEMORY_CACHE_TTL) {
      return true;
    }

    // Check Supabase
    try {
      const { count, error } = await (supabase
        .from('game_knowledge_cache' as 'games') // Type assertion for new table
        .select('*', { count: 'exact', head: true })
        .eq('igdb_id', igdbId) as unknown as Promise<{ count: number | null; error: { message?: string } | null }>);

      if (error) {
        console.warn(`🎮 [GameKnowledgeCache] Exists check error:`, error);
        return false;
      }

      return (count ?? 0) > 0;
    } catch {
      return false;
    }
  }

  /**
   * Check if game should be prioritized for fetching
   * Post-cutoff games (after Jan 2025) get priority
   */
  shouldPrioritizeFetch(releaseDate?: Date): boolean {
    if (!releaseDate) {
      return false;
    }
    const cutoffDate = new Date('2025-01-01');
    return releaseDate > cutoffDate;
  }

  /**
   * Get knowledge formatted for AI context injection
   * Returns null if no knowledge exists
   */
  async getForContext(igdbId: number): Promise<string | null> {
    const result = await this.get(igdbId);
    
    if (!result.cached || !result.knowledge) {
      return null;
    }

    // Return the comprehensive knowledge as-is for Gemini to search
    // The knowledge is already formatted as natural text
    return result.knowledge;
  }

  /**
   * Update access statistics (fire-and-forget)
   */
  private async _updateAccessStats(igdbId: number): Promise<void> {
    try {
      // Use any type to bypass TypeScript checks for new table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('game_knowledge_cache')
        .update({ 
          last_accessed_at: new Date().toISOString() 
        })
        .eq('igdb_id', igdbId);
    } catch {
      // Silently ignore - stats are non-critical
    }
  }

  /**
   * Clear memory cache (useful for testing or memory management)
   */
  clearMemoryCache(): void {
    memoryCache.clear();
    console.log(`🎮 [GameKnowledgeCache] Memory cache cleared`);
  }

  /**
   * Get cache stats for debugging
   */
  getStats(): { memoryCacheSize: number; pendingRequests: number } {
    return {
      memoryCacheSize: memoryCache.size,
      pendingRequests: pendingRequests.size
    };
  }
}

// Export singleton instance
export const gameKnowledgeCacheService = new GameKnowledgeCacheService();
