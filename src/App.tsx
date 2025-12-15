import { useState, useEffect, useRef } from 'react';
import { AuthState, ConnectionStatus, AppState, ActiveModal, PlayerProfile } from './types';
import { authService } from './services/authService';
import { onboardingService, type OnboardingStep } from './services/onboardingService';
import { connect, disconnect, setHandlers } from './services/websocketService';
import { toastService } from './services/toastService';
import { validateScreenshotDataUrl, normalizeDataUrl } from './utils/imageValidation';
import { supabase } from './lib/supabase';
import AppRouter from './components/AppRouter';
import { ToastContainer } from './components/ui/ToastContainer';
import { isPWAMode } from './utils/pwaDetection';
import { logPWAStatus } from './utils/pwaRedirectPrevention';
import LayoutDebugOverlay from './components/debug/LayoutDebugOverlay';
import { useWakeLock } from './hooks/useWakeLock';

// PWA lifecycle state tracking
let appVisibilityTimestamp = Date.now();
const PWA_BACKGROUND_THRESHOLD = 30000; // 30 seconds - refresh auth if app was backgrounded longer

console.log('🚀🚀🚀 APP.TSX LOADED - PWA FIXES VERSION 🚀🚀🚀');

// Log PWA status on app load
logPWAStatus();

function App() {
  // Keep screen awake while app is active (PWA)
  const { isActive: isWakeLockActive, isSupported: isWakeLockSupported } = useWakeLock(true);
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });
  const [hasEverLoggedIn, setHasEverLoggedIn] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
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
  // ✅ FIX: Removed duplicate activeModal useState - now only in appState
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(() => {
    // Restore connection status if we have a stored code
    const storedCode = localStorage.getItem('otakon_connection_code');
    return storedCode ? ConnectionStatus.CONNECTING : ConnectionStatus.DISCONNECTED;
  });
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const mainAppMessageHandlerRef = useRef<((_data: Record<string, unknown>) => void) | null>(null);
  const authSubscriptionRef = useRef<(() => void) | null>(null);
  const isProcessingAuthRef = useRef(false);
  const isManualNavigationRef = useRef(false); // Track manual onboarding navigation
  const lastHotkeyRequestTimestamp = useRef<number>(0); // Track last hotkey screenshot request to prevent duplicates
  const hasReceivedPCMessage = useRef<boolean>(false); // Track if we've received any message from PC client
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Timeout for connection verification

  // NOTE: Viewport height is now handled by CSS using position:fixed + inset:0
  // This approach is bulletproof and doesn't require JavaScript

  // Log wake lock status
  useEffect(() => {
    if (isWakeLockSupported) {
      console.log(`🔒 [App] Wake Lock: ${isWakeLockActive ? 'ACTIVE - Screen will not sleep' : 'Inactive'}`);
    } else {
      console.log('⚠️ [App] Wake Lock API not supported on this device');
    }
  }, [isWakeLockActive, isWakeLockSupported]);

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
            .eq('auth_user_id', authState.user?.authUserId ?? '');
          if (error) {
            console.error('Failed to update app state in Supabase:', error);
          }
        } catch (error) {
          console.error('Error updating app state:', error);
        }
      };
      updateAppState();
    }
  }, [appState.view, appState.onboardingStatus, appState.activeSubView, appState.isHandsFreeMode, appState.showUpgradeScreen, appState.showDailyCheckin, appState.isFirstTime, authState.user, authState.isLoading]);

  useEffect(() => {
    // ✅ PWA BLACK SCREEN FIX: Clear logout flag immediately on app load
    // This prevents the flag from interfering with normal app initialization
    const justLoggedOut = localStorage.getItem('otakon_just_logged_out');
    if (justLoggedOut) {
      console.log('📱 [PWA] Clearing logout flag on app initialization');
      localStorage.removeItem('otakon_just_logged_out');
    }
    
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
          // ✅ OPTIMIZATION: Use synchronous method - User already has onboarding data from get_complete_user_data
          // This eliminates a redundant get_user_onboarding_status RPC call (~200-500ms savings)
          const nextStep = onboardingService.getNextOnboardingStepFromUser(newAuthState.user);
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
            const isPWA = isPWAMode();
            
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
    
    // Set app ready after subscription setup
    setIsAppReady(true);
    
    return () => {
      isMounted = false;
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ PWA FIX: Loading timeout with smart fallback to prevent infinite black screen
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isInitializing) {
        console.warn('⏰ [App] Initialization timeout reached, forcing ready state');
        setIsInitializing(false);
        
        // ✅ PWA CRITICAL FIX: Check if we just logged out and prevent auth loading
        const justLoggedOut = localStorage.getItem('otakon_just_logged_out');
        if (justLoggedOut) {
          // Check if logout flag is stale (older than 10 seconds)
          const logoutTimestamp = parseInt(justLoggedOut, 10);
          const isStale = !isNaN(logoutTimestamp) && (Date.now() - logoutTimestamp) > 10000;
          
          if (isStale) {
            console.log('📱 [PWA] Stale logout flag detected (>10s old), clearing it');
            localStorage.removeItem('otakon_just_logged_out');
          } else {
            console.log('📱 [PWA] Just logged out flag in timeout, showing login immediately');
            localStorage.removeItem('otakon_just_logged_out');
            setAuthState({ user: null, isLoading: false, error: null });
            setAppState(prev => ({ ...prev, view: 'app', onboardingStatus: 'login' }));
            return;
          }
        }
        
        // If we're still loading auth and it's a PWA, check session one more time
        if (isPWAMode() && authState.isLoading) {
          console.log('📱 [PWA] Auth still loading after timeout, checking session...');
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
              console.log('📱 [PWA] No session after timeout, showing login');
              setAuthState({ user: null, isLoading: false, error: null });
              setAppState(prev => ({ ...prev, view: 'app', onboardingStatus: 'login' }));
            } else {
              console.log('📱 [PWA] Session found after timeout, user should appear shortly');
            }
          }).catch(err => {
            console.error('📱 [PWA] Session check failed after timeout:', err);
            setAuthState({ user: null, isLoading: false, error: null });
            setAppState(prev => ({ ...prev, view: 'app', onboardingStatus: 'login' }));
          });
        } else if (!isPWAMode() && authState.isLoading) {
          // ✅ Even for web, force show login after timeout if still loading
          console.log('🌐 [Web] Auth still loading after timeout, showing login');
          setAuthState({ user: null, isLoading: false, error: null });
          setAppState(prev => ({ ...prev, view: 'app', onboardingStatus: 'login' }));
        }
      }
    }, 8000); // Reduced from 10s to 8s for faster fallback
    return () => clearTimeout(timeout);
  }, [isInitializing, hasEverLoggedIn, authState.isLoading]);

  useEffect(() => {
    const isAuthCallback = window.location.pathname === '/auth/callback' || 
                           window.location.pathname === '/auth/callback';
    if (isAuthCallback) {
      // The AuthCallback component will handle the authentication
    }
  }, []);

  // Global auth event listener for token refresh and session management
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 [App] Auth event:', event, 'Processing:', isProcessingAuthRef.current);
        
        if (event === 'TOKEN_REFRESHED' && session) {
          console.log('🔐 [App] Token refreshed, updating user data');
          if (authState.user) {
            // Refresh user data to ensure we have latest info
            await authService.refreshUser();
          }
        } else if (event === 'SIGNED_OUT') {
          // ✅ PWA FIX: Only process SIGNED_OUT if we're not actively logging out
          // This prevents race condition between logout function and auth event
          if (isProcessingAuthRef.current) {
            console.log('🔐 [App] SIGNED_OUT event ignored - logout already in progress');
            return;
          }
          
          console.log('🔐 [App] User signed out via auth state change');
          // Update auth state if not already null
          if (authState.user) {
            setAuthState({ user: null, isLoading: false, error: null });
          }
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [authState.user]);

  // Listen for custom auth events from Supabase client
  useEffect(() => {
    const handleSessionRefreshed = () => {
      console.log('🔐 [App] Session refreshed event received');
      if (authState.user) {
        authService.refreshUser().catch(err => {
          console.error('Failed to refresh user after session refresh:', err);
        });
      }
    };

    // ✅ MOBILE FIX: Reset DOM styles on sign out to prevent accumulated spacing
    // CSS handles viewport height with position:fixed + inset:0, no JS needed
    const cleanupDOMStyles = () => {
      console.log('🧹 [App] Cleaning up DOM styles on sign out');
      
      // Reset inline styles - CSS will handle layout via position:fixed + inset:0
      document.body.style.cssText = '';
      document.documentElement.style.cssText = '';
      const root = document.getElementById('root');
      if (root) {
        root.style.cssText = '';
      }
      
      // Force layout recalculation
      void document.body.offsetHeight;
      
      // Ensure proper scroll position
      window.scrollTo(0, 0);
    };

    const handleSignedOut = () => {
      console.log('🔐 [App] Signed out event received');
      cleanupDOMStyles(); // ✅ MOBILE FIX: Clean up DOM before state change
      setAuthState({ user: null, isLoading: false, error: null });
    };

    // ✅ FIX: Handle session expiry - prompt user to re-login
    const handleSessionExpired = (event: Event) => {
      const customEvent = event as CustomEvent<{ reason: string; timestamp: number }>;
      console.warn('🔐 [App] Session expired:', customEvent.detail?.reason);
      
      // Show warning toast - session expired
      toastService.warning('Your session has expired. Please log in again to continue.');
      
      // ✅ MOBILE FIX: Clean up DOM before state change
      cleanupDOMStyles();
      
      // Clear state and redirect to login after a short delay
      setTimeout(() => {
        setAuthState({ user: null, isLoading: false, error: null });
        setAppState((prev: AppState) => ({
          ...prev,
          view: 'app',
          onboardingStatus: 'login'
        }));
      }, 1500);
    };

    window.addEventListener('otakon:session-refreshed', handleSessionRefreshed);
    window.addEventListener('otakon:signed-out', handleSignedOut);
    window.addEventListener('otakon:session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('otakon:session-refreshed', handleSessionRefreshed);
      window.removeEventListener('otakon:signed-out', handleSignedOut);
      window.removeEventListener('otakon:session-expired', handleSessionExpired);
    };
  }, [authState.user]);

  // ✅ PWA FIX: Visibility change handler to refresh auth state when app comes back from background
  // This prevents black screen on PWA reopen by ensuring auth state is valid
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const backgroundDuration = Date.now() - appVisibilityTimestamp;
        console.log('📱 [PWA] App became visible, background duration:', backgroundDuration, 'ms');
        
        // ✅ PWA CRITICAL FIX: Check if we just logged out
        const justLoggedOut = localStorage.getItem('otakon_just_logged_out');
        if (justLoggedOut) {
          console.log('📱 [PWA] Just logged out flag detected, clearing and showing login');
          localStorage.removeItem('otakon_just_logged_out');
          setIsInitializing(false);
          setAuthState({ user: null, isLoading: false, error: null });
          setAppState(prev => ({ ...prev, view: 'app', onboardingStatus: 'login' }));
          return;
        }
        
        // Only refresh auth if app was in background for more than threshold OR if state is corrupted
        const isCorrupted = isInitializing || (authState.isLoading && backgroundDuration > 3000);
        
        if (isPWAMode() && (backgroundDuration > PWA_BACKGROUND_THRESHOLD || isCorrupted)) {
          console.log('📱 [PWA] Long background or corrupted state detected, refreshing auth state...');
          
          try {
            // Check current session validity
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error('📱 [PWA] Session check error:', error);
              // Show loading state briefly while we determine next action
              setIsInitializing(false);
              setAuthState({ user: null, isLoading: false, error: null });
              setAppState(prev => ({ ...prev, view: 'app', onboardingStatus: 'login' }));
              return;
            }
            
            if (!session) {
              console.log('📱 [PWA] No session found after background, showing login');
              setIsInitializing(false);
              setAuthState({ user: null, isLoading: false, error: null });
              setAppState(prev => ({ ...prev, view: 'app', onboardingStatus: 'login' }));
            } else {
              console.log('📱 [PWA] Session valid, refreshing user data');
              setIsInitializing(false);
              // Refresh user data to ensure latest state
              await authService.refreshUser().catch(err => {
                console.warn('📱 [PWA] User refresh failed, but session is valid:', err);
                // If refresh fails but session exists, still set loading to false
                setAuthState(prev => ({ ...prev, isLoading: false }));
              });
            }
          } catch (error) {
            console.error('📱 [PWA] Visibility change auth check error:', error);
            // On error, set a safe state rather than showing black screen
            setIsInitializing(false);
            setAuthState({ user: null, isLoading: false, error: null });
            setAppState(prev => ({ ...prev, view: 'app', onboardingStatus: 'login' }));
          }
        }
      } else {
        // App going to background - record timestamp
        appVisibilityTimestamp = Date.now();
        console.log('📱 [PWA] App going to background');
      }
    };
    
    // ✅ PWA FIX: pageshow event for bfcache restoration
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log('📱 [PWA] Page restored from bfcache');
        // Reset timestamp to trigger auth check
        appVisibilityTimestamp = Date.now() - PWA_BACKGROUND_THRESHOLD - 1;
        // ✅ CRITICAL FIX: Trigger visibilitychange event instead of calling function
        // This avoids closure issues with stale state
        document.dispatchEvent(new Event('visibilitychange'));
      }
    };
    
    // ✅ PWA FIX: beforeunload to save state for potential restore
    const handleBeforeUnload = () => {
      // Only save state if user is logged in
      // This prevents restoring logged-out state on reopen
      // ✅ CRITICAL FIX: Check localStorage for auth tokens instead of stale authState.user
      // This avoids closure issues where authState.user might be stale
      const hasAuthTokens = Object.keys(localStorage).some(key => key.startsWith('sb-') && key.includes('auth-token'));
      if (isPWAMode() && hasAuthTokens) {
        sessionStorage.setItem('pwa_last_view', appState.view);
        sessionStorage.setItem('pwa_last_onboarding', appState.onboardingStatus);
        sessionStorage.setItem('pwa_last_timestamp', Date.now().toString());
      }
    };
    
    // ✅ CROSS-INSTANCE FIX: Listen for storage events to detect logout from other instances
    // This handles the case where browser login page is open and PWA logs out
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'otakon_just_logged_out' && event.newValue) {
        console.log('📱 [PWA/Browser] Detected logout from another instance via storage event');
        // Clear the flag to prevent loops
        localStorage.removeItem('otakon_just_logged_out');
        localStorage.removeItem('otakon_logout_instance');
        // Force show login screen
        setIsInitializing(false);
        setAuthState({ user: null, isLoading: false, error: null });
        setAppState(prev => ({ ...prev, view: 'app', onboardingStatus: 'login' }));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState.view, appState.onboardingStatus]);

  // ✅ PWA FIX: Listen for service worker messages and force-login events
  useEffect(() => {
    // Listen for force-login-view event from PWALifecycleProvider
    const handleForceLoginView = () => {
      console.log('📱 [App] Force login view event received');
      setIsInitializing(false);
      setAuthState({ user: null, isLoading: false, error: null });
      setAppState(prev => ({ ...prev, view: 'app', onboardingStatus: 'login' }));
    };
    
    window.addEventListener('otakon:force-login-view', handleForceLoginView);
    
    if ('serviceWorker' in navigator) {
      const handleServiceWorkerMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'AUTH_CACHE_CLEARED') {
          console.log('📱 [PWA] Service worker cleared auth cache');
          // Service worker has cleared caches, we're ready for next login
          // No action needed here as PWA already reloaded via confirmLogout
        } else if (event.data && event.data.type === 'CHECK_LOGOUT_FLAG') {
          // ✅ PWA BLACK SCREEN FIX: Service worker asking if we just logged out
          // Respond through the port provided
          const hasFlag = !!localStorage.getItem('otakon_just_logged_out');
          console.log('[App] SW checking logout flag:', hasFlag);
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage(hasFlag);
          }
        }
      };

      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

      return () => {
        window.removeEventListener('otakon:force-login-view', handleForceLoginView);
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
    
    return () => {
      window.removeEventListener('otakon:force-login-view', handleForceLoginView);
    };
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
  }, [connectionStatus]);

  const handleGetStarted = () => {
    setAppState((prev: AppState) => ({ ...prev, view: 'app', onboardingStatus: 'login' }));
  };

  const handleLoginComplete = async () => {
    console.log('🎯 [App] Email login completed, setting view to app');
    
    // ✅ MOBILE FIX: Ensure clean DOM state before transitioning to app
    // CSS handles viewport height with position:fixed + inset:0
    document.body.style.cssText = '';
    document.documentElement.style.cssText = '';
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.style.cssText = '';
    }
    void document.body.offsetHeight; // Force layout recalculation
    
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
    // Clear URL without causing navigation
    window.history.replaceState({}, document.title, '/');
    
    // ✅ MOBILE FIX: Ensure clean DOM state before transitioning to app
    // CSS handles viewport height with position:fixed + inset:0
    document.body.style.cssText = '';
    document.documentElement.style.cssText = '';
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.style.cssText = '';
    }
    void document.body.offsetHeight; // Force layout recalculation
    
    // Set app state to show the app
    setAppState((prev: AppState) => ({ ...prev, view: 'app' }));
    
    // Log successful OAuth in current context (browser or PWA)
    console.log('🔐 [App] OAuth successful in:', isPWAMode() ? 'PWA' : 'Browser');
  };

  const handleOAuthError = (error: string) => {
    console.error('🔐 [App] OAuth authentication error:', error);
    setAppState((prev: AppState) => ({ ...prev, view: 'landing' }));
  };

  const handleLogout = () => {
    // ✅ PWA FIX: Clear processing flag in case it's stuck from a previous logout attempt
    isProcessingAuthRef.current = false;
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    console.log('🎯 [App] Starting logout process...');
    console.log('🎯 [App] isProcessingAuthRef.current BEFORE:', isProcessingAuthRef.current);
    setShowLogoutConfirm(false);
    
    // ✅ CRITICAL: Set processing flag to prevent race condition
    // Keep it TRUE to block the auth subscription from overriding our state
    isProcessingAuthRef.current = true;
    
    // ✅ PWA FIX: Check if running as PWA and set flag BEFORE clearing storage
    const isPWA = isPWAMode();
    if (isPWA) {
      // Set flag BEFORE signing out so it persists through reload
      localStorage.setItem('otakon_just_logged_out', 'true');
      console.log('📱 [PWA] Set just logged out flag before clearing storage');
    }
    
    // ✅ PWA FIX: Clear sessionStorage to prevent state restoration on reopen
    sessionStorage.clear();
    console.log('🧹 [App] SessionStorage cleared to prevent state restoration');
    
    // ✅ MOBILE FIX: Clean up DOM styles SYNCHRONOUSLY before logout
    // CSS handles viewport height with position:fixed + inset:0
    console.log('🧹 [App] Cleaning up DOM styles before logout...');
    document.body.style.cssText = '';
    document.documentElement.style.cssText = '';
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.style.cssText = '';
    }
    void document.body.offsetHeight; // Force layout recalculation
    window.scrollTo(0, 0);
    console.log('🧹 [App] DOM styles cleaned up before logout');
    
    // ✅ PWA FIX: Dispatch a custom event BEFORE signOut to notify components to reset their refs
    // This is critical for MainApp to reset hasLoadedConversationsRef
    window.dispatchEvent(new CustomEvent('otakon:user-logout'));
    console.log('🎯 [App] Dispatched otakon:user-logout event');
    
    // Sign out (clears Supabase session and localStorage)
    // Note: Welcome guide flag now tracked in database (hasSeenWelcomeGuide), so no need to preserve localStorage
    await authService.signOut();
    
    if (isPWA) {
      // ✅ PWA CRITICAL FIX: For PWA, force a full hard reload to clear all state
      // This prevents black screen and ensures clean login experience
      console.log('📱 [PWA] Forcing full hard reload after logout to clear state');
      
      // ✅ BROWSER CONFLICT FIX: Set timestamp instead of just flag
      // This helps identify stale logout flags if browser was open during PWA logout
      localStorage.setItem('otakon_just_logged_out', Date.now().toString());
      
      // Clear ALL app-related sessionStorage to prevent state leakage
      sessionStorage.clear();
      
      // Navigate to login page first (this clears URL state)
      window.history.replaceState(null, '', '/earlyaccess');
      
      // ✅ CRITICAL FIX: Use reload() to force hard reload, bypassing ALL caches
      // This ensures service worker doesn't serve stale content
      setTimeout(() => {
        window.location.reload();
      }, 150); // Increased slightly for reliability
      
      // ✅ CRITICAL: Return here to prevent any further code execution
      // Processing flag will be reset on reload
      return;
    } else {
      // ✅ For web browser, just update state normally
      setAppState((prev: AppState) => ({
        ...prev,
        view: 'app',
        onboardingStatus: 'login'
      }));
      setAuthState({ user: null, isLoading: false, error: null });
      
      console.log('🎯 [App] Logout completed, state set to view: app, onboardingStatus: login');
      
      // ✅ Release processing flag after longer delay to ensure SIGNED_OUT event is handled
      setTimeout(() => {
        isProcessingAuthRef.current = false;
        console.log('🎯 [App] Processing flag released after logout');
      }, 500);
    }
  };

  const openModal = (modal: ActiveModal) => {
    setAppState(prev => ({ ...prev, activeModal: modal }));
  };

  const closeModal = () => {
    setAppState(prev => ({ ...prev, activeModal: null }));
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
      onboardingService.updateOnboardingStatus(authState.user.authUserId, step as OnboardingStep)
        .catch(error => console.error('🎯 [App] Error updating onboarding status:', error));
    }
  };

  const handleConnect = async (code: string) => {
    console.log('🔗 [App] Connecting with code:', code);
    
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
    
    // Call connect with minimal handlers, then immediately override with setHandlers to prevent stale closures
    connect(
      code,
      () => {}, // Placeholder
      () => {}, // Placeholder
      () => {}, // Placeholder
      () => {}  // Placeholder
    );
    
    // ✅ CRITICAL: Immediately set handlers AFTER connect() to override and prevent stale closures
    console.log('🔗 [App] Setting WebSocket handlers after connect()');
    setHandlers(
      () => {
        // WebSocket opened - but DON'T set as connected yet
        // Wait for actual message from PC client
        console.log('🔗 [App] WebSocket connection opened, waiting for PC client response...');
        console.log('🔗 [App] hasReceivedPCMessage:', hasReceivedPCMessage.current);
        console.log('🔗 [App] Timeout will fire in 5 seconds if no message received');
      },
      (data) => {
        console.log('🔗 [App] onMessage handler called with type:', data.type);
        console.log('🔗 [App] Full data:', data);
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
        
        console.log('🔗 [App] Calling handleWebSocketMessage...');
        try {
          handleWebSocketMessage(data);
          console.log('🔗 [App] handleWebSocketMessage completed');
        } catch (err) {
          console.error('🔗 [App] handleWebSocketMessage threw error:', err);
        }
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

  const handleWebSocketMessage = (data: Record<string, unknown>) => {
    try {
      console.log('🔗 [App] Processing WebSocket message:', data);
      console.log('🔗 [App] Message type:', data.type);
      console.log('🔗 [App] All keys:', Object.keys(data));
    } catch (err) {
      console.error('🔗 [App] Error in initial logging:', err);
    }
    
    // ✅ FIX: Handle screenshot-single message from PC client F1 hotkey
    if (data.type === 'screenshot-single') {
      console.log("📸 [App] screenshot-single message received - processing single fresh screenshot");
      
      const payload = data.payload as Record<string, unknown> | undefined;
      const images = payload?.images as string[] | undefined;
      
      if (images && Array.isArray(images) && images.length > 0) {
        console.log("📸 [App] Processing single screenshot from F1 hotkey");
        const dataUrl = images[0];
        
        // Validate and normalize screenshot data
        const validation = validateScreenshotDataUrl(dataUrl);
        if (!validation.valid) {
          console.error("📸 [App] Screenshot validation failed:", validation.error);
          toastService.error(`Screenshot validation failed: ${validation.error}`);
          return;
        }
        
        const normalizedUrl = normalizeDataUrl(dataUrl);
        if (!normalizedUrl) {
          console.error("📸 [App] Failed to normalize screenshot data");
          toastService.error('Screenshot validation failed. Please try again.');
          return;
        }
        
        if (mainAppMessageHandlerRef.current) {
          console.log("📸 [App] Forwarding single screenshot to MainApp");
          mainAppMessageHandlerRef.current({
            type: 'screenshot',
            dataUrl: normalizedUrl
          });
        } else {
          console.warn("📸 [App] mainAppMessageHandlerRef.current is null!");
        }
      } else {
        console.warn("📸 [App] screenshot-single received but no images in payload");
      }
      return;
    }
    
    // ✅ FIX: Handle screenshot-multi message from PC client F2 hotkey
    if (data.type === 'screenshot-multi') {
      console.log("📸 [App] screenshot-multi message received - processing buffered screenshots");
      
      // Check tier - batch screenshots are Pro/Vanguard only
      const userTier = authState.user?.tier || 'free';
      if (userTier !== 'pro' && userTier !== 'vanguard_pro') {
        console.warn("📸 [App] screenshot-multi blocked - Free tier users can only use F1 (single screenshot)");
        toastService.warning('Batch screenshots (F2) are a Pro feature. Upgrade to unlock!');
        return;
      }
      
      const payload = data.payload as Record<string, unknown> | undefined;
      const images = payload?.images as string[] | undefined;
      
      if (images && Array.isArray(images) && images.length > 0) {
        console.log("📸 [App] Processing", images.length, "buffered screenshots from F2 hotkey");
        images.forEach((dataUrl: string, index: number) => {
          console.log("📸 [App] Processing buffered screenshot", index + 1, "of", images.length);
          
          // Validate and normalize screenshot data
          const normalizedUrl = normalizeDataUrl(dataUrl);
          if (!normalizedUrl) {
            console.error("📸 [App] Invalid screenshot data, skipping image", index);
            toastService.error('Screenshot validation failed. Please try again.');
            return;
          }
          
          console.log("📸 [App] Screenshot", index + 1, "validated and normalized");
          if (mainAppMessageHandlerRef.current) {
            console.log("📸 [App] Forwarding screenshot", index + 1, "to MainApp");
            mainAppMessageHandlerRef.current({
              type: 'screenshot',
              dataUrl: normalizedUrl,
              index: index
            });
          }
        });
      } else {
        console.warn("📸 [App] screenshot-multi received but no images in payload");
      }
      return;
    }
    
    if (data.type === 'screenshot_batch') {
      console.log("📸 [App] screenshot_batch received");
      
      // ✅ FIX: Batch screenshots (F2) are Pro/Vanguard only
      const userTier = authState.user?.tier || 'free';
      if (userTier !== 'pro' && userTier !== 'vanguard_pro') {
        console.warn("📸 [App] screenshot_batch blocked - Free tier users can only use F1 (single screenshot)");
        toastService.warning('Batch screenshots (F2) are a Pro feature. Upgrade to unlock!');
        return;
      }
      
      console.log("📸 [App] Full message data:", JSON.stringify(data).substring(0, 200));
      const batchData = (data.payload || data) as Record<string, unknown>;
      console.log("📸 [App] batchData keys:", Object.keys(batchData));
      console.log("📸 [App] Has images?", !!batchData.images);
      console.log("📸 [App] Is array?", Array.isArray(batchData.images));
      const batchImages = batchData.images as string[] | undefined;
      console.log("📸 [App] Length:", batchImages ? batchImages.length : 0);
      
      if (batchImages && Array.isArray(batchImages) && batchImages.length > 0) {
        console.log("📸 [App] Processing", batchImages.length, "images from batch");
        batchImages.forEach((imgSrc: string, index: number) => {
          console.log("📸 [App] Processing image", index + 1, "of", batchImages.length);
          // ✅ FIX: Validate and normalize screenshot data before processing
          const normalizedUrl = normalizeDataUrl(imgSrc);
          if (!normalizedUrl) {
            console.error("📸 [App] Invalid screenshot data in batch, skipping image", index);
            toastService.error('Screenshot validation failed. Please try again.');
            return;
          }
          
          console.log("📸 [App] Screenshot", index + 1, "validated and normalized");
          if (mainAppMessageHandlerRef.current) {
            console.log("📸 [App] Forwarding screenshot", index + 1, "to MainApp");
            mainAppMessageHandlerRef.current({
              type: 'screenshot',
              dataUrl: normalizedUrl,
              index: index
            });
          }
        });
      }
    } else if (data.type === 'screenshot_success') {
      console.log("📸 [App] Screenshot success message received:", data);
      const success = data.success as Record<string, unknown> | undefined;
      console.log("📸 [App] Success object:", success);
      console.log("📸 [App] Has dataUrl?", !!(success && 'dataUrl' in success));
      console.log("📸 [App] Success keys:", success ? Object.keys(success) : 'no success object');
      const details = success && 'details' in success ? success.details as Record<string, unknown> : undefined;
      console.log("📸 [App] Details object:", details);
      console.log("📸 [App] Details keys:", details ? Object.keys(details) : 'no details');
      
      // Check if dataUrl is in the details object
      const dataUrl = (success && 'dataUrl' in success ? success.dataUrl : (details && 'dataUrl' in details ? details.dataUrl : undefined)) as string | undefined;
      
      if (dataUrl) {
        console.log("📸 [App] Processing individual screenshot with dataUrl");
        
        // ✅ FIX: Validate and normalize screenshot data before processing
        const normalizedUrl = normalizeDataUrl(dataUrl);
        if (!normalizedUrl) {
          const validation = validateScreenshotDataUrl(dataUrl);
          console.error("📸 [App] Invalid screenshot data:", validation.error);
          toastService.error(`Screenshot validation failed: ${validation.error}`);
          return;
        }
        
        if (mainAppMessageHandlerRef.current) {
          console.log("📸 [App] Forwarding to MainApp via ref");
          mainAppMessageHandlerRef.current({
            type: 'screenshot',
            dataUrl: normalizedUrl
          });
        } else {
          console.warn("📸 [App] mainAppMessageHandlerRef.current is null!");
        }
      } else if (details && 'addedToBuffer' in details && details.addedToBuffer) {
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
              mode: (success && 'mode' in success ? success.mode : 'single') as string,
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
    } else if (data.type === 'screenshot' && data.dataUrl) {
      // Handle single screenshot from PC client hotkey (F1)
      console.log("📸 [App] Single screenshot received from PC client");
      const validation = validateScreenshotDataUrl(data.dataUrl);
      if (!validation.valid) {
        console.error("📸 [App] Screenshot validation failed:", validation.error);
        toastService.error(`Screenshot validation failed: ${validation.error}`);
        return;
      }
      
      const normalizedUrl = normalizeDataUrl(data.dataUrl as string);
      if (!normalizedUrl) {
        console.error("📸 [App] Failed to normalize screenshot data");
        toastService.error('Screenshot validation failed. Please try again.');
        return;
      }
      
      if (mainAppMessageHandlerRef.current) {
        console.log("📸 [App] Forwarding screenshot to MainApp");
        mainAppMessageHandlerRef.current({
          type: 'screenshot',
          dataUrl: normalizedUrl
        });
      } else {
        console.warn("📸 [App] mainAppMessageHandlerRef.current is null!");
        toastService.error('Screenshot handler not ready. Please wait and try again.');
      }
    } else {
      console.log("📸 [App] Unrecognized message type:", data.type, "Keys:", Object.keys(data));
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

  const handleProfileSetupComplete = async (profileData: PlayerProfile) => {
    if (authState.user) {
      try {
        // Immediately update local user state to hide banner
        const updatedUser = {
          ...authState.user,
          hasProfileSetup: true,
          profileData: profileData as unknown as Record<string, unknown>
        };
        setAuthState(prev => ({ ...prev, user: updatedUser }));
        
        // ✅ MOBILE FIX: Force layout recalculation after banner dismissal
        // This ensures the flex container properly expands the chat area
        requestAnimationFrame(() => {
          document.body.style.overflow = '';
          void document.body.offsetHeight; // Force reflow
        });
        
        // Use markProfileSetupComplete to properly set has_profile_setup flag
        await onboardingService.markProfileSetupComplete(authState.user.authUserId, profileData as unknown as Record<string, unknown>);
        
        // Set flag to prevent auth subscription from overriding navigation
        isManualNavigationRef.current = true;
        
        // Refresh user data to update hasProfileSetup flag
        await authService.refreshUser();
      } catch (error) {
        console.error('Failed to save profile setup:', error);
        isManualNavigationRef.current = false;
      }
    }
  };

  const handleProfileSetupSkip = async () => {
    if (authState.user) {
      try {
        // Immediately update local user state to hide banner
        const updatedUser = {
          ...authState.user,
          hasProfileSetup: true
        };
        setAuthState(prev => ({ ...prev, user: updatedUser }));
        
        // ✅ MOBILE FIX: Force layout recalculation after banner dismissal
        // This ensures the flex container properly expands the chat area
        requestAnimationFrame(() => {
          document.body.style.overflow = '';
          void document.body.offsetHeight; // Force reflow
        });
        
        // Use 'profile-setup' step to properly set has_profile_setup flag
        await onboardingService.updateOnboardingStatus(authState.user.authUserId, 'profile-setup', {
          profile_setup_skipped: true
        });
        
        // Set flag to prevent auth subscription from overriding
        isManualNavigationRef.current = true;
        
        // Refresh user data to update hasProfileSetup flag
        await authService.refreshUser();
      } catch (error) {
        console.error('Failed to skip profile setup:', error);
        isManualNavigationRef.current = false;
      }
    }
  };

  // App.tsx now only handles manual routing
  // AppWrapper.tsx handles the decision between React Router and manual routing
  
  // Show loading screen while app initializes to prevent black screen
  if (!isAppReady || (authState.isLoading && isInitializing)) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#E53A3A] border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-lg font-medium">Loading Otagon...</p>
          <p className="text-[#8F8F8F] text-sm mt-2">Initializing your gaming companion</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <AppRouter
          appState={appState}
          authState={authState}
          activeModal={appState.activeModal}
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
      <LayoutDebugOverlay />
    </>
  );
}

// Force React Fast Refresh to remount
export default App;
