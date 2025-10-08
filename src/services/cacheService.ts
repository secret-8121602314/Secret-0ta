import { supabase } from '../lib/supabase';

/**
 * Centralized cache service using Supabase for persistent caching
 * Replaces multiple cache instances across services with database-backed cache
 */
class CacheService {
  private memoryCache = new Map<string, { value: any; expires: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly CACHE_TABLE = 'app_cache';
  private readonly MAX_MEMORY_CACHE_SIZE = 100; // Prevent memory bloat
  
  // Request deduplication - prevent multiple simultaneous calls for the same key
  private pendingRequests = new Map<string, Promise<any>>();

  /**
   * Set a value in both memory and Supabase cache
   */
  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL, cacheType: string = 'general', userId?: string): Promise<void> {
    const expires = Date.now() + ttl;
    
    // Store in memory cache for fast access
    this.memoryCache.set(key, { value, expires });
    console.log(`[CacheService] Stored in memory cache: ${key}`);
    
    // Store in Supabase for persistence
    try {
      console.log(`[CacheService] Storing in Supabase: ${key} (type: ${cacheType}, user: ${userId || 'none'})`);
      const { error } = await supabase
        .from(this.CACHE_TABLE)
        .upsert({
          key,
          value: JSON.stringify(value),
          expires_at: new Date(expires).toISOString(),
          updated_at: new Date().toISOString(),
          cache_type: cacheType,
          user_id: userId || null,
          size_bytes: JSON.stringify(value).length
        });
      
      if (error) {
        console.warn(`[CacheService] Failed to store cache in Supabase for key ${key}:`, error);
      } else {
        console.log(`[CacheService] Successfully stored in Supabase: ${key}`);
      }
    } catch (error) {
      console.warn(`[CacheService] Supabase cache unavailable for key ${key}, using memory only:`, error);
    }
    
    // Cleanup memory cache if it gets too large
    if (this.memoryCache.size > this.MAX_MEMORY_CACHE_SIZE) {
      this.cleanupMemoryCache();
    }
  }

  /**
   * Get a value from cache (memory first, then Supabase)
   * Implements request deduplication to prevent multiple simultaneous calls
   */
  async get<T>(key: string): Promise<T | null> {
    // Check if there's already a pending request for this key
    if (this.pendingRequests.has(key)) {
      console.log(`[CacheService] Request deduplication: waiting for pending request for key: ${key}`);
      return await this.pendingRequests.get(key) as T | null;
    }
    
    // Try memory cache first
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && Date.now() <= memoryItem.expires) {
      console.log(`[CacheService] Cache HIT (memory): ${key}`);
      return memoryItem.value as T;
    }
    
    // Remove expired memory item
    if (memoryItem) {
      this.memoryCache.delete(key);
    }
    
    // Create a promise for the Supabase request and store it
    const supabaseRequest = this.fetchFromSupabase<T>(key);
    this.pendingRequests.set(key, supabaseRequest);
    
