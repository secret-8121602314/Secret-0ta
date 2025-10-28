import { useState, useEffect, useRef } from 'react';
import { AuthState, ConnectionStatus, AppState, ActiveModal } from './types';
import { authService } from './services/authService';
import { onboardingService } from './services/onboardingService';
import { connect, disconnect } from './services/websocketService';
import { supabase } from './lib/supabase';
import AppRouter from './components/AppRouter';
import { ToastContainer } from './components/ui/ToastContainer';

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });
  const [hasEverLoggedIn, setHasEverLoggedIn] = useState(false);
  const [appState, setAppState] = useState<AppState>({
    view: 'landing',
    onboardingStatus: 'initial',
    activeSubView: 'chat',
    isConnectionModalOpen: false,
    isHandsFreeModalOpen: false,
    isSettingsModalOpen: false,
    isCreditModalOpen: false,
    isOtakuDiaryModalOpen: false,
    isWishlistModalOpen: false,
    activeModal: null,
    isHandsFreeMode: false,
    showUpgradeScreen: false,
    showDailyCheckin: false,
    currentAchievement: null,
    loadingMessages: [],
    isCooldownActive: false,
    isFirstTime: true,
    contextMenu: null,
    feedbackModalState: null,
    confirmationModal: null,
    trialEligibility: null,
  });
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const mainAppMessageHandlerRef = useRef<((_data: any) => void) | null>(null);
  const authSubscriptionRef = useRef<(() => void) | null>(null);
  const isProcessingAuthRef = useRef(false);
  const isManualNavigationRef = useRef(false); // Track manual onboarding navigation

  useEffect(() => {
    console.log('🎯 [App] App state changed:', {
      view: appState.view,
      onboardingStatus: appState.onboardingStatus,
      hasUser: !!authState.user,
      userEmail: authState.user?.email
    });
  }, [appState.view, appState.onboardingStatus, authState.user]);

  useEffect(() => {
    if (authState.user && !authState.isLoading) {
      const updateAppState = async () => {
        try {
          const { error } = await supabase
            .from('users')
            .update({
              app_state: {
                view: appState.view,
                onboardingStatus: appState.onboardingStatus,
                activeSubView: appState.activeSubView,
                isHandsFreeMode: appState.isHandsFreeMode,
                showUpgradeScreen: appState.showUpgradeScreen,
                showDailyCheckin: appState.showDailyCheckin,
                isFirstTime: appState.isFirstTime,
                lastActivity: Date.now()
              }
            })
            .eq('auth_user_id', authState.user!.authUserId);
          if (error) {
            console.error('Failed to update app state in Supabase:', error);
          }
        } catch (error) {
          console.error('Error updating app state:', error);
        }
      };
      updateAppState();
    }
  }, [appState.view, appState.onboardingStatus, appState.activeSubView, appState.isHandsFreeMode, appState.showUpgradeScreen, appState.showDailyCheckin, appState.isFirstTime, authState.user]);

  useEffect(() => {
    let isMounted = true;
    const processAuthState = async (newAuthState: AuthState) => {
      if (isProcessingAuthRef.current || newAuthState.isLoading) {
        return;
      }
      
      // Skip auto-navigation if we're manually navigating through onboarding
      if (isManualNavigationRef.current) {
        console.log('🎯 [App] Skipping auto-navigation due to manual navigation flag');
        isManualNavigationRef.current = false; // Reset the flag
        return;
      }
      
      isProcessingAuthRef.current = true;
      console.log('🎯 [App] Processing auth state:', {
        hasUser: !!newAuthState.user,
        userEmail: newAuthState.user?.email,
        onboardingCompleted: newAuthState.user?.onboardingCompleted
      });
      try {
        if (newAuthState.user) {
          setHasEverLoggedIn(true);
          const savedAppState = newAuthState.user.appState || {};
          const nextStep = await onboardingService.getNextOnboardingStep(newAuthState.user.authUserId);
          console.log('🎯 [App] Next onboarding step:', nextStep);
          
          // Returning users: Skip onboarding if they've completed it before
          // This ensures users go straight to chat on login/refresh
          const isReturningUser = nextStep === 'complete';
          
          if (isMounted) {
            if (isReturningUser) {
              // Returning user - skip all onboarding, go to main app
              console.log('🎯 [App] Returning user detected - skipping onboarding');
              setAppState((prev: AppState) => ({
                ...prev,
                ...savedAppState,
                view: 'app',
                onboardingStatus: 'complete',
              }));
            } else {
              // New user or incomplete onboarding - continue onboarding flow
              console.log('🎯 [App] New user or incomplete onboarding - continuing from:', nextStep);
              setAppState((prev: AppState) => ({
                ...prev,
                ...savedAppState,
                view: 'app',
                onboardingStatus: nextStep,
              }));
            }
            setIsInitializing(false);
          }
        } else {
          if (isMounted) {
            setAppState((prev: AppState) => ({
              ...prev,
              view: hasEverLoggedIn ? 'app' : 'landing',
              onboardingStatus: 'login'
            }));
            setIsInitializing(false);
          }
        }
      } catch (error) {
        console.error('🎯 [App] Error during auth processing:', error);
        if (isMounted) {
          setIsInitializing(false);
        }
      } finally {
        isProcessingAuthRef.current = false;
      }
    };
    const unsubscribe = authService.subscribe((newAuthState) => {
      setAuthState(newAuthState);
      if (isMounted && !newAuthState.isLoading) {
        processAuthState(newAuthState);
      }
    });
    authSubscriptionRef.current = unsubscribe;
    return () => {
      isMounted = false;
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current();
      }
    };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isInitializing) {
        setIsInitializing(false);
      }
    }, 10000);
    return () => clearTimeout(timeout);
  }, [isInitializing]);

  useEffect(() => {
    if (window.location.pathname === '/auth/callback') {
      // The AuthCallback component will handle the authentication
    }
  }, []);

  const handleGetStarted = () => {
    setAppState((prev: AppState) => ({ ...prev, view: 'app', onboardingStatus: 'login' }));
  };

  const handleLoginComplete = async () => {
    console.log('🎯 [App] Email login completed, setting view to app');
    setAppState((prev: AppState) => {
      const newState: AppState = { ...prev, view: 'app', onboardingStatus: 'loading' };
      console.log('🎯 [App] Setting view to app with loading status:', newState);
      return newState;
    });
  };

  const handleBackToLanding = () => {
    console.log('🔙 [App] Back to landing clicked, resetting to landing page');
    setAppState((prev: AppState) => ({
      ...prev,
      view: 'landing',
      onboardingStatus: 'initial'
    }));
  };

  const handleOAuthSuccess = () => {
    window.history.replaceState({}, document.title, '/');
    setAppState((prev: AppState) => ({ ...prev, view: 'app' }));
  };

  const handleOAuthError = (error: string) => {
    console.error('🔐 [App] OAuth authentication error:', error);
    setAppState((prev: AppState) => ({ ...prev, view: 'landing' }));
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    console.log('🎯 [App] Starting logout process...');
    setShowLogoutConfirm(false);
    
    // Preserve welcome screen flag (user has seen it once, don't show again)
    const welcomeShown = localStorage.getItem('otakon_welcome_shown');
    
    // Sign out (clears Supabase session and localStorage)
    await authService.signOut();
    
    // Restore welcome screen flag after signOut cleared localStorage
    if (welcomeShown) {
      localStorage.setItem('otakon_welcome_shown', welcomeShown);
    }
    
    setAppState((prev: AppState) => ({
      ...prev,
      view: 'app', // Set to app view so landing page check doesn't trigger
      onboardingStatus: 'login' // This will show login screen
    }));
    setAuthState({ user: null, isLoading: false, error: null });
    isProcessingAuthRef.current = false;
    console.log('🎯 [App] Logout completed, showing login screen');
  };

  const openModal = (modal: ActiveModal) => {
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const handleOnboardingComplete = async (step: string) => {
    console.log('🎯 [App] Onboarding step completed:', step);
    if (authState.user) {
      const nextStep = await onboardingService.getNextOnboardingStep(authState.user.authUserId);
      setAppState((prev: AppState) => ({
        ...prev,
        onboardingStatus: nextStep
      }));
      onboardingService.updateOnboardingStatus(authState.user.authUserId, step as any)
        .catch(error => console.error('🎯 [App] Error updating onboarding status:', error));
    }
  };

  const handleConnect = (code: string) => {
    console.log('🔗 [App] Connecting with code:', code);
    setConnectionError(null);
    setConnectionStatus(ConnectionStatus.CONNECTING);
    connect(
      code,
      () => {
        console.log('🔗 [App] Connection opened');
        setConnectionStatus(ConnectionStatus.CONNECTED);
      },
      (data) => {
        console.log('🔗 [App] Message received:', data);
        handleWebSocketMessage(data);
      },
      (error) => {
        console.error('🔗 [App] Connection error:', error);
        setConnectionError(error);
        setConnectionStatus(ConnectionStatus.ERROR);
      },
      () => {
        console.log('🔗 [App] Connection closed');
        setConnectionStatus(ConnectionStatus.DISCONNECTED);
      }
    );
  };

  const handleConnectionSuccess = async () => {
    console.log('🔗 [App] Connection success callback triggered');
    setConnectionStatus(ConnectionStatus.CONNECTED);
    setConnectionError(null);
    if (authState.user) {
      try {
        // Wait for the database update to complete
        await onboardingService.updateOnboardingStatus(authState.user.authUserId, 'how-to-use', {
          has_seen_how_to_use: true,
          pc_connected: true,
          pc_connection_skipped: false
        });
        console.log('🔗 [App] Database updated successfully');
        
        // Set flag to prevent auth subscription from overriding navigation
        isManualNavigationRef.current = true;
        
        // Then refresh user data from database
        await authService.refreshUser();
        console.log('🔗 [App] User data refreshed');
        
        // Finally, navigate to the next screen
        console.log('🔗 [App] Navigating to features-connected splash screen after connection success');
        setAppState((prev: AppState) => ({
          ...prev,
          onboardingStatus: 'features-connected'
        }));
      } catch (error) {
        console.error('🔗 [App] Failed to update onboarding status:', error);
        isManualNavigationRef.current = false; // Reset flag on error
      }
    }
  };

  const handleDisconnect = () => {
    console.log('🔗 [App] Disconnecting...');
    disconnect();
    setConnectionStatus(ConnectionStatus.DISCONNECTED);
    setConnectionError(null);
  };

  const handleWebSocketMessage = (data: any) => {
    console.log('🔗 [App] Processing WebSocket message:', data);
    if (data.type === 'screenshot_batch') {
      console.log("📸 Processing screenshot batch:", data);
      const batchData = data.payload || data;
      if (batchData.images && batchData.images.length > 0) {
        batchData.images.forEach((imgSrc: string, index: number) => {
          const properDataUrl = imgSrc.startsWith('data:') ? imgSrc : `data:image/png;base64,${imgSrc}`;
          if (mainAppMessageHandlerRef.current) {
            mainAppMessageHandlerRef.current({
              type: 'screenshot',
              dataUrl: properDataUrl,
              index: index
            });
          }
        });
      }
    } else if (data.type === 'screenshot_success' && data.success?.dataUrl) {
      console.log("📸 Processing individual screenshot:", data);
      const properDataUrl = data.success.dataUrl.startsWith('data:')
        ? data.success.dataUrl
        : `data:image/png;base64,${data.success.dataUrl}`;
      if (mainAppMessageHandlerRef.current) {
        mainAppMessageHandlerRef.current({
          type: 'screenshot',
          dataUrl: properDataUrl
        });
      }
    }
  };

  const handleSkipConnection = async () => {
    console.log('🔗 [App] Skipping PC connection, going to pro-features');
    if (authState.user) {
      try {
        // Wait for the database update to complete
        await onboardingService.updateOnboardingStatus(authState.user.authUserId, 'how-to-use', {
          has_seen_how_to_use: true,
          pc_connected: false,
          pc_connection_skipped: true
        });
        console.log('🔗 [App] Database updated successfully (skipped)');
        
        // Set flag to prevent auth subscription from overriding navigation
        isManualNavigationRef.current = true;
        
        // Then refresh user data from database
        await authService.refreshUser();
        console.log('🔗 [App] User data refreshed');
        
        // Finally, navigate to the next screen
        setAppState((prev: AppState) => ({
          ...prev,
          onboardingStatus: 'pro-features'
        }));
      } catch (error) {
        console.error('🔗 [App] Failed to update onboarding status:', error);
        isManualNavigationRef.current = false; // Reset flag on error
      }
    }
  };

  const handleProfileSetupComplete = async (profileData: any) => {
    console.log('🎯 [App] Profile setup completed');
    if (authState.user) {
      try {
        // Use 'profile-setup' step to properly set has_profile_setup flag
        await onboardingService.updateOnboardingStatus(authState.user.authUserId, 'profile-setup', profileData);
        console.log('🎯 [App] Profile setup data saved');
        
        // Set flag to prevent auth subscription from overriding
        isManualNavigationRef.current = true;
        
        // Refresh user data to update hasProfileSetup flag
        await authService.refreshUser();
        console.log('🎯 [App] User data refreshed after profile setup');
      } catch (error) {
        console.error('🎯 [App] Failed to save profile setup:', error);
        isManualNavigationRef.current = false;
      }
    }
  };

  const handleProfileSetupSkip = async () => {
    console.log('🎯 [App] Profile setup skipped');
    if (authState.user) {
      try {
        // Use 'profile-setup' step to properly set has_profile_setup flag
        await onboardingService.updateOnboardingStatus(authState.user.authUserId, 'profile-setup', {
          profile_setup_skipped: true
        });
        console.log('🎯 [App] Profile setup skipped, flag saved');
        
        // Set flag to prevent auth subscription from overriding
        isManualNavigationRef.current = true;
        
        // Refresh user data to update hasProfileSetup flag
        await authService.refreshUser();
        console.log('🎯 [App] User data refreshed after skipping profile setup');
      } catch (error) {
        console.error('🎯 [App] Failed to skip profile setup:', error);
        isManualNavigationRef.current = false;
      }
    }
  };

  return (
    <>
      <AppRouter
        appState={appState}
        authState={authState}
        activeModal={activeModal}
        settingsOpen={settingsOpen}
        showLogoutConfirm={showLogoutConfirm}
        isInitializing={isInitializing}
        hasEverLoggedIn={hasEverLoggedIn}
        connectionStatus={connectionStatus}
        connectionError={connectionError}
        handleGetStarted={handleGetStarted}
        handleLoginComplete={handleLoginComplete}
        handleBackToLanding={handleBackToLanding}
        handleOAuthSuccess={handleOAuthSuccess}
        handleOAuthError={handleOAuthError}
        handleLogout={handleLogout}
        confirmLogout={confirmLogout}
        openModal={openModal}
        closeModal={closeModal}
        handleOnboardingComplete={handleOnboardingComplete}
        handleConnect={handleConnect}
        handleConnectionSuccess={handleConnectionSuccess}
        handleDisconnect={handleDisconnect}
        handleSkipConnection={handleSkipConnection}
        handleProfileSetupComplete={handleProfileSetupComplete}
        handleProfileSetupSkip={handleProfileSetupSkip}
        setSettingsOpen={setSettingsOpen}
        setShowLogoutConfirm={setShowLogoutConfirm}
        mainAppMessageHandlerRef={mainAppMessageHandlerRef}
        isManualNavigationRef={isManualNavigationRef}
      />
      <ToastContainer />
    </>
  );
}

export default App;
