import React from 'react';

interface GroundingToggleProps {
  isEnabled: boolean;
  aiMessagesQuota: number;
  onToggle: () => void;
  onQuotaExceeded: () => void;
}

export const GroundingToggle: React.FC<GroundingToggleProps> = ({
  isEnabled,
  aiMessagesQuota,
  onToggle,
  onQuotaExceeded,
}) => {
  const hasQuota = aiMessagesQuota > 0;

  const handleClick = () => {
    if (!hasQuota) {
      onQuotaExceeded();
      return;
    }
    onToggle();
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-r from-[#2E2E2E]/90 to-[#1C1C1C]/90 flex items-center justify-center transition-all duration-300 hover:scale-105 ${
          !hasQuota
            ? 'text-gray-500'
            : isEnabled
            ? 'text-emerald-400'
            : 'text-text-muted hover:text-text-primary'
        }`}
        title={
          !hasQuota
            ? 'No web search quota available - Click to view limits'
            : isEnabled
            ? `Web search enabled (${aiMessagesQuota} searches left)`
            : `Web search disabled (${aiMessagesQuota} searches available)`
        }
      >
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      </button>
      
      {/* Android-style notification badge */}
      <div
        className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold bg-[#E53A3A] text-white"
      >
        {aiMessagesQuota}
      </div>
    </div>
  );
};
