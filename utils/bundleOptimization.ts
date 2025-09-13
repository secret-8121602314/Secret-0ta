/**
 * 📦 Bundle Optimization Utilities
 * 
 * This file provides utilities for bundle optimization,
 * code splitting, and resource management.
 */

import React from 'react';

// ===== CODE SPLITTING =====

export const codeSplitting = {
  // Dynamic import with error handling
  dynamicImport: async <T>(importFn: () => Promise<T>): Promise<T | null> => {
    try {
      const module = await importFn();
      return module;
    } catch (error) {
      console.error('Dynamic import failed:', error);
      return null;
    }
  },

  // Lazy load component with loading state
  lazyLoadComponent: <T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    fallback?: React.ComponentType
  ) => {
    return React.lazy(importFn);
  },

  // Preload component
  preloadComponent: <T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>
  ) => {
    return () => {
      importFn();
      return null;
    };
  },

  // Route-based code splitting
  createRouteChunk: (route: string, importFn: () => Promise<any>) => {
    return {
      route,
      chunk: importFn,
      preload: () => importFn(),
    };
  },
};

// ===== TREE SHAKING =====

export const treeShaking = {
  // Import only what you need
  importOnly: <T>(module: any, keys: (keyof T)[]): Partial<T> => {
    const result: Partial<T> = {};
    keys.forEach(key => {
      if (key in module) {
        result[key] = module[key];
      }
    });
    return result;
  },

  // Conditional imports
  conditionalImport: async <T>(
    condition: boolean,
    importFn: () => Promise<T>,
    fallback?: T
  ): Promise<T | null> => {
    if (condition) {
      try {
        return await importFn();
      } catch (error) {
        console.error('Conditional import failed:', error);
        return fallback || null;
      }
    }
    return fallback || null;
  },
};

// ===== RESOURCE OPTIMIZATION =====

export const resourceOptimization = {
  // Preload critical resources
  preloadCritical: (resources: Array<{ href: string; as: string; crossorigin?: boolean }>) => {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.crossorigin) link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  },

  // Prefetch non-critical resources
  prefetchNonCritical: (resources: string[]) => {
    resources.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    });
  },

  // Load resources on demand
  loadOnDemand: (resource: string, condition: () => boolean) => {
    if (condition()) {
      const script = document.createElement('script');
      script.src = resource;
      script.async = true;
      document.head.appendChild(script);
    }
  },
};

// ===== BUNDLE ANALYSIS =====

export const bundleAnalysis = {
  // Analyze bundle composition
  analyzeComposition: (bundleData: any) => {
    const analysis = {
      totalSize: 0,
      chunks: [] as any[],
      dependencies: [] as any[],
      warnings: [] as string[],
    };

    if (bundleData.assets) {
      bundleData.assets.forEach((asset: any) => {
        const size = asset.size || 0;
        analysis.totalSize += size;

        analysis.chunks.push({
          name: asset.name,
          size: size,
          type: asset.name.split('.').pop(),
          gzipSize: asset.gzipSize || 0,
        });
      });
    }

    if (bundleData.chunks) {
      bundleData.chunks.forEach((chunk: any) => {
        analysis.dependencies.push({
          name: chunk.name,
          size: chunk.size,
          modules: chunk.modules?.length || 0,
        });
      });
    }

    // Check for optimization opportunities
    const largeChunks = analysis.chunks.filter(chunk => chunk.size > 100 * 1024);
    if (largeChunks.length > 0) {
      analysis.warnings.push(`Found ${largeChunks.length} large chunks that could be split`);
    }

    const duplicateModules = analysis.dependencies.filter(dep => dep.modules > 50);
    if (duplicateModules.length > 0) {
      analysis.warnings.push(`Found ${duplicateModules.length} chunks with many modules`);
    }

    return analysis;
  },

  // Get optimization recommendations
  getOptimizationRecommendations: (analysis: any) => {
    const recommendations: any[] = [];

    // Large chunks
    const largeChunks = analysis.chunks.filter((chunk: any) => chunk.size > 100 * 1024);
    if (largeChunks.length > 0) {
      recommendations.push({
        type: 'warning',
        category: 'bundle',
        message: 'Consider splitting large chunks into smaller ones',
        impact: 'high',
        chunks: largeChunks.map((chunk: any) => chunk.name),
      });
    }

    // Unused dependencies
    const unusedDeps = analysis.dependencies.filter((dep: any) => dep.modules === 0);
    if (unusedDeps.length > 0) {
      recommendations.push({
        type: 'info',
        category: 'dependencies',
        message: 'Consider removing unused dependencies',
        impact: 'medium',
        dependencies: unusedDeps.map((dep: any) => dep.name),
      });
    }

    // Gzip optimization
    const uncompressedChunks = analysis.chunks.filter((chunk: any) => chunk.gzipSize === 0);
    if (uncompressedChunks.length > 0) {
      recommendations.push({
        type: 'info',
        category: 'compression',
        message: 'Enable gzip compression for better performance',
        impact: 'medium',
        chunks: uncompressedChunks.map((chunk: any) => chunk.name),
      });
    }

    return recommendations;
  },
};

// ===== CACHING STRATEGIES =====

