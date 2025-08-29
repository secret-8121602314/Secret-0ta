

import React from 'react';
import { newsPrompts } from '../services/types';
import { playerProfileService } from '../services/playerProfileService';

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
        const mq = window.matchMedia('(max-width: 360px)');
        const apply = () => {
            setIsTinyScreen(mq.matches);
            setAccordionOpen(!mq.matches); // collapse by default on tiny screens
        };
        apply();
        mq.addEventListener('change', apply);
        return () => mq.removeEventListener('change', apply);
    }, []);
    
    // Customize welcome message based on profile and first-time status
    const getWelcomeMessage = () => {
        if (isFirstTime || !profile) {
            return {
                title: "Welcome to Otakon! 🎮",
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

    return (
        <div className="w-full max-w-5xl mx-auto animate-fade-in">
            {/* Only show welcome message for first-time users */}
            {welcomeMessage.showWelcome && (
                <div className="mb-6 sm:mb-8 text-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F5] mb-2 sm:mb-3">{welcomeMessage.title}</h2>
                    <p className="text-[#A3A3A3] text-base sm:text-lg leading-relaxed max-w-4xl mx-auto">
                        {welcomeMessage.subtitle}
                    </p>
                    
                    {/* First-time user tips */}
                    {isFirstTime && (
                        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl max-w-2xl mx-auto text-left">
                            <h3 className="text-base sm:text-lg font-semibold text-blue-200 mb-2">💡 Getting Started Tips:</h3>
                            <ul className="text-blue-100 text-xs sm:text-sm space-y-1">
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
                        className="w-full flex items-center justify-between px-4 py-2 rounded-xl border border-[#424242]/40 bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 text-[#E5E5E5] text-sm"
                    >
                        <span>Suggestions</span>
                        <svg className={`w-4 h-4 transition-transform ${accordionOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd"/></svg>
                    </button>
                )}
                {(!isTinyScreen || accordionOpen) && (
                    <div id="suggested-prompts-panel" className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 mt-2">
                        {newsPrompts.map((prompt) => (
                            <button
                                key={prompt}
                                onClick={() => onPromptClick(prompt)}
                                disabled={isInputDisabled}
                                className={`group text-left px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 border border-[#424242]/40 text-sm text-[#E5E5E5]
                                            hover:bg-gradient-to-r hover:from-[#E53A3A]/20 hover:to-[#D98C1F]/20 hover:border-[#E53A3A]/60 hover:scale-[1.03] hover:shadow-lg hover:shadow-[#E53A3A]/20
                                            transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFAB40]/50
                                            sm:rounded-2xl sm:border-2 sm:p-6 sm:text-base sm:hover:scale-105 sm:hover:shadow-xl sm:hover:shadow-[#E53A3A]/25`}
                            >
                                <span className="block leading-snug sm:leading-relaxed transition-colors group-hover:text-[#F5F5F5]">{prompt}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            {/* First-time user action buttons */}
            {isFirstTime && (
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                    <div className="text-center">
                        <p className="text-[#A3A3A3] text-sm mb-2">Ready to get started?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => onPromptClick("I'm playing a game and need help. Can you identify it from a screenshot?")}
                                disabled={isInputDisabled}
                                className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                            >
                                📸 Upload Screenshot
                            </button>
                            <button
                                onClick={() => onPromptClick("What are some great games to play right now?")}
                                disabled={isInputDisabled}
                                className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                            >
                                🎮 Game Recommendations
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(SuggestedPrompts);