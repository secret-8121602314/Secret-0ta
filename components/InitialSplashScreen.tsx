

import React, { useState } from 'react';
import Logo from './Logo';
import PWAInstallBanner from './PWAInstallBanner';
import { authService, supabase } from '../services/supabase';

interface InitialSplashScreenProps {
  onComplete: () => void;
}

const InitialSplashScreen: React.FC<InitialSplashScreenProps> = ({ onComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleDownloadPCClient = () => {
    // Download PC Client from GitHub releases
    const downloadUrl = 'https://github.com/readmet3xt/readmet3xt.github.io/releases/tag/Otagon-connector';
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#111111] to-[#0A0A0A] text-[#F5F5F5] flex flex-col items-center justify-center font-inter px-4 sm:px-6 md:px-8 text-center overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial-at-top from-[#1C1C1C]/30 to-transparent pointer-events-none"></div>
      
      <div className="flex flex-col items-center justify-center w-full max-w-2xl">
        <div className="flex-shrink-0 mb-1">
          <Logo className="w-24 h-24 sm:w-26 sm:h-26 md:w-28 md:h-28" />
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
          className="flex flex-col items-center justify-center gap-4 w-full max-w-lg mt-12"
        >
          <button
            onClick={async () => {
              // Prevent multiple clicks
              if (isProcessing) {
                console.log('🎯 [InitialSplashScreen] Already processing, ignoring click');
                return;
              }
              
              setIsProcessing(true);
              
              try {
                console.log('🎯 [InitialSplashScreen] Start the Adventure clicked');
                
                // Mark that splash screens have been seen to advance flow in dev mode
                localStorage.setItem('otakon_has_seen_splash_screens', 'true');
                
                // Also update Supabase to mark splash screens as seen
                const currentUserId = authService.getCurrentUserId();
                if (currentUserId) {
                  console.log('🎯 [InitialSplashScreen] Updating Supabase app_state to mark splash screens as seen');
                  try {
                    const { error } = await supabase.rpc('update_user_app_state', {
                      p_user_id: currentUserId,
                      p_field: 'hasSeenSplashScreens',
                      p_value: 'true'
                    });
                    if (error) {
                      console.warn('🎯 [InitialSplashScreen] Failed to update Supabase:', error);
                    } else {
                      console.log('🎯 [InitialSplashScreen] Successfully updated Supabase');
                    }
                  } catch (error) {
                    console.warn('🎯 [InitialSplashScreen] Error updating Supabase:', error);
                  }
                }
                
                // Call the completion handler
                onComplete();
                
              } catch (error) {
                console.error('🎯 [InitialSplashScreen] Error in button click:', error);
              } finally {
                // Reset processing state after a delay to prevent rapid clicks
                setTimeout(() => setIsProcessing(false), 1000);
              }
            }}
            disabled={isProcessing}
            className={`w-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] hover:from-[#D42A2A] hover:to-[#C87A1A] text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#E53A3A]/25 text-base flex items-center justify-center ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isProcessing ? 'Starting...' : 'Start the Adventure'}
          </button>
          
          <button
            onClick={handleDownloadPCClient}
            className="w-full bg-gradient-to-r from-neutral-700 to-neutral-600 hover:from-neutral-600 hover:to-neutral-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg text-base flex items-center justify-center"
          >
            Download PC Client
          </button>
        </div>
        
        {/* PWA Install Banner - In normal document flow */}
        <div className="w-full max-w-lg px-4 mt-8">
          <PWAInstallBanner />
        </div>
      </div>
    </div>
  );
};

export default React.memo(InitialSplashScreen);