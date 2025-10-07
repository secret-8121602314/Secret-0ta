import { useState, useEffect, useRef } from 'react';
import { AuthState, ConnectionStatus } from './types';
import { authService } from './services/authService';
import { onboardingService } from './services/onboardingService';
import { connect, disconnect } from './services/websocketService';
import { supabase } from './lib/supabase';
import LandingPage from './components/LandingPage';
import LoginSplashScreen from './components/splash/LoginSplashScreen';
import InitialSplashScreen from './components/splash/InitialSplashScreen';
import HowToUseSplashScreen from './components/splash/HowToUseSplashScreen';
import ProFeaturesSplashScreen from './components/splash/ProFeaturesSplashScreen';
import PlayerProfileSetupModal from './components/splash/PlayerProfileSetupModal';
import SplashScreen from './components/splash/SplashScreen';
import MainApp from './components/MainApp';
import AuthCallback from './components/auth/AuthCallback';
import AboutModal from './components/modals/AboutModal';
import PrivacyModal from './components/modals/PrivacyModal';
import TermsModal from './components/modals/TermsModal';
import RefundPolicyModal from './components/modals/RefundPolicyModal';
import ContactUsModal from './components/modals/ContactUsModal';
import SettingsModal from './components/modals/SettingsModal';

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });
  const [hasEverLoggedIn, setHasEverLoggedIn] = useState(false);
  const [appState, setAppState] = useState({
    view: 'landing' as 'landing' | 'app',
    onboardingStatus: 'initial' as any,
    activeSubView: 'chat',
    isConnectionModalOpen: false,
    isHandsFreeModalOpen: false,
    isSettingsModalOpen: false,
    isCreditModalOpen: false,
    isOtakuDiaryModalOpen: false,
    isWishlistModalOpen: false,
    activeModal: null as string | null,
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
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Add refs to prevent race conditions
  const initializationRef = useRef(false);
  const authProcessedRef = useRef(false);
  const lastProcessedUserIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mainAppMessageHandlerRef = useRef<((data: any) => void) | null>(null);
  const appStateRef = useRef(appState);

  // Debug app state changes
  useEffect(() => {
    appStateRef.current = appState;
    console.log('🎯 [App] App state changed:', {
      view: appState.view,
      onboardingStatus: appState.onboardingStatus,
      hasUser: !!authState.user,
      userEmail: authState.user?.email
    });
  }, [appState.view, appState.onboardingStatus, authState.user]);

  // Update user data with app state changes (only for persistent data)
  useEffect(() => {
    if (authState.user && !authState.isLoading) {
      
      // Update authenticated users in Supabase
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

  // Comprehensive auth state handler with race condition prevention
  useEffect(() => {
    let isMounted = true;
    
    const processAuthState = async (newAuthState: AuthState) => {
      console.log('🎯 [App] Processing auth state:', { 
        isLoading: newAuthState.isLoading, 
        hasUser: !!newAuthState.user,
        userEmail: newAuthState.user?.email,
        onboardingCompleted: newAuthState.user?.onboardingCompleted,
        authProcessed: authProcessedRef.current,
        initialized: initializationRef.current
      });
      
      // Prevent multiple processing of the same auth state
      if (authProcessedRef.current && newAuthState.user?.authUserId === lastProcessedUserIdRef.current) {
        console.log('🎯 [App] Auth state already processed for this user, skipping');
        return;
      }
      
      // Reset auth processed flag if this is a different user or if user logged out
      if (newAuthState.user?.authUserId !== lastProcessedUserIdRef.current || 
          (!newAuthState.user && lastProcessedUserIdRef.current !== null)) {
        console.log('🎯 [App] Different user detected or user logged out, resetting auth processed flag');
        authProcessedRef.current = false;
      }
      
      // Don't reset auth processed flag if user data is just being refreshed
      // Only reset if the user actually changed or if we're starting fresh
      if (newAuthState.user?.authUserId === lastProcessedUserIdRef.current && 
          newAuthState.user && 
          appStateRef.current.onboardingStatus !== 'login' && 
          appStateRef.current.onboardingStatus !== 'initial') {
        console.log('🎯 [App] Same user, skipping auth processing to prevent onboarding reset');
        return;
      }
      
      // Only process if auth is not loading and we haven't already processed this user
      if (!newAuthState.isLoading && !authProcessedRef.current) {
        console.log('🎯 [App] Processing auth state - setting flags');
        console.log('🎯 [App] Current app view:', appState.view);
        
        if (!initializationRef.current) {
          initializationRef.current = true;
        }
        authProcessedRef.current = true;
        
        try {
          if (newAuthState.user) {
            // User is authenticated
            lastProcessedUserIdRef.current = newAuthState.user.authUserId;
            setHasEverLoggedIn(true); // Mark that user has logged in
            const savedAppState = newAuthState.user.appState || {};
            
            // Process onboarding if we're in the app view OR if we have a user and need to transition to app
            // But only if we haven't already set an onboarding status
            const needsOnboarding = newAuthState.user && !newAuthState.user.onboardingCompleted;
            const isInAppView = appStateRef.current.view === 'app';
            
            const shouldProcessOnboarding = (isInAppView || needsOnboarding);
            
            if (shouldProcessOnboarding && 
                (appStateRef.current.onboardingStatus === 'login' || appStateRef.current.onboardingStatus === 'initial')) {
              // Use the onboarding service to determine the next step
              console.log('🎯 [App] Determining onboarding status for user...');
              console.log('🎯 [App] User authUserId:', newAuthState.user.authUserId);
              console.log('🎯 [App] User onboarding flags:', {
                onboardingCompleted: newAuthState.user.onboardingCompleted,
                hasSeenSplashScreens: newAuthState.user.hasSeenSplashScreens,
                hasSeenHowToUse: newAuthState.user.hasSeenHowToUse,
                hasSeenFeaturesConnected: newAuthState.user.hasSeenFeaturesConnected,
                hasSeenProFeatures: newAuthState.user.hasSeenProFeatures,
                pcConnected: newAuthState.user.pcConnected,
                pcConnectionSkipped: newAuthState.user.pcConnectionSkipped
              });
              
              // Determine the next onboarding step using the service
              const nextStep = await onboardingService.getNextOnboardingStep(newAuthState.user.authUserId);
              console.log('🎯 [App] Next onboarding step:', nextStep);
              
              // Additional check: If user has been active recently and has seen splash screens,
              // they should be considered as having completed onboarding
              const hasAppActivity = newAuthState.user.lastActivity && 
                (Date.now() - newAuthState.user.lastActivity) < (30 * 24 * 60 * 60 * 1000); // 30 days
              
              const shouldSkipOnboarding = nextStep === 'complete' || 
                (hasAppActivity && newAuthState.user.hasSeenSplashScreens);
              
              if (shouldSkipOnboarding) {
                console.log('🎯 [App] User onboarding completed, going to main app');
                console.log('🎯 [App] Skip onboarding details:', {
                  nextStep,
                  hasAppActivity,
                  hasSeenSplashScreens: newAuthState.user.hasSeenSplashScreens,
                  lastActivity: newAuthState.user.lastActivity,
                  timeSinceActivity: newAuthState.user.lastActivity ? (Date.now() - newAuthState.user.lastActivity) / (1000 * 60 * 60 * 24) : 'N/A'
                });
                if (isMounted) {
                  setAppState(prev => ({ 
                    ...prev, 
                    view: 'app', 
                    onboardingStatus: 'complete',
                    ...savedAppState
                  }));
                }
              } else {
                
                if (isMounted) {
                  console.log('🎯 [App] Setting app state with onboarding status:', nextStep);
                  console.log('🎯 [App] Current app state before update:', appState);
                  
                  setAppState(prev => {
                    const newState = { 
                      ...prev, 
                      view: 'app' as const, 
                      onboardingStatus: nextStep,
                      ...savedAppState
                    };
                    console.log('🎯 [App] New app state:', newState);
                    return newState;
                  });
                  
                  // Force a re-render by updating state again if needed
                  setTimeout(() => {
                    console.log('🎯 [App] Checking app state after update:', appState);
                    if (appState.onboardingStatus !== nextStep) {
                      console.log('🎯 [App] State not updated, forcing update...');
                      setAppState(prev => ({
                        ...prev,
                        view: 'app' as const,
                        onboardingStatus: nextStep
                      }));
                    }
                  }, 100);
                } else {
                  console.log('🎯 [App] Component not mounted, skipping app state update');
                }
              }
            } else {
              console.log('🎯 [App] Not processing onboarding. Current view:', appState.view, 'Current onboarding status:', appState.onboardingStatus);
            }
          } else {
            // User is not authenticated
            console.log('🎯 [App] User not authenticated, hasEverLoggedIn:', hasEverLoggedIn);
            if (isMounted) {
              if (hasEverLoggedIn) {
                // User has logged in before, show login page
                console.log('🎯 [App] User has logged in before, showing login page');
                setAppState(prev => ({ 
                  ...prev, 
                  view: 'app', 
                  onboardingStatus: 'login' 
                }));
              } else {
                // User has never logged in, show landing page
                console.log('🎯 [App] User has never logged in, showing landing page');
                setAppState(prev => ({ 
                  ...prev, 
                  view: 'landing', 
                  onboardingStatus: 'login' 
                }));
              }
            }
            // Reset refs when user logs out
            lastProcessedUserIdRef.current = null;
          }
          
          // Mark initialization as complete
          if (isMounted) {
            setIsInitializing(false);
          }
        } catch (error) {
          console.error('🎯 [App] Error during initialization:', error);
          if (isMounted) {
            setIsInitializing(false);
          }
        }
      }
    };
    
    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe((newAuthState) => {
      setAuthState(newAuthState);
      
      // Reset the processed flag when auth state changes
      authProcessedRef.current = false;
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Process auth state with debouncing
      timeoutRef.current = setTimeout(() => {
        if (isMounted) {
          processAuthState(newAuthState);
        }
      }, 50); // Reduced debounce time
    });

    return () => {
      isMounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      unsubscribe();
    };
  }, []); // Empty dependency array to prevent re-subscription

  // Fallback: Force initialization to complete after 10 seconds to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isInitializing) {
        setIsInitializing(false);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isInitializing]);

  // Note: Removed automatic disconnect on unmount to maintain persistent connection
  // WebSocket should only disconnect when user explicitly disconnects or logs out

  // Handle OAuth callback URL
  useEffect(() => {
    if (window.location.pathname === '/auth/callback') {
      // The AuthCallback component will handle the authentication
      // and notify us when it's complete
    }
  }, []);

  const handleGetStarted = () => {
    setAppState(prev => ({ ...prev, view: 'app', onboardingStatus: 'login' }));
  };

  const handleLoginComplete = async () => {
    console.log('🎯 [App] Email login completed, setting view to app');
    // Set view to app immediately to prevent flash
    setAppState(prev => {
      const newState = { ...prev, view: 'app' as const, onboardingStatus: 'loading' as const };
      console.log('🎯 [App] Setting view to app with loading status:', newState);
      return newState;
    });
    
    // The auth state handler will process the user and determine onboarding
    // No need for setTimeout as the view is already set to 'app'
  };

  const handleBackToLanding = () => {
    console.log('🔙 [App] Back to landing clicked, resetting to landing page');
    setAppState(prev => ({ 
      ...prev, 
      view: 'landing',
      onboardingStatus: 'initial' // Reset to show actual landing page, not login
    }));
  };


  const handleOAuthSuccess = () => {
    // Clear the OAuth callback URL
    window.history.replaceState({}, document.title, '/');
    // Force a re-render by updating the app state
        setAppState(prev => ({ ...prev, view: 'app' }));
    // The auth service will handle user creation and state updates
    // The useEffect will automatically handle the navigation based on auth state
  };

  const handleOAuthError = (error: string) => {
    console.error('🔐 [App] OAuth authentication error:', error);
    // Redirect back to landing page on error
    setAppState(prev => ({ ...prev, view: 'landing' }));
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    console.log('🎯 [App] Starting logout process...');
    setShowLogoutConfirm(false);
    
    // Sign out from auth service
    await authService.signOut();
    
    // Reset all app state (but keep hasEverLoggedIn = true)
    setAppState(prev => ({ 
      ...prev,
      view: 'landing', 
      onboardingStatus: 'login' 
    }));
    
    // Reset all refs to prevent state conflicts
    initializationRef.current = false;
    authProcessedRef.current = false;
    lastProcessedUserIdRef.current = null;
    
    console.log('🎯 [App] Logout completed, showing login page (user has logged in before)');
  };

  const openModal = (modal: string) => {
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
  };


  const handleOnboardingComplete = async (step: string) => {
    console.log('🎯 [App] Onboarding step completed:', step);
    
    if (authState.user) {
      // Update UI immediately for better UX
      const nextStep = await onboardingService.getNextOnboardingStep(authState.user.authUserId);
      setAppState(prev => ({ 
        ...prev, 
        onboardingStatus: nextStep 
      }));
      
      // Update database in background (don't wait for it)
      onboardingService.updateOnboardingStatus(authState.user.authUserId, step as any)
        .catch(error => console.error('🎯 [App] Error updating onboarding status:', error));
    }
  };

  // Connection handlers
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
        // Handle incoming messages from PC client
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
    
    // Update database to mark PC connection as successful
    if (authState.user) {
      await onboardingService.updateOnboardingStatus(authState.user.authUserId, 'how-to-use', {
        has_seen_how_to_use: true,
        pc_connected: true,
        pc_connection_skipped: false
      });
      // Refresh user data to reflect the changes
      await authService.refreshUser();
    }
    
    // Show success message for 0.5 seconds, then navigate to features-connected
    setTimeout(() => {
      console.log('🔗 [App] Navigating to features-connected splash screen after connection success');
      setAppState(prev => ({ 
        ...prev, 
        onboardingStatus: 'features-connected' 
      }));
    }, 500);
  };

  const handleDisconnect = () => {
    console.log('🔗 [App] Disconnecting...');
    disconnect();
    setConnectionStatus(ConnectionStatus.DISCONNECTED);
    setConnectionError(null);
  };

  const handleWebSocketMessage = (data: any) => {
    console.log('🔗 [App] Processing WebSocket message:', data);
    
    // Handle screenshot processing
    if (data.type === 'screenshot_batch') {
      console.log("📸 Processing screenshot batch:", data);
      
      // Extract data from payload if it exists, otherwise use data directly
      const batchData = data.payload || data;
      
      if (batchData.images && batchData.images.length > 0) {
        // Process each image and send to MainApp
        batchData.images.forEach((imgSrc: string, index: number) => {
          // Ensure proper data URL format
          const properDataUrl = imgSrc.startsWith('data:') ? imgSrc : `data:image/png;base64,${imgSrc}`;
          
          // Send to MainApp if handler is available
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
      
      // Ensure proper data URL format
      const properDataUrl = data.success.dataUrl.startsWith('data:') 
        ? data.success.dataUrl 
        : `data:image/png;base64,${data.success.dataUrl}`;
      
      // Send to MainApp if handler is available
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
    
    // Update database to mark that user has seen how-to-use and skipped PC connection
    if (authState.user) {
      await onboardingService.updateOnboardingStatus(authState.user.authUserId, 'how-to-use', {
        has_seen_how_to_use: true,
        pc_connected: false,
        pc_connection_skipped: true
      });
      // Refresh user data to reflect the changes
      await authService.refreshUser();
    }
    
    // Skip directly to pro-features screen
    setAppState(prev => ({ 
      ...prev, 
      onboardingStatus: 'pro-features' 
    }));
  };

  const handleProfileSetupComplete = async (profileData: any) => {
    console.log('🎯 [App] Profile setup completed');
    if (authState.user) {
      // Mark profile setup as complete in database
      await onboardingService.updateOnboardingStatus(authState.user.authUserId, 'complete', {
        has_profile_setup: true,
        profile_data: profileData
      });
      // Refresh user data to reflect the changes
      await authService.refreshUser();
    }
  };

  const handleProfileSetupSkip = async () => {
    console.log('🎯 [App] Profile setup skipped');
    if (authState.user) {
      // Mark profile setup as skipped in database
      await onboardingService.updateOnboardingStatus(authState.user.authUserId, 'complete', {
        has_profile_setup: true,
        profile_setup_skipped: true
      });
      // Refresh user data to reflect the changes
      await authService.refreshUser();
    }
  };


  // Show AuthCallback component for OAuth callback
  if (window.location.pathname === '/auth/callback') {
    return (
      <AuthCallback
        onAuthSuccess={handleOAuthSuccess}
        onAuthError={handleOAuthError}
      />
    );
  }

  // Show loading screen while initializing or auth is loading
  // But don't show loading screen for first-time users (landing page)
  const shouldShowLoading = (isInitializing || authState.isLoading) && 
    !(appState.view === 'landing' && !hasEverLoggedIn);
  
  console.log('🎯 [App] Loading state check:', { 
    isInitializing, 
    authStateIsLoading: authState.isLoading, 
    shouldShowLoading,
    appStateView: appState.view,
    onboardingStatus: appState.onboardingStatus,
    hasUser: !!authState.user
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

  // Landing Page (only show if user is not authenticated)
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
        
        <AboutModal
          isOpen={activeModal === 'about'}
          onClose={closeModal}
        />
        
        <PrivacyModal
          isOpen={activeModal === 'privacy'}
          onClose={closeModal}
        />
        
        <TermsModal
          isOpen={activeModal === 'terms'}
          onClose={closeModal}
        />
        
        <RefundPolicyModal
          isOpen={activeModal === 'refund'}
          onClose={closeModal}
        />
        
        <ContactUsModal
          isOpen={activeModal === 'contact'}
          onClose={closeModal}
        />
      </>
    );
  }

  // Login Screen
  if (appState.onboardingStatus === 'login') {
    return (
      <LoginSplashScreen
        onComplete={handleLoginComplete}
        onBackToLanding={handleBackToLanding}
        onSetAppState={setAppState}
      />
    );
  }

  // Loading Screen (during auth processing)
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

  // Onboarding Screens
  if (authState.user && appState.view === 'app') {
    // Initial Splash Screen
    if (appState.onboardingStatus === 'initial') {
      return (
        <InitialSplashScreen
          onComplete={() => handleOnboardingComplete('initial')}
        />
      );
    }

        // How to Use Splash Screen (PC Connection)
        if (appState.onboardingStatus === 'how-to-use') {
          console.log('🎯 [App] Rendering SplashScreen (how-to-use) with status:', connectionStatus);
          console.log('🎯 [App] isInitializing:', isInitializing, 'authState.isLoading:', authState.isLoading);
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

    // Features Connected Splash Screen (Only if PC connection successful)
    if (appState.onboardingStatus === 'features-connected') {
      return (
        <HowToUseSplashScreen
          onComplete={async () => {
            console.log('🎯 [App] User completed Features Connected, going to pro-features');
            // Mark features-connected as seen and go to pro-features
            if (authState.user) {
              await onboardingService.updateOnboardingStatus(authState.user.authUserId, 'features-connected', {
                has_seen_features_connected: true
              });
              // Refresh user data to reflect the changes
              await authService.refreshUser();
            }
            // Go directly to pro-features screen
            setAppState(prev => ({ 
              ...prev, 
              onboardingStatus: 'pro-features' 
            }));
          }}
        />
      );
    }

    // Pro Features Splash Screen
    if (appState.onboardingStatus === 'pro-features') {
      return (
        <ProFeaturesSplashScreen
          onComplete={async () => {
            console.log('🎯 [App] User completed Pro Features, finishing onboarding');
            console.log('🎯 [App] Current authState.user.onboardingCompleted:', authState.user?.onboardingCompleted);
            
            // Mark pro features as seen and complete onboarding
            if (authState.user) {
              console.log('🎯 [App] Updating database with onboarding_completed: true');
              await onboardingService.updateOnboardingStatus(authState.user.authUserId, 'pro-features', {
                has_seen_pro_features: true,
                onboarding_completed: true
              });
              
              console.log('🎯 [App] Refreshing user data...');
              // Refresh user data to reflect the changes
              await authService.refreshUser();
              
              console.log('🎯 [App] User data refreshed, new onboardingCompleted:', authState.user?.onboardingCompleted);
            }
            
            console.log('🎯 [App] Setting onboardingStatus to complete');
            // Go directly to main app (chat screen)
            setAppState(prev => ({ 
              ...prev, 
              onboardingStatus: 'complete' 
            }));
            
            console.log('🎯 [App] App state updated to complete');
          }}
          onUpgrade={() => console.log('Upgrade clicked')}
          onUpgradeToVanguard={() => console.log('Upgrade to Vanguard clicked')}
        />
      );
    }

    // Profile Setup Modal - Show as overlay on main app (removed as separate step)

    // Main App (onboarding complete)
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
        
        {/* Profile Setup Modal - Show as overlay if user hasn't completed profile setup */}
        {authState.user && !authState.user.hasProfileSetup && (
          <PlayerProfileSetupModal
            isOpen={true}
            onComplete={handleProfileSetupComplete}
            onSkip={handleProfileSetupSkip}
          />
        )}
        
        <AboutModal
          isOpen={activeModal === 'about'}
          onClose={closeModal}
        />
        
        <PrivacyModal
          isOpen={activeModal === 'privacy'}
          onClose={closeModal}
        />
        
        <TermsModal
          isOpen={activeModal === 'terms'}
          onClose={closeModal}
        />
        
        <RefundPolicyModal
          isOpen={activeModal === 'refund'}
          onClose={closeModal}
        />
        
        <ContactUsModal
          isOpen={activeModal === 'contact'}
          onClose={closeModal}
        />
        
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          user={authState.user}
        />

        {/* Logout Confirmation Modal */}
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

  // Fallback
  return (
    <div className="h-screen bg-gradient-to-br from-background via-[#0F0F0F] to-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-text-muted">Something went wrong. Please refresh the page.</p>
      </div>
    </div>
  );
}

export default App;
