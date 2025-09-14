import { useState, useEffect, useCallback, useRef } from 'react';
import { advancedCacheService, CacheStrategy, CachePerformanceMetrics } from '../services/advancedCacheService';                                                                                                        

export interface UseAdvancedCacheOptions<T> {
  key: string;
  strategy?: string;
  fallbackValue?: T;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enablePrediction?: boolean;
  dependencies?: any[];
}

export interface UseAdvancedCacheResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  expiresAt: Date | null;
  performanceMetrics: CachePerformanceMetrics;
  refresh: () => Promise<void>;
  invalidate: () => Promise<void>;
  update: (value: T) => Promise<void>;
  cacheInfo: {
    memorySize: number;
    storageSize: number;
    strategies: string[];
  };
}

export function useAdvancedCache<T = any>(options: UseAdvancedCacheOptions<T>): UseAdvancedCacheResult<T> {
  const {
    key,
    strategy = 'default',
    fallbackValue = null,
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutes
    enablePrediction = true,
    dependencies = []
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<CachePerformanceMetrics>({
    hitRate: 0,
    missRate: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
    storageUsage: 0,
    lastUpdated: new Date()
  });

  const refreshTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const predictionTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // ===== CACHE OPERATIONS =====

  const loadFromCache = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const startTime = Date.now();
      const cachedData = await advancedCacheService.get<T>(key, strategy);
      
      if (cachedData) {
        setData(cachedData);
        setLastUpdated(new Date());
        
        // Calculate expiration based on strategy
        const strategyConfig = getStrategyConfig(strategy);
        if (strategyConfig) {
          const expiresAtTime = Date.now() + strategyConfig.ttl;
          setExpiresAt(new Date(expiresAtTime));
        }
        
        // Track performance
        const responseTime = Date.now() - startTime;
        console.log(`🚀 Cache HIT for ${key} (${responseTime}ms) - Strategy: ${strategy}`);
      } else {
        setData(fallbackValue);
        setError('No cached data available');
        console.log(`❌ Cache MISS for ${key} - Strategy: ${strategy}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load cached data';
      setError(errorMessage);
      setData(fallbackValue);
      console.error('Cache load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [key, strategy, fallbackValue]);

  const refresh = useCallback(async () => {
    await loadFromCache();
  }, [loadFromCache]);

  const invalidate = useCallback(async () => {
    try {
      await advancedCacheService.clearStrategy(strategy);
      setData(null);
      setLastUpdated(null);
      setExpiresAt(null);
      console.log(`🗑️ Cache invalidated for strategy: ${strategy}`);
    } catch (err) {
      console.error('Cache invalidation error:', err);
    }
  }, [strategy]);

  const update = useCallback(async (value: T) => {
    try {
      await advancedCacheService.set(key, value, strategy);
      setData(value);
      setLastUpdated(new Date());
      
      // Update expiration
      const strategyConfig = getStrategyConfig(strategy);
      if (strategyConfig) {
        const expiresAtTime = Date.now() + strategyConfig.ttl;
        setExpiresAt(new Date(expiresAtTime));
      }
      
      console.log(`💾 Cache updated for ${key} - Strategy: ${strategy}`);
    } catch (err) {
      console.error('Cache update error:', err);
    }
  }, [key, strategy]);

  // ===== PREDICTIVE CACHING =====

  const triggerPrediction = useCallback(async () => {
    if (!enablePrediction) return;

    try {
      await advancedCacheService.predictAndPrecache();
      console.log(`🔮 Predictive caching triggered for ${key}`);
    } catch (err) {
      console.warn('Predictive caching failed:', err);
    }
  }, [key, enablePrediction]);

  // ===== PERFORMANCE MONITORING =====

  const updatePerformanceMetrics = useCallback(() => {
    const metrics = advancedCacheService.getPerformanceMetrics();
    setPerformanceMetrics(metrics);
  }, []);

  // ===== CACHE INFO =====

  const getCacheInfo = useCallback(() => {
    return advancedCacheService.getCacheInfo();
  }, []);

  // ===== EFFECTS =====

  // Initial load
  useEffect(() => {
    loadFromCache();
  }, [loadFromCache]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    refreshTimeoutRef.current = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => {
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, refresh]);

  // Predictive caching
  useEffect(() => {
    if (!enablePrediction) return;

    // Trigger prediction after initial load
    predictionTimeoutRef.current = setTimeout(() => {
      triggerPrediction();
    }, 2000); // 2 seconds delay

    return () => {
      if (predictionTimeoutRef.current) {
        clearTimeout(predictionTimeoutRef.current);
      }
    };
  }, [enablePrediction, triggerPrediction]);

  // Performance monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      updatePerformanceMetrics();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [updatePerformanceMetrics]);

  // Dependencies change
  useEffect(() => {
    if (dependencies.length > 0) {
      refresh();
    }
  }, dependencies);

  // Cleanup
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
      if (predictionTimeoutRef.current) {
        clearTimeout(predictionTimeoutRef.current);
      }
    };
  }, []);

  // ===== UTILITY FUNCTIONS =====

  function getStrategyConfig(strategyName: string): CacheStrategy | null {
    // This would typically come from the cache service
    // For now, return default configs
    const defaultConfigs: Record<string, CacheStrategy> = {
      user_preferences: {
        name: 'user_preferences',
        priority: 1,
        ttl: 24 * 60 * 60 * 1000,
        maxSize: 10 * 1024 * 1024,
        invalidationRules: []
      },
      conversations: {
        name: 'conversations',
        priority: 2,
        ttl: 6 * 60 * 60 * 1000,
        maxSize: 50 * 1024 * 1024,
        invalidationRules: []
      },
      suggestions: {
        name: 'suggestions',
        priority: 3,
        ttl: 2 * 60 * 60 * 1000,
        maxSize: 20 * 1024 * 1024,
        invalidationRules: []
      }
    };

    return defaultConfigs[strategyName] || null;
  }

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    expiresAt,
    performanceMetrics,
    refresh,
    invalidate,
    update,
    cacheInfo: getCacheInfo()
  };
}

// ===== SPECIALIZED HOOKS =====

export function useUserPreferencesCache<T = any>(key: string, fallbackValue?: T) {
  return useAdvancedCache<T>({
    key,
    strategy: 'user_preferences',
    fallbackValue,
    autoRefresh: false,
    enablePrediction: false
  });
}

export function useConversationsCache<T = any>(key: string, fallbackValue?: T) {
  return useAdvancedCache<T>({
    key,
    strategy: 'conversations',
    fallbackValue,
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
    enablePrediction: true
  });
}

export function useSuggestionsCache<T = any>(key: string, fallbackValue?: T) {
  return useAdvancedCache<T>({
    key,
    strategy: 'suggestions',
    fallbackValue,
    autoRefresh: true,
    refreshInterval: 120000, // 2 minutes
    enablePrediction: true
  });
}

export function usePredictiveCache<T = any>(key: string, fallbackValue?: T) {
  return useAdvancedCache<T>({
    key,
    strategy: 'default',
    fallbackValue,
    autoRefresh: false,
    enablePrediction: true
  });
}
