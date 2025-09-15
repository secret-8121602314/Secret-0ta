import React, { useState, useRef } from 'react';
import { ClockIcon, StarIcon } from '@heroicons/react/24/outline';
import TrialContextMenu from './TrialContextMenu';

interface TrialButtonProps {
  userTier: 'free' | 'pro' | 'vanguard_pro';
  isEligibleForTrial: boolean;
  hasUsedTrial: boolean;
  onStartTrial: () => void;
  onUpgradeToPro: () => void;
}

const TrialButton: React.FC<TrialButtonProps> = ({
  userTier,
  isEligibleForTrial,
  hasUsedTrial,
  onStartTrial,
  onUpgradeToPro
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleButtonClick = () => {
    if (isEligibleForTrial) {
      onStartTrial();
    } else if (hasUsedTrial) {
      onUpgradeToPro();
    }
    // If user is already on pro/vanguard, do nothing
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setShowContextMenu({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
    }
  };

  const getButtonContent = () => {
    if (isEligibleForTrial) {
      return (
        <>
          <ClockIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Start 14-Day Free Trial</span>
          <span className="sm:hidden">Free Trial</span>
        </>
      );
    } else if (hasUsedTrial) {
      return (
        <>
          <StarIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Upgrade to Pro</span>
          <span className="sm:hidden">Upgrade</span>
        </>
      );
    }
    return null;
  };

  const getButtonStyle = () => {
    if (isEligibleForTrial) {
      return "bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white hover:shadow-lg hover:shadow-[#E53A3A]/25";
    } else if (hasUsedTrial) {
      return "bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white hover:shadow-lg hover:shadow-[#E53A3A]/25";
    }
    return "bg-neutral-700 text-neutral-400 cursor-not-allowed";
  };

  // Don't show button if user is already on pro/vanguard and hasn't used trial
  if (userTier !== 'free' && !hasUsedTrial) {
    return null;
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        onContextMenu={handleContextMenu}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-105 ${getButtonStyle()}`}
        title={isEligibleForTrial ? "Start 14-day free trial" : hasUsedTrial ? "Upgrade to Pro" : ""}
      >
        {getButtonContent()}
      </button>

      <TrialContextMenu
        isOpen={showContextMenu}
        onClose={() => setShowContextMenu(false)}
        onStartTrial={handleButtonClick}
        position={showContextMenu}
        isEligibleForTrial={isEligibleForTrial}
        hasUsedTrial={hasUsedTrial}
      />
    </>
  );
};

export default TrialButton;
