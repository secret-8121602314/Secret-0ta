import React, { useState, useEffect } from 'react';
import { isPWAMode, markAppAsInstalled } from '../../utils/pwaDetection';

interface PWAInstallBannerProps {
  className?: string;
}

const BANNER_DISMISS_KEY = 'otakon_pwa_banner_dismissed';
const GLOBAL_PROMPT_KEY = '__otagon_beforeinstallprompt';

const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [hasPrompt, setHasPrompt] = useState(false);
  const [showBanner, setShowBanner] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(BANNER_DISMISS_KEY) !== 'true';
  });
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running in standalone mode (PWA)
      if (isPWAMode()) {
        setIsInstalled(true);
        markAppAsInstalled();
        return;
      }
      
      // Check if app was previously installed
      if (localStorage.getItem('otakon_pwa_installed') === 'true') {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    const globalPrompt = (window as any)[GLOBAL_PROMPT_KEY];
    if (globalPrompt) {
      setDeferredPrompt(globalPrompt);
      setHasPrompt(true);
      setShowBanner(true);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any)[GLOBAL_PROMPT_KEY] = e;
      setDeferredPrompt(e);
      setHasPrompt(true);
      sessionStorage.removeItem(BANNER_DISMISS_KEY);
      setShowBanner(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      markAppAsInstalled();
      sessionStorage.removeItem(BANNER_DISMISS_KEY);
      (window as any)[GLOBAL_PROMPT_KEY] = null;
      setHasPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (sessionStorage.getItem(BANNER_DISMISS_KEY) === 'true') {
      setShowBanner(false);
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback instructions already shown in banner
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem(BANNER_DISMISS_KEY, 'true');
  };

  // Don't show if banner was manually dismissed this session
  if (!showBanner) {
    return null;
  }
  
  // If already installed, show a simple "Already Installed" message
  if (isInstalled) {
    return (
      <div className={`bg-gradient-to-r from-green-900/30 to-green-800/30 backdrop-blur-xl border border-green-700/60 rounded-xl p-3 text-center ${className}`}>
        <div className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
          <p className="text-sm font-medium text-green-300">App Installed</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-[#1C1C1C]/90 to-[#0A0A0A]/90 backdrop-blur-xl border border-neutral-700/60 rounded-xl p-4 text-center ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-[#E53A3A] to-[#FFAB40] rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">Install Otagon</p>
            <p className="text-xs text-neutral-400">Get the full app experience</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleInstallClick}
            disabled={!hasPrompt}
            className={`px-3 py-1.5 bg-gradient-to-r from-[#E53A3A] to-[#FFAB40] text-white text-xs font-medium rounded-lg transition-all duration-200 active:scale-95 ${hasPrompt ? 'hover:from-[#D42A2A] hover:to-[#C87A1A]' : 'opacity-60 cursor-not-allowed'}`}
          >
            {hasPrompt ? 'Install' : 'How to Install'}
          </button>
          <button
            onClick={handleDismiss}
            className="text-neutral-400 hover:text-white transition-colors active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      {!hasPrompt && (
        <div className="text-left text-xs text-neutral-400 mt-3 space-y-1">
          <p className="font-medium text-white/80">Install steps:</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Tap the browser menu (⋮) in Chrome</li>
            <li>Select <span className="text-white">Add to Home screen</span></li>
            <li>Confirm to pin Otagon as an app</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default PWAInstallBanner;

