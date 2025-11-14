import { useState, useEffect, useRef } from 'react';
import { AuthState, ConnectionStatus, AppState, ActiveModal } from './types';
import { authService } from './services/authService';
import { onboardingService } from './services/onboardingService';
import { connect, disconnect } from './services/websocketService';
import { supabase } from './lib/supabase';
import AppRouter from './components/AppRouter';
import { ToastContainer } from './components/ui/ToastContainer';
import { SessionManager } from './utils/sessionManager';

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });
  const [hasEverLoggedIn, setHasEverLoggedIn] = useState(false);
  const [appState, setAppState] = useState<AppState>({
    view: 'landing', // Will be updated once auth state is checked
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
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(() => {
    // Restore connection status if we have a stored code
    const storedCode = localStorage.getItem('otakon_connection_code');
    return storedCode ? ConnectionStatus.CONNECTING : ConnectionStatus.DISCONNECTED;
  });
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const mainAppMessageHandlerRef = useRef<((_data: any) => void) | null>(null);
  const authSubscriptionRef = useRef<(() => void) | null>(null);
  const isProcessingAuthRef = useRef(false);
  const isManualNavigationRef = useRef(false); // Track manual onboarding navigation
  const lastHotkeyRequestTimestamp = useRef<number>(0); // Track last hotkey screenshot request to prevent duplicates
  const hasReceivedPCMessage = useRef<boolean>(false); // Track if we've received any message from PC client
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Timeout for connection verification
  const sessionManagerRef = useRef<SessionManager | null>(null); // Cross-tab session manager

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

  // 🛡️ SESSION PROTECTION: Prevent OAuth overwrites when PWA gains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && window.location.pathname.includes('/auth/callback')) {
        console.log('⚠️ [App] Detected OAuth callback while app was in background');
        
        // Check if we're already logged in
        const currentUser = authService.getCurrentUser();
        if (currentUser && !isProcessingAuthRef.current) {
          console.log('🔐 [App] Already logged in, preventing OAuth overwrite:', currentUser.email);
          
          // Clear OAuth params from URL without processing
          const basePath = window.location.hostname === 'localhost' ? '/' : '/Otagon/';
          window.history.replaceState({}, document.title, basePath);
          
          // Show notification
          import('./services/toastService').then(({ toastService }) => {
            toastService.info('You\'re already logged in. OAuth login prevented.');
          }).catch(err => console.error('Failed to show toast:', err));
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [authState.user]);

  // 📱 SESSION MANAGER: Initialize cross-tab session conflict detection
  useEffect(() => {
    const handleSessionConflict = (instances: any[]) => {
      const currentUserId = authService.getCurrentUser()?.authUserId;
      const conflictingInstances = instances.filter(
        i => i.userId && currentUserId && i.userId !== currentUserId
      );
      
      if (conflictingInstances.length > 0) {
        import('./services/toastService').then(({ toastService }) => {
          toastService.warning(
            `Multiple users detected. You're logged in as ${authService.getCurrentUser()?.email} but another instance has a different user.`,
            { duration: 5000 }
          );
        }).catch(err => console.error('Failed to show toast:', err));
      }
    };

    sessionManagerRef.current = new SessionManager(handleSessionConflict);

    return () => {
      if (sessionManagerRef.current) {
        sessionManagerRef.current.unregisterInstance();
      }
    };
  }, []);

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
            // Check if running as PWA (standalone mode)
            const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
            
            // If PWA, always show login page instead of landing page
            setAppState((prev: AppState) => ({
              ...prev,
              view: (hasEverLoggedIn || isPWA) ? 'app' : 'landing',
              onboardingStatus: (hasEverLoggedIn || isPWA) ? 'login' : 'initial'
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
    const isAuthCallback = window.location.pathname === '/auth/callback' || 
                           window.location.pathname === '/Otagon/auth/callback';
    if (isAuthCallback) {
      // The AuthCallback component will handle the authentication
    }
  }, []);

  // Restore WebSocket connection on page load if there's a stored code
  useEffect(() => {
    const storedCode = localStorage.getItem('otakon_connection_code');
    if (storedCode && connectionStatus === ConnectionStatus.CONNECTING) {
      // Set up a timeout to verify the connection
      const timeout = setTimeout(() => {
        if (connectionStatus === ConnectionStatus.CONNECTING) {
          // If still connecting after 3 seconds, consider it connected
          // The websocket service will handle the actual connection state
          setConnectionStatus(ConnectionStatus.CONNECTED);
        }
      }, 3000);
      
      return () => clearTimeout(timeout);
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
    // Use the correct base path for both dev and production
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const basePath = isDev ? '/' : '/Otagon/';
    window.history.replaceState({}, document.title, basePath);
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
      
      // 🔧 FIX: If onboarding is complete, set the flag BEFORE MainApp renders
      // This ensures Game Hub is properly activated for first-time users
      if (nextStep === 'complete') {
        console.log('🎯 [App] Onboarding fully complete - setting first-run flag');
        localStorage.setItem('otakon_has_used_app', 'true');
      }
      
      setAppState((prev: AppState) => ({
        ...prev,
        onboardingStatus: nextStep
      }));
      onboardingService.updateOnboardingStatus(authState.user.authUserId, step as any)
        .catch(error => console.error('🎯 [App] Error updating onboarding status:', error));
    }
  };

  const handleConnect = async (code: string) => {
    console.log('🔗 [App] Connecting with code:', code);
12345
    
    // Disconnect any existing connection first
    if (connectionStatus === ConnectionStatus.CONNECTED || connectionStatus === ConnectionStatus.CONNECTING) {
      console.log('🔗 [App] Disconnecting existing connection before reconnecting');
      disconnect();
      // Wait briefly for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setConnectionError(null);
    setConnectionStatus(ConnectionStatus.CONNECTING);
    hasReceivedPCMessage.current = false; // Reset flag
    
    // Clear any existing timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    // Set timeout: if we don't receive a message from PC client within 5 seconds, show error
    connectionTimeoutRef.current = setTimeout(() => {
      if (!hasReceivedPCMessage.current) {
        console.error('🔗 [App] Connection timeout - no response from PC client within 5 seconds');
        setConnectionError('No PC client found on this code. Please check the 6-digit code and ensure the PC client is running.');
        setConnectionStatus(ConnectionStatus.ERROR);
      }
    }, 5000);
    
    connect(
      code,
      () => {
        // WebSocket opened - but DON'T set as connected yet
        // Wait for actual message from PC client
        console.log('🔗 [App] WebSocket connection opened, waiting for PC client response...');
        console.log('🔗 [App] hasReceivedPCMessage:', hasReceivedPCMessage.current);
        console.log('🔗 [App] Timeout will fire in 5 seconds if no message received');
      },
      (data) => {
        console.log('🔗 [App] Message received:', data);
        console.log('🔗 [App] hasReceivedPCMessage before:', hasReceivedPCMessage.current);
        
        // First message from PC client confirms the connection is real
        if (!hasReceivedPCMessage.current) {
          hasReceivedPCMessage.current = true;
          console.log('🔗 [App] hasReceivedPCMessage set to:', hasReceivedPCMessage.current);
          setConnectionStatus(ConnectionStatus.CONNECTED);
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
            console.log('🔗 [App] Timeout cleared successfully');
          }
          console.log('🔗 [App] ✅ PC client confirmed - connection established');
        }
        
        handleWebSocketMessage(data);
      },
      (error) => {
        console.error('🔗 [App] Connection error:', error);
        setConnectionError(error);
        setConnectionStatus(ConnectionStatus.ERROR);
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
      },
      () => {
        console.log('🔗 [App] Connection closed');
        setConnectionStatus(ConnectionStatus.DISCONNECTED);
        hasReceivedPCMessage.current = false;
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
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

  const handleClearConnectionError = () => {
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
    } else if (data.type === 'screenshot_success') {
      console.log("📸 [App] Screenshot success message received:", data);
      console.log("📸 [App] Success object:", data.success);
      console.log("📸 [App] Has dataUrl?", !!data.success?.dataUrl);
      console.log("📸 [App] Success keys:", data.success ? Object.keys(data.success) : 'no success object');
      console.log("📸 [App] Details object:", data.success?.details);
      console.log("📸 [App] Details keys:", data.success?.details ? Object.keys(data.success.details) : 'no details');
      
      // Check if dataUrl is in the details object
      const dataUrl = data.success?.dataUrl || data.success?.details?.dataUrl;
      
      if (dataUrl) {
        console.log("📸 [App] Processing individual screenshot with dataUrl");
        const properDataUrl = dataUrl.startsWith('data:')
          ? dataUrl
          : `data:image/png;base64,${dataUrl}`;
        if (mainAppMessageHandlerRef.current) {
          console.log("📸 [App] Forwarding to MainApp via ref");
          mainAppMessageHandlerRef.current({
            type: 'screenshot',
            dataUrl: properDataUrl
          });
        } else {
          console.warn("📸 [App] mainAppMessageHandlerRef.current is null!");
        }
      } else if (data.success?.details?.addedToBuffer) {
        // Screenshot was added to buffer by F1/F2 hotkey
        // Only send screenshot_request if we haven't sent one in the last 2 seconds (prevent feedback loop)
        const now = Date.now();
        const timeSinceLastRequest = now - lastHotkeyRequestTimestamp.current;
        
        if (timeSinceLastRequest > 2000) {
          console.log("📸 [App] Screenshot buffered by hotkey, sending screenshot_request to trigger batch send");
          lastHotkeyRequestTimestamp.current = now;
          
          import('./services/websocketService').then(({ send }) => {
            send({
              type: 'screenshot_request',
              mode: data.success.mode || 'single',
              processImmediate: true,
              triggeredByHotkey: true
            });
          });
        } else {
          console.log("📸 [App] Ignoring duplicate screenshot_success (within 2s of last request) - preventing feedback loop");
        }
      } else {
        console.warn("📸 [App] screenshot_success received but no dataUrl found and not buffered");
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
        // Use markProfileSetupComplete to properly set has_profile_setup flag
        await onboardingService.markProfileSetupComplete(authState.user.authUserId, profileData);
        console.log('🎯 [App] Profile setup data saved');
        
        // Set flag to prevent auth subscription from overriding navigation
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
        handleClearConnectionError={handleClearConnectionError}
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
