import React from 'react';

interface ActiveSessionToggleProps {
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const ActiveSessionToggle: React.FC<ActiveSessionToggleProps> = ({ 
  isActive, 
  onClick, 
  disabled = false 
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-medium transition-colors duration-200 ${isActive ? 'text-[#A3A3A3]' : 'text-[#FF4D4D]'}`}>
        Planning
      </span>
      
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF4D4D] focus:ring-offset-2 focus:ring-offset-[#1C1C1C]
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isActive ? 'bg-[#FF4D4D]' : 'bg-[#424242]'}
        `}
        role="switch"
        aria-checked={isActive}
        aria-label={isActive ? 'Switch to Planning mode' : 'Switch to Playing mode'}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
            ${isActive ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      
      <span className={`text-xs font-medium transition-colors duration-200 ${isActive ? 'text-[#FF4D4D]' : 'text-[#A3A3A3]'}`}>
        Playing
      </span>
    </div>
  );
};