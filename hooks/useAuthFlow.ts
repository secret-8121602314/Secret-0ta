import { useCallback } from 'react';
import { authService } from '../services/supabase';
import { canAccessDeveloperFeatures } from '../config/developer';
import { profileService } from '../services/profileService';
import { playerProfileService } from '../services/playerProfileService';
import { unifiedUsageService } from '../services/unifiedUsageService';
import { ttsService } from '../services/ttsService';
import { secureAppStateService } from '../services/secureAppStateService';

interface UseAuthFlowProps {
  authState: any;
  setAuthState: (state: any) => void;
  setOnboardingStatus: (status: any) => void;
  setView: (view: 'landing' | 'app') => void;
  setIsHandsFreeMode: (mode: boolean) => void;
  setIsConnectionModalOpen: (open: boolean) => void;
  setShowProfileSetup: (show: boolean) => void;
  setConfirmationModal: (modal: any) => void;
  send?: any;
  disconnect?: () => void;
  resetConversations?: () => void;
  refreshUsage?: () => void;
  addSystemMessage?: (text: string, convoId?: string, showUpgradeButton?: boolean) => void;
}

export const useAuthFlow = ({
  authState,
  setAuthState,
  setOnboardingStatus,
  setView,
  setIsHandsFreeMode,
  setIsConnectionModalOpen,
  setShowProfileSetup,
  setConfirmationModal,
  send,
  disconnect,
  resetConversations,
  refreshUsage,
  addSystemMessage,
}: UseAuthFlowProps) => {
  
  // Function to logout only (keep data) - for settings modal
  const executeFullReset = useCallback(async () => {
    try {
      // First, clear local data and reset services while still authenticated
      if (send) {
        send({ type: 'clear_history' });
      }
      ttsService.cancel();
      disconnect?.();
      resetConversations?.();
      
      // Reset services while still authenticated to avoid 403 errors
      try {
        await unifiedUsageService.reset();
      } catch (error) {
        console.warn('Failed to reset usage service:', error);
      }
      
      try {
        await playerProfileService.resetWelcomeMessageTracking();
      } catch (error) {
        console.warn('Failed to reset welcome message tracking in Supabase:', error);
      }
      
      // Clear localStorage
      localStorage.removeItem('lastConnectionCode');
      localStorage.removeItem('otakonOnboardingComplete');
      localStorage.removeItem('otakon_profile_setup_completed');
      localStorage.removeItem('otakonSkippedLanding');
      localStorage.removeItem('otakonAuthMethod');
      localStorage.removeItem('otakon_welcome_added_this_session');
      localStorage.removeItem('otakon_profile_setup_shown_this_session');
      localStorage.removeItem('otakon_profile_checked_this_session');
      localStorage.removeItem('otakon_dev_fallback_mode'); // Clear fallback mode flag
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Reset app state - show first run experience after reset
      setOnboardingStatus('initial'); // Start with first run experience
      setIsHandsFreeMode(false);
      setIsConnectionModalOpen(false);
      setView('app'); // This will show onboarding flow since onboardingStatus is 'initial'
      
      console.log('Full reset completed');
    } catch (error) {
      console.error('Error during full reset:', error);
    }
  }, [send, disconnect, resetConversations]);

  const handleLogoutOnly = useCallback(async () => {
    const isDeveloperMode = canAccessDeveloperFeatures(authState?.user?.email);
    
    setConfirmationModal({
      title: isDeveloperMode ? 'Sign Out of Developer Mode?' : 'Sign Out?',
      message: isDeveloperMode 
        ? 'Are you sure you want to sign out of developer mode? Your data will be preserved.'
        : 'Are you sure you want to sign out? Your data will be preserved.',
      onConfirm: async () => {
        try {
          // Sign out from Supabase
          await authService.signOut();
          
          // Reset app state and return to login screen
          setOnboardingStatus('login');
          setIsHandsFreeMode(false);
          setIsConnectionModalOpen(false);
          setView('app'); // This will show login screen since onboardingStatus is 'login'
          
          console.log('User logged out successfully (data preserved)');
        } catch (error) {
          console.error('Logout error:', error);
          // Even if Supabase logout fails, clear local data
          await executeFullReset();
        }
      },
    });
  }, [setConfirmationModal, executeFullReset]);

  // Function to logout and reset (clear all data) - for context menu
  const handleLogout = useCallback(async () => {
    const isDeveloperMode = canAccessDeveloperFeatures(authState?.user?.email);
    
    setConfirmationModal({
      title: isDeveloperMode ? 'Sign Out & Reset Developer Mode?' : 'Sign Out & Reset?',
      message: isDeveloperMode 
        ? 'Are you sure you want to sign out and reset developer mode? This will permanently delete all data and show the first run experience on next login.'
        : 'Are you sure you want to sign out and reset? This will permanently delete all data.',
      onConfirm: async () => {
        try {
          // First, clear local data and reset services while still authenticated
          if (send) {
            send({ type: 'clear_history' });
          }
          ttsService.cancel();
          disconnect?.();
          resetConversations?.();
          
          // Reset services while still authenticated to avoid 403 errors
          try {
            await unifiedUsageService.reset();
          } catch (error) {
            console.warn('Failed to reset usage service:', error);
          }
          
          try {
            await playerProfileService.resetWelcomeMessageTracking();
          } catch (error) {
            console.warn('Failed to reset welcome message tracking in Supabase:', error);
          }
          
          // Clear localStorage - complete reset for fresh first run experience
          localStorage.removeItem('lastConnectionCode');
          localStorage.removeItem('otakonOnboardingComplete');
          localStorage.removeItem('otakon_profile_setup_completed');
          localStorage.removeItem('otakonHasConnectedBefore');
          localStorage.removeItem('otakonAuthMethod');
          localStorage.removeItem('otakonInstallDismissed');
          localStorage.removeItem('otakon_developer_mode'); // Clear developer mode flag
          localStorage.removeItem('otakon_dev_fallback_mode'); // Clear fallback mode flag
          
          // Clear any splash screen flags to force first run experience
          localStorage.removeItem('otakon_show_splash_after_login');
          
          // Clear all conversation data for fresh start
          localStorage.removeItem('otakon_conversations');
          localStorage.removeItem('otakon_conversations_order');
          localStorage.removeItem('otakon_active_conversation');
          
          // Reset welcome message tracking so it shows again on next login
          localStorage.removeItem('otakon_welcome_message_shown');
          localStorage.removeItem('otakon_last_welcome_time');
          localStorage.removeItem('otakon_app_closed_time');
          localStorage.removeItem('otakon_first_run_completed');
          
          // Now sign out from Supabase (after all authenticated operations are done)
          await authService.signOut();
          
          // Reset app state and show first run experience
          setOnboardingStatus('initial'); // Start with first run experience
          setIsHandsFreeMode(false);
          setIsConnectionModalOpen(false);
          setView('app'); // This will show onboarding flow since onboardingStatus is 'initial'
          
          console.log('User logged out and reset successfully');
        } catch (error) {
          console.error('Logout and reset error:', error);
          // Even if Supabase logout fails, clear local data
          await executeFullReset();
        }
      },
    });
  }, [setConfirmationModal, send, disconnect, resetConversations, executeFullReset]);


  const handleResetApp = useCallback(() => {
    setConfirmationModal({
      title: 'Reset Application?',
      message: 'This will permanently delete all conversation history and settings, and log you out. This action cannot be undone.',
      onConfirm: executeFullReset,
    });
  }, [setConfirmationModal, executeFullReset]);

  const handleProfileSetupComplete = useCallback(async () => {
    try {
      console.log('Profile setup completion started');
      
      // Close the modal first
      setShowProfileSetup(false);
      console.log('Profile setup modal closed');
      
      // Mark profile setup as completed in Supabase
      await secureAppStateService.markProfileSetupComplete();
      console.log('Profile setup marked as completed in Supabase');
      
      // Mark profile setup as completed in localStorage
      const isDeveloperMode = authState.user?.email === 'developer@otakon.app' || localStorage.getItem('otakon_developer_mode') === 'true';
      const profileSetupKey = isDeveloperMode ? 'otakon_dev_profile_setup_completed' : 'otakon_profile_setup_completed';
      localStorage.setItem(profileSetupKey, 'true');
      console.log('Profile setup marked as completed in localStorage');
      
      // Mark first run as completed
      await playerProfileService.markFirstRunCompleted();
      console.log('First run marked as completed');
      
      // Update welcome message shown
      await playerProfileService.updateWelcomeMessageShown('profile_setup');
      console.log('Welcome message shown updated');
      
      // Welcome message is now added before profile setup modal shows, not here
      
      // Update onboarding status to complete
      setOnboardingStatus('complete');
      console.log('Onboarding status set to complete');
      
      console.log('Profile setup completion successful');
    } catch (error) {
      console.error('Error in profile setup completion:', error);
      // Even if there's an error, close the modal and continue
      setShowProfileSetup(false);
      setOnboardingStatus('complete');
    }
  }, [setShowProfileSetup, setOnboardingStatus, addSystemMessage]);

  const handleSkipProfileSetup = useCallback(async () => {
    try {
      console.log('Skipping profile setup');
      
      // Close the modal
      setShowProfileSetup(false);
      
      // Mark profile setup as completed in Supabase
      await secureAppStateService.markProfileSetupComplete();
      console.log('Profile setup marked as completed in Supabase');
      
      // Set default profile
      const defaultProfile = playerProfileService.getDefaultProfile();
      await playerProfileService.saveProfile(defaultProfile);
      
      // Mark first run as completed
      await playerProfileService.markFirstRunCompleted();
      
      // Update welcome message shown
      await playerProfileService.updateWelcomeMessageShown('profile_setup');
      console.log('Welcome message shown updated');
      
      // Welcome message is now added before profile setup modal shows, not here
      
      // Update onboarding status
      setOnboardingStatus('complete');
      
      console.log('Profile setup skipped successfully');
    } catch (error) {
      console.error('Error skipping profile setup:', error);
      // Even if there's an error, close the modal and continue
      setShowProfileSetup(false);
      setOnboardingStatus('complete');
    }
  }, [setShowProfileSetup, setOnboardingStatus, addSystemMessage]);

  return {
    handleLogout,
    handleLogoutOnly,
    executeFullReset,
    handleResetApp,
    handleProfileSetupComplete,
    handleSkipProfileSetup,
  };
};
