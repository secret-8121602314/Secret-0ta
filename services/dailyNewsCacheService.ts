import { unifiedUsageService } from './unifiedUsageService';
import { supabaseDataService } from './supabaseDataService';

export interface CachedNewsResponse {
  content: string;
  timestamp: number;
  date: string;
  source: 'cached' | 'fresh_grounding' | 'free_user_window';
  triggeredBy: 'pro' | 'vanguard_pro' | 'free';
  userId?: string;
}

export interface DailyNewsCache {
  [promptKey: string]: CachedNewsResponse;
}

export interface CacheHistoryEntry {
  id: string;
  promptKey: string;
  content: string;
  timestamp: number;
  date: string;
  source: string;
  triggeredBy: string;
  userId?: string;
  contentHash: string; // For deduplication
}

class DailyNewsCacheService {
  private static instance: DailyNewsCacheService;
  private cache: DailyNewsCache = {};
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly FREE_USER_WINDOW_DURATION = 24 * 60 * 60 * 1000; // 24 hours for free user window
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
   * Check if we need to make a grounding search call for this prompt
   * Now considers free user windows and cache history
   */
  public async needsGroundingSearch(prompt: string, userTier: string): Promise<{ needsSearch: boolean; reason: string; canUseFreeWindow: boolean }> {
    const promptKey = this.getPromptKey(prompt);
    const cached = this.cache[promptKey];
    
    // If we have valid cache, no search needed
    if (cached && !this.isExpired(cached.timestamp)) {
      return { 
        needsSearch: false, 
        reason: `Serving cached response (age: ${this.getAgeInHours(cached.timestamp)}h)`,
        canUseFreeWindow: false
      };
    }

    // Check if we're in a free user window for this prompt
    const freeUserWindow = await this.isInFreeUserWindow(promptKey);
    
    if (freeUserWindow) {
      if (userTier === 'free') {
        return { 
          needsSearch: true, 
          reason: 'Free user window active - free user can trigger search',
          canUseFreeWindow: true
        };
      } else {
        return { 
          needsSearch: false, 
          reason: 'Free user window active - waiting for free user to trigger',
          canUseFreeWindow: false
        };
      }
    }

    // Check cache history for recent similar content to avoid repetition
    const hasRecentSimilarContent = await this.hasRecentSimilarContent(promptKey);
    if (hasRecentSimilarContent) {
      return { 
        needsSearch: false, 
        reason: 'Recent similar content found - avoiding repetition',
        canUseFreeWindow: false
      };
    }

    // Pro/Vanguard users can always trigger search if no cache and no free window
    if (userTier === 'pro' || userTier === 'vanguard_pro') {
      return { 
        needsSearch: true, 
        reason: 'No cache, no free window - Pro/Vanguard user can trigger search',
        canUseFreeWindow: false
      };
    }

    // Free users can't trigger search outside of free windows
    return { 
      needsSearch: false, 
      reason: 'No cache, no free window - Free user cannot trigger search',
      canUseFreeWindow: false
    };
  }

  /**
   * Check if we're in a free user window for a specific prompt
   */
  private async isInFreeUserWindow(promptKey: string): Promise<boolean> {
    try {
      const cacheData = await supabaseDataService.getAppCache(`freeUserWindow_${promptKey}`);
      if (cacheData && cacheData.cacheData) {
        const { startTime, endTime } = cacheData.cacheData;
        const now = Date.now();
        return now >= startTime && now <= endTime;
      }
    } catch (error) {
      console.warn('Failed to check free user window from Supabase:', error);
    }
    return false;
  }

