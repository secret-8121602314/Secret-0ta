import React from 'react';
import { AuthState, AppState, ActiveModal, ConnectionStatus } from '../types';
import LandingPage from './LandingPageFresh';
import LoginSplashScreen from './splash/LoginSplashScreen';
import InitialSplashScreen from './splash/InitialSplashScreen';
import HowToUseSplashScreen from './splash/HowToUseSplashScreen';
import ProFeaturesSplashScreen from './splash/ProFeaturesSplashScreen';
import SplashScreen from './splash/SplashScreen';
import MainApp from './MainApp';
import AuthCallback from './auth/AuthCallback';
import AboutModal from './modals/AboutModal';
import PrivacyModal from './modals/PrivacyModal';
import TermsModal from './modals/TermsModal';
import RefundPolicyModal from './modals/RefundPolicyModal';
import ContactUsModal from './modals/ContactUsModal';
import SettingsModal from './modals/SettingsModal';
import { authService } from '../services/authService';
import { onboardingService } from '../services/onboardingService';

interface AppRouterProps {
  appState: AppState;
  authState: AuthState;
  activeModal: ActiveModal;
  settingsOpen: boolean;
  showLogoutConfirm: boolean;
  isInitializing: boolean;
  hasEverLoggedIn: boolean;
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
  handleGetStarted: () => void;
  handleLoginComplete: () => void;
  handleBackToLanding: () => void;
  handleOAuthSuccess: () => void;
  handleOAuthError: (_error: string) => void;
  handleLogout: () => void;
  confirmLogout: () => void;
  openModal: (_modal: ActiveModal) => void;
  closeModal: () => void;
  handleOnboardingComplete: (_step: string) => void;
  handleConnect: (_code: string) => void;
  handleConnectionSuccess: () => void;
  handleDisconnect: () => void;
  handleClearConnectionError: () => void;
  handleSkipConnection: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleProfileSetupComplete: (_profileData: any) => void;
  handleProfileSetupSkip: () => void;
  setSettingsOpen: (_isOpen: boolean) => void;
  setShowLogoutConfirm: (_isOpen: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mainAppMessageHandlerRef: React.MutableRefObject<((_data: any) => void) | null>;
  isManualNavigationRef: React.MutableRefObject<boolean>;
}

const AppRouter: React.FC<AppRouterProps> = ({
  appState,
  authState,
  activeModal,
  settingsOpen,
  showLogoutConfirm,
  isInitializing,
  hasEverLoggedIn,
  connectionStatus,
  connectionError,
  handleGetStarted,
  handleLoginComplete,
  handleBackToLanding,
  handleOAuthSuccess,
  handleOAuthError,
  handleLogout,
  confirmLogout,
  openModal,
  closeModal,
  handleOnboardingComplete,
  handleConnect,
  handleConnectionSuccess,
  handleDisconnect,
  handleClearConnectionError,
  handleSkipConnection,
  handleProfileSetupComplete,
  handleProfileSetupSkip,
  setSettingsOpen,
  setShowLogoutConfirm,
  mainAppMessageHandlerRef,
  isManualNavigationRef,
}) => {
  if (window.location.pathname === '/auth/callback') {
    return (
      <AuthCallback
        onAuthSuccess={handleOAuthSuccess}
        onAuthError={handleOAuthError}
      />
    );
  }

  const shouldShowLoading = (isInitializing || authState.isLoading) &&
    !(appState.view === 'landing' && !hasEverLoggedIn);

  console.log('🔵 AppRouter:', { 
    view: appState.view, 
    onboardingStatus: appState.onboardingStatus,
    hasUser: !!authState.user,
    isInitializing,
    isLoading: authState.isLoading,
    shouldShowLoading,
    shouldShowLanding: appState.view === 'landing' && !authState.user
  });

  if (shouldShowLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-[#111111] to-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4D4D] mx-auto mb-4"></div>
          <p className="text-[#CFCFCF] text-lg">Loading Otagon...</p>
        </div>
      </div>
    );
  }

  if (appState.view === 'landing' && !authState.user) {
    console.log('🟢 RENDERING LANDINGPAGE NOW!');
    console.log('⚠️⚠️⚠️ ABOUT TO RENDER LANDINGPAGE COMPONENT ⚠️⚠️⚠️');
    console.log('⚠️ LandingPage import:', LandingPage);
    console.log('⚠️ LandingPage type:', typeof LandingPage);
    return (
      <>
        <LandingPage
          onGetStarted={handleGetStarted}
          onOpenAbout={() => openModal('about')}
          onOpenPrivacy={() => openModal('privacy')}
          onOpenRefund={() => openModal('refund')}
          onOpenTerms={() => openModal('terms')}
          onDirectNavigation={() => {
            // Direct navigation handler for landing page links
          }}
        />
        <AboutModal isOpen={activeModal === 'about'} onClose={closeModal} />
        <PrivacyModal isOpen={activeModal === 'privacy'} onClose={closeModal} />
        <TermsModal isOpen={activeModal === 'terms'} onClose={closeModal} />
        <RefundPolicyModal isOpen={activeModal === 'refund'} onClose={closeModal} />
        <ContactUsModal isOpen={activeModal === 'contact'} onClose={closeModal} />
      </>
    );
  }

  if (appState.onboardingStatus === 'login') {
    return (
      <LoginSplashScreen
        onComplete={handleLoginComplete}
        onBackToLanding={handleBackToLanding}
        onSetAppState={() => {}}
      />
    );
  }

  if (appState.onboardingStatus === 'loading') {
    return (
      <div className="h-screen bg-gradient-to-br from-[#111111] to-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4D4D] mx-auto mb-4"></div>
          <p className="text-[#CFCFCF] text-lg">Signing you in...</p>
        </div>
      </div>
    );
  }

  if (authState.user && appState.view === 'app') {
    if (appState.onboardingStatus === 'initial' && !isInitializing) {
      return <InitialSplashScreen onComplete={() => handleOnboardingComplete('initial')} user={authState.user} />;
    }

    if (appState.onboardingStatus === 'how-to-use') {
      return (
        <SplashScreen
          onSkipConnection={handleSkipConnection}
          onConnect={handleConnect}
          status={connectionStatus}
          error={connectionError}
          connectionCode={null}
          onConnectionSuccess={handleConnectionSuccess}
        />
      );
    }

    if (appState.onboardingStatus === 'features-connected') {
      return (
        <HowToUseSplashScreen
          onComplete={async () => {
            if (authState.user) {
              try {
                await onboardingService.updateOnboardingStatus(authState.user.authUserId, 'features-connected', {
                  has_seen_features_connected: true,
                });
                // Prevent auth subscription from overriding navigation
                isManualNavigationRef.current = true;
                await authService.refreshUser();
              } catch (error) {
                console.error('🎯 [AppRouter] Error updating features-connected status:', error);
                isManualNavigationRef.current = false;
              }
            }
            handleOnboardingComplete('features-connected');
          }}
        />
      );
    }

    if (appState.onboardingStatus === 'pro-features') {
      return (
        <ProFeaturesSplashScreen
          onComplete={async () => {
            if (authState.user) {
              try {
                await onboardingService.updateOnboardingStatus(authState.user.authUserId, 'pro-features', {
                  has_seen_pro_features: true,
                  onboarding_completed: true,
                });
                // Prevent auth subscription from overriding navigation
                isManualNavigationRef.current = true;
                await authService.refreshUser();
              } catch (error) {
                console.error('🎯 [AppRouter] Error updating pro-features status:', error);
                isManualNavigationRef.current = false;
              }
            }
            handleOnboardingComplete('pro-features');
          }}
          onUpgrade={() => {
            // Upgrade functionality coming soon
          }}
          onUpgradeToVanguard={() => {
            // Vanguard upgrade functionality coming soon
          }}
        />
      );
    }

    if (appState.onboardingStatus === 'complete') {
      return (
        <>
          <MainApp
            onLogout={handleLogout}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenAbout={() => openModal('about')}
            onOpenPrivacy={() => openModal('privacy')}
            onOpenRefund={() => openModal('refund')}
            onOpenContact={() => openModal('contact')}
            onOpenTerms={() => openModal('terms')}
            connectionStatus={connectionStatus}
            connectionError={connectionError}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onClearConnectionError={handleClearConnectionError}
            onWebSocketMessage={(handler) => {
              mainAppMessageHandlerRef.current = handler;
            }}
            showProfileSetupBanner={authState.user ? !authState.user.hasProfileSetup : false}
            onProfileSetupComplete={handleProfileSetupComplete}
            onProfileSetupDismiss={handleProfileSetupSkip}
          />
          <AboutModal isOpen={activeModal === 'about'} onClose={closeModal} />
          <PrivacyModal isOpen={activeModal === 'privacy'} onClose={closeModal} />
          <TermsModal isOpen={activeModal === 'terms'} onClose={closeModal} />
          <RefundPolicyModal isOpen={activeModal === 'refund'} onClose={closeModal} />
          <ContactUsModal isOpen={activeModal === 'contact'} onClose={closeModal} />
          <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} user={authState.user} />
          {showLogoutConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-surface border border-surface-light/20 rounded-xl p-6 max-w-md mx-4">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Confirm Logout</h3>
                <p className="text-text-secondary mb-6">
                  Are you sure you want to sign out? You'll need to log in again to access your account.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 px-4 py-2 text-text-muted hover:text-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      );
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-background via-[#0F0F0F] to-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-text-muted">Something went wrong. Please refresh the page.</p>
      </div>
    </div>
  );
};

export default AppRouter;
