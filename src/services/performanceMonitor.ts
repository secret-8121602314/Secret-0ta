/**
 * Real-time Performance Monitoring Service
 * Tracks app performance, errors, and user experience metrics
 */

import type { ExtendedPerformance } from '../types/enhanced';

interface PerformanceMetrics {
  // Core performance metrics
  pageLoadTime: number;
  apiResponseTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  
  // User experience metrics
  userActions: number;
  errors: number;
  crashes: number;
  
  // Database metrics
  dbQueryTime: number;
  dbQueryCount: number;
  
  // WebSocket metrics
  wsConnections: number;
  wsMessageLatency: number;
  
  // Custom metrics
  customMetrics: Record<string, number>;
}

interface PerformanceAlert {
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics;
  private alerts: PerformanceAlert[] = [];
  private isMonitoring = false;
  private reportInterval: NodeJS.Timeout | null = null;
  
  // Performance thresholds
  private thresholds = {
    pageLoadTime: 3000,      // 3 seconds
    apiResponseTime: 2000,   // 2 seconds
    memoryUsage: 100 * 1024 * 1024, // 100MB
    errorRate: 0.05,         // 5%
    cacheHitRate: 0.8        // 80%
  };

  constructor() {
    this.metrics = {
      pageLoadTime: 0,
      apiResponseTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      userActions: 0,
      errors: 0,
      crashes: 0,
      dbQueryTime: 0,
      dbQueryCount: 0,
      wsConnections: 0,
      wsMessageLatency: 0,
      customMetrics: {}
    };
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start monitoring performance
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }
    
        this.isMonitoring = true;
    
    // Monitor page load time
    this.monitorPageLoad();
    
    // Monitor memory usage
    this.monitorMemoryUsage();
    
    // Monitor user interactions
    this.monitorUserInteractions();
    
    // Monitor errors
    this.monitorErrors();
    
    // Report metrics every 30 seconds
    this.reportInterval = setInterval(() => {
      this.reportMetrics();
    }, 30000);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }
    
        this.isMonitoring = false;
    
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }
  }

  /**
   * Monitor page load performance
   */
  private monitorPageLoad(): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.metrics.pageLoadTime = loadTime;
      
      if (loadTime > this.thresholds.pageLoadTime) {
        this.addAlert('warning', `Slow page load: ${loadTime.toFixed(2)}ms`, 'medium');
      }
    });
  }

  /**
   * Monitor memory usage
   */
  private monitorMemoryUsage(): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as import('../types/enhanced').ExtendedPerformance).memory;
        if (memory) {
          this.metrics.memoryUsage = memory.usedJSHeapSize;
          
          if (memory.usedJSHeapSize > this.thresholds.memoryUsage) {
            this.addAlert('warning', `High memory usage: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`, 'high');
          }
        }
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Monitor user interactions
   */
  private monitorUserInteractions(): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    const events = ['click', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.metrics.userActions++;
      }, { passive: true });
    });
  }

  /**
   * Monitor errors
   */
  private monitorErrors(): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    window.addEventListener('error', (event) => {
      this.metrics.errors++;
      this.addAlert('error', `JavaScript Error: ${event.message}`, 'high');
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.metrics.errors++;
      this.addAlert('error', `Unhandled Promise Rejection: ${event.reason}`, 'high');
    });
  }

  /**
   * Track API response time
   */
  trackApiCall(apiName: string, startTime: number, endTime: number): void {
    const responseTime = endTime - startTime;
    this.metrics.apiResponseTime = responseTime;
    
    if (responseTime > this.thresholds.apiResponseTime) {
      this.addAlert('warning', `Slow API call (${apiName}): ${responseTime.toFixed(2)}ms`, 'medium');
    }
  }

  /**
   * Track database query performance
   */
  trackDbQuery(queryName: string, startTime: number, endTime: number): void {
    const queryTime = endTime - startTime;
    this.metrics.dbQueryTime = queryTime;
    this.metrics.dbQueryCount++;
    
    if (queryTime > 1000) { // 1 second threshold for DB queries
      this.addAlert('warning', `Slow DB query (${queryName}): ${queryTime.toFixed(2)}ms`, 'medium');
    }
  }

  /**
   * Track cache performance
   */
  trackCacheHit(): void {
    // This would be called by your cache service
    const totalCacheRequests = this.metrics.customMetrics.cacheRequests || 0;
    const totalCacheHits = this.metrics.customMetrics.cacheHits || 0;
    
    this.metrics.customMetrics.cacheRequests = totalCacheRequests + 1;
    this.metrics.customMetrics.cacheHits = totalCacheHits + 1;
    
    this.metrics.cacheHitRate = totalCacheHits / (totalCacheRequests + 1);
  }

  trackCacheMiss(): void {
    const totalCacheRequests = this.metrics.customMetrics.cacheRequests || 0;
    this.metrics.customMetrics.cacheRequests = totalCacheRequests + 1;
    
    this.metrics.cacheHitRate = (this.metrics.customMetrics.cacheHits || 0) / (totalCacheRequests + 1);
  }

  /**
   * Track WebSocket performance
   */
  trackWebSocketConnection(): void {
    this.metrics.wsConnections++;
  }

  trackWebSocketMessage(latency: number): void {
    this.metrics.wsMessageLatency = latency;
  }

  /**
   * Add custom metric
   */
  addCustomMetric(name: string, value: number): void {
    this.metrics.customMetrics[name] = value;
  }

  /**
   * Add performance alert
   */
  addAlert(type: PerformanceAlert['type'], message: string, severity: PerformanceAlert['severity']): void {
    const alert: PerformanceAlert = {
      type,
      message,
      timestamp: Date.now(),
      severity
    };
    
    this.alerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
    
    // Log critical alerts
    if (severity === 'critical') {
      console.error(`🚨 [PerformanceMonitor] CRITICAL: ${message}`);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit = 10): PerformanceAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Report metrics to console (or external service)
   */
  private reportMetrics(): void {
    if (!this.isMonitoring) {
      return;
    }
    
    console.log('📊 [PerformanceMonitor] Current Metrics:', {
      pageLoadTime: `${this.metrics.pageLoadTime.toFixed(2)}ms`,
      apiResponseTime: `${this.metrics.apiResponseTime.toFixed(2)}ms`,
      cacheHitRate: `${(this.metrics.cacheHitRate * 100).toFixed(1)}%`,
      memoryUsage: `${(this.metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
      userActions: this.metrics.userActions,
      errors: this.metrics.errors,
      dbQueries: this.metrics.dbQueryCount,
      wsConnections: this.metrics.wsConnections
    });
    
    // Check for performance issues
    this.checkPerformanceIssues();
  }

  /**
   * Check for performance issues and create alerts
   */
  private checkPerformanceIssues(): void {
    // Check error rate
    const errorRate = this.metrics.errors / Math.max(this.metrics.userActions, 1);
    if (errorRate > this.thresholds.errorRate) {
      this.addAlert('error', `High error rate: ${(errorRate * 100).toFixed(2)}%`, 'high');
    }
    
    // Check cache hit rate
    if (this.metrics.cacheHitRate < this.thresholds.cacheHitRate) {
      this.addAlert('warning', `Low cache hit rate: ${(this.metrics.cacheHitRate * 100).toFixed(1)}%`, 'medium');
    }
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      alerts: this.alerts,
      timestamp: Date.now()
    });
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Auto-start monitoring in browser
if (typeof window !== 'undefined') {
  performanceMonitor.startMonitoring();
}

