/**
 * PWA Detection and Redirect Prevention Utility
 * 
 * Detects if app is running in PWA mode and prevents automatic redirects
 * when user opens app in browser while PWA is installed.
 */

/**
 * Check if app is running in PWA standalone mode
 */
export function isRunningAsPWA(): boolean {
  // Check display mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // Check if running as installed PWA (iOS)
  const isIOSStandalone = (window.navigator as any).standalone === true;
  
  // Check URL parameter (set by manifest start_url)
  const urlParams = new URLSearchParams(window.location.search);
  const standaloneParam = urlParams.get('standalone') === 'true';
  
  return isStandalone || isIOSStandalone || standaloneParam;
}

/**
 * Check if PWA is installed (different from running as PWA)
 */
export function isPWAInstalled(): boolean {
  // Check if beforeinstallprompt was prevented (means already installed)
  const wasInstalled = localStorage.getItem('pwa_installed') === 'true';
  
  // Check if running as PWA
  const runningAsPWA = isRunningAsPWA();
  
  return wasInstalled || runningAsPWA;
}

/**
 * Mark PWA as installed
 */
export function markPWAAsInstalled(): void {
  localStorage.setItem('pwa_installed', 'true');
  console.log('✅ [PWA] Marked as installed');
}

/**
 * Should prevent automatic redirect to PWA
 * Returns true if we should stay in browser (not redirect to PWA)
 */
export function shouldPreventPWARedirect(): boolean {
  // If already running as PWA, no need to redirect
  if (isRunningAsPWA()) {
    return true;
  }
  
  // Check if user explicitly wants to use browser
  const preferBrowser = sessionStorage.getItem('prefer_browser') === 'true';
  
  // Don't redirect if user prefers browser
  return preferBrowser;
}

/**
 * Set user preference to stay in browser
 */
export function setPreferBrowser(prefer: boolean): void {
  if (prefer) {
    sessionStorage.setItem('prefer_browser', 'true');
  } else {
    sessionStorage.removeItem('prefer_browser');
  }
}

/**
 * Log PWA detection info for debugging
 */
export function logPWAStatus(): void {
  console.log('📱 [PWA Detection]', {
    isRunningAsPWA: isRunningAsPWA(),
    isPWAInstalled: isPWAInstalled(),
    shouldPreventRedirect: shouldPreventPWARedirect(),
    displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    userAgent: navigator.userAgent,
  });
}
