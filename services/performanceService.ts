export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface UserInteraction {
  action: string;
  timestamp: number;
  duration?: number;
  success: boolean;
  metadata?: Record<string, any>;
}

export interface ErrorEvent {
  message: string;
  stack?: string;
  timestamp: number;
  component?: string;
  metadata?: Record<string, any>;
}

class PerformanceService {
  private static instance: PerformanceService;
  private metrics: PerformanceMetric[] = [];
  private interactions: UserInteraction[] = [];
  private errors: ErrorEvent[] = [];
  private observers: Set<(data: any) => void> = new Set();

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  constructor() {
    this.initializePerformanceObserver();
    this.initializeErrorTracking();
  }

  private initializePerformanceObserver() {
    if ('PerformanceObserver' in window) {
      try {
        // Observe navigation timing
        const navigationObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.loadEventStart, 'ms');
              this.recordMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart, 'ms');
              this.recordMetric('first_paint', navEntry.responseStart - navEntry.requestStart, 'ms');
            }
          });
        });

        navigationObserver.observe({ entryTypes: ['navigation'] });

        // Observe paint timing
        const paintObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'paint') {
              const paintEntry = entry as PerformancePaintTiming;
              this.recordMetric(paintEntry.name, paintEntry.startTime, 'ms');
            }
          });
        });

        paintObserver.observe({ entryTypes: ['paint'] });

        // Observe resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming;
              this.recordMetric('resource_load_time', resourceEntry.duration, 'ms', {
                name: resourceEntry.name,
                type: resourceEntry.initiatorType,
                size: resourceEntry.transferSize,
              });
            }
          });
        });

        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('PerformanceObserver not supported:', error);
      }
    }
  }

  private initializeErrorTracking() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.recordError(event.error?.message || event.message, event.error?.stack, event.filename);
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError(`Unhandled Promise Rejection: ${event.reason}`, undefined, 'Promise');
    });
  }

  // Record performance metrics
  recordMetric(name: string, value: number, unit: string, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);
    this.notifyObservers({ type: 'metric', data: metric });

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  // Record user interactions
  recordInteraction(action: string, success: boolean, duration?: number, metadata?: Record<string, any>) {
    const interaction: UserInteraction = {
      action,
      timestamp: Date.now(),
      duration,
      success,
      metadata,
    };

    this.interactions.push(interaction);
    this.notifyObservers({ type: 'interaction', data: interaction });

    // Keep only last 1000 interactions
    if (this.interactions.length > 1000) {
      this.interactions = this.interactions.slice(-1000);
    }
  }

  // Record errors
  recordError(message: string, stack?: string, component?: string, metadata?: Record<string, any>) {
    const error: ErrorEvent = {
      message,
      stack,
      timestamp: Date.now(),
      component,
      metadata,
    };

    this.errors.push(error);
    this.notifyObservers({ type: 'error', data: error });

    // Keep only last 1000 errors
    if (this.errors.length > 1000) {
      this.errors = this.errors.slice(-1000);
    }
  }

  // Measure function execution time
  async measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_duration`, duration, 'ms', metadata);
      this.recordInteraction(name, true, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_duration`, duration, 'ms', metadata);
      this.recordInteraction(name, false, duration, { ...metadata, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  measureSync<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    const startTime = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_duration`, duration, 'ms', metadata);
      this.recordInteraction(name, true, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_duration`, duration, 'ms', metadata);
      this.recordInteraction(name, false, duration, { ...metadata, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // Subscribe to performance events
  subscribe(observer: (data: any) => void) {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  private notifyObservers(data: any) {
    this.observers.forEach(observer => {
      try {
        observer(data);
      } catch (error) {
        console.error('Error in performance observer:', error);
      }
    });
  }

  // Get performance data
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getInteractions(): UserInteraction[] {
    return [...this.interactions];
  }

  getErrors(): ErrorEvent[] {
    return [...this.errors];
  }

  // Get summary statistics
  getSummary() {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);

    const recentMetrics = this.metrics.filter(m => m.timestamp > last24h);
    const recentInteractions = this.interactions.filter(i => i.timestamp > last24h);
    const recentErrors = this.errors.filter(e => e.timestamp > last24h);

    return {
      totalMetrics: this.metrics.length,
      totalInteractions: this.interactions.length,
      totalErrors: this.errors.length,
      last24h: {
        metrics: recentMetrics.length,
        interactions: recentInteractions.length,
        errors: recentErrors.length,
      },
      averageResponseTime: recentInteractions.length > 0 
        ? recentInteractions.reduce((sum, i) => sum + (i.duration || 0), 0) / recentInteractions.length 
        : 0,
      errorRate: recentInteractions.length > 0 
        ? (recentErrors.length / recentInteractions.length) * 100 
        : 0,
    };
  }

  // Export data for analytics
  exportData() {
    return {
      metrics: this.getMetrics(),
      interactions: this.getInteractions(),
      errors: this.getErrors(),
      summary: this.getSummary(),
      timestamp: Date.now(),
    };
  }

  // Clear all data
  clear() {
    this.metrics = [];
    this.interactions = [];
    this.errors = [];
  }
}

export const performanceService = PerformanceService.getInstance();
