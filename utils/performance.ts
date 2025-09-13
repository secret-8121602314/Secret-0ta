/**
 * ⚡ Performance Utilities
 * 
 * This file provides utilities for performance optimization,
 * bundle analysis, and resource management.
 */

// ===== PERFORMANCE METRICS =====

export const performanceMetrics = {
  // Core Web Vitals thresholds
  webVitals: {
    LCP: 2.5, // Largest Contentful Paint (seconds)
    FID: 100, // First Input Delay (milliseconds)
    CLS: 0.1, // Cumulative Layout Shift
    FCP: 1.8, // First Contentful Paint (seconds)
    TTFB: 0.8, // Time to First Byte (seconds)
  },
  
  // Performance budgets
  budgets: {
    bundle: {
      js: 250, // KB
      css: 50, // KB
      images: 1000, // KB
    },
    network: {
      requests: 50,
      totalSize: 2000, // KB
    },
  },
} as const;

// ===== BUNDLE ANALYSIS =====

export const bundleAnalysis = {
  // Analyze bundle size
  analyzeBundle: (bundleData: any) => {
    const analysis = {
      totalSize: 0,
      jsSize: 0,
      cssSize: 0,
      imageSize: 0,
      chunks: [] as any[],
      warnings: [] as string[],
    };

    if (bundleData.assets) {
      bundleData.assets.forEach((asset: any) => {
        const size = asset.size || 0;
        analysis.totalSize += size;

        if (asset.name.endsWith('.js')) {
          analysis.jsSize += size;
        } else if (asset.name.endsWith('.css')) {
          analysis.cssSize += size;
        } else if (asset.name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
          analysis.imageSize += size;
        }

        analysis.chunks.push({
          name: asset.name,
          size: size,
          type: asset.name.split('.').pop(),
        });
      });
    }

    // Check against budgets
    if (analysis.jsSize > performanceMetrics.budgets.bundle.js * 1024) {
      analysis.warnings.push(`JavaScript bundle size (${(analysis.jsSize / 1024).toFixed(1)}KB) exceeds budget (${performanceMetrics.budgets.bundle.js}KB)`);
    }

    if (analysis.cssSize > performanceMetrics.budgets.bundle.css * 1024) {
      analysis.warnings.push(`CSS bundle size (${(analysis.cssSize / 1024).toFixed(1)}KB) exceeds budget (${performanceMetrics.budgets.bundle.css}KB)`);
    }

    if (analysis.imageSize > performanceMetrics.budgets.bundle.images * 1024) {
      analysis.warnings.push(`Image bundle size (${(analysis.imageSize / 1024).toFixed(1)}KB) exceeds budget (${performanceMetrics.budgets.bundle.images}KB)`);
    }

    return analysis;
  },

  // Get bundle recommendations
  getRecommendations: (analysis: any) => {
    const recommendations: any[] = [];

    if (analysis.jsSize > performanceMetrics.budgets.bundle.js * 1024) {
      recommendations.push({
        type: 'warning',
        category: 'bundle',
        message: 'Consider code splitting and lazy loading to reduce JavaScript bundle size',
        impact: 'high',
      });
    }

    if (analysis.cssSize > performanceMetrics.budgets.bundle.css * 1024) {
      recommendations.push({
        type: 'warning',
        category: 'bundle',
        message: 'Consider CSS optimization and purging unused styles',
        impact: 'medium',
      });
    }

    if (analysis.imageSize > performanceMetrics.budgets.bundle.images * 1024) {
      recommendations.push({
        type: 'warning',
        category: 'bundle',
        message: 'Consider image optimization and lazy loading',
        impact: 'high',
      });
    }

    // Check for large chunks
    const largeChunks = analysis.chunks.filter((chunk: any) => chunk.size > 100 * 1024);
    if (largeChunks.length > 0) {
      recommendations.push({
        type: 'info',
        category: 'bundle',
        message: `Found ${largeChunks.length} large chunks that could be split`,
        impact: 'medium',
      });
    }

    return recommendations;
  },
};

// ===== IMAGE OPTIMIZATION =====

export const imageOptimization = {
  // Generate responsive image sizes
  generateSizes: (baseWidth: number, baseHeight: number) => {
    const sizes: any[] = [];
    const breakpoints = [320, 640, 768, 1024, 1280, 1536];
    
    breakpoints.forEach(width => {
      if (width <= baseWidth) {
        const height = Math.round((baseHeight * width) / baseWidth);
        sizes.push({ width, height, ratio: width / height });
      }
    });
    
    return sizes;
  },

  // Generate srcset for responsive images
  generateSrcSet: (baseUrl: string, sizes: Array<{ width: number; height: number }>) => {
    return sizes
      .map(size => `${baseUrl}?w=${size.width}&h=${size.height} ${size.width}w`)
      .join(', ');
  },

  // Generate sizes attribute
  generateSizesAttribute: () => {
    return '(max-width: 320px) 320px, (max-width: 640px) 640px, (max-width: 768px) 768px, (max-width: 1024px) 1024px, (max-width: 1280px) 1280px, 1536px';
  },

  // Check if image should be lazy loaded
  shouldLazyLoad: (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    return rect.top > viewportHeight;
  },

  // Preload critical images
  preloadImage: (src: string, as: 'image' | 'image/webp' = 'image') => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = as;
    link.href = src;
    document.head.appendChild(link);
  },
};

