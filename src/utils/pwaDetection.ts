/**
 * PWA Detection Utilities
 * Provides consistent PWA mode detection across the application
 */

/**
 * Check if app is running in PWA (standalone) mode
 */
export const isPWAMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

/**
 * Check if running as iOS PWA
 */
export const isIOSPWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (window.navigator as any).standalone === true;
};

/**
 * Check if running as Android PWA
 */
export const isAndroidPWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    document.referrer.includes('android-app://')
  );
};

/**
 * Get current PWA display mode
 */
export const getPWADisplayMode = (): 'standalone' | 'browser' | 'fullscreen' | 'minimal-ui' => {
  if (typeof window === 'undefined') return 'browser';
  
  if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen';
  if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone';
  if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui';
  return 'browser';
};

/**
 * Check if app is installed (different from currently running in PWA mode)
 */
export const isAppInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check if previously marked as installed
  if (localStorage.getItem('otakon_pwa_installed') === 'true') {
    return true;
  }
  
  // Check if currently running in PWA mode
  return isPWAMode();
};

/**
 * Mark app as installed
 */
export const markAppAsInstalled = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('otakon_pwa_installed', 'true');
  }
};

/**
 * Get platform type
 */
export const getPlatform = (): 'ios' | 'android' | 'desktop' | 'unknown' => {
  if (typeof window === 'undefined') return 'unknown';
  
  const ua = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/windows|mac|linux/.test(ua)) return 'desktop';
  
  return 'unknown';
};

/**
 * Check if beforeinstallprompt is supported (for install banner)
 */
export const supportsInstallPrompt = (): boolean => {
  return 'BeforeInstallPromptEvent' in window;
};
