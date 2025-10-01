import React, { useState } from 'react';
import { UserTier } from '../../types';
import { USER_TIERS, TIER_FEATURES, TIER_PRICES } from '../../constants';
import { authService } from '../../services/authService';
import Button from '../ui/Button';

interface TierSwitcherProps {
  currentTier: UserTier;
  onTierChange: (tier: UserTier) => void;
}

const TierSwitcher: React.FC<TierSwitcherProps> = ({ currentTier, onTierChange }) => {
  const [isChanging, setIsChanging] = useState(false);

  const handleTierChange = async (tier: UserTier) => {
    if (tier === currentTier) return;
    
    setIsChanging(true);
    try {
      const success = await authService.switchTier(tier);
      if (success) {
        onTierChange(tier);
      }
    } catch (error) {
      console.error('Error switching tier:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const getTierDisplayName = (tier: UserTier) => {
    switch (tier) {
      case USER_TIERS.FREE:
        return 'Free';
      case USER_TIERS.PRO:
        return 'Pro';
      case USER_TIERS.VANGUARD_PRO:
        return 'Vanguard Pro';
      default:
        return tier;
    }
  };

  const getTierColor = (tier: UserTier) => {
    switch (tier) {
      case USER_TIERS.FREE:
        return 'text-gray-400';
      case USER_TIERS.PRO:
        return 'text-blue-400';
      case USER_TIERS.VANGUARD_PRO:
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="bg-surface/50 backdrop-blur-sm border border-surface-light/20 rounded-xl p-4">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Developer Mode - Tier Switcher</h3>
      
      <div className="space-y-3">
        {Object.values(USER_TIERS).map((tier) => (
          <div
            key={tier}
            className={`p-3 rounded-lg border transition-all duration-200 ${
              currentTier === tier
                ? 'border-primary/50 bg-primary/10'
                : 'border-surface-light/30 hover:border-surface-light/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  currentTier === tier ? 'bg-primary' : 'bg-surface-light/50'
                }`} />
                <div>
                  <div className={`font-medium ${getTierColor(tier)}`}>
                    {getTierDisplayName(tier)}
                  </div>
                  <div className="text-sm text-text-muted">
                    {TIER_PRICES[tier] ? `$${TIER_PRICES[tier]}/month` : 'Free'}
                  </div>
                </div>
              </div>
              
              <Button
                onClick={() => handleTierChange(tier)}
                disabled={isChanging || currentTier === tier}
                variant={currentTier === tier ? 'primary' : 'outline'}
                size="sm"
              >
                {currentTier === tier ? 'Current' : 'Switch'}
              </Button>
            </div>
            
            {currentTier === tier && (
              <div className="mt-3 pt-3 border-t border-surface-light/20">
                <div className="text-sm text-text-secondary">
                  <div className="font-medium mb-2">Current Features:</div>
                  <ul className="space-y-1">
                    {TIER_FEATURES[tier].map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <span className="text-primary">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <div className="text-sm text-yellow-400">
          <strong>Note:</strong> Tier switching is only available in developer mode. 
          Changes are temporary and will reset on page refresh.
        </div>
      </div>
    </div>
  );
};

export default TierSwitcher;
