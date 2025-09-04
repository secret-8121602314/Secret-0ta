import React, { useState, useEffect } from 'react';
import { tierService, TierInfo } from '../services/tierService';
import { authService } from '../services/supabase';
import StarIcon from './StarIcon';
import CheckIcon from './CheckIcon';

interface TierUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeSuccess?: () => void;
}

export const TierUpgradeModal: React.FC<TierUpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgradeSuccess,
}) => {
  const [tiers, setTiers] = useState<Record<string, TierInfo>>({});
  const [currentTier, setCurrentTier] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadTierInfo();
    }
  }, [isOpen]);

  const loadTierInfo = async () => {
    try {
      const allTiers = tierService.getAllTiers();
      setTiers(allTiers);

      // Get current user's tier
      const authState = authService.getAuthState();
      if (authState.user) {
        const userTier = await tierService.getUserTier(authState.user.id);
        if (userTier) {
          setCurrentTier(userTier.tier);
        }
      }
    } catch (error) {
      console.error('Error loading tier info:', error);
    }
  };

  const handleUpgrade = async (targetTier: string) => {
    if (targetTier === currentTier) return;

    setIsLoading(true);
    setUpgradeMessage('');

    try {
      const authState = authService.getAuthState();
      if (!authState.user) {
        setUpgradeMessage('Please log in to upgrade your tier.');
        return;
      }

      let success = false;
      if (targetTier === 'pro') {
        success = await tierService.upgradeToPro(authState.user.id);
      } else if (targetTier === 'vanguard_pro') {
        success = await tierService.upgradeToVanguardPro(authState.user.id);
      }

      if (success) {
        setCurrentTier(targetTier);
        setUpgradeMessage(`Successfully upgraded to ${targetTier.replace('_', ' ')}!`);
        onUpgradeSuccess?.();
        
        // Reload tier info
        setTimeout(() => {
          loadTierInfo();
        }, 1000);
      } else {
        setUpgradeMessage('Failed to upgrade. Please try again.');
      }
    } catch (error) {
      console.error('Error upgrading tier:', error);
      setUpgradeMessage('An error occurred during upgrade.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const tierOrder = ['free', 'pro', 'vanguard_pro'];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/80 to-[#0A0A0A]/80 backdrop-blur-xl flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-gradient-to-r from-[#1A1A1A]/95 to-[#0A0A0A]/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-y-auto border-2 border-[#424242]/60 shadow-2xl hover:border-[#424242]/80 transition-all duration-500">
        <div className="p-4 sm:p-6 md:p-8">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">Upgrade Your Plan</h2>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white transition-all duration-300 hover:scale-110 p-1"
            >
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {upgradeMessage && (
            <div className={`mb-6 p-4 rounded-2xl border-2 backdrop-blur-sm ${
              upgradeMessage.includes('Successfully') 
                ? 'bg-gradient-to-r from-green-900/20 to-emerald-900/20 text-green-400 border-green-700/60' 
                : 'bg-gradient-to-r from-red-900/20 to-rose-900/20 text-red-400 border-red-700/60'
            }`}>
              {upgradeMessage}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {tierOrder.map((tierKey) => {
              const tier = tiers[tierKey];
              if (!tier) return null;

              const isCurrentTier = tierKey === currentTier;
              const canUpgrade = tierService.canUpgradeTo(currentTier as any, tierKey as any);

              return (
                <div
                  key={tierKey}
                  className={`relative p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
                    isCurrentTier
                      ? 'border-[#FFAB40] bg-gradient-to-r from-[#2A2A2A]/80 to-[#1A1A1A]/80 shadow-2xl shadow-[#FFAB40]/20'
                      : canUpgrade
                      ? 'border-[#424242]/60 bg-gradient-to-r from-[#2A2A2A]/80 to-[#1A1A1A]/80 hover:border-[#FFAB40]/60 hover:bg-gradient-to-r hover:from-[#323232]/80 hover:to-[#2A2A2A]/80 hover:shadow-xl hover:shadow-[#FFAB40]/10'
                      : 'border-[#424242]/60 bg-gradient-to-r from-[#2A2A2A]/60 to-[#1A1A1A]/60 opacity-60'
                  }`}
                >
                  {isCurrentTier && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-[#FFAB40] to-[#FF8C00] text-black px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4 sm:mb-6">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 leading-tight">
                      {tierKey === 'free' ? 'Free' : tierKey === 'pro' ? 'Pro' : 'Vanguard Pro'}
                    </h3>
                    {tier.price && (
                      <div className="text-3xl sm:text-4xl font-bold text-[#FFAB40]">
                        ${tier.price}
                        <span className="text-lg sm:text-xl text-neutral-300">/month</span>
                      </div>
                    )}
                    {!tier.price && (
                      <div className="text-2xl sm:text-3xl font-bold text-green-400">
                        Free Forever
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                    <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-white">
                            {tier.textLimit.toLocaleString()}
                        </div>
                        <div className="text-sm sm:text-base text-neutral-300">Text Queries</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-white">
                            {tier.imageLimit.toLocaleString()}
                        </div>
                        <div className="text-sm sm:text-base text-neutral-300">Image Queries</div>
                    </div>
                </div>

                  <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 sm:gap-3">
                        <CheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm sm:text-base text-neutral-200 leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {canUpgrade && !isCurrentTier && (
                    <button
                      onClick={() => handleUpgrade(tierKey)}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 sm:py-4 px-4 sm:px-8 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#E53A3A]/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm sm:text-base"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2 sm:mr-3"></div>
                          Upgrading...
                        </div>
                      ) : (
                        `Upgrade to ${tierKey === 'pro' ? 'Pro' : 'Vanguard Pro'}`
                      )}
                    </button>
                  )}

                  {isCurrentTier && (
                    <div className="text-center text-[#FFAB40] font-semibold py-3 sm:py-4 text-base sm:text-lg">
                      Current Plan
                    </div>
                  )}

                  {!canUpgrade && !isCurrentTier && (
                    <div className="text-center text-neutral-500 py-3 sm:py-4 text-base sm:text-lg">
                      Already on higher tier
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed px-4">
              * Payment integration coming soon. Upgrades are currently free for testing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
