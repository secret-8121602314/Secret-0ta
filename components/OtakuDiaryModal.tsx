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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] border border-[#FF4D4D]/30 rounded-2xl shadow-2xl w-full max-w-4xl mx-auto relative animate-scale-in flex flex-col max-h-[90vh] hover:border-[#FF4D4D]/50 transition-all duration-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brand Header */}
        <div className="bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Otaku Diary</h2>
                <p className="text-white/90 text-sm">Game: {gameTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <OtakuDiaryTab 
            gameId={gameId}
            gameTitle={gameTitle}
          />
        </div>

        {/* Brand Footer */}
        <div className="bg-gradient-to-r from-[#0A0A0A] to-[#1A1A1A] p-4 border-t border-[#FF4D4D]/25 text-center">
          <p className="text-xs text-[#666666] flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
            Your personal gaming companion • Track progress • Save favorites
          </p>
        </div>
      </div>
    </div>
  );
};

export default OtakuDiaryModal;
