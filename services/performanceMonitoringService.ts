import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import { supabase } from './supabase';

export interface PerformanceMetrics {
  CLS: number;
  FID: number;
  FCP: number;
  LCP: number;
  TTFB: number;
  timestamp: number;
}

export interface ErrorEvent {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: string;
}

class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: PerformanceMetrics[] = [];
  private errors: ErrorEvent[] = [];
  // Removed isInitialized flag for Firebase hosting compatibility

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
      // Initialize immediately instead of lazy initialization for Firebase hosting compatibility
      PerformanceMonitoringService.instance.initialize();
    }
    return PerformanceMonitoringService.instance;
  }

  private initialize(): void {
    try {
      // Initialize Web Vitals monitoring
      this.initializeWebVitals();
      
      // Initialize error tracking
      this.initializeErrorTracking();
      
      // Initialize performance observer
      this.initializePerformanceObserver();
      
      // Initialization complete - no need for isInitialized flag
      console.log('🚀 Performance monitoring initialized');
    } catch (error) {
      console.warn('Failed to initialize performance monitoring:', error);
    }
  }

  private initializeWebVitals(): void {
    // Cumulative Layout Shift (CLS)
    getCLS((metric) => {
      this.recordMetric('CLS', metric.value);
      this.logMetric('CLS', metric);
    });

    // First Input Delay (FID)
    getFID((metric) => {
      this.recordMetric('FID', metric.value);
      this.logMetric('FID', metric);
    });

    // First Contentful Paint (FCP)
    getFCP((metric) => {
      this.recordMetric('FCP', metric.value);
      this.logMetric('FCP', metric);
    });

    // Largest Contentful Paint (LCP)
    getLCP((metric) => {
      this.recordMetric('LCP', metric.value);
      this.logMetric('LCP', metric);
    });

    // Time to First Byte (TTFB)
    getTTFB((metric) => {
      this.recordMetric('TTFB', metric.value);
      this.logMetric('TTFB', metric);
    });
  }

  private initializeErrorTracking(): void {
    // Global error handler
    window.addEventListener('error', async (event) => {
      const userId = await this.getUserId();
      this.recordError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', async (event) => {
      const userId = await this.getUserId();
      this.recordError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId
      });
    });

    // React error boundary fallback
    window.addEventListener('react-error-boundary', async (event: any) => {
      const userId = await this.getUserId();
      this.recordError({
        message: event.detail?.error?.message || 'React Error Boundary Error',
        stack: event.detail?.error?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId
      });
    });
  }

  private initializePerformanceObserver(): void {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 100) { // Only warn for tasks longer than 100ms (reduced noise)
              console.warn('⚠️ Long task detected:', {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name
              });
            }
          }
        });

        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('Failed to initialize long task observer:', error);
      }
    }
  }

  private recordMetric(type: keyof PerformanceMetrics, value: number): void {
    const metric: Partial<PerformanceMetrics> = {
      [type]: value,
      timestamp: Date.now()
    };

    this.metrics.push(metric as PerformanceMetrics);

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  private logMetric(type: string, metric: any): void {
    const status = this.getMetricStatus(type, metric.value);
    console.log(`📊 ${type}: ${metric.value.toFixed(2)} (${status})`);
  }

  private getMetricStatus(type: string, value: number): string {
    const thresholds: Record<string, { good: number; needsImprovement: number }> = {
      CLS: { good: 0.1, needsImprovement: 0.25 },
      FID: { good: 100, needsImprovement: 300 },
      FCP: { good: 1800, needsImprovement: 3000 },
      LCP: { good: 2500, needsImprovement: 4000 },
      TTFB: { good: 800, needsImprovement: 1800 }
    };

    const threshold = thresholds[type];
    if (!threshold) return 'Unknown';

    if (value <= threshold.good) return 'Good';
    if (value <= threshold.needsImprovement) return 'Needs Improvement';
    return 'Poor';
  }

  private recordError(error: ErrorEvent): void {
    this.errors.push(error);

    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }

    // Log error for debugging
    console.error('🚨 Error tracked:', error);
  }

  private async getUserId(): Promise<string | undefined> {
    try {
      // Try to get user ID from Supabase first
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id;
    } catch (error) {
      console.warn('Failed to get user ID from Supabase:', error);
      // Fallback to localStorage
      try {
        return localStorage.getItem('otakon_user_id') || undefined;
      } catch {
        return undefined;
      }
    }
  }

  // Public methods for manual tracking
  trackUserAction(action: string, data?: any): void {
    console.log(`👤 User Action: ${action}`, data);
    
    // You can send this to analytics services
    if (window.gtag) {
      window.gtag('event', 'user_action', {
        action_name: action,
        custom_data: data
      });
    }
  }

  trackPerformanceEvent(event: string, duration: number, metadata?: any): void {
    console.log(`⚡ Performance Event: ${event} (${duration}ms)`, metadata);
    
    // You can send this to performance monitoring services
    if (window.gtag) {
      window.gtag('event', 'performance_event', {
        event_name: event,
        duration: duration,
        custom_metadata: metadata
      });
    }
  }

  async trackError(error: Error, context?: any): Promise<void> {
    const userId = await this.getUserId();
    const errorEvent: ErrorEvent = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId
    };

    this.recordError(errorEvent);
    
    // You can send this to error tracking services
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_context: context
      });
    }
  }

  // Get performance summary
  getPerformanceSummary(): {
    latestMetrics: Partial<PerformanceMetrics>;
    errorCount: number;
    averageMetrics: Partial<PerformanceMetrics>;
  } {
    const latestMetrics = this.metrics[this.metrics.length - 1] || {};
    
    const errorCount = this.errors.length;
    
    // Calculate average metrics
    const averageMetrics: Partial<PerformanceMetrics> = {};
    const metricTypes: (keyof PerformanceMetrics)[] = ['CLS', 'FID', 'FCP', 'LCP', 'TTFB'];
    
    metricTypes.forEach(type => {
      const values = this.metrics
        .map(m => m[type])
        .filter(v => typeof v === 'number') as number[];
      
      if (values.length > 0) {
        averageMetrics[type] = values.reduce((sum, val) => sum + val, 0) / values.length;
      }
    });

    return {
      latestMetrics,
      errorCount,
      averageMetrics
    };
  }

  // Export data for analysis
  exportData(): { metrics: PerformanceMetrics[]; errors: ErrorEvent[] } {
    return {
      metrics: [...this.metrics],
      errors: [...this.errors]
    };
  }

  // Clear data
  clearData(): void {
    this.metrics = [];
    this.errors = [];
    console.log('🧹 Performance monitoring data cleared');
  }
}

// Export singleton instance
export const performanceMonitoringService = PerformanceMonitoringService.getInstance();

// Export individual methods for convenience
export const {
  // initialize,
  trackUserAction,
  trackPerformanceEvent,
  trackError,
  getPerformanceSummary,
  exportData,
  clearData
} = performanceMonitoringService;

// Add to window for debugging
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    performanceMonitoringService?: typeof performanceMonitoringService;
  }
}

if (typeof window !== 'undefined') {
  window.performanceMonitoringService = performanceMonitoringService;
}
