import React from 'react';

interface ManualUploadToggleProps {
  isManualMode: boolean;
  onToggle: () => void;
  isConnected?: boolean;
}

const ManualUploadToggle: React.FC<ManualUploadToggleProps> = ({ isManualMode, onToggle, isConnected = false }) => {
  const title = isManualMode
    ? 'Manual review is ON (paused). Click to resume auto-sending screenshots.'
    : 'Auto-sending is ON. Click to pause and review screenshots manually.';

  // Only show when connected to PC
  if (!isConnected) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#1A1A1A]/60 border backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:bg-[#2A2A2A]/80 hover:scale-105 active:scale-95 ${
        isManualMode 
          ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/40' 
          : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/40'
      }`}
      aria-pressed={isManualMode}
      aria-label={isManualMode ? 'Resume auto-sending screenshots' : 'Pause and review screenshots'}
      title={title}
    >
      {isManualMode ? (
        // Play icon - Manual mode ON, show play to indicate "resume/start auto"
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      ) : (
        // Pause icon - Auto mode ON, show pause to indicate "stop/pause auto"
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
        </svg>
      )}
    </button>
  );
};

export default React.memo(ManualUploadToggle);