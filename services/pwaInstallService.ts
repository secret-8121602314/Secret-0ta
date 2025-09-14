import { supabaseDataService } from './supabaseDataService';
import { unifiedDataService, STORAGE_KEYS } from './unifiedDataService';
import { authService } from './supabase';

export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallServiceInterface {
  canInstall(): boolean;
  isInstalled(): Promise<boolean>;
  isMobile(): boolean;
  isAndroid(): boolean;
  isIOS(): boolean;
  isInAppBrowser(): boolean;
  isAppLike(): boolean;
  showInstallPrompt(): Promise<boolean>;
  addListener(callback: (prompt: InstallPromptEvent | null) => void): void;
  removeListener(callback: (prompt: InstallPromptEvent | null) => void): void;
  getInstallCriteria(): Promise<any>;
  debugInstallCriteria(): Promise<any>;
  markAsInstalled(): Promise<void>;
  resetInstallationStatus(): Promise<void>;
}

class PWAInstallService implements PWAInstallServiceInterface {
  private deferredPrompt: InstallPromptEvent | null = null;
  private listeners: ((prompt: InstallPromptEvent | null) => void)[] = [];

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as InstallPromptEvent;
      console.log('PWA install prompt available');
      this.notifyListeners(this.deferredPrompt);
    });

    // Listen for the appinstalled event
    window.addEventListener('appinstalled', async () => {
      console.log('PWA was installed');
      this.deferredPrompt = null;
      
      try {
        // Use unified data service for consistent pattern
        await unifiedDataService.updateUserAppState('pwaInstalled', true);
        await unifiedDataService.updateUserAppState('pwaGlobalInstalled', true);
        
        // Also update localStorage as backup
        localStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
        localStorage.setItem(STORAGE_KEYS.PWA_GLOBAL_INSTALLED, 'true');
        
        console.log('✅ PWA install state updated via unified service');
      } catch (error) {
        console.warn('Failed to update PWA install state via unified service, using localStorage only:', error);
        // Fallback to localStorage only
        localStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
        localStorage.setItem(STORAGE_KEYS.PWA_GLOBAL_INSTALLED, 'true');
      }
      
      this.notifyListeners(null);
    });

    // Check if already installed
    this.checkIfInstalled();
    
    // Initial check for install criteria after a short delay
    setTimeout(() => {
      this.checkInstallCriteria();
    }, 500);
  }

  private async checkIfInstalled() {
    try {
      // Check if running in standalone mode (installed)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      // Check for iOS Safari standalone mode
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      // Check for PWA install state from unified service
      let hasInstalledPWA = false;
      let hasGlobalInstallFlag = false;
      
      try {
        const result = await unifiedDataService.getUserAppState();
        hasInstalledPWA = result.data.pwaInstalled === true;
        hasGlobalInstallFlag = result.data.pwaGlobalInstalled === true;
      } catch (error) {
        // User not authenticated, will use localStorage fallback
        if (import.meta.env.DEV) {
          console.log('PWA: User not authenticated, using localStorage fallback');
        }
      }
      
      // Fallback to localStorage if unified service data not available
      const localHasInstalledPWA = localStorage.getItem(STORAGE_KEYS.PWA_INSTALLED) === 'true';
      const localHasGlobalInstallFlag = localStorage.getItem(STORAGE_KEYS.PWA_GLOBAL_INSTALLED) === 'true';
      
      const finalHasInstalledPWA = hasInstalledPWA || localHasInstalledPWA;
      const finalHasGlobalInstallFlag = hasGlobalInstallFlag || localHasGlobalInstallFlag;
      
      const isInAppBrowser = this.isInAppBrowser();
      
      if (isStandalone || isIOSStandalone || finalHasInstalledPWA || finalHasGlobalInstallFlag) {
        console.log('PWA is already installed or marked as installed globally');
        this.notifyListeners(null);
      }
      
      // Additional check for app-like behavior
      if (this.isAppLike()) {
        console.log('App-like behavior detected, treating as installed');
        this.notifyListeners(null);
      }
    } catch (error) {
      console.warn('Failed to check PWA install state from Supabase, using localStorage fallback:', error);
      // Fallback to localStorage only
      const hasInstalledPWA = localStorage.getItem('otakonPWAInstalled') === 'true';
      const hasGlobalInstallFlag = localStorage.getItem('otakonGlobalPWAInstalled') === 'true';
      
      if (hasInstalledPWA || hasGlobalInstallFlag) {
        console.log('PWA is already installed (localStorage fallback)');
        this.notifyListeners(null);
      }
    }
  }

  private async checkInstallCriteria() {
    const criteria = await this.getInstallCriteria();
    
    // If we can install and haven't notified yet, notify listeners
    if (criteria.canInstall && !this.deferredPrompt) {
      this.notifyListeners(this.deferredPrompt);
    }
  }

  // Check if PWA can be installed
  canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  // Check if PWA is already installed
  async isInstalled(): Promise<boolean> {
    try {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      // Check Supabase first (only if authenticated)
      let hasInstalledPWA = false;
      let hasGlobalInstallFlag = false;
      
      try {
        // Check if user is authenticated before trying to fetch from Supabase
        const authState = authService.getCurrentState();
        if (!authState.user) {
          // User not authenticated, will use localStorage fallback
          // Only log in development mode to reduce console noise
          if (import.meta.env.DEV) {
            console.log('PWA: User not authenticated, using localStorage fallback');
          }
        } else {
          const appState = await supabaseDataService.getUserAppState();
          hasInstalledPWA = appState.pwaInstalled === true;
          hasGlobalInstallFlag = appState.pwaGlobalInstalled === true;
        }
      } catch (error) {
        // User not authenticated, will use localStorage fallback
        // Only log in development mode to reduce console noise
        if (import.meta.env.DEV) {
          console.log('PWA: User not authenticated, using localStorage fallback');
        }
      }
      
      // Fallback to localStorage
      const localHasInstalledPWA = localStorage.getItem('otakonPWAInstalled') === 'true';
      const localHasGlobalInstallFlag = localStorage.getItem('otakonGlobalPWAInstalled') === 'true';
      
      const finalHasInstalledPWA = hasInstalledPWA || localHasInstalledPWA;
      const finalHasGlobalInstallFlag = hasGlobalInstallFlag || localHasGlobalInstallFlag;
      
      const isInAppBrowser = this.isInAppBrowser();
      const isAppLike = this.isAppLike();
      
      return isStandalone || isIOSStandalone || finalHasInstalledPWA || finalHasGlobalInstallFlag || isInAppBrowser || isAppLike;
    } catch (error) {
      console.warn('Failed to check PWA install state from Supabase, using localStorage fallback:', error);
      // Fallback to localStorage only
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      const hasInstalledPWA = localStorage.getItem('otakonPWAInstalled') === 'true';
      const hasGlobalInstallFlag = localStorage.getItem('otakonGlobalPWAInstalled') === 'true';
      const isInAppBrowser = this.isInAppBrowser();
      const isAppLike = this.isAppLike();
      
      return isStandalone || isIOSStandalone || hasInstalledPWA || hasGlobalInstallFlag || isInAppBrowser || isAppLike;
    }
  }

  // Check if running on mobile
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Check if running on Android
  isAndroid(): boolean {
    return /Android/i.test(navigator.userAgent);
  }

  // Check if running on iOS
  isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  // Check if running in an in-app browser (social media, etc.)
  isInAppBrowser(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('instagram') || 
           userAgent.includes('fbav') || 
           userAgent.includes('fban') || 
           userAgent.includes('twitter') ||
           userAgent.includes('linkedin') ||
           userAgent.includes('whatsapp');
  }

  // Check if the app behaves like a native app
  isAppLike(): boolean {
    // Check for app-like features
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    const hasNotification = 'Notification' in window;
    const hasInstallPrompt = this.deferredPrompt !== null;
    
    // If we have most PWA features, treat as app-like
    return hasServiceWorker && (hasPushManager || hasNotification || hasInstallPrompt);
  }

  // Show the install prompt
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('No install prompt available');
      return false;
    }

    try {
      console.log('Showing PWA install prompt');
      this.deferredPrompt.prompt();
      
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      
      if (outcome === 'accepted') {
        this.deferredPrompt = null;
        this.notifyListeners(null);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return false;
    }
  }

  // Add listener for install prompt changes
  addListener(callback: (prompt: InstallPromptEvent | null) => void) {
    this.listeners.push(callback);
    // Immediately call with current state
    callback(this.deferredPrompt);
  }

  // Remove listener
  removeListener(callback: (prompt: InstallPromptEvent | null) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  private notifyListeners(prompt: InstallPromptEvent | null) {
    this.listeners.forEach(listener => listener(prompt));
  }

  // Get PWA install criteria status
  async getInstallCriteria() {
    const isInstalled = await this.isInstalled();
    
    return {
      canInstall: this.canInstall(),
      isInstalled,
      isMobile: this.isMobile(),
      isAndroid: this.isAndroid(),
      isIOS: this.isIOS(),
      hasManifest: !!document.querySelector('link[rel="manifest"]'),
      hasServiceWorker: 'serviceWorker' in navigator,
      isHTTPS: window.location.protocol === 'https:' || window.location.hostname === 'localhost'
    };
  }

  // Debug method to log all criteria
  async debugInstallCriteria() {
    const criteria = await this.getInstallCriteria();
    console.log('PWA Install Criteria:', criteria);
    return criteria;
  }

  // Manually mark PWA as installed (useful for testing)
  async markAsInstalled() {
    try {
      // Update in Supabase (only if authenticated)
      try {
        await supabaseDataService.updateUserAppState('pwaInstalled', true);
        await supabaseDataService.updateUserAppState('pwaGlobalInstalled', true);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.log('PWA: User not authenticated, updating localStorage only');
        }
      }
      
      // Also update localStorage as backup
      localStorage.setItem('otakonPWAInstalled', 'true');
      localStorage.setItem('otakonGlobalPWAInstalled', 'true');
      
      console.log('✅ PWA manually marked as installed in Supabase');
    } catch (error) {
      console.warn('Failed to mark PWA as installed in Supabase, using localStorage only:', error);
      // Fallback to localStorage only
      localStorage.setItem('otakonPWAInstalled', 'true');
      localStorage.setItem('otakonGlobalPWAInstalled', 'true');
    }
    
    this.notifyListeners(null);
  }

  // Reset installation status (useful for testing)
  async resetInstallationStatus() {
    try {
      // Clear from Supabase (only if authenticated)
      try {
        await supabaseDataService.updateUserAppState('pwaInstalled', false);
        await supabaseDataService.updateUserAppState('pwaGlobalInstalled', false);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.log('PWA: User not authenticated, clearing localStorage only');
        }
      }
      
      // Also clear localStorage
      localStorage.removeItem('otakonPWAInstalled');
      localStorage.removeItem('otakonGlobalPWAInstalled');
      localStorage.removeItem('otakonInstallDismissed');
      
      console.log('✅ PWA installation status reset in Supabase');
    } catch (error) {
      console.warn('Failed to reset PWA installation status in Supabase, using localStorage only:', error);
      // Fallback to localStorage only
      localStorage.removeItem('otakonPWAInstalled');
      localStorage.removeItem('otakonGlobalPWAInstalled');
      localStorage.removeItem('otakonInstallDismissed');
    }
    
    this.notifyListeners(this.deferredPrompt);
  }
}

export const pwaInstallService = new PWAInstallService();
