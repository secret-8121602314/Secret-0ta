

import React, { useState, useEffect } from 'react';
import { aiContextService } from '../services/aiContextService';
import { fixedErrorHandlingService } from '../services/fixedErrorHandlingService';

interface FeedbackModalProps {
  originalText: string;
  onSubmit: (feedbackText: string) => void;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ originalText, onSubmit, onClose }) => {
  const [feedbackText, setFeedbackText] = useState('');
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Get AI insights based on feedback text
  useEffect(() => {
    if (feedbackText.length > 10) {
      generateAIInsights();
    }
  }, [feedbackText]);

  const generateAIInsights = async () => {
    setIsLoadingInsights(true);
    try {
      // Get global learning patterns to provide insights
      const patterns = await aiContextService.getGlobalLearningPatterns();
      const errorPatterns = patterns.filter(p => p.learning_type === 'error_correction');
      
      if (errorPatterns.length > 0) {
        const similarPatterns = errorPatterns
          .filter(p => p.pattern_data.feedback_category === categorizeFeedback(feedbackText))
          .slice(0, 2);
        
        if (similarPatterns.length > 0) {
          const insights = similarPatterns.map(p => 
            `• ${p.pattern_data.feedback_category.replace('_', ' ')} (${p.usage_count} similar reports)`
          ).join('\n');
          
          setAiInsights(`AI has learned from similar feedback:\n${insights}`);
        } else {
          setAiInsights('This appears to be new feedback. Your input will help improve AI responses.');
        }
      } else {
        setAiInsights('Your feedback will help establish learning patterns for better AI responses.');
      }
    } catch (error) {
      await fixedErrorHandlingService.handleError(error, {
        operation: 'generate_ai_insights',
        component: 'FeedbackModal'
      });
      setAiInsights('Your feedback is valuable for improving AI responses.');
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const categorizeFeedback = (text: string): string => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('spoiler')) return 'spoiler_alert';
    if (lowerText.includes('incorrect')) return 'factual_error';
    if (lowerText.includes('unhelpful')) return 'unhelpful_response';
    if (lowerText.includes('format')) return 'formatting_issue';
    if (lowerText.includes('long') || lowerText.includes('short')) return 'response_length';
    return 'general_feedback';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackText.trim()) {
      onSubmit(feedbackText.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/80 to-[#0A0A0A]/80 backdrop-blur-xl flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-gradient-to-r from-[#1C1C1C]/95 to-[#0A0A0A]/95 backdrop-blur-xl border-2 border-[#424242]/60 rounded-3xl shadow-2xl p-10 w-full max-w-2xl m-6 relative flex flex-col max-h-[90vh] animate-scale-in hover:border-[#424242]/80 transition-all duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-bold text-white mb-4 leading-tight">Provide Feedback</h2>
        <p className="text-neutral-300 mb-6 text-lg leading-relaxed">Your feedback is valuable. Please tell us what was wrong with the response so we can improve.</p>

        <div className="mb-6 p-4 bg-gradient-to-r from-black/40 to-neutral-900/40 rounded-2xl border-2 border-neutral-700/60 max-h-40 overflow-y-auto backdrop-blur-sm">
            <p className="text-base text-neutral-400 italic line-clamp-4">Original response: "{originalText}"</p>
        </div>

        {/* AI Learning Insights */}
        {aiInsights && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/20 to-sky-900/20 border-2 border-blue-500/40 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              <h4 className="text-base font-medium text-blue-300">AI Learning Insights</h4>
            </div>
            <p className="text-base text-blue-200 whitespace-pre-line leading-relaxed">{aiInsights}</p>
          </div>
        )}

        {isLoadingInsights && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/20 to-sky-900/20 border-2 border-blue-500/40 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
              <span className="text-base text-blue-300">Analyzing feedback patterns...</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="e.g., The hint was a spoiler, the information was incorrect, the formatting was bad..."
            required
            className="flex-grow w-full bg-gradient-to-r from-[#2E2E2E] to-[#1A1A1A] border-2 border-[#424242]/60 rounded-xl py-3 px-4 text-[#F5F5F5] placeholder-[#6E6E6E] focus:outline-none focus:ring-2 focus:ring-[#FFAB40] focus:border-[#FFAB40]/60 resize-none mb-8 text-base backdrop-blur-sm"
            rows={5}
          />
          <div className="flex flex-col sm:flex-row-reverse gap-4">
            <button
              type="submit"
              disabled={!feedbackText.trim()}
              className="w-full sm:w-auto bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#E53A3A]/25 disabled:opacity-50"
            >
              Send Feedback
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto bg-gradient-to-r from-neutral-600 to-neutral-700 hover:from-neutral-700 hover:to-neutral-800 text-white font-medium py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
