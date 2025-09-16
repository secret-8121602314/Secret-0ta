import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { unifiedOAuthService } from './services/unifiedOAuthService';
import { sessionRefreshService } from './services/sessionRefreshService';
import { authService } from './services/supabase';
import { secureAppStateService } from './services/secureAppStateService';
import { secureConversationService } from './services/atomicConversationService';
import { UserState, AppView } from './services/secureAppStateService';
import AuthCallbackHandler from './components/AuthCallbackHandler';
import { pwaNavigationService, PWANavigationState } from './services/pwaNavigationService';
import { supabaseDataService } from './services/supabaseDataService';
import { suggestedPromptsService } from './services/suggestedPromptsService';
import { profileService } from './services/profileService';
import { longTermMemoryService } from './services/longTermMemoryService';
import { contextManagementService } from './services/contextManagementService';
import { ttsService } from './services/ttsService';
import { unifiedUsageService } from './services/unifiedUsageService';
import { addFeedback } from './services/feedbackService';
import { smartNotificationService } from './services/smartNotificationService';
import { pwaAnalyticsService } from './services/pwaAnalyticsService';
import { offlineStorageService } from './services/offlineStorageService';
import { pushNotificationService } from './services/pushNotificationService';
import { appShortcutsService } from './services/appShortcutsService';
import { performanceMonitoringService } from './services/performanceMonitoringService';
import dailyEngagementService from './services/dailyEngagementService';
import { Achievement } from './services/types';
import { playerProfileService } from './services/playerProfileService';
import { proactiveInsightService } from './services/proactiveInsightService';
import { usageService } from './services/usageService';
import { enhancedInsightService } from './services/enhancedInsightService';
import { profileAwareInsightService } from './services/profileAwareInsightService';
import { advancedCacheService } from './services/advancedCacheService';
import { tierService } from './services/tierService';
import TrialButton from './components/TrialButton';
import FreeTrialModal from './components/FreeTrialModal';
import { feedbackAnalyticsService } from './services/feedbackAnalyticsService';
import { structuredResponseService } from './services/structuredResponseService';
import { useChat } from './hooks/useChat';
import { useConnection } from './hooks/useConnection';
import { useAdvancedCache } from './hooks/useAdvancedCache';
import { ConnectionStatus, Conversations, Conversation, ImageFile } from './services/types';

// Import components
import LandingPage from './components/LandingPage';
import MainViewContainer from './components/MainViewContainer';
import ConversationTabs from './components/ConversationTabs';
import ChatInput from './components/ChatInput';
import Logo from './components/Logo';
import SettingsIcon from './components/SettingsIcon';
import StarIcon from './components/StarIcon';
import LogoutIcon from './components/LogoutIcon';
import TrashIcon from './components/TrashIcon';
import AdBanner from './components/AdBanner';
import HandsFreeToggle from './components/HandsFreeToggle';
import CreditIndicator from './components/CreditIndicator';
import DesktopIcon from './components/DesktopIcon';
import AboutPage from './components/AboutPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import TermsOfServicePage from './components/TermsOfServicePage';
import ContactUsModal from './components/ContactUsModal';
import ContextMenu from './components/ContextMenu';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import LoginSplashScreen from './components/LoginSplashScreen';
import InitialSplashScreen from './components/InitialSplashScreen';
import HowToUseSplashScreen from './components/HowToUseSplashScreen';
import ProFeaturesSplashScreen from './components/ProFeaturesSplashScreen';
import UpgradeSplashScreen from './components/UpgradeSplashScreen';
import SplashScreen from './components/SplashScreen';
import ErrorBoundary from './components/ErrorBoundary';
import { LoadingSpinner } from './components/ui/LoadingStates';
import RefundPolicyPage from './components/RefundPolicyPage';
import ErrorMessage from './components/ErrorMessage';

// Import modal components
import ConnectionModal from './components/ConnectionModal';
import HandsFreeModal from './components/HandsFreeModal';
import SettingsModal from './components/SettingsModal';
import ConfirmationModal from './components/ConfirmationModal';
import FeedbackModal from './components/FeedbackModal';
import CreditModal from './components/CreditModal';
import InsightActionModal from './components/InsightActionModal';
import PolicyModal from './components/PolicyModal';
import AuthModal from './components/AuthModal';
import PWAInstallBanner from './components/PWAInstallBanner';
import DailyCheckinBanner from './components/DailyCheckinBanner';
import AchievementNotification from './components/AchievementNotification';
import { PlayerProfileSetupModal } from './components/PlayerProfileSetupModal';
import OtakuDiaryModal from './components/OtakuDiaryModal';
import WishlistModal from './components/WishlistModal';
import CachePerformanceDashboard from './components/CachePerformanceDashboard';

// Import hooks
import { useUsageTracking } from './hooks/useUsageTracking';
import { useErrorHandling } from './hooks/useErrorHandling';
import { useModals } from './hooks/useModals';
import { useAuthFlow } from './hooks/useAuthFlow';
import { useTutorial } from './hooks/useTutorial';
import { useEnhancedInsights } from './hooks/useEnhancedInsights';

// Import types and services
import { canAccessDeveloperFeatures } from './config/developer';

// ========================================
// 🛡️ SECURE APP COMPONENT
// ========================================
// This fixes all app-level issues with:
// - Proper error handling
// - Security validation
// - Performance optimization
// - State management
// - User experience

interface AppState {
  userState: UserState | null;
  appView: AppView | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  activeModal: 'about' | 'privacy' | 'refund' | 'contact' | 'terms' | null;
  
  // Modal states
  isConnectionModalOpen: boolean;
  isHandsFreeModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isCreditModalOpen: boolean;
  isOtakuDiaryModalOpen: boolean;
  isWishlistModalOpen: boolean;
  isCacheDashboardOpen: boolean;
  showProfileSetup: boolean;
  isFreeTrialModalOpen: boolean;
  isTierUpgradeModalOpen: boolean;
  
  // Feature states
  isHandsFreeMode: boolean;
  showUpgradeScreen: boolean;
  showDailyCheckin: boolean;
  currentAchievement: any | null;
  
  // Chat and connection states
  activeConversation: any;
  activeSubView: string;
  loadingMessages: string[];
  isCooldownActive: boolean;
  isFirstTime: boolean;
  conversations: Conversations;
  conversationsOrder: string[];
  activeConversationId: string;
  
  // Context menu and feedback
  contextMenu: any | null;
  feedbackModalState: any | null;
  confirmationModal: any | null;
  
  // Trial system
  trialEligibility: {
    isEligible: boolean;
    hasUsedTrial: boolean;
  } | null;
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    userState: null,
    appView: null,
    loading: true,
    error: null,
    initialized: false,
    activeModal: null,
    
    // Modal states
    isConnectionModalOpen: false,
    isHandsFreeModalOpen: false,
    isSettingsModalOpen: false,
    isCreditModalOpen: false,
    isOtakuDiaryModalOpen: false,
    isWishlistModalOpen: false,
    isCacheDashboardOpen: false,
    showProfileSetup: false,
    isFreeTrialModalOpen: false,
    isTierUpgradeModalOpen: false,
    
    // Feature states
    isHandsFreeMode: false,
    showUpgradeScreen: false,
    showDailyCheckin: false,
    currentAchievement: null,
    
    // Chat and connection states
    activeConversation: null,
    activeSubView: 'chat',
    loadingMessages: [],
    isCooldownActive: false,
    isFirstTime: false,
    conversations: {},
    conversationsOrder: [],
    activeConversationId: 'everything-else',
    
    // Context menu and feedback
    contextMenu: null,
    feedbackModalState: null,
    confirmationModal: null,
    
