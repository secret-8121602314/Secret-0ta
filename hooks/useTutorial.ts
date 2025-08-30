import { useState, useEffect, useCallback } from 'react';

interface TutorialState {
  isTutorialOpen: boolean;
  hasCompletedTutorial: boolean;
  shouldShowTutorial: boolean;
}

export const useTutorial = () => {
  const [tutorialState, setTutorialState] = useState<TutorialState>({
    isTutorialOpen: false,
    hasCompletedTutorial: false,
    shouldShowTutorial: false
  });

  // Check if user should see tutorial
  useEffect(() => {
    const checkTutorialStatus = () => {
      const hasCompletedTutorial = localStorage.getItem('otakon_tutorial_completed') === 'true';
      const hasCompletedProfileSetup = localStorage.getItem('otakonOnboardingComplete') === 'true';
      
      // Only show tutorial for first-time users who have completed profile setup
      setTutorialState(prev => ({
        ...prev,
        hasCompletedTutorial,
        shouldShowTutorial: !hasCompletedTutorial && hasCompletedProfileSetup
      }));
    };

    checkTutorialStatus();
  }, []);

  // Open tutorial manually (for settings menu)
  const openTutorial = useCallback(() => {
    setTutorialState(prev => ({
      ...prev,
      isTutorialOpen: true
    }));
  }, []);

  // Close tutorial
  const closeTutorial = useCallback(() => {
    setTutorialState(prev => ({
      ...prev,
      isTutorialOpen: false
    }));
  }, []);

  // Complete tutorial
  const completeTutorial = useCallback(async () => {
    try {
      // Store completion in localStorage
      localStorage.setItem('otakon_tutorial_completed', 'true');
      
      setTutorialState(prev => ({
        ...prev,
        isTutorialOpen: false,
        hasCompletedTutorial: true,
        shouldShowTutorial: false
      }));
    } catch (error) {
      console.error('Error completing tutorial:', error);
      // Still close tutorial even if storage fails
      setTutorialState(prev => ({
        ...prev,
        isTutorialOpen: false,
        hasCompletedTutorial: true,
        shouldShowTutorial: false
      }));
    }
  }, []);

  // Skip tutorial
  const skipTutorial = useCallback(async () => {
    try {
      // Store completion in localStorage
      localStorage.setItem('otakon_tutorial_completed', 'true');
      
      setTutorialState(prev => ({
        ...prev,
        isTutorialOpen: false,
        hasCompletedTutorial: true,
        shouldShowTutorial: false
      }));
    } catch (error) {
      console.error('Error skipping tutorial:', error);
      // Still close tutorial even if storage fails
      setTutorialState(prev => ({
        ...prev,
        isTutorialOpen: false,
        hasCompletedTutorial: true,
        shouldShowTutorial: false
      }));
    }
  }, []);

  // Auto-show tutorial after profile setup (with delay)
  useEffect(() => {
    if (tutorialState.shouldShowTutorial && !tutorialState.isTutorialOpen) {
      const timer = setTimeout(() => {
        openTutorial();
      }, 2000); // 2 second delay after profile setup

      return () => clearTimeout(timer);
    }
  }, [tutorialState.shouldShowTutorial, tutorialState.isTutorialOpen, openTutorial]);

  return {
    ...tutorialState,
    openTutorial,
    closeTutorial,
    completeTutorial,
    skipTutorial
  };
};
