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
      className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2 sm:px-3 h-10 sm:h-12 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 group
      ${
        isHandsFree
          ? 'border-2 border-[#E53A3A]/50 text-[#FF7070] hover:bg-[#E53A3A]/10 shadow-[0_0_12px_rgba(229,58,58,0.3)]'
          : 'bg-gradient-to-r from-[#2E2E2E] to-[#1C1C1C] border-2 border-[#424242]/60 text-[#CFCFCF] hover:from-[#424242] hover:to-[#2E2E2E] hover:border-[#5A5A5A] hover:scale-105'
      }
      `}
      aria-pressed={isHandsFree}
      aria-label="Hands-Free Settings"
      title="Hands-Free Voice Response Settings"
    >
      <HandsFreeIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" isActive={isHandsFree} />
      <span className="hidden sm:inline">
        Hands-Free
      </span>
    </button>
  );
};

export default HandsFreeToggle;

