import React from 'react';
import type { UserTier } from '../../types';

interface GroundingConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  userTier: UserTier;
  remainingQuota: number;
}

export const GroundingConfirmationModal: React.FC<GroundingConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  userTier,
  remainingQuota
}) => {
  if (!isOpen) {
    return null;
  }

  const quotaInfo = {
    free: {
      total: 4,
      description: '4 web searches per month'
    },
    pro: {
      total: 30,
      description: '30 web searches per month'
    },
    vanguard_pro: {
      total: 30,
      description: '30 web searches per month'
    }
  };

  const tierInfo = quotaInfo[userTier];

  return (
    <div 
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[80] animate-fade-in p-4" 
      onClick={onCancel}
    >
      <div 
        className="bg-[#1C1C1C]/90 backdrop-blur-md border border-[#424242]/60 rounded-2xl shadow-2xl w-full max-w-md relative animate-scale-in flex flex-col max-h-[90vh]"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed header with close button */}
        <div className="flex-shrink-0 p-6 pb-4 relative">
          <button
            onClick={onCancel}
            className="absolute top-6 right-6 text-[#6E6E6E] hover:text-[#F5F5F5] transition-colors z-10"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          
          <div className="flex items-center gap-3 pr-8">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#F5F5F5]">
                Enable Web Search?
              </h3>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 custom-scrollbar">
          <div className="space-y-4">
            {/* Quota Info */}
            <div className="bg-[#252525] rounded-xl p-4 border border-[#424242]/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#CFCFCF]">Your Quota</span>
                <span className="text-xl font-bold text-[#F5F5F5]">
                  {remainingQuota} / {tierInfo.total}
                </span>
              </div>
              <p className="text-xs text-[#6E6E6E]">{tierInfo.description}</p>
            </div>

            {/* Warning Message */}
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-orange-400 text-lg flex-shrink-0 mt-0.5">⚠️</span>
                <div>
                  <p className="text-sm text-[#F5F5F5] font-medium mb-1">Important</p>
                  <p className="text-sm text-[#CFCFCF]">
                    When enabled, each query you send will consume 1 web search from your monthly quota.
                  </p>
                </div>
              </div>
              
              <div className="pl-8">
                <p className="text-sm text-[#CFCFCF] mb-2">
                  This includes:
                </p>
                <ul className="text-sm text-[#CFCFCF] space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-[#6E6E6E] mt-0.5">•</span>
                    <span>Regular chat messages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#6E6E6E] mt-0.5">•</span>
                    <span>Gaming news prompts ("What's the latest gaming news?")</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#6E6E6E] mt-0.5">•</span>
                    <span>Questions about unreleased games</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
              <div className="flex items-start gap-2">
                <span className="text-green-400 text-lg flex-shrink-0">✨</span>
                <div>
                  <p className="text-sm text-green-400 font-semibold mb-1">Benefits</p>
                  <p className="text-sm text-[#CFCFCF]">
                    Get real-time information from Google Search for the most accurate, up-to-date answers about game releases, news, and updates. 
                    <span className="text-green-400 font-medium"> Gemini's knowledge cutoff is January 2025</span>, so web search ensures you get current information.
                  </p>
                </div>
              </div>
            </div>

            {/* Low Quota Warning */}
            {remainingQuota <= 1 && (
              <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
                <div className="flex items-start gap-2">
                  <span className="text-orange-400 text-lg flex-shrink-0">⚠️</span>
                  <div>
                    <p className="text-sm text-orange-400 font-semibold mb-1">Low Quota</p>
                    <p className="text-sm text-[#CFCFCF]">
                      You have {remainingQuota === 0 ? 'no' : 'only 1'} search remaining this month.
                      {userTier === 'free' && ' Consider upgrading to Pro for 30 searches/month.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed footer with actions */}
        <div className="flex-shrink-0 p-6 pt-4 border-t border-[#424242]/40">
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl bg-[#252525] hover:bg-[#2A2A2A] 
                       text-[#CFCFCF] hover:text-[#F5F5F5] font-semibold transition-all 
                       border border-[#424242]/40 hover:border-[#424242]/60"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={remainingQuota === 0}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 
                       hover:from-blue-600 hover:to-blue-700 text-white font-semibold 
                       transition-all shadow-lg hover:shadow-xl disabled:opacity-50 
                       disabled:cursor-not-allowed disabled:hover:from-blue-500 disabled:hover:to-blue-600
                       disabled:shadow-none"
            >
              {remainingQuota === 0 ? 'No Quota Available' : 'Enable Web Search'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