export const cachingStrategies = {
  // Service Worker caching
  serviceWorkerCache: {
    // Cache first strategy
    cacheFirst: (request: Request, cacheName: string) => {
      return caches.open(cacheName).then(cache => {
        return cache.match(request).then(response => {
          if (response) {
            return response;
          }
          return fetch(request).then(fetchResponse => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      });
    },

    // Network first strategy
    networkFirst: (request: Request, cacheName: string) => {
      return fetch(request).then(response => {
        if (response.ok) {
          caches.open(cacheName).then(cache => {
            cache.put(request, response.clone());
          });
        }
        return response;
      }).catch(() => {
        return caches.open(cacheName).then(cache => {
          return cache.match(request);
        });
      });
    },

    // Stale while revalidate strategy
    staleWhileRevalidate: (request: Request, cacheName: string) => {
      return caches.open(cacheName).then(cache => {
        return cache.match(request).then(response => {
          const fetchPromise = fetch(request).then(fetchResponse => {
            if (fetchResponse.ok) {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          });
          return response || fetchPromise;
        });
      });
    },
  },

  // Browser caching
  browserCache: {
    // Set cache headers
    setCacheHeaders: (response: Response, maxAge: number = 31536000) => {
      response.headers.set('Cache-Control', `public, max-age=${maxAge}`);
      return response;
    },

    // Check if resource is cached
    isCached: (url: string) => {
      return caches.open('browser-cache').then(cache => {
        return cache.match(url);
      });
    },
  },
};

// ===== PERFORMANCE BUDGETS =====

export const performanceBudgets = {
  // Bundle size budgets
  bundle: {
    js: 250, // KB
    css: 50, // KB
    images: 1000, // KB
    fonts: 100, // KB
  },

  // Network budgets
  network: {
    requests: 50,
    totalSize: 2000, // KB
    criticalPath: 1000, // KB
  },

  // Runtime budgets
  runtime: {
    memory: 50, // MB
    cpu: 100, // ms
    render: 16, // ms
  },

  // Check against budgets
  checkBudget: (type: 'bundle' | 'network' | 'runtime', metrics: any) => {
    const budget = performanceBudgets[type];
    const violations = [];

    if (type === 'bundle' && metrics && typeof metrics === 'object') {
      // @ts-ignore - Dynamic property access for bundle metrics
      if (metrics.js && metrics.js > budget.js * 1024) {
        // @ts-ignore
        violations.push(`JavaScript bundle (${(metrics.js / 1024).toFixed(1)}KB) exceeds budget (${budget.js}KB)`);
      }
      // @ts-ignore
      if (metrics.css && metrics.css > budget.css * 1024) {
        // @ts-ignore
        violations.push(`CSS bundle (${(metrics.css / 1024).toFixed(1)}KB) exceeds budget (${budget.css}KB)`);
      }
      // @ts-ignore
      if (metrics.images && metrics.images > budget.images * 1024) {
        // @ts-ignore
        violations.push(`Images (${(metrics.images / 1024).toFixed(1)}KB) exceed budget (${budget.images}KB)`);
      }
    }

    if (type === 'network' && metrics && typeof metrics === 'object') {
      // @ts-ignore - Dynamic property access for network metrics
      if (metrics.requests && metrics.requests > budget.requests) {
        // @ts-ignore
        violations.push(`Network requests (${metrics.requests}) exceed budget (${budget.requests})`);
      }
      // @ts-ignore
      if (metrics.totalSize && metrics.totalSize > budget.totalSize * 1024) {
        // @ts-ignore
        violations.push(`Total size (${(metrics.totalSize / 1024).toFixed(1)}KB) exceeds budget (${budget.totalSize}KB)`);
      }
    }

    if (type === 'runtime' && metrics && typeof metrics === 'object') {
      // @ts-ignore - Dynamic property access for runtime metrics
      if (metrics.memory && metrics.memory > budget.memory * 1024 * 1024) {
        // @ts-ignore
        violations.push(`Memory usage (${(metrics.memory / 1024 / 1024).toFixed(1)}MB) exceeds budget (${budget.memory}MB)`);
      }
      // @ts-ignore
      if (metrics.cpu && metrics.cpu > budget.cpu) {
        // @ts-ignore
        violations.push(`CPU usage (${metrics.cpu}ms) exceeds budget (${budget.cpu}ms)`);
      }
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  },
};

// ===== OPTIMIZATION RECOMMENDATIONS =====

export const optimizationRecommendations = {
  // Get recommendations based on analysis
  getRecommendations: (analysis: any) => {
    const recommendations: any[] = [];

    // Bundle size recommendations
    if (analysis.bundleSize > performanceBudgets.bundle.js * 1024) {
      recommendations.push({
        type: 'warning',
        category: 'bundle',
        message: 'Consider code splitting and lazy loading',
        impact: 'high',
        action: 'Implement dynamic imports for non-critical code',
      });
    }

    // Network recommendations
    if (analysis.networkRequests > performanceBudgets.network.requests) {
      recommendations.push({
        type: 'warning',
        category: 'network',
        message: 'Reduce number of network requests',
        impact: 'high',
        action: 'Combine resources and use HTTP/2',
      });
    }

    // Runtime recommendations
    if (analysis.memoryUsage > performanceBudgets.runtime.memory * 1024 * 1024) {
      recommendations.push({
        type: 'warning',
        category: 'runtime',
        message: 'Optimize memory usage',
        impact: 'medium',
        action: 'Implement proper cleanup and avoid memory leaks',
      });
    }

    return recommendations;
  },
};

export default {
  codeSplitting,
  treeShaking,
  resourceOptimization,
  bundleAnalysis,
  cachingStrategies,
  performanceBudgets,
  optimizationRecommendations,
};
