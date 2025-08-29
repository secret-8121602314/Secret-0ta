import { globalContentCache } from './globalContentCache';
import { offlineStorageService } from './offlineStorageService';

export interface CacheStrategy {
  name: string;
  priority: number;
  ttl: number;
  maxSize: number;
  invalidationRules: CacheInvalidationRule[];
}

export interface CacheInvalidationRule {
  type: 'time' | 'dependency' | 'user_action' | 'network_condition';
  condition: any;
  action: 'invalidate' | 'refresh' | 'degrade';
}

export interface CachePrediction {
  key: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  estimatedAccessTime: number;
  dependencies: string[];
}

export interface CachePerformanceMetrics {
  hitRate: number;
  missRate: number;
  averageResponseTime: number;
  memoryUsage: number;
  storageUsage: number;
  lastUpdated: Date;
}

export interface AdaptiveCacheConfig {
  enablePrediction: boolean;
  enableMultiTier: boolean;
  enableSmartInvalidation: boolean;
  enablePerformanceMonitoring: boolean;
  maxMemoryCacheSize: number;
  maxStorageCacheSize: number;
  predictionConfidenceThreshold: number;
}

class AdvancedCacheService {
  private static instance: AdvancedCacheService;
  private memoryCache: Map<string, any> = new Map();
  private cacheStrategies: Map<string, CacheStrategy> = new Map();
  private performanceMetrics: CachePerformanceMetrics = {
    hitRate: 0,
    missRate: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
    storageUsage: 0,
    lastUpdated: new Date()
  };
  private predictionEngine: CachePredictionEngine;
  private multiTierManager: MultiTierCacheManager;
  private smartInvalidator: SmartCacheInvalidator;
  private performanceMonitor: CachePerformanceMonitor;

  private constructor() {
    this.predictionEngine = new CachePredictionEngine();
    this.multiTierManager = new MultiTierCacheManager();
    this.smartInvalidator = new SmartCacheInvalidator();
    this.performanceMonitor = new CachePerformanceMonitor();
    
    this.initializeDefaultStrategies();
    this.startPerformanceMonitoring();
  }

  static getInstance(): AdvancedCacheService {
    if (!AdvancedCacheService.instance) {
      AdvancedCacheService.instance = new AdvancedCacheService();
    }
    return AdvancedCacheService.instance;
  }

  // ===== CACHE STRATEGIES =====

  private initializeDefaultStrategies(): void {
    // High-priority content (user preferences, settings)
    this.addCacheStrategy({
      name: 'user_preferences',
      priority: 1,
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 10 * 1024 * 1024, // 10MB
      invalidationRules: [
        { type: 'user_action', condition: 'preference_change', action: 'invalidate' },
        { type: 'time', condition: 24 * 60 * 60 * 1000, action: 'refresh' }
      ]
    });

    // Medium-priority content (conversations, insights)
    this.addCacheStrategy({
      name: 'conversations',
      priority: 2,
      ttl: 6 * 60 * 60 * 1000, // 6 hours
      maxSize: 50 * 1024 * 1024, // 50MB
      invalidationRules: [
        { type: 'dependency', condition: 'new_message', action: 'refresh' },
        { type: 'time', condition: 6 * 60 * 60 * 1000, action: 'refresh' }
      ]
    });

    // Low-priority content (suggestions, news)
    this.addCacheStrategy({
      name: 'suggestions',
      priority: 3,
      ttl: 2 * 60 * 60 * 1000, // 2 hours
      maxSize: 20 * 1024 * 1024, // 20MB
      invalidationRules: [
        { type: 'time', condition: 2 * 60 * 60 * 1000, action: 'refresh' },
        { type: 'network_condition', condition: 'slow_connection', action: 'degrade' }
      ]
    });
  }

  addCacheStrategy(strategy: CacheStrategy): void {
    this.cacheStrategies.set(strategy.name, strategy);
  }

  // ===== INTELLIGENT CACHING =====

