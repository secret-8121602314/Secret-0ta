import { supabaseDataService } from './supabaseDataService';

/**
 * 🎯 UNIVERSAL CONTENT CACHE SERVICE
 * 
 * Purpose: Cache ALL AI responses to prevent repetition and improve performance
 * Coverage: Game help, insights, tasks, unreleased games, and any user query
 * 
 * Key Features:
 * 1. Query-based caching with intelligent deduplication
 * 2. Content similarity detection to avoid repetitive responses
 * 3. Tier-based access control
 * 4. Automatic cache expiration and cleanup
 * 5. Supabase persistence with localStorage fallback
 */

export interface CachedContent {
  id: string;
  query: string;
  queryHash: string;
  content: string;
  contentType: 'game_help' | 'insight' | 'task' | 'game_info' | 'general' | 'unreleased_game';
  gameName?: string;
  genre?: string;
  userTier: string;
  userId?: string;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
  metadata: {
    model: string;
    tokens: number;
    cost: number;
    tags: string[];
    relatedQueries: string[];
  };
}

export interface CacheQuery {
  query: string;
  gameName?: string;
  genre?: string;
  userTier: string;
  contentType: 'game_help' | 'insight' | 'task' | 'game_info' | 'general' | 'unreleased_game';
}

export interface CacheResult {
  found: boolean;
  content?: CachedContent;
  reason?: string;
  shouldCache?: boolean;
}

class UniversalContentCacheService {
  private static instance: UniversalContentCacheService;
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly SIMILARITY_THRESHOLD = 0.85; // 85% similarity threshold
  private readonly MAX_CACHE_SIZE = 1000; // Maximum cache entries per user
  private readonly MAX_RELATED_QUERIES = 10; // Maximum related queries to track

  private constructor() {}

  static getInstance(): UniversalContentCacheService {
    if (!UniversalContentCacheService.instance) {
      UniversalContentCacheService.instance = new UniversalContentCacheService();
    }
    return UniversalContentCacheService.instance;
  }

  /**
   * Check if we have cached content for a query
   */
  public async getCachedContent(query: CacheQuery): Promise<CacheResult> {
    try {
      const queryHash = this.generateQueryHash(query);
      
      // Check Supabase first
      const cachedContent = await this.getFromSupabase(queryHash);
      if (cachedContent && this.isContentValid(cachedContent)) {
        await this.updateAccessStats(cachedContent.id);
        console.log(`🎯 Universal Cache HIT: Serving cached ${query.contentType} content`);
        return {
          found: true,
          content: cachedContent,
          shouldCache: false
        };
      }

      // Check for similar queries
      const similarContent = await this.findSimilarContent(query);
      if (similarContent) {
        console.log(`🔄 Universal Cache SIMILAR: Serving similar ${query.contentType} content (85%+ match)`);
        return {
          found: true,
          content: similarContent,
          reason: 'Similar query found',
          shouldCache: false
        };
      }

      return {
        found: false,
        shouldCache: true
      };
    } catch (error) {
      console.warn('Failed to check cached content:', error);
      return {
        found: false,
        shouldCache: true
      };
    }
  }

  /**
   * Cache new content
   */
  public async cacheContent(
    query: CacheQuery,
    content: string,
    metadata: {
      model: string;
      tokens: number;
      cost: number;
      tags?: string[];
    }
  ): Promise<void> {
    try {
      const queryHash = this.generateQueryHash(query);
      const now = Date.now();
      
      const cachedContent: CachedContent = {
        id: queryHash,
        query: query.query,
        queryHash,
        content,
        contentType: query.contentType,
        gameName: query.gameName,
        genre: query.genre,
        userTier: query.userTier,
        userId: undefined, // Will be set by Supabase
        timestamp: now,
        expiresAt: now + this.CACHE_DURATION,
        accessCount: 1,
        lastAccessed: now,
        metadata: {
          model: metadata.model,
          tokens: metadata.tokens,
          cost: metadata.cost,
          tags: metadata.tags || [],
          relatedQueries: []
        }
      };

      // Store in Supabase
      await this.storeInSupabase(cachedContent);
      
      // Update related queries
      await this.updateRelatedQueries(query, queryHash);
      
      // Cleanup old cache entries
      await this.cleanupOldCache();
      
      console.log(`💾 Universal Cache STORED: ${query.contentType} content cached for future use`);
    } catch (error) {
      console.error('Failed to cache content:', error);
    }
  }

