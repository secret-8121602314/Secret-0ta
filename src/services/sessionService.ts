import { supabase } from '../lib/supabase';
import { Json } from '../types/database';

/**
 * Session Service
 * Tracks user session engagement metrics
 * 
 * Features:
 * - Start/end session tracking
 * - Duration calculation
 * - Session metadata (route, activity)
 * - Automatic session end on logout/close
 */

interface SessionData {
  initialRoute?: string;
  activityCount?: number;
  lastActivity?: string;
  lastActivityType?: string;
  deviceInfo?: string;
}

export class SessionService {
  private static instance: SessionService;
  private currentSessionId: string | null = null;
  private sessionStartTime: number | null = null;
  private activityCount = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * Start a new user session
   */
  async startSession(userId: string, initialRoute?: string): Promise<string | null> {
    try {
      // End any existing session first
      if (this.currentSessionId) {
        await this.endSession();
      }

      const sessionData: SessionData = {
        initialRoute,
        activityCount: 0,
        deviceInfo: this.getDeviceInfo(),
      };

      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          // Note: user_sessions table uses internal user_id (not auth_user_id)
          started_at: new Date().toISOString(),
          session_data: sessionData as Json,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to start session:', error);
        return null;
      }

      this.currentSessionId = data.id;
      this.sessionStartTime = Date.now();
      this.activityCount = 0;

      // Start heartbeat to track activity
      this.startHeartbeat();

            return this.currentSessionId;
    } catch (error) {
      console.error('Error starting session:', error);
      return null;
    }
  }

  /**
   * End the current session
   */
  async endSession(): Promise<void> {
    if (!this.currentSessionId || !this.sessionStartTime) {
      return;
    }

    try {
      const durationSeconds = Math.floor((Date.now() - this.sessionStartTime) / 1000);

      const { error } = await supabase
        .from('user_sessions')
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: durationSeconds,
          session_data: {
            activityCount: this.activityCount,
            lastActivity: new Date().toISOString(),
          } as Json,
        })
        .eq('id', this.currentSessionId);

      if (error) {
        console.error('Failed to end session:', error);
      } else {
        console.log(`✅ Session ended: ${this.currentSessionId} (${durationSeconds}s)`);
      }

      // Cleanup
      this.stopHeartbeat();
      this.currentSessionId = null;
      this.sessionStartTime = null;
      this.activityCount = 0;
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }

  /**
   * Track user activity in current session
   */
  trackActivity(activityType: string): void {
    if (!this.currentSessionId) {
      return;
    }

    this.activityCount++;

    // Update session data asynchronously (fire and forget)
    supabase
      .from('user_sessions')
      .update({
        session_data: {
          activityCount: this.activityCount,
          lastActivity: new Date().toISOString(),
          lastActivityType: activityType,
        } as Json,
      })
      .eq('id', this.currentSessionId)
      .then(({ error }) => {
        if (error) {
          console.error('Failed to track activity:', error);
        }
      });
  }

  /**
   * Update session metadata
   */
  async updateSessionData(data: SessionData): Promise<void> {
    if (!this.currentSessionId) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ session_data: data as Json })
        .eq('id', this.currentSessionId);

      if (error) {
        console.error('Failed to update session data:', error);
      }
    } catch (error) {
      console.error('Error updating session data:', error);
    }
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Get session duration in seconds
   */
  getSessionDuration(): number {
    if (!this.sessionStartTime) {
      return 0;
    }
    return Math.floor((Date.now() - this.sessionStartTime) / 1000);
  }

  /**
   * Start heartbeat to track active sessions
   */
  private startHeartbeat(): void {
    // Update session every 5 minutes to show it's still active
    this.heartbeatInterval = setInterval(() => {
      this.trackActivity('heartbeat');
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Get device information for session tracking
   */
  private getDeviceInfo(): string {
    const { userAgent } = navigator;
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const isTablet = /Tablet|iPad/.test(userAgent);
    
    let deviceType = 'desktop';
    if (isMobile && !isTablet) deviceType = 'mobile';
    if (isTablet) deviceType = 'tablet';

    return deviceType;
  }

  /**
   * Cleanup on app close
   */
  cleanup(): void {
    this.stopHeartbeat();
    // Note: endSession is async, but we can't await in cleanup
    // Fire and forget - best effort to end session
    if (this.currentSessionId) {
      this.endSession().catch(console.error);
    }
  }
}

export const sessionService = SessionService.getInstance();

// Setup cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    sessionService.cleanup();
  });
}