  async get<T>(key: string, strategy: string = 'default'): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      // Check memory cache first (fastest)
      const memoryResult = this.memoryCache.get(key);
      if (memoryResult && this.isValid(memoryResult, strategy)) {
        this.performanceMonitor.recordHit('memory', Date.now() - startTime);
        return memoryResult.value;
      }

      // Check IndexedDB cache
      const storageResult = await this.multiTierManager.getFromStorage(key);
      if (storageResult && this.isValid(storageResult, strategy)) {
        // Promote to memory cache
        this.memoryCache.set(key, storageResult);
        this.performanceMonitor.recordHit('storage', Date.now() - startTime);
        return storageResult.value;
      }

      // Check global content cache
      const globalResult = await globalContentCache.getCachedContent(key);
      if (globalResult) {
        const cacheEntry = {
          value: globalResult,
          timestamp: Date.now(),
          strategy,
          accessCount: 1
        };
        
        // Store in both memory and storage
        this.memoryCache.set(key, cacheEntry);
        await this.multiTierManager.storeInStorage(key, cacheEntry, strategy);
        
        this.performanceMonitor.recordHit('global', Date.now() - startTime);
        return globalResult;
      }

      this.performanceMonitor.recordMiss(Date.now() - startTime);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.performanceMonitor.recordError(error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  async set<T>(key: string, value: T, strategy: string = 'default'): Promise<void> {
    try {
      const cacheEntry = {
        value,
        timestamp: Date.now(),
        strategy,
        accessCount: 1
      };

      // Store in memory cache
      this.memoryCache.set(key, cacheEntry);

      // Store in IndexedDB
      await this.multiTierManager.storeInStorage(key, cacheEntry, strategy);

      // Update global content cache if applicable
      if (strategy === 'suggestions' || strategy === 'news') {
        // Note: GlobalContentCache doesn't have a public update method
        // Content will be updated through the normal cache flow
        console.log(`📝 Cache update for ${strategy}: ${key}`);
      }

      // Trigger prediction for related content
      this.predictionEngine.analyzeAccess(key, strategy);
      
      // Check cache size limits
      this.enforceCacheLimits(strategy);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // ===== CACHE VALIDATION =====

  private isValid(cacheEntry: any, strategy: string): boolean {
    const strategyConfig = this.cacheStrategies.get(strategy);
    if (!strategyConfig) return true;

    const now = Date.now();
    const age = now - cacheEntry.timestamp;

    // Check TTL
    if (age > strategyConfig.ttl) {
      return false;
    }

    // Check invalidation rules
    return !this.smartInvalidator.shouldInvalidate(cacheEntry, strategyConfig);
  }

  // ===== CACHE LIMITS =====

  private enforceCacheLimits(strategy: string): void {
    const strategyConfig = this.cacheStrategies.get(strategy);
    if (!strategyConfig) return;

    // Memory cache size management
    let totalSize = 0;
    const entries = Array.from(this.memoryCache.entries());
    
    for (const [key, entry] of entries) {
      if (entry.strategy === strategy) {
        const entrySize = this.estimateSize(entry);
        totalSize += entrySize;
      }
    }

    if (totalSize > strategyConfig.maxSize) {
      this.evictOldestEntries(strategy, totalSize - strategyConfig.maxSize);
    }
  }

  private estimateSize(entry: any): number {
    // Simple size estimation
    return JSON.stringify(entry).length;
  }

  private evictOldestEntries(strategy: string, bytesToFree: number): void {
    const entries = Array.from(this.memoryCache.entries())
      .filter(([_, entry]) => entry.strategy === strategy)
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    let freedBytes = 0;
    for (const [key, entry] of entries) {
      if (freedBytes >= bytesToFree) break;
      
      freedBytes += this.estimateSize(entry);
      this.memoryCache.delete(key);
    }
  }

  // ===== PREDICTIVE CACHING =====

  async predictAndPrecache(): Promise<void> {
    if (!this.predictionEngine.isEnabled()) return;

    const predictions = await this.predictionEngine.getPredictions();
    
    for (const prediction of predictions) {
      if (prediction.confidence > 0.7) {
        await this.precacheContent(prediction);
      }
    }
  }

  private async precacheContent(prediction: CachePrediction): Promise<void> {
    try {
      // Check if already cached
      const existing = await this.get(prediction.key);
      if (existing) return;

      // Fetch and cache content
      const content = await this.fetchContent(prediction.key);
      if (content) {
        await this.set(prediction.key, content, 'predictive');
      }
    } catch (error) {
      console.warn('Precaching failed for:', prediction.key, error);
    }
  }

  private async fetchContent(key: string): Promise<any> {
    // This would integrate with your existing content services
    // For now, return null to avoid breaking existing functionality
    return null;
  }

  // ===== PERFORMANCE MONITORING =====

  getPerformanceMetrics(): CachePerformanceMetrics {
    return this.performanceMonitor.getMetrics();
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.performanceMonitor.updateMetrics();
    }, 60000); // Update every minute
  }

  // ===== UTILITY METHODS =====

  async clear(): Promise<void> {
    this.memoryCache.clear();
    await this.multiTierManager.clearStorage();
  }

  async clearStrategy(strategy: string): Promise<void> {
    // Clear from memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.strategy === strategy) {
        this.memoryCache.delete(key);
      }
    }

