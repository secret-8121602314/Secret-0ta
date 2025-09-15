import React, { useState } from 'react';
import { StarIcon, ClockIcon, CheckIcon } from '@heroicons/react/24/outline';

interface FreeTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTrial: () => Promise<void>;
  isLoading?: boolean;
}

const FreeTrialModal: React.FC<FreeTrialModalProps> = ({
  isOpen,
  onClose,
  onStartTrial,
  isLoading = false
}) => {
  const [isStarting, setIsStarting] = useState(false);

  const handleStartTrial = async () => {
    setIsStarting(true);
    try {
      await onStartTrial();
      onClose();
    } catch (error) {
      console.error('Failed to start trial:', error);
    } finally {
      setIsStarting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] border border-[#424242]/40 rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-full flex items-center justify-center mx-auto mb-4">
            <StarIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Start Your 14-Day Free Trial
          </h2>
          <p className="text-neutral-400 text-sm">
            Experience all Pro features for 14 days, completely free
          </p>
        </div>

        {/* Trial Benefits */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckIcon className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-white text-sm">1,583 text queries per month</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckIcon className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-white text-sm">328 image queries per month</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckIcon className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-white text-sm">Grounding Search (Internet access)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckIcon className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-white text-sm">Insights subtabs & Hands-Free mode</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckIcon className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-white text-sm">Priority support & No ads</span>
          </div>
        </div>

        {/* Trial Duration */}
        <div className="bg-[#2E2E2E]/60 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <ClockIcon className="w-5 h-5 text-[#FFAB40]" />
            <div>
              <p className="text-white font-medium text-sm">14-Day Trial</p>
              <p className="text-neutral-400 text-xs">
                After 14 days, you'll return to Free tier unless you subscribe
              </p>
            </div>
          </div>
        </div>

        {/* Important Note */}
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mb-6">
          <p className="text-yellow-200 text-xs text-center">
            <strong>One-time offer:</strong> You can only use the free trial once. 
            After expiration, upgrade to Pro to continue enjoying these features.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleStartTrial}
            disabled={isStarting || isLoading}
            className="w-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#E53A3A]/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isStarting || isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Starting Trial...
              </div>
            ) : (
              'Start 14-Day Free Trial'
            )}
          </button>
          
          <button
            onClick={onClose}
            disabled={isStarting || isLoading}
            className="w-full bg-[#2E2E2E] hover:bg-[#3E3E3E] text-neutral-300 font-medium py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default FreeTrialModal;
