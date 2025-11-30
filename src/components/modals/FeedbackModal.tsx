/**
 * Feedback Modal Component
 * Shows when user clicks thumbs down - allows detailed feedback submission
 */

import React, { useState, useEffect } from 'react';
import { FeedbackCategory } from '../../services/feedbackService';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (category: FeedbackCategory, comment: string) => void;
  isSubmitting?: boolean;
}

const FEEDBACK_CATEGORIES: { value: FeedbackCategory; label: string; description: string }[] = [
  { 
    value: 'not_helpful', 
    label: 'Not Helpful', 
    description: "The response didn't answer my question or solve my problem" 
  },
  { 
    value: 'incorrect', 
    label: 'Incorrect Information', 
    description: 'The response contained wrong or outdated information' 
  },
  { 
    value: 'off_topic', 
    label: 'Off Topic', 
    description: "The response wasn't relevant to gaming or my question" 
  },
  { 
    value: 'inappropriate', 
    label: 'Inappropriate', 
    description: 'The response was offensive or inappropriate' 
  },
  { 
    value: 'other', 
    label: 'Other', 
    description: 'Something else was wrong with the response' 
  },
];

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | null>(null);
  const [comment, setComment] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(null);
      setComment('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!selectedCategory) {
      return;
    }
    onSubmit(selectedCategory, comment);
  };

  const handleClose = () => {
    setSelectedCategory(null);
    setComment('');
    onClose();
  };

  if (!isOpen) {
    return null;
  }

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
                <p className="text-xs text-[#A3A3A3] mt-1 ml-6">{category.description}</p>
              </button>
            ))}
          </div>

          {/* Comment Box */}
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
            disabled={!selectedCategory || isSubmitting}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              selectedCategory && !isSubmitting
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
                Submitting...
              </span>
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
