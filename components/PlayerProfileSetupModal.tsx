import React, { useState } from 'react';
import { PlayerProfile } from '../services/playerProfileService';

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
        { value: 'Strict', label: 'Strict', description: 'Maximum protection - no spoilers at all' },
        { value: 'Moderate', label: 'Moderate', description: 'Some hints about what\'s coming' },
        { value: 'Relaxed', label: 'Relaxed', description: 'OK with more detailed information' }
      ]
    }
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleOptionSelect = (value: string) => {
    setProfile(prev => ({
      ...prev,
      [currentStepData.field]: value
    }));
  };

  const handleNext = () => {
    if (isLastStep) {
      onComplete(profile as PlayerProfile);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Welcome to Otakon!</h2>
              <p className="text-blue-100 mt-1">Let's personalize your gaming experience</p>
            </div>
            <div className="text-white/80 text-sm">
              {currentStep + 1} of {steps.length}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-semibold text-white mb-2">
            {currentStepData.title}
          </h3>
          <p className="text-gray-400 mb-6">
            {currentStepData.description}
          </p>

          <div className="space-y-3">
            {currentStepData.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleOptionSelect(option.value)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                  profile[currentStepData.field] === option.value
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600 hover:bg-gray-800'
                }`}
              >
                <div className="font-medium mb-1">{option.label}</div>
                <div className="text-sm text-gray-400">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 p-6 flex items-center justify-between">
          <div className="flex space-x-3">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={onSkip}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Skip Setup
            </button>
          </div>
          
          <button
            onClick={handleNext}
            disabled={!profile[currentStepData.field]}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-lg transition-colors"
          >
            {isLastStep ? 'Complete Setup' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};
