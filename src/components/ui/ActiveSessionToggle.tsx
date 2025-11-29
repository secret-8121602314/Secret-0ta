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
  // isActive = true means Playing mode, false means Planning mode
  const isPlaying = isActive;
  
  return (
    <div className="inline-flex items-center bg-[#1A1A1A] rounded-full p-1 border border-[#333] shadow-lg">
      <button
        onClick={isPlaying ? onClick : undefined}
        disabled={disabled || !isPlaying}
        className={`
          relative px-4 py-2 text-xs font-semibold rounded-full transition-all duration-300 ease-out whitespace-nowrap min-w-[72px]
          ${!isPlaying 
            ? 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white shadow-[0_2px_8px_rgba(59,130,246,0.4)]' 
            : 'text-[#888] hover:text-[#aaa] bg-transparent'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
        `}
      >
        <span className="flex items-center justify-center gap-1.5">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Plan
        </span>
      </button>
      <button
        onClick={!isPlaying ? onClick : undefined}
        disabled={disabled || isPlaying}
        className={`
          relative px-4 py-2 text-xs font-semibold rounded-full transition-all duration-300 ease-out whitespace-nowrap min-w-[72px]
          ${isPlaying 
            ? 'bg-gradient-to-r from-[#FF4D4D] to-[#EF4444] text-white shadow-[0_2px_8px_rgba(239,68,68,0.4)]' 
            : 'text-[#888] hover:text-[#aaa] bg-transparent'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
        `}
      >
        <span className="flex items-center justify-center gap-1.5">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Play
        </span>
      </button>
    </div>
  );
};