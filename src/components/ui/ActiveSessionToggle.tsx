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
    <>
      {/* Mobile: Segmented Control Style */}
      <div className="sm:hidden inline-flex items-center bg-[#2E2E2E]/80 rounded-lg p-0.5 backdrop-blur-sm border border-[#424242]/30">
        <button
          onClick={!isActive ? onClick : undefined}
          disabled={disabled}
          className={`
            px-3 py-1.5 text-[10px] font-semibold rounded-md transition-all duration-200 whitespace-nowrap
            ${!isActive 
              ? 'bg-gradient-to-r from-[#FF4D4D] to-[#FF6B6B] text-white shadow-md' 
              : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          Planning
        </button>
        <button
          onClick={isActive ? onClick : undefined}
          disabled={disabled}
          className={`
            px-3 py-1.5 text-[10px] font-semibold rounded-md transition-all duration-200 whitespace-nowrap
            ${isActive 
              ? 'bg-gradient-to-r from-[#FF4D4D] to-[#FF6B6B] text-white shadow-md' 
              : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          Playing
        </button>
      </div>

      {/* Desktop: Classic Toggle Style */}
      <div className="hidden sm:inline-flex items-center gap-3">
        <span className={`text-sm font-medium transition-colors duration-200 whitespace-nowrap ${isActive ? 'text-[#A3A3A3]' : 'text-[#FF4D4D]'}`}>
          Planning
        </span>
        
        <button
          onClick={onClick}
          disabled={disabled}
          className={`
            relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF4D4D] focus:ring-offset-2 focus:ring-offset-[#1C1C1C]
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
        
        <span className={`text-sm font-medium transition-colors duration-200 whitespace-nowrap ${isActive ? 'text-[#FF4D4D]' : 'text-[#A3A3A3]'}`}>
          Playing
        </span>
      </div>
    </>
  );
};