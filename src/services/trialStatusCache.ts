/**
 * Trial Status Cache Service
 * Caches trial status data to prevent loading delays in UI components
 */

import { TrialStatus } from '../types';

class TrialStatusCacheService {
  private cache: Map<string, TrialStatus> = new Map();
  private lastFetch: Map<string, number> = new Map();
  private readonly CACHE_TTL_MS = 30000; // 30 seconds cache TTL

  /**
   * Get cached trial status for a user
   */
  get(userId: string): TrialStatus | null {
    const cached = this.cache.get(userId);
    const lastFetch = this.lastFetch.get(userId);

    if (!cached || !lastFetch) {
      return null;
    }

    // Check if cache is still valid
    const now = Date.now();
    if (now - lastFetch > this.CACHE_TTL_MS) {
      // Cache expired
      this.cache.delete(userId);
      this.lastFetch.delete(userId);
      return null;
    }

    return cached;
  }

  /**
   * Set trial status in cache
   */
  set(userId: string, status: TrialStatus): void {
    this.cache.set(userId, status);
    this.lastFetch.set(userId, Date.now());
  }

  /**
   * Invalidate cache for a user (e.g., after trial activation)
   */
  invalidate(userId: string): void {
    this.cache.delete(userId);
    this.lastFetch.delete(userId);
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
    this.lastFetch.clear();
  }
}

export const trialStatusCache = new TrialStatusCacheService();
