

import React from 'react';
import { newsPrompts } from '../services/types';
// Dynamic import to avoid circular dependency
// import { suggestedPromptsService } from '../services/suggestedPromptsService';

interface SuggestedPromptsProps {
    onPromptClick: (prompt: string) => void;
    isInputDisabled: boolean;
    isFirstTime?: boolean;
    isEverythingElse?: boolean; // Only show in Everything Else tab
    hasGamePills?: boolean; // Hide if game pills exist
    aiResponseHasSuggestions?: boolean; // Hide if AI response has its own suggestions
}

const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ 
    onPromptClick, 
    isInputDisabled, 
    isFirstTime = false,
    isEverythingElse = false,
    hasGamePills = false,
    aiResponseHasSuggestions = false
}) => {
    const [isTinyScreen, setIsTinyScreen] = React.useState(false);
    const [accordionOpen, setAccordionOpen] = React.useState(true);
    const [unusedPrompts, setUnusedPrompts] = React.useState<string[]>([]);
    const [usedPrompts, setUsedPrompts] = React.useState<string[]>([]);
    const [allPromptsUsed, setAllPromptsUsed] = React.useState(false);

    React.useEffect(() => {
        const mq = window.matchMedia('(max-width: 480px)'); // Increased breakpoint for better mobile experience
        const apply = () => {
            setIsTinyScreen(mq.matches);
            setAccordionOpen(!mq.matches); // collapse by default on tiny screens
        };
        apply();
        mq.addEventListener('change', apply);
        return () => mq.removeEventListener('change', apply);
    }, []);
    
    React.useEffect(() => {
        const loadPrompts = async () => {
            const { suggestedPromptsService } = await import('../services/suggestedPromptsService');
            const unused = suggestedPromptsService.getUnusedPrompts(newsPrompts);
            const used = newsPrompts.filter(prompt => suggestedPromptsService.isPromptUsed(prompt));
            const allUsed = suggestedPromptsService.areAllPromptsUsed(newsPrompts);
            setUnusedPrompts(unused);
            setUsedPrompts(used);
            setAllPromptsUsed(allUsed);
        };
        loadPrompts();
    }, []);

    // Force re-render when prompts change (e.g., after clicking one)
    React.useEffect(() => {
        const loadPrompts = async () => {
            const { suggestedPromptsService } = await import('../services/suggestedPromptsService');
            const unused = suggestedPromptsService.getUnusedPrompts(newsPrompts);
            const used = newsPrompts.filter(prompt => suggestedPromptsService.isPromptUsed(prompt));
            const allUsed = suggestedPromptsService.areAllPromptsUsed(newsPrompts);
            setUnusedPrompts(unused);
            setUsedPrompts(used);
            setAllPromptsUsed(allUsed);
        };
        loadPrompts();
    }, [onPromptClick]); // Re-run when onPromptClick changes (after a prompt is clicked)
    
    // Always show prompts, no welcome message (handled by system message)
    const showPrompts = true;

    // Handle prompt click and mark as used
    const handlePromptClick = async (prompt: string) => {
        const { suggestedPromptsService } = await import('../services/suggestedPromptsService');
        suggestedPromptsService.markPromptAsUsed(prompt);
        onPromptClick(prompt);
    };

    // Don't render if all prompts have been used
    if (allPromptsUsed) {
        return null;
    }

    // Show prompts in Everything Else tab, hide if game pills exist or AI response has suggestions
    if (!isEverythingElse || hasGamePills || aiResponseHasSuggestions) {
        return null;
    }

    return (
        <div className="flex items-start gap-1.5 sm:gap-2 animate-fade-in">
            {/* Empty space to match logo alignment */}
            <div className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"></div>
            {/* 2x2 matrix layout for all 4 prompts - aligned with chat messages */}
            <div className="bg-[#1A1A1A]/95 backdrop-blur-md border border-[#424242]/40 rounded-xl p-1.5 sm:p-2 shadow-2xl max-w-[95%] sm:max-w-4xl md:max-w-5xl">
                {isTinyScreen && (
                    <button
                        type="button"
                        aria-expanded={accordionOpen}
                        aria-controls="suggested-prompts-panel"
                        onClick={() => setAccordionOpen(v => !v)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-[#424242]/40 bg-[#1C1C1C]/60 text-[#E5E5E5] text-sm font-medium mb-2"
                    >
                        <span>Suggestions</span>
                        <svg className={`w-4 h-4 transition-transform ${accordionOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd"/></svg>
                    </button>
                )}
                {(!isTinyScreen || accordionOpen) && (
                    <div id="suggested-prompts-panel" className="grid grid-cols-2 gap-1.5 sm:gap-2">
                        {newsPrompts.map((prompt) => {
                            const isUsed = usedPrompts.includes(prompt);
                            return (
                                <button
                                    key={prompt}
                                    onClick={() => !isUsed && handlePromptClick(prompt)}
                                    disabled={isInputDisabled || isUsed}
                                    className={`group text-left px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg min-h-[36px] sm:min-h-[40px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFAB40]/50 touch-friendly ${
                                        isUsed 
                                            ? 'bg-gradient-to-r from-[#2A2A2A]/60 to-[#1A1A1A]/60 border border-[#555555]/30 text-[#888888] cursor-not-allowed' 
                                            : 'bg-gradient-to-r from-[#1C1C1C]/80 to-[#0A0A0A]/80 border border-[#424242]/40 text-[#E5E5E5] hover:bg-gradient-to-r hover:from-[#E53A3A]/20 hover:to-[#D98C1F]/20 hover:border-[#E53A3A]/60 hover:scale-105 hover:shadow-lg hover:shadow-[#E53A3A]/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
                                    }`}
                                >
                                    <span className={`block transition-colors leading-tight ${
                                        isUsed 
                                            ? 'text-[#888888]' 
                                            : 'group-hover:text-[#F5F5F5]'
                                    }`}>
                                        {prompt}
                                        {isUsed && <span className="ml-2 text-xs opacity-60">✓</span>}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(SuggestedPrompts);