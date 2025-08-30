

import React from 'react';
import { newsPrompts } from '../services/types';
import { playerProfileService } from '../services/playerProfileService';
import { suggestedPromptsService } from '../services/suggestedPromptsService';

interface SuggestedPromptsProps {
    onPromptClick: (prompt: string) => void;
    isInputDisabled: boolean;
    isFirstTime?: boolean;
}

const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ onPromptClick, isInputDisabled, isFirstTime = false }) => {
    const profile = playerProfileService.getProfile();
    const [isTinyScreen, setIsTinyScreen] = React.useState(false);
    const [accordionOpen, setAccordionOpen] = React.useState(true);

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
    
    // Get unused prompts
    const unusedPrompts = suggestedPromptsService.getUnusedPrompts(newsPrompts);
    const allPromptsUsed = suggestedPromptsService.areAllPromptsUsed(newsPrompts);
    
    // Customize welcome message based on profile and first-time status
    const getWelcomeMessage = () => {
        if (isFirstTime || !profile) {
            return {
                title: "Welcome to Otakon!",
                subtitle: "I'm here to be your spoiler-free guide through any game. To get started, you can upload a screenshot from a game you're currently playing, or just tell me about a game that's on your mind. What have you been playing lately?",
                showPrompts: true,
                showWelcome: true
            };
        }
        
        // For returning users, don't show the welcome message - just show prompts
        return {
            title: "",
            subtitle: "",
            showPrompts: true,
            showWelcome: false
        };
    };

    const welcomeMessage = getWelcomeMessage();

    // Handle prompt click and mark as used
    const handlePromptClick = (prompt: string) => {
        suggestedPromptsService.markPromptAsUsed(prompt);
        onPromptClick(prompt);
    };

    // Don't render if all prompts have been used
    if (allPromptsUsed) {
        return null;
    }

    return (
        <div className="w-full px-4 sm:px-6 md:px-8 max-w-[95%] sm:max-w-4xl md:max-w-5xl mx-auto animate-fade-in">
            {/* Only show welcome message for first-time users */}
            {welcomeMessage.showWelcome && (
                <div className="mb-4 sm:mb-6 md:mb-8 text-center">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#F5F5F5] mb-2 sm:mb-3">{welcomeMessage.title}</h2>
                    <p className="text-[#A3A3A3] text-sm sm:text-base md:text-lg leading-relaxed max-w-4xl mx-auto">
                        {welcomeMessage.subtitle}
                    </p>
                    
                    {/* First-time user tips */}
                    {isFirstTime && (
                        <div className="mt-3 sm:mt-4 md:mt-6 p-2.5 sm:p-3 md:p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg sm:rounded-xl max-w-2xl mx-auto text-left">
                            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-blue-200 mb-1.5 sm:mb-2">Getting Started Tips:</h3>
                            <ul className="text-blue-100 text-xs sm:text-sm space-y-0.5 sm:space-y-1">
                                <li>• <strong>Upload a screenshot</strong> from your game for instant help</li>
                                <li>• <strong>Ask about specific games</strong> you're playing or want to play</li>
                                <li>• <strong>Get spoiler-free guidance</strong> tailored to your progress</li>
                                <li>• <strong>Discover secrets and strategies</strong> without ruining surprises</li>
                            </ul>
                        </div>
                    )}
                </div>
            )}
            
            {/* Core prompts with small-screen accordion */}
            <div className="mb-3 sm:mb-8">
                {isTinyScreen && (
                    <button
                        type="button"
                        aria-expanded={accordionOpen}
                        aria-controls="suggested-prompts-panel"
                        onClick={() => setAccordionOpen(v => !v)}
                        className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-[#424242]/40 bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 text-[#E5E5E5] text-sm font-medium"
                    >
                        <span>Suggestions</span>
                        <svg className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${accordionOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd"/></svg>
                    </button>
                )}
                {(!isTinyScreen || accordionOpen) && (
                    <div id="suggested-prompts-panel" className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mt-2 px-1 sm:px-0">
                        {unusedPrompts.map((prompt) => (
                            <button
                                key={prompt}
                                onClick={() => handlePromptClick(prompt)}
                                disabled={isInputDisabled}
                                className={`group text-left px-2.5 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-3.5 md:py-4 lg:py-6 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 border border-[#424242]/40 text-xs sm:text-sm md:text-base text-[#E5E5E5]
                                            hover:bg-gradient-to-r hover:from-[#E53A3A]/20 hover:to-[#D98C1F]/20 hover:border-[#E53A3A]/60 hover:scale-[1.02] sm:hover:scale-[1.03] md:hover:scale-105 hover:shadow-lg hover:shadow-[#E53A3A]/20
                                            transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFAB40]/50
                                            sm:border-2 md:border-2 sm:hover:shadow-xl sm:hover:shadow-[#E53A3A]/25 min-h-[60px] sm:min-h-[70px] md:min-h-[80px]`}
                            >
                                <span className="block leading-snug sm:leading-relaxed transition-colors group-hover:text-[#F5F5F5]">{prompt}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            

        </div>
    );
};

export default React.memo(SuggestedPrompts);