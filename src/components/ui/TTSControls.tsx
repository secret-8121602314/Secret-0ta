import React, { useState, useEffect } from 'react';
import { ttsService } from '../../services/ttsService';

interface TTSControlsProps {
  isLatestMessage?: boolean;
}

const TTSControls: React.FC<TTSControlsProps> = ({ isLatestMessage = false }) => {
  // Initialize with current TTS state
  const [isSpeaking, setIsSpeaking] = useState(() => ttsService.isSpeaking());
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const handleTTSStarted = () => setIsSpeaking(true);
    const handleTTSStopped = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    const handleTTSPaused = () => setIsPaused(true);
    const handleTTSResumed = () => setIsPaused(false);

    window.addEventListener('otakon:ttsStarted', handleTTSStarted);
    window.addEventListener('otakon:ttsStopped', handleTTSStopped);
    window.addEventListener('otakon:ttsPaused', handleTTSPaused);
    window.addEventListener('otakon:ttsResumed', handleTTSResumed);

    return () => {
      window.removeEventListener('otakon:ttsStarted', handleTTSStarted);
      window.removeEventListener('otakon:ttsStopped', handleTTSStopped);
      window.removeEventListener('otakon:ttsPaused', handleTTSPaused);
      window.removeEventListener('otakon:ttsResumed', handleTTSResumed);
    };
  }, []);

  const handlePauseResume = () => {
    if (isPaused) {
      ttsService.resume();
    } else {
      ttsService.pause();
    }
  };

  const handleRestart = async () => {
    await ttsService.restart();
  };
  
  const handleStop = () => {
    ttsService.cancel();
  };

  // Only show controls on the latest AI message when TTS is active
  if (!isSpeaking || !isLatestMessage) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#424242]/30">
      <span className="text-xs text-[#A3A3A3] mr-1">🔊 Speaking</span>
      
      <button
        onClick={handlePauseResume}
        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#2E2E2E] hover:bg-[#3E3E3E] border border-[#424242] text-[#FFAB40] text-xs font-medium rounded-lg transition-all duration-200"
        title={isPaused ? 'Resume' : 'Pause'}
      >
        {isPaused ? (
          <>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Resume</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
            <span>Pause</span>
          </>
        )}
      </button>

      <button
        onClick={handleRestart}
        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#2E2E2E] hover:bg-[#3E3E3E] border border-[#424242] text-[#FFAB40] text-xs font-medium rounded-lg transition-all duration-200"
        title="Restart from beginning"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Repeat</span>
      </button>
      
      <button
        onClick={handleStop}
        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#2E2E2E] hover:bg-[#3E3E3E] border border-[#424242] text-red-400 text-xs font-medium rounded-lg transition-all duration-200"
        title="Stop speaking"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 6h12v12H6z" />
        </svg>
        <span>Stop</span>
      </button>
    </div>
  );
};

export default TTSControls;
