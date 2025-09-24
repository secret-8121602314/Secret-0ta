import React, { useCallback } from 'react';
import { useAppStateContext } from './AppStateProvider';
import { AppEffects } from './AppEffects';
import { useAuthFlow } from '../../hooks/useAuthFlow';
import { useModals } from '../../hooks/useModals';
import { useUsageTracking } from '../../hooks/useUsageTracking';
import { useErrorHandling } from '../../hooks/useErrorHandling';
import { ConnectionStatus } from '../../services/types';
import { useChat } from '../../hooks/useChat';
import { useConnection } from '../../hooks/useConnection';
import { useTutorial } from '../../hooks/useTutorial';
import { canAccessDeveloperFeatures } from '../../config/developer';
import { ResponsiveContainer } from '../layout/ResponsiveComponents';

// Import components
import ErrorBoundary from '../ErrorBoundary';
import LoginSplashScreen from '../LoginSplashScreen';
import InitialSplashScreen from '../InitialSplashScreen';
import HowToUseSplashScreen from '../HowToUseSplashScreen';
import ProFeaturesSplashScreen from '../ProFeaturesSplashScreen';
import UpgradeSplashScreen from '../UpgradeSplashScreen';
import SplashScreen from '../SplashScreen';
import MainViewContainer from '../MainViewContainer';
import ConnectionModal from '../ConnectionModal';
import HandsFreeModal from '../HandsFreeModal';
import SettingsModal from '../SettingsModal';
import ConfirmationModal from '../ConfirmationModal';
import FeedbackModal from '../FeedbackModal';
import ContextMenu from '../ContextMenu';
import CreditModal from '../CreditModal';
import PWAInstallBanner from '../PWAInstallBanner';
import DailyCheckinBanner from '../DailyCheckinBanner';
import AchievementNotification from '../AchievementNotification';
import { PlayerProfileSetupModal } from '../PlayerProfileSetupModal';
import OtakuDiaryModal from '../OtakuDiaryModal';
import WishlistModal from '../WishlistModal';
import CachePerformanceDashboard from '../CachePerformanceDashboard';
import PolicyModal from '../PolicyModal';
import AboutPage from '../AboutPage';
import PrivacyPolicyPage from '../PrivacyPolicyPage';
import RefundPolicyPage from '../RefundPolicyPage';
import ContactUsModal from '../ContactUsModal';

