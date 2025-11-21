import React, { useEffect, useRef, useState } from 'react';
import { UserTier } from '../../types';
import { authService } from '../../services/authService';
import { supabaseService } from '../../services/supabaseService';
import { toastService } from '../../services/toastService';

interface SettingsContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenGuide?: () => void;
  onLogout: () => void;
  userTier?: UserTier;
  onTrialStart?: () => void;
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
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  // Optimistic: Show trial button immediately for free users, hide if check fails
  const [isTrialEligible, setIsTrialEligible] = useState(userTier === 'free');
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = React.useState(position);

  // Viewport-aware positioning
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const menu = menuRef.current;
    const menuRect = menu.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    const padding = 16;

    let { x, y } = position;

    // Horizontal boundary check
    const menuHalfWidth = menuRect.width / 2;
    if (x - menuHalfWidth < padding) {
      x = menuHalfWidth + padding;
    } else if (x + menuHalfWidth > viewport.width - padding) {
      x = viewport.width - menuHalfWidth - padding;
    }

    // Vertical boundary check
    const spaceBelow = viewport.height - y;
    const spaceAbove = y;
    
    if (spaceBelow < menuRect.height + padding && spaceAbove > spaceBelow) {
      y = Math.max(padding, y - 10);
    } else if (y < padding) {
      y = padding + 10;
    }

    setAdjustedPosition({ x, y });
  }, [isOpen, position]);

  // Check trial eligibility when menu opens
  useEffect(() => {
    const checkTrialEligibility = async () => {
      if (isOpen && userTier === 'free') {
        try {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            const status = await supabaseService.getTrialStatus(currentUser.authUserId);
            setIsTrialEligible(status?.isEligible && !status?.isActive || false);
          }
        } catch (error) {
          console.error('Error checking trial eligibility:', error);
          // Keep showing the button on error - user can try
          setIsTrialEligible(true);
        }
      } else {
        setIsTrialEligible(false);
      }
    };

    checkTrialEligibility();
  }, [isOpen, userTier]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

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
        if (onTrialStart) {
          onTrialStart();
        }
        onClose();
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

  if (!isOpen) {
    return null;
  }

  const calculateTransform = () => {
    if (!menuRef.current) return 'translate(-50%, 10px)';
    
    const menuRect = menuRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - adjustedPosition.y;
    
    if (spaceBelow > menuRect.height + 20) {
      return 'translate(-50%, 10px)';
    } else {
      return 'translate(-50%, calc(-100% - 10px))';
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-surface border border-surface-light/20 rounded-lg shadow-xl py-2 min-w-[200px] max-h-[80vh] overflow-y-auto custom-scrollbar"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        transform: calculateTransform(),
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

      {/* Start Free Trial - Only show for free users who haven't used trial */}
      {isTrialEligible && (
        <button
          onClick={handleStartTrial}
          disabled={isStartingTrial}
          className="w-full px-4 py-2 text-left text-blue-400 hover:bg-blue-500/10 transition-colors duration-200 flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>{isStartingTrial ? 'Starting...' : 'Start 7-Day Pro Trial'}</span>
        </button>
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
    </div>
  );
};

export default SettingsContextMenu;

