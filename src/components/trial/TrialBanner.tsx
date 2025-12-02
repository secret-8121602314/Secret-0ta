import React, { useState, useEffect } from 'react';
import { TrialStatus } from '../../types';
import { supabaseService } from '../../services/supabaseService';
import { authService } from '../../services/authService';
import { toastService } from '../../services/toastService';
import Button from '../ui/Button';

interface TrialBannerProps {
  userTier: string;
  onTrialStart: () => void;
}

const TrialBanner: React.FC<TrialBannerProps> = ({ userTier, onTrialStart }) => {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrialConfirmModalOpen, setIsTrialConfirmModalOpen] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);

  useEffect(() => {
    const loadTrialStatus = async () => {
      if (userTier === 'free') {
        try {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            const status = await supabaseService.getTrialStatus(currentUser.authUserId);
            setTrialStatus(status);
          }
        } catch (error) {
          console.error('Error loading trial status:', error);
        }
      }
      setIsLoading(false);
    };

    loadTrialStatus();
  }, [userTier]);

  const handleStartTrial = async () => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || isStartingTrial) {
      return;
    }

    try {
      setIsStartingTrial(true);
      const success = await supabaseService.startTrial(currentUser.authUserId);
      if (success) {
        toastService.success('Pro trial activated! Enjoy your 7-day trial.');
        onTrialStart();
        // Reload trial status
        const status = await supabaseService.getTrialStatus(currentUser.authUserId);
        setTrialStatus(status);
      } else {
        toastService.error('Failed to start trial. Please try again.');
      }
    } catch (error) {
      console.error('Error starting trial:', error);
      toastService.error('Failed to start trial. Please try again.');
    } finally {
      setIsStartingTrial(false);
    }
  };

  if (isLoading || userTier !== 'free' || !trialStatus) {
    return null;
  }

  // Don't show banner if trial has been used and is not active
  if (trialStatus.hasUsed && !trialStatus.isActive) {
    return null;
  }

  // Show trial eligibility banner
  if (trialStatus.isEligible && !trialStatus.isActive) {
    return (
      <>
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Try Pro Free</h3>
                <p className="text-text-secondary">
                  Get 7 days of Pro features. No credit card required.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsTrialConfirmModalOpen(true)}
              variant="primary"
              className="btn-primary-enhanced"
            >
              Start Pro Trial
            </Button>
          </div>
        </div>
        
        {/* Pro Trial Confirmation Modal */}
        {isTrialConfirmModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <div className="bg-surface border border-surface-light/20 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
              {/* Header with icon */}
              <div className="flex items-center justify-center mb-4">
                <img src="/images/icons/pro.png" alt="Pro" className="w-40 h-40" />
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-bold text-center bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] bg-clip-text text-transparent mb-2">
                Unlock Pro Features
              </h3>
              
              {/* Description */}
              <div className="text-center text-text-muted mb-6 space-y-3">
                <p className="text-sm">
                  Try Otagon Pro free for <span className="text-[#FFAB40] font-semibold">7 days</span> — no payment required.
                </p>
                <div className="bg-surface-light/30 rounded-lg p-3 text-left space-y-2">
                  <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">All game tabs auto-generate smart subtabs</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">Keep your subtabs even after trial ends</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-[#FFAB40] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-text-muted">One-time offer per account</span>
                  </div>
                </div>
              </div>
              
              {/* Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsTrialConfirmModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-surface-light/50 hover:bg-surface-light/70 text-text-primary rounded-lg transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsTrialConfirmModalOpen(false);
                    handleStartTrial();
                  }}
                  disabled={isStartingTrial}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] hover:from-[#FF3333] hover:to-[#FF9920] text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStartingTrial ? 'Starting...' : 'Start Free Trial'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Show active trial banner
  if (trialStatus.isActive && trialStatus.daysRemaining !== undefined) {
    const daysLeft = trialStatus.daysRemaining;
    const isExpiringSoon = daysLeft <= 3;
    
    return (
      <div className={`${
        isExpiringSoon 
          ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20' 
          : 'bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20'
      } border rounded-xl p-4 mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 ${
              isExpiringSoon ? 'bg-yellow-500' : 'bg-green-500'
            } rounded-full flex items-center justify-center`}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${
                isExpiringSoon ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {isExpiringSoon ? 'Trial Expiring Soon!' : 'Pro Trial Active'}
              </h3>
              <p className="text-text-secondary">
                {isExpiringSoon 
                  ? `Your trial expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Upgrade now to keep Pro features.`
                  : `You have ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in your free Pro trial.`
                }
              </p>
            </div>
          </div>
          <Button
            onClick={() => {/* Handle upgrade */}}
            variant="primary"
            className="btn-primary-enhanced"
          >
            {isExpiringSoon ? 'Upgrade Now' : 'View Plans'}
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default TrialBanner;

