/**
 * Feedback Modal Component
 * Shows when user clicks thumbs down - allows detailed feedback submission
 * Now includes correction mode for teaching the AI better responses
 */

import React, { useState, useEffect } from 'react';
import { FeedbackCategory } from '../../services/feedbackService';
import type { CorrectionType, CorrectionScope } from '../../services/ai/behaviorService';
import { correctionService } from '../../services/ai/correctionService';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (category: FeedbackCategory, comment: string) => void;
  onSubmitCorrection?: (
    correctionText: string, 
    correctionType: CorrectionType, 
    correctionScope: CorrectionScope
  ) => Promise<{ success: boolean; error?: string }>;
  isSubmitting?: boolean;
  isAuthenticated?: boolean; // New prop to check if user is logged in
  originalResponse?: string; // For correction context
  gameTitle?: string | null; // For game-specific corrections
}

const FEEDBACK_CATEGORIES: { value: FeedbackCategory; label: string; description: string; icon: string }[] = [
  { 
    value: 'not_helpful', 
    label: 'Not Helpful', 
    description: "The response didn't answer my question or solve my problem",
    icon: '❌'
  },
  { 
    value: 'incorrect', 
    label: 'Incorrect Information', 
    description: 'The response contained wrong or outdated information',
    icon: '⚠️'
  },
  { 
    value: 'off_topic', 
    label: 'Off Topic', 
    description: "The response wasn't relevant to gaming or my question",
    icon: '🎯'
  },
  { 
    value: 'inappropriate', 
    label: 'Inappropriate', 
    description: 'The response was offensive or inappropriate',
    icon: '🚫'
  },
  { 
    value: 'correction', 
    label: 'Teach OTAKON', 
    description: 'Help OTAKON learn the correct answer for next time',
    icon: '🎓'
  },
  { 
    value: 'other', 
    label: 'Other', 
    description: 'Something else was wrong with the response',
    icon: '💭'
  },
];

