/**
 * SessionManager - Cross-tab session conflict detection
 * Prevents multiple PWA/browser instances from conflicting with each other
 */

interface SessionInstance {
  id: string;
  timestamp: number;
  type: 'pwa' | 'browser';
  userId: string | null;
  userEmail: string | null;
}

export class SessionManager {
  private static readonly STORAGE_KEY = 'otagon_active_instances';
  private static readonly CLEANUP_INTERVAL = 60000; // 1 minute
  private static readonly INSTANCE_TIMEOUT = 300000; // 5 minutes
  
  private instanceId: string;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private onConflictCallback: ((instances: SessionInstance[]) => void) | null = null;

  constructor(onConflict?: (instances: SessionInstance[]) => void) {
    this.instanceId = `instance_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.onConflictCallback = onConflict || null;
    
    this.registerInstance();
    this.setupListeners();
    this.startCleanupTimer();
    
    console.log('📱 [SessionManager] Initialized:', {
      instanceId: this.instanceId,
      type: this.isPWA() ? 'PWA' : 'Browser'
    });
  }

  /**
   * Register this instance in localStorage
   */
  private registerInstance(): void {
    const instances = this.getActiveInstances();
    const userId = this.getCurrentUserId();
    const userEmail = this.getCurrentUserEmail();
    
    instances.push({
      id: this.instanceId,
      timestamp: Date.now(),
      type: this.isPWA() ? 'pwa' : 'browser',
      userId,
      userEmail
    });
    
    this.saveInstances(instances);
    
    console.log('📱 [SessionManager] Registered instance:', {
      id: this.instanceId,
      userId,
      userEmail,
      totalInstances: instances.length
    });
    
    // Check for conflicts immediately
    this.checkForConflicts(instances);
  }

  /**
   * Update instance heartbeat
   */
  public updateHeartbeat(): void {
    const instances = this.getActiveInstances();
    const thisInstance = instances.find(i => i.id === this.instanceId);
    
    if (thisInstance) {
      thisInstance.timestamp = Date.now();
      thisInstance.userId = this.getCurrentUserId();
      thisInstance.userEmail = this.getCurrentUserEmail();
      this.saveInstances(instances);
    } else {
      // Instance was removed, re-register
      this.registerInstance();
    }
  }

  /**
   * Set up event listeners for cross-tab communication
   */
  private setupListeners(): void {
    // Listen for storage events (cross-tab communication)
    window.addEventListener('storage', (e) => {
      if (e.key === SessionManager.STORAGE_KEY) {
        console.log('📱 [SessionManager] Storage changed, checking for conflicts');
        this.handleInstanceChange();
      }
    });
    
    // Update heartbeat periodically
    setInterval(() => this.updateHeartbeat(), 30000); // Every 30 seconds
    
    // Clean up on unload
    window.addEventListener('beforeunload', () => {
      this.unregisterInstance();
    });
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('📱 [SessionManager] Page became visible, updating heartbeat');
        this.updateHeartbeat();
      }
    });
  }

  /**
   * Start periodic cleanup of stale instances
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleInstances();
    }, SessionManager.CLEANUP_INTERVAL);
  }

  /**
   * Handle changes to active instances
   */
  private handleInstanceChange(): void {
    const instances = this.getActiveInstances();
    this.checkForConflicts(instances);
  }

  /**
   * Check for session conflicts across instances
   */
  private checkForConflicts(instances: SessionInstance[]): void {
    const otherInstances = instances.filter(i => i.id !== this.instanceId);
    
    if (otherInstances.length === 0) {
      return;
    }
    
    const currentUserId = this.getCurrentUserId();
    const currentUserEmail = this.getCurrentUserEmail();
    
    // Check for different users
    const differentUsers = otherInstances.filter(i => 
      i.userId && currentUserId && i.userId !== currentUserId
    );
    
    if (differentUsers.length > 0) {
      console.warn('⚠️ [SessionManager] CONFLICT: Multiple users detected:', {
        currentUser: currentUserEmail,
        otherUsers: differentUsers.map(i => i.userEmail)
      });
      
      if (this.onConflictCallback) {
        this.onConflictCallback(instances);
      }
    } else if (otherInstances.length > 0) {
      console.log('📱 [SessionManager] Multiple instances of same user:', {
        currentUser: currentUserEmail,
        instances: instances.map(i => ({
          type: i.type,
          userId: i.userId,
          age: Math.round((Date.now() - i.timestamp) / 1000) + 's'
        }))
      });
    }
  }

  /**
   * Clean up stale instances (older than timeout)
   */
  private cleanupStaleInstances(): void {
    const instances = this.getActiveInstances();
    const now = Date.now();
    const cleaned = instances.filter(i => 
      now - i.timestamp < SessionManager.INSTANCE_TIMEOUT
    );
    
    if (cleaned.length < instances.length) {
      console.log('📱 [SessionManager] Cleaned up stale instances:', {
        before: instances.length,
        after: cleaned.length
      });
      this.saveInstances(cleaned);
    }
  }

  /**
   * Unregister this instance
   */
  public unregisterInstance(): void {
    const instances = this.getActiveInstances();
    const filtered = instances.filter(i => i.id !== this.instanceId);
    this.saveInstances(filtered);
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    console.log('📱 [SessionManager] Unregistered instance:', this.instanceId);
  }

  /**
   * Get all active instances
   */
  private getActiveInstances(): SessionInstance[] {
    const stored = localStorage.getItem(SessionManager.STORAGE_KEY);
    if (!stored) return [];
    
    try {
      const instances = JSON.parse(stored) as SessionInstance[];
      // Filter out stale instances
      const now = Date.now();
      return instances.filter(i => now - i.timestamp < SessionManager.INSTANCE_TIMEOUT);
    } catch (error) {
      console.error('📱 [SessionManager] Error parsing instances:', error);
      return [];
    }
  }

  /**
   * Save instances to localStorage
   */
  private saveInstances(instances: SessionInstance[]): void {
    try {
      localStorage.setItem(SessionManager.STORAGE_KEY, JSON.stringify(instances));
    } catch (error) {
      console.error('📱 [SessionManager] Error saving instances:', error);
    }
  }

  /**
   * Check if running in PWA mode
   */
  private isPWA(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  /**
   * Get current user ID
   */
  private getCurrentUserId(): string | null {
    try {
      const userStr = localStorage.getItem('otakon_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.authUserId || user.id || null;
      }
    } catch (error) {
      console.error('📱 [SessionManager] Error getting user ID:', error);
    }
    return null;
  }

  /**
   * Get current user email
   */
  private getCurrentUserEmail(): string | null {
    try {
      const userStr = localStorage.getItem('otakon_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.email || null;
      }
    } catch (error) {
      console.error('📱 [SessionManager] Error getting user email:', error);
    }
    return null;
  }

  /**
   * Get all active instances (public method)
   */
  public getInstances(): SessionInstance[] {
    return this.getActiveInstances();
  }

  /**
   * Get info about this instance
   */
  public getInstanceInfo(): { id: string; type: string; userId: string | null } {
    return {
      id: this.instanceId,
      type: this.isPWA() ? 'PWA' : 'Browser',
      userId: this.getCurrentUserId()
    };
  }
}
