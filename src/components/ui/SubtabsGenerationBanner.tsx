import React from 'react';

interface SubtabsGenerationBannerProps {
  onGenerate: () => void;
  isGenerating?: boolean;
  progress?: { current: number; total: number; gameName: string } | null;
}

const SubtabsGenerationBanner: React.FC<SubtabsGenerationBannerProps> = ({
  onGenerate,
  isGenerating = false,
  progress = null
}) => {
  return (
    <div className="mx-3 sm:mx-4 lg:mx-6 mb-4 sm:mb-6">
      <div className="bg-gradient-to-r from-[#FF4D4D]/10 to-[#FFAB40]/10 border-2 border-[#FF4D4D]/30 rounded-xl p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-text-primary">
                {isGenerating ? 'Generating Lore & Insights...' : 'Lore & Insights Available'}
              </h3>
              {isGenerating && progress ? (
                <p className="text-sm text-text-secondary">
                  {progress.current} of {progress.total} complete • {progress.gameName}
                </p>
              ) : (
                <p className="text-sm text-text-secondary hidden sm:block">
                  AI-powered game insights for all your games
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-3">
            {!isGenerating ? (
              <button
                onClick={onGenerate}
                className="px-4 sm:px-5 py-2 bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] hover:from-[#E53A3A] hover:to-[#E89B2E] text-white text-sm font-semibold rounded-lg transition-all duration-200 active:scale-95 shadow-lg"
              >
                Generate
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2">
                <div className="w-4 h-4 border-2 border-[#FF4D4D] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-text-secondary">Processing...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubtabsGenerationBanner;
