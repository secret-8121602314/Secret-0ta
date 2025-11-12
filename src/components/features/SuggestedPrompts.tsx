import React, { useState, useEffect } from 'react';
import { suggestedPromptsService } from '../../services/suggestedPromptsService';
import { newsPrompts } from '../../types';

interface SuggestedPromptsProps {
  prompts: string[];
  onPromptClick: (prompt: string) => void;
  isLoading: boolean;
  conversationId?: string; // To detect "Game Hub" tab
}

const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ 
  prompts, 
  onPromptClick, 
  isLoading,
  conversationId = ''
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(true);
  const [usedPrompts, setUsedPrompts] = useState<Set<string>>(new Set());

  const isGameHub = conversationId === 'game-hub' || conversationId === 'everything-else';
  
  // For Game Hub tab:
  // - If prompts match newsPrompts (initial state), show newsPrompts with usage tracking
  // - If prompts are different (AI-generated), show those instead (contextual suggestions after AI response)
  const isShowingNewsPrompts = isGameHub && 
    (prompts.length === newsPrompts.length && prompts.every((p, i) => p === newsPrompts[i]));
  
  const displayPrompts = isShowingNewsPrompts ? newsPrompts : prompts;

  // Check screen size for mobile accordion
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const apply = () => {
      setIsMobile(mq.matches);
      // Always open on mobile for better UX - users can see suggestions immediately
      setAccordionOpen(true);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Load used prompts status (only for news prompts)
  useEffect(() => {
    if (isShowingNewsPrompts) {
      const used = new Set(newsPrompts.filter(p => suggestedPromptsService.isPromptUsed(p)));
      setUsedPrompts(used);
    }
  }, [isShowingNewsPrompts, displayPrompts]);

  // Handle prompt click
  const handlePromptClick = (prompt: string) => {
    if (isShowingNewsPrompts) {
      // Mark as used for news prompts
      suggestedPromptsService.markPromptAsUsed(prompt);
      setUsedPrompts(prev => new Set([...prev, prompt]));
    }
    onPromptClick(prompt);
  };

  // Don't show if loading or no prompts
  if (isLoading || displayPrompts.length === 0) {
    return null;
  }

  // Hide if all news prompts are used (only for news prompts view)
  if (isShowingNewsPrompts && suggestedPromptsService.areAllPromptsUsed(newsPrompts)) {
    return null;
  }

  return (
    <div className="pt-3 animate-fade-in">
      {/* Mobile accordion header - only for news prompts */}
      {isMobile && isShowingNewsPrompts && (
        <button
          type="button"
          aria-expanded={accordionOpen}
          onClick={() => setAccordionOpen(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-[#424242]/40 bg-[#1C1C1C]/60 text-[#E5E5E5] text-sm font-medium mb-2"
        >
          <span>Gaming News Suggestions</span>
          <svg 
            className={`w-4 h-4 transition-transform ${accordionOpen ? 'rotate-180' : ''}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" 
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}

      {/* Prompts grid - show if not mobile or accordion is open */}
      {(!isMobile || accordionOpen) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {displayPrompts.map((prompt, index) => {
            const isUsed = isShowingNewsPrompts && usedPrompts.has(prompt);
            
            return (
              <button
                key={index}
                onClick={() => !isUsed && handlePromptClick(prompt)}
                disabled={isUsed}
                className={`text-left p-3 sm:p-4 border rounded-lg sm:rounded-xl transition-all duration-200 backdrop-blur-sm ${
                  isUsed 
                    ? 'bg-[#2A2A2A]/60 border-[#555555]/30 text-[#888888] cursor-not-allowed opacity-70' 
                    : 'bg-[#1C1C1C]/60 border-[#424242]/40 text-[#CFCFCF] hover:bg-[#E53A3A]/20 hover:border-[#E53A3A]/60 hover:scale-[1.02] active:scale-95'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-medium text-xs sm:text-sm leading-relaxed flex-1 ${
                    isUsed ? 'text-[#888888]' : 'text-[#CFCFCF]'
                  }`}>
                    {prompt}
                  </p>
                  {isUsed && (
                    <span className="text-[#5CBB7B] text-sm flex-shrink-0" aria-label="Used">
                      ✓
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SuggestedPrompts;