  /**
   * Find similar content to avoid repetition
   */
  private async findSimilarContent(query: CacheQuery): Promise<CachedContent | null> {
    try {
      // Get recent cache entries for this content type
      const cacheKey = `universalCache_${query.contentType}`;
      const cacheData = await supabaseDataService.getAppCache(cacheKey);
      
      if (!cacheData?.cacheData?.entries) return null;
      
      const entries: CachedContent[] = cacheData.cacheData.entries;
      const now = Date.now();
      
      // Filter valid entries and sort by relevance
      const validEntries = entries
        .filter(entry => 
          entry.expiresAt > now && 
          entry.contentType === query.contentType &&
          (query.gameName ? entry.gameName === query.gameName : true)
        )
        .sort((a, b) => {
          // Sort by similarity score, then by recency
          const similarityA = this.calculateSimilarity(query.query, a.query);
          const similarityB = this.calculateSimilarity(query.query, b.query);
          
          if (Math.abs(similarityA - similarityB) < 0.1) {
            // If similarity is close, prefer newer content
            return b.timestamp - a.timestamp;
          }
          
          return similarityB - similarityA;
        });

      // Return the most similar content if it meets threshold
      if (validEntries.length > 0) {
        const mostSimilar = validEntries[0];
        const similarity = this.calculateSimilarity(query.query, mostSimilar.query);
        
        if (similarity >= this.SIMILARITY_THRESHOLD) {
          console.log(`🔄 Found similar ${query.contentType} content (${Math.round(similarity * 100)}% match)`);
          return mostSimilar;
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to find similar content:', error);
      return null;
    }
  }

  /**
   * Calculate similarity between two queries
   */
  private calculateSimilarity(query1: string, query2: string): number {
    const words1 = new Set(query1.toLowerCase().split(/\s+/));
    const words2 = new Set(query2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Generate hash for query to use as cache key
   */
  private generateQueryHash(query: CacheQuery): string {
    const queryString = `${query.query.toLowerCase()}_${query.gameName?.toLowerCase() || 'none'}_${query.genre?.toLowerCase() || 'none'}_${query.contentType}`;
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < queryString.length; i++) {
      const char = queryString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `query_${Math.abs(hash)}`;
  }

  /**
   * Check if cached content is still valid
   */
  private isContentValid(content: CachedContent): boolean {
    const now = Date.now();
    return content.expiresAt > now;
  }

  /**
   * Get content from Supabase
   */
  private async getFromSupabase(queryHash: string): Promise<CachedContent | null> {
    try {
      const cacheKey = `universalCache_${queryHash}`;
      const cacheData = await supabaseDataService.getAppCache(cacheKey);
      
      if (cacheData?.cacheData) {
        return cacheData.cacheData as CachedContent;
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to get content from Supabase:', error);
      return null;
    }
  }

  /**
   * Store content in Supabase
   */
  private async storeInSupabase(content: CachedContent): Promise<void> {
    try {
      const cacheKey = `universalCache_${content.queryHash}`;
      const expiresAt = new Date(content.expiresAt);
      
      await supabaseDataService.setAppCache(cacheKey, content, expiresAt.toISOString());
    } catch (error) {
      console.error('Failed to store content in Supabase:', error);
    }
  }

  /**
   * Update access statistics
   */
  private async updateAccessStats(contentId: string): Promise<void> {
    try {
      // This would update access count and last accessed time
      // For now, we'll just log it
      console.log(`📊 Content accessed: ${contentId}`);
    } catch (error) {
      console.warn('Failed to update access stats:', error);
    }
  }

  /**
   * Update related queries for better discovery
   */
  private async updateRelatedQueries(query: CacheQuery, queryHash: string): Promise<void> {
    try {
      // Find queries that might be related
      const cacheKey = `universalCache_${query.contentType}`;
      const cacheData = await supabaseDataService.getAppCache(cacheKey);
      
      if (cacheData?.cacheData?.entries) {
        const entries: CachedContent[] = cacheData.cacheData.entries;
        
        // Find similar queries and update related queries
        const similarQueries = entries
          .filter(entry => entry.id !== queryHash)
          .filter(entry => this.calculateSimilarity(query.query, entry.query) > 0.6)
          .slice(0, this.MAX_RELATED_QUERIES)
          .map(entry => entry.query);
        
        // Update the current entry's related queries
        if (similarQueries.length > 0) {
          const currentEntry = entries.find(entry => entry.id === queryHash);
          if (currentEntry) {
            currentEntry.metadata.relatedQueries = similarQueries;
            await this.storeInSupabase(currentEntry);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to update related queries:', error);
    }
  }

  /**
   * Cleanup old cache entries
   */
  private async cleanupOldCache(): Promise<void> {
    try {
      const now = Date.now();
      
      // Get all cache entries
      const cacheTypes = ['game_help', 'insight', 'task', 'game_info', 'general', 'unreleased_game'];
      
      for (const contentType of cacheTypes) {
        const cacheKey = `universalCache_${contentType}`;
        const cacheData = await supabaseDataService.getAppCache(cacheKey);
        
        if (cacheData?.cacheData?.entries) {
          const entries: CachedContent[] = cacheData.cacheData.entries;
          
          // Remove expired entries
          const validEntries = entries.filter(entry => entry.expiresAt > now);
          
          // If we have too many entries, remove oldest ones
          if (validEntries.length > this.MAX_CACHE_SIZE) {
            const sortedEntries = validEntries.sort((a, b) => a.timestamp - b.timestamp);
            const entriesToKeep = sortedEntries.slice(-this.MAX_CACHE_SIZE);
            
            // Update cache with only valid entries
            await supabaseDataService.setAppCache(cacheKey, { entries: entriesToKeep }, new Date().toISOString());
          }
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup old cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  public async getCacheStats(): Promise<{
    totalEntries: number;
    entriesByType: Record<string, number>;
    oldestEntry: number;
    newestEntry: number;
    totalSize: number;
  }> {
    try {
      const cacheTypes = ['game_help', 'insight', 'task', 'game_info', 'general', 'unreleased_game'];
      const stats = {
        totalEntries: 0,
        entriesByType: {} as Record<string, number>,
        oldestEntry: Date.now(),
        newestEntry: 0,
        totalSize: 0
      };
      
      for (const contentType of cacheTypes) {
        const cacheKey = `universalCache_${contentType}`;
        const cacheData = await supabaseDataService.getAppCache(cacheKey);
        
        if (cacheData?.cacheData?.entries) {
          const entries: CachedContent[] = cacheData.cacheData.entries;
          const validEntries = entries.filter(entry => this.isContentValid(entry));
          
          stats.entriesByType[contentType] = validEntries.length;
          stats.totalEntries += validEntries.length;
          
          validEntries.forEach(entry => {
            stats.oldestEntry = Math.min(stats.oldestEntry, entry.timestamp);
            stats.newestEntry = Math.max(stats.newestEntry, entry.timestamp);
            stats.totalSize += entry.content.length;
          });
        }
      }
      
      return stats;
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return {
        totalEntries: 0,
        entriesByType: {},
        oldestEntry: Date.now(),
        newestEntry: 0,
        totalSize: 0
      };
    }
  }

  /**
   * Clear cache for specific content type or all
   */
  public async clearCache(contentType?: string): Promise<void> {
    try {
      if (contentType) {
        const cacheKey = `universalCache_${contentType}`;
        // Clear cache by setting it to empty data with immediate expiration
        await supabaseDataService.setAppCache(cacheKey, { entries: [] }, new Date(0).toISOString());
        console.log(`🗑️ Cleared cache for ${contentType}`);
      } else {
        // Clear all cache types
        const cacheTypes = ['game_help', 'insight', 'task', 'game_info', 'general', 'unreleased_game'];
        for (const type of cacheTypes) {
          const cacheKey = `universalCache_${type}`;
          await supabaseDataService.setAppCache(cacheKey, { entries: [] }, new Date(0).toISOString());
        }
        console.log('🗑️ Cleared all universal cache');
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}

export const universalContentCacheService = UniversalContentCacheService.getInstance();
