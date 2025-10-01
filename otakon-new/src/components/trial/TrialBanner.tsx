import React, { useState, useEffect } from 'react';
import { TrialStatus } from '../../types';
import { supabaseService } from '../../services/supabaseService';
import { authService } from '../../services/authService';
import Button from '../ui/Button';

interface TrialBannerProps {
  userTier: string;
  onTrialStart: () => void;
}

const TrialBanner: React.FC<TrialBannerProps> = ({ userTier, onTrialStart }) => {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    if (!currentUser) return;

    try {
      const success = await supabaseService.startTrial(currentUser.authUserId);
      if (success) {
        onTrialStart();
        // Reload trial status
        const status = await supabaseService.getTrialStatus(currentUser.authUserId);
        setTrialStatus(status);
      }
    } catch (error) {
      console.error('Error starting trial:', error);
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
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Start Your Free Pro Trial</h3>
              <p className="text-text-secondary">
                Get 14 days of Pro features absolutely free. No credit card required.
              </p>
            </div>
          </div>
          <Button
            onClick={handleStartTrial}
            variant="primary"
            className="btn-primary-enhanced"
          >
            Start Free Trial
          </Button>
        </div>
      </div>
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
