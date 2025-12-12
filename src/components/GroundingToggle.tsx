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
        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
          !hasQuota
            ? 'bg-gray-700/50 hover:bg-gray-700/70'
            : isEnabled
            ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 hover:from-emerald-500/30 hover:to-emerald-600/30 hover:scale-105'
            : 'bg-gradient-to-br from-gray-600/20 to-gray-700/20 hover:from-gray-600/30 hover:to-gray-700/30 hover:scale-105'
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
          className={`w-5 h-5 ${
            !hasQuota
              ? 'text-gray-500'
              : isEnabled
              ? 'text-emerald-400'
              : 'text-gray-400'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      </button>
      
      {/* Android-style notification badge */}
      <div
        className={`absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
          !hasQuota
            ? 'bg-red-500 text-white'
            : 'bg-purple-500 text-white'
        }`}
      >
        {aiMessagesQuota}
      </div>
    </div>
  );
};
