import React from 'react';

export const HandsFreeIcon: React.FC<{ isActive: boolean; className?: string }> = ({ isActive, className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        width="24"
        height="24"
    >
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" fill={isActive ? 'currentColor' : 'none'}/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    </svg>
);

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
      <HandsFreeIcon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" isActive={isHandsFree} />
    </button>
  );
};

export default HandsFreeToggle;

