

import React, { useState, useEffect } from 'react';
import ScreenshotIcon from './ScreenshotIcon';
import HintIcon from './HintIcon';
import DesktopIcon from './DesktopIcon';
import BookmarkIcon from './BookmarkIcon';
import { ConnectionStatus } from '../services/types';

const slides = [
  {
    icon: <ScreenshotIcon className="w-24 h-24 text-[#FF4D4D]" />,
    title: "Instant Context from Any Screenshot",
    description: "Upload a screenshot from any game. Otakon instantly identifies the game, your location, and what's happening. Get answers, not spoilers."
  },
  {
    icon: <HintIcon className="w-24 h-24 text-[#FF4D4D]" />,
    title: "Hints that Don't Spoil the Story",
    description: "Stuck on a puzzle or boss? Get contextual, spoiler-free guidance. Discover rich lore about the world without ruining the surprise."
  },
  {
    icon: <BookmarkIcon className="w-24 h-24 text-[#FF4D4D]" />,
    title: "Automatic Progress Tracking",
    description: "Otakon automatically organizes your chats by game and tracks your main story progress. Easily see how far you've come and pick up right where you left off."
  },
  {
    icon: <DesktopIcon className="w-24 h-24 text-[#FF4D4D]" />,
    title: "Connect Your PC for Instant Help",
    description: "Link your desktop and mobile app to get help without leaving your game. Press a hotkey to instantly send a screenshot for analysis."
  }
];

interface SplashScreenProps {
  onComplete: () => void;
  onSkipConnection: () => void;
  onConnect: (code: string) => void;
  status: ConnectionStatus;
  error: string | null;
  connectionCode: string | null;
  onConnectionSuccess: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
    onComplete,
    onSkipConnection,
    onConnect,
    status,
    error,
    connectionCode,
    onConnectionSuccess,
 }) => {
  const [step, setStep] = useState(0);
  const [code, setCode] = useState(connectionCode || '');
  const [syncInitiated, setSyncInitiated] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  
  useEffect(() => {
    // This effect transitions to the next screen ONLY if the connection
    // was successful AND it was initiated by the user clicking the button.
    if (syncInitiated && status === ConnectionStatus.CONNECTED) {
        onConnectionSuccess();
    }
  }, [status, onConnectionSuccess, syncInitiated]);

  const currentSlide = slides[step];
  const isLastStep = step === slides.length - 1;

  const isConnecting = status === ConnectionStatus.CONNECTING;
  const isConnected = status === ConnectionStatus.CONNECTED;

  const handleNext = () => {
    if (!isLastStep) {
      setStep(s => s + 1);
    }
  };
  
  const handlePrev = () => {
    if (step > 0) {
      setStep(s => s - 1);
    }
  };

  const handleConnectClick = () => {
    if (isConnecting || isConnected) return;
    setSyncInitiated(true);
    onConnect(code);
  };
  
  const handleSkip = () => {
    onComplete();
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null); // Clear end on new touch
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 50;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
    // Reset after swipe action
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const isCodeValid = /^\d{6}$/.test(code);

  return (
    <div 
        className="h-screen bg-[#111111] text-[#F5F5F5] flex flex-col font-inter animate-fade-in"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
      <div className="flex-shrink-0 px-8 pt-12 flex justify-end">
        <button onClick={handleSkip} className="text-[#A3A3A3] hover:text-[#F5F5F5] transition-all duration-300 text-base font-medium hover:scale-105">Skip Intro</button>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center overflow-y-auto p-8">
        <div className="text-center max-w-lg w-full my-auto">
          <div className="mb-10 flex justify-center items-center h-28">
            {currentSlide.icon}
          </div>
          <h1 className="text-4xl font-bold text-[#F5F5F5] mb-6 leading-tight">{currentSlide.title}</h1>
          <p className="text-[#CFCFCF] text-xl mb-10 leading-relaxed">{currentSlide.description}</p>
          
          {isLastStep && (
              <div className="space-y-6 text-left">
                  <div className="text-center pb-4">
                      <button
                        onClick={() => {
                          const downloadUrl = 'https://github.com/readmet3xt/readmet3xt.github.io/releases/tag/Otakon-connector';
                          window.open(downloadUrl, '_blank');
                        }}
                        className="text-base font-medium text-[#FF4D4D] hover:text-[#FF4D4D] hover:underline transition-all duration-300 hover:scale-105"
                      >
                        Download PC Client (v1.0.0)
                      </button>
                  </div>
                  <div>
                      <label htmlFor="connection-code" className="block text-base font-medium text-[#CFCFCF] mb-3 text-center">
                        6-Digit Connection Code
                      </label>
                      <input
                      id="connection-code"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      pattern="\d{6}"
                      title="Enter exactly 6 digits"
                      disabled={isConnecting || isConnected}
                      required
                      className="w-full bg-gradient-to-r from-[#2E2E2E] to-[#1A1A1A] border-2 border-[#424242]/60 rounded-xl py-3 px-4 text-[#F5F5F5] placeholder-[#6E6E6E] focus:outline-none focus:ring-2 focus:ring-[#FFAB40] focus:border-[#FFAB40]/60 disabled:opacity-50 text-center text-xl font-mono tracking-widest backdrop-blur-sm"
                      style={{ textAlign: 'center' }}
                      />
                  </div>
                  <div className="h-6 text-center text-base">
                      {error && <p className="text-[#E53A3A]">{error}</p>}
                      {isConnected && <p className="text-[#5CBB7B]">You're all set! Your PC is now connected.</p>}
                      {isConnecting && <p className="text-[#A3A3A3]">Attempting to connect...</p>}
                  </div>
              </div>
          )}
        </div>
      </main>
      
      <footer className="flex-shrink-0 px-8 pt-6 pb-16">
        <div className="w-full max-w-lg mx-auto">
            <div className="flex justify-center items-center mb-8 gap-3">
                {slides.map((_, index) => (
                    <div key={index} className={`w-3 h-3 rounded-full transition-all duration-300 ${step === index ? 'bg-[#FF4D4D] scale-125 shadow-lg shadow-[#FF4D4D]/50' : 'bg-[#424242]/60'}`}></div>
                ))}
            </div>
            
            {isLastStep ? (
                <div className="space-y-4">
                    {!isConnected && (
                        <button
                            onClick={handleConnectClick}
                            disabled={isConnecting || !isCodeValid}
                            className={`w-full font-bold py-4 px-8 rounded-xl transition-all duration-300 flex items-center justify-center ${
                                isCodeValid && !isConnecting 
                                    ? 'bg-gradient-to-r from-neutral-700 to-neutral-600 hover:from-neutral-600 hover:to-neutral-500 text-white hover:scale-105 hover:shadow-lg' 
                                    : 'bg-gradient-to-r from-neutral-600 to-neutral-500 text-neutral-300 cursor-not-allowed'
                            }`}
                        >
                            {isConnecting ? "Connecting..." : "Sync Now"}
                        </button>
                    )}
                    <button
                        onClick={isConnected ? onComplete : onSkipConnection}
                        className="w-full bg-gradient-to-r from-neutral-700 to-neutral-600 hover:from-neutral-600 hover:to-neutral-500 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center"
                    >
                        {isConnected ? "Continue to App" : "Skip for Now"}
                    </button>
            </div>
            ) : (
                <button
                    onClick={handleNext}
                    className="w-full bg-gradient-to-r from-neutral-700 to-neutral-600 hover:from-neutral-600 hover:to-neutral-500 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center"
                >
                    Next
                </button>
            )}
        </div>
      </footer>
    </div>
  );
};

export default React.memo(SplashScreen);