import { unifiedUsageService } from './unifiedUsageService';
import { supabaseDataService } from './supabaseDataService';
import { supabase } from './supabase';

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
    // Clear any invalid cache entries on startup
    this.clearInvalidCacheEntries();
  }

  public static getInstance(): DailyNewsCacheService {
    if (!DailyNewsCacheService.instance) {
      DailyNewsCacheService.instance = new DailyNewsCacheService();
    }
    return DailyNewsCacheService.instance;
  }

  /**
   * Check if we need to make a grounding search call for this prompt
   * For suggested prompts: ANY user can trigger search if no cache exists
   */
  public async needsGroundingSearch(prompt: string, userTier: string): Promise<{ needsSearch: boolean; reason: string; canUseFreeWindow: boolean }> {
    const promptKey = this.getPromptKey(prompt);
    const cached = this.cache[promptKey];
    
    // If we have valid cache, no search needed
    if (cached && cached.timestamp && !isNaN(cached.timestamp) && !this.isExpired(cached.timestamp)) {
      return { 
        needsSearch: false, 
        reason: `Serving cached response (age: ${this.getAgeInHours(cached.timestamp)}h)`,
        canUseFreeWindow: false
      };
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

    // For suggested prompts: ANY user can trigger search if no cache exists
    // This implements the "first user triggers search, response cached for 24h" logic
    return { 
      needsSearch: true, 
      reason: 'No cache found - any user can trigger search for suggested prompts',
      canUseFreeWindow: false
    };
  }

  /**
   * Check if we're in a free user window for a specific prompt
   */
  public async isInFreeUserWindow(promptKey: string): Promise<boolean> {
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
   * This prevents API calls from being made too frequently (1-day period)
   */
  private async hasRecentSimilarContent(promptKey: string): Promise<boolean> {
    try {
      // Get cache history from Supabase
      const historyData = await supabaseDataService.getAppCache(`cacheHistory_${promptKey}`);
      if (historyData && historyData.cacheData && historyData.cacheData.history) {
        const history: CacheHistoryEntry[] = historyData.cacheData.history;
        const now = Date.now();
        const oneDayAgo = now - (1 * 24 * 60 * 60 * 1000); // 1 day
        
        // Check for content from the last 1 day to prevent API calls
        const recentContent = history.filter(entry => entry.timestamp > oneDayAgo);
        
        if (recentContent.length > 0) {
          console.log(`📰 Found ${recentContent.length} recent cache entries for ${promptKey} - avoiding API repetition (1-day period)`);
          return true;
        }
      }
    } catch (error) {
      console.warn('Failed to check cache history from Supabase:', error);
    }
    return false;
  }

  /**
   * Get recent news content history to help AI avoid repeating stories
   * This provides content context for AI to generate fresh news (15-day period)
   */
  public async getRecentNewsContext(promptKey: string): Promise<string> {
    try {
      const historyData = await supabaseDataService.getAppCache(`cacheHistory_${promptKey}`);
      if (historyData && historyData.cacheData && historyData.cacheData.history) {
        const history: CacheHistoryEntry[] = historyData.cacheData.history;
        const now = Date.now();
        const fifteenDaysAgo = now - (15 * 24 * 60 * 60 * 1000); // 15 days
        
        // Get content from the last 15 days to avoid story repetition
        const recentStories = history.filter(entry => entry.timestamp > fifteenDaysAgo);
        
        if (recentStories.length > 0) {
          console.log(`📰 Found ${recentStories.length} recent stories for ${promptKey} - providing context to avoid repetition (15-day period)`);
          
          // Extract key story elements to help AI avoid repetition
          const storyContext = recentStories.map(entry => {
            // Extract game names, events, and key details from previous content
            const content = entry.content.toLowerCase();
            const games = this.extractGameNames(content);
            const events = this.extractEvents(content);
            return {
              date: entry.date,
              games: games,
              events: events
            };
          });
          
          return JSON.stringify(storyContext);
        }
      }
    } catch (error) {
      console.warn('Failed to get recent news context from Supabase:', error);
    }
    return '';
  }

  /**
   * Extract game names from content to help avoid repetition
   */
  private extractGameNames(content: string): string[] {
    // Simple extraction - in production, consider using NLP or more sophisticated parsing
    const gamePatterns = [
      /(?:game|title|release):\s*([A-Za-z0-9\s]+?)(?:\s|\.|,|$)/gi,
      /(?:announced|revealed|launched)\s+([A-Za-z0-9\s]+?)(?:\s|\.|,|$)/gi
    ];
    
    const games: string[] = [];
    gamePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const gameName = match.replace(/(?:game|title|release|announced|revealed|launched):?\s*/gi, '').trim();
          if (gameName && gameName.length > 2) {
            games.push(gameName);
          }
        });
      }
    });
    
    return [...new Set(games)]; // Remove duplicates
  }

  /**
   * Extract events from content to help avoid repetition
   */
  private extractEvents(content: string): string[] {
    // Simple extraction - in production, consider using NLP or more sophisticated parsing
    const eventPatterns = [
      /(?:announcement|reveal|launch|update|patch|dlc|expansion)/gi,
      /(?:conference|showcase|event|presentation)/gi
    ];
    
    const events: string[] = [];
    eventPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (match && match.length > 2) {
            events.push(match.toLowerCase());
          }
        });
      }
    });
    
    return [...new Set(events)]; // Remove duplicates
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

    // Validate timestamp
    if (!cached.timestamp || isNaN(cached.timestamp)) {
      console.warn(`📰 Invalid timestamp in cache for: ${prompt}, removing entry`);
      this.removeFromCache(promptKey);
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
    if (!timestamp || isNaN(timestamp)) {
      console.warn('Invalid timestamp provided to getAgeInHours:', timestamp);
      return 0;
    }
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
      // Only attempt to load from Supabase if user is authenticated or in developer mode
      const isDeveloperMode = localStorage.getItem('otakon_developer_mode') === 'true';
      const authMethod = localStorage.getItem('otakonAuthMethod');
      const isDeveloperAuth = authMethod === 'skip';
      
      // Check if we have a user session
      const { data: { user } } = await supabase.auth.getUser();
      const isAuthenticated = !!user;
      
      if (!isAuthenticated && !isDeveloperMode && !isDeveloperAuth) {
        // User not authenticated and not in developer mode, skip Supabase loading
        return;
      }
      
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
   * Clear invalid cache entries (for debugging)
   */
  public clearInvalidCacheEntries(): void {
    const invalidKeys: string[] = [];
    
    Object.entries(this.cache).forEach(([key, cached]) => {
      if (!cached.timestamp || isNaN(cached.timestamp)) {
        invalidKeys.push(key);
      }
    });
    
    if (invalidKeys.length > 0) {
      console.log(`📰 Clearing ${invalidKeys.length} invalid cache entries:`, invalidKeys);
      invalidKeys.forEach(key => {
        delete this.cache[key];
      });
      this.saveCacheToStorage();
    } else {
      console.log('📰 No invalid cache entries found');
    }
  }

  /**
   * Get cache status for monitoring
   */
  public getCacheStatus(): { [key: string]: { hasCache: boolean; age: string; source: string; triggeredBy: string; freeUserWindowActive?: boolean; freeWindowStatus?: string } } {
    const status: { [key: string]: { hasCache: boolean; age: string; source: string; triggeredBy: string; freeUserWindowActive?: boolean; freeWindowStatus?: string } } = {};
    
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