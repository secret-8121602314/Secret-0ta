import React from 'react';

interface ConnectionSplashScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Celebratory splash screen shown when a returning user connects their PC
 * for the first time in a session (from the chat screen, not during onboarding)
 */
const ConnectionSplashScreen: React.FC<ConnectionSplashScreenProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/90 to-[#0A0A0A]/90 backdrop-blur-xl flex items-center justify-center p-6 z-50 animate-fade-in">
      <div className="text-center animate-scale-in">
        {/* Celebration container */}
        <div className="relative">
          {/* Glow effect behind mascot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
          </div>
          
          {/* Mascot */}
          <img
            src="/images/mascot/5.2.png"
            alt="Connected!"
            className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 object-contain mx-auto animate-bounce"
            style={{ animationDuration: '1s' }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
        
        {/* Success message */}
        <h2 className="text-3xl sm:text-4xl font-bold text-[#5CBB7B] mt-6 mb-3">
          You're Connected!
        </h2>
        <p className="text-lg text-[#CFCFCF] mb-2">
          Your PC is now synced and ready.
        </p>
        <p className="text-base text-[#A3A3A3]">
          Press <span className="font-mono bg-[#2E2E2E] px-2 py-1 rounded text-[#FFAB40]">F1</span> on your PC to capture screenshots
        </p>
        
        {/* Connection status indicator */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-400">Connection active</span>
        </div>
        
        {/* CTA Button to close */}
        <button
          onClick={onClose}
          className="mt-8 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-4 px-10 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#E53A3A]/25"
        >
          Let's Go!
        </button>
      </div>
    </div>
  );
};

export default React.memo(ConnectionSplashScreen);
