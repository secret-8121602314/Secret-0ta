import React, { useState, useEffect } from 'react';
import PWAInstallBanner from './PWAInstallBanner';
import { supabase } from '../../lib/supabase';
import { User } from '../../types';

interface InitialSplashScreenProps {
  onComplete: () => void;
  user: User | null;
}

const InitialSplashScreen: React.FC<InitialSplashScreenProps> = ({ onComplete, user }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Reset isProcessing on mount to prevent stuck state after logout
  useEffect(() => {
        setIsProcessing(false);
  }, []);
  
    const handleDownloadPCClient = () => {
        const downloadUrl = 'https://github.com/readmet3xt/otakon-pc-client/releases/tag/v1.0.0';
    window.open(downloadUrl, '_blank');
  };

  const handleStartAdventure = async () => {
        if (isProcessing) {
            return;
    }
    
    setIsProcessing(true);
    
    try {
            localStorage.setItem('otakon_has_seen_splash_screens', 'true');
      
      if (user) {
                try {
          // Update app_state with new onboarding status
          const { error } = await supabase
            .from('users')
            .update({
              has_seen_splash_screens: true,
              app_state: {
                onboardingStatus: 'how-to-use',
                hasSeenSplashScreens: true,
                completedInitialAt: new Date().toISOString()
              }
            })
            .eq('auth_user_id', user.authUserId);
            
          if (error) {
                      } else {
                      }
        } catch {
                  }
      }
      
      onComplete();
      
    } catch (error) {
      console.error('🎯 [InitialSplashScreen] Error in button click:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#111111] to-[#0A0A0A] text-[#F5F5F5] flex flex-col items-center justify-center font-inter px-4 sm:px-6 md:px-8 text-center overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial-at-top from-[#1C1C1C]/30 to-transparent pointer-events-none"></div>
      
      <div className="flex flex-col items-center justify-center w-full max-w-2xl">
        <div className="flex-shrink-0 mb-1">
          <img
            src="/images/mascot/1.png"
            alt="Otagon Mascot"
            className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 object-contain aspect-square"
            onError={(e) => {
              // Fallback to Logo component if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.innerHTML = '<div class="w-24 h-24 sm:w-26 sm:h-26 md:w-28 md:h-28"></div>';
              target.parentNode?.appendChild(fallback);
            }}
          />
        </div>

        <h1 
          className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] leading-normal"
        >
          Otagon
        </h1>

        <p 
          className="text-base text-[#CFCFCF] leading-relaxed mt-1"
        >
          Your Spoiler-Free Gaming Companion
        </p>

        <div 
          className="flex flex-col items-center justify-center gap-4 w-full max-w-lg mt-12 relative z-10"
          style={{ pointerEvents: 'auto' }}
        >
          <button
            onClick={handleStartAdventure}
            disabled={isProcessing}
            className={`w-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] md:hover:from-[#D42A2A] md:hover:to-[#C87A1A] text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 md:hover:scale-105 md:hover:shadow-xl md:hover:shadow-[#E53A3A]/25 active:scale-95 text-base flex items-center justify-center relative z-10 ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ pointerEvents: 'auto' }}
          >
            {isProcessing ? 'Starting...' : 'Start the Adventure'}
          </button>
          
          <button
            onClick={handleDownloadPCClient}
            className="w-full bg-gradient-to-r from-neutral-700 to-neutral-600 md:hover:from-neutral-600 md:hover:to-neutral-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 md:hover:scale-105 md:hover:shadow-lg active:scale-95 text-base flex items-center justify-center relative z-10 cursor-pointer"
            style={{ pointerEvents: 'auto' }}
          >
            Download PC Client
          </button>
          
          {/* Installation Instructions */}
          <div className="w-full text-center px-4 relative z-10" style={{ pointerEvents: 'auto' }}>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              <span className="block sm:inline">1. Download and install the Otagon Connector (.exe) • </span>
              <span className="block sm:inline">2. Open the connector app and enter the 6-digit code shown in the Otagon Connector App to connect Otagon app to your PC for instant screenshots.</span>
            </p>
          </div>
        </div>
        
        {/* PWA Install Banner - In normal document flow */}
        <div className="w-full max-w-lg px-4 mt-8">
          <PWAInstallBanner />
        </div>
      </div>
    </div>
  );
};

export default InitialSplashScreen;
