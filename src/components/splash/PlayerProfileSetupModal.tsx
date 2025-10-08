import React, { useState } from 'react';
import { PlayerProfile } from '../../types';

interface PlayerProfileSetupModalProps {
  isOpen: boolean;
  onComplete: (profile: PlayerProfile) => void;
  onSkip: () => void;
}

export const PlayerProfileSetupModal: React.FC<PlayerProfileSetupModalProps> = ({
  isOpen,
  onComplete,
  onSkip
}) => {
  const [profile, setProfile] = useState<Partial<PlayerProfile>>({
    hintStyle: 'Balanced',
    playerFocus: 'Story-Driven',
    preferredTone: 'Encouraging',
    spoilerTolerance: 'Strict'
  });

  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "How do you like your hints?",
      description: "Choose the style that works best for you",
      field: 'hintStyle' as keyof PlayerProfile,
      options: [
        { value: 'Cryptic', label: 'Cryptic', description: 'Mysterious clues that make you think' },
        { value: 'Balanced', label: 'Balanced', description: 'Mix of hints and gentle guidance' },
        { value: 'Direct', label: 'Direct', description: 'Clear, straightforward assistance' }
      ]
    },
    {
      title: "What's your gaming focus?",
      description: "This helps me tailor advice to your playstyle",
      field: 'playerFocus' as keyof PlayerProfile,
      options: [
        { value: 'Story-Driven', label: 'Story-Driven', description: 'Love rich narratives and character development' },
        { value: 'Completionist', label: 'Completionist', description: 'Want to find every secret and collectible' },
        { value: 'Strategist', label: 'Strategist', description: 'Focus on optimization and tactical gameplay' }
      ]
    },
    {
      title: "Preferred tone?",
      description: "How should I communicate with you?",
      field: 'preferredTone' as keyof PlayerProfile,
      options: [
        { value: 'Encouraging', label: 'Encouraging', description: 'Supportive and motivating' },
        { value: 'Professional', label: 'Professional', description: 'Clear and informative' },
        { value: 'Casual', label: 'Casual', description: 'Friendly and relaxed' }
      ]
    },
    {
      title: "Spoiler protection level?",
      description: "How careful should I be about spoilers?",
      field: 'spoilerTolerance' as keyof PlayerProfile,
      options: [
        { value: 'Strict', label: 'Strict', description: 'Never spoil anything, even minor details' },
        { value: 'Moderate', label: 'Moderate', description: 'Avoid major spoilers, minor details okay' },
        { value: 'Relaxed', label: 'Relaxed', description: 'Focus on helpfulness over spoiler protection' }
      ]
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(profile as PlayerProfile);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOptionSelect = (field: keyof PlayerProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1C1C1C] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border-2 border-[#E53A3A]/30 shadow-2xl shadow-[#E53A3A]/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Welcome to Otagon!</h2>
              <p className="text-white/90 mt-1">Let's personalize your gaming experience</p>
            </div>
            <div className="text-white/90 text-sm font-medium">
              {currentStep + 1} of {steps.length}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300 shadow-sm"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-semibold text-white mb-2">{currentStepData.title}</h3>
          <p className="text-neutral-300 mb-6">{currentStepData.description}</p>

          <div className="space-y-3">
            {currentStepData.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleOptionSelect(currentStepData.field, option.value)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 active:scale-95 ${
                  profile[currentStepData.field] === option.value
                    ? 'border-[#E53A3A] bg-[#E53A3A]/10 text-white'
                    : 'border-neutral-600 bg-neutral-800/50 text-neutral-300 hover:border-neutral-500 hover:bg-neutral-700/50'
                }`}
              >
                <div className="font-medium mb-1">{option.label}</div>
                <div className="text-sm text-neutral-400">{option.description}</div>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <div className="flex space-x-3">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors active:scale-95"
                >
                  Back
                </button>
              )}
              <button
                onClick={onSkip}
                className="px-4 py-2 text-neutral-400 hover:text-white transition-colors active:scale-95"
              >
                Skip
              </button>
            </div>
            
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] hover:from-[#D42A2A] hover:to-[#C87A1A] text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfileSetupModal;
