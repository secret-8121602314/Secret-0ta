import React, { useEffect, useRef, useState } from 'react';
import { UserTier } from '../../types';
import { authService } from '../../services/authService';
import { supabaseService } from '../../services/supabaseService';
import { toastService } from '../../services/toastService';
import UserFeedbackModal from '../modals/UserFeedbackModal';

interface SettingsContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenGuide?: () => void;
  onLogout: () => void;
  userTier?: UserTier;
  onTrialStart?: () => void;
  onUpgradeClick?: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}

const SettingsContextMenu: React.FC<SettingsContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  onOpenSettings,
  onOpenGuide,
  onLogout,
  userTier,
  onTrialStart,
  onUpgradeClick,
  buttonRef,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isTrialEligible, setIsTrialEligible] = useState(false);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialExpiresAt, setTrialExpiresAt] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [isLoadingTrialStatus, setIsLoadingTrialStatus] = useState(true); // Prevents flash
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isTrialConfirmModalOpen, setIsTrialConfirmModalOpen] = useState(false);

  // Check trial status when menu opens
  useEffect(() => {
    const checkTrialStatus = async () => {
      // Check trial status for both free and pro users (pro could be on trial)
      if (isOpen) {
        setIsLoadingTrialStatus(true); // Start loading
        try {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            const status = await supabaseService.getTrialStatus(currentUser.authUserId);
            if (status) {
              // For free users: show trial eligibility
              // For pro users on trial: show the timer
              setIsTrialEligible(status.isEligible && !status.isActive && userTier === 'free');
              setIsTrialActive(status.isActive);
              setTrialExpiresAt(status.expiresAt || null);
            }
          }
        } catch (error) {
          console.error('Error checking trial status:', error);
          setIsTrialEligible(userTier === 'free');
          setIsTrialActive(false);
        } finally {
          setIsLoadingTrialStatus(false); // Done loading
        }
      } else {
        // Reset when menu closes
        setIsTrialEligible(false);
        setIsTrialActive(false);
        setTrialExpiresAt(null);
        setTimeRemaining('');
        setIsLoadingTrialStatus(true); // Reset to loading for next open
      }
    };

    checkTrialStatus();
  }, [isOpen, userTier]);

  // Timer countdown for active trial
  useEffect(() => {
    if (!isTrialActive || !trialExpiresAt) {
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const remaining = trialExpiresAt - now;

      if (remaining <= 0) {
        setTimeRemaining('Trial Expired');
        setIsTrialActive(false);
        return;
      }

      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isTrialActive, trialExpiresAt]);

  // Click outside handler - exclude the toggle button to allow proper toggle behavior
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      // Don't close if clicking inside the menu
      if (menuRef.current && menuRef.current.contains(target)) {
        return;
      }
      // Don't close if clicking on the toggle button (let the button handler manage toggle)
      if (buttonRef?.current && buttonRef.current.contains(target)) {
        return;
      }
      onClose();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      // Small delay to avoid catching the same click that opened the menu
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
      }, 10);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, buttonRef]);

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
        
        // Close the menu first
        onClose();
        
        // Refresh trial status to show timer
        const status = await supabaseService.getTrialStatus(currentUser.authUserId);
        if (status) {
          setIsTrialEligible(false);
          setIsTrialActive(status.isActive);
          setTrialExpiresAt(status.expiresAt || null);
        }
        
        if (onTrialStart) {
          onTrialStart();
        }
      } else {
        console.error('❌ Failed to start trial');
        toastService.error('Failed to start trial. Please try again.');
      }
    } catch (error) {
      console.error('Error starting trial:', error);
      toastService.error('Failed to start trial. Please try again.');
    } finally {
      setIsStartingTrial(false);
    }
  };

  // Calculate safe position within viewport
  const getMenuPosition = () => {
    const menuWidth = 200;
    const menuHeight = 280; // Approximate max height
    const padding = 8;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 600;
    
    let left = position.x;
    let top = position.y;
    
    // Horizontal positioning - keep menu on screen
    // Try to center horizontally on the click point
    left = Math.max(padding + menuWidth / 2, Math.min(left, viewportWidth - menuWidth / 2 - padding));
    
    // Vertical positioning - prefer showing below, but flip above if needed
    const showAbove = position.y + menuHeight + padding > viewportHeight;
    if (showAbove) {
      top = position.y - menuHeight - 10;
      // Make sure it doesn't go off the top
      top = Math.max(padding, top);
    } else {
      top = position.y + 10;
    }
    
    return { left, top };
  };

  if (!isOpen) {
    // Still render modals even when menu is closed
    return (
      <>
        <UserFeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
        />
        
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

  const safePosition = getMenuPosition();

  return (
    <>
    <div
      ref={menuRef}
      className="fixed z-[100] bg-surface border border-surface-light/20 rounded-lg shadow-xl py-2 min-w-[200px]"
      style={{
        left: safePosition.left,
        top: safePosition.top,
        transform: 'translateX(-50%)',
      }}
    >
      {/* Settings Option */}
      <button
        onClick={() => {
          onOpenSettings();
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-text-primary hover:bg-surface-light/50 transition-colors duration-200 flex items-center space-x-3"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>Settings</span>
      </button>

      {/* Guide Option */}
      {onOpenGuide && (
        <button
          onClick={() => {
            onOpenGuide();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-text-primary hover:bg-gradient-to-r hover:from-[#FF4D4D]/10 hover:to-[#FFAB40]/10 transition-colors duration-200 flex items-center space-x-3"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span>Guide</span>
        </button>
      )}

      {/* Feedback Option */}
      <button
        onClick={() => {
          setIsFeedbackModalOpen(true);
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-text-primary hover:bg-surface-light/50 transition-colors duration-200 flex items-center space-x-3"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span>Send Feedback</span>
      </button>

      {/* Trial-related options - only render after loading completes to prevent flash */}
      {userTier === 'free' && (
        <>
          {/* Trial Status Display */}
          {!isLoadingTrialStatus && isTrialActive && timeRemaining && (
            <div className="w-full px-4 py-2 text-left text-blue-400 flex items-center space-x-3 cursor-default">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm">Pro Trial: {timeRemaining}</span>
            </div>
          )}

          {/* Start Free Trial - Only show for eligible users after loading */}
          {!isLoadingTrialStatus && isTrialEligible && !isTrialActive && (
            <button
              onClick={() => {
                setIsTrialConfirmModalOpen(true);
                onClose();
              }}
              className="w-full px-4 py-2 text-left text-blue-400 hover:bg-blue-500/10 transition-colors duration-200 flex items-center space-x-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Start Pro Trial</span>
            </button>
          )}

          {/* Upgrade to Pro - Show when trial expired and loading is done */}
          {!isLoadingTrialStatus && !isTrialEligible && !isTrialActive && (
            <button
              onClick={() => {
                if (onUpgradeClick) {
                  onUpgradeClick();
                }
                onClose();
              }}
              className="w-full px-4 py-2 text-left text-[#FFAB40] hover:bg-gradient-to-r hover:from-[#FF4D4D]/10 hover:to-[#FFAB40]/10 transition-colors duration-200 flex items-center space-x-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span>Upgrade to Pro</span>
            </button>
          )}
        </>
      )}

      {/* Trial timer for Pro users who are on trial */}
      {userTier === 'pro' && !isLoadingTrialStatus && isTrialActive && timeRemaining && (
        <div className="w-full px-4 py-2 text-left text-blue-400 flex items-center space-x-3 cursor-default">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-sm">Pro Trial: {timeRemaining}</span>
        </div>
      )}

      {/* Divider before logout */}
      <div className="border-t border-surface-light/20 my-1" />

      {/* Logout Option */}
      <button
        onClick={() => {
          onLogout();
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 transition-colors duration-200 flex items-center space-x-3"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span>Logout</span>
      </button>

      {/* User Feedback Modal */}
      <UserFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
    </>
  );
};

export default SettingsContextMenu;

