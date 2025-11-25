// ========================================
// MEMORY MANAGER FOR SCALABILITY
// ========================================
// Centralized memory management to prevent leaks and optimize performance
// for 100K+ users

import type { ExtendedPerformance, ExtendedWindow } from '../types/enhanced';

interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercentage: number;
}

interface CleanupFunction {
  id: string;
  cleanup: () => void;
  priority: number; // Higher number = higher priority
}

class MemoryManager {
  private static instance: MemoryManager;
  private cleanupFunctions: Map<string, CleanupFunction> = new Map();
  private intervals: Set<NodeJS.Timeout> = new Set();
  private timeouts: Set<NodeJS.Timeout> = new Set();
  private eventListeners: Map<string, { element: EventTarget; event: string; handler: EventListener }> = new Map();
  private abortControllers: Set<AbortController> = new Set();
  private isDestroyed = false;
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private readonly MEMORY_THRESHOLD = 80; // 80% memory usage threshold
  private readonly CLEANUP_INTERVAL = 30000; // 30 seconds

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  constructor() {
    this.startMemoryMonitoring();
    this.setupGlobalCleanup();
  }

  // ✅ SCALABILITY: Register cleanup function
  registerCleanup(id: string, cleanup: () => void, priority: number = 1): void {
    if (this.isDestroyed) {
      return;
    }
    
    this.cleanupFunctions.set(id, { id, cleanup, priority });
  }

  // ✅ SCALABILITY: Unregister cleanup function
  unregisterCleanup(id: string): void {
    this.cleanupFunctions.delete(id);
  }

  // ✅ SCALABILITY: Track interval for cleanup
  trackInterval(interval: NodeJS.Timeout): void {
    if (this.isDestroyed) {
      clearInterval(interval);
      return;
    }
    this.intervals.add(interval);
  }

  // ✅ SCALABILITY: Track timeout for cleanup
  trackTimeout(timeout: NodeJS.Timeout): void {
    if (this.isDestroyed) {
      clearTimeout(timeout);
      return;
    }
    this.timeouts.add(timeout);
  }

  // ✅ SCALABILITY: Track event listener for cleanup
  trackEventListener(
    id: string, 
    element: EventTarget, 
    event: string, 
    handler: EventListener
  ): void {
    if (this.isDestroyed) {
      return;
    }
    
    this.eventListeners.set(id, { element, event, handler });
  }

  // ✅ SCALABILITY: Track abort controller for cleanup
  trackAbortController(controller: AbortController): void {
    if (this.isDestroyed) {
      controller.abort();
      return;
    }
    this.abortControllers.add(controller);
  }

