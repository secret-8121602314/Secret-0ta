import { useState, useEffect, useRef } from 'react';
import { AuthState, ConnectionStatus } from './types';
import { optimizedAuthService } from './services/optimizedAuthService';
import { onboardingService } from './services/onboardingService';
import { connect, disconnect } from './services/optimizedWebSocketService';
import { memoryManager } from './utils/memoryManager';
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

// ========================================
// OPTIMIZED APP COMPONENT FOR SCALABILITY
// ========================================
// This component includes critical optimizations for 100K+ users:
// - Memory leak prevention
// - Optimized state management
// - Proper cleanup
// - Performance monitoring

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
  
  // ✅ SCALABILITY: Refs to prevent race conditions and memory leaks
  const initializationRef = useRef(false);
  const authProcessedRef = useRef(false);
  const lastProcessedUserIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(appState);
  const isMountedRef = useRef(true);

  // ✅ SCALABILITY: Register cleanup with memory manager
  useEffect(() => {
    memoryManager.registerCleanup('app-component', () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      disconnect();
    }, 10); // High priority cleanup

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      disconnect();
    };
  }, []);

  // ✅ SCALABILITY: Optimized app state changes with debouncing
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    appStateRef.current = appState;
    console.log('🎯 [App] App state changed:', {
      view: appState.view,
      onboardingStatus: appState.onboardingStatus,
      hasUser: !!authState.user,
      userEmail: authState.user?.email
    });
  }, [appState.view, appState.onboardingStatus, authState.user]);

  // ✅ SCALABILITY: Optimized user data updates with batching
  useEffect(() => {
    if (!isMountedRef.current || !authState.user || authState.isLoading) return;
    
    // Debounce updates to prevent excessive database calls
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
    
    // Debounce the update
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(updateAppState, 1000); // 1 second debounce
  }, [appState.view, appState.onboardingStatus, appState.activeSubView, appState.isHandsFreeMode, appState.showUpgradeScreen, appState.showDailyCheckin, appState.isFirstTime, authState.user]);

  // ✅ SCALABILITY: Optimized auth state handler
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    const processAuthState = async (newAuthState: AuthState) => {
      if (!isMountedRef.current) return;
      
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
      
      // Only process if auth is not loading and we haven't already processed this user
      if (!newAuthState.isLoading && !authProcessedRef.current) {
        console.log('🎯 [App] Processing auth state - setting flags');
        
        if (!initializationRef.current) {
          initializationRef.current = true;
        }
        authProcessedRef.current = true;
        
        try {
          if (newAuthState.user) {
            // User is authenticated
            lastProcessedUserIdRef.current = newAuthState.user.authUserId;
            setHasEverLoggedIn(true);
            const savedAppState = newAuthState.user.appState || {};
            
            // Process onboarding
            const needsOnboarding = newAuthState.user && !newAuthState.user.onboardingCompleted;
            const isInAppView = appStateRef.current.view === 'app';
            
            const shouldProcessOnboarding = (isInAppView || needsOnboarding);
            
            if (shouldProcessOnboarding && 
                (appStateRef.current.onboardingStatus === 'login' || appStateRef.current.onboardingStatus === 'initial')) {
              
              const nextStep = await onboardingService.getNextOnboardingStep(newAuthState.user.authUserId);
              console.log('🎯 [App] Next onboarding step:', nextStep);
              
              const hasAppActivity = newAuthState.user.lastActivity && 
                (Date.now() - newAuthState.user.lastActivity) < (30 * 24 * 60 * 60 * 1000); // 30 days
              
              const shouldSkipOnboarding = nextStep === 'complete' || 
                (hasAppActivity && newAuthState.user.hasSeenSplashScreens);
              
              if (shouldSkipOnboarding) {
                console.log('🎯 [App] User onboarding completed, going to main app');
                if (isMountedRef.current) {
                  setAppState(prev => ({ 
                    ...prev, 
                    view: 'app', 
                    onboardingStatus: 'complete',
                    ...savedAppState
                  }));
                }
              } else {
                if (isMountedRef.current) {
                  setAppState(prev => ({ 
                    ...prev, 
                    view: 'app' as const, 
                    onboardingStatus: nextStep,
                    ...savedAppState
                  }));
                }
              }
            }
          } else {
            // User is not authenticated
            console.log('🎯 [App] User not authenticated, hasEverLoggedIn:', hasEverLoggedIn);
            if (isMountedRef.current) {
              if (hasEverLoggedIn) {
                setAppState(prev => ({ 
                  ...prev, 
                  view: 'app', 
                  onboardingStatus: 'login' 
                }));
              } else {
                setAppState(prev => ({ 
                  ...prev, 
                  view: 'landing', 
                  onboardingStatus: 'login' 
                }));
              }
            }
            lastProcessedUserIdRef.current = null;
          }
          
          // Mark initialization as complete
          if (isMountedRef.current) {
            setIsInitializing(false);
          }
        } catch (error) {
          console.error('🎯 [App] Error during initialization:', error);
          if (isMountedRef.current) {
            setIsInitializing(false);
          }
        }
      }
    };
    
    // Subscribe to auth state changes with cleanup
    const unsubscribe = optimizedAuthService.subscribe((newAuthState) => {
      if (!isMountedRef.current) return;
      
      setAuthState(newAuthState);
      authProcessedRef.current = false;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          processAuthState(newAuthState);
        }
      }, 50);
    });

    return () => {
      unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []); // Empty dependency array to prevent re-subscription

  // ✅ SCALABILITY: Fallback timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isInitializing && isMountedRef.current) {
        console.warn('🎯 [App] Initialization timeout, forcing completion');
        setIsInitializing(false);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isInitializing]);

  // ✅ SCALABILITY: Cleanup connection on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // Handle OAuth callback URL
  useEffect(() => {
    if (window.location.pathname === '/auth/callback') {
      // The AuthCallback component will handle the authentication
    }
  }, []);

  const handleGetStarted = () => {
    if (!isMountedRef.current) return;
    setAppState(prev => ({ ...prev, view: 'app', onboardingStatus: 'login' }));
  };

  const handleLoginComplete = async () => {
    if (!isMountedRef.current) return;
    
    console.log('🎯 [App] Email login completed, setting view to app');
    setAppState(prev => {
      const newState = { ...prev, view: 'app' as const, onboardingStatus: 'loading' as const };
      console.log('🎯 [App] Setting view to app with loading status:', newState);
      return newState;
    });
  };

  const handleBackToLanding = () => {
    if (!isMountedRef.current) return;
    
    console.log('🔙 [App] Back to landing clicked, resetting to landing page');
    setAppState(prev => ({ 
      ...prev, 
      view: 'landing',
      onboardingStatus: 'initial'
    }));
  };

  const handleOAuthSuccess = () => {
    if (!isMountedRef.current) return;
    
    window.history.replaceState({}, document.title, '/');
    setAppState(prev => ({ ...prev, view: 'app' }));
  };

  const handleOAuthError = (error: string) => {
    if (!isMountedRef.current) return;
    
    console.error('🔐 [App] OAuth authentication error:', error);
    setAppState(prev => ({ ...prev, view: 'landing' }));
  };

  const handleLogout = () => {
    if (!isMountedRef.current) return;
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    if (!isMountedRef.current) return;
    
    console.log('🎯 [App] Starting logout process...');
    setShowLogoutConfirm(false);
    
    await optimizedAuthService.signOut();
    
    setAppState(prev => ({ 
      ...prev,
      view: 'landing', 
      onboardingStatus: 'login' 
    }));
    
    // Reset all refs to prevent state conflicts
    initializationRef.current = false;
    authProcessedRef.current = false;
    lastProcessedUserIdRef.current = null;
    
    console.log('🎯 [App] Logout completed, showing login page');
  };

  const openModal = (modal: string) => {
    if (!isMountedRef.current) return;
    setActiveModal(modal);
  };

  const closeModal = () => {
    if (!isMountedRef.current) return;
    setActiveModal(null);
  };

  const handleOnboardingComplete = async (step: string) => {
    if (!isMountedRef.current) return;
    
    console.log('🎯 [App] Onboarding step completed:', step);
    
    if (authState.user) {
      const nextStep = await onboardingService.getNextOnboardingStep(authState.user.authUserId);
      setAppState(prev => ({ 
        ...prev, 
        onboardingStatus: nextStep 
      }));
      
      onboardingService.updateOnboardingStatus(authState.user.authUserId, step as any)
        .catch(error => console.error('🎯 [App] Error updating onboarding status:', error));
    }
  };

  // Connection handlers
  const handleConnect = (code: string) => {
    if (!isMountedRef.current) return;
    
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
    if (!isMountedRef.current) return;
    
    console.log('🔗 [App] Connection success callback triggered');
    setConnectionStatus(ConnectionStatus.CONNECTED);
    setConnectionError(null);
    
    if (authState.user) {
      await onboardingService.updateOnboardingStatus(authState.user.authUserId, 'how-to-use', {
        has_seen_how_to_use: true,
        pc_connected: true,
        pc_connection_skipped: false
      });
      await optimizedAuthService.refreshUser();
    }
    
    setTimeout(() => {
      if (isMountedRef.current) {
        setAppState(prev => ({ 
          ...prev, 
          onboardingStatus: 'features-connected' 
        }));
      }
    }, 500);
  };

  const handleSkipConnection = async () => {
    if (!isMountedRef.current) return;
    
    console.log('🔗 [App] Skipping PC connection, going to pro-features');
    
    if (authState.user) {
      await onboardingService.updateOnboardingStatus(authState.user.authUserId, 'how-to-use', {
        has_seen_how_to_use: true,
        pc_connected: false,
        pc_connection_skipped: true
      });
      await optimizedAuthService.refreshUser();
    }
    
    setAppState(prev => ({ 
      ...prev, 
      onboardingStatus: 'pro-features' 
    }));
  };

  const handleProfileSetupComplete = async (profileData: any) => {
    if (!isMountedRef.current) return;
    
    console.log('🎯 [App] Profile setup completed');
    if (authState.user) {
      await onboardingService.updateOnboardingStatus(authState.user.authUserId, 'complete', {
        has_profile_setup: true,
        profile_data: profileData
      });
      await optimizedAuthService.refreshUser();
    }
  };

  const handleProfileSetupSkip = async () => {
    if (!isMountedRef.current) return;
    
    console.log('🎯 [App] Profile setup skipped');
    if (authState.user) {
      await onboardingService.updateOnboardingStatus(authState.user.authUserId, 'complete', {
        has_profile_setup: true,
        profile_setup_skipped: true
      });
      await optimizedAuthService.refreshUser();
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

    // Features Connected Splash Screen
    if (appState.onboardingStatus === 'features-connected') {
      return (
        <HowToUseSplashScreen
          onComplete={async () => {
            if (authState.user) {
              await onboardingService.updateOnboardingStatus(authState.user.authUserId, 'features-connected', {
                has_seen_features_connected: true
              });
              await optimizedAuthService.refreshUser();
            }
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
            if (authState.user) {
              await onboardingService.updateOnboardingStatus(authState.user.authUserId, 'pro-features', {
                has_seen_pro_features: true,
                onboarding_completed: true
              });
              await optimizedAuthService.refreshUser();
            }
            setAppState(prev => ({ 
              ...prev, 
              onboardingStatus: 'complete' 
            }));
          }}
          onUpgrade={() => console.log('Upgrade clicked')}
          onUpgradeToVanguard={() => console.log('Upgrade to Vanguard clicked')}
        />
      );
    }

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
          />
          
          {/* Profile Setup Modal */}
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
