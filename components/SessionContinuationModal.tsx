import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlayIcon, PlusIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import dailyEngagementService, { SessionProgress } from '../services/dailyEngagementService';

interface SessionContinuationModalProps {
  onClose: () => void;
  onContinueSession: (gameId: string) => void;
  onStartNew: () => void;
  autoDismiss?: boolean;
  dismissDelay?: number;
}

const SessionContinuationModal: React.FC<SessionContinuationModalProps> = ({
  onClose,
  onContinueSession,
  onStartNew,
  autoDismiss = false,
  dismissDelay = 0
}) => {
  const [sessionProgress, setSessionProgress] = useState<SessionProgress | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Find the most recent session
    const allKeys = Object.keys(localStorage);
    const sessionKeys = allKeys.filter(key => key.startsWith('sessionProgress_'));
    
    if (sessionKeys.length > 0) {
      // Get the most recent session
      let mostRecent: SessionProgress | null = null;
      let mostRecentTime = 0;
      
      sessionKeys.forEach(key => {
        const session = dailyEngagementService.getSessionProgress(key.replace('sessionProgress_', ''));
        if (session && new Date(session.lastSession).getTime() > mostRecentTime) {
          mostRecent = session;
          mostRecentTime = new Date(session.lastSession).getTime();
        }
      });
      
      setSessionProgress(mostRecent);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleContinueSession = () => {
    if (sessionProgress) {
      onContinueSession(sessionProgress.gameId);
      handleClose();
    }
  };

  const handleStartNew = () => {
    onStartNew();
    handleClose();
  };

  if (!isVisible || !sessionProgress) return null;

  const hoursSince = Math.floor((Date.now() - new Date(sessionProgress.lastSession).getTime()) / (1000 * 60 * 60));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className={`
        bg-gradient-to-r from-[#1C1C1C]/95 to-[#2E2E2E]/95 backdrop-blur-sm
        border border-[#E53A3A]/30 rounded-xl shadow-2xl
        p-4 sm:p-6 text-white w-full max-w-sm sm:max-w-md transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-full flex items-center justify-center">
              <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Continue Your Session?</h3>
              <p className="text-[#FFAB40] text-xs sm:text-sm">Pick up where you left off</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-[#FFAB40] hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Session Info */}
        <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
          <div className="bg-white/5 rounded-lg p-3 sm:p-4">
            <h4 className="font-semibold text-base sm:text-lg mb-2">{sessionProgress.gameTitle}</h4>
            
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#FFAB40]">Progress:</span>
                <span className="font-medium">{sessionProgress.progress}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-[#FFAB40]">Last Location:</span>
                <span className="font-medium truncate max-w-[120px] sm:max-w-[200px]">{sessionProgress.lastLocation}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-[#FFAB40]">Last Session:</span>
                <span className="font-medium">{hoursSince}h ago</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-[#FFAB40]">New Insights:</span>
                <span className="font-medium">{sessionProgress.newInsights} available</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white/5 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-[#FFAB40]">Story Progress</span>
              <span className="text-xs sm:text-sm font-medium">{sessionProgress.progress}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 sm:h-3">
              <div 
                className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] h-2 sm:h-3 rounded-full transition-all duration-500"
                style={{ width: `${sessionProgress.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 sm:space-y-3">
          <button
            onClick={handleContinueSession}
            className="w-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white py-2 sm:py-3 px-4 rounded-lg font-medium hover:from-[#D42A2A] hover:to-[#C87A1A] transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Continue Session</span>
          </button>
          
          <button
            onClick={handleStartNew}
            className="w-full bg-white/10 text-white py-2 sm:py-3 px-4 rounded-lg font-medium hover:bg-white/20 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Start New Session</span>
          </button>
          
          <button
            onClick={handleClose}
            className="w-full text-[#FFAB40] py-2 px-4 rounded-lg hover:text-white transition-colors text-sm sm:text-base"
          >
            Maybe Later
          </button>
        </div>


      </div>
    </div>
  );
};

export default SessionContinuationModal;
