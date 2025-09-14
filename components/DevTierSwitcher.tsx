import React, { useState, useEffect } from 'react';
import { UserTier } from '../services/types';
// Dynamic import to avoid circular dependency
// import { unifiedUsageService } from '../services/unifiedUsageService';

interface DevTierSwitcherProps {
  currentTier: UserTier;
  onSwitch: () => void;
}

const TIER_NAMES: Record<UserTier, string> = {
    free: 'Free',
    pro: 'Pro',
    vanguard_pro: 'Vanguard'
};

const DevTierSwitcher: React.FC<DevTierSwitcherProps> = ({ currentTier, onSwitch }) => {
  const tiers: UserTier[] = ['free', 'pro', 'vanguard_pro'];
  const [localTier, setLocalTier] = useState<UserTier>(currentTier || 'free');
  const [isSwitching, setIsSwitching] = useState(false);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalTier(currentTier || 'free');
  }, [currentTier]);

  const handleCycleTier = async () => {
    if (isSwitching) return; // Prevent multiple clicks
    
    const currentIndex = tiers.indexOf(localTier);
    const nextIndex = (currentIndex + 1) % tiers.length;
    const nextTier = tiers[nextIndex];

    console.log(`🔄 Attempting to switch from ${localTier} to ${nextTier} tier`);
    console.log(`📍 Current index: ${currentIndex}, Next index: ${nextIndex}`);
    console.log(`📱 localStorage before switch: ${localStorage.getItem('otakonUserTier') || 'undefined'}`);

    setIsSwitching(true);

    try {
      // First, update local state immediately for better UX
      setLocalTier(nextTier);
      
      // Then attempt to update the backend
      if (nextTier === 'free') {
        console.log('🔄 Calling switchToFree...');
        const { unifiedUsageService } = await import('../services/unifiedUsageService');
        await unifiedUsageService.switchToFree();
      } else if (nextTier === 'pro') {
        console.log('🔄 Calling switchToPro...');
        const { unifiedUsageService } = await import('../services/unifiedUsageService');
        await unifiedUsageService.switchToPro();
      } else if (nextTier === 'vanguard_pro') {
        console.log('🔄 Calling switchToVanguard...');
        const { unifiedUsageService } = await import('../services/unifiedUsageService');
        await unifiedUsageService.switchToVanguard();
      }
      
      console.log(`✅ Successfully switched to ${nextTier} tier`);
      console.log(`📱 localStorage after switch: ${localStorage.getItem('otakonUserTier') || 'undefined'}`);
      
      // Verify the tier was actually updated
      const updatedTier = localStorage.getItem('otakonUserTier') as UserTier;
      if (updatedTier === nextTier) {
        console.log('✅ Tier update verified in localStorage');
        

        
        // Add a delay to ensure backend update propagates
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Now call onSwitch callback (but don't fail if it errors)
        try {
          console.log('🔄 Calling onSwitch callback...');
          onSwitch();
        } catch (error) {
          console.warn('⚠️ onSwitch callback failed, but tier was updated successfully:', error);
        }
      } else {
        console.error(`❌ Tier update verification failed. Expected: ${nextTier}, Got: ${updatedTier}`);
        throw new Error('Tier update verification failed');
      }
      
    } catch (error) {
      console.error(`❌ Failed to switch to ${nextTier} tier:`, error);
      // Revert local state on error
      setLocalTier(currentTier);
      
      // Show user-friendly error message
      console.warn('⚠️ Tier switching failed, but you can still use the app with the previous tier');
    } finally {
      setIsSwitching(false);
    }
  };

  // Use localTier for display to show immediate feedback
  const displayTier = localTier;

  return (
    <div className="flex flex-col gap-1 sm:gap-2">
      <button
        type="button"
        onClick={handleCycleTier}
        disabled={isSwitching}
        className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 h-10 sm:h-12 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
          isSwitching 
            ? 'bg-[#424242] text-[#6E6E6E] cursor-not-allowed' 
            : 'bg-gradient-to-r from-[#2E2E2E] to-[#1C1C1C] border-2 border-[#424242]/60 text-[#CFCFCF] hover:from-[#424242] hover:to-[#2E2E2E] hover:border-[#5A5A5A] hover:scale-105'
        }`}
        title={`Dev Tier: ${TIER_NAMES[displayTier]}. Click to cycle. (Developer Only)`}
      >
        {isSwitching ? (
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-[#CFCFCF]"></div>
            <span className="text-xs sm:text-sm">Switching...</span>
          </div>
        ) : (
          <>
            <span className="hidden sm:inline">Tier:</span>
            <span className="font-bold text-xs sm:text-sm">{TIER_NAMES[displayTier]}</span>
            <span className="text-xs bg-yellow-600 text-black px-1 sm:px-1.5 py-0.5 rounded-full font-medium">DEV</span>
          </>
        )}
      </button>
      
      {/* Debug info */}
      {import.meta.env.DEV && (
        <div className="text-xs text-gray-400 text-center">
          <div>localStorage: {localStorage.getItem('otakonUserTier') || 'undefined'}</div>
          <div>Local State: {displayTier}</div>
          <div>Props: {currentTier}</div>
          <div>Status: {isSwitching ? 'Switching...' : 'Ready'}</div>
          <div>Synced: {displayTier === currentTier ? '✅' : '⚠️'}</div>
        </div>
      )}
    </div>
  );
};

export default DevTierSwitcher;
