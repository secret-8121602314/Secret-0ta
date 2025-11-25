import React from 'react';

export const AIIcon: React.FC<{ isActive: boolean; className?: string }> = ({ isActive, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    viewBox="0 0 24 24" 
    fill="none"
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    width="24"
    height="24"
  >
    {/* Chip/CPU icon for AI */}
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
    {/* Inner rectangle - filled when active */}
    <rect x="9" y="9" width="6" height="6" fill={isActive ? 'currentColor' : 'none'} />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="14" x2="4" y2="14" />
  </svg>
);

interface AIToggleButtonProps {
  isEnabled: boolean;
  onToggle: () => void;
  isPro: boolean;
}

const AIToggleButton: React.FC<AIToggleButtonProps> = ({ isEnabled, onToggle, isPro }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`btn-icon p-3 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
        isEnabled
          ? 'text-purple-400 hover:text-purple-300'
          : 'text-text-muted hover:text-text-primary'
      } ${!isPro ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-pressed={isEnabled}
      aria-label="AI Mode Toggle"
      title={
        !isPro
          ? 'AI Mode Toggle (Pro Feature)'
          : isEnabled
          ? 'AI Mode ON - Screenshots will be analyzed'
          : 'AI Mode OFF - Screenshots stored only'
      }
      disabled={!isPro}
    >
      <AIIcon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" isActive={isEnabled} />
    </button>
  );
};

export default AIToggleButton;
