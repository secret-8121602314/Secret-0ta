/**
 * User Feedback Modal Component
 * Simple modal for users to report bugs or share general feedback
 */

import React, { useState, useEffect, useRef } from 'react';
import { supabaseService } from '../../services/supabaseService';
import { authService } from '../../services/authService';
import { toastService } from '../../services/toastService';

interface UserFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackType = 'bug' | 'feature' | 'general';

const FEEDBACK_TYPES: { value: FeedbackType; label: string; icon: string }[] = [
  { value: 'bug', label: 'Bug Report', icon: '🐛' },
  { value: 'feature', label: 'Feature Request', icon: '✨' },
  { value: 'general', label: 'General Feedback', icon: '💬' },
];

const UserFeedbackModal: React.FC<UserFeedbackModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFeedbackType('general');
      setMessage('');
      setIsSuccess(false);
      // Focus textarea after a short delay
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSuccess) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, isSuccess]);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toastService.warning('Please enter your feedback.');
      return;
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      toastService.error('You must be logged in to submit feedback.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await supabaseService.submitUserFeedback(
        currentUser.authUserId,
        feedbackType,
        message.trim()
      );

      if (success) {
        setIsSuccess(true);
        // Close after showing success message
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        toastService.error('Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toastService.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  // Show success screen
  if (isSuccess) {
    return (
      <div 
        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <div className="bg-surface border border-surface-light/20 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Thank you!</h3>
          <p className="text-text-muted text-sm">Your feedback has been submitted successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-surface border border-surface-light/20 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-surface-light/20 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-text-primary">Send Feedback</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-light/50 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-4 space-y-4 overflow-y-auto flex-1">
          {/* Feedback Type Selection */}
          <div className="space-y-2">
            <label className="text-sm text-text-muted">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {FEEDBACK_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFeedbackType(type.value)}
                  className={`px-2 sm:px-3 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 ${
                    feedbackType === type.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-surface-light/30 text-text-muted hover:border-surface-light/50 hover:bg-surface-light/20'
                  }`}
                >
                  <span>{type.icon}</span>
                  <span className="text-center leading-tight">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <label className="text-sm text-text-muted">
              {feedbackType === 'bug' 
                ? 'Describe the bug and how to reproduce it' 
                : feedbackType === 'feature' 
                ? 'Describe the feature you\'d like to see'
                : 'Share your thoughts'}
            </label>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                feedbackType === 'bug'
                  ? 'What happened? What were you trying to do?'
                  : feedbackType === 'feature'
                  ? 'What feature would make Otagon better for you?'
                  : 'Tell us what you think...'
              }
              className="w-full h-32 px-4 py-3 bg-[#1A1A1A] border border-surface-light/40 rounded-lg text-text-primary placeholder-text-muted/50 resize-none cursor-text hover:border-surface-light/60 hover:bg-[#1A1A1A]/80 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 focus:bg-[#0F0F0F] transition-all"
            />
          </div>

          <p className="text-xs text-text-muted">
            Your feedback helps us improve Otagon. We read every submission.
          </p>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-surface-light/20 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-surface-light/30 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim()}
            className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              'Send Feedback'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserFeedbackModal;
