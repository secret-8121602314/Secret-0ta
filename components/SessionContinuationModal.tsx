import React from 'react';
import { XMarkIcon, ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';

interface SessionContinuationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueSession: () => void;
  onStartNewGameChat: () => void;
  gameTitle?: string;
  lastLocation?: string;
  progressPercentage?: number;
}

const SessionContinuationModal: React.FC<SessionContinuationModalProps> = ({
  isOpen,
  onClose,
  onContinueSession,
  onStartNewGameChat,
  gameTitle = "Your Game",
  lastLocation = "Unknown Location",
  progressPercentage = 0
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1C1C1C] rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden border-2 border-[#E53A3A]/30 shadow-2xl shadow-[#E53A3A]/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Welcome Back! 🎮</h2>
              <p className="text-white/90 mt-1">Pick up where you left off</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/90 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Game Info */}
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-white mb-2">{gameTitle}</h3>
            <div className="space-y-2 text-sm text-[#A3A3A3]">
              <div className="flex items-center gap-2">
                <ArrowPathIcon className="w-4 h-4" />
                <span>Last played: {lastLocation}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-full"></div>
                <span>Progress: {progressPercentage}% complete</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3 w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onContinueSession}
              className="w-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] hover:from-[#D42A2A] hover:to-[#C87A1A] text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#E53A3A]/25 flex items-center justify-center gap-3"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Continue with {gameTitle}
            </button>
            
            <button
              onClick={onStartNewGameChat}
              className="w-full bg-gradient-to-r from-[#2E2E2E] to-[#1A1A1A] hover:from-[#424242] hover:to-[#2A2A2A] text-[#CFCFCF] font-medium py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 border-[#424242]/60 hover:border-[#5A5A5A]/60 flex items-center justify-center gap-3"
            >
              <PlusIcon className="w-5 h-5" />
              Start a New Game Chat or Switch to General Chat
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>Continue with {gameTitle}:</strong> Resume your previous conversation and progress
            </p>
            <p className="text-sm text-blue-300 mt-1">
              <strong>Start a New Game Chat:</strong> Begin fresh for a different game or general questions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionContinuationModal;
