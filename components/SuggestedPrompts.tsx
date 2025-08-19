

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
    
    // Customize welcome message based on profile and first-time status
    const getWelcomeMessage = () => {
        if (isFirstTime || !profile) {
            return {
                title: "Welcome to Otakon! 🎮",
                subtitle: "I'm here to be your spoiler-free guide through any game. To get started, you can upload a screenshot from a game you're currently playing, or just tell me about a game that's on your mind. What have you been playing lately?",
                showPrompts: true // FIXED: Always show prompts for all users
            };
        }
        
        // Personalized message based on user's profile
        const focusEmoji = {
            'Story-Driven': '📖',
            'Completionist': '🏆',
            'Strategist': '⚔️'
        }[profile.playerFocus] || '🎮';
        
        const styleText = {
            'Cryptic': 'mysterious hints',
            'Balanced': 'balanced guidance',
            'Direct': 'direct advice'
        }[profile.hintStyle] || 'helpful guidance';
        
        return {
            title: `Welcome back, ${focusEmoji} ${profile.playerFocus} gamer!`,
            subtitle: `I'm ready to provide ${styleText} tailored to your ${profile.playerFocus.toLowerCase()} playstyle. What would you like help with today?`,
            showPrompts: true
        };
    };

    const welcomeMessage = getWelcomeMessage();

    return (
        <div className="w-full max-w-5xl mx-auto animate-fade-in">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-[#F5F5F5] mb-3">{welcomeMessage.title}</h2>
                <p className="text-[#A3A3A3] text-lg leading-relaxed max-w-4xl mx-auto">
                    {welcomeMessage.subtitle}
                </p>
                
                {/* First-time user tips */}
                {isFirstTime && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl max-w-2xl mx-auto">
                        <h3 className="text-lg font-semibold text-blue-200 mb-2">💡 Getting Started Tips:</h3>
                        <ul className="text-blue-100 text-sm space-y-1 text-left">
                            <li>• <strong>Upload a screenshot</strong> from your game for instant help</li>
                            <li>• <strong>Ask about specific games</strong> you're playing or want to play</li>
                            <li>• <strong>Get spoiler-free guidance</strong> tailored to your progress</li>
                            <li>• <strong>Discover secrets and strategies</strong> without ruining surprises</li>
                        </ul>
                    </div>
                )}
            </div>
            
            {/* ALWAYS show the 4 core gaming news prompts for ALL users */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {newsPrompts.map((prompt) => (
                    <button
                        key={prompt}
                        onClick={() => onPromptClick(prompt)}
                        disabled={isInputDisabled}
                        className="text-left p-6 bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 border-2 border-[#424242]/40 rounded-2xl transition-all duration-300 hover:bg-gradient-to-r hover:from-[#E53A3A]/20 hover:to-[#D98C1F]/20 hover:border-[#E53A3A]/60 hover:scale-105 hover:shadow-xl hover:shadow-[#E53A3A]/25 disabled:bg-[#1C1C1C]/20 disabled:border-[#2E2E2E] disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none backdrop-blur-sm group"
                    >
                        <p className="text-[#E5E5E5] font-semibold text-base leading-relaxed disabled:text-[#6E6E6E] group-hover:text-[#F5F5F5]">{prompt}</p>
                    </button>
                ))}
            </div>
            
            {/* First-time user action buttons */}
            {isFirstTime && (
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <div className="text-center">
                        <p className="text-[#A3A3A3] text-sm mb-2">Ready to get started?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => onPromptClick("I'm playing a game and need help. Can you identify it from a screenshot?")}
                                disabled={isInputDisabled}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                📸 Upload Screenshot
                            </button>
                            <button
                                onClick={() => onPromptClick("What are some great games to play right now?")}
                                disabled={isInputDisabled}
                                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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