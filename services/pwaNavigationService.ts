import { authService, AuthState } from './supabase';
import { supabaseDataService } from './supabaseDataService';
import { unifiedDataService, STORAGE_KEYS } from './unifiedDataService';

export interface PWANavigationState {
  isPWAInstalled: boolean;
  isRunningInPWA: boolean;
  shouldShowLogin: boolean;
  shouldShowChat: boolean;
  isHandsFreeEnabled: boolean;
}

class PWANavigationService {
  private static instance: PWANavigationService;
  private navigationState: PWANavigationState = {
    isPWAInstalled: false,
    isRunningInPWA: false,
    shouldShowLogin: true,
    shouldShowChat: false,
    isHandsFreeEnabled: false,
  };

  private listeners: Set<(state: PWANavigationState) => void> = new Set();
  private hasLoggedPWADetection: boolean = false;

  static getInstance(): PWANavigationService {
    if (!PWANavigationService.instance) {
      PWANavigationService.instance = new PWANavigationService();
    }
    return PWANavigationService.instance;
  }

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Check if running in PWA mode
    this.checkPWAMode();
    
    // Listen for auth state changes
    authService.subscribe(this.handleAuthStateChange.bind(this));
    
    // Listen for visibility changes (app coming to foreground)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Listen for app focus events
    window.addEventListener('focus', this.handleAppFocus.bind(this));
    
    // Check for hands-free preference
    this.checkHandsFreePreference();
  }

  private checkPWAMode() {
    // Check if running in standalone mode (PWA installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Check for iOS Safari standalone mode
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    // Check if running in PWA context
    const isRunningInPWA = isStandalone || isIOSStandalone;
    
    this.navigationState.isPWAInstalled = isRunningInPWA;
    this.navigationState.isRunningInPWA = isRunningInPWA;
    
    // Only log PWA detection once
    if (!this.hasLoggedPWADetection) {
      console.log('PWA Navigation: PWA mode detected:', isRunningInPWA);
      this.hasLoggedPWADetection = true;
    }
    
    this.notifyListeners();
  }

  private handleAuthStateChange(authState: AuthState) {
    const shouldShowLogin = !authState.user && !authState.loading;
    const shouldShowChat = !!authState.user && !authState.loading;
    
    // Only log when there's an actual change
    if (this.navigationState.shouldShowLogin !== shouldShowLogin || this.navigationState.shouldShowChat !== shouldShowChat) {
      console.log('PWA Navigation: Auth state changed:', { shouldShowLogin, shouldShowChat });
    }
    
    this.navigationState.shouldShowLogin = shouldShowLogin;
    this.navigationState.shouldShowChat = shouldShowChat;
    
    this.notifyListeners();
  }

  private handleVisibilityChange() {
    // When app becomes visible (user returns to app)
    if (!document.hidden) {
      console.log('PWA Navigation: App became visible');
      this.checkPWAMode();
      this.checkHandsFreePreference();
    }
  }

  private handleAppFocus() {
    // When app gains focus
    console.log('PWA Navigation: App gained focus');
    this.checkPWAMode();
  }

  private async checkHandsFreePreference() {
    // Check if hands-free was enabled in the app
    try {
      // Use unified data service for consistent pattern
      const result = await unifiedDataService.getUserPreferences();
      const handsFreeEnabled = result.data.pwa?.handsFree === true;
      
      this.navigationState.isHandsFreeEnabled = handsFreeEnabled;
      console.log('PWA Navigation: Hands-free preference loaded from unified service:', handsFreeEnabled);
    } catch (error) {
      console.warn('Failed to get hands-free preference from unified service, using localStorage fallback:', error);
      
      // Fallback to localStorage
      const localHandsFree = localStorage.getItem(STORAGE_KEYS.PWA_SETTINGS);
      if (localHandsFree) {
        try {
          const pwaSettings = JSON.parse(localHandsFree);
          this.navigationState.isHandsFreeEnabled = pwaSettings.handsFree === true;
          console.log('PWA Navigation: Hands-free preference loaded from localStorage:', this.navigationState.isHandsFreeEnabled);
        } catch (parseError) {
          console.warn('Failed to parse localStorage hands-free preference:', parseError);
          this.navigationState.isHandsFreeEnabled = false;
        }
      } else {
        this.navigationState.isHandsFreeEnabled = false;
      }
    }
    
    this.notifyListeners();
  }

  private enableHandsFreeInBackground() {
    // Enable hands-free functionality even when app is in background
    if ('serviceWorker' in navigator && 'WakeLock' in window) {
      // Request wake lock to keep device awake
      this.requestWakeLock();
      
      // Enable background audio processing
      this.enableBackgroundAudio();
    }
  }

  private async requestWakeLock() {
    try {
      // @ts-ignore - WakeLock API
      const wakeLock = await navigator.wakeLock.request('screen');
      console.log('PWA Navigation: Wake lock acquired for hands-free mode');
      
      // Release wake lock when app loses focus
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          wakeLock.release();
        }
      });
    } catch (error) {
      console.log('PWA Navigation: Wake lock not available:', error);
    }
  }

  private enableBackgroundAudio() {
    // Enable background audio processing for hands-free
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        console.log('PWA Navigation: Background play action');
      });
      
      navigator.mediaSession.setActionHandler('pause', () => {
        console.log('PWA Navigation: Background pause action');
      });
    }
  }

  // Get current navigation state
  getNavigationState(): PWANavigationState {
    return { ...this.navigationState };
  }

  // Subscribe to navigation state changes
  subscribe(callback: (state: PWANavigationState) => void): () => void {
    this.listeners.add(callback);
    
    // Immediately call with current state
    callback(this.navigationState);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.navigationState));
  }

  // Set hands-free preference
  async setHandsFreePreference(enabled: boolean) {
    try {
      // Update in Supabase
      await supabaseDataService.updateUserPreferences('pwa', { handsFreeEnabled: enabled });
      
      // Also update localStorage as backup
      localStorage.setItem('otakonHandsFreeEnabled', enabled.toString());
    } catch (error) {
      console.warn('Failed to update hands-free preference in Supabase, using localStorage only:', error);
      
      // Fallback to localStorage only
      localStorage.setItem('otakonHandsFreeEnabled', enabled.toString());
    }
    
    this.navigationState.isHandsFreeEnabled = enabled;
    
    if (enabled && this.navigationState.isRunningInPWA) {
      this.enableHandsFreeInBackground();
    }
    
    this.notifyListeners();
  }

  // Get recommended navigation path
  getRecommendedNavigationPath(): 'login' | 'chat' | 'onboarding' {
    if (this.navigationState.shouldShowLogin) {
      return 'login';
    } else if (this.navigationState.shouldShowChat) {
      return 'chat';
    } else {
      return 'onboarding';
    }
  }
}

export const pwaNavigationService = PWANavigationService.getInstance();
