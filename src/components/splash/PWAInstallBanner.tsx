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
    console.log('🔍 [PWA Install Banner] Component mounted, checking installation status...');
    console.log('📍 Current URL:', window.location.href);
    console.log('🔐 Is HTTPS?', window.location.protocol === 'https:');
    console.log('💻 Is localhost?', window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running in standalone mode (PWA)
      if (isPWAMode()) {
        console.log('✅ [PWA Install Banner] App is already installed (running in PWA mode)');
        setIsInstalled(true);
        markAppAsInstalled();
        return;
      }
      
      // Check if app was previously installed
      if (localStorage.getItem('otakon_pwa_installed') === 'true') {
        console.log('✅ [PWA Install Banner] App was previously installed');
        setIsInstalled(true);
        return;
      }
      
      console.log('ℹ️  [PWA Install Banner] App not installed yet');
    };

    checkIfInstalled();

    const globalPrompt = (window as WindowWithPrompt)[GLOBAL_PROMPT_KEY] as BeforeInstallPromptEvent | null;
    if (globalPrompt) {
      console.log('✅ [PWA Install Banner] Found existing beforeinstallprompt event');
      setDeferredPrompt(globalPrompt);
      setHasPrompt(true);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('✅ [PWA Install Banner] beforeinstallprompt event fired');
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      (window as WindowWithPrompt)[GLOBAL_PROMPT_KEY] = installEvent;
      setDeferredPrompt(installEvent);
      setHasPrompt(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('🎉 [PWA Install Banner] App installed successfully!');
      setIsInstalled(true);
      markAppAsInstalled();
      (window as WindowWithPrompt)[GLOBAL_PROMPT_KEY] = null;
      setHasPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Log installability status after 2 seconds
    setTimeout(() => {
      if (!hasPrompt && !isInstalled) {
        console.log('❌ [PWA Install Banner] beforeinstallprompt event has NOT fired');
        console.log('🔍 Checking PWA installation criteria:');
        console.log('   1. HTTPS: ' + (window.location.protocol === 'https:' ? '✅' : '❌ REQUIRED'));
        console.log('   2. Localhost: ' + ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? '✅' : '❌'));
        console.log('   3. Service Worker: ' + (navigator.serviceWorker.controller ? '✅ Active' : '⚠️  Not active'));
        console.log('   4. Manifest Link: ' + (document.querySelector('link[rel="manifest"]') ? '✅' : '❌'));
        
        // Check manifest fetch
        fetch('/manifest.json')
          .then(res => {
            console.log('   5. Manifest Response: ' + (res.ok ? '✅ 200 OK' : '❌ ' + res.status));
            return res.json();
          })
          .then(manifest => {
            console.log('   6. Manifest Content:', manifest);
            console.log('      - Name: ' + (manifest.name ? '✅' : '❌'));
            console.log('      - Start URL: ' + (manifest.start_url ? '✅' : '❌'));
            console.log('      - Icons: ' + (manifest.icons?.length || 0) + ' icons');
            console.log('      - Display: ' + (manifest.display || 'none'));
          })
          .catch(err => {
            console.log('   5. Manifest Fetch: ❌ Failed - ' + err.message);
          });
        
        console.log('   Possible reasons:');
        console.log('   - App is not served over HTTPS (required in production)');
        console.log('   - manifest.json is invalid or missing required fields');
        console.log('   - Service worker is not registered properly');
        console.log('   - Browser does not support PWA installation (Safari iOS)');
        console.log('   - App is already installed');
        console.log('   - Chrome may have already shown prompt and user dismissed it');
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('⚠️  [PWA Install Banner] No install prompt available');
      // Fallback instructions already shown in banner
      return;
    }

    console.log('📲 [PWA Install Banner] Showing install prompt...');
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ [PWA Install Banner] User accepted the install prompt');
    } else {
      console.log('❌ [PWA Install Banner] User dismissed the install prompt');
    }
    
    // Clear the deferred prompt
    setDeferredPrompt(null);
  };
  
  // If already installed, show a simple "Already Installed" message
  if (isInstalled) {
    return (
      <div className={`bg-gradient-to-r from-green-900/30 to-green-800/30 backdrop-blur-xl border border-green-700/60 rounded-lg md:rounded-xl p-2.5 md:p-3 text-center ${className}`}>
        <div className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 md:w-5 md:h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
          <p className="text-xs md:text-sm font-medium text-green-300">App Installed</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-[#1C1C1C]/90 to-[#0A0A0A]/90 backdrop-blur-xl border border-neutral-700/60 rounded-lg md:rounded-xl p-2.5 md:p-3 lg:p-4 text-center ${className}`}>
      <div className="flex items-center space-x-2 md:space-x-3 mb-2 md:mb-3">
        <div className="w-7 h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 bg-[#111111] rounded-lg flex items-center justify-center flex-shrink-0">
          <img 
            src="/images/otagon-logo.png" 
            alt="Otagon" 
            className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6"
          />
        </div>
        <div className="text-left flex-1">
          <p className="text-sm md:text-base lg:text-lg font-medium text-white leading-tight">Install Otagon App</p>
          <p className="text-xs md:text-sm text-neutral-400 leading-tight">Get the full app experience</p>
        </div>
      </div>

      {/* Install Instructions - Always Show */}
      <div className="mt-2 md:mt-3 space-y-2 md:space-y-2.5">
        {hasPrompt && (
          <button
            onClick={handleInstallClick}
            className="w-full py-2 md:py-2.5 bg-gradient-to-r from-[#E53A3A] to-[#FFAB40] md:hover:from-[#D42A2A] md:hover:to-[#C87A1A] text-white text-sm md:text-base font-semibold rounded-lg transition-all duration-200 active:scale-95"
          >
            Install Now
          </button>
        )}
        
        <div className="text-left space-y-1.5 md:space-y-2">
          <p className="text-xs md:text-sm font-semibold text-white/90">How to Install:</p>
          <ol className="text-xs md:text-sm text-neutral-400 space-y-1.5 md:space-y-2 pl-3 md:pl-4 leading-relaxed">
            <li className="flex items-start">
              <span className="text-[#FFAB40] mr-1.5 md:mr-2">•</span>
              <span>Tap the <span className="text-white font-medium">browser menu (⋮)</span> in Chrome or Safari</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#FFAB40] mr-1.5 md:mr-2">•</span>
              <span>Select <span className="text-white font-medium">Add to Home screen</span></span>
            </li>
            <li className="flex items-start">
              <span className="text-[#FFAB40] mr-1.5 md:mr-2">•</span>
              <span>Tap <span className="text-white font-medium">Add</span> to install Otagon</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallBanner;

