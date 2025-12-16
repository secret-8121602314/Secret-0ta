import React, { useState, useEffect } from 'react';
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
            // Silently handle - user can still proceed
            console.debug('[InitialSplashScreen] Update error:', error.message);
          }
        } catch (_e) {
          // Non-critical - user can still proceed
        }
      }
      
      // Call onComplete immediately - don't wait, don't reset isProcessing
      onComplete();
      
    } catch (error) {
      console.error('🎯 [InitialSplashScreen] Error in button click:', error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#111111] to-background text-text-primary flex flex-col items-center justify-center font-inter px-5 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12 text-center overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial-at-top from-surface/30 to-transparent pointer-events-none"></div>
      
      <div className="flex flex-col items-center justify-center w-full max-w-2xl">
        <div className="flex-shrink-0 mb-1">
          <img
            src="/images/mascot/1.png"
            alt="Otagon Mascot"
            className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 lg:w-64 lg:h-64 object-contain aspect-square"
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
          className="text-4xl sm:text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] leading-normal whitespace-nowrap pb-2"
        >
          Otagon
        </h1>

        <p 
          className="text-sm sm:text-base text-text-secondary leading-relaxed mt-1"
        >
          Your Spoiler-Free Gaming Companion
        </p>

        <div 
          className="flex flex-col items-center justify-center gap-3 sm:gap-4 w-full max-w-lg px-2 mt-6 sm:mt-8 md:mt-12 relative z-10"
          style={{ pointerEvents: 'auto' }}
        >
          <button
            onClick={handleStartAdventure}
            disabled={isProcessing}
            className={`w-full btn-primary-touch-safe text-sm sm:text-base flex items-center justify-center relative z-10 ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ pointerEvents: 'auto' }}
          >
            {isProcessing ? 'Starting...' : 'Start the Adventure'}
          </button>
          
          <button
            onClick={handleDownloadPCClient}
            className="w-full btn-secondary-touch-safe text-sm sm:text-base flex items-center justify-center relative z-10 cursor-pointer"
            style={{ pointerEvents: 'auto' }}
          >
            Download PC Client
          </button>
          
          {/* Installation Instructions */}
          <div className="w-full text-left px-4 relative z-10" style={{ pointerEvents: 'auto' }}>
            <ul className="text-xs sm:text-sm text-neutral-400 leading-relaxed list-disc list-inside">
              <li>Download and install the Otagon Connector (.exe)</li>
              <li>Open the connector app and enter the 6-digit code shown in the Otagon Connector App to connect Otagon app to your PC for instant screenshots.</li>
            </ul>
            
            {/* Administrator Note */}
            <div className="mt-4 pt-4 border-t border-neutral-700">
              <p className="text-xs text-orange-400 leading-relaxed font-medium">
                ⚠️ Important: Run the app as Administrator once after installation to enable screenshot capture functionality.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InitialSplashScreen;
