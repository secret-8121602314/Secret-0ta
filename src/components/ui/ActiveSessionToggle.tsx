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
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-14 h-14 rounded-full flex items-center justify-center
        transition-all duration-300 hover:scale-110 active:scale-95
        ${isPlaying 
          ? 'bg-gradient-to-r from-[#FF4D4D] to-[#EF4444]' 
          : 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      style={{ 
        boxShadow: isPlaying 
          ? '0 4px 20px rgba(0, 0, 0, 0.5), 0 8px 32px rgba(239, 68, 68, 0.4)' 
          : '0 4px 20px rgba(0, 0, 0, 0.5), 0 8px 32px rgba(59, 130, 246, 0.4)' 
      }}
      title={isPlaying ? 'Currently Playing - Click to switch to Planning' : 'Currently Planning - Click to switch to Playing'}
    >
      {isPlaying ? (
        // Playing mode - show Play icon
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      ) : (
        // Planning mode - show clipboard/plan icon
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )}
    </button>
  );
};