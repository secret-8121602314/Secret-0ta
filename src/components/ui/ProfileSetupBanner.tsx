import React, { useState, useEffect } from 'react';
import { PlayerProfile } from '../../types';

interface ProfileSetupBannerProps {
  onComplete: (profile: PlayerProfile) => void;
  onDismiss: () => void;
}

export const ProfileSetupBanner: React.FC<ProfileSetupBannerProps> = ({
  onComplete,
  onDismiss
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia('(max-width: 768px)').matches;
  });
  const [profile, setProfile] = useState<Partial<PlayerProfile>>({
    hintStyle: 'Balanced',
    playerFocus: 'Story-Driven',
    preferredTone: 'Encouraging',
    spoilerTolerance: 'Strict'
  });
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const query = window.matchMedia('(max-width: 768px)');
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    setIsMobile(query.matches);
    query.addEventListener('change', handleChange);

    return () => query.removeEventListener('change', handleChange);
  }, []);

  const steps = [
    {
      title: "How do you like your hints?",
      field: 'hintStyle' as keyof PlayerProfile,
      options: [
        { value: 'Cryptic', label: '🔮 Cryptic' },
        { value: 'Balanced', label: '⚖️ Balanced' },
        { value: 'Direct', label: '🎯 Direct' }
      ]
    },
    {
      title: "What's your gaming focus?",
      field: 'playerFocus' as keyof PlayerProfile,
      options: [
        { value: 'Story-Driven', label: '📖 Story-Driven' },
        { value: 'Completionist', label: '💯 Completionist' },
        { value: 'Strategist', label: '🧠 Strategist' }
      ]
    },
    {
      title: "Preferred tone?",
      field: 'preferredTone' as keyof PlayerProfile,
      options: [
        { value: 'Encouraging', label: '💪 Encouraging' },
        { value: 'Professional', label: '💼 Professional' },
        { value: 'Casual', label: '😎 Casual' }
      ]
    },
    {
      title: "Spoiler protection?",
      field: 'spoilerTolerance' as keyof PlayerProfile,
      options: [
        { value: 'Strict', label: '🔒 Strict' },
        { value: 'Moderate', label: '🔓 Moderate' },
        { value: 'Relaxed', label: '🔓 Relaxed' }
      ]
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete setup and close banner
      onComplete(profile as PlayerProfile);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOptionSelect = (field: keyof PlayerProfile, value: string) => {
    const updatedProfile = { ...profile, [field]: value };
    setProfile(updatedProfile);
    // Auto-advance after selection
    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Complete setup with the updated profile
        onComplete(updatedProfile as PlayerProfile);
      }
    }, 300);
  };

  const currentStepData = steps[currentStep];
  const progressPercent = ((currentStep + 1) / steps.length) * 100;
  const shouldUseOverlay = isExpanded && isMobile;

  useEffect(() => {
    if (!shouldUseOverlay) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [shouldUseOverlay]);

  const collapsedBanner = (
    <div className="mx-3 sm:mx-4 lg:mx-6 mb-4 sm:mb-6">
      <div className="bg-gradient-to-r from-[#FF4D4D]/10 to-[#FFAB40]/10 border-2 border-[#FF4D4D]/30 rounded-xl p-4 shadow-lg animate-slide-down backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-text-primary">Personalize Your Experience</h3>
              <p className="text-sm text-text-secondary hidden sm:block">Set up your gaming preferences for better AI responses</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-3">
            <button
              onClick={() => setIsExpanded(true)}
              className="px-4 py-2 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] md:hover:from-[#D42A2A] md:hover:to-[#C87A1A] text-white text-sm font-bold rounded-lg transition-all md:hover:scale-105 active:scale-95 whitespace-nowrap shadow-lg"
            >
              Set Up
            </button>
            <button
              onClick={onDismiss}
              className="p-2 text-text-muted hover:text-text-primary transition-colors"
              aria-label="Dismiss banner"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isExpanded) {
    return collapsedBanner;
  }

  const expandedCard = (
    <div
      className="bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] border-2 border-[#FF4D4D]/30 rounded-xl shadow-2xl overflow-hidden animate-scale-in backdrop-blur-xl"
      role="dialog"
      aria-modal={isMobile}
      aria-label="Profile setup wizard"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Quick Setup</h2>
            <p className="text-white/90 text-sm mt-1">Step {currentStep + 1} of {steps.length}</p>
          </div>
          <button
            onClick={onDismiss}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="bg-white/20 rounded-full h-2 shadow-inner">
          <div
            className="bg-white rounded-full h-2 transition-all duration-300 shadow-lg"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">{currentStepData.title}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {currentStepData.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleOptionSelect(currentStepData.field, option.value)}
              className={`p-4 text-center rounded-lg border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                profile[currentStepData.field] === option.value
                  ? 'border-[#FF4D4D] bg-gradient-to-br from-[#FF4D4D]/20 to-[#FFAB40]/20 text-text-primary ring-2 ring-[#FF4D4D]/50 shadow-lg'
                  : 'border-surface-light/30 bg-surface/50 text-text-secondary hover:border-[#FF4D4D]/50 hover:bg-surface-light/30'
              }`}
            >
              <div className="text-2xl mb-2">{option.label.split(' ')[0]}</div>
              <div className="text-sm font-medium">{option.label.split(' ').slice(1).join(' ')}</div>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t border-surface-light/20">
          <div className="flex space-x-2">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-surface hover:bg-surface-light text-text-primary rounded-lg transition-colors text-sm font-medium"
              >
                ← Back
              </button>
            )}
            <button
              onClick={onDismiss}
              className="px-4 py-2 text-text-muted hover:text-text-primary transition-colors text-sm"
            >
              Skip for now
            </button>
          </div>

          <button
            onClick={handleNext}
            className="px-6 py-2 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] md:hover:from-[#D42A2A] md:hover:to-[#C87A1A] text-white font-bold rounded-lg transition-all md:hover:scale-105 active:scale-95 text-sm shadow-lg"
          >
            {currentStep === steps.length - 1 ? '✓ Complete' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );

  if (shouldUseOverlay) {
    const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        setIsExpanded(false);
      }
    };

    return (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6 bg-black/80 backdrop-blur-lg"
        onClick={handleOverlayClick}
      >
        <div className="w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
          {expandedCard}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-3 sm:mx-4 lg:mx-6 mb-4 sm:mb-6">
      {expandedCard}
    </div>
  );
};

export default ProfileSetupBanner;