    // Clear from storage
    await this.multiTierManager.clearStrategy(strategy);
  }

  getCacheInfo(): { memorySize: number; storageSize: number; strategies: string[] } {
    return {
      memorySize: this.memoryCache.size,
      storageSize: this.multiTierManager.getStorageSize(),
      strategies: Array.from(this.cacheStrategies.keys())
    };
  }
}

// ===== SUPPORTING CLASSES =====

class CachePredictionEngine {
  private enabled = true;
  private accessPatterns: Map<string, number[]> = new Map();
  private dependencies: Map<string, string[]> = new Map();

  isEnabled(): boolean {
    return this.enabled;
  }

  analyzeAccess(key: string, strategy: string): void {
    const now = Date.now();
    
    if (!this.accessPatterns.has(key)) {
      this.accessPatterns.set(key, []);
    }
    
    this.accessPatterns.get(key)!.push(now);
    
    // Keep only recent accesses (last 24 hours)
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    this.accessPatterns.set(key, this.accessPatterns.get(key)!.filter(time => time > oneDayAgo));
  }

  async getPredictions(): Promise<CachePrediction[]> {
    const predictions: CachePrediction[] = [];
    
    for (const [key, accessTimes] of this.accessPatterns.entries()) {
      if (accessTimes.length < 2) continue;

      const confidence = this.calculateConfidence(accessTimes);
      if (confidence > 0.5) {
        predictions.push({
          key,
          confidence,
          priority: this.calculatePriority(confidence),
          estimatedAccessTime: this.estimateNextAccess(accessTimes),
          dependencies: this.dependencies.get(key) || []
        });
      }
    }

    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  private calculateConfidence(accessTimes: number[]): number {
    if (accessTimes.length < 2) return 0;

    // Calculate time intervals between accesses
    const intervals = [];
    for (let i = 1; i < accessTimes.length; i++) {
      intervals.push(accessTimes[i] - accessTimes[i - 1]);
    }

    // Calculate standard deviation of intervals
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = higher confidence
    return Math.max(0, 1 - (stdDev / mean));
  }

  private calculatePriority(confidence: number): 'high' | 'medium' | 'low' {
    if (confidence > 0.8) return 'high';
    if (confidence > 0.6) return 'medium';
    return 'low';
  }

  private estimateNextAccess(accessTimes: number[]): number {
    if (accessTimes.length < 2) return Date.now() + 60 * 60 * 1000; // 1 hour default

    const recentIntervals = [];
    for (let i = Math.max(1, accessTimes.length - 5); i < accessTimes.length; i++) {
      recentIntervals.push(accessTimes[i] - accessTimes[i - 1]);
    }

    const averageInterval = recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length;
    return Date.now() + averageInterval;
  }
}

class MultiTierCacheManager {
  private storageCache: Map<string, any> = new Map();

