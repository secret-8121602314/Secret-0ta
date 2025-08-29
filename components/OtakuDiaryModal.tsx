import React from 'react';
import OtakuDiaryTab from './OtakuDiaryTab';

interface OtakuDiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameTitle: string;
}

export const OtakuDiaryModal: React.FC<OtakuDiaryModalProps> = ({
  isOpen,
  onClose,
  gameId,
  gameTitle
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-[#0A0A0A] via-[#1C1C1C] to-[#0F0F0F] border-2 border-[#E53A3A]/40 rounded-3xl shadow-2xl w-full max-w-6xl mx-auto relative animate-scale-in flex flex-col max-h-[95vh] h-auto hover:border-[#E53A3A]/60 transition-all duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced Header - Responsive Design */}
        <div className="bg-gradient-to-r from-[#E53A3A] via-[#D98C1F] to-[#E53A3A] p-4 sm:p-6 rounded-t-3xl relative overflow-hidden">
          {/* Background Pattern - Subtle */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-white/20 p-2 sm:p-3 rounded-2xl backdrop-blur-sm">
                  <span className="text-xl sm:text-2xl">📖</span>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">Otaku Diary</h2>
                  <p className="text-white/90 mt-1 text-sm sm:text-base lg:text-lg">Game: {gameTitle}</p>
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-1">
                      <span className="inline-block bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full border border-yellow-500/30">
                        🔧 Dev Mode - localStorage
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-white/80 transition-all duration-300 hover:scale-110 bg-white/10 hover:bg-white/20 p-2 sm:p-3 rounded-2xl backdrop-blur-sm self-end sm:self-auto"
                aria-label="Close Otaku Diary"
              >
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area - Responsive Layout */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <OtakuDiaryTab 
            gameId={gameId}
            gameTitle={gameTitle}
          />
        </div>

        {/* Footer - Responsive */}
        <div className="bg-gradient-to-r from-[#0F0F0F] to-[#1A1A1A] px-3 sm:px-4 lg:px-6 py-3 sm:py-4 rounded-b-3xl border-t border-[#E53A3A]/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 text-xs sm:text-sm text-[#888888]">
            <span className="text-center sm:text-left">📖 Your personal gaming companion</span>
            <span className="text-center sm:text-right">✨ Track progress • Save favorites • Stay organized</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtakuDiaryModal;