const RefactoredApp: React.FC = () => {
  const { state } = useAppStateContext();
  const {
    view,
    onboardingStatus,
    activeSubView,
    isConnectionModalOpen,
    isHandsFreeModalOpen,
    isSettingsModalOpen,
    isCreditModalOpen,
    isOtakuDiaryModalOpen,
    isWishlistModalOpen,
    activeModal,
    showUpgradeScreen,
    showDailyCheckin,
    currentAchievement,
    contextMenu,
    feedbackModalState,
    chatInputValue,
    showProfileSetup,
    isFirstTime,
    usage,
    authState,
  } = state;

  // Custom hooks
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
  } = useChat(state.isHandsFreeMode);

  // Event handlers
  const handleScreenshotReceived = useCallback((screenshot: string) => {
    // Handle screenshot received from PC client
    console.log('Screenshot received from PC client');
  }, []);

  const {
    connect,
    disconnect,
    connectionCode,
    send,
    lastSuccessfulConnection,
    forceReconnect,
  } = useConnection(handleScreenshotReceived);

  const {
    isTutorialOpen,
    hasCompletedTutorial,
    shouldShowTutorial,
    openTutorial,
    closeTutorial,
    completeTutorial,
    skipTutorial,
  } = useTutorial();

  const {
    refreshUsage,
    loadUsageData,
    handleUpgrade,
    handleUpgradeToVanguard,
    canMakeQuery,
    recordQuery,
  } = useUsageTracking({ usage, setUsage: state.setUsage });

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
    setContextMenu: state.setContextMenu,
    setFeedbackModalState: state.setFeedbackModalState,
    setActiveModal: state.setActiveModal,
  });

  const {
    handleLogout,
    handleLogoutOnly,
    executeFullReset,
    handleResetApp,
    handleProfileSetupComplete,
    handleSkipProfileSetup,
  } = useAuthFlow({
    authState: state.authState,
    setAuthState: state.setAuthState,
    setOnboardingStatus: state.setOnboardingStatus,
    setView: state.setView,
    setIsHandsFreeMode: state.setIsHandsFreeMode,
    setIsConnectionModalOpen: state.setIsConnectionModalOpen,
    setShowProfileSetup: state.setShowProfileSetup,
    showConfirmation,
    send,
    disconnect,
    resetConversations,
    refreshUsage,
  });

  const {
    handleError,
    handleDatabaseError,
    handleNetworkError,
    handleAuthError,
    retryOperation,
    withErrorHandling,
  } = useErrorHandling({
    setDatabaseSyncStatus: state.setDatabaseSyncStatus,
    setLastDatabaseSync: state.setLastDatabaseSync,
  });

  const handleSendMessage = useCallback(async (text: string, images?: any[]) => {
    if (!text.trim() && (!images || images.length === 0)) return;
    
    try {
      // Check if user can make the query
      const canMakeTextQuery = await canMakeQuery('text', 1);
      const canMakeImageQuery = images && images.length > 0 ? await canMakeQuery('image', images.length) : true;
      
      if (!canMakeTextQuery || !canMakeImageQuery) {
        state.setShowUpgradeScreen(true);
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
  }, [canMakeQuery, recordQuery, sendMessage, state.setShowUpgradeScreen, handleError]);

  const handleStopMessage = useCallback((messageId: string) => {
    stopMessage(messageId);
  }, [stopMessage]);

  const handleUpgradeClick = useCallback(() => {
    state.setShowUpgradeScreen(true);
  }, [state.setShowUpgradeScreen]);

  const handleFeedbackSubmit = useCallback(async (feedbackText: string) => {
    if (!feedbackModalState) return;
    
    try {
      // Handle feedback submission
      console.log('Feedback submitted:', { feedbackText, feedbackModalState });
      closeFeedbackModal();
    } catch (error) {
      handleError(error as Error, 'feedbackSubmission');
    }
  }, [feedbackModalState, closeFeedbackModal, handleError]);

  const handleRetry = useCallback((messageId: string) => {
    // Handle retry logic
    console.log('Retrying message:', messageId);
  }, []);

  const handleSubViewChange = useCallback((subView: string) => {
    state.setActiveSubView(subView);
  }, [state.setActiveSubView]);

  const handleOpenWishlistModal = useCallback(() => {
    state.setIsWishlistModalOpen(true);
  }, [state.setIsWishlistModalOpen]);

  // Reset first run experience handler
  const handleResetFirstRunExperience = useCallback(() => {
    // Clear all onboarding and first-run flags
    localStorage.removeItem('otakon_profile_setup_completed');
    localStorage.removeItem('otakon_show_splash_after_login');
    localStorage.removeItem('otakon_onboarding_completed');
    localStorage.removeItem('otakon_first_run_completed');
    localStorage.removeItem('otakon_tutorial_completed');
    
    // Reset onboarding status to initial
    state.setOnboardingStatus('initial');
    
    // Show success message
    console.log('✅ First run experience reset successfully!');
  }, [state.setOnboardingStatus]);

  // Context menu action handlers
  const contextMenuHandlers = {
    onSettings: () => state.setIsSettingsModalOpen(true),
    onAbout: () => openModal('about'),
    onPrivacy: () => openModal('privacy'),
    onRefund: () => openModal('refund'),
    onContact: () => openModal('contact'),
    onCachePerformance: () => state.setIsCacheDashboardOpen(true),
    onResetFirstRun: handleResetFirstRunExperience,
    onLogout: handleLogout,
    onLogoutOnly: handleLogoutOnly,
    onReset: handleResetApp,
  };

  // Render splash screens based on onboarding status
  const renderSplashScreen = () => {
    switch (onboardingStatus) {
      case 'login':
        return (
          <LoginSplashScreen
            onComplete={() => state.setOnboardingStatus('initial')}
            onOpenPrivacy={() => openModal('privacy')}
            onOpenTerms={() => openModal('about')}
          />
        );
      case 'initial':
        return (
          <InitialSplashScreen
            onComplete={() => state.setOnboardingStatus('features')}
          />
        );
      case 'features':
        return (
          <HowToUseSplashScreen
            onComplete={() => state.setOnboardingStatus('pro-features')}
          />
        );
      case 'pro-features':
        return (
          <ProFeaturesSplashScreen
            onComplete={() => state.setOnboardingStatus('how-to-use')}
            onUpgrade={() => {}}
            onUpgradeToVanguard={() => {}}
          />
        );
      case 'how-to-use':
        return (
          <SplashScreen
            onComplete={() => state.setOnboardingStatus('tier-splash')}
            onSkipConnection={() => state.setOnboardingStatus('complete')}
            onConnect={() => {}}
            status={ConnectionStatus.DISCONNECTED}
            error={null}
            connectionCode={null}
            onConnectionSuccess={() => state.setOnboardingStatus('tier-splash')}
          />
        );
      case 'tier-splash':
        return (
          <UpgradeSplashScreen
            onUpgrade={() => {}}
            onUpgradeToVanguard={() => {}}
            onClose={() => state.setOnboardingStatus('complete')}
          />
        );
      default:
        return null;
    }
  };

  // Render modals based on activeModal
  const renderModal = () => {
    switch (activeModal) {
      case 'about':
        return <AboutPage />;
      case 'privacy':
        return <PrivacyPolicyPage />;
      case 'refund':
        return <RefundPolicyPage />;
      case 'contact':
        return <ContactUsModal isOpen={true} onClose={closeModal} />;
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#1A1A1A] text-white">
        {/* App Effects */}
        <AppEffects
          addSystemMessage={addSystemMessage}
          refreshUsage={refreshUsage}
          loadUsageData={loadUsageData}
        />

        {/* Main Content */}
        {view === 'landing' ? (
          renderSplashScreen()
        ) : (
          <ResponsiveContainer maxWidth="full" className="h-screen">
            <>
              {/* Main App View */}
              <MainViewContainer
                activeConversation={activeConversation!}
                activeSubView={activeSubView}
                onSubViewChange={handleSubViewChange}
                onSendMessage={handleSendMessage}
                stopMessage={handleStopMessage}
                isInputDisabled={isCooldownActive}
                messages={activeConversation?.messages || []}
                loadingMessages={loadingMessages}
                onUpgradeClick={handleUpgradeClick}
                onFeedback={handleFeedback}
                onRetry={handleRetry}
                isFirstTime={isFirstTime}
                onOpenWishlistModal={handleOpenWishlistModal}
              />

              {/* Modals */}
            {isConnectionModalOpen && (
              <ConnectionModal
                isOpen={isConnectionModalOpen}
                onClose={() => state.setIsConnectionModalOpen(false)}
                onConnect={connect}
                onDisconnect={disconnect}
                status={ConnectionStatus.DISCONNECTED}
                error={null}
                connectionCode={connectionCode}
                lastSuccessfulConnection={lastSuccessfulConnection ? new Date(lastSuccessfulConnection) : null}
                onShowHowToUse={() => state.setOnboardingStatus('how-to-use')}
              />
            )}

            {isHandsFreeModalOpen && (
              <HandsFreeModal
                onClose={() => state.setIsHandsFreeModalOpen(false)}
                isHandsFree={state.isHandsFreeMode}
                onToggleHandsFree={() => state.setIsHandsFreeMode(!state.isHandsFreeMode)}
              />
            )}

            {isSettingsModalOpen && (
              <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => state.setIsSettingsModalOpen(false)}
                usage={usage}
                onShowUpgrade={() => {}}
                onShowVanguardUpgrade={handleUpgradeToVanguard}
                onLogout={handleLogoutOnly}
                onResetApp={handleResetApp}
                onShowHowToUse={() => state.setOnboardingStatus('how-to-use')}
                userEmail={authState.user?.email || ''}
                onClearFirstRunCache={() => {}}
                refreshUsage={refreshUsage}
              />
            )}

            {isCreditModalOpen && (
              <CreditModal
                onClose={() => state.setIsCreditModalOpen(false)}
                usage={usage}
                onUpgrade={handleUpgrade}
              />
            )}

            {showProfileSetup && (
              <PlayerProfileSetupModal
                isOpen={showProfileSetup}
                onComplete={handleProfileSetupComplete}
                onSkip={handleSkipProfileSetup}
              />
            )}

            {isOtakuDiaryModalOpen && (
              <OtakuDiaryModal
                isOpen={isOtakuDiaryModalOpen}
                gameId=""
                gameTitle=""
                onClose={() => state.setIsOtakuDiaryModalOpen(false)}
              />
            )}

            {isWishlistModalOpen && (
              <WishlistModal
                isOpen={isWishlistModalOpen}
                onClose={() => state.setIsWishlistModalOpen(false)}
              />
            )}

            {state.isCacheDashboardOpen && (
              <CachePerformanceDashboard
                isOpen={state.isCacheDashboardOpen}
                onClose={() => state.setIsCacheDashboardOpen(false)}
              />
            )}

            {/* Context Menu */}
            {contextMenu && (
              <ContextMenu
                targetRect={contextMenu.targetRect}
                items={contextMenu.items}
                onClose={() => state.setContextMenu(null)}
              />
            )}

            {/* Confirmation Modal */}
            {confirmationModal && (
              <ConfirmationModal
                title={confirmationModal.title}
                message={confirmationModal.message}
                onConfirm={confirmationModal.onConfirm}
                onCancel={hideConfirmation}
              />
            )}

            {/* Feedback Modal */}
            {feedbackModalState && (
              <FeedbackModal
                onClose={closeFeedbackModal}
                onSubmit={handleFeedbackSubmit}
                originalText={feedbackModalState.originalText || ''}
              />
            )}

            {/* Other Modals */}
            {renderModal()}

            {/* Banners */}
            {showDailyCheckin && (
              <DailyCheckinBanner
                onClose={() => state.setShowDailyCheckin(false)}
              />
            )}

            {currentAchievement && (
              <AchievementNotification
                achievement={currentAchievement}
                onClose={() => state.setCurrentAchievement(null)}
              />
            )}

            {/* PWA Install Banner */}
            <PWAInstallBanner />
            </>
          </ResponsiveContainer>
        )}

        {/* Render page modals */}
        {renderModal()}
      </div>
    </ErrorBoundary>
  );
};

export default RefactoredApp;
