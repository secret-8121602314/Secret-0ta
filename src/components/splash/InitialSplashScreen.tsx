import React, { useState } from 'react';
import Logo from '../ui/Logo';
import PWAInstallBanner from './PWAInstallBanner';
import { authService } from '../../services/authService';
import { supabase } from '../../lib/supabase';

interface InitialSplashScreenProps {
  onComplete: () => void;
}

const InitialSplashScreen: React.FC<InitialSplashScreenProps> = ({ onComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  console.log('🎯 [InitialSplashScreen] Component rendered');
  
  const handleDownloadPCClient = () => {
    console.log('🎯 [InitialSplashScreen] Download PC Client clicked');
    // Download PC Client from GitHub releases
    const downloadUrl = 'https://github.com/readmet3xt/otakon-pc-client/releases/tag/v1.0.0';
    window.open(downloadUrl, '_blank');
  };

  const handleStartAdventure = async () => {
    console.log('🎯 [InitialSplashScreen] Start the Adventure button clicked');
    // Prevent multiple clicks
    if (isProcessing) {
      console.log('🎯 [InitialSplashScreen] Already processing, ignoring click');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log('🎯 [InitialSplashScreen] Start the Adventure processing...');
      
      // Mark that splash screens have been seen
      localStorage.setItem('otakon_has_seen_splash_screens', 'true');
      
      // Update Supabase to mark splash screens as seen
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        console.log('🎯 [InitialSplashScreen] Updating Supabase to mark splash screens as seen');
        try {
          // Update the has_seen_splash_screens field directly
          const { error } = await supabase
            .from('users')
            .update({ has_seen_splash_screens: true })
            .eq('id', currentUser.id);
            
          if (error) {
            console.warn('🎯 [InitialSplashScreen] Failed to update Supabase:', error);
          } else {
            console.log('🎯 [InitialSplashScreen] Successfully updated Supabase');
          }
        } catch (error) {
          console.warn('🎯 [InitialSplashScreen] Error updating Supabase:', error);
        }
      }
      
      // Call the completion handler - this will trigger the next onboarding step
      onComplete();
      
    } catch (error) {
      console.error('🎯 [InitialSplashScreen] Error in button click:', error);
    } finally {
      // Reset processing state after a delay to prevent rapid clicks
      setTimeout(() => setIsProcessing(false), 1000);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#111111] to-[#0A0A0A] text-[#F5F5F5] flex flex-col items-center justify-center font-inter px-4 sm:px-6 md:px-8 text-center overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial-at-top from-[#1C1C1C]/30 to-transparent pointer-events-none"></div>
      
      <div className="flex flex-col items-center justify-center w-full max-w-2xl">
        <div className="flex-shrink-0 mb-1">
          <Logo className="w-24 h-24 sm:w-26 sm:h-26 md:w-28 md:h-28" spin={true} bounce={true} />
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
            className={`w-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] hover:from-[#D42A2A] hover:to-[#C87A1A] text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#E53A3A]/25 active:scale-95 text-base flex items-center justify-center relative z-10 ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ pointerEvents: 'auto' }}
          >
            {isProcessing ? 'Starting...' : 'Start the Adventure'}
          </button>
          
          <button
            onClick={handleDownloadPCClient}
            className="w-full bg-gradient-to-r from-neutral-700 to-neutral-600 hover:from-neutral-600 hover:to-neutral-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 text-base flex items-center justify-center relative z-10 cursor-pointer"
            style={{ pointerEvents: 'auto' }}
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
