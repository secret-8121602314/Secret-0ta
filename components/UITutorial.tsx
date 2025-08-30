import React, { useState, useEffect, useRef } from 'react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface UITutorialProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const UITutorial: React.FC<UITutorialProps> = ({ isOpen, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Fixed tooltip dimensions for reliable positioning
  const TOOLTIP_WIDTH = 400;
  const TOOLTIP_HEIGHT = 250;

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'credit-indicator',
      title: 'Credit Indicator',
      description: 'Shows your current usage and tier. Free users have limited credits, Pro users get more.',
      targetSelector: '.credit-indicator, [data-testid="credit-indicator"]',
      position: 'bottom'
    },
    {
      id: 'connect-pc-button',
      title: 'Connect to PC',
      description: 'Connect your PC to enable automatic screenshot capture and analysis.',
      targetSelector: '.connect-pc-button, [data-testid="connect-pc"]',
      position: 'bottom'
    },
    {
      id: 'hands-free-toggle',
      title: 'Hands-Free Mode',
      description: 'Enable voice commands and automatic screenshot capture while gaming.',
      targetSelector: '.hands-free-toggle, [data-testid="hands-free"]',
      position: 'bottom'
    },
    {
      id: 'conversation-tabs',
      title: 'Game Conversations',
      description: 'Switch between different games. Each maintains its own context and insights.',
      targetSelector: '.conversation-tabs, .conversation-tab',
      position: 'bottom'
    },
    {
      id: 'feature-tabs',
      title: 'Feature Tabs',
      description: 'Access Chat, Otaku Diary, Story So Far, Lore, and Build information.',
      targetSelector: '.sub-tabs, .feature-tab',
      position: 'bottom'
    },
    {
      id: 'chat-input',
      title: 'Chat Input',
      description: 'Type your questions here. Use the camera button to upload screenshots.',
      targetSelector: '.chat-input-container, .camera-upload-button',
      position: 'top'
    },
    {
      id: 'screenshot-capture',
      title: 'Screenshot Capture',
      description: 'Take screenshots manually or enable automatic capture in hands-free mode.',
      targetSelector: '.screenshot-button, [data-testid="screenshot"]',
      position: 'top'
    },
    {
      id: 'chat-messages',
      title: 'Chat Messages',
      description: 'Your conversation history with AI responses. Messages can include text and images.',
      targetSelector: '.chat-messages, .message-container',
      position: 'top'
    },
    {
      id: 'suggested-prompts',
      title: 'Suggested Prompts',
      description: 'Quick-start conversations with these pre-written prompts.',
      targetSelector: '.suggested-prompts, .prompt-grid',
      position: 'top'
    },
    {
      id: 'settings-button',
      title: 'Settings',
      description: 'Customize your experience, manage preferences, and access advanced features.',
      targetSelector: '.settings-button, [data-testid="settings"]',
      position: 'top'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setCurrentStep(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isVisible && currentStep < tutorialSteps.length) {
      const step = tutorialSteps[currentStep];
      highlightElement(step.targetSelector, step.position);
    }
  }, [currentStep, isVisible]);

  const highlightElement = (selector: string, position: 'top' | 'bottom' | 'left' | 'right') => {
    // Remove previous highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });

    // Add highlight to current target
    const target = document.querySelector(selector);
    if (target) {
      target.classList.add('tutorial-highlight');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Get target position and dimensions
      const rect = target.getBoundingClientRect();
      
      // Calculate positions relative to viewport
      const targetTop = rect.top;
      const targetLeft = rect.left;
      const targetWidth = rect.width;
      const targetHeight = rect.height;
      
      setHighlightPosition({
        top: targetTop + window.scrollY,
        left: targetLeft + window.scrollX,
        width: targetWidth,
        height: targetHeight
      });
    }
  };

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    // Remove highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    // Remove highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
    onSkip();
  };

  if (!isVisible) return null;

  const currentStepData = tutorialSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  // Calculate center position for tooltip
  const centerTop = (window.innerHeight - TOOLTIP_HEIGHT) / 2;
  const centerLeft = (window.innerWidth - TOOLTIP_WIDTH) / 2;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {/* Blurred background overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-none" />
      
      {/* Highlight overlay with rounded box - no blur here */}
      <div 
        className="absolute pointer-events-none"
        style={{
          top: highlightPosition.top - 8,
          left: highlightPosition.left - 8,
          width: highlightPosition.width + 16,
          height: highlightPosition.height + 16
        }}
      >
        {/* Rounded highlight box */}
        <div className="w-full h-full border-2 border-[#FF4D4D] rounded-xl bg-[#FF4D4D]/10 shadow-[0_0_20px_rgba(255,77,77,0.3)]" />
        
        {/* Arrow pointing to center tooltip */}
        <div 
          className={`absolute w-4 h-4 border-2 border-[#FF4D4D] bg-[#1C1C1C] transform rotate-45 ${
            currentStepData.position === 'top' ? 'bottom-[-8px] left-1/2 -translate-x-1/2' :
            currentStepData.position === 'bottom' ? 'top-[-8px] left-1/2 -translate-x-1/2' :
            currentStepData.position === 'left' ? 'right-[-8px] top-1/2 -translate-y-1/2' :
            'left-[-8px] top-1/2 -translate-y-1/2'
          }`}
        />
      </div>
      
      {/* Centered tooltip */}
      <div 
        ref={tooltipRef}
        className="absolute pointer-events-auto"
        style={{
          top: centerTop,
          left: centerLeft,
          width: TOOLTIP_WIDTH,
          height: TOOLTIP_HEIGHT
        }}
      >
        <div className="bg-[#1C1C1C] border border-[#FF4D4D]/30 rounded-lg shadow-2xl p-6 max-w-sm">
          {/* Progress */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentStep 
                      ? 'bg-[#FF4D4D] scale-125' 
                      : index < currentStep 
                        ? 'bg-[#FFAB40]' 
                        : 'bg-[#424242]'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-[#888888]">{currentStep + 1}/{tutorialSteps.length}</span>
          </div>

          {/* Content */}
          <h3 className="text-lg font-semibold text-white mb-3">{currentStepData.title}</h3>
          <p className="text-[#CFCFCF] text-sm leading-relaxed mb-6">{currentStepData.description}</p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-[#888888] hover:text-white transition-colors text-sm font-medium"
            >
              Skip
            </button>

            <div className="flex gap-3">
              {!isFirstStep && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 bg-[#424242] hover:bg-[#5A5A5A] text-white rounded text-sm font-medium transition-colors"
                >
                  Previous
                </button>
              )}
              
              <button
                onClick={handleNext}
                className={`px-4 py-2 rounded text-sm font-medium transition-all duration-200 ${
                  isLastStep
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-[#FF4D4D] hover:bg-[#FF4D4D]/80 text-white'
                }`}
              >
                {isLastStep ? 'Complete' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UITutorial;
