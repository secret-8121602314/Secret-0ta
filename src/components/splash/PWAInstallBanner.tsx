import React, { useState, useEffect } from 'react';
import { isPWAMode, markAppAsInstalled } from '../../utils/pwaDetection';
import type { BeforeInstallPromptEvent } from '../../types/enhanced';

interface PWAInstallBannerProps {
  className?: string;
}

const BANNER_DISMISS_KEY = 'otakon_pwa_banner_dismissed';
const GLOBAL_PROMPT_KEY = '__otagon_beforeinstallprompt';

// Extend Window interface for global prompt storage
interface WindowWithPrompt extends Window {
  [key: string]: BeforeInstallPromptEvent | null | unknown;
}

const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hasPrompt, setHasPrompt] = useState(false);
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

    const globalPrompt = (window as WindowWithPrompt)[GLOBAL_PROMPT_KEY] as BeforeInstallPromptEvent | null;
    if (globalPrompt) {
      setDeferredPrompt(globalPrompt);
      setHasPrompt(true);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      (window as WindowWithPrompt)[GLOBAL_PROMPT_KEY] = installEvent;
      setDeferredPrompt(installEvent);
      setHasPrompt(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      markAppAsInstalled();
      (window as WindowWithPrompt)[GLOBAL_PROMPT_KEY] = null;
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
  };
  
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
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-8 h-8 bg-[#111111] rounded-lg flex items-center justify-center flex-shrink-0">
          <img 
            src="/images/otagon-logo.png" 
            alt="Otagon" 
            className="w-5 h-5"
          />
        </div>
        <div className="text-left flex-1">
          <p className="text-sm font-medium text-white">Install Otagon App on Mobile</p>
          <p className="text-xs text-neutral-400">Get the full app experience</p>
        </div>
      </div>

      {/* Install Instructions - Always Show */}
      <div className="mt-3 space-y-3">
        {hasPrompt && (
          <button
            onClick={handleInstallClick}
            className="w-full py-2.5 bg-gradient-to-r from-[#E53A3A] to-[#FFAB40] hover:from-[#D42A2A] hover:to-[#C87A1A] text-white text-sm font-semibold rounded-lg transition-all duration-200 active:scale-95"
          >
            Install Now
          </button>
        )}
        
        <div className="text-left space-y-2">
          <p className="text-xs font-semibold text-white/90">How to Install:</p>
          <ol className="text-xs text-neutral-400 space-y-1.5 pl-4">
            <li className="flex items-start">
              <span className="text-[#FFAB40] mr-2">•</span>
              <span>Tap the <span className="text-white font-medium">browser menu (⋮)</span> in Chrome or Safari</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#FFAB40] mr-2">•</span>
              <span>Select <span className="text-white font-medium">Add to Home screen</span></span>
            </li>
            <li className="flex items-start">
              <span className="text-[#FFAB40] mr-2">•</span>
              <span>Tap <span className="text-white font-medium">Add</span> to install Otagon</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallBanner;

