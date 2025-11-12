import { cacheService } from './cacheService';
import { newsPrompts } from '../types';

/**
 * Daily News Cache Service
 * 
 * Caches AI responses for news prompts to reduce API costs and improve response time.
 * News responses are cached for 24 hours and reset daily.
 * 
 * Integration with old build's daily news cache system.
 */
class DailyNewsCacheService {
  private readonly CACHE_PREFIX = 'daily_news_';
  private readonly CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly LAST_GROUNDING_KEY = 'last_grounding_search';
  private readonly GROUNDING_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours for free, can be different for pro

  /**
   * Get cached response for a news prompt
   * Returns null if not cached or expired
   */
  public async getCachedResponse(prompt: string): Promise<string | null> {
    // Only cache responses for the 4 news prompts
    if (!newsPrompts.includes(prompt)) {
      return null;
    }

    const cacheKey = this.getCacheKey(prompt);
    const cached = await cacheService.get<{ content: string; timestamp: number }>(cacheKey);

    if (!cached) {
      console.log('📰 [DailyNewsCache] No cached response for:', prompt);
      return null;
    }

    // Check if cache is still valid (24 hours)
    const now = Date.now();
    const age = now - cached.timestamp;
    
    if (age > this.CACHE_DURATION_MS) {
      console.log('📰 [DailyNewsCache] Cached response expired for:', prompt);
      await cacheService.delete(cacheKey);
      return null;
    }

    console.log('📰 [DailyNewsCache] Serving cached response (age:', Math.floor(age / 1000 / 60), 'minutes)');
    return cached.content;
  }

  /**
   * Cache a fresh response for a news prompt
   */
  public async cacheFreshResponse(
    prompt: string,
    content: string,
    userTier: string,
    userId?: string
  ): Promise<void> {
    // Only cache responses for the 4 news prompts
    if (!newsPrompts.includes(prompt)) {
      return;
    }

    const cacheKey = this.getCacheKey(prompt);
    const cacheData = {
      content,
      timestamp: Date.now(),
      userTier,
      userId
    };

    await cacheService.set(cacheKey, cacheData, this.CACHE_DURATION_MS);
    console.log('📰 [DailyNewsCache] Cached fresh response for:', prompt);

    // Update last grounding search time
    localStorage.setItem(this.LAST_GROUNDING_KEY, Date.now().toString());
  }

  /**
   * Check if grounding search can be triggered
   * Returns { needsSearch: boolean, reason: string }
   */
  public async needsGroundingSearch(
    prompt: string,
    userTier: string
  ): Promise<{ needsSearch: boolean; reason: string }> {
    // Only news prompts use grounding search
    if (!newsPrompts.includes(prompt)) {
      return { needsSearch: false, reason: 'Not a news prompt' };
    }

    // Check if we have a cached response
    const cached = await this.getCachedResponse(prompt);
    if (cached) {
      return { needsSearch: false, reason: 'Cached response available' };
    }

    // Check cooldown based on tier
    const lastGrounding = localStorage.getItem(this.LAST_GROUNDING_KEY);
    if (lastGrounding) {
      const timeSinceLastGrounding = Date.now() - parseInt(lastGrounding);
      const cooldown = this.getGroundingCooldown(userTier);

      if (timeSinceLastGrounding < cooldown) {
        const remainingMinutes = Math.ceil((cooldown - timeSinceLastGrounding) / 1000 / 60);
        return {
          needsSearch: false,
          reason: `Grounding search on cooldown. Try again in ${remainingMinutes} minutes`
        };
      }
    }

    return { needsSearch: true, reason: 'Ready for grounding search' };
  }

  /**
   * Get grounding search cooldown based on user tier
   * Free: 6 hours, Pro/Vanguard: 1 hour
   */
  private getGroundingCooldown(userTier: string): number {
    if (userTier === 'pro' || userTier === 'vanguard_pro') {
      return 1 * 60 * 60 * 1000; // 1 hour
    }
    return this.GROUNDING_COOLDOWN_MS; // 6 hours for free
  }

  /**
   * Generate cache key for a news prompt
   */
  private getCacheKey(prompt: string): string {
    // Create a simple hash of the prompt for the cache key
    const hash = prompt.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `${this.CACHE_PREFIX}${hash}`;
  }

  /**
   * Clear all cached news responses (for testing/debugging)
   */
  public async clearAllCache(): Promise<void> {
    for (const prompt of newsPrompts) {
      const cacheKey = this.getCacheKey(prompt);
      await cacheService.delete(cacheKey);
    }
    localStorage.removeItem(this.LAST_GROUNDING_KEY);
    console.log('📰 [DailyNewsCache] All news cache cleared');
  }

  /**
   * Get cache status for all news prompts
   */
  public async getCacheStatus(): Promise<Array<{ prompt: string; cached: boolean; age?: number }>> {
    const status = [];

    for (const prompt of newsPrompts) {
      const cacheKey = this.getCacheKey(prompt);
      const cached = await cacheService.get<{ content: string; timestamp: number }>(cacheKey);

      if (cached) {
        const age = Date.now() - cached.timestamp;
        status.push({
          prompt,
          cached: true,
          age: Math.floor(age / 1000 / 60) // age in minutes
        });
      } else {
        status.push({
          prompt,
          cached: false
        });
      }
    }

    return status;
  }
}

export const dailyNewsCacheService = new DailyNewsCacheService();