    // Trial system
    trialEligibility: null
  });
  const [isOAuthCallback, setIsOAuthCallback] = useState(false);
  
  // Additional state variables from backup for full feature parity
  const [hasRestored, setHasRestored] = useState(false);
  const [isManualUploadMode, setIsManualUploadMode] = useState(false);
  const [imagesForReview, setImagesForReview] = useState<any[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // PWA Navigation State
  const [pwaNavigationState, setPwaNavigationState] = useState<PWANavigationState>(() => pwaNavigationService.getNavigationState());

  // Chat and connection hooks
  const { 
    conversations, 
    conversationsOrder, 
    activeConversationId, 
    activeConversation, 
    activeSubView,
    loadingMessages,
    isCooldownActive,
    sendMessage: handleSendMessage,
    stopMessage: handleStopMessage,
    switchConversation: handleSwitchConversation,
    handleSubViewChange,
    retryMessage: handleRetry,
    resetConversations,
    addSystemMessage
  } = useChat(appState.isHandsFreeMode);

  const { 
    connect, 
    disconnect, 
    connectionCode, 
    status: connectionStatus, 
    lastSuccessfulConnection 
  } = useConnection((data) => {
    // Handle incoming messages from PC client
    console.log('Received message from PC client:', data);
    
    // Handle screenshot processing
    if (data.type === 'screenshot_batch') {
      console.log("📸 Processing screenshot batch:", data);
      
      // Extract data from payload if it exists, otherwise use data directly
      const batchData = data.payload || data;
      
      if (batchData.images && batchData.images.length > 0) {
        // Convert base64 images to ImageFile format
        const imageFiles: ImageFile[] = batchData.images.map((imgSrc: string, index: number) => {
          // Ensure proper data URL format
          const properDataUrl = imgSrc.startsWith('data:') ? imgSrc : `data:image/png;base64,${imgSrc}`;
          
          return {
            id: `pc-screenshot-${Date.now()}-${index}`,
            file: null, // No file object for PC screenshots
            preview: properDataUrl,
            name: `screenshot-${index + 1}.png`,
            size: 0,
            type: 'image/png'
          };
        });
        
        // Send message with screenshots
        handleSendMessage("", imageFiles, true).then(result => {
          if (result.success) {
            console.log("✅ Screenshot batch processed successfully");
          } else {
            console.error("❌ Failed to process screenshot batch:", result.reason);
          }
        });
      }
    } else if (data.type === 'screenshot') {
      console.log("📸 Processing individual screenshot:", data);
      
      if (data.dataUrl) {
        // Ensure proper data URL format
        const properDataUrl = data.dataUrl.startsWith('data:') ? data.dataUrl : `data:image/png;base64,${data.dataUrl}`;
        
        const imageFile: ImageFile = {
          id: `pc-screenshot-${Date.now()}`,
          file: null,
          preview: properDataUrl,
          name: `screenshot.png`,
          size: 0,
          type: 'image/png'
        };
        
        // Send message with screenshot
        handleSendMessage("", [imageFile], true).then(result => {
          if (result.success) {
            console.log("✅ Individual screenshot processed successfully");
          } else {
            console.error("❌ Failed to process individual screenshot:", result.reason);
          }
        });
      }
    }
  });

  // Missing handlers
  const handleUpgradeClick = useCallback(() => {
    setAppState(prev => ({ ...prev, showUpgradeScreen: true }));
  }, []);

  const handleOpenWishlistModal = useCallback(() => {
    setAppState(prev => ({ ...prev, isWishlistModalOpen: true }));
  }, []);

  // Handle sign out
  const handleSignOut = useCallback(async () => {
    try {
      await authService.signOut();
      setAppState(prev => ({
        ...prev,
        userState: null,
        appView: { view: 'landing', onboardingStatus: 'login' },
        activeConversation: null,
        conversations: {},
        conversationsOrder: [],
        activeConversationId: 'everything-else'
      }));
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  }, []);

  // Handle reset (developer mode only)
  const handleReset = useCallback(async () => {
    if (!appState.userState?.isDeveloper) return;
    
    try {
      // Clear all local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Reset app state
      setAppState(prev => ({
        ...prev,
        userState: null,
        appView: { view: 'landing', onboardingStatus: 'login' },
        activeConversation: null,
        conversations: {},
        conversationsOrder: [],
        activeConversationId: 'everything-else',
        isFirstTime: true
      }));
      
      // Reset conversations
      resetConversations();
      
      console.log('✅ Developer reset completed');
    } catch (error) {
      console.error('Failed to reset:', error);
    }
  }, [appState.userState?.isDeveloper, resetConversations]);

  // Initialize app state - FIXED AND SIMPLIFIED
  const initializeApp = useCallback(async () => {
    try {
      setAppState(prev => ({ ...prev, loading: true, error: null }));

      // Get user state
      const userState = await secureAppStateService.getUserState();
      
      // Determine app view
      const appView = secureAppStateService.determineView(userState);

      // FIXED: Clear logic for first-time vs returning users
      let onboardingStatus = 'complete';
      
      if (userState.isAuthenticated) {
        // Skip splash screens if user has completed onboarding
        if (userState.hasSeenSplashScreens && userState.hasProfileSetup && !userState.isNewUser) {
          onboardingStatus = 'complete';
        } else if (userState.isNewUser || !userState.hasSeenSplashScreens || !userState.hasProfileSetup) {
          // First-time user needs full onboarding
          onboardingStatus = 'initial';
        } else if (!userState.hasProfileSetup) {
          // Returning user needs profile setup
          onboardingStatus = 'profile-setup';
        }
      }

      // Only log user state for authenticated users or non-landing views
      if (userState.isAuthenticated || appView.view !== 'landing') {
        console.log('🔧 [App] User state:', {
          isAuthenticated: userState.isAuthenticated,
          isNewUser: userState.isNewUser,
          hasSeenSplashScreens: userState.hasSeenSplashScreens,
          hasProfileSetup: userState.hasProfileSetup,
          onboardingStatus
        });
      }

      setAppState({
        userState,
        appView: { ...appView, onboardingStatus },
        loading: false,
        error: null,
        initialized: true,
        activeModal: null,
        isConnectionModalOpen: false,
        isHandsFreeModalOpen: false,
        isSettingsModalOpen: false,
        isCreditModalOpen: false,
        isOtakuDiaryModalOpen: false,
        isWishlistModalOpen: false,
        isCacheDashboardOpen: false,
        showProfileSetup: userState.isAuthenticated && !userState.hasProfileSetup,
        isHandsFreeMode: false,
        showUpgradeScreen: false,
        showDailyCheckin: false,
        currentAchievement: null,
        activeConversation: null, // Will be set by useChat hook
        activeSubView: 'chat',
        loadingMessages: [],
        isCooldownActive: false,
        isFirstTime: userState.isNewUser,
        conversations: {},
        conversationsOrder: [],
        activeConversationId: 'everything-else',
        contextMenu: null,
        feedbackModalState: null,
        confirmationModal: null
      });

    } catch (error) {
      console.error('Failed to initialize app:', error);
      setAppState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize app',
        initialized: true
      }));
    }
  }, []);

  // Handle authentication state changes
  const handleAuthStateChange = useCallback(async () => {
    try {
      if (!appState.initialized) {
        return;
      }

      // Get updated user state
      const userState = await secureAppStateService.getUserState();
      
      // Only log if there's a meaningful change
      if (!appState.userState || appState.userState.isAuthenticated !== userState.isAuthenticated) {
        console.log('🔧 [App] Auth state changed:', {
          wasAuthenticated: appState.userState?.isAuthenticated,
          isAuthenticated: userState.isAuthenticated
        });
        
        // Reset OAuth callback flag when auth state change is complete
        if (userState.isAuthenticated && isOAuthCallback) {
          console.log('🔧 [App] Auth state change complete, resetting OAuth callback flag');
          setIsOAuthCallback(false);
        }
      }
      
      // Determine app view
      const appView = secureAppStateService.determineView(userState);

      // Apply same onboarding logic for auth state changes
      let onboardingStatus = 'complete';
      
      if (userState.isAuthenticated) {
        // Skip splash screens if user has completed onboarding
        if (userState.hasSeenSplashScreens && userState.hasProfileSetup && !userState.isNewUser) {
          onboardingStatus = 'complete';
        } else if (userState.isNewUser || !userState.hasSeenSplashScreens || !userState.hasProfileSetup) {
          // First-time user needs full onboarding
          onboardingStatus = 'initial';
        } else if (!userState.hasProfileSetup) {
          // Returning user needs profile setup
          onboardingStatus = 'profile-setup';
        }
        // Returning users with complete profile go straight to chat (onboardingStatus = 'complete')
      }

      setAppState(prev => ({
        ...prev,
        userState,
        appView: { ...appView, onboardingStatus },
        error: null
      }));

    } catch (error) {
      console.error('Failed to handle auth state change:', error);
      setAppState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Authentication error'
      }));
    }
  }, [appState.initialized]);

  // Modal handlers (now provided by useModals hook)

  // Handle ESC key to close modal (moved after useModals hook)

  // Debug modal state changes (only log when modal is actually active)
  useEffect(() => {
    if (appState.activeModal) {
      console.log('Modal state changed:', appState.activeModal);
    }
  }, [appState.activeModal]);

  // Debug function to check localStorage (temporary)
  const debugLocalStorage = useCallback(() => {
    console.log('🔧 [App] LocalStorage Debug:', {
      onboardingStatus: localStorage.getItem('otakon_onboarding_status'),
      onboardingSteps: JSON.parse(localStorage.getItem('otakon_onboarding_steps') || '[]'),
      developerMode: localStorage.getItem('otakon_developer_mode'),
      authMethod: localStorage.getItem('otakonAuthMethod')
    });
  }, []);

  // Add debug function to window for easy access
  useEffect(() => {
    (window as any).debugLocalStorage = debugLocalStorage;
  }, [debugLocalStorage]);

  // Check trial eligibility when user state changes
  const checkTrialEligibility = useCallback(async () => {
    if (!appState.userState?.authUserId) return;

    try {
      const isEligible = await tierService.isEligibleForTrial(appState.userState.authUserId);
      const { data: user } = await supabaseDataService.supabase
        .from('users')
        .select('has_used_trial')
        .eq('auth_user_id', appState.userState.authUserId)
        .single();

      setAppState(prev => ({
        ...prev,
        trialEligibility: {
          isEligible,
          hasUsedTrial: user?.has_used_trial || false
        }
      }));
    } catch (error) {
      console.error('Error checking trial eligibility:', error);
    }
  }, [appState.userState?.authUserId]);

  useEffect(() => {
    checkTrialEligibility();
  }, [checkTrialEligibility]);

  // Handle starting free trial
  const handleStartFreeTrial = useCallback(async () => {
    if (!appState.userState?.authUserId) return;

    try {
      const success = await tierService.startFreeTrial(appState.userState.authUserId);
      if (success) {
        // Refresh user state to get updated tier
        await refreshUserState();
        // Recheck trial eligibility
        await checkTrialEligibility();
        console.log('✅ Free trial started successfully');
      } else {
        console.error('❌ Failed to start free trial');
      }
    } catch (error) {
      console.error('Error starting free trial:', error);
    }
  }, [appState.userState?.authUserId]);

  // Handle onboarding status updates
  const handleOnboardingUpdate = useCallback(async (status: string) => {
    try {
      console.log('🔧 [App] handleOnboardingUpdate called with status:', status);
      console.log('🔧 [App] Current app state:', {
        isAuthenticated: appState.userState?.isAuthenticated,
        isDeveloper: appState.userState?.isDeveloper,
        currentOnboardingStatus: appState.appView?.onboardingStatus
      });
      
      // Update onboarding status if user is authenticated
      if (appState.userState?.isAuthenticated) {
        console.log('🔧 [App] User is authenticated, updating onboarding status');
        await secureAppStateService.updateOnboardingStatus(status);
        // Also update local app state immediately for better UX
        setAppState(prev => ({
          ...prev,
          appView: {
            view: 'app',
            onboardingStatus: status
          }
        }));
        // Refresh app state to get updated user state
        await handleAuthStateChange();
      } else {
        console.log('🔧 [App] User not authenticated, updating local state only');
        // For unauthenticated users, update both view and onboarding status
        // Keep user in 'app' view for all onboarding steps including 'complete'
        // Only go to 'landing' when explicitly requested (like 'back to landing')
        setAppState(prev => ({
          ...prev,
          appView: {
            view: 'app', // Always stay in app view during onboarding
            onboardingStatus: status
          }
        }));
      }
      
    } catch (error) {
      console.error('Failed to update onboarding status:', error);
      setAppState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update onboarding status'
      }));
    }
  }, [handleAuthStateChange, appState.userState?.isAuthenticated]);

  // SIMPLIFIED: Handle onboarding completion
  const handleOnboardingComplete = useCallback(async () => {
    try {
      console.log('🔧 [App] Completing onboarding for user');
      
      // Mark all onboarding steps as complete
      await secureAppStateService.markOnboardingComplete();
      await secureAppStateService.markProfileSetupComplete();
      await secureAppStateService.markSplashScreensSeen();
      await secureAppStateService.markWelcomeMessageShown();
      await secureAppStateService.markFirstRunComplete();
      
      // For developer mode, also update localStorage
      if (appState.userState?.isDeveloper) {
        localStorage.setItem('otakon_dev_onboarding_complete', 'true');
        localStorage.setItem('otakon_dev_profile_setup', 'true');
      }
      
      // Refresh app state to get updated user state
      await handleAuthStateChange();
      
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setAppState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to complete onboarding'
      }));
    }
  }, [handleAuthStateChange, appState.userState?.isDeveloper]);

  // SIMPLIFIED: Handle splash screen completion
  const handleSplashScreenComplete = useCallback(async (step: string) => {
    try {
      console.log(`🔧 [App] Completing splash screen step: ${step}`);
      
      // Mark splash screens as seen
      await secureAppStateService.markSplashScreensSeen();
      
      // For the last step (pro-features), complete onboarding
      if (step === 'pro-features') {
        await handleOnboardingComplete();
      } else {
        // Move to next step
        const nextStep = getNextOnboardingStep(step);
        setAppState(prev => ({
          ...prev,
          appView: {
            ...prev.appView!,
            onboardingStatus: nextStep
          }
        }));
      }
      
    } catch (error) {
      console.error('Failed to complete splash screen:', error);
      setAppState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to complete splash screen'
      }));
    }
  }, [handleOnboardingComplete]);

  // Helper function to get next onboarding step
  const getNextOnboardingStep = (currentStep: string): string => {
    const steps = ['initial', 'features', 'how-to-use', 'features-connected', 'pro-features'];
    const currentIndex = steps.indexOf(currentStep);
    return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : 'complete';
  };

  // Missing authentication handlers from backup
  const handleAuthSuccess = useCallback(async () => {
    console.log('🔧 [App] handleAuthSuccess called');
    try {
      // Refresh app state to get updated user state
      await handleAuthStateChange();
      
      // The app state will automatically determine the correct onboarding status
      // based on the user's authentication state and onboarding flags
      
    } catch (error) {
      console.error('Failed to handle auth success:', error);
      setAppState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to handle authentication success'
      }));
    }
  }, [handleAuthStateChange]);

  const handleLoginComplete = useCallback(async () => {
    console.log('🔧 [App] handleLoginComplete called');
    try {
      // Refresh app state to get updated user state
      await handleAuthStateChange();
      
    } catch (error) {
      console.error('Failed to handle login completion:', error);
      setAppState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to handle login completion'
      }));
    }
  }, [handleAuthStateChange]);

  const handleInitialSplashComplete = useCallback(async () => {
    console.log('🔧 [App] Initial splash completed');
    await handleSplashScreenComplete('initial');
  }, [handleSplashScreenComplete]);

  const handleFeaturesConnectedComplete = useCallback(async () => {
    console.log('🔧 [App] Features connected splash completed');
    await handleSplashScreenComplete('features-connected');
  }, [handleSplashScreenComplete]);

  const handleHowToUseComplete = useCallback(async () => {
    console.log('🔧 [App] How to use splash completed');
    await handleSplashScreenComplete('how-to-use');
  }, [handleSplashScreenComplete]);


  // Handle error recovery
  const handleErrorRecovery = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  // Custom hooks for app functionality

  const {
    refreshUsage,
    loadUsageData,
    handleUpgrade,
    handleUpgradeToVanguard,
    canMakeQuery,
    recordQuery,
  } = useUsageTracking({ 
    usage: { 
      textQueries: 0, 
      imageQueries: 0, 
      insights: 0,
      textCount: 0,
      imageCount: 0,
      textLimit: 0,
      imageLimit: 0,
      tier: 'free'
    }, 
    setUsage: () => {} 
  });

  // Additional handler functions that depend on handleUpgrade and handleUpgradeToVanguard
  const handleUpgradeAndContinue = useCallback(async () => {
    console.log('🔧 [App] handleUpgradeAndContinue called');
    try {
      // Handle upgrade and continue to next step
      await handleUpgrade();
      // Mark pro-features step as completed
      await handleOnboardingUpdate('pro-features');
      // Move to next onboarding step
      await handleOnboardingUpdate('how-to-use');
    } catch (error) {
      console.error('Failed to handle upgrade and continue:', error);
    }
  }, [handleUpgrade, handleOnboardingUpdate]);

  const handleUpgradeToVanguardAndContinue = useCallback(async () => {
    console.log('🔧 [App] handleUpgradeToVanguardAndContinue called');
    try {
      // Handle vanguard upgrade and continue to next step
      await handleUpgradeToVanguard();
      // Mark pro-features step as completed
      await handleOnboardingUpdate('pro-features');
      // Move to next onboarding step
      await handleOnboardingUpdate('how-to-use');
    } catch (error) {
      console.error('Failed to handle vanguard upgrade and continue:', error);
    }
  }, [handleUpgradeToVanguard, handleOnboardingUpdate]);

  const {
    handleError,
    handleDatabaseError,
    handleNetworkError,
    handleAuthError,
    retryOperation,
    withErrorHandling,
  } = useErrorHandling({
    setDatabaseSyncStatus: () => {},
    setLastDatabaseSync: () => {},
  });

  const {
    confirmationModal,
    handleSettingsClick,
    handleContextMenuAction,
    handleFeedback: handleFeedbackModal,
    closeFeedbackModal,
    openModal,
    closeModal,
    showConfirmation,
    hideConfirmation,
  } = useModals({
    setContextMenu: (menu: any) => setAppState(prev => ({ ...prev, contextMenu: menu })),
    setFeedbackModalState: (state: any) => setAppState(prev => ({ ...prev, feedbackModalState: state })),
    setActiveModal: (modal: any) => setAppState(prev => ({ ...prev, activeModal: modal })),
  });

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && appState.activeModal) {
        closeModal();
      }
    };

    if (appState.activeModal) {
      document.addEventListener('keydown', handleEscKey);
      // Only prevent body scroll if modal is actually rendered
      // This prevents scroll lock when modal state is set but modal isn't visible
      const modalElement = document.querySelector('[data-modal="true"]');
      if (modalElement) {
        document.body.style.overflow = 'hidden';
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [appState.activeModal, closeModal]);

  const {
    handleLogout,
    handleLogoutOnly,
    executeFullReset,
    handleResetApp,
    handleProfileSetupComplete,
    handleSkipProfileSetup,
  } = useAuthFlow({
    authState: { user: appState.userState || null, loading: false },
    setAuthState: () => {},
    setOnboardingStatus: (status: string) => {
      setAppState(prev => ({
        ...prev,
        appView: prev.appView ? { ...prev.appView, onboardingStatus: status } : null
      }));
    },
    setView: (view: 'landing' | 'app') => {
      setAppState(prev => ({
        ...prev,
        appView: prev.appView ? { ...prev.appView, view } : null
      }));
    },
    setIsHandsFreeMode: (mode: boolean) => setAppState(prev => ({ ...prev, isHandsFreeMode: mode })),
    setIsConnectionModalOpen: (open: boolean) => setAppState(prev => ({ ...prev, isConnectionModalOpen: open })),
    setShowProfileSetup: (show: boolean) => setAppState(prev => ({ ...prev, showProfileSetup: show })),
    setConfirmationModal: (modal: any) => setAppState(prev => ({ ...prev, confirmationModal: modal })),
    send: handleSendMessage,
    disconnect,
    resetConversations,
    refreshUsage,
  });

  const {
    isTutorialOpen,
    hasCompletedTutorial,
    shouldShowTutorial,
    openTutorial,
    closeTutorial,
    completeTutorial,
    skipTutorial,
  } = useTutorial();

  // Event handlers
  const handleScreenshotReceived = useCallback((screenshot: string) => {
    console.log('Screenshot received from PC client');
  }, []);

  const handleFeedbackSubmit = useCallback(async (feedbackText: string) => {
    if (!appState.feedbackModalState) return;
    
    try {
      console.log('Feedback submitted:', { feedbackText, feedbackModalState: appState.feedbackModalState });
      closeFeedbackModal();
    } catch (error) {
      handleError(error as Error, 'feedbackSubmission');
    }
  }, [appState.feedbackModalState, closeFeedbackModal, handleError]);

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authService.subscribe(handleAuthStateChange);
    return unsubscribe;
  }, [handleAuthStateChange]);

  // OAuth callback handling - using unified service
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Only process if we're in an OAuth callback
      if (!unifiedOAuthService.isOAuthCallback()) {
        return;
      }

      console.log('🔐 [App] OAuth callback detected, processing...');
      
      // Set OAuth callback flag immediately to prevent landing page flash
      setIsOAuthCallback(true);
      
      try {
        const result = await unifiedOAuthService.handleOAuthCallback({
          onSuccess: (user, session) => {
            console.log('🔐 [App] OAuth callback successful, user:', user);
            // Keep OAuth callback flag true until auth state is fully processed
            // The auth state change will be handled by the auth service subscription
          },
          onError: (error) => {
            console.error('🔐 [App] OAuth callback failed:', error);
            setIsOAuthCallback(false);
            // Error will be handled by the auth service error handling
          }
        });

        if (result.success) {
          console.log('🔐 [App] OAuth callback processed successfully');
        } else {
          console.error('🔐 [App] OAuth callback failed:', result.error);
        }
      } catch (error) {
        console.error('🔐 [App] OAuth callback handling failed:', error);
        setIsOAuthCallback(false);
      }
    };

    handleOAuthCallback();
  }, [setIsOAuthCallback]);

  // Initialize session refresh service
  useEffect(() => {
    sessionRefreshService.initialize({
      autoRefresh: true,
      refreshInterval: 5 * 60 * 1000, // 5 minutes
      maxRetries: 3,
      onRefreshSuccess: (session) => {
        console.log('🔄 [App] Session refreshed successfully');
      },
      onRefreshFailure: (error) => {
        console.error('🔄 [App] Session refresh failed:', error);
      },
      onSessionExpired: () => {
        console.log('🔄 [App] Session expired, redirecting to login');
        // Clear auth state and redirect to login
        setAppState(prev => ({
          ...prev,
          appView: { view: 'login', onboardingStatus: 'complete' },
          userState: null
        }));
      }
    });

    return () => {
      sessionRefreshService.reset();
    };
  }, []);

  // Authentication state management - automatically transition from login to initial when authenticated
  useEffect(() => {
    // Only transition if user just became authenticated and we're on login screen
    if (appState.userState?.isAuthenticated && appState.appView?.onboardingStatus === 'login') {
      console.log('🔧 [App] User authenticated on login screen, checking for recent auth...');
      
      // Check if this is a fresh authentication (not a page reload with existing session)
      const authMethod = localStorage.getItem('otakonAuthMethod');
      const hasRecentAuth = authMethod && (authMethod === 'google' || authMethod === 'discord' || authMethod === 'developer');
      
      if (hasRecentAuth) {
        console.log('🔧 [App] Authentication successful, transitioning to initial splash screen...');
        
        // Clear the auth method to prevent re-triggering
        localStorage.removeItem('otakonAuthMethod');
        
        // Transition to initial splash screen
        handleOnboardingUpdate('initial');
      }
    }
  }, [appState.userState?.isAuthenticated, appState.appView?.onboardingStatus, handleOnboardingUpdate]);

  // PWA Navigation Service Integration
  useEffect(() => {
    const setupPwaNavigationSubscription = async () => {
      try {
        const unsubscribe = await pwaNavigationService.subscribe((newState) => {
          // Only log PWA navigation changes for authenticated users
          if (appState.userState?.isAuthenticated) {
            console.log('🔧 [App] PWA navigation state updated:', newState);
          }
          setPwaNavigationState(newState);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('Failed to setup PWA navigation subscription:', error);
        return () => {}; // Return empty unsubscribe function
      }
    };
    
    setupPwaNavigationSubscription();
  }, [setPwaNavigationState]);

  // Welcome message logic for first-time users
  useEffect(() => {
    const checkWelcomeMessage = async () => {
      try {
        // Only check for authenticated users who have completed onboarding
        if (appState.userState?.isAuthenticated && appState.appView?.onboardingStatus === 'complete') {
          console.log('🔧 [App] Checking welcome message for authenticated user...');
          
          // Check if we've already shown welcome message in this session
          const sessionKey = 'otakon_welcome_shown_session';
          const hasShownWelcomeThisSession = sessionStorage.getItem(sessionKey) === 'true';
          
          if (hasShownWelcomeThisSession) {
            console.log('🔧 [App] Welcome message already shown this session, skipping...');
            return;
          }
          
          const shouldShow = await supabaseDataService.shouldShowWelcomeMessage();
          const hasCompletedProfileSetup = await supabaseDataService.getUserAppState().then(state => state.appSettings?.profileSetupCompleted) || localStorage.getItem('otakon_profile_setup_completed') === 'true';
          
          console.log('🔧 [App] Welcome message check:', { shouldShow, hasCompletedProfileSetup });
          
          if (shouldShow && hasCompletedProfileSetup) {
            // Check if there are already messages in the everything-else conversation
            const everythingElseConversation = conversations?.['everything-else'];
            const hasExistingMessages = everythingElseConversation?.messages && everythingElseConversation.messages.length > 0;
            
            if (hasExistingMessages) {
              console.log('🔧 [App] Welcome message not shown - conversation already has messages');
              // Still mark as shown to prevent future attempts
              sessionStorage.setItem(sessionKey, 'true');
              return;
            }
            
            console.log('🔧 [App] Showing welcome message to user...');
            
            // Add system message for welcome - always in everything-else tab
            if (addSystemMessage) {
              addSystemMessage('Welcome to Otakon! I\'m here to help you with your anime and gaming needs. Feel free to ask me anything!', 'everything-else');
            }
            
            // Mark welcome message as shown
            await supabaseDataService.updateWelcomeMessageShown('first_time');
            
            // Mark as shown in this session to prevent duplicates
            sessionStorage.setItem(sessionKey, 'true');
            
            console.log('✅ Welcome message tracking updated via Supabase service');
          } else {
            console.log('❌ Welcome message not shown - conditions not met:', {
              hasCompletedProfileSetup,
              shouldShow
            });
          }
        }
      } catch (error) {
        console.error('Error checking welcome message:', error);
      }
    };
    
    // Execute the welcome message check
    checkWelcomeMessage();
  }, [appState.userState?.isAuthenticated, appState.appView?.onboardingStatus, conversations]);

  // Handle window focus/blur for session management
  useEffect(() => {
    const handleWindowFocus = () => {
      if (appState.initialized && appState.userState?.isAuthenticated) {
        handleAuthStateChange();
      }
    };

    const handleWindowBlur = () => {
      // Optional: Handle session timeout or cleanup
    };

    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [appState.initialized, appState.userState?.isAuthenticated, handleAuthStateChange]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      if (appState.initialized) {
        handleAuthStateChange();
      }
    };

    const handleOffline = () => {
      // Optional: Handle offline mode
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [appState.initialized, handleAuthStateChange]);

  // Render loading state
  if (appState.loading || !appState.initialized) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  // Render error state
  if (appState.error) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
        <ErrorMessage 
          message={appState.error}
          onRetry={handleErrorRecovery}
          onReload={() => window.location.reload()}
        />
      </div>
    );
  }

  // Render splash screens based on onboarding status - FIXED WITH CLEAR NAMES
  const renderSplashScreen = () => {
    const onboardingStatus = appState.appView?.onboardingStatus || 'login';
    console.log('🔧 [App] renderSplashScreen called with onboardingStatus:', onboardingStatus);
    console.log('🔧 [App] renderSplashScreen appState.appView:', appState.appView);
    
    switch (onboardingStatus) {
      case 'login':
        return (
          <>
            <LoginSplashScreen
              key={`login-${appState.userState?.isAuthenticated ? appState.userState.id : 'anonymous'}`}
              onComplete={() => {
                console.log('🔧 [App] Login completed, calling handleLoginComplete');
                console.log('🔧 [App] Current app state before refresh:', appState);
                // After login, call the proper login completion handler
                handleLoginComplete();
              }}
              onOpenPrivacy={() => openModal('privacy')}
              onOpenTerms={() => openModal('terms')}
              onBackToLanding={() => {
                console.log('Back to landing clicked');
                // Properly navigate back to landing page
                setAppState(prev => ({
                  ...prev,
                  appView: {
                    view: 'landing',
                    onboardingStatus: 'complete' // Landing page only shows when onboarding is complete
                  }
                }));
              }}
            />
            
            {/* Modals for login page */}
            {appState.activeModal === 'privacy' && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal} data-modal="true">
                <div className="bg-[#1C1C1C] border border-[#424242] rounded-2xl shadow-2xl w-full max-w-4xl m-4 relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                  <header className="flex-shrink-0 p-6 border-b border-[#2E2E2E]/60 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-[#F5F5F5]">Privacy Policy</h2>
                    <button onClick={closeModal} className="text-[#6E6E6E] hover:text-[#F5F5F5] transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </header>
                  <main className="flex-1 overflow-y-auto p-8 min-h-0">
                    <PrivacyPolicyPage />
                  </main>
                  <footer className="flex-shrink-0 p-6 border-t border-[#2E2E2E]/60 flex justify-end">
                    <button onClick={closeModal} className="bg-neutral-600 hover:bg-neutral-700 text-white font-medium py-2 px-6 rounded-md transition-colors">
                      Back
                    </button>
                  </footer>
                </div>
              </div>
            )}
            
            {appState.activeModal === 'terms' && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal} data-modal="true">
                <div className="bg-[#1C1C1C] border border-[#424242] rounded-2xl shadow-2xl w-full max-w-4xl m-4 relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                  <header className="flex-shrink-0 p-6 border-b border-[#2E2E2E]/60 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-[#F5F5F5]">Terms of Service</h2>
                    <button onClick={closeModal} className="text-[#6E6E6E] hover:text-[#F5F5F5] transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </header>
                  <main className="flex-1 overflow-y-auto p-8 min-h-0">
                    <div className="text-white">
                      <h3 className="text-xl font-bold mb-4">Terms of Service</h3>
                      <p>This is a test to see if the modal renders.</p>
                      <TermsOfServicePage />
                    </div>
                  </main>
                  <footer className="flex-shrink-0 p-6 border-t border-[#2E2E2E]/60 flex justify-end">
                    <button onClick={closeModal} className="bg-neutral-600 hover:bg-neutral-700 text-white font-medium py-2 px-6 rounded-md transition-colors">
                      Back
                    </button>
                  </footer>
                </div>
              </div>
            )}
          </>
        );
      case 'initial': // Splash Screen 1 - Initial Welcome
        return (
          <InitialSplashScreen
            key={`splash1-${appState.userState?.id || 'anonymous'}`}
            onComplete={handleInitialSplashComplete}
          />
        );
      case 'features': // Skip this step - go directly to PC connection
        return (
          <SplashScreen
            onComplete={handleHowToUseComplete}
            onSkipConnection={() => {
              // If user skips PC connection, go directly to pro features
              setAppState(prev => ({
                ...prev,
                appView: {
                  ...prev.appView!,
                  onboardingStatus: 'pro-features'
                }
              }));
            }}
            onConnect={(code) => {
              // Handle PC connection
              console.log('PC connection code:', code);
              connect(code);
            }}
            status={connectionStatus}
            error={null}
            connectionCode={connectionCode}
            onConnectionSuccess={() => {
              // After successful connection, go to pro features
              setAppState(prev => ({
                ...prev,
                appView: {
                  ...prev.appView!,
                  onboardingStatus: 'pro-features'
                }
              }));
            }}
          />
        );
      case 'how-to-use': // Splash Screen 3 - PC Connection
        return (
          <SplashScreen
            onComplete={handleHowToUseComplete}
            onSkipConnection={() => {
              // If user skips PC connection, go directly to pro features
              setAppState(prev => ({
                ...prev,
                appView: {
                  ...prev.appView!,
                  onboardingStatus: 'pro-features'
                }
              }));
            }}
            onConnect={connect}
            status={ConnectionStatus.DISCONNECTED}
            error={null}
            connectionCode={connectionCode}
            onConnectionSuccess={() => {
              // If PC connection is successful, show "You're Connected" screen
              setAppState(prev => ({
                ...prev,
                appView: {
                  ...prev.appView!,
                  onboardingStatus: 'features-connected'
                }
              }));
            }}
          />
        );
      case 'features-connected': // Splash Screen 4 - "You're Connected!" (only if PC connected)
        return (
          <HowToUseSplashScreen
            onComplete={handleFeaturesConnectedComplete}
          />
        );
      case 'pro-features': // Final splash screen - "Supercharge" then go to main app
        return (
          <ProFeaturesSplashScreen
            onComplete={handleOnboardingComplete}
            onUpgrade={handleUpgradeAndContinue}
            onUpgradeToVanguard={handleUpgradeToVanguardAndContinue}
          />
        );
      case 'profile-setup': // Profile Setup - After all splash screens
        return (
          <div className="min-h-screen bg-[#000000] flex items-center justify-center">
            <PlayerProfileSetupModal
              isOpen={true}
              onComplete={handleOnboardingComplete}
              onSkip={handleOnboardingComplete}
            />
          </div>
        );
      default:
        return null;
    }
  };

  // Render app based on view and onboarding status
  // Only log rendering for non-landing views to reduce console noise
  if (appState.appView?.view !== 'landing') {
    console.log('🔧 [App] Rendering app with appView:', appState.appView);
  }
  
  if (appState.appView?.view === 'landing') {
    // If we're processing an OAuth callback, show loading instead of landing page
    if (isOAuthCallback) {
      return (
        <div className="min-h-screen bg-[#000000] flex items-center justify-center">
          <LoadingSpinner size="xl" />
        </div>
      );
    }
    
    // If onboarding is complete, show the actual landing page
    if (appState.appView?.onboardingStatus === 'complete') {
      return (
        <ErrorBoundary>
          {/* Global Modals - rendered regardless of context */}
          {appState.activeModal === 'about' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal} data-modal="true">
              <div className="bg-[#1C1C1C] border border-[#424242] rounded-2xl shadow-2xl w-full max-w-4xl m-4 relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <header className="flex-shrink-0 p-6 border-b border-[#2E2E2E]/60 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[#F5F5F5]">About Otagon</h2>
                  <button onClick={closeModal} className="text-[#6E6E6E] hover:text-[#F5F5F5] transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </header>
                <main className="flex-1 overflow-y-auto p-8 min-h-0">
                  <AboutPage />
                </main>
                <footer className="flex-shrink-0 p-6 border-t border-[#2E2E2E]/60 flex justify-end">
                  <button onClick={closeModal} className="bg-neutral-600 hover:bg-neutral-700 text-white font-medium py-2 px-6 rounded-md transition-colors">
                    Back
                  </button>
                </footer>
              </div>
            </div>
          )}
          
          {appState.activeModal === 'privacy' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal} data-modal="true">
              <div className="bg-[#1C1C1C] border border-[#424242] rounded-2xl shadow-2xl w-full max-w-4xl m-4 relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <header className="flex-shrink-0 p-6 border-b border-[#2E2E2E]/60 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[#F5F5F5]">Privacy Policy</h2>
                  <button onClick={closeModal} className="text-[#6E6E6E] hover:text-[#F5F5F5] transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </header>
                <main className="flex-1 overflow-y-auto p-8 min-h-0">
                  <PrivacyPolicyPage />
                </main>
                <footer className="flex-shrink-0 p-6 border-t border-[#2E2E2E]/60 flex justify-end">
                  <button onClick={closeModal} className="bg-neutral-600 hover:bg-neutral-700 text-white font-medium py-2 px-6 rounded-md transition-colors">
                    Back
                  </button>
                </footer>
              </div>
            </div>
          )}
          
          {appState.activeModal === 'refund' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal} data-modal="true">
              <div className="bg-[#1C1C1C] border border-[#424242] rounded-2xl shadow-2xl w-full max-w-4xl m-4 relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <header className="flex-shrink-0 p-6 border-b border-[#2E2E2E]/60 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[#F5F5F5]">Refund Policy</h2>
                  <button onClick={closeModal} className="text-[#6E6E6E] hover:text-[#F5F5F5] transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </header>
                <main className="flex-1 overflow-y-auto p-8 min-h-0">
                  <RefundPolicyPage />
                </main>
                <footer className="flex-shrink-0 p-6 border-t border-[#2E2E2E]/60 flex justify-end">
                  <button onClick={closeModal} className="bg-neutral-600 hover:bg-neutral-700 text-white font-medium py-2 px-6 rounded-md transition-colors">
                    Back
                  </button>
                </footer>
              </div>
            </div>
          )}
          
          {appState.activeModal === 'terms' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal} data-modal="true">
              <div className="bg-[#1C1C1C] border border-[#424242] rounded-2xl shadow-2xl w-full max-w-4xl m-4 relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <header className="flex-shrink-0 p-6 border-b border-[#2E2E2E]/60 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[#F5F5F5]">Terms of Service</h2>
                  <button onClick={closeModal} className="text-[#6E6E6E] hover:text-[#F5F5F5] transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </header>
                <main className="flex-1 overflow-y-auto p-8 min-h-0">
                  <div className="text-white">
                    <h3 className="text-xl font-bold mb-4">Terms of Service</h3>
                    <p>This is a test to see if the modal renders.</p>
                    <TermsOfServicePage />
                  </div>
                </main>
                <footer className="flex-shrink-0 p-6 border-t border-[#2E2E2E]/60 flex justify-end">
                  <button onClick={closeModal} className="bg-neutral-600 hover:bg-neutral-700 text-white font-medium py-2 px-6 rounded-md transition-colors">
                    Back
                  </button>
                </footer>
              </div>
            </div>
          )}
          
          {appState.activeModal === 'contact' && (
            <ContactUsModal isOpen={true} onClose={closeModal} />
          )}

          {/* Landing Page Content */}
          <Router>
            <Routes>
              <Route 
                path="/" 
                element={
                  <LandingPage 
                    onGetStarted={() => {
                      // Navigate to login screen
                      console.log('Get Started clicked - navigating to login screen');
                      handleOnboardingUpdate('login');
                    }}
                    onOpenAbout={() => openModal('about')}
                    onOpenPrivacy={() => openModal('privacy')}
                    onOpenRefund={() => openModal('refund')}
                    onOpenContact={() => openModal('contact')}
                    onOpenTerms={() => openModal('terms')}
                    onDirectNavigation={(path: string) => console.log('Navigate to:', path)}
                  />
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ErrorBoundary>
      );
    }
    
    // Show splash screen based on onboarding status
    return (
      <ErrorBoundary>
        {renderSplashScreen()}
      </ErrorBoundary>
    );
  }

  // Render main app with onboarding
  if (appState.appView?.view === 'app') {
    console.log('🔧 [App] Rendering main app with onboarding status:', appState.appView?.onboardingStatus);
    // Check if we need to show onboarding flow
    const onboardingStatus = appState.appView?.onboardingStatus;
    
    if (onboardingStatus && onboardingStatus !== 'complete') {
      return (
        <ErrorBoundary>
          {renderSplashScreen()}
        </ErrorBoundary>
      );
    }
    
    // Show main chat interface when onboarding is complete
    return (
      <ErrorBoundary>
        {/* Modals - Outside Router to avoid interference */}
        {appState.activeModal === 'about' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
            <div className="bg-[#1C1C1C] border border-[#424242] rounded-2xl shadow-2xl w-full max-w-4xl m-4 relative max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <header className="flex-shrink-0 p-6 border-b border-[#2E2E2E]/60 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#F5F5F5]">About Otakon</h2>
                <button onClick={closeModal} className="text-[#6E6E6E] hover:text-[#F5F5F5] transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </header>
              <main className="flex-1 overflow-y-auto p-8">
                <AboutPage />
              </main>
              <footer className="flex-shrink-0 p-6 border-t border-[#2E2E2E]/60 flex justify-end">
                <button onClick={closeModal} className="bg-neutral-600 hover:bg-neutral-700 text-white font-medium py-2 px-6 rounded-md transition-colors">
                  Back
                </button>
              </footer>
            </div>
          </div>
        )}
        
        {appState.activeModal === 'privacy' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
            <div className="bg-[#1C1C1C] border border-[#424242] rounded-2xl shadow-2xl w-full max-w-4xl m-4 relative max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <header className="flex-shrink-0 p-6 border-b border-[#2E2E2E]/60 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#F5F5F5]">Privacy Policy</h2>
                <button onClick={closeModal} className="text-[#6E6E6E] hover:text-[#F5F5F5] transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </header>
              <main className="flex-1 overflow-y-auto p-8">
                <PrivacyPolicyPage />
              </main>
              <footer className="flex-shrink-0 p-6 border-t border-[#2E2E2E]/60 flex justify-end">
                <button onClick={closeModal} className="bg-neutral-600 hover:bg-neutral-700 text-white font-medium py-2 px-6 rounded-md transition-colors">
                  Back
                </button>
              </footer>
            </div>
          </div>
        )}
        
        {appState.activeModal === 'refund' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
            <div className="bg-[#1C1C1C] border border-[#424242] rounded-2xl shadow-2xl w-full max-w-4xl m-4 relative max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <header className="flex-shrink-0 p-6 border-b border-[#2E2E2E]/60 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#F5F5F5]">Refund Policy</h2>
                <button onClick={closeModal} className="text-[#6E6E6E] hover:text-[#F5F5F5] transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </header>
              <main className="flex-1 overflow-y-auto p-8">
                <RefundPolicyPage />
              </main>
              <footer className="flex-shrink-0 p-6 border-t border-[#2E2E2E]/60 flex justify-end">
                <button onClick={closeModal} className="bg-neutral-600 hover:bg-neutral-700 text-white font-medium py-2 px-6 rounded-md transition-colors">
                  Back
                </button>
              </footer>
            </div>
          </div>
        )}
        
        {appState.activeModal === 'terms' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal} data-modal="true">
            <div className="bg-[#1C1C1C] border border-[#424242] rounded-2xl shadow-2xl w-full max-w-4xl m-4 relative max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <header className="flex-shrink-0 p-6 border-b border-[#2E2E2E]/60 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#F5F5F5]">Terms of Service</h2>
                <button onClick={closeModal} className="text-[#6E6E6E] hover:text-[#F5F5F5] transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </header>
              <main className="flex-1 overflow-y-auto p-8">
                <div className="text-white">
                  <h3 className="text-xl font-bold mb-4">Terms of Service</h3>
                  <p>This is a test to see if the modal renders.</p>
                  <TermsOfServicePage />
                </div>
              </main>
              <footer className="flex-shrink-0 p-6 border-t border-[#2E2E2E]/60 flex justify-end">
                <button onClick={closeModal} className="bg-neutral-600 hover:bg-neutral-700 text-white font-medium py-2 px-6 rounded-md transition-colors">
                  Back
                </button>
              </footer>
            </div>
          </div>
        )}
        
        {appState.activeModal === 'contact' && (
          <ContactUsModal isOpen={true} onClose={closeModal} />
        )}
        
        <div className="min-h-screen bg-[#000000] text-white flex flex-col">
          {/* Main App View */}
          {activeConversation ? (
            <>
              {/* Header */}
              <header className="flex-shrink-0 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6 pb-2 sm:pb-3 border-b border-[#2E2E2E]/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Logo className="w-8 h-8 sm:w-10 sm:h-10" />
                    <h1 className="text-lg sm:text-xl font-bold text-white">Otagon</h1>
                  </div>
                  
                    <div className="flex items-center gap-2">
                      {/* Credit Indicator */}
                      {appState.userState?.usage && (
                        <>
                          {console.log('🔧 [App] CreditIndicator usage data:', {
                            tier: appState.userState.tier,
                            textLimit: appState.userState.usage.textLimit,
                            imageLimit: appState.userState.usage.imageLimit,
                            textCount: appState.userState.usage.textCount,
                            imageCount: appState.userState.usage.imageCount
                          })}
                          <CreditIndicator
                            usage={{
                              textQueries: appState.userState.usage.textCount,
                              imageQueries: appState.userState.usage.imageCount,
                              insights: 0,
                              textCount: appState.userState.usage.textCount,
                              imageCount: appState.userState.usage.imageCount,
                              textLimit: appState.userState.usage.textLimit,
                              imageLimit: appState.userState.usage.imageLimit,
                              tier: appState.userState.tier
                            }}
                            onClick={() => setAppState(prev => ({ ...prev, isCreditModalOpen: true }))}
                          />
                        </>
                      )}
                      
                      {/* Hands-Free Toggle - Pro/Vanguard only */}
                      {(appState.userState?.tier === 'pro' || appState.userState?.tier === 'vanguard_pro') && (
                        <HandsFreeToggle
                          isHandsFree={appState.isHandsFreeMode}
                          onToggle={() => setAppState(prev => ({ ...prev, isHandsFreeMode: !prev.isHandsFreeMode }))}
                        />
                      )}
                      
                      {/* Connect to PC Button */}
                      <button
                        type="button"
                        onClick={() => setAppState(prev => ({ ...prev, isConnectionModalOpen: true }))}
                        className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2 sm:px-3 h-10 sm:h-12 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 disabled:opacity-50
                        ${
                          connectionStatus === ConnectionStatus.CONNECTED
                          ? 'border-2 border-[#5CBB7B]/60 text-[#5CBB7B] hover:bg-[#5CBB7B]/10 hover:border-[#5CBB7B] shadow-[0_0_20px_rgba(92,187,123,0.4)] hover:shadow-[0_0_30px_rgba(92,187,123,0.6)]'
                          : 'bg-gradient-to-r from-[#2E2E2E] to-[#1C1C1C] border-2 border-[#424242]/60 text-white/90 hover:from-[#424242] hover:to-[#2E2E2E] hover:scale-105 hover:shadow-lg'
                        }
                        ${
                          connectionStatus === ConnectionStatus.CONNECTING ? 'animate-pulse' : ''
                        }
                        `}
                        title={
                          connectionStatus === ConnectionStatus.CONNECTED 
                              ? 'Connected to PC' 
                              : 'Connect to PC'
                        }
                        aria-label={connectionStatus === ConnectionStatus.CONNECTED ? 'Connected to PC' : 'Connect to PC'}
                      >
                        <DesktopIcon className="w-5 h-5 flex-shrink-0" />
                        <span className="hidden sm:inline font-medium">
                          {connectionStatus === ConnectionStatus.CONNECTED ? 'PC Connected' : 'Connect PC'}
                        </span>
                      </button>
                      
                      
                      {/* Settings Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setAppState(prev => ({ 
                            ...prev, 
                            contextMenu: { 
                              targetRect: rect,
                              items: [
                                {
                                  label: 'Settings',
                                  icon: SettingsIcon,
                                  action: () => setAppState(prev => ({ ...prev, isSettingsModalOpen: true }))                                                                                                           
                                },
                                // Trial button - only for free users, not in dev mode
                                ...(appState.userState?.tier === 'free' && 
                                    !appState.userState?.isDeveloper && 
                                    appState.trialEligibility?.isEligible ? [{
                                  label: 'Start 14-Day Free Trial',
                                  icon: StarIcon,
                                  action: () => setAppState(prev => ({ ...prev, isFreeTrialModalOpen: true }))
                                }] : []),
                                {
                                  label: 'Sign Out',
                                  icon: LogoutIcon,
                                  action: handleSignOut,
                                  isDestructive: true
                                },
                                ...(appState.userState?.isDeveloper ? [{
                                  label: 'Reset (Dev)',
                                  icon: TrashIcon,
                                  action: handleReset,
                                  isDestructive: true
                                }] : [])
                              ]
                            } 
                          }));
                        }}
                        className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2 sm:px-3 h-10 sm:h-12 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-[#2E2E2E] to-[#1C1C1C] border-2 border-[#424242]/60 text-white/90 transition-all duration-300 hover:from-[#424242] hover:to-[#2E2E2E] hover:scale-105 hover:shadow-lg"
                        aria-label="Open settings"
                      >
                        <SettingsIcon className="w-5 h-5 flex-shrink-0" />
                        <span className="hidden sm:inline font-medium">Settings</span>
                      </button>
                  </div>
                </div>
              </header>

              {/* Ad Banner for free users only - developer mode users on pro/vanguard should not see ads */}
              {appState.userState?.tier === 'free' && (
                <div className="px-3 sm:px-4 md:px-6 py-2">
                  <AdBanner />
                </div>
              )}

              {/* Conversation Tabs */}
              <ConversationTabs
                conversations={conversations}
                conversationsOrder={conversationsOrder}
                activeConversationId={activeConversationId}
                activeConversation={activeConversation}
                onSwitchConversation={handleSwitchConversation}
                onContextMenu={() => {}} // TODO: Add context menu handler
                onReorder={() => {}} // TODO: Add reorder handler
              />

              {/* Main Content Area */}
              <main className="flex-1 flex flex-col min-h-0 bg-[#000000]">
                <MainViewContainer
                  activeConversation={activeConversation}
                  activeSubView={activeSubView}
                  onSubViewChange={handleSubViewChange}
                  onSendMessage={handleSendMessage}
                  stopMessage={handleStopMessage}
                  isInputDisabled={isCooldownActive}
                  messages={activeConversation?.messages || []}
                  loadingMessages={loadingMessages}
                  onUpgradeClick={handleUpgradeClick}
                  onFeedback={(type, convId, targetId, originalText, vote) => {
                    // Handle feedback - this would integrate with feedback service
                    console.log('Feedback received:', { type, convId, targetId, vote });
                    addFeedback({
                      conversationId: convId,
                      targetId: targetId,
                      originalText: originalText,
                      feedbackText: `${type}: ${vote}`
                    });
                  }}
                  onRetry={handleRetry}
                  isFirstTime={appState.isFirstTime}
                  onOpenWishlistModal={handleOpenWishlistModal}
                />
              </main>

              {/* Chat Input */}
              <div className="flex-shrink-0 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-[#2E2E2E]/20">
                <ChatInput
                  value=""
                  onChange={() => {}}
                  onSendMessage={handleSendMessage}
                  isCooldownActive={isCooldownActive}
                  onImageProcessingError={(error) => console.error('Image processing error:', error)}
                  usage={appState.userState?.usage ? {
                    textQueries: appState.userState.usage.textCount,
                    imageQueries: appState.userState.usage.imageCount,
                    insights: 0,
                    textCount: appState.userState.usage.textCount,
                    imageCount: appState.userState.usage.imageCount,
                    textLimit: appState.userState.usage.textLimit,
                    imageLimit: appState.userState.usage.imageLimit,
                    tier: appState.userState.tier
                  } : {
                    textQueries: 0,
                    imageQueries: 0,
                    insights: 0,
                    textCount: 0,
                    imageCount: 0,
                    textLimit: 55,
                    imageLimit: 25,
                    tier: 'free'
                  }}
                  imagesForReview={[]}
                  onImagesReviewed={() => {}}
                  isManualUploadMode={false}
                  onToggleManualUploadMode={() => {}}
                  connectionStatus={connectionStatus}
                  textareaRef={{ current: null }}
                  onBatchUploadAttempt={() => {}}
                  hasInsights={!!activeConversation?.insights}
                  activeConversation={activeConversation}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-gray-400">Initializing chat...</p>
              </div>
            </div>
          )}

          {/* Modals */}
          {appState.isConnectionModalOpen && (
            <ConnectionModal
              isOpen={appState.isConnectionModalOpen}
              onClose={() => setAppState(prev => ({ ...prev, isConnectionModalOpen: false }))}
              onConnect={connect}
              onDisconnect={disconnect}
              status={ConnectionStatus.DISCONNECTED}
              error={null}
              connectionCode={connectionCode}
              lastSuccessfulConnection={lastSuccessfulConnection ? new Date(lastSuccessfulConnection) : null}
              onShowHowToUse={() => handleOnboardingUpdate('how-to-use')}
            />
          )}

          {appState.isHandsFreeModalOpen && (appState.userState?.tier === 'pro' || appState.userState?.tier === 'vanguard_pro') && (
            <HandsFreeModal
              onClose={() => setAppState(prev => ({ ...prev, isHandsFreeModalOpen: false }))}
              isHandsFree={appState.isHandsFreeMode}
              onToggleHandsFree={() => setAppState(prev => ({ ...prev, isHandsFreeMode: !prev.isHandsFreeMode }))}
            />
          )}

          {appState.isSettingsModalOpen && (
            <SettingsModal
              isOpen={appState.isSettingsModalOpen}
              onClose={() => setAppState(prev => ({ ...prev, isSettingsModalOpen: false }))}
              usage={appState.userState?.usage ? {
                textQueries: appState.userState.usage.textCount,
                imageQueries: appState.userState.usage.imageCount,
                insights: 0,
                textCount: appState.userState.usage.textCount,
                imageCount: appState.userState.usage.imageCount,
                textLimit: appState.userState.usage.textLimit,
                imageLimit: appState.userState.usage.imageLimit,
                tier: appState.userState.tier
              } : { 
                textQueries: 0, 
                imageQueries: 0, 
                insights: 0,
                textCount: 0,
                imageCount: 0,
                textLimit: 55,
                imageLimit: 25,
                tier: 'free'
              }}
              onShowUpgrade={handleUpgrade}
              onShowVanguardUpgrade={handleUpgradeToVanguard}
              onLogout={handleLogoutOnly}
              onResetApp={handleResetApp}
              onShowHowToUse={() => handleOnboardingUpdate('how-to-use')}
              userEmail={appState.userState?.email || ''}
              onClearFirstRunCache={() => {}}
              refreshUsage={async () => {
                // Refresh app state when tier changes in developer mode
                console.log('🔄 Refreshing app state after tier change...');
                
                // Clear the user state cache to force fresh data
                secureAppStateService.clearUserStateCache();
                
                await handleAuthStateChange();
              }}
            />
          )}

          {appState.isFreeTrialModalOpen && (
            <FreeTrialModal
              isOpen={appState.isFreeTrialModalOpen}
              onClose={() => setAppState(prev => ({ ...prev, isFreeTrialModalOpen: false }))}
              onStartTrial={handleStartFreeTrial}
              isLoading={false}
            />
          )}

          {appState.isCreditModalOpen && (
            <CreditModal
              onClose={() => setAppState(prev => ({ ...prev, isCreditModalOpen: false }))}
              usage={appState.userState?.usage ? {
                textQueries: appState.userState.usage.textCount,
                imageQueries: appState.userState.usage.imageCount,
                insights: 0,
                textCount: appState.userState.usage.textCount,
                imageCount: appState.userState.usage.imageCount,
                textLimit: appState.userState.usage.textLimit,
                imageLimit: appState.userState.usage.imageLimit,
                tier: appState.userState.tier
              } : { 
                textQueries: 0, 
                imageQueries: 0, 
                insights: 0,
                textCount: 0,
                imageCount: 0,
                textLimit: 55,
                imageLimit: 25,
                tier: 'free'
              }}
              onUpgrade={handleUpgrade}
            />
          )}

          {appState.showProfileSetup && (
            <PlayerProfileSetupModal
              isOpen={appState.showProfileSetup}
              onComplete={handleProfileSetupComplete}
              onSkip={handleSkipProfileSetup}
            />
          )}

          {appState.isOtakuDiaryModalOpen && (
            <OtakuDiaryModal
              isOpen={appState.isOtakuDiaryModalOpen}
              gameId=""
              gameTitle=""
              onClose={() => setAppState(prev => ({ ...prev, isOtakuDiaryModalOpen: false }))}
            />
          )}

          {appState.isWishlistModalOpen && (
            <WishlistModal
              isOpen={appState.isWishlistModalOpen}
              onClose={() => setAppState(prev => ({ ...prev, isWishlistModalOpen: false }))}
            />
          )}

          {appState.isCacheDashboardOpen && (
            <CachePerformanceDashboard
              isOpen={appState.isCacheDashboardOpen}
              onClose={() => setAppState(prev => ({ ...prev, isCacheDashboardOpen: false }))}
            />
          )}

          {/* Context Menu */}
          {appState.contextMenu && (
            <ContextMenu
              targetRect={appState.contextMenu.targetRect}
              items={appState.contextMenu.items}
              onClose={() => setAppState(prev => ({ ...prev, contextMenu: null }))}
            />
          )}

          {/* Confirmation Modal */}
          {appState.confirmationModal && (
            <ConfirmationModal
              title={appState.confirmationModal.title}
              message={appState.confirmationModal.message}
              onConfirm={appState.confirmationModal.onConfirm}
              onCancel={() => setAppState(prev => ({ ...prev, confirmationModal: null }))}
            />
          )}

          {/* Feedback Modal */}
          {appState.feedbackModalState && (
            <FeedbackModal
              onClose={closeFeedbackModal}
              onSubmit={handleFeedbackSubmit}
              originalText={appState.feedbackModalState.originalText || ''}
            />
          )}

          {/* Banners */}
          {appState.showDailyCheckin && (
            <DailyCheckinBanner
              onClose={() => setAppState(prev => ({ ...prev, showDailyCheckin: false }))}
            />
          )}

          {appState.currentAchievement && (
            <AchievementNotification
              achievement={appState.currentAchievement}
              onClose={() => setAppState(prev => ({ ...prev, currentAchievement: null }))}
            />
          )}


          {/* PWA Install Banner */}
          <PWAInstallBanner />
        </div>
      </ErrorBoundary>
    );
  }

  // Default return for app view
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#000000] text-white">
        {renderSplashScreen()}
      </div>
    </ErrorBoundary>
  );
};

export default App;