const CORRECTION_TYPES: { value: CorrectionType; label: string }[] = [
  { value: 'factual', label: 'Wrong facts/info' },
  { value: 'terminology', label: 'Wrong terminology' },
  { value: 'style', label: 'Tone/style issue' },
  { value: 'behavior', label: 'Behavior/approach' },
];

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSubmitCorrection,
  isSubmitting = false,
  isAuthenticated = true,
  originalResponse = '',
  gameTitle = null,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | null>(null);
  const [comment, setComment] = useState('');
  
  // Correction-specific state
  const [correctionText, setCorrectionText] = useState('');
  const [correctionType, setCorrectionType] = useState<CorrectionType>('factual');
  const [correctionScope, setCorrectionScope] = useState<CorrectionScope>(gameTitle ? 'game' : 'global');
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const [correctionSuccess, setCorrectionSuccess] = useState(false);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number>(3);

  // Reset state when modal opens and check rate limit
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(null);
      setComment('');
      setCorrectionText('');
      setCorrectionType('factual');
      setCorrectionScope(gameTitle ? 'game' : 'global');
      setCorrectionError(null);
      setCorrectionSuccess(false);
      
      // Check rate limit for corrections
      const rateLimit = correctionService.getRateLimitStatus();
      setRateLimitRemaining(rateLimit.remaining);
    }
  }, [isOpen, gameTitle]);

  const handleSubmit = async () => {
    if (!selectedCategory) {
      return;
    }
    
    // Handle correction submission separately
    if (selectedCategory === 'correction' && onSubmitCorrection) {
      // Check authentication first
      if (!isAuthenticated) {
        setCorrectionError('Please sign in to teach OTAKON');
        return;
      }
      
      // Check rate limit
      if (rateLimitRemaining <= 0) {
        setCorrectionError('Daily correction limit reached (3/day). Try again tomorrow.');
        return;
      }
      
      if (!correctionText.trim()) {
        setCorrectionError('Please enter a correction');
        return;
      }
      
      const result = await onSubmitCorrection(correctionText, correctionType, correctionScope);
      if (result.success) {
        setCorrectionSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setCorrectionError(result.error || 'Failed to submit correction');
      }
      return;
    }
    
    // Regular feedback
    onSubmit(selectedCategory, comment);
  };

  const handleClose = () => {
    setSelectedCategory(null);
    setComment('');
    setCorrectionText('');
    setCorrectionError(null);
    setCorrectionSuccess(false);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  const showCorrectionUI = selectedCategory === 'correction' && onSubmitCorrection;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-[#1C1C1C] border border-[#424242] rounded-xl w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#424242]">
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <h2 className="text-lg font-semibold text-[#F5F5F5]">Help Us Improve</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-[#A3A3A3] hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-[#CFCFCF]">
            What was wrong with this response? Your feedback helps Otagon improve.
          </p>

          {/* Category Selection */}
          <div className="space-y-2">
            {FEEDBACK_CATEGORIES.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedCategory === category.value
                    ? 'border-[#FF4D4D] bg-[#FF4D4D]/10'
                    : 'border-[#424242] hover:border-[#666] bg-[#2A2A2A]/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{category.icon}</span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedCategory === category.value
                      ? 'border-[#FF4D4D]'
                      : 'border-[#666]'
                  }`}>
                    {selectedCategory === category.value && (
                      <div className="w-2 h-2 rounded-full bg-[#FF4D4D]" />
                    )}
                  </div>
                  <span className="font-medium text-[#F5F5F5]">{category.label}</span>
                </div>
                <p className="text-xs text-[#A3A3A3] mt-1 ml-8">{category.description}</p>
              </button>
            ))}
          </div>

          {/* Correction UI - shown when "Teach OTAKON" is selected */}
          {showCorrectionUI && (
            <div className="space-y-3 p-3 bg-[#2A2A2A]/70 rounded-lg border border-[#FFAB40]/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#FFAB40]">
                  <span className="text-lg">🎓</span>
                  <span className="font-medium text-sm">Teach OTAKON</span>
                </div>
                {/* Rate limit indicator */}
                <span className={`text-xs ${rateLimitRemaining > 0 ? 'text-[#A3A3A3]' : 'text-red-400'}`}>
                  {rateLimitRemaining}/3 corrections left today
                </span>
              </div>
              
              {/* Not authenticated warning */}
              {!isAuthenticated && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-sm">⚠️ Sign in required to teach OTAKON</p>
                </div>
              )}
              
              {/* Success message */}
              {correctionSuccess && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 text-sm flex items-center gap-2">
                    <span>✓</span> Correction submitted! OTAKON will learn from this.
                  </p>
                </div>
              )}
              
              {/* Error message */}
              {correctionError && !correctionSuccess && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{correctionError}</p>
                </div>
              )}
              
              {!correctionSuccess && isAuthenticated && (
                <>
                  {/* Original response preview */}
                  {originalResponse && (
                    <div className="text-xs">
                      <span className="text-[#666]">Original response:</span>
                      <p className="text-[#A3A3A3] mt-1 line-clamp-2 italic">
                        "{originalResponse.slice(0, 150)}..."
                      </p>
                    </div>
                  )}
                  
                  {/* Correction type */}
                  <div>
                    <label className="block text-xs text-[#CFCFCF] mb-1">What type of correction?</label>
                    <div className="flex flex-wrap gap-2">
                      {CORRECTION_TYPES.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setCorrectionType(type.value)}
                          className={`px-3 py-1 text-xs rounded-full border transition-all ${
                            correctionType === type.value
                              ? 'border-[#FFAB40] bg-[#FFAB40]/20 text-[#FFAB40]'
                              : 'border-[#424242] text-[#A3A3A3] hover:border-[#666]'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Correction scope */}
                  <div>
                    <label className="block text-xs text-[#CFCFCF] mb-1">Apply this correction to:</label>
                    <div className="flex gap-2">
                      {gameTitle && (
                        <button
                          onClick={() => setCorrectionScope('game')}
                          className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-all ${
                            correctionScope === 'game'
                              ? 'border-[#FFAB40] bg-[#FFAB40]/20 text-[#FFAB40]'
                              : 'border-[#424242] text-[#A3A3A3] hover:border-[#666]'
                          }`}
                        >
                          🎮 Only {gameTitle}
                        </button>
                      )}
                      <button
                        onClick={() => setCorrectionScope('global')}
                        className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-all ${
                          correctionScope === 'global'
                            ? 'border-[#FFAB40] bg-[#FFAB40]/20 text-[#FFAB40]'
                            : 'border-[#424242] text-[#A3A3A3] hover:border-[#666]'
                        }`}
                      >
                        🌐 All games
                      </button>
                    </div>
                  </div>
                  
                  {/* Correction text */}
                  <div>
                    <label className="block text-xs text-[#CFCFCF] mb-1">What should OTAKON say instead?</label>
                    <textarea
                      value={correctionText}
                      onChange={(e) => setCorrectionText(e.target.value)}
                      placeholder="Enter the correct information or how OTAKON should respond..."
                      className="w-full p-3 bg-[#1C1C1C] border border-[#424242] rounded-lg text-[#F5F5F5] placeholder-[#666] focus:outline-none focus:border-[#FFAB40] resize-none text-sm"
                      rows={3}
                      maxLength={1000}
                    />
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-[#666]">AI will validate this correction</p>
                      <p className="text-xs text-[#666]">{correctionText.length}/1000</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Comment Box - hidden when correction UI is shown */}
          {!showCorrectionUI && (
            <div>
              <label className="block text-sm font-medium text-[#CFCFCF] mb-2">
                Additional details (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us more about what went wrong..."
                className="w-full p-3 bg-[#2A2A2A] border border-[#424242] rounded-lg text-[#F5F5F5] placeholder-[#666] focus:outline-none focus:border-[#FF4D4D] resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-[#666] mt-1 text-right">{comment.length}/500</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[#424242]">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-[#A3A3A3] hover:text-white transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedCategory || isSubmitting || (showCorrectionUI && correctionSuccess)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              selectedCategory && !isSubmitting && !(showCorrectionUI && correctionSuccess)
                ? 'bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] text-white hover:opacity-90'
                : 'bg-[#424242] text-[#666] cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {showCorrectionUI ? 'Validating...' : 'Submitting...'}
              </span>
            ) : showCorrectionUI ? (
              'Teach OTAKON'
            ) : (
              'Submit Feedback'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
