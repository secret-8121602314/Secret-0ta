import React from 'react';

interface SuggestedPromptsProps {
  prompts: string[];
  onPromptClick: (prompt: string) => void;
  isLoading: boolean;
}

const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ 
  prompts, 
  onPromptClick, 
  isLoading 
}) => {
  if (isLoading || prompts.length === 0) {
    return null; // Don't show anything while AI is thinking or if no prompts
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-3 animate-fade-in">
      {prompts.map((prompt, index) => (
        <button
          key={index}
          onClick={() => onPromptClick(prompt)}
          className="text-left p-3 sm:p-4 bg-[#1C1C1C]/60 border border-[#424242]/40 rounded-lg sm:rounded-xl transition-all duration-200 hover:bg-[#E53A3A]/20 hover:border-[#E53A3A]/60 hover:scale-[1.02] backdrop-blur-sm"
        >
          <p className="text-[#CFCFCF] font-medium text-xs sm:text-sm leading-relaxed">{prompt}</p>
        </button>
      ))}
    </div>
  );
};

export default SuggestedPrompts;
