// ========================================
// 🔄 AUTOMATIC SESSION REFRESH SERVICE
// ========================================
// Handles automatic session refresh to prevent unexpected logouts
// and maintain seamless user experience

import { supabase } from './supabase';
import { authService } from './supabase';

export interface SessionRefreshOptions {
  autoRefresh: boolean;
  refreshInterval: number; // in milliseconds
  maxRetries: number;
  onRefreshSuccess?: (session: any) => void;
  onRefreshFailure?: (error: any) => void;
  onSessionExpired?: () => void;
}

export interface SessionStatus {
  isValid: boolean;
  expiresAt: number;
  timeUntilExpiry: number;
  needsRefresh: boolean;
}

class SessionRefreshService {
  private static instance: SessionRefreshService;
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private refreshRetryCount = 0;
  private options: SessionRefreshOptions = {
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    maxRetries: 3
  };

  private constructor() {}

  static getInstance(): SessionRefreshService {
    if (!SessionRefreshService.instance) {
      SessionRefreshService.instance = new SessionRefreshService();
    }
    return SessionRefreshService.instance;
  }

  /**
   * Initialize automatic session refresh
   */
  initialize(options: Partial<SessionRefreshOptions> = {}): void {
    this.options = { ...this.options, ...options };
    
    if (this.options.autoRefresh) {
      this.startRefreshTimer();
      console.log('🔄 [SessionRefresh] Automatic session refresh initialized');
    }
  }

  /**
   * Start the refresh timer
   */
  startRefreshTimer(): void {
    this.stopRefreshTimer();
    
    this.refreshTimer = setInterval(async () => {
      await this.checkAndRefreshSession();
    }, this.options.refreshInterval);
    
    console.log(`🔄 [SessionRefresh] Refresh timer started (${this.options.refreshInterval}ms interval)`);
  }

  /**
   * Stop the refresh timer
   */
  stopRefreshTimer(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      console.log('🔄 [SessionRefresh] Refresh timer stopped');
    }
  }

  /**
   * Check if session needs refresh and refresh if necessary
   */
  async checkAndRefreshSession(): Promise<boolean> {
    if (this.isRefreshing) {
      console.log('🔄 [SessionRefresh] Refresh already in progress, skipping');
      return false;
    }

    try {
      const sessionStatus = await this.getSessionStatus();
      
      if (!sessionStatus.isValid) {
        console.log('🔄 [SessionRefresh] Session is invalid, triggering session expired callback');
        if (this.options.onSessionExpired) {
          this.options.onSessionExpired();
        }
        return false;
      }

      if (sessionStatus.needsRefresh) {
        console.log('🔄 [SessionRefresh] Session needs refresh, refreshing...');
        return await this.refreshSession();
      }

      console.log('🔄 [SessionRefresh] Session is valid, no refresh needed');
      return true;
      
    } catch (error) {
      console.error('🔄 [SessionRefresh] Error checking session:', error);
      return false;
    }
  }

  /**
   * Manually refresh the session
   */
  async refreshSession(): Promise<boolean> {
    if (this.isRefreshing) {
      console.log('🔄 [SessionRefresh] Refresh already in progress');
      return false;
    }

    this.isRefreshing = true;
    
    try {
      console.log('🔄 [SessionRefresh] Starting session refresh...');
      
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw new Error(`Failed to get session: ${error.message}`);
      }

      if (!session) {
        throw new Error('No active session found');
      }

      // Refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        throw new Error(`Failed to refresh session: ${refreshError.message}`);
      }

      if (!refreshData.session) {
        throw new Error('No session returned from refresh');
      }

      console.log('🔄 [SessionRefresh] Session refreshed successfully');
      
      // Reset retry count on success
      this.refreshRetryCount = 0;
      
      // Call success callback
      if (this.options.onRefreshSuccess) {
        this.options.onRefreshSuccess(refreshData.session);
      }
      
      return true;
      
    } catch (error) {
      console.error('🔄 [SessionRefresh] Session refresh failed:', error);
      
      // Increment retry count
      this.refreshRetryCount++;
      
      // Call failure callback
      if (this.options.onRefreshFailure) {
        this.options.onRefreshFailure(error);
      }
      
      // If we've exceeded max retries, trigger session expired
      if (this.refreshRetryCount >= this.options.maxRetries) {
        console.log('🔄 [SessionRefresh] Max retries exceeded, triggering session expired');
        if (this.options.onSessionExpired) {
          this.options.onSessionExpired();
        }
      }
      
      return false;
      
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Get current session status
   */
  async getSessionStatus(): Promise<SessionStatus> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return {
          isValid: false,
          expiresAt: 0,
          timeUntilExpiry: 0,
          needsRefresh: false
        };
      }

      const now = Date.now();
      const expiresAt = session.expires_at ? session.expires_at * 1000 : now + (60 * 60 * 1000); // Default 1 hour
      const timeUntilExpiry = expiresAt - now;
      
      // Refresh if session expires in less than 10 minutes
      const needsRefresh = timeUntilExpiry < (10 * 60 * 1000);
      
      return {
        isValid: true,
        expiresAt,
        timeUntilExpiry,
        needsRefresh
      };
      
    } catch (error) {
      console.error('🔄 [SessionRefresh] Error getting session status:', error);
      return {
        isValid: false,
        expiresAt: 0,
        timeUntilExpiry: 0,
        needsRefresh: false
      };
    }
  }

  /**
   * Force a session refresh (for manual triggers)
   */
  async forceRefresh(): Promise<boolean> {
    console.log('🔄 [SessionRefresh] Force refresh requested');
    return await this.refreshSession();
  }

  /**
   * Check if session is about to expire
   */
  async isSessionExpiringSoon(minutesThreshold: number = 10): Promise<boolean> {
    const status = await this.getSessionStatus();
    const thresholdMs = minutesThreshold * 60 * 1000;
    return status.isValid && status.timeUntilExpiry < thresholdMs;
  }

  /**
   * Get time until session expires (in minutes)
   */
  async getTimeUntilExpiry(): Promise<number> {
    const status = await this.getSessionStatus();
    return Math.max(0, Math.floor(status.timeUntilExpiry / (60 * 1000)));
  }

  /**
   * Update refresh options
   */
  updateOptions(newOptions: Partial<SessionRefreshOptions>): void {
    this.options = { ...this.options, ...newOptions };
    
    // Restart timer if interval changed
    if (newOptions.refreshInterval && this.options.autoRefresh) {
      this.startRefreshTimer();
    }
  }

  /**
   * Reset the service (for testing)
   */
  reset(): void {
    this.stopRefreshTimer();
    this.isRefreshing = false;
    this.refreshRetryCount = 0;
  }

  /**
   * Get current refresh status
   */
  getStatus(): {
    isRefreshing: boolean;
    retryCount: number;
    timerActive: boolean;
  } {
    return {
      isRefreshing: this.isRefreshing,
      retryCount: this.refreshRetryCount,
      timerActive: this.refreshTimer !== null
    };
  }
}

// Export singleton instance
export const sessionRefreshService = SessionRefreshService.getInstance();