  /**
   * Start a free user window for a specific prompt
   */
  public async startFreeUserWindow(promptKey: string): Promise<void> {
    const now = Date.now();
    const windowData = {
      startTime: now,
      endTime: now + this.FREE_USER_WINDOW_DURATION,
      promptKey,
      status: 'active'
    };

    try {
      // Store in Supabase with 24-hour expiration
      const expiresAt = new Date(now + this.FREE_USER_WINDOW_DURATION).toISOString();
      await supabaseDataService.setAppCache(`freeUserWindow_${promptKey}`, windowData, expiresAt);
      
      // Also store in localStorage as backup
      localStorage.setItem(`freeUserWindow_${promptKey}`, JSON.stringify(windowData));
      
      console.log(`🆓 Started free user window for ${promptKey} (expires in 24h)`);
    } catch (error) {
      console.warn('Failed to start free user window in Supabase, using localStorage only:', error);
      localStorage.setItem(`freeUserWindow_${promptKey}`, JSON.stringify(windowData));
    }
  }

  /**
   * Check if content is similar to recent cached content to avoid repetition
   */
  private async hasRecentSimilarContent(promptKey: string): Promise<boolean> {
    try {
      // Get cache history from Supabase
      const historyData = await supabaseDataService.getAppCache(`cacheHistory_${promptKey}`);
      if (historyData && historyData.cacheData && historyData.cacheData.history) {
        const history: CacheHistoryEntry[] = historyData.cacheData.history;
        const now = Date.now();
        const fifteenDaysAgo = now - (15 * 24 * 60 * 60 * 1000); // 15 days
        
        // Check for content from the last 15 days
        const recentContent = history.filter(entry => entry.timestamp > fifteenDaysAgo);
        
        if (recentContent.length > 0) {
          console.log(`📰 Found ${recentContent.length} recent cache entries for ${promptKey} - avoiding repetition (15-day period)`);
          return true;
        }
      }
    } catch (error) {
      console.warn('Failed to check cache history from Supabase:', error);
    }
    return false;
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

    if (this.isExpired(cached.timestamp)) {
      console.log(`📰 Cache expired for: ${prompt} (age: ${this.getAgeInHours(cached.timestamp)}h)`);
      this.removeFromCache(promptKey);
      return null;
    }

    console.log(`📰 Serving cached response for: ${prompt} (age: ${this.getAgeInHours(cached.timestamp)}h)`);
    return cached;
  }

  /**
   * Cache a fresh response from grounding search
   * Now includes user tier tracking and Supabase storage
   */
  public async cacheFreshResponse(
    prompt: string, 
    content: string, 
    userTier: string, 
    userId?: string
  ): Promise<void> {
    const promptKey = this.getPromptKey(prompt);
    const now = Date.now();
    
    // Generate content hash for deduplication
    const contentHash = this.generateContentHash(content);
    
    const response: CachedNewsResponse = {
      content,
      timestamp: now,
      date: new Date(now).toISOString().split('T')[0],
      source: userTier === 'free' ? 'free_user_window' : 'fresh_grounding',
      triggeredBy: userTier as 'pro' | 'vanguard_pro' | 'free',
      userId
    };

    // Store in local cache
    this.cache[promptKey] = response;
    this.saveCacheToStorage();
    
    // Store in Supabase for persistence
    await this.storeInSupabase(promptKey, response, contentHash);
    
    // If this was triggered by a free user, start the free user window
    if (userTier === 'free') {
      await this.startFreeUserWindow(promptKey);
    }
    
    console.log(`📰 Cached fresh response for: ${prompt} (triggered by ${userTier} user)`);
    console.log(`📊 Daily cache stats:`, this.getCacheStats());
  }

