

import React, { useState, useEffect } from 'react';
import ThumbUpIcon from './ThumbUpIcon';
import ThumbDownIcon from './ThumbDownIcon';
import { ChatMessageFeedback } from '../services/types';
// Dynamic import to avoid circular dependency
// import { aiContextService } from '../services/aiContextService';

interface FeedbackButtonsProps {
  onFeedback: (type: 'up' | 'down') => void;
  feedbackState?: ChatMessageFeedback;
}

const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({ onFeedback, feedbackState }) => {
  const hasVoted = !!feedbackState;
  const [aiContext, setAiContext] = useState<string>('');
  const [showContext, setShowContext] = useState(false);

  // Get AI context when component mounts
  useEffect(() => {
    if (!hasVoted) {
      loadAIContext();
    }
  }, [hasVoted]);

  const loadAIContext = async () => {
    try {
      const { aiContextService } = await import('../services/aiContextService');
      const contextString = await aiContextService.generateUserContextForAI();
      if (contextString) {
        setAiContext(contextString);
      }
    } catch (error) {
      console.warn('Failed to load AI context:', error);
    }
  };

  const handleFeedback = async (type: 'up' | 'down') => {
    // Track user behavior for AI learning
    const { aiContextService } = await import('../services/aiContextService');
    await aiContextService.trackUserBehavior(
      'feedback_given',
      { 
        feedback_type: type, 
        timestamp: Date.now(),
        has_ai_context: !!aiContext
      },
      { component: 'FeedbackButtons' }
    );
    
    onFeedback(type);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* AI Context Toggle */}
      {aiContext && !hasVoted && (
        <button
          onClick={() => setShowContext(!showContext)}
          className="text-xs text-[#5B99E3] hover:text-[#7BB3F0] transition-all duration-200 self-start font-medium hover:scale-105"
        >
          {showContext ? 'Hide' : 'Show'} AI Context
        </button>
      )}

      {/* AI Context Display */}
      {showContext && aiContext && (
        <div className="text-xs text-[#5B99E3] bg-[#1C1C1C]/60 border border-[#5B99E3]/30 rounded-xl p-3 mb-2 max-w-xs backdrop-blur-sm">
          <div className="font-semibold mb-2 text-[#7BB3F0]">AI Context:</div>
          <div className="text-[#5B99E3] text-xs opacity-90 leading-relaxed">
            {aiContext.replace(/\[.*?\]/g, '').trim().slice(0, 100)}...
          </div>
        </div>
      )}

      {/* Feedback Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleFeedback('up')}
          disabled={hasVoted}
          aria-pressed={feedbackState === 'up'}
          className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-105
            ${feedbackState === 'up'
              ? 'bg-gradient-to-r from-[#5CBB7B]/20 to-[#4CAF50]/20 text-[#5CBB7B] border-2 border-[#5CBB7B]/60 shadow-[0_0_15px_rgba(92,187,123,0.3)]'
              : 'text-[#A3A3A3] hover:bg-gradient-to-r hover:from-[#5CBB7B]/20 hover:to-[#4CAF50]/20 hover:text-[#5CBB7B] hover:border-2 hover:border-[#5CBB7B]/40 disabled:hover:bg-transparent disabled:opacity-50 disabled:hover:scale-100'
            }`}
          aria-label="Good response"
          title="This response was helpful"
        >
          <ThumbUpIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleFeedback('down')}
          disabled={hasVoted}
          aria-pressed={feedbackState === 'down' || feedbackState === 'submitted'}
          className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-105
            ${feedbackState === 'down' || feedbackState === 'submitted'
              ? 'bg-gradient-to-r from-[#FF4D4D]/20 to-[#FF6B6B]/20 text-[#FF4D4D] border-2 border-[#FF4D4D]/60 shadow-[0_0_15px_rgba(255,77,77,0.3)]'
              : 'text-[#A3A3A3] hover:bg-gradient-to-r hover:from-[#FF4D4D]/20 hover:to-[#FF6B6B]/20 hover:text-[#FF4D4D] hover:border-2 hover:border-[#FF4D4D]/40 disabled:hover:bg-transparent disabled:opacity-50 disabled:hover:scale-100'
            }`}
          aria-label="Bad response"
          title="This response needs improvement"
        >
          <ThumbDownIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default FeedbackButtons;