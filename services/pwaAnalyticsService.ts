import { supabaseDataService } from './supabaseDataService';

export interface PWAInstallEvent {
  timestamp: number;
  success: boolean;
  platform: string;
  userAgent: string;
  installMethod: 'banner' | 'manual' | 'prompt';
  timeToInstall: number;
}

export interface PWAEngagementEvent {
  timestamp: number;
  eventType: 'launch' | 'background_sync' | 'offline_use' | 'hands_free' | 'shortcut_used';
  sessionDuration?: number;
  offlineDuration?: number;
}

export interface PWAAnalyticsService {
  trackInstall(success: boolean, method: string, timeToInstall?: number): void;
  trackEngagement(eventType: string, data?: any): void;
  getInstallStats(): PWAInstallEvent[];
  getEngagementStats(): PWAEngagementEvent[];
  exportData(): string;
  clearData(): void;
}

class PWAAnalyticsServiceImpl implements PWAAnalyticsService {
  private readonly STORAGE_KEY_INSTALLS = 'otakon_pwa_installs';
  private readonly STORAGE_KEY_ENGAGEMENT = 'otakon_pwa_engagement';
  private installStartTime: number = 0;

  constructor() {
    this.initializeInstallTracking();
  }

  private initializeInstallTracking(): void {
    // Listen for beforeinstallprompt to start timing
    window.addEventListener('beforeinstallprompt', () => {
      this.installStartTime = Date.now();
    });

    // Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
      const timeToInstall = this.installStartTime ? Date.now() - this.installStartTime : 0;
      this.trackInstall(true, 'prompt', timeToInstall);
    });
  }

  trackInstall(success: boolean, method: string, timeToInstall: number = 0): void {
    const installEvent: PWAInstallEvent = {
      timestamp: Date.now(),
      success,
      platform: this.getPlatform(),
      userAgent: navigator.userAgent,
      installMethod: method as 'banner' | 'manual' | 'prompt',
      timeToInstall
    };

    const existingData = this.getInstallStats();
    existingData.push(installEvent);
    
    // Keep only last 100 install events
    if (existingData.length > 100) {
      existingData.splice(0, existingData.length - 100);
    }

    // Update in Supabase with localStorage fallback
    this.updatePWAAnalytics('installs', existingData);
    
    console.log('PWA Install tracked:', installEvent);
  }

  trackEngagement(eventType: string, data?: any): void {
    const engagementEvent: PWAEngagementEvent = {
      timestamp: Date.now(),
      eventType: eventType as any,
      ...data
    };

    const existingData = this.getEngagementStats();
    existingData.push(engagementEvent);
    
    // Keep only last 500 engagement events
    if (existingData.length > 500) {
      existingData.splice(0, existingData.length - 500);
    }

    // Update in Supabase with localStorage fallback
    this.updatePWAAnalytics('engagement', existingData);
    
    console.log('PWA Engagement tracked:', engagementEvent);
  }

  getInstallStats(): PWAInstallEvent[] {
    try {
      // Try to get from Supabase first
      this.loadPWAAnalyticsFromSupabase();
      
      // Fallback to localStorage
      const data = localStorage.getItem(this.STORAGE_KEY_INSTALLS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get install stats:', error);
      return [];
    }
  }

  getEngagementStats(): PWAEngagementEvent[] {
    try {
      // Try to get from Supabase first
      this.loadPWAAnalyticsFromSupabase();
      
      // Fallback to localStorage
      const data = localStorage.getItem(this.STORAGE_KEY_ENGAGEMENT);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get engagement stats:', error);
      return [];
    }
  }

  exportData(): string {
    const data = {
      installs: this.getInstallStats(),
      engagement: this.getEngagementStats(),
      exportDate: new Date().toISOString(),
      summary: this.getSummaryStats()
    };

    return JSON.stringify(data, null, 2);
  }

  clearData(): void {
    localStorage.removeItem(this.STORAGE_KEY_INSTALLS);
    localStorage.removeItem(this.STORAGE_KEY_ENGAGEMENT);
    console.log('PWA Analytics data cleared');
  }

  private getPlatform(): string {
    if (/Android/i.test(navigator.userAgent)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) return 'iOS';
    if (/Windows/i.test(navigator.userAgent)) return 'Windows';
    if (/Mac/i.test(navigator.userAgent)) return 'macOS';
    if (/Linux/i.test(navigator.userAgent)) return 'Linux';
    return 'Unknown';
  }

  private getSummaryStats(): any {
    const installs = this.getInstallStats();
    const engagement = this.getEngagementStats();

    const successfulInstalls = installs.filter(i => i.success).length;
    const totalInstalls = installs.length;
    const successRate = totalInstalls > 0 ? (successfulInstalls / totalInstalls) * 100 : 0;

    const avgTimeToInstall = installs.length > 0 
      ? installs.reduce((sum, i) => sum + i.timeToInstall, 0) / installs.length 
      : 0;

    return {
      totalInstalls,
      successfulInstalls,
      successRate: successRate.toFixed(2) + '%',
      avgTimeToInstall: Math.round(avgTimeToInstall) + 'ms',
      totalEngagementEvents: engagement.length,
      lastEvent: engagement.length > 0 ? new Date(engagement[engagement.length - 1].timestamp).toISOString() : 'None'
    };
  }

  private async updatePWAAnalytics(type: 'installs' | 'engagement', data: any[]): Promise<void> {
    try {
      // Update in Supabase
      await supabaseDataService.updateUserAppState('pwaAnalytics', {
        [type]: data,
        lastUpdated: Date.now()
      });
      
      // Also update localStorage as backup
      if (type === 'installs') {
        localStorage.setItem(this.STORAGE_KEY_INSTALLS, JSON.stringify(data));
      } else {
        localStorage.setItem(this.STORAGE_KEY_ENGAGEMENT, JSON.stringify(data));
      }
    } catch (error) {
      console.warn('Failed to update PWA analytics in Supabase, using localStorage only:', error);
      
      // Fallback to localStorage only
      if (type === 'installs') {
        localStorage.setItem(this.STORAGE_KEY_INSTALLS, JSON.stringify(data));
      } else {
        localStorage.setItem(this.STORAGE_KEY_ENGAGEMENT, JSON.stringify(data));
      }
    }
  }

  private async loadPWAAnalyticsFromSupabase(): Promise<void> {
    try {
      const appState = await supabaseDataService.getUserAppState();
      const pwaAnalytics = appState.pwaAnalytics || {};
      
      if (pwaAnalytics.installs) {
        localStorage.setItem(this.STORAGE_KEY_INSTALLS, JSON.stringify(pwaAnalytics.installs));
      }
      
      if (pwaAnalytics.engagement) {
        localStorage.setItem(this.STORAGE_KEY_ENGAGEMENT, JSON.stringify(pwaAnalytics.engagement));
      }
    } catch (error) {
      console.warn('Failed to load PWA analytics from Supabase:', error);
      // Continue with localStorage data
    }
  }

  // Track session start
  trackSessionStart(): void {
    this.trackEngagement('launch');
  }

  // Track offline usage
  trackOfflineUsage(duration: number): void {
    this.trackEngagement('offline_use', { offlineDuration: duration });
  }

  // Track hands-free usage
  trackHandsFreeUsage(): void {
    this.trackEngagement('hands_free');
  }

  // Track shortcut usage
  trackShortcutUsage(shortcutName: string): void {
    this.trackEngagement('shortcut_used', { shortcutName });
  }
}

export const pwaAnalyticsService = new PWAAnalyticsServiceImpl();