// ===== LAZY LOADING =====

export const lazyLoading = {
  // Intersection Observer for lazy loading
  createObserver: (callback: (entries: IntersectionObserverEntry[]) => void, options?: IntersectionObserverInit) => {
    const defaultOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
    };

    return new IntersectionObserver(callback, { ...defaultOptions, ...options });
  },

  // Lazy load images
  lazyLoadImages: (container: HTMLElement) => {
    const images = container.querySelectorAll('img[data-src]');
    const observer = lazyLoading.createObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => observer.observe(img));
    return observer;
  },

  // Lazy load components
  lazyLoadComponents: (container: HTMLElement) => {
    const components = container.querySelectorAll('[data-lazy-component]');
    const observer = lazyLoading.createObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          const componentName = element.dataset.lazyComponent;
          if (componentName) {
            // Trigger component loading
            element.dispatchEvent(new CustomEvent('lazy-load', { detail: { componentName } }));
            observer.unobserve(element);
          }
        }
      });
    });

    components.forEach(component => observer.observe(component));
    return observer;
  },
};

// ===== MEMORY MANAGEMENT =====

export const memoryManagement = {
  // Clean up event listeners
  cleanupEventListeners: (element: HTMLElement, events: string[]) => {
    events.forEach(event => {
      element.removeEventListener(event, () => {});
    });
  },

  // Clean up observers
  cleanupObservers: (observers: IntersectionObserver[]) => {
    observers.forEach(observer => observer.disconnect());
  },

  // Clean up timers
  cleanupTimers: (timers: NodeJS.Timeout[]) => {
    timers.forEach(timer => clearTimeout(timer));
  },

  // Memory usage monitoring
  getMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      };
    }
    return null;
  },
};

// ===== PERFORMANCE MONITORING =====

export const performanceMonitoring = {
  // Measure performance
  measure: (name: string, fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    const duration = end - start;
    
    console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    return duration;
  },

  // Measure async performance
  measureAsync: async (name: string, fn: () => Promise<any>) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;
    
    console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    return { result, duration };
  },

  // Get Core Web Vitals
  getWebVitals: () => {
    return new Promise((resolve) => {
      const vitals: any = {};
      let resolved = false;

      // LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.LCP = lastEntry.startTime;
        if (resolved) resolve(vitals);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FID
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const firstInputEntry = entry as any;
          vitals.FID = (firstInputEntry.processingStart || firstInputEntry.startTime) - entry.startTime;
        });
        if (resolved) resolve(vitals);
      }).observe({ entryTypes: ['first-input'] });

      // CLS
      new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        vitals.CLS = clsValue;
        if (resolved) resolve(vitals);
      }).observe({ entryTypes: ['layout-shift'] });

      // FCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            vitals.FCP = entry.startTime;
          }
        });
        if (resolved) resolve(vitals);
      }).observe({ entryTypes: ['paint'] });

      // Resolve after a delay
      setTimeout(() => {
        resolved = true;
        resolve(vitals);
      }, 5000);
    });
  },
};

// ===== RESOURCE HINTS =====

export const resourceHints = {
  // Preload resource
  preload: (href: string, as: string, crossorigin?: boolean) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (crossorigin) link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  },

  // Prefetch resource
  prefetch: (href: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  },

  // Preconnect to domain
  preconnect: (href: string, crossorigin?: boolean) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    if (crossorigin) link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  },

  // DNS prefetch
  dnsPrefetch: (href: string) => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = href;
    document.head.appendChild(link);
  },
};

// ===== PERFORMANCE OPTIMIZATION =====

export const optimization = {
  // Debounce function
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Memoize function
  memoize: <T extends (...args: any[]) => any>(func: T): T => {
    const cache = new Map();
    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = func(...args);
      cache.set(key, result);
      return result;
    }) as T;
  },

  // Batch DOM updates
  batchUpdates: (updates: (() => void)[]) => {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  },
};

export default {
  performanceMetrics,
  bundleAnalysis,
  imageOptimization,
  lazyLoading,
  memoryManagement,
  performanceMonitoring,
  resourceHints,
  optimization,
};
