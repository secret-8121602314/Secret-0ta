import { supabase } from '../lib/supabase';
import type { AICacheContext, AICacheResponseData } from '../types/enhanced';

/**
 * AI Response Cache Service
 * Caches AI responses to reduce API costs and improve response time
 * 
 * Cache Strategy:
 * - Global cache: General knowledge, common questions (7 days TTL)
 * - Game-specific cache: Game guides, tips (24 hours TTL)
 * - User cache: Personalized responses (12 hours TTL)
 */

interface CacheOptions {
  cacheType: 'global' | 'user' | 'game_specific';
  gameTitle?: string;
  conversationId?: string;
  modelUsed: string;
  tokensUsed: number;
  ttlHours: number;
}

export class AICacheService {
  private static instance: AICacheService;

  static getInstance(): AICacheService {
    if (!AICacheService.instance) {
      AICacheService.instance = new AICacheService();
    }
    return AICacheService.instance;
  }

  /**
   * Generate a deterministic cache key from prompt and context
   */
  generateCacheKey(prompt: string, context: AICacheContext): string {
    // Normalize the input to create a consistent hash
    const normalized = {
      prompt: prompt.trim().toLowerCase(),
      gameTitle: context.gameTitle?.toLowerCase(),
      mode: context.mode,
      // Don't include conversation-specific data (messages, user ID, timestamps)
    };

    const cacheInput = JSON.stringify(normalized);
    
    // Use simple hash function (good enough for cache keys)
    let hash = 0;
    for (let i = 0; i < cacheInput.length; i++) {
      const char = cacheInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if a response exists in cache
   */
  async getCachedResponse(cacheKey: string): Promise<AICacheResponseData | null> {
    console.log(`🔍 [aiCacheService] getCachedResponse called with key: ${cacheKey}`);
    
    try {
      const { data, error } = await supabase
        .from('ai_responses')
        .select('response_data, created_at, model_used, tokens_used, cache_type')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - cache miss
          console.log('❌ [aiCacheService] Cache MISS:', cacheKey.substring(0, 8));
          return null;
        }
        console.error('❌ [aiCacheService] Error checking cache:', error);
        return null;
      }

      if (data) {
        const ageMinutes = data.created_at 
          ? Math.floor((Date.now() - new Date(data.created_at).getTime()) / 1000 / 60)
          : 0;
        console.log('✅ [aiCacheService] Cache HIT:', cacheKey.substring(0, 8), {
          age: `${ageMinutes}m`,
          model: data.model_used,
          tokens: data.tokens_used,
          type: data.cache_type
        });
        return data.response_data as AICacheResponseData;
      }

      return null;
    } catch (error) {
      console.error('Error in getCachedResponse:', error);
      return null;
    }
  }

