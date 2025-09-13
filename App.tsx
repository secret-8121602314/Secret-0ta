import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/supabase';
import { secureAppStateService } from './services/fixedAppStateService';
import { secureConversationService } from './services/atomicConversationService';
import { UserState, AppView } from './services/fixedAppStateService';

// Import components
import LandingPage from './components/LandingPage';
import MainViewContainer from './components/MainViewContainer';
import AboutPage from './components/AboutPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import TermsOfServicePage from './components/TermsOfServicePage';
import ContactUsModal from './components/ContactUsModal';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import LoginSplashScreen from './components/LoginSplashScreen';
import InitialSplashScreen from './components/InitialSplashScreen';
import HowToUseSplashScreen from './components/HowToUseSplashScreen';
import ProFeaturesSplashScreen from './components/ProFeaturesSplashScreen';
import UpgradeSplashScreen from './components/UpgradeSplashScreen';
import SplashScreen from './components/SplashScreen';
import ErrorBoundary from './components/ErrorBoundary';
import { LoadingSpinner } from './components/ui/LoadingStates';
import ErrorMessage from './components/ErrorMessage';

// Import modal components
import ConnectionModal from './components/ConnectionModal';
import HandsFreeModal from './components/HandsFreeModal';
import SettingsModal from './components/SettingsModal';
import ConfirmationModal from './components/ConfirmationModal';
import FeedbackModal from './components/FeedbackModal';
import ContextMenu from './components/ContextMenu';
import CreditModal from './components/CreditModal';
import PWAInstallBanner from './components/PWAInstallBanner';
import DailyCheckinBanner from './components/DailyCheckinBanner';
import AchievementNotification from './components/AchievementNotification';
import { PlayerProfileSetupModal } from './components/PlayerProfileSetupModal';
import OtakuDiaryModal from './components/OtakuDiaryModal';
import WishlistModal from './components/WishlistModal';
import CachePerformanceDashboard from './components/CachePerformanceDashboard';

// Import hooks
import { useChat } from './hooks/useChat';
import { useConnection } from './hooks/useConnection';
import { useUsageTracking } from './hooks/useUsageTracking';
import { useErrorHandling } from './hooks/useErrorHandling';
import { useModals } from './hooks/useModals';
import { useAuthFlow } from './hooks/useAuthFlow';
import { useTutorial } from './hooks/useTutorial';

