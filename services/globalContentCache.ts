/**
 * Global Content Cache Service
 * 
 * Provides caching for global content like game data, user preferences, etc.
 */

export interface CachedContent {
  id: string;
  content: any;
  timestamp: number;
  expiresAt: number;
  version: number;
}

class GlobalContentCacheService {
  private cache: Map<string, CachedContent> = new Map();
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

  set(key: string, content: any, ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now();
    const cachedContent: CachedContent = {
      id: key,
      content,
      timestamp: now,
      expiresAt: now + ttl,
      version: 1,
    };
    
    this.cache.set(key, cachedContent);
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.content;
  }

  has(key: string): boolean {
    const cached = this.cache.get(key);
    return cached ? Date.now() <= cached.expiresAt : false;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  getCachedContent(contentType: string): any | null {
    return this.get(contentType);
  }

  getCacheStats(): { size: number; keys: string[] } {
    return this.getStats();
  }

  async forceRefresh(): Promise<void> {
    this.clear();
  }

  async clearExpiredCache(): Promise<void> {
    const now = Date.now();
    for (const [key, content] of this.cache.entries()) {
      if (now > content.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export const globalContentCache = new GlobalContentCacheService();