  /**
   * Store a response in cache
   */
  async cacheResponse(
    cacheKey: string,
    responseData: AICacheResponseData,
    options: CacheOptions
  ): Promise<boolean> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + options.ttlHours);

      // Get user ID if available (for tracking, not as FK)
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('ai_responses')
        .upsert({
          cache_key: cacheKey,
          response_data: JSON.parse(JSON.stringify(responseData)), // Convert to plain JSON
          game_title: options.gameTitle,
          cache_type: options.cacheType,
          conversation_id: options.conversationId,
          model_used: options.modelUsed,
          tokens_used: options.tokensUsed,
          user_id: user?.id, // Track who created cache (not a FK)
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        }, {
          onConflict: 'cache_key'
        });

      if (error) {
        console.error('Error caching response:', error);
        return false;
      }

      console.log('💾 Cached response:', cacheKey.substring(0, 8), {
        type: options.cacheType,
        ttl: options.ttlHours + 'h',
        tokens: options.tokensUsed,
        game: options.gameTitle
      });

      return true;
    } catch (error) {
      console.error('Error in cacheResponse:', error);
      return false;
    }
  }

  /**
   * Determine cache type based on context
   */
  determineCacheType(context: AICacheContext): 'global' | 'user' | 'game_specific' {
    // Game-specific queries
    if (context.gameTitle) {
      return 'game_specific';
    }

    // User-specific queries (personalized, conversation-specific)
    if (context.hasUserContext || context.conversationId) {
      return 'user';
    }

    // General knowledge
    return 'global';
  }

  /**
   * Determine TTL based on cache type and content
   */
  determineTTL(cacheType: string, _context?: AICacheContext): number {
    switch (cacheType) {
      case 'global':
        // General knowledge - long TTL
        return 168; // 7 days

      case 'game_specific':
        // Game guides, tips - medium TTL
        return 24; // 1 day

      case 'user':
        // User-specific - short TTL
        return 12; // 12 hours

      default:
        return 24;
    }
  }

  /**
   * Check if a query should be cached
   */
  shouldCache(prompt: string, context: AICacheContext): boolean {
    console.log(`🔍 [aiCacheService] shouldCache called with prompt: "${prompt.substring(0, 50)}..."`, context);
    
    // Don't cache if explicitly disabled
    if (context.noCache === true) {
      console.log(`❌ [aiCacheService] Not caching: noCache=true`);
      return false;
    }

    // Don't cache very short prompts (likely greetings or clarifications)
    if (prompt.trim().length < 10) {
      console.log(`❌ [aiCacheService] Not caching: prompt too short (${prompt.trim().length} chars)`);
      return false;
    }

    // Don't cache if it contains time-sensitive words
    const timeSensitive = ['today', 'now', 'current', 'latest', 'recent', 'just released'];
    const lowerPrompt = prompt.toLowerCase();
    const foundTimeSensitive = timeSensitive.find(word => lowerPrompt.includes(word));
    if (foundTimeSensitive) {
      console.log(`❌ [aiCacheService] Not caching: time-sensitive word found: "${foundTimeSensitive}"`);
      return false;
    }

    // Cache everything else
    console.log(`✅ [aiCacheService] Should cache this query`);
    return true;
  }

  /**
   * Clean up expired cache entries
   * Should be called periodically (e.g., daily cron job)
   */
  async cleanupExpiredCache(): Promise<{ deleted: number }> {
    try {
      const { data, error } = await supabase
        .from('ai_responses')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        console.error('Error cleaning up cache:', error);
        return { deleted: 0 };
      }

      const deletedCount = data?.length || 0;
      console.log(`🧹 Cleaned up ${deletedCount} expired cache entries`);

      return { deleted: deletedCount };
    } catch (error) {
      console.error('Error in cleanupExpiredCache:', error);
      return { deleted: 0 };
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalEntries: number;
    byType: Record<string, number>;
    totalTokensSaved: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('ai_responses')
        .select('cache_type, tokens_used')
        .gt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error getting cache stats:', error);
        return { totalEntries: 0, byType: {}, totalTokensSaved: 0 };
      }

      const stats = {
        totalEntries: data.length,
        byType: {} as Record<string, number>,
        totalTokensSaved: data.reduce((sum, entry) => sum + (entry.tokens_used || 0), 0)
      };

      // Count by type
      data.forEach(entry => {
        const type = entry.cache_type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error in getCacheStats:', error);
      return { totalEntries: 0, byType: {}, totalTokensSaved: 0 };
    }
  }

  /**
   * Invalidate cache for a specific game
   */
  async invalidateGameCache(gameTitle: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_responses')
        .delete()
        .eq('game_title', gameTitle)
        .eq('cache_type', 'game_specific');

      if (error) {
        console.error('Error invalidating game cache:', error);
        return false;
      }

      console.log(`🗑️ Invalidated cache for game: ${gameTitle}`);
      return true;
    } catch (error) {
      console.error('Error in invalidateGameCache:', error);
      return false;
    }
  }
}

export const aiCacheService = AICacheService.getInstance();
