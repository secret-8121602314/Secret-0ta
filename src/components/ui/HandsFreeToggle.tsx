import React from 'react';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';

interface HandsFreeToggleProps {
  isHandsFree: boolean;
  onToggle: () => void;
}

const HandsFreeToggle: React.FC<HandsFreeToggleProps> = ({ isHandsFree, onToggle }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`btn-icon p-3 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
        isHandsFree
          ? 'text-green-400 hover:text-green-300'
          : 'text-text-muted hover:text-text-primary'
      }`}
      aria-pressed={isHandsFree}
      aria-label="Hands-Free Settings"
      title={isHandsFree ? 'Hands-Free Mode Active' : 'Hands-Free Voice Response Settings'}
    >
      {isHandsFree ? (
        <SpeakerWaveIcon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
      ) : (
        <SpeakerXMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
      )}
    </button>
  );
};

export default HandsFreeToggle;

