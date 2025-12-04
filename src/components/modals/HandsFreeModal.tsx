import React, { useState, useEffect, useMemo } from 'react';
import TTSStatusIndicator from '../ui/TTSStatusIndicator';
import { ttsService } from '../../services/ttsService';

interface HandsFreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isHandsFree: boolean;
  onToggleHandsFree: () => void;
}

const SPEECH_RATE_KEY = 'otakonSpeechRate';

// Detect iOS devices
const isIOSDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || '';
  return /iPad|iPhone|iPod/.test(userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad on iOS 13+
};

const HandsFreeModal: React.FC<HandsFreeModalProps> = ({
  isOpen,
  onClose,
  isHandsFree,
  onToggleHandsFree,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(
    () => localStorage.getItem('otakonPreferredVoiceURI') || ''
  );
  const [speechRate, setSpeechRate] = useState<number>(() => {
    const savedRate = localStorage.getItem(SPEECH_RATE_KEY);
    return savedRate ? parseFloat(savedRate) : 0.94;
  });
  
  // Memoize iOS detection
  const isIOS = useMemo(() => isIOSDevice(), []);

  useEffect(() => {
    const updateVoices = async () => {
      const allVoices = ttsService.getAvailableVoices();
      const englishVoices = allVoices.filter(v => v.lang.startsWith('en-'));
      
      const sortedVoices = englishVoices.sort((a, b) => {
        const aIsFemale = a.name.toLowerCase().includes('female');
        const bIsFemale = b.name.toLowerCase().includes('female');
        if (aIsFemale && !bIsFemale) {
          return -1;
        }
        if (!aIsFemale && bIsFemale) {
          return 1;
        }
        return a.name.localeCompare(b.name);
      });

      setVoices(sortedVoices);

      const savedURI = localStorage.getItem('otakonPreferredVoiceURI');
      if (savedURI && sortedVoices.some(v => v.voiceURI === savedURI)) {
        setSelectedVoiceURI(savedURI);
      } else if (sortedVoices.length > 0) {
        const defaultVoice = sortedVoices[0];
        if (defaultVoice) {
          setSelectedVoiceURI(defaultVoice.voiceURI);
          localStorage.setItem('otakonPreferredVoiceURI', defaultVoice.voiceURI);
        }
      }
    };

    const interval = setInterval(async () => {
        const currentVoices = ttsService.getAvailableVoices();
        // This condition is now more robust. It updates if the count is different,
        // OR if voices are available but the component state is empty (initial load).
        if (currentVoices.length !== voices.length || (currentVoices.length > 0 && voices.length === 0)) {
            updateVoices();
        }
    }, 500);
    
    updateVoices();

    return () => clearInterval(interval);
  }, [voices.length]);

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uri = e.target.value;
    setSelectedVoiceURI(uri);
    localStorage.setItem('otakonPreferredVoiceURI', uri);
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRate = parseFloat(e.target.value);
    setSpeechRate(newRate);
    localStorage.setItem(SPEECH_RATE_KEY, newRate.toString());
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-[#1C1C1C] border border-[#424242] rounded-2xl shadow-2xl p-8 w-full max-w-md m-4 relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
    >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[#6E6E6E] hover:text-[#F5F5F5] transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        
        <div className="flex justify-center mb-4">
          <img
            src="/images/mascot/9.png"
            alt="Hands-Free Settings"
            className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 object-contain aspect-square"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
        
        <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">Hands-Free Settings</h2>
        <p className="text-[#A3A3A3] mb-6">Configure voice responses for a truly hands-free experience.</p>
        
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-[#2E2E2E]/60 p-4 rounded-lg gap-4">
                <label htmlFor="hands-free-toggle" className="text-base font-medium text-[#F5F5F5] cursor-pointer flex-1 min-w-0">
                    Enable Hands-Free Mode
                </label>
                <button
                    id="hands-free-toggle"
                    role="switch"
                    aria-checked={isHandsFree}
                    onClick={onToggleHandsFree}
                    style={{ width: '44px', minWidth: '44px', maxWidth: '44px', height: '24px', minHeight: '24px', maxHeight: '24px', borderRadius: '9999px' }}
                    className={`${isHandsFree ? 'bg-gradient-to-r from-[#E53A3A] to-[#D98C1F]' : 'bg-[#424242]'} relative inline-flex flex-shrink-0 items-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1C1C1C] focus:ring-[#FFAB40]`}
                >
                    <span
                        style={{ width: '16px', height: '16px' }}
                        className={`${isHandsFree ? 'translate-x-[24px]' : 'translate-x-[4px]'} transform bg-white rounded-full transition-transform duration-200`}
                    />
                </button>
            </div>
            
            {/* TTS Status Indicator */}
            <div className="bg-[#2E2E2E]/60 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-[#CFCFCF] mb-3">TTS Status</h3>
                <TTSStatusIndicator showDetails={true} />
            </div>
            
            {/* iOS Warning Note */}
            {isIOS && (
                <div className="bg-amber-900/30 border border-amber-600/50 p-4 rounded-lg flex gap-3">
                    <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                        <p className="text-amber-200 text-sm font-medium">iOS Limitation</p>
                        <p className="text-amber-300/80 text-xs mt-1">
                            Voice responses will pause when your screen locks or Safari is in the background. Keep your screen on for uninterrupted playback.
                        </p>
                    </div>
                </div>
            )}
            
            <div>
                <label htmlFor="voice-select" className="block text-sm font-medium text-[#CFCFCF] mb-1">
                    Voice Selection
                </label>
                <select
                    id="voice-select"
                    value={selectedVoiceURI}
                    onChange={handleVoiceChange}
                    className="w-full bg-[#2E2E2E] border border-[#424242] rounded-md py-2 px-3 text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#FFAB40]"
                    disabled={voices.length === 0}
                >
                    {voices.length > 0 ? (
                    voices.map(voice => (
                        <option key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} ({voice.lang})
                        </option>
                    ))
                    ) : (
                    <option value="">Loading voices...</option>
                    )}
                </select>
            </div>
            
            <div>
                <label htmlFor="speech-rate" className="block text-sm font-medium text-[#CFCFCF] mb-5">
                    Speech Rate: {Math.round(speechRate * 100)}%
                </label>
                <input
                    id="speech-rate"
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.01"
                    value={speechRate}
                    onChange={handleRateChange}
                    className="w-full h-2 bg-[#424242] rounded-lg appearance-none cursor-pointer accent-[#FF4D4D]"
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default HandsFreeModal;