    try {
      const result = await supabaseRequest;
      return result;
    } finally {
      // Clean up the pending request
      this.pendingRequests.delete(key);
    }
  }
  
  /**
   * Fetch data from Supabase cache
   */
  private async fetchFromSupabase<T>(key: string): Promise<T | null> {
    try {
      console.log(`[CacheService] Cache MISS (memory), trying Supabase: ${key}`);
      const { data, error } = await supabase
        .from(this.CACHE_TABLE)
        .select('value, expires_at')
        .eq('key', key)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid 406 errors
      
      if (error) {
        console.warn(`[CacheService] Supabase error for key ${key}:`, error);
        return null;
      }
      
      if (!data) {
        console.log(`[CacheService] Cache MISS (Supabase): ${key}`);
        return null;
      }
      
      const expiresAt = new Date(data.expires_at).getTime();
      if (Date.now() > expiresAt) {
        console.log(`[CacheService] Cache EXPIRED (Supabase): ${key}`);
        await this.delete(key);
        return null;
      }
      
      console.log(`[CacheService] Cache HIT (Supabase): ${key}`);
      const value = JSON.parse(data.value);
      this.memoryCache.set(key, { value, expires: expiresAt });
      return value as T;
      
    } catch (error) {
      console.warn(`[CacheService] Error retrieving cache for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Check if a key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Delete a specific key from both memory and Supabase
   */
  async delete(key: string): Promise<boolean> {
    // Remove from memory
    const memoryDeleted = this.memoryCache.delete(key);
    
    // Remove from Supabase
    try {
      const { error } = await supabase
        .from(this.CACHE_TABLE)
        .delete()
        .eq('key', key);
      
      if (error) {
        console.warn(`[CacheService] Failed to delete cache from Supabase:`, error);
      }
    } catch (error) {
      console.warn(`[CacheService] Error deleting cache:`, error);
    }
    
    return memoryDeleted;
  }

  /**
   * Clear all cache entries from both memory and Supabase
   */
  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear pending requests
    this.pendingRequests.clear();
    
    // Clear Supabase cache
    try {
      const { error } = await supabase
        .from(this.CACHE_TABLE)
        .delete()
        .neq('key', 'never_delete'); // Delete all except this placeholder
      
      if (error) {
        console.warn(`[CacheService] Failed to clear Supabase cache:`, error);
      }
    } catch (error) {
      console.warn(`[CacheService] Error clearing cache:`, error);
    }
  }

  /**
   * Clear expired entries from both memory and Supabase
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    
    // Cleanup memory cache
    this.cleanupMemoryCache();
    
    // Cleanup Supabase cache
    try {
      const { error } = await supabase
        .from(this.CACHE_TABLE)
        .delete()
        .lt('expires_at', new Date(now).toISOString());
      
      if (error) {
        console.warn(`[CacheService] Failed to cleanup Supabase cache:`, error);
      }
    } catch (error) {
      console.warn(`[CacheService] Error cleaning up cache:`, error);
    }
  }

  /**
   * Cleanup memory cache to prevent bloat
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    const entries = Array.from(this.memoryCache.entries());
    
    // Remove expired entries
    entries.forEach(([key, item]) => {
      if (now > item.expires) {
        this.memoryCache.delete(key);
      }
    });
    
    // If still too large, remove oldest entries
    if (this.memoryCache.size > this.MAX_MEMORY_CACHE_SIZE) {
      const sortedEntries = entries
        .filter(([key]) => this.memoryCache.has(key))
        .sort((a, b) => a[1].expires - b[1].expires);
      
      const toRemove = sortedEntries.slice(0, this.memoryCache.size - this.MAX_MEMORY_CACHE_SIZE);
      toRemove.forEach(([key]) => this.memoryCache.delete(key));
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { memorySize: number; memoryKeys: string[] } {
    return {
      memorySize: this.memoryCache.size,
      memoryKeys: Array.from(this.memoryCache.keys()),
    };
  }

  /**
   * Get comprehensive cache statistics from Supabase
   */
  async getSupabaseStats(): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_cache_stats');
      if (error) {
        console.warn('[CacheService] Failed to get Supabase stats:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.warn('[CacheService] Error getting Supabase stats:', error);
      return null;
    }
  }

  /**
   * Get cache performance metrics
   */
  async getPerformanceMetrics(): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_cache_performance_metrics');
      if (error) {
        console.warn('[CacheService] Failed to get performance metrics:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.warn('[CacheService] Error getting performance metrics:', error);
      return null;
    }
  }

  /**
   * Get user-specific cache entries
   */
  async getUserCacheEntries(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_cache_entries', { target_user_id: userId });
      if (error) {
        console.warn('[CacheService] Failed to get user cache entries:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.warn('[CacheService] Error getting user cache entries:', error);
      return [];
    }
  }

  /**
   * Clear all cache entries for a specific user
   */
  async clearUserCache(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('clear_user_cache', { target_user_id: userId });
      if (error) {
        console.warn('[CacheService] Failed to clear user cache:', error);
        return 0;
      }
      return data || 0;
    } catch (error) {
      console.warn('[CacheService] Error clearing user cache:', error);
      return 0;
    }
  }

  /**
   * Set chat context data
   */
  async setChatContext(userId: string, context: any): Promise<void> {
    await this.set(`chat_context:${userId}`, context, 24 * 60 * 60 * 1000, 'context', userId); // 24 hours
  }

  /**
   * Get chat context data
   */
  async getChatContext<T>(userId: string): Promise<T | null> {
    return await this.get<T>(`chat_context:${userId}`);
  }

  /**
   * Set user memory data
   */
  async setUserMemory(userId: string, memory: any): Promise<void> {
    await this.set(`user_memory:${userId}`, memory, 30 * 24 * 60 * 60 * 1000, 'memory', userId); // 30 days
  }

  /**
   * Get user memory data
   */
  async getUserMemory<T>(userId: string): Promise<T | null> {
    return await this.get<T>(`user_memory:${userId}`);
  }

  /**
   * Set game context data
   */
  async setGameContext(userId: string, gameId: string, context: any): Promise<void> {
    await this.set(`game_context:${userId}:${gameId}`, context, 24 * 60 * 60 * 1000, 'context', userId); // 24 hours
  }

  /**
   * Get game context data
   */
  async getGameContext<T>(userId: string, gameId: string): Promise<T | null> {
    return await this.get<T>(`game_context:${userId}:${gameId}`);
  }

  /**
   * Set user data with appropriate TTL
   */
  async setUser(userId: string, user: any): Promise<void> {
    await this.set(`user:${userId}`, user, 5 * 60 * 1000, 'user', userId); // 5 minutes
  }

  /**
   * Get user data
   */
  async getUser<T>(userId: string): Promise<T | null> {
    return await this.get<T>(`user:${userId}`);
  }

  /**
   * Set rate limit data
   */
  async setRateLimit(key: string, data: { count: number; resetTime: number }): Promise<void> {
    await this.set(`rate_limit:${key}`, data, 15 * 60 * 1000, 'rate_limit'); // 15 minutes
  }

  /**
   * Get rate limit data
   */
  async getRateLimit(key: string): Promise<{ count: number; resetTime: number } | null> {
    return await this.get<{ count: number; resetTime: number }>(`rate_limit:${key}`);
  }

  /**
   * Set conversation data
   */
  async setConversation(conversationId: string, conversation: any, userId?: string): Promise<void> {
    await this.set(`conversation:${conversationId}`, conversation, 10 * 60 * 1000, 'conversation', userId); // 10 minutes
  }

  /**
   * Get conversation data
   */
  async getConversation<T>(conversationId: string): Promise<T | null> {
    return await this.get<T>(`conversation:${conversationId}`);
  }

  /**
   * Initialize cache table if it doesn't exist
   */
  async initializeCacheTable(): Promise<void> {
    try {
      // Check if table exists by trying to select from it
      const { error } = await supabase
        .from(this.CACHE_TABLE)
        .select('key')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        // Table doesn't exist, create it
        console.log('[CacheService] Creating cache table...');
        // Note: This would typically be done via a migration
        // For now, we'll just log that it needs to be created
        console.warn('[CacheService] Cache table needs to be created in Supabase');
      }
    } catch (error) {
      console.warn('[CacheService] Error checking cache table:', error);
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Initialize cache table on startup
cacheService.initializeCacheTable();

// Auto-cleanup every 5 minutes
setInterval(() => {
  cacheService.cleanup();
}, 5 * 60 * 1000);
