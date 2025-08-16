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
      this.notifyListeners(null);
    });

    // Check if already installed
    this.checkIfInstalled();
  }

  private checkIfInstalled() {
    // Check if running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Check for iOS Safari standalone mode
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    if (isStandalone || isIOSStandalone) {
      console.log('PWA is already installed');
      this.notifyListeners(null);
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
    return isStandalone || isIOSStandalone;
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
}

export const pwaInstallService = new PWAInstallService();
