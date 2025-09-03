import { unifiedUsageService } from './unifiedUsageService';

export interface CachedNewsResponse {
  content: string;
  timestamp: number;
  date: string;
  source: 'cached' | 'fresh_grounding';
}

export interface DailyNewsCache {
  [promptKey: string]: CachedNewsResponse;
}

class DailyNewsCacheService {
  private static instance: DailyNewsCacheService;
  private cache: DailyNewsCache = {};
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly PROMPT_KEYS = {
    LATEST_NEWS: 'latest_gaming_news',
    UPCOMING_RELEASES: 'upcoming_releases', 
    LATEST_REVIEWS: 'latest_reviews',
    HOT_TRAILERS: 'hot_trailers'
  };

  private constructor() {
    this.loadCacheFromStorage();
  }

  public static getInstance(): DailyNewsCacheService {
    if (!DailyNewsCacheService.instance) {
      DailyNewsCacheService.instance = new DailyNewsCacheService();
    }
    return DailyNewsCacheService.instance;
  }

  /**
   * Get cached response for a specific prompt, or null if cache is expired
   */
  public getCachedResponse(prompt: string): CachedNewsResponse | null {
    const promptKey = this.getPromptKey(prompt);
    const cached = this.cache[promptKey];
    
    if (!cached) {
      console.log(`📰 No cached response found for: ${prompt}`);
      return null;
    }

    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    
    if (isExpired) {
      console.log(`📰 Cache expired for: ${prompt} (age: ${this.getAgeInHours(cached.timestamp)}h)`);
      this.removeFromCache(promptKey);
      return null;
    }

    console.log(`📰 Serving cached response for: ${prompt} (age: ${this.getAgeInHours(cached.timestamp)}h)`);
    return cached;
  }

  /**
   * Check if we need to make a grounding search call for this prompt
   */
  public needsGroundingSearch(prompt: string): boolean {
    const cached = this.getCachedResponse(prompt);
    return !cached;
  }

  /**
   * Cache a fresh response from grounding search
   */
  public cacheFreshResponse(prompt: string, content: string): void {
    const promptKey = this.getPromptKey(prompt);
    const now = Date.now();
    
    const response: CachedNewsResponse = {
      content,
      timestamp: now,
      date: new Date(now).toISOString().split('T')[0],
      source: 'fresh_grounding'
    };

    this.cache[promptKey] = response;
    this.saveCacheToStorage();
    
    console.log(`📰 Cached fresh grounding response for: ${prompt}`);
    console.log(`📊 Daily cache stats:`, this.getCacheStats());
  }

  /**
   * Get the appropriate prompt key for caching
   */
  private getPromptKey(prompt: string): string {
    if (prompt.includes('latest gaming news')) return this.PROMPT_KEYS.LATEST_NEWS;
    if (prompt.includes('releasing soon')) return this.PROMPT_KEYS.UPCOMING_RELEASES;
    if (prompt.includes('latest game reviews')) return this.PROMPT_KEYS.LATEST_REVIEWS;
    if (prompt.includes('hottest new game trailers')) return this.PROMPT_KEYS.HOT_TRAILERS;
    
    // Fallback for other prompts
    return prompt.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  /**
   * Remove expired cache entry
   */
  private removeFromCache(promptKey: string): void {
    delete this.cache[promptKey];
    this.saveCacheToStorage();
  }

  /**
   * Get cache statistics for monitoring
   */
  public getCacheStats(): { total: number; expired: number; valid: number } {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    Object.values(this.cache).forEach(response => {
      if (Date.now() - response.timestamp > this.CACHE_DURATION) {
        expired++;
      } else {
        valid++;
      }
    });

    return {
      total: Object.keys(this.cache).length,
      expired,
      valid
    };
  }

  /**
   * Get age of cache in hours
   */
  public getAgeInHours(timestamp: number): number {
    return Math.round((Date.now() - timestamp) / (60 * 60 * 1000));
  }

  /**
   * Load cache from localStorage
   */
  private loadCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem('otakon_daily_news_cache');
      if (stored) {
        this.cache = JSON.parse(stored);
        console.log(`📰 Loaded daily news cache:`, this.getCacheStats());
      }
    } catch (error) {
      console.warn('Failed to load daily news cache:', error);
      this.cache = {};
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCacheToStorage(): void {
    try {
      localStorage.setItem('otakon_daily_news_cache', JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save daily news cache:', error);
    }
  }

  /**
   * Clear all cache (for testing/debugging)
   */
  public clearCache(): void {
    this.cache = {};
    this.saveCacheToStorage();
    console.log('📰 Daily news cache cleared');
  }

  /**
   * Get cache status for monitoring
   */
  public getCacheStatus(): { [key: string]: { hasCache: boolean; age: string; source: string } } {
    const status: { [key: string]: { hasCache: boolean; age: string; source: string } } = {};
    
    Object.entries(this.PROMPT_KEYS).forEach(([key, promptKey]) => {
      const cached = this.cache[promptKey];
      if (cached) {
        const age = this.getAgeInHours(cached.timestamp);
        status[key] = {
          hasCache: true,
          age: `${age}h old`,
          source: cached.source
        };
      } else {
        status[key] = {
          hasCache: false,
          age: 'No cache',
          source: 'None'
        };
      }
    });
    
    return status;
  }
}

export const dailyNewsCacheService = DailyNewsCacheService.getInstance();
