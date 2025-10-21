import React, { useState, useEffect } from 'react';
import ScreenshotIcon from '../ui/ScreenshotIcon';
import HintIcon from '../ui/HintIcon';
import DesktopIcon from '../ui/DesktopIcon';
import BookmarkIcon from '../ui/BookmarkIcon';
import { ConnectionStatus } from '../../types';

// Feature flag: toggle to show or hide intro slides
const SHOW_INTRO_SLIDES = false;

const allSlides = [
  {
    icon: <ScreenshotIcon className="w-24 h-24 text-[#FF4D4D]" />,
    title: "Instant Context from Any Screenshot",
    description: "Upload a screenshot from any game. Otagon instantly identifies the game, your location, and what's happening. Get answers, not spoilers."
  },
  {
    icon: <HintIcon className="w-24 h-24 text-[#FF4D4D]" />,
    title: "Hints that Don't Spoil the Story",
    description: "Stuck on a puzzle or boss? Get contextual, spoiler-free guidance. Discover rich lore about the world without ruining the surprise."
  },
  {
    icon: <BookmarkIcon className="w-24 h-24 text-[#FF4D4D]" />,
    title: "Automatic Progress Tracking",
    description: "Otagon automatically organizes your chats by game and tracks your main story progress. Easily see how far you've come and pick up right where you left off."
  },
  {
    icon: <DesktopIcon className="w-24 h-24 text-[#FF4D4D]" />,
    title: "Connect Your PC for Instant Help",
    description: "Link your desktop and mobile app to get help without leaving your game. Press a hotkey to instantly send a screenshot for analysis."
  }
];

const slides = SHOW_INTRO_SLIDES ? allSlides : allSlides.slice(-1);

interface SplashScreenProps {
  onSkipConnection: () => void;
  onConnect: (code: string) => void;
  status: ConnectionStatus;
  error: string | null;
  connectionCode: string | null;
  onConnectionSuccess: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
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
  const [connectionSuccessCalled, setConnectionSuccessCalled] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  
  useEffect(() => {
    // This effect transitions to the next screen ONLY if the connection
    // was successful AND it was initiated by the user clicking the button.
    if (syncInitiated && status === ConnectionStatus.CONNECTED && !connectionSuccessCalled) {
        console.log('🔗 [SplashScreen] Connection successful, calling onConnectionSuccess');
        setConnectionSuccessCalled(true);
        // Add a small delay to ensure state is stable
        setTimeout(() => {
            onConnectionSuccess();
        }, 100);
    }
  }, [status, onConnectionSuccess, syncInitiated, connectionSuccessCalled]);

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
    setConnectionSuccessCalled(false); // Reset the flag for new connection attempt
    onConnect(code);
  };
  
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null); // Clear end on new touch
    const touch = e.targetTouches[0];
    if (touch) {
      setTouchStartX(touch.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    if (touch) {
      setTouchEndX(touch.clientX);
    }
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
        className="h-screen bg-[#111111] text-[#F5F5F5] flex flex-col font-inter"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="text-center max-w-lg w-full">
          <div className="mb-2 sm:mb-4 flex justify-center">
            {currentSlide?.icon}
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F5F5F5] mb-2 sm:mb-4 leading-normal">{currentSlide?.title}</h1>
          <p className="text-[#CFCFCF] text-base sm:text-lg md:text-xl mb-4 leading-relaxed">{currentSlide?.description}</p>
          
          {isLastStep && (
              <div className="space-y-3 sm:space-y-4 text-left">
                  <div className="text-center pb-2">
                      <button
                        onClick={() => {
                          const downloadUrl = 'https://github.com/readmet3xt/otakon-pc-client/releases/tag/v1.0.0';
                          window.open(downloadUrl, '_blank');
                        }}
                        className="text-sm sm:text-base font-medium text-[#FF4D4D] hover:text-[#FF4D4D] hover:underline transition-all duration-300 hover:scale-105"
                      >
                        Download PC Client (v1.0.0)
                      </button>
                  </div>
                  <div>
                      <label htmlFor="connection-code" className="block text-sm sm:text-base font-medium text-[#CFCFCF] mb-2 text-center">
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
                      className="w-full bg-gradient-to-r from-[#2E2E2E] to-[#1A1A1A] border-2 border-[#424242]/60 rounded-xl py-2 sm:py-3 px-4 text-[#F5F5F5] placeholder-[#6E6E6E] focus:outline-none focus:ring-2 focus:ring-[#FFAB40] focus:border-[#FFAB40]/60 disabled:opacity-50 text-center text-lg sm:text-xl font-mono tracking-widest backdrop-blur-sm"
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
      
      <footer className="flex-shrink-0 px-4 sm:px-6 md:px-8 pt-3 sm:pt-4 pb-6 sm:pb-8">
        <div className="w-full max-w-lg mx-auto">
            {isLastStep ? (
                <div className="flex flex-col gap-4">
                    {!isConnected ? (
                        <>
                            <button
                                onClick={handleConnectClick}
                                disabled={isConnecting || !isCodeValid}
                                className={`w-full font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-300 flex items-center justify-center text-sm sm:text-base active:scale-95 ${
                                    isCodeValid && !isConnecting 
                                        ? 'bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] hover:from-[#D42A2A] hover:to-[#C87A1A] text-white hover:scale-105 hover:shadow-xl hover:shadow-[#E53A3A]/25' 
                                        : 'bg-gradient-to-r from-neutral-600 to-neutral-500 text-neutral-300 cursor-not-allowed opacity-25'
                                }`}
                            >
                                {isConnecting ? "Connecting..." : "Sync Now"}
                            </button>
                            <button
                                onClick={onSkipConnection}
                                className="w-full bg-gradient-to-r from-neutral-700 to-neutral-600 hover:from-neutral-600 hover:to-neutral-500 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 flex items-center justify-center text-sm sm:text-base"
                            >
                                Skip for Now
                            </button>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <div className="text-green-400 text-lg font-semibold mb-2">
                                ✅ You're all set! PC is connected
                            </div>
                            <div className="text-neutral-400 text-sm">
                                Taking you to the next step...
                            </div>
                        </div>
                    )}
            </div>
            ) : (
                <button
                    onClick={handleNext}
                    className="w-full bg-gradient-to-r from-neutral-700 to-neutral-600 hover:from-neutral-600 hover:to-neutral-500 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 flex items-center justify-center"
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
