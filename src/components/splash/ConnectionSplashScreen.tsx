import React from 'react';

interface ConnectionSplashScreenProps {
  isOpen: boolean;
  onClose: () => void;
  userTier?: string; // 'free', 'pro', 'vanguard_pro'
}

/**
 * Celebratory splash screen shown when a returning user connects their PC
 * for the first time in a session (from the chat screen, not during onboarding)
 */
const ConnectionSplashScreen: React.FC<ConnectionSplashScreenProps> = ({ isOpen, onClose, userTier }) => {
  const isPro = userTier === 'pro' || userTier === 'vanguard_pro';
  
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/95 to-[#0A0A0A]/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 md:p-6 z-50 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-md mx-auto animate-scale-in">
        {/* Card container */}
        <div className="bg-gradient-to-b from-[#1A1A1A]/90 to-[#0D0D0D]/90 border border-[#2A2A2A] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl">
          
          {/* Mascot */}
          <div className="relative flex justify-center mb-4 sm:mb-6">
            {/* Mascot image */}
            <img
              src="/images/mascot/5.2.png"
              alt="Connected"
              className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 object-contain animate-bounce"
              style={{ animationDuration: '1.5s' }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#5CBB7B] text-center mb-2 sm:mb-3">
            You're Connected!
          </h1>
          
          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-[#CFCFCF] text-center mb-4 sm:mb-6">
            Your PC is now synced and ready
          </p>
          
          {/* Info card */}
          <div className="bg-[#1E1E1E]/80 border border-[#333333] rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
            {/* F1 Screenshot shortcut */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#FFAB40]/20 to-[#E53A3A]/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFAB40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-[#A3A3A3]">
                  Press <span className="font-mono bg-[#2E2E2E] px-1.5 py-0.5 rounded text-[#FFAB40] text-xs">F1</span> on your PC to capture screenshots
                </p>
              </div>
            </div>
            
            {/* F2 Auto-capture shortcut - Pro/Vanguard only */}
            {isPro && (
              <div className="flex items-center gap-3 mb-3 pt-3 border-t border-[#333333]/50">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#10B981]/20 to-[#059669]/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-[#A3A3A3]">
                    Press <span className="font-mono bg-[#2E2E2E] px-1.5 py-0.5 rounded text-[#10B981] text-xs">F2</span> to toggle auto-capture mode
                  </p>
                </div>
              </div>
            )}
            
            {/* Connection status */}
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-[#333333]">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm text-green-400 font-medium">Connection active</span>
            </div>
          </div>
          
          {/* CTA Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 sm:py-4 px-6 rounded-xl text-sm sm:text-base transition-all duration-300 active:scale-[0.98] hover:shadow-lg hover:shadow-[#E53A3A]/25"
          >
            Let's Go!
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ConnectionSplashScreen);
