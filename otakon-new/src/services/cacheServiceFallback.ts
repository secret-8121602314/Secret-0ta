// Fallback cache service that works without Supabase
// This will be used if the app_cache table doesn't exist

class CacheServiceFallback {
  private memoryCache = new Map<string, { value: any; expires: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_MEMORY_CACHE_SIZE = 100;

  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL, cacheType: string = 'general', userId?: string): Promise<void> {
    const expires = Date.now() + ttl;
    this.memoryCache.set(key, { value, expires });
    
    // Also store in localStorage as backup
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify({ value, expires }));
    } catch (error) {
      console.warn('[CacheServiceFallback] Failed to store in localStorage:', error);
    }
    
    if (this.memoryCache.size > this.MAX_MEMORY_CACHE_SIZE) {
      this.cleanupMemoryCache();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    const cached = this.memoryCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.value as T;
    }
    
    // Try localStorage
    try {
      const stored = localStorage.getItem(`cache_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.expires > Date.now()) {
          // Store back in memory cache
          this.memoryCache.set(key, parsed);
          return parsed.value as T;
        } else {
          // Expired, remove it
          localStorage.removeItem(`cache_${key}`);
        }
      }
    } catch (error) {
      console.warn('[CacheServiceFallback] Failed to read from localStorage:', error);
    }
    
    return null;
  }

  async delete(key: string): Promise<boolean> {
    const memoryDeleted = this.memoryCache.delete(key);
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('[CacheServiceFallback] Failed to delete from localStorage:', error);
    }
    return memoryDeleted;
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    try {
      // Clear all cache items from localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('[CacheServiceFallback] Failed to clear localStorage:', error);
    }
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, cached] of this.memoryCache.entries()) {
      if (cached.expires <= now) {
        this.memoryCache.delete(key);
        try {
          localStorage.removeItem(`cache_${key}`);
        } catch (error) {
          // Ignore localStorage errors during cleanup
        }
      }
    }
  }

  private cleanupMemoryCache(): void {
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].expires - b[1].expires);
    
    const toDelete = entries.slice(0, Math.floor(entries.length / 2));
    toDelete.forEach(([key]) => this.memoryCache.delete(key));
  }

  getStats(): { memorySize: number; memoryKeys: string[] } {
    return {
      memorySize: this.memoryCache.size,
      memoryKeys: Array.from(this.memoryCache.keys())
    };
  }

  // Simplified methods for compatibility
  async setUser(userId: string, user: any): Promise<void> {
    await this.set(`user:${userId}`, user, 5 * 60 * 1000, 'user', userId);
  }

  async getUser<T>(userId: string): Promise<T | null> {
    return await this.get<T>(`user:${userId}`);
  }

  async setRateLimit(key: string, data: { count: number; resetTime: number }): Promise<void> {
    await this.set(`rate_limit:${key}`, data, 15 * 60 * 1000, 'rate_limit');
  }

  async getRateLimit(key: string): Promise<{ count: number; resetTime: number } | null> {
    return await this.get<{ count: number; resetTime: number }>(`rate_limit:${key}`);
  }

  async setConversation(conversationId: string, conversation: any, userId?: string): Promise<void> {
    await this.set(`conversation:${conversationId}`, conversation, 10 * 60 * 1000, 'conversation', userId);
  }

  async getConversation<T>(conversationId: string): Promise<T | null> {
    return await this.get<T>(`conversation:${conversationId}`);
  }

  async initializeCacheTable(): Promise<void> {
    console.log('[CacheServiceFallback] Using fallback cache (no Supabase table)');
  }
}

export const cacheServiceFallback = new CacheServiceFallback();

// Auto-cleanup every 5 minutes
setInterval(() => {
  cacheServiceFallback.cleanup();
}, 5 * 60 * 1000);