  async storeInStorage(key: string, value: any, strategy: string): Promise<void> {
    try {
      // Store in memory storage cache
      this.storageCache.set(key, { value, strategy, timestamp: Date.now() });

      // Store in IndexedDB - using conversation storage for now
      if (typeof value === 'object' && value.id) {
        await offlineStorageService.saveConversation(value as any);
      }
    } catch (error) {
      console.warn('Storage cache failed:', error);
    }
  }

  async getFromStorage(key: string): Promise<any | null> {
    try {
      // Check memory storage cache first
      if (this.storageCache.has(key)) {
        return this.storageCache.get(key);
      }

      // Fallback to IndexedDB - using conversation retrieval for now
      try {
        const conversation = await offlineStorageService.getConversation(key);
        if (conversation) {
          this.storageCache.set(key, { value: conversation, timestamp: Date.now() });
          return { value: conversation, timestamp: Date.now() };
        }
      } catch (error) {
        console.warn('Failed to get conversation from offline storage:', error);
      }

      return null;
    } catch (error) {
      console.warn('Storage cache get failed:', error);
      return null;
    }
  }

  async clearStorage(): Promise<void> {
    this.storageCache.clear();
    try {
      await offlineStorageService.clearOfflineData();
    } catch (error) {
      console.warn('Storage clear failed:', error);
    }
  }

  async clearStrategy(strategy: string): Promise<void> {
    // Clear from memory storage cache
    for (const [key, entry] of this.storageCache.entries()) {
      if (entry.strategy === strategy) {
        this.storageCache.delete(key);
      }
    }
  }

  getStorageSize(): number {
    return this.storageCache.size;
  }
}

class SmartCacheInvalidator {
  shouldInvalidate(cacheEntry: any, strategy: CacheStrategy): boolean {
    for (const rule of strategy.invalidationRules) {
      if (this.evaluateRule(rule, cacheEntry)) {
        return true;
      }
    }
    return false;
  }

  private evaluateRule(rule: CacheInvalidationRule, cacheEntry: any): boolean {
    switch (rule.type) {
      case 'time':
        return Date.now() - cacheEntry.timestamp > rule.condition;
      
      case 'dependency':
        // Check if dependent content has changed
        return this.checkDependencyChange(rule.condition);
      
      case 'user_action':
        // Check if user performed the specified action
        return this.checkUserAction(rule.condition);
      
      case 'network_condition':
        // Check current network conditions
        return this.checkNetworkCondition(rule.condition);
      
      default:
        return false;
    }
  }

  private checkDependencyChange(dependency: string): boolean {
    // Implementation would check if dependent content has changed
    return false;
  }

  private checkUserAction(action: string): boolean {
    // Implementation would check user action history
    return false;
  }

  private checkNetworkCondition(condition: string): boolean {
    // Implementation would check current network status
    return false;
  }
}

class CachePerformanceMonitor {
  private hits: number = 0;
  private misses: number = 0;
  private totalResponseTime: number = 0;
  private responseCount: number = 0;
  private errors: Error[] = [];

  recordHit(cacheType: string, responseTime: number): void {
    this.hits++;
    this.totalResponseTime += responseTime;
    this.responseCount++;
  }

  recordMiss(responseTime: number): void {
    this.misses++;
    this.totalResponseTime += responseTime;
    this.responseCount++;
  }

  recordError(error: Error): void {
    this.errors.push(error);
  }

  getMetrics(): CachePerformanceMetrics {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? this.hits / total : 0;
    const missRate = total > 0 ? this.misses / total : 0;
    const averageResponseTime = this.responseCount > 0 ? this.totalResponseTime / this.responseCount : 0;

    return {
      hitRate,
      missRate,
      averageResponseTime,
      memoryUsage: this.getMemoryUsage(),
      storageUsage: this.getStorageUsage(),
      lastUpdated: new Date()
    };
  }

  updateMetrics(): void {
    // This method is called periodically to update metrics
    // Implementation would gather real-time performance data
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private getStorageUsage(): number {
    // Implementation would check IndexedDB and other storage usage
    return 0;
  }
}

export const advancedCacheService = AdvancedCacheService.getInstance();