  // ✅ SCALABILITY: Get memory statistics
  getMemoryStats(): MemoryStats | null {
    if (typeof performance === 'undefined' || !('memory' in performance)) {
      return null;
    }

    const memory = (performance as ExtendedPerformance).memory;
    if (!memory) {
      return null;
    }
    const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage
    };
  }

  // ✅ SCALABILITY: Check if memory usage is high
  isMemoryHigh(): boolean {
    const stats = this.getMemoryStats();
    return stats ? stats.usagePercentage > this.MEMORY_THRESHOLD : false;
  }

  // ✅ SCALABILITY: Force garbage collection (if available)
  forceGarbageCollection(): void {
    if (typeof window !== 'undefined' && 'gc' in window) {
      try {
        (window as ExtendedWindow).gc?.();
              } catch {
              }
    }
  }

  // ✅ SCALABILITY: Start memory monitoring
  private startMemoryMonitoring(): void {
    if (this.isDestroyed) {
      return;
    }
    
    this.memoryCheckInterval = setInterval(() => {
      if (this.isDestroyed) {
        return;
      }
      
      const stats = this.getMemoryStats();
      if (stats && stats.usagePercentage > this.MEMORY_THRESHOLD) {
        console.warn(`⚠️ [MemoryManager] High memory usage: ${stats.usagePercentage.toFixed(2)}%`);
        this.performEmergencyCleanup();
      }
    }, this.CLEANUP_INTERVAL);
  }

  // ✅ SCALABILITY: Emergency cleanup when memory is high
  private performEmergencyCleanup(): void {
        // Clear old intervals
    this.intervals.forEach(interval => {
      try {
        clearInterval(interval);
      } catch {
              }
    });
    this.intervals.clear();
    
    // Clear old timeouts
    this.timeouts.forEach(timeout => {
      try {
        clearTimeout(timeout);
      } catch {
              }
    });
    this.timeouts.clear();
    
    // Abort pending requests
    this.abortControllers.forEach(controller => {
      try {
        controller.abort();
      } catch {
              }
    });
    this.abortControllers.clear();
    
    // Force garbage collection
    this.forceGarbageCollection();
    
      }

  // ✅ SCALABILITY: Setup global cleanup
  private setupGlobalCleanup(): void {
    const cleanup = () => {
      if (!this.isDestroyed) {
        this.cleanup();
      }
    };
    
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('pagehide', cleanup);
  }

  // ✅ SCALABILITY: Main cleanup method
  cleanup(): void {
    if (this.isDestroyed) {
      return;
    }
    
        this.isDestroyed = true;
    
    // Stop memory monitoring
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
    
    // Clear all intervals
    this.intervals.forEach(interval => {
      try {
        clearInterval(interval);
      } catch {
              }
    });
    this.intervals.clear();
    
    // Clear all timeouts
    this.timeouts.forEach(timeout => {
      try {
        clearTimeout(timeout);
      } catch {
              }
    });
    this.timeouts.clear();
    
    // Remove all event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      try {
        element.removeEventListener(event, handler);
      } catch {
              }
    });
    this.eventListeners.clear();
    
    // Abort all pending requests
    this.abortControllers.forEach(controller => {
      try {
        controller.abort();
      } catch {
              }
    });
    this.abortControllers.clear();
    
    // Run registered cleanup functions (sorted by priority)
    const sortedCleanups = Array.from(this.cleanupFunctions.values())
      .sort((a, b) => b.priority - a.priority);
    
    sortedCleanups.forEach(({ id, cleanup }) => {
      try {
        cleanup();
      } catch (error) {
        console.error(`Error in cleanup function ${id}:`, error);
      }
    });
    this.cleanupFunctions.clear();
    
    // Force garbage collection
    this.forceGarbageCollection();
    
      }

  // ✅ SCALABILITY: Get cleanup statistics
  getCleanupStats(): {
    intervals: number;
    timeouts: number;
    eventListeners: number;
    abortControllers: number;
    cleanupFunctions: number;
    memoryStats: MemoryStats | null;
  } {
    return {
      intervals: this.intervals.size,
      timeouts: this.timeouts.size,
      eventListeners: this.eventListeners.size,
      abortControllers: this.abortControllers.size,
      cleanupFunctions: this.cleanupFunctions.size,
      memoryStats: this.getMemoryStats()
    };
  }
}

// Export singleton instance
export const memoryManager = MemoryManager.getInstance();

// Export utility functions
export const createTrackedInterval = (callback: () => void, delay: number): NodeJS.Timeout => {
  const interval = setInterval(callback, delay);
  memoryManager.trackInterval(interval);
  return interval;
};

export const createTrackedTimeout = (callback: () => void, delay: number): NodeJS.Timeout => {
  const timeout = setTimeout(callback, delay);
  memoryManager.trackTimeout(timeout);
  return timeout;
};

export const addTrackedEventListener = (
  id: string,
  element: EventTarget,
  event: string,
  handler: EventListener
): void => {
  element.addEventListener(event, handler);
  memoryManager.trackEventListener(id, element, event, handler);
};

export const createTrackedAbortController = (): AbortController => {
  const controller = new AbortController();
  memoryManager.trackAbortController(controller);
  return controller;
};

