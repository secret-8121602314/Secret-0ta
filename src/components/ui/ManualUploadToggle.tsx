import React from 'react';

interface ManualUploadToggleProps {
  isManualMode: boolean;
  onToggle: () => void;
  isConnected?: boolean;
}

const ManualUploadToggle: React.FC<ManualUploadToggleProps> = ({ isManualMode, onToggle, isConnected = false }) => {
  const title = isManualMode
    ? 'Manual review is ON. Click to resume auto-sending screenshots.'
    : 'Auto-sending is ON. Click to pause and review screenshots manually.';

  // Only show when connected to PC
  if (!isConnected) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-r from-[#2E2E2E]/90 to-[#1C1C1C]/90 flex items-center justify-center transition-all duration-300 hover:scale-105 ${
        isManualMode ? 'text-sky-400' : 'text-neutral-400'
      }`}
      aria-pressed={isManualMode}
      aria-label="Toggle screenshot auto-sending"
      title={title}
    >
      {isManualMode ? (
        // Play icon
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      ) : (
        // Pause icon
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
      )}
    </button>
  );
};

export default React.memo(ManualUploadToggle);