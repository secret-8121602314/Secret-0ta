import React, { useState, useEffect } from 'react';
import TTSStatusIndicator from '../ui/TTSStatusIndicator';
import { ttsService } from '../../services/ttsService';

interface HandsFreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isHandsFree: boolean;
  onToggleHandsFree: () => void;
}

const SPEECH_RATE_KEY = 'otakonSpeechRate';

const HandsFreeModal: React.FC<HandsFreeModalProps> = ({
  isOpen,
  onClose,
  isHandsFree,
  onToggleHandsFree,
}) => {
  if (!isOpen) return null;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(
    () => localStorage.getItem('otakonPreferredVoiceURI') || ''
  );
  const [speechRate, setSpeechRate] = useState<number>(() => {
    const savedRate = localStorage.getItem(SPEECH_RATE_KEY);
    return savedRate ? parseFloat(savedRate) : 0.94;
  });


  useEffect(() => {
    const updateVoices = async () => {
      const allVoices = ttsService.getAvailableVoices();
      const englishVoices = allVoices.filter(v => v.lang.startsWith('en-'));
      
      const sortedVoices = englishVoices.sort((a, b) => {
        const aIsFemale = a.name.toLowerCase().includes('female');
        const bIsFemale = b.name.toLowerCase().includes('female');
        if (aIsFemale && !bIsFemale) return -1;
        if (!aIsFemale && bIsFemale) return 1;
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
        
        <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">Hands-Free Settings</h2>
        <p className="text-[#A3A3A3] mb-6">Configure voice responses for a truly hands-free experience.</p>
        
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-[#2E2E2E]/60 p-4 rounded-lg">
                <label htmlFor="hands-free-toggle" className="text-base font-medium text-[#F5F5F5] cursor-pointer">
                    Enable Hands-Free Mode
                </label>
                <button
                    id="hands-free-toggle"
                    role="switch"
                    aria-checked={isHandsFree}
                    onClick={onToggleHandsFree}
                    className={`${isHandsFree ? 'bg-gradient-to-r from-[#E53A3A] to-[#D98C1F]' : 'bg-[#424242]'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1C1C1C] focus:ring-[#FFAB40]`}
                >
                    <span
                        className={`${isHandsFree ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                    />
                </button>
            </div>
            
            {/* TTS Status Indicator */}
            <div className="bg-[#2E2E2E]/60 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-[#CFCFCF] mb-3">TTS Status</h3>
                <TTSStatusIndicator showDetails={true} />
            </div>
            
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

