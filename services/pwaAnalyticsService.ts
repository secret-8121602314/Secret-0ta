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
  trackInstall(success: boolean, method: string, timeToInstall?: number): Promise<void>;
  trackEngagement(eventType: string, data?: any): Promise<void>;
  getInstallStats(): Promise<PWAInstallEvent[]>;
  getEngagementStats(): Promise<PWAEngagementEvent[]>;
  exportData(): Promise<string>;
  clearData(): Promise<void>;
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

  async trackInstall(success: boolean, method: string, timeToInstall: number = 0): Promise<void> {
    const installEvent: PWAInstallEvent = {
      timestamp: Date.now(),
      success,
      platform: this.getPlatform(),
      userAgent: navigator.userAgent,
      installMethod: method as 'banner' | 'manual' | 'prompt',
      timeToInstall
    };

    try {
      // Try to update in Supabase first
      const existingData = await this.getInstallStats();
      existingData.push(installEvent);
      
      // Keep only last 100 install events
      if (existingData.length > 100) {
        existingData.splice(0, existingData.length - 100);
      }

      await supabaseDataService.updateUserAppState('pwaAnalytics', { installs: existingData });
      
      // Also update localStorage as backup
      localStorage.setItem(this.STORAGE_KEY_INSTALLS, JSON.stringify(existingData));
      
      console.log('✅ PWA Install tracked in Supabase:', installEvent);
    } catch (error) {
      console.warn('Supabase PWA install tracking failed, using localStorage fallback:', error);
      // Fallback to localStorage only
      const existingData = this.getLocalStorageInstalls();
      existingData.push(installEvent);
      
      if (existingData.length > 100) {
        existingData.splice(0, existingData.length - 100);
      }
      
      localStorage.setItem(this.STORAGE_KEY_INSTALLS, JSON.stringify(existingData));
      console.log('PWA Install tracked (localStorage fallback):', installEvent);
    }
  }

  async trackEngagement(eventType: string, data?: any): Promise<void> {
    const engagementEvent: PWAEngagementEvent = {
      timestamp: Date.now(),
      eventType: eventType as any,
      ...data
    };

    try {
      // Try to update in Supabase first
      const existingData = await this.getEngagementStats();
      existingData.push(engagementEvent);
      
      // Keep only last 500 engagement events
      if (existingData.length > 500) {
        existingData.splice(0, existingData.length - 500);
      }

      await supabaseDataService.updateUserAppState('pwaAnalytics', { engagement: existingData });
      
      // Also update localStorage as backup
      localStorage.setItem(this.STORAGE_KEY_ENGAGEMENT, JSON.stringify(existingData));
      
      console.log('✅ PWA Engagement tracked in Supabase:', engagementEvent);
    } catch (error) {
      console.warn('Supabase PWA engagement tracking failed, using localStorage fallback:', error);
      // Fallback to localStorage only
      const existingData = this.getLocalStorageEngagement();
      existingData.push(engagementEvent);
      
      if (existingData.length > 500) {
        existingData.splice(0, existingData.length - 500);
      }
      
      localStorage.setItem(this.STORAGE_KEY_ENGAGEMENT, JSON.stringify(existingData));
      console.log('PWA Engagement tracked (localStorage fallback):', engagementEvent);
    }
  }

  async getInstallStats(): Promise<PWAInstallEvent[]> {
    try {
      // Try to get from Supabase first
      const supabaseData = await supabaseDataService.getUserAppState();
      const pwaAnalytics = supabaseData.pwaAnalytics;
      const pwaInstalls = pwaAnalytics?.installs;
      
      if (pwaInstalls && Array.isArray(pwaInstalls)) {
        return pwaInstalls as PWAInstallEvent[];
      }
      
      // If no Supabase data, try localStorage
      return this.getLocalStorageInstalls();
    } catch (error) {
      console.warn('Supabase PWA install stats fetch failed, using localStorage fallback:', error);
      return this.getLocalStorageInstalls();
    }
  }

  async getEngagementStats(): Promise<PWAEngagementEvent[]> {
    try {
      // Try to get from Supabase first
      const supabaseData = await supabaseDataService.getUserAppState();
      const pwaAnalytics = supabaseData.pwaAnalytics;
      const pwaEngagement = pwaAnalytics?.engagement;
      
      if (pwaEngagement && Array.isArray(pwaEngagement)) {
        return pwaEngagement as PWAEngagementEvent[];
      }
      
      // If no Supabase data, try localStorage
      return this.getLocalStorageEngagement();
    } catch (error) {
      console.warn('Supabase PWA engagement stats fetch failed, using localStorage fallback:', error);
      return this.getLocalStorageEngagement();
    }
  }

  async exportData(): Promise<string> {
    try {
      const installStats = await this.getInstallStats();
      const engagementStats = await this.getEngagementStats();
      
      const exportData = {
        installs: installStats,
        engagement: engagementStats,
        exportedAt: new Date().toISOString()
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export PWA analytics data:', error);
      return JSON.stringify({ error: 'Export failed', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async clearData(): Promise<void> {
    try {
      // Clear from Supabase
      await supabaseDataService.updateUserAppState('pwaAnalytics', { installs: [], engagement: [] });
      
      // Also clear localStorage
      localStorage.removeItem(this.STORAGE_KEY_INSTALLS);
      localStorage.removeItem(this.STORAGE_KEY_ENGAGEMENT);
      
      console.log('✅ PWA analytics data cleared from Supabase and localStorage');
    } catch (error) {
      console.error('Failed to clear PWA analytics data:', error);
      // Still try to clear localStorage
      localStorage.removeItem(this.STORAGE_KEY_INSTALLS);
      localStorage.removeItem(this.STORAGE_KEY_ENGAGEMENT);
    }
  }

  // Helper methods for localStorage fallback
  private getLocalStorageInstalls(): PWAInstallEvent[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_INSTALLS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getLocalStorageEngagement(): PWAEngagementEvent[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_ENGAGEMENT);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
    if (userAgent.includes('windows')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('linux')) return 'linux';
    return 'unknown';
  }
}

// Add missing methods for backward compatibility
const pwaAnalyticsServiceInstance = new PWAAnalyticsServiceImpl();

export const pwaAnalyticsService = {
  ...pwaAnalyticsServiceInstance,
  // Add missing methods for backward compatibility
  trackSessionStart: async () => {
    try {
      await pwaAnalyticsServiceInstance.trackEngagement('launch');
      console.log('✅ Session start tracked');
    } catch (error) {
      console.warn('Failed to track session start:', error);
    }
  }
};
