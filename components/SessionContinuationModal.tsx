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
  autoDismiss = true,
  dismissDelay = 15000
}) => {
  const [sessionProgress, setSessionProgress] = useState<SessionProgress | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(dismissDelay / 1000);

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
    
    // Auto-dismiss countdown
    if (autoDismiss) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsVisible(false);
            setTimeout(onClose, 300);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [autoDismiss, dismissDelay, onClose]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`
        bg-gradient-to-r from-green-900/95 to-blue-900/95 backdrop-blur-sm
        border border-green-500/30 rounded-xl shadow-2xl
        p-6 text-white w-full max-w-md transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <PlayIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Continue Your Session?</h3>
              <p className="text-green-200 text-sm">Pick up where you left off</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-green-200 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Session Info */}
        <div className="mb-6 space-y-4">
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="font-semibold text-lg mb-2">{sessionProgress.gameTitle}</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-green-200">Progress:</span>
                <span className="font-medium">{sessionProgress.progress}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-green-200">Last Location:</span>
                <span className="font-medium">{sessionProgress.lastLocation}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-green-200">Last Session:</span>
                <span className="font-medium">{hoursSince}h ago</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-green-200">New Insights:</span>
                <span className="font-medium">{sessionProgress.newInsights} available</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-green-200">Story Progress</span>
              <span className="text-sm font-medium">{sessionProgress.progress}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${sessionProgress.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleContinueSession}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <PlayIcon className="w-5 h-5" />
            <span>Continue Session</span>
          </button>
          
          <button
            onClick={handleStartNew}
            className="w-full bg-white/10 text-white py-3 px-4 rounded-lg font-medium hover:bg-white/20 transition-colors flex items-center justify-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Start New Session</span>
          </button>
          
          <button
            onClick={handleClose}
            className="w-full text-green-200 py-2 px-4 rounded-lg hover:text-white transition-colors"
          >
            Maybe Later
          </button>
        </div>

        {/* Auto-dismiss indicator */}
        {autoDismiss && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-2 text-xs text-green-300">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Auto-dismissing in {timeRemaining}s</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionContinuationModal;
