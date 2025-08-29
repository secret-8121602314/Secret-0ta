export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class PWAInstallService {
  private deferredPrompt: InstallPromptEvent | null = null;
  private listeners: Array<(prompt: InstallPromptEvent | null) => void> = [];

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA Install prompt detected');
      e.preventDefault();
      this.deferredPrompt = e as InstallPromptEvent;
      this.notifyListeners(this.deferredPrompt);
    });

    // Listen for the appinstalled event
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.deferredPrompt = null;
      // Mark as installed globally - this will hide banner on all screens
      localStorage.setItem('otakonPWAInstalled', 'true');
      localStorage.setItem('otakonGlobalPWAInstalled', 'true');
      this.notifyListeners(null);
    });

    // Check if already installed
    this.checkIfInstalled();
    
    // Initial check for install criteria after a short delay
    setTimeout(() => {
      this.checkInstallCriteria();
    }, 500);
  }

  private checkIfInstalled() {
    // Check if running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Check for iOS Safari standalone mode
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    // Check for other PWA indicators
    const hasInstalledPWA = localStorage.getItem('otakonPWAInstalled') === 'true';
    const hasGlobalInstallFlag = localStorage.getItem('otakonGlobalPWAInstalled') === 'true';
    const isInAppBrowser = this.isInAppBrowser();
    
    if (isStandalone || isIOSStandalone || hasInstalledPWA || hasGlobalInstallFlag) {
      console.log('PWA is already installed or marked as installed globally');
      this.notifyListeners(null);
    }
    
    // Additional check for app-like behavior
    if (this.isAppLike()) {
      console.log('App-like behavior detected, treating as installed');
      this.notifyListeners(null);
    }
  }

  private checkInstallCriteria() {
    const criteria = this.getInstallCriteria();
    
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
  isInstalled(): boolean {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const hasInstalledPWA = localStorage.getItem('otakonPWAInstalled') === 'true';
    const hasGlobalInstallFlag = localStorage.getItem('otakonGlobalPWAInstalled') === 'true';
    const isInAppBrowser = this.isInAppBrowser();
    const isAppLike = this.isAppLike();
    
    return isStandalone || isIOSStandalone || hasInstalledPWA || hasGlobalInstallFlag || isInAppBrowser || isAppLike;
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
  getInstallCriteria() {
    return {
      canInstall: this.canInstall(),
      isInstalled: this.isInstalled(),
      isMobile: this.isMobile(),
      isAndroid: this.isAndroid(),
      isIOS: this.isIOS(),
      hasManifest: !!document.querySelector('link[rel="manifest"]'),
      hasServiceWorker: 'serviceWorker' in navigator,
      isHTTPS: window.location.protocol === 'https:' || window.location.hostname === 'localhost'
    };
  }

  // Debug method to log all criteria
  debugInstallCriteria() {
    const criteria = this.getInstallCriteria();
    console.log('PWA Install Criteria:', criteria);
    return criteria;
  }

  // Manually mark PWA as installed (useful for testing)
  markAsInstalled() {
    localStorage.setItem('otakonPWAInstalled', 'true');
    localStorage.setItem('otakonGlobalPWAInstalled', 'true');
    this.notifyListeners(null);
    console.log('PWA manually marked as installed');
  }

  // Reset installation status (useful for testing)
  resetInstallationStatus() {
    localStorage.removeItem('otakonPWAInstalled');
    localStorage.removeItem('otakonGlobalPWAInstalled');
    localStorage.removeItem('otakonInstallDismissed');
    this.notifyListeners(this.deferredPrompt);
    console.log('PWA installation status reset');
  }
}

export const pwaInstallService = new PWAInstallService();