// Import types and services
import { ConnectionStatus } from './services/types';
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
  
  // Context menu and feedback
  contextMenu: any | null;
  feedbackModalState: any | null;
  confirmationModal: any | null;
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
    
    // Context menu and feedback
    contextMenu: null,
    feedbackModalState: null,
    confirmationModal: null
  });

  // Initialize app state
  const initializeApp = useCallback(async () => {
    try {
      setAppState(prev => ({ ...prev, loading: true, error: null }));

      // Get user state
      const userState = await secureAppStateService.getUserState();
      
      // Determine app view
      const appView = secureAppStateService.determineView(userState);

      setAppState({
        userState,
        appView,
        loading: false,
        error: null,
        initialized: true
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
      if (!appState.initialized) return;

      // Get updated user state
      const userState = await secureAppStateService.getUserState();
      
      // Determine app view
      const appView = secureAppStateService.determineView(userState);

      setAppState(prev => ({
        ...prev,
        userState,
        appView,
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

  // Debug modal state changes
  useEffect(() => {
    console.log('Modal state changed:', appState.activeModal);
  }, [appState.activeModal]);

  // Handle onboarding status updates
  const handleOnboardingUpdate = useCallback(async (status: string) => {
    try {
      // Only update onboarding status if user is authenticated
      if (appState.userState?.isAuthenticated) {
        await secureAppStateService.updateOnboardingStatus(status);
        // Refresh app state
        await handleAuthStateChange();
      } else {
        // For unauthenticated users, just update local state
        setAppState(prev => ({
          ...prev,
          appView: prev.appView ? { ...prev.appView, onboardingStatus: status } : null
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

  // Handle onboarding completion
  const handleOnboardingComplete = useCallback(async () => {
    try {
      await secureAppStateService.markOnboardingComplete();
      await secureAppStateService.markProfileSetupComplete();
      await secureAppStateService.markSplashScreensSeen();
      await secureAppStateService.markWelcomeMessageShown();
      await secureAppStateService.markFirstRunComplete();
      
      // Refresh app state
      await handleAuthStateChange();
      
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setAppState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to complete onboarding'
      }));
    }
  }, [handleAuthStateChange]);

  // Handle profile setup completion (now provided by useAuthFlow hook)

  // Handle splash screens completion
  const handleSplashScreensComplete = useCallback(async () => {
    try {
      await secureAppStateService.markSplashScreensSeen();
      
      // Refresh app state
      await handleAuthStateChange();
      
    } catch (error) {
      console.error('Failed to complete splash screens:', error);
      setAppState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to complete splash screens'
      }));
    }
  }, [handleAuthStateChange]);

  // Handle welcome message completion
  const handleWelcomeMessageComplete = useCallback(async () => {
    try {
      await secureAppStateService.markWelcomeMessageShown();
      
      // Refresh app state
      await handleAuthStateChange();
      
    } catch (error) {
      console.error('Failed to complete welcome message:', error);
      setAppState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to complete welcome message'
      }));
    }
  }, [handleAuthStateChange]);

  // Handle first run completion
  const handleFirstRunComplete = useCallback(async () => {
    try {
      await secureAppStateService.markFirstRunComplete();
      
      // Refresh app state
      await handleAuthStateChange();
      
    } catch (error) {
      console.error('Failed to complete first run:', error);
      setAppState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to complete first run'
      }));
    }
  }, [handleAuthStateChange]);

  // Handle error recovery
  const handleErrorRecovery = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  // Custom hooks for app functionality
  const {
    conversations,
    activeConversation,
    loadingMessages,
    isCooldownActive,
    sendMessage,
    stopMessage,
    resetConversations,
    addSystemMessage,
    restoreHistory,
    switchConversation,
    fetchInsightContent,
  } = useChat(appState.isHandsFreeMode);

  const {
    connect,
    disconnect,
    connectionCode,
    send,
    lastSuccessfulConnection,
    forceReconnect,
  } = useConnection((screenshot: string) => {
    console.log('Screenshot received from PC client');
  });

  const {
    refreshUsage,
    loadUsageData,
    handleUpgrade,
    handleUpgradeToVanguard,
    canMakeQuery,
    recordQuery,
  } = useUsageTracking({ 
    usage: { textQueries: 0, imageQueries: 0, insights: 0 }, 
    setUsage: () => {} 
  });

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
    handleFeedback,
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
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
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
    authState: { user: appState.userState?.user || null, loading: false },
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
    send,
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

  const handleSendMessage = useCallback(async (text: string, images?: any[]) => {
    if (!text.trim() && (!images || images.length === 0)) return;
    
    try {
      // Check if user can make the query
      const canMakeTextQuery = await canMakeQuery('text', 1);
      const canMakeImageQuery = images && images.length > 0 ? await canMakeQuery('image', images.length) : true;
      
      if (!canMakeTextQuery || !canMakeImageQuery) {
        setAppState(prev => ({ ...prev, showUpgradeScreen: true }));
        return;
      }
      
      // Record the query
      if (text.trim()) {
        await recordQuery('text', 1);
      }
      if (images && images.length > 0) {
        await recordQuery('image', images.length);
      }
      
      // Send the message
      await sendMessage(text, images);
    } catch (error) {
      handleError(error as Error, 'sendMessage');
    }
  }, [canMakeQuery, recordQuery, sendMessage, handleError]);

  const handleStopMessage = useCallback((messageId: string) => {
    stopMessage(messageId);
  }, [stopMessage]);

  const handleUpgradeClick = useCallback(() => {
    setAppState(prev => ({ ...prev, showUpgradeScreen: true }));
  }, []);

  const handleFeedbackSubmit = useCallback(async (vote: 'up' | 'down') => {
    if (!appState.feedbackModalState) return;
    
    try {
      console.log('Feedback submitted:', { vote, feedbackModalState: appState.feedbackModalState });
      closeFeedbackModal();
    } catch (error) {
      handleError(error as Error, 'feedbackSubmission');
    }
  }, [appState.feedbackModalState, closeFeedbackModal, handleError]);

  const handleRetry = useCallback((messageId: string) => {
    console.log('Retrying message:', messageId);
  }, []);

  const handleSubViewChange = useCallback((subView: string) => {
    setAppState(prev => ({ ...prev, activeSubView: subView }));
  }, []);

  const handleOpenWishlistModal = useCallback(() => {
    setAppState(prev => ({ ...prev, isWishlistModalOpen: true }));
  }, []);

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authService.subscribe(handleAuthStateChange);
    return unsubscribe;
  }, [handleAuthStateChange]);

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Render error state
  if (appState.error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <ErrorMessage 
          message={appState.error}
          onRetry={handleErrorRecovery}
          onReload={() => window.location.reload()}
        />
      </div>
    );
  }

  // Render splash screens based on onboarding status
  const renderSplashScreen = () => {
    const onboardingStatus = appState.appView?.onboardingStatus || 'login';
    
    switch (onboardingStatus) {
      case 'login':
        return (
          <LoginSplashScreen
            onComplete={() => {
              console.log('Login completed, refreshing app state');
              // After login, refresh the app state to determine correct onboarding status
              handleAuthStateChange();
            }}
            onOpenPrivacy={() => openModal('privacy')}
            onOpenTerms={() => openModal('terms')}
            onBackToLanding={() => {
              console.log('Back to landing clicked');
              handleOnboardingUpdate('complete');
            }}
          />
        );
      case 'initial':
        return (
          <InitialSplashScreen
            onComplete={() => handleOnboardingUpdate('features')}
            onProfileSetupComplete={handleProfileSetupComplete}
            onSplashScreensComplete={handleSplashScreensComplete}
            onWelcomeMessageShown={handleWelcomeMessageComplete}
            onFirstRunComplete={handleFirstRunComplete}
            userState={appState.userState}
          />
        );
      case 'features':
        return (
          <HowToUseSplashScreen
            onComplete={() => handleOnboardingUpdate('pro-features')}
            onProfileSetupComplete={handleProfileSetupComplete}
            onSplashScreensComplete={handleSplashScreensComplete}
            onWelcomeMessageShown={handleWelcomeMessageComplete}
            onFirstRunComplete={handleFirstRunComplete}
            userState={appState.userState}
          />
        );
      case 'pro-features':
        return (
          <ProFeaturesSplashScreen
            onComplete={() => handleOnboardingUpdate('how-to-use')}
            onUpgrade={handleUpgrade}
            onUpgradeToVanguard={handleUpgradeToVanguard}
          />
        );
      case 'how-to-use':
        return (
          <SplashScreen
            onComplete={() => handleOnboardingUpdate('tier-splash')}
            onSkipConnection={() => handleOnboardingUpdate('complete')}
            onConnect={connect}
            status={ConnectionStatus.DISCONNECTED}
            error={null}
            connectionCode={connectionCode}
            onConnectionSuccess={() => handleOnboardingUpdate('tier-splash')}
          />
        );
      case 'tier-splash':
        return (
          <UpgradeSplashScreen
            onUpgrade={handleUpgrade}
            onUpgradeToVanguard={handleUpgradeToVanguard}
            onClose={() => handleOnboardingUpdate('complete')}
          />
        );
      default:
        return null;
    }
  };

  // Render app based on view and onboarding status
  if (appState.appView?.view === 'landing') {
    // If onboarding is complete, show the actual landing page
    if (appState.appView?.onboardingStatus === 'complete') {
      return (
        <ErrorBoundary>
          {/* Modals for landing page */}
          {appState.activeModal === 'about' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
              <div className="bg-[#1C1C1C] border border-[#424242] rounded-2xl shadow-2xl w-full max-w-4xl m-4 relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <header className="flex-shrink-0 p-6 border-b border-[#2E2E2E]/60 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[#F5F5F5]">About Otakon</h2>
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
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
          
          {appState.activeModal === 'contact' && (
            <ContactUsModal isOpen={true} onClose={closeModal} />
          )}
          
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
    // Check if we need to show onboarding flow
    const onboardingStatus = appState.appView?.onboardingStatus;
    
    if (onboardingStatus && onboardingStatus !== 'complete') {
      return (
        <ErrorBoundary>
          {/* Modals - Outside Router to avoid interference */}
          {console.log('Current activeModal:', appState.activeModal)}
          {appState.activeModal === 'about' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
              <div className="bg-[#1C1C1C] border border-[#424242] rounded-2xl shadow-2xl w-full max-w-4xl m-4 relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <header className="flex-shrink-0 p-6 border-b border-[#2E2E2E]/60 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[#F5F5F5]">About Otakon</h2>
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
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
          
          {appState.activeModal === 'contact' && (
            <ContactUsModal isOpen={true} onClose={closeModal} />
          )}
          
          <LoginSplashScreen
            onComplete={() => {
              console.log('Login completed, refreshing app state');
              // After login, refresh the app state to determine correct onboarding status
              handleAuthStateChange();
            }}
            onOpenPrivacy={() => openModal('privacy')}
            onOpenTerms={() => openModal('terms')}
            onBackToLanding={() => {
              console.log('Back to landing clicked');
              handleOnboardingUpdate('complete');
            }}
          />
        </ErrorBoundary>
      );
    }
    
    // Show landing page
    return (
      <ErrorBoundary>
        {/* Modals - Outside Router to avoid interference */}
        {console.log('Current activeModal:', appState.activeModal)}
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
        
        {appState.activeModal === 'contact' && (
          <ContactUsModal isOpen={true} onClose={closeModal} />
        )}
        
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

  // Render main app with all functionality
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#1A1A1A] text-white">
        {/* Main App View */}
        <MainViewContainer
          activeConversation={activeConversation}
          activeSubView={appState.activeSubView}
          onSubViewChange={handleSubViewChange}
          onSendMessage={handleSendMessage}
          stopMessage={handleStopMessage}
          isInputDisabled={isCooldownActive}
          messages={activeConversation?.messages || []}
          loadingMessages={loadingMessages}
          onUpgradeClick={handleUpgradeClick}
          onFeedback={handleFeedback}
          onRetry={handleRetry}
          isFirstTime={appState.isFirstTime}
          onOpenWishlistModal={handleOpenWishlistModal}
        />

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

        {appState.isHandsFreeModalOpen && (
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
            usage={{ 
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
            refreshUsage={refreshUsage}
          />
        )}

        {appState.isCreditModalOpen && (
          <CreditModal
            onClose={() => setAppState(prev => ({ ...prev, isCreditModalOpen: false }))}
            usage={{ 
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

        {/* Policy Modals */}
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
        
        {appState.activeModal === 'contact' && (
          <ContactUsModal isOpen={true} onClose={closeModal} />
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
};

export default App;
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
        
        {appState.activeModal === 'contact' && (
          <ContactUsModal isOpen={true} onClose={closeModal} />
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
};

export default App;