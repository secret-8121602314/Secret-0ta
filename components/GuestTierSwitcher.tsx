import React from 'react';
import { UserTier } from '../services/types';
import { unifiedUsageService } from '../services/unifiedUsageService';

interface GuestTierSwitcherProps {
  currentTier: UserTier;
  onSwitch: () => void;
}

const TIER_NAMES: Record<UserTier, string> = {
    free: 'Free',
    pro: 'Pro',
    vanguard_pro: 'Vanguard'
};

const GuestTierSwitcher: React.FC<GuestTierSwitcherProps> = ({ currentTier, onSwitch }) => {
  const tiers: UserTier[] = ['free', 'pro', 'vanguard_pro'];

  const handleCycleTier = () => {
    const currentIndex = tiers.indexOf(currentTier);
    const nextIndex = (currentIndex + 1) % tiers.length;
    const nextTier = tiers[nextIndex];

    console.log(`🔄 Switching from ${currentTier} to ${nextTier}`);

    if (nextTier === 'free') {
      unifiedUsageService.switchToFree();
    } else if (nextTier === 'pro') {
      unifiedUsageService.switchToPro();
    } else if (nextTier === 'vanguard_pro') {
      unifiedUsageService.switchToVanguard();
    }
    
    // Force immediate UI update
    onSwitch();
  };

  return (
    <button
      type="button"
      onClick={handleCycleTier}
      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-yellow-600/20 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-600/30 hover:border-yellow-500/60"
      title={`Current: ${TIER_NAMES[currentTier]}. Click to cycle to next tier.`}
    >
      <span className="text-xs">{TIER_NAMES[currentTier]}</span>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
      </svg>
    </button>
  );
};

export default GuestTierSwitcher;
