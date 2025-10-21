import React from 'react';
import { AuthState, AppState, ActiveModal, ConnectionStatus } from '../types';
import LandingPage from './LandingPage';
import LoginSplashScreen from './splash/LoginSplashScreen';
import InitialSplashScreen from './splash/InitialSplashScreen';
import HowToUseSplashScreen from './splash/HowToUseSplashScreen';
import ProFeaturesSplashScreen from './splash/ProFeaturesSplashScreen';
import PlayerProfileSetupModal from './splash/PlayerProfileSetupModal';
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
  handleOAuthError: (error: string) => void;
  handleLogout: () => void;
  confirmLogout: () => void;
  openModal: (modal: ActiveModal) => void;
  closeModal: () => void;
  handleOnboardingComplete: (step: string) => void;
  handleConnect: (code: string) => void;
  handleConnectionSuccess: () => void;
  handleDisconnect: () => void;
  handleSkipConnection: () => void;
  handleProfileSetupComplete: (profileData: any) => void;
  handleProfileSetupSkip: () => void;
  setSettingsOpen: (isOpen: boolean) => void;
  setShowLogoutConfirm: (isOpen: boolean) => void;
  mainAppMessageHandlerRef: React.MutableRefObject<((data: any) => void) | null>;
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
  handleSkipConnection,
  handleProfileSetupComplete,
  handleProfileSetupSkip,
  setSettingsOpen,
  setShowLogoutConfirm,
  mainAppMessageHandlerRef,
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
    return (
      <>
        <LandingPage
          onGetStarted={handleGetStarted}
          onOpenAbout={() => openModal('about')}
          onOpenPrivacy={() => openModal('privacy')}
          onOpenRefund={() => openModal('refund')}
          onOpenTerms={() => openModal('terms')}
          onDirectNavigation={(path) => console.log('Direct navigation to:', path)}
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
    if (appState.onboardingStatus === 'initial') {
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
              await onboardingService.updateOnboardingStatus(authState.user.authUserId, 'features-connected', {
                has_seen_features_connected: true,
              });
              await authService.refreshUser();
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
              await onboardingService.updateOnboardingStatus(authState.user.authUserId, 'pro-features', {
                has_seen_pro_features: true,
                onboarding_completed: true,
              });
              await authService.refreshUser();
            }
            handleOnboardingComplete('pro-features');
          }}
          onUpgrade={() => console.log('Upgrade clicked')}
          onUpgradeToVanguard={() => console.log('Upgrade to Vanguard clicked')}
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
            onWebSocketMessage={(handler) => {
              mainAppMessageHandlerRef.current = handler;
            }}
          />
          {authState.user && !authState.user.hasProfileSetup && (
            <PlayerProfileSetupModal
              isOpen={true}
              onComplete={handleProfileSetupComplete}
              onSkip={handleProfileSetupSkip}
            />
          )}
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