  /**
   * Store cache entry in Supabase with history tracking
   */
  private async storeInSupabase(promptKey: string, response: CachedNewsResponse, contentHash: string): Promise<void> {
    try {
      // Create history entry
      const historyEntry: CacheHistoryEntry = {
        id: `${promptKey}_${Date.now()}`,
        promptKey,
        content: response.content,
        timestamp: response.timestamp,
        date: response.date,
        source: response.source,
        triggeredBy: response.triggeredBy,
        userId: response.userId,
        contentHash
      };

      // Get existing history
      const existingHistoryData = await supabaseDataService.getAppCache(`cacheHistory_${promptKey}`);
      let history: CacheHistoryEntry[] = [];
      
      if (existingHistoryData && existingHistoryData.cacheData && existingHistoryData.cacheData.history) {
        history = existingHistoryData.cacheData.history;
      }

      // Add new entry and keep only last 30 entries to prevent bloat
      history.push(historyEntry);
      if (history.length > 30) {
        history = history.slice(-30);
      }

      // Store updated history
      const historyData = { history, lastUpdated: Date.now() };
      const expiresAt = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(); // 30 days
      await supabaseDataService.setAppCache(`cacheHistory_${promptKey}`, historyData, expiresAt);

      // Also store current cache entry
      const cacheData = { ...response, contentHash };
      const cacheExpiresAt = new Date(Date.now() + this.CACHE_DURATION).toISOString();
      await supabaseDataService.setAppCache(`dailyCache_${promptKey}`, cacheData, cacheExpiresAt);

      console.log(`💾 Stored cache entry in Supabase for ${promptKey}`);
    } catch (error) {
      console.warn('Failed to store cache in Supabase:', error);
    }
  }

  /**
   * Generate a hash of content for deduplication
   */
  private generateContentHash(content: string): string {
    // Simple hash function - in production, consider using crypto-js or similar
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if cache is expired
   */
  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.CACHE_DURATION;
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
      if (this.isExpired(response.timestamp)) {
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
   * Load cache from localStorage and Supabase
   */
  private async loadCacheFromStorage(): Promise<void> {
    try {
      // Load from localStorage first
      const stored = localStorage.getItem('otakon_daily_news_cache');
      if (stored) {
        this.cache = JSON.parse(stored);
        console.log(`📰 Loaded daily news cache from localStorage:`, this.getCacheStats());
      }

      // Try to load from Supabase and merge
      await this.loadFromSupabase();
    } catch (error) {
      console.warn('Failed to load daily news cache:', error);
      this.cache = {};
    }
  }

  /**
   * Load cache from Supabase and merge with localStorage
   */
  private async loadFromSupabase(): Promise<void> {
    try {
      for (const promptKey of Object.values(this.PROMPT_KEYS)) {
        const cacheData = await supabaseDataService.getAppCache(`dailyCache_${promptKey}`);
        if (cacheData && cacheData.cacheData && !this.isExpired(cacheData.cacheData.timestamp)) {
          this.cache[promptKey] = cacheData.cacheData;
          console.log(`📰 Loaded ${promptKey} from Supabase cache`);
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from Supabase:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCacheToStorage(): void {
    try {
      localStorage.setItem('otakon_daily_news_cache', JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save daily news cache to localStorage:', error);
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
  public getCacheStatus(): { [key: string]: { hasCache: boolean; age: string; source: string; triggeredBy: string } } {
    const status: { [key: string]: { hasCache: boolean; age: string; source: string; triggeredBy: string } } = {};
    
    Object.entries(this.PROMPT_KEYS).forEach(([key, promptKey]) => {
      const cached = this.cache[promptKey];
      if (cached) {
        const age = this.getAgeInHours(cached.timestamp);
        status[key] = {
          hasCache: true,
          age: `${age}h old`,
          source: cached.source,
          triggeredBy: cached.triggeredBy
        };
      } else {
        status[key] = {
          hasCache: false,
          age: 'No Cache',
          source: 'None',
          triggeredBy: 'None'
        };
      }
    });
    
    return status;
  }

  /**
   * Get detailed cache information including free user windows
   */
  public async getDetailedCacheStatus(): Promise<{ [key: string]: any }> {
    const status = this.getCacheStatus();
    
    // Add free user window information
    for (const [key, promptKey] of Object.entries(this.PROMPT_KEYS)) {
      const inFreeWindow = await this.isInFreeUserWindow(promptKey);
      status[key].freeUserWindowActive = inFreeWindow;
      
      if (inFreeWindow) {
        status[key].freeWindowStatus = '🆓 Free users can trigger search';
      } else {
        status[key].freeWindowStatus = '🔒 Free users cannot trigger search';
      }
    }
    
    return status;
  }
}

export const dailyNewsCacheService = DailyNewsCacheService.getInstance();
