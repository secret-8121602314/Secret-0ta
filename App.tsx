import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ConnectionStatus, Conversation, Conversations, Insight, UserTier, Usage, ContextMenuState, ContextMenuItem, PendingInsightModification } from './services/types';
import { canAccessDeveloperFeatures } from './config/developer';
import ConnectionModal from './components/ConnectionModal';
import HandsFreeModal from './components/HandsFreeModal';
import DesktopIcon from './components/DesktopIcon';
import SplashScreen from './components/SplashScreen';
import InitialSplashScreen from './components/InitialSplashScreen';
import HowToUseSplashScreen from './components/HowToUseSplashScreen';
import LoginSplashScreen from './components/LoginSplashScreen';
import Logo from './components/Logo';
import ChatMessageComponent from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import SuggestedPrompts from './components/SuggestedPrompts';
import { useChat } from './hooks/useChat';
import { useConnection } from './hooks/useConnection';
import { useTutorial } from './hooks/useTutorial';
import { profileService } from './services/profileService';
import { longTermMemoryService } from './services/longTermMemoryService';
import { contextManagementService } from './services/contextManagementService';
import ConversationTabs from './components/ConversationTabs';
import ContactUsModal from './components/ContactUsModal';
import HandsFreeToggle from './components/HandsFreeToggle';
import { ttsService } from './services/ttsService';
import { unifiedUsageService } from './services/unifiedUsageService';
import { addFeedback } from './services/feedbackService';
import UpgradeSplashScreen from './components/UpgradeSplashScreen';
import ProFeaturesSplashScreen from './components/ProFeaturesSplashScreen';
import SubTabs from './components/SubTabs';
import UITutorial from './components/UITutorial';
import MainViewContainer from './components/MainViewContainer';

import CreditIndicator from './components/CreditIndicator';
import CreditModal from './components/CreditModal';
import ContextMenu from './components/ContextMenu';
import ConfirmationModal from './components/ConfirmationModal';
import InsightActionModal from './components/InsightActionModal';
import TrashIcon from './components/TrashIcon';
import PinIcon from './components/PinIcon';
import FeedbackModal from './components/FeedbackModal';
import SettingsIcon from './components/SettingsIcon';
import SettingsModal from './components/SettingsModal';
import AdBanner from './components/AdBanner';

import PolicyModal from './components/PolicyModal';
import AboutPage from './components/AboutPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import RefundPolicyPage from './components/RefundPolicyPage';
import EditIcon from './components/EditIcon';
import LogoutIcon from './components/LogoutIcon';
import UserIcon from './components/UserIcon';
import { authService, AuthState, supabase } from './services/supabase';
import AuthModal from './components/AuthModal';
import ErrorBoundary from './components/ErrorBoundary';
import AuthCallbackHandler from './components/AuthCallbackHandler';
import PWAInstallBanner from './components/PWAInstallBanner';
import { pwaNavigationService, PWANavigationState } from './services/pwaNavigationService';
import { smartNotificationService } from './services/smartNotificationService';
import { pwaAnalyticsService } from './services/pwaAnalyticsService';
import { offlineStorageService } from './services/offlineStorageService';
import { pushNotificationService } from './services/pushNotificationService';
import { appShortcutsService } from './services/appShortcutsService';
import { performanceMonitoringService } from './services/performanceMonitoringService';


import DailyCheckinBanner from './components/DailyCheckinBanner';


import AchievementNotification from './components/AchievementNotification';
import dailyEngagementService, { Achievement } from './services/dailyEngagementService';
import { PlayerProfileSetupModal } from './components/PlayerProfileSetupModal';
import { playerProfileService } from './services/playerProfileService';
import { suggestedPromptsService } from './services/suggestedPromptsService';
import { ProactiveInsightsPanel } from './components/ProactiveInsightsPanel';
import { useEnhancedInsights } from './hooks/useEnhancedInsights';
import { proactiveInsightService } from './services/proactiveInsightService';
import { databaseService } from './services/databaseService';
import { supabaseDataService } from './services/supabaseDataService';
import ScreenshotButton from './components/ScreenshotButton';
import CharacterImmersionTest from './components/CharacterImmersionTest';
import OtakuDiaryModal from './components/OtakuDiaryModal';
import WishlistModal from './components/WishlistModal';
import CachePerformanceDashboard from './components/CachePerformanceDashboard';


// A data URL for a 1-second silent WAV file. This prevents needing to host an asset
// and is used to keep the app process alive in the background for TTS.
const SILENT_AUDIO_URL = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

// Cache clearing function for first run experience testing
const clearFirstRunCache = () => {
  const keysToClear = [
    'otakonOnboardingComplete',
    'otakon_profile_setup_completed',
    'otakon_first_run_completed',
    'otakon_welcome_message_shown',
    'otakon_first_welcome_shown',
    'otakon_has_conversations',
    'otakon_has_interacted_with_chat',
    'otakon_last_welcome_time',
    'otakon_app_closed_time',
    'otakon_tutorial_completed',
    'otakon_tutorial_step',
    'otakon_tutorial_shown',
    'otakonAuthMethod',
    'otakonHasConnectedBefore',
    'otakonGlobalPWAInstalled',
    'otakonInstallDismissed',
    'otakon_screenshot_mode',
    'otakon_screenshot_hint_seen',
    'otakonPreferredVoiceURI',
    'otakonSpeechRate',
    'lastSuggestedPromptsShown',
    'otakon_used_suggested_prompts',
    'otakonConversations',
    'otakonUsage'
  ];

  let clearedCount = 0;
  keysToClear.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      clearedCount++;
    }
  });

  // Clear service worker cache
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => registration.unregister());
    });
  }

  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => caches.delete(cacheName));
    });
  }

  console.log(`🧹 Cleared ${clearedCount} localStorage keys and service worker cache`);
  console.log('🔄 First run experience cache has been reset. Refresh to see changes.');
  
  // Force reload to apply changes
  window.location.reload();
};

type ImageFile = { base64: string; mimeType: string; dataUrl: string };
type FeedbackModalState = {
    type: 'message' | 'insight';
    conversationId: string;
    targetId: string; // messageId or insightId
    originalText: string;
};
type ActiveModal = 'about' | 'privacy' | 'refund' | 'contact' | null;


const AppComponent: React.FC = () => {
    const [view, setView] = useState<'landing' | 'app'>('app');
    const [onboardingStatus, setOnboardingStatus] = useState<'login' | 'initial' | 'features' | 'pro-features' | 'how-to-use' | 'tier-splash' | 'complete'>(() => {
        // Check if localStorage is available before accessing it
        if (typeof window !== 'undefined' && window.localStorage) {
            // Check for developer mode first
            const isDeveloperMode = localStorage.getItem('otakon_developer_mode') === 'true';
            const authMethod = localStorage.getItem('otakonAuthMethod');
            const isDeveloperAuth = authMethod === 'skip';
            
            if (isDeveloperMode || isDeveloperAuth) {
                console.log('🔧 Developer mode detected on app startup, skipping login');
                return 'complete';
            }
            
            // For authenticated users, check if they've completed onboarding
            const hasCompletedOnboarding = localStorage.getItem('otakonOnboardingComplete');
            const hasCompletedProfileSetup = localStorage.getItem('otakon_profile_setup_completed');
            
            if (hasCompletedOnboarding && hasCompletedProfileSetup) {
                console.log('🔧 Returning user detected on app startup, skipping login');
                return 'complete';
            }
            
            // Default to login for new users
            return 'login';
        }
        return 'login';
    });
    const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
    const [isHandsFreeModalOpen, setIsHandsFreeModalOpen] = useState(false);
    const [isCacheDashboardOpen, setIsCacheDashboardOpen] = useState(false);
    const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [hasRestored, setHasRestored] = useState(false);
    const [isHandsFreeMode, setIsHandsFreeMode] = useState(false);
    const [isManualUploadMode, setIsManualUploadMode] = useState(false);
    const [showUpgradeScreen, setShowUpgradeScreen] = useState(false);
    const [usage, setUsage] = useState<Usage>({
        textCount: 0,
        imageCount: 0,
        textLimit: 55,
        imageLimit: 25,
        tier: 'free'
    });
    const [activeSubView, setActiveSubView] = useState('chat');
    const [imagesForReview, setImagesForReview] = useState<ImageFile[]>([]);
    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    
    // Authentication State
    const [authState, setAuthState] = useState<AuthState>(() => authService.getAuthState());
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    
    // PWA Navigation State
    const [pwaNavigationState, setPwaNavigationState] = useState<PWANavigationState>(() => pwaNavigationService.getNavigationState());
    
    // OAuth Callback State
    const [isOAuthCallback, setIsOAuthCallback] = useState(false);
    
    
    // Interactivity State
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [confirmationModal, setConfirmationModal] = useState<{ title: string; message: string; onConfirm: () => void; } | null>(null);
    const [feedbackModalState, setFeedbackModalState] = useState<FeedbackModalState | null>(null);
    const [chatInputValue, setChatInputValue] = useState('');

    // Daily Engagement State
    const [showDailyCheckin, setShowDailyCheckin] = useState(false);

    const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);

    
    // Player Profile Setup State
    const [showProfileSetup, setShowProfileSetup] = useState(false);
    const [isFirstTime, setIsFirstTime] = useState(() => {
        // Default to true for first-time users, will be updated by Supabase check
        return true;
    });
    const [isOtakuDiaryModalOpen, setIsOtakuDiaryModalOpen] = useState(false);
    const [otakuDiaryGameInfo, setOtakuDiaryGameInfo] = useState<{ id: string; title: string } | null>(null);
    
    // Enhanced Features State
    const [showProactiveInsights, setShowProactiveInsights] = useState(false);
    const [databaseSyncStatus, setDatabaseSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
    const [lastDatabaseSync, setLastDatabaseSync] = useState<number>(Date.now());
    const [lastSuggestedPromptsShown, setLastSuggestedPromptsShown] = useState<number>(0);
    
    // Welcome message session tracking to prevent duplicates
    const [welcomeMessageShownThisSession, setWelcomeMessageShownThisSession] = useState<boolean>(false);
    
    // Wishlist modal state
    const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
    
    // Track processed batches to prevent duplicates
    const processedBatches = useRef(new Set<string>());
    
    // Track processed single shots to prevent duplicates
    const processedSingleShots = useRef(new Set<string>());
    
    // Track when stop was last pressed to prevent immediate restart
    const lastStopTime = useRef<number>(0);
    const STOP_COOLDOWN_MS = 2000; // 2 second cooldown after stop
    
    // Track if cooldown message has been shown to prevent spam
    const cooldownMessageShown = useRef<boolean>(false);
    
    // Global stop flag to prevent new analysis from starting
    const isStopped = useRef<boolean>(false);
    
    // Ref to store the stop timeout for proper cleanup
    const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Note: Suggested prompts now reset automatically every 24 hours via suggestedPromptsService

    // Cleanup deduplication sets periodically to prevent memory issues
    useEffect(() => {
        const cleanupInterval = setInterval(() => {
            if (processedBatches.current.size > 100) { 
                processedBatches.current.clear(); 
                console.log("🧹 Cleaned up processed batches set"); 
            }
            if (processedSingleShots.current.size > 100) { 
                processedSingleShots.current.clear(); 
                console.log("🧹 Cleaned up processed single shots set"); 
            }
        }, 60000); // Clean up every minute
        
        return () => {
            clearInterval(cleanupInterval);
            // Also clear the stop timeout on cleanup
            if (stopTimeoutRef.current) {
                clearTimeout(stopTimeoutRef.current);
                stopTimeoutRef.current = null;
            }
        };
    }, []);
    
    // Note: Old multi-shot state variables removed - PC client now sends screenshot_batch messages

    const chatInputRef = useRef<HTMLTextAreaElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const silentAudioRef = useRef<HTMLAudioElement>(null);

    // Function to check current localStorage state (for debugging)
    const checkLocalStorageState = useCallback(() => {
        console.log('🔍 Current localStorage state:', {
            otakon_profile_setup_completed: localStorage.getItem('otakon_profile_setup_completed'),
            otakon_welcome_message_shown: localStorage.getItem('otakon_welcome_message_shown'),
            otakon_first_welcome_shown: localStorage.getItem('otakon_first_welcome_shown'),
            otakon_has_conversations: localStorage.getItem('otakon_has_conversations'),
            otakonOnboardingComplete: localStorage.getItem('otakonOnboardingComplete'),
            isFirstTime,
            view,
            onboardingStatus
        });
    }, [view, onboardingStatus, isFirstTime]);

    const refreshUsage = useCallback(async () => {
        try {
            // Add a small delay to ensure any pending backend updates have propagated
            await new Promise(resolve => setTimeout(resolve, 150));
            
            // Get the current tier directly without calling getUsage (which calls checkAndResetUsage)
            const currentTier = await unifiedUsageService.getCurrentTier();
            
            // Get the current usage data
            const syncedUsage = await unifiedUsageService.getUsage();
            
            // Ensure the tier is correct
            const updatedUsage = {
                ...syncedUsage,
                tier: currentTier
            };
            
            console.log('🔄 Refreshing usage with verified tier:', currentTier);
            setUsage(updatedUsage);
        } catch (error) {
            console.warn('Failed to refresh usage:', error);
        }
    }, []);

    // Authentication effect
    useEffect(() => {
        const unsubscribe = authService.subscribe((newAuthState) => {
            // Only log significant auth state changes to reduce console noise
            const hasUserChanged = !!authState.user !== !!newAuthState.user;
            const loadingChanged = authState.loading !== newAuthState.loading;
            
            if (hasUserChanged || loadingChanged) {
                console.log('📨 App received auth state update:', { 
                    hasUser: !!newAuthState.user, 
                    loading: newAuthState.loading,
                    error: newAuthState.error?.message 
                });
            }
            setAuthState(newAuthState);
            
            // If user is authenticated and we're still on login screen, transition
            if (newAuthState.user && !newAuthState.loading && onboardingStatus === 'login') {
                console.log('User authenticated, transitioning from login screen...');
                setOnboardingStatus('initial');
            }
        });
        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [onboardingStatus]);

    // NEW: Long-term session restoration on app startup - MOVED TO AFTER useChat

    // Handle authentication success - transition from login to initial splash screen
    useEffect(() => {
        console.log('Auth state change detected:', { 
            hasUser: !!authState.user, 
            loading: authState.loading, 
            onboardingStatus,
            authMethod: localStorage.getItem('otakonAuthMethod'),
            isDeveloperMode: localStorage.getItem('otakon_developer_mode') === 'true'
        });
        
        // Check for developer mode first
        const isDeveloperMode = localStorage.getItem('otakon_developer_mode') === 'true';
        const authMethod = localStorage.getItem('otakonAuthMethod');
        const isDeveloperAuth = authMethod === 'skip';
        
        if ((isDeveloperMode || isDeveloperAuth) && onboardingStatus === 'login') {
            console.log('🔧 Developer mode detected on login screen, transitioning to app');
            setOnboardingStatus('complete');
            setView('app');
        }
        // Only transition if user just became authenticated and we're on login screen
        else if (authState.user && !authState.loading && onboardingStatus === 'login') {
            console.log('User authenticated on login screen, checking for recent auth...');
            
            // Check if this is a fresh authentication (not a page reload with existing session)
            const authMethod = localStorage.getItem('otakonAuthMethod');
            const hasRecentAuth = authMethod && (authMethod === 'google' || authMethod === 'discord');
            
            console.log('Auth method check:', { authMethod, hasRecentAuth });
            
            if (hasRecentAuth) {
                console.log('Authentication successful, transitioning to initial splash screen...');
                
                // Clear the auth method to prevent re-triggering
                localStorage.removeItem('otakonAuthMethod');
                
                // Check if user has already completed onboarding
                const hasCompletedOnboarding = localStorage.getItem('otakonOnboardingComplete');
                const hasCompletedProfileSetup = localStorage.getItem('otakon_profile_setup_completed');
                
                console.log('Onboarding check:', { hasCompletedOnboarding, hasCompletedProfileSetup });
                
                // Check if we should show splash screens after logout
                const shouldShowSplashAfterLogin = localStorage.getItem('otakon_show_splash_after_login');
                
                if (shouldShowSplashAfterLogin === 'true') {
                    // Clear the flag and show initial splash screens
                    localStorage.removeItem('otakon_show_splash_after_login');
                    console.log('Fresh login after logout detected, showing initial splash screens');
                    setOnboardingStatus('initial');
                    setView('app');
                } else if (hasCompletedOnboarding && hasCompletedProfileSetup) {
                    // Returning user - skip to complete status
                    console.log('Returning user, skipping to complete status');
                    setOnboardingStatus('complete');
                    setView('app');
                } else {
                    // New user - go to initial splash screen
                    console.log('New user, going to initial splash screen');
                    setOnboardingStatus('initial');
                    setView('app');
                }
            } else {
                console.log('No recent auth method found, staying on login screen');
            }
        }
    }, [authState.user, authState.loading, onboardingStatus]);

    // Fallback: Check for OAuth completion after a delay (in case auth state change is delayed)
    useEffect(() => {
        if (onboardingStatus === 'login' && !authState.loading) {
            const authMethod = localStorage.getItem('otakonAuthMethod');
            if (authMethod && (authMethod === 'google' || authMethod === 'discord')) {
                console.log('Fallback: Checking for delayed OAuth completion...');
                
                const checkAuthCompletion = setTimeout(async () => {
                    console.log('Fallback: Checking auth state after delay...');
                    
                    // Check if we have OAuth parameters in the URL
                    const hashParams = new URLSearchParams(window.location.hash.substring(1));
                    const hasOAuthParams = hashParams.has('access_token') || hashParams.has('refresh_token');
                    
                    if (hasOAuthParams) {
                        console.log('Fallback: OAuth parameters still in URL, forcing completion...');
                        
                        // Try to get user directly
                        const { data: { user }, error } = await supabase.auth.getUser();
                        if (user) {
                            console.log('Fallback: User found, transitioning...');
                            localStorage.removeItem('otakonAuthMethod');
                            setOnboardingStatus('initial');
                            setView('app');
                        } else {
                            console.log('Fallback: No user found, but OAuth params exist - forcing transition anyway');
                            localStorage.removeItem('otakonAuthMethod');
                            setOnboardingStatus('initial');
                            setView('app');
                        }
                    } else if (authState.user && onboardingStatus === 'login') {
                        console.log('Fallback: OAuth completed, transitioning...');
                        localStorage.removeItem('otakonAuthMethod');
                        
                        const hasCompletedOnboarding = localStorage.getItem('otakonOnboardingComplete');
                        const hasCompletedProfileSetup = localStorage.getItem('otakon_profile_setup_completed');
                        
                        // For OAuth fallback, always start with initial splash screen
                        console.log('OAuth fallback - ensuring first-time experience');
                        setOnboardingStatus('initial');
                        setView('app');
                    }
                }, 3000); // Wait 3 seconds for auth state to update
                
                return () => clearTimeout(checkAuthCompletion);
            }
        }
    }, [onboardingStatus, authState.user, authState.loading]);

    // Load usage data on mount
    useEffect(() => {
        const loadUsageData = async () => {
            try {
                const usageData = await unifiedUsageService.getUsage();
                setUsage(usageData);
            } catch (error) {
                console.warn('Failed to load usage data:', error);
            }
        };
        
        loadUsageData();
    }, []);

    
    // PWA Navigation effect - handle post-install navigation
    useEffect(() => {
        if (pwaNavigationState.isRunningInPWA) {
            const recommendedPath = pwaNavigationService.getRecommendedNavigationPath();
            
            if (recommendedPath === 'login' && onboardingStatus !== 'login') {
                // PWA installed, user not logged in - show login
                setOnboardingStatus('login');
                setView('app');
            } else if (recommendedPath === 'chat' && onboardingStatus !== 'complete') {
                // PWA installed, user logged in - go to main app
                setOnboardingStatus('complete');
                setView('app');
            }
        }
    }, [pwaNavigationState, onboardingStatus]);

    // Initialize suggested prompts cooldown from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('lastSuggestedPromptsShown');
        if (stored) {
            setLastSuggestedPromptsShown(parseInt(stored, 10));
        }
        
        // Debug: Check localStorage state on mount
        if (import.meta.env.DEV) {
            setTimeout(() => {
                checkLocalStorageState();
            }, 1000);
            

        }
    }, [checkLocalStorageState]);
    
    // Handle app visibility changes to track when user returns after 12+ hours
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (!document.hidden) {
                // App became visible - check if we should show welcome message
                const lastWelcomeTime = localStorage.getItem('otakon_last_welcome_time');
                const appClosedTime = localStorage.getItem('otakon_app_closed_time');
                
                if (lastWelcomeTime || appClosedTime) {
                    const timeSinceLastWelcome = lastWelcomeTime ? Date.now() - parseInt(lastWelcomeTime, 10) : 0;
                    const timeSinceAppClosed = appClosedTime ? Date.now() - parseInt(appClosedTime, 10) : 0;
                    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
                    
                    if (timeSinceLastWelcome >= TWELVE_HOURS_MS || timeSinceAppClosed >= TWELVE_HOURS_MS) {
                        // Reset welcome message tracking to show it again
                        localStorage.removeItem('otakon_welcome_message_shown');
                        console.log('🔄 App returned after 12+ hours - welcome message will show again');
                    }
                }
                
                // Check if user has completed first run experience (created game conversations)
                if (!localStorage.getItem('otakon_first_run_completed')) {
                    const hasGameConversations = Object.values(conversations).some(conv => 
                        conv.id !== 'everything-else' && conv.title && conv.title !== 'New Game'
                    );
                    
                    if (hasGameConversations) {
                        localStorage.setItem('otakon_first_run_completed', 'true');
                        
                        // Also mark in Supabase if possible
                        try {
                            await playerProfileService.markFirstRunCompleted();
                            console.log('🎮 First run experience completed - marked in both localStorage and Supabase');
                        } catch (error) {
                            console.warn('Failed to mark first run completed in Supabase:', error);
                            console.log('🎮 First run experience completed - marked in localStorage only');
                        }
                    }
                }
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Track when user closes the app
        const handleBeforeUnload = () => {
            localStorage.setItem('otakon_app_closed_time', Date.now().toString());
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);





    // PWA Post-install handler
    useEffect(() => {
        if (pwaNavigationState.isPWAInstalled && !pwaNavigationState.isRunningInPWA) {
            // PWA was just installed, handle post-install flow
            console.log('PWA Navigation: PWA just installed, handling post-install flow');
            
            // Check if user is already logged in
            if (authState.user && !authState.loading) {
                // User is logged in, go directly to main app
                setOnboardingStatus('complete');
                setView('app');
            } else {
                // User not logged in, show login
                setOnboardingStatus('login');
                setView('app');
            }
        }
    }, [pwaNavigationState.isPWAInstalled, pwaNavigationState.isRunningInPWA, authState.user, authState.loading]);
    
    // Initialize performance monitoring
    useEffect(() => {
        performanceMonitoringService.initialize();
        console.log('🚀 Performance monitoring initialized');
    }, []);

    // Check for OAuth callback on component mount
    useEffect(() => {
        const checkOAuthCallback = async () => {
            // First, try the auth service's OAuth callback handler
            const callbackHandled = await authService.handleOAuthCallback();
            if (callbackHandled) {
                console.log('✅ OAuth callback handled by auth service');
                return;
            }
            
            // Check if we're returning from an OAuth flow
            const urlParams = new URLSearchParams(window.location.search);
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            
            console.log('Checking for OAuth callback...', {
                url: window.location.href,
                search: window.location.search,
                hash: window.location.hash,
                urlParams: Object.fromEntries(urlParams),
                hashParams: Object.fromEntries(hashParams)
            });
            
            // Check for Supabase OAuth callback parameters (both query params and hash params)
            const hasAuthParams = urlParams.has('access_token') || 
                                urlParams.has('refresh_token') || 
                                urlParams.has('error') ||
                                urlParams.has('code') ||
                                hashParams.has('access_token') ||
                                hashParams.has('refresh_token') ||
                                hashParams.has('error') ||
                                hashParams.has('code') ||
                                window.location.pathname.includes('auth/callback');
            
            if (hasAuthParams) {
                console.log('OAuth callback detected, parameters:', Object.fromEntries([...urlParams, ...hashParams]));
                setIsOAuthCallback(true);
                
                // Clear the URL immediately to prevent multiple processing
                console.log('Clearing OAuth parameters from URL...');
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // Extract tokens before clearing URL
                const accessToken = hashParams.get('access_token') || urlParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token') || urlParams.get('refresh_token');
                
                // Force Supabase to process the OAuth callback
                console.log('Forcing Supabase to process OAuth callback...');
                try {
                    // Wait a moment for Supabase to process the OAuth response
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // First, try to get the current session
                    const { data: { session }, error } = await supabase.auth.getSession();
                    console.log('Initial session check:', { session: !!session, error });
                    
                    if (error) {
                        console.error('Error getting session after OAuth callback:', error);
                    } else if (session) {
                        console.log('Session found after OAuth callback:', session);
                        // Force the auth state to update
                        console.log('Forcing auth state update...');
                        // Trigger a manual auth state change
                        setTimeout(() => {
                            console.log('Manual auth state update triggered');
                        }, 100);
                    } else {
                        console.log('No session found, trying to process OAuth callback...');
                        // Try to process the OAuth callback with the tokens from URL
                        if (accessToken && refreshToken) {
                            console.log('Processing OAuth callback with tokens...');
                            const { data, error: setSessionError } = await supabase.auth.setSession({
                                access_token: accessToken,
                                refresh_token: refreshToken
                            });
                            
                            if (setSessionError) {
                                console.error('Error setting session:', setSessionError);
                            } else if (data.session) {
                                console.log('Session set successfully:', data.session);
                                // Force transition
                                localStorage.removeItem('otakonAuthMethod');
                                setOnboardingStatus('initial');
                                setView('app');
                                setAuthState({ user: data.user, session: data.session, loading: false, error: null });
                            }
                        } else {
                            console.log('No tokens available for session processing');
                        }
                    }
                    
                    // Also try to get the user directly
                    const { data: { user }, error: userError } = await supabase.auth.getUser();
                    console.log('Direct user check:', { user: !!user, error: userError });
                    
                    if (user) {
                        console.log('User found directly:', user);
                        // Force transition since we have a user
                        console.log('User found, forcing transition to initial splash screen...');
                        localStorage.removeItem('otakonAuthMethod');
                        setOnboardingStatus('initial');
                        setView('app');
                        
                        // Force auth state update
                        setAuthState({ user, session, loading: false, error: null });
                    } else {
                        // If no user found, try to manually process the OAuth callback
                        console.log('No user found, trying manual OAuth processing...');
                        
                        if (accessToken) {
                            console.log('Access token found in URL, attempting manual session creation...');
                            try {
                                // Try to set the session manually
                                const { data, error } = await supabase.auth.setSession({
                                    access_token: accessToken,
                                    refresh_token: refreshToken || ''
                                });
                                
                                if (error) {
                                    console.error('Error setting session manually:', error);
                                } else if (data.session) {
                                    console.log('Session set manually successfully:', data.session);
                                    // Force transition
                                    localStorage.removeItem('otakonAuthMethod');
                                    setOnboardingStatus('initial');
                                    setView('app');
                                    
                                    // Force auth state update
                                    setAuthState({ user: data.session.user, session: data.session, loading: false, error: null });
                                }
                            } catch (error) {
                                console.error('Error in manual session creation:', error);
                            }
                        }
                    }
                    
                } catch (error) {
                    console.error('Error processing OAuth callback:', error);
                }
            } else {
                console.log('No OAuth callback parameters found');
            }
        };
        
        // Only check for OAuth callback if we're on the login screen
        if (onboardingStatus === 'login') {
            checkOAuthCallback();
        }
    }, [onboardingStatus]);

    // Direct app access - no migration needed
    useEffect(() => {
        // Check for developer mode first
        const isDeveloperMode = localStorage.getItem('otakon_developer_mode') === 'true';
        const authMethod = localStorage.getItem('otakonAuthMethod');
        const isDeveloperAuth = authMethod === 'skip';
        
        if (isDeveloperMode || isDeveloperAuth) {
            console.log('🔧 Developer mode detected, going directly to main app');
            setOnboardingStatus('complete');
            setView('app');
        } else if (authState.user && !authState.loading) {
            console.log('✅ User authenticated, going directly to main app (no migration needed)');
            setOnboardingStatus('complete');
            setView('app');
        }
    }, [authState.user, authState.loading]);

    // Sync usage with Supabase when authenticated
    useEffect(() => {
        if (authState.user && !authState.loading) {
            refreshUsage();
        }
    }, [authState.user, authState.loading]);

    useEffect(() => {
        ttsService.init(); // Initialize TTS service on app load.

        const handler = (e: Event) => {
            e.preventDefault();
            console.log('beforeinstallprompt event captured.');
            // setInstallPrompt(e); // This line is removed
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    // Initialize PWA-related services
    useEffect(() => {
        const initializePWAServices = async () => {
            try {
                // Initialize offline storage
                if (offlineStorageService.isAvailable()) {
                    await offlineStorageService.initialize();
                    console.log('Offline storage initialized');
                }

                // Initialize app shortcuts
                if (appShortcutsService.isSupported()) {
                    await appShortcutsService.installShortcuts();
                    console.log('App shortcuts initialized');
                }

                // Track session start
                pwaAnalyticsService.trackSessionStart();
                console.log('PWA analytics initialized');

                // Note: Notification services are initialized on-demand, not at startup
                // to avoid confusing permission requests
                // 
                // IMPORTANT: Otakon does NOT need browser screen/audio permissions!
                // Screenshots are captured by the external PC client and sent via WebSocket.
                // The browser only displays the UI and processes chat responses.
                
            } catch (error) {
                console.error('Failed to initialize PWA services:', error);
            }
        };

        initializePWAServices();
    }, []);

    // Daily Engagement Effects
    useEffect(() => {
        console.log('Daily Engagement Effect - view:', view, 'onboardingStatus:', onboardingStatus, 'usage.tier:', usage.tier);
        
        // Show daily engagement during app usage
        if (view === 'app') {
            console.log('Checking daily engagement conditions...');
            
            // Check if we should show daily check-in (unchanged behavior)
            const shouldShowCheckin = dailyEngagementService.shouldShowDailyCheckin();
            console.log('Should show daily checkin:', shouldShowCheckin);
            if (shouldShowCheckin) {
                console.log('Setting showDailyCheckin to true');
                setShowDailyCheckin(true);
            }
            
            // Session continuation is handled after conversations are available
            

        }
    }, [view, onboardingStatus, usage.tier]);

    // Player Profile Setup Check - Only run once per session
    useEffect(() => {
        if (view === 'app' && onboardingStatus === 'complete') {
            // Check if user has already completed profile setup in this session
            const hasCheckedThisSession = sessionStorage.getItem('otakon_profile_checked_this_session') === 'true';
            
            if (!hasCheckedThisSession) {
                // Mark that we've checked this session to prevent repeated checks
                sessionStorage.setItem('otakon_profile_checked_this_session', 'true');
                
                console.log('🔍 Starting profile setup check');
                
                // Check if user needs profile setup using Supabase
                const checkProfileSetup = async () => {
                    try {
                        const needsProfile = await playerProfileService.needsProfileSetup();
                        console.log('🔍 Profile setup check result:', { needsProfile, isFirstTime });
                        
                        if (needsProfile) {
                            console.log('✅ User needs profile setup - showing modal');
                            setIsFirstTime(true);
                            setShowProfileSetup(true);
                        } else {
                            console.log('✅ User doesn\'t need profile setup - profile already exists');
                            // Profile already exists in Supabase, no need to mark anything
                        }
                    } catch (error) {
                        console.error('❌ Error checking profile setup:', error);
                        // Fallback: show profile setup if there's an error
                        setIsFirstTime(true);
                        setShowProfileSetup(true);
                    }
                };
                checkProfileSetup();
            } else {
                console.log('🔍 Profile setup check skipped - already checked this session');
            }
        }
    }, [view, onboardingStatus]);

    const {
        conversations,
        conversationsOrder,
        reorderConversations,
        activeConversationId,
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
        markInsightAsRead,
        saveConversationsToLocalStorage,
        pinConversation,
        deleteConversation,
        deleteInsight,
        reorderInsights,
        pendingModification,
        setPendingModification,
        overwriteInsight,
        createNewInsight,
        updateMessageFeedback,
        updateInsightFeedback,
        retryMessage,
        updateConversation, // 🔥 ADDED: For enhanced insights integration

    } = useChat(isHandsFreeMode);
    
    // NEW: Long-term session restoration on app startup
    useEffect(() => {
        const restoreLongTermSessions = async () => {
            if (authState.user && !authState.loading) {
                try {
                    console.log('🧠 Restoring long-term sessions...');
                    
                    // Use statically imported services
                    
                    // Restore sessions for all active conversations
                    for (const [conversationId, conversation] of Object.entries(conversations)) {
                        if (conversationId !== 'everything-else') {
                            try {
                                // Initialize long-term session
                                await longTermMemoryService.initializeLongTermSession(conversationId, conversationId);
                                
                                // Restore context from database
                                await contextManagementService.restoreLongTermSession(conversationId);
                                
                                console.log(`✅ Restored long-term session for: ${conversationId}`);
                            } catch (error) {
                                console.warn(`⚠️ Failed to restore session for ${conversationId}:`, error);
                            }
                        }
                    }
                    
                    console.log('🧠 Long-term session restoration completed');
                } catch (error) {
                    console.error('❌ Failed to restore long-term sessions:', error);
                }
            }
        };

        restoreLongTermSessions();
    }, [authState.user, authState.loading, conversations]);
    
    // Tutorial hook for first-time users
    const {
        isTutorialOpen,
        hasCompletedTutorial,
        shouldShowTutorial,
        openTutorial,
        closeTutorial,
        completeTutorial,
        skipTutorial
    } = useTutorial();
    
    // Helper function to get time-based greeting
    const getTimeGreeting = useCallback(() => {
        const currentHour = new Date().getHours();
        if (currentHour < 12) {
            return 'Good morning! ';
        } else if (currentHour < 17) {
            return 'Good afternoon! ';
        } else {
            return 'Good evening! ';
        }
    }, []);
    
    // Track first-time experience and show welcome message using Supabase
    useEffect(() => {
        const checkFirstTimeExperience = async () => {
            try {
                // Check if we should show welcome message using Supabase
                const shouldShow = await supabaseDataService.shouldShowWelcomeMessage();
                console.log('🔍 Supabase welcome message check:', { shouldShow, isFirstTime });
                
                if (shouldShow && isFirstTime) {
                    // Show welcome message for first-time users
                    const timeGreeting = getTimeGreeting();
                    
                    // Get user's first name for personalization
                    let firstName = '';
                    try {
                        const fullName = await profileService.getName();
                        if (fullName) {
                            const first = fullName.trim().split(' ')[0];
                            firstName = first ? `, ${first}` : '';
                        }
                    } catch (error) {
                        console.warn('Failed to get user name for welcome message:', error);
                    }
                    
                    const welcomeMessage = `${timeGreeting}Welcome to Otagon${firstName}!\n\n**Your Personal Gaming Companion**\n\n**What I can help you with:**\n• Upload screenshots from games you're playing\n• Get spoiler-free guidance and hints\n• Discover secrets and strategies\n• Track your gaming progress\n• Answer questions about any game\n\n**Let's get started!** Upload a screenshot from a game you're currently playing, or just tell me what you'd like help with.`;
                    
                    console.log('Adding first-time welcome message:', welcomeMessage);
                    addSystemMessage(welcomeMessage, 'everything-else', false);
                    
                    // Update welcome message shown in Supabase
                    await supabaseDataService.updateWelcomeMessageShown('first_time');
                    
                    // Mark as no longer first-time
                    setIsFirstTime(false);
                }
                
                // Check if user has had conversations before
                const hasConversations = Object.keys(conversations).length > 1 || // More than just 'everything-else'
                    Object.values(conversations).some(conv => conv.messages && conv.messages.length > 0);
                
                if (hasConversations && isFirstTime) {
                    // User has had conversations, mark as no longer first-time
                    setIsFirstTime(false);
                    console.log('🎯 User has had conversations - no longer first-time');
                }
            } catch (error) {
                console.error('Error checking first-time experience:', error);
                // Fallback: show welcome message if there's an error
                if (isFirstTime) {
                    const timeGreeting = getTimeGreeting();
                    const welcomeMessage = `${timeGreeting}Welcome to Otagon!\n\n**Your Personal Gaming Companion**\n\n**What I can help you with:**\n• Upload screenshots from games you're playing\n• Get spoiler-free guidance and hints\n• Discover secrets and strategies\n• Track your gaming progress\n• Answer questions about any game\n\n**Let's get started!** Upload a screenshot from a game you're currently playing, or just tell me what you'd like help with.`;
                    
                    console.log('Fallback: Adding first-time welcome message:', welcomeMessage);
                    addSystemMessage(welcomeMessage, 'everything-else', false);
                    setIsFirstTime(false);
                }
            }
        };
        
        checkFirstTimeExperience();
    }, [conversations, isFirstTime, addSystemMessage, getTimeGreeting]);
    
    // Enhanced Insights Hook
    const enhancedInsights = useEnhancedInsights(
        activeConversationId,
        activeConversation?.id,
        activeConversation?.genre,
        activeConversation?.progress,
        // 🔥 CRITICAL INTEGRATION: Connect enhanced insights to main conversation system
        (newInsights, newInsightsOrder) => {
            if (activeConversation && activeConversation.id !== 'everything-else') {
                console.log('🔄 Enhanced insights callback triggered for conversation:', activeConversation.id);
                console.log('🔄 New insights received:', newInsights);
                console.log('🔄 New insights order:', newInsightsOrder);
                
                // Always ensure Otaku Diary tab exists and is preserved
                const otakuDiaryInsight = {
                    id: 'otaku-diary',
                    title: '📖 Otaku Diary',
                    content: '📝 **Your Personal Game Diary**\n\n✨ Track your tasks and favorite moments\n\n🎯 **Features:**\n• Create and manage to-do lists\n• Save favorite AI responses and insights\n• Track your gaming progress\n• Organize your thoughts and discoveries\n\n🚀 **Available for all users!**',
                    status: 'loaded' as const,
                    isNew: false,
                    lastUpdated: Date.now()
                };
                
                // Start with existing insights to preserve Otaku Diary
                const existingInsights = activeConversation.insights || {};
                
                // Add enhanced insights, but ensure Otaku Diary is preserved
                const updatedInsights = { 
                    ...existingInsights,  // Keep existing insights (including Otaku Diary)
                    ...newInsights,       // Add enhanced insights
                    'otaku-diary': otakuDiaryInsight // Always ensure Otaku Diary exists
                };
                
                // Create insights order with Otaku Diary first, then existing insights, then enhanced insights
                const existingOrder = activeConversation.insightsOrder || [];
                const enhancedOrder = newInsightsOrder.filter(id => id !== 'otaku-diary'); // Remove Otaku Diary from enhanced order
                const updatedInsightsOrder = ['otaku-diary', ...existingOrder.filter(id => id !== 'otaku-diary'), ...enhancedOrder];
                
                // Remove duplicates from insightsOrder
                const uniqueInsightsOrder = [...new Set(updatedInsightsOrder)];
                
                console.log('🔄 Final updated insights:', updatedInsights);
                console.log('🔄 Final updated insights order:', uniqueInsightsOrder);
                
                // Update the conversation with new insights
                updateConversation(activeConversation.id, (convo) => ({
                    ...convo,
                    insights: updatedInsights,
                    insightsOrder: uniqueInsightsOrder
                }));
                
                console.log(`🔄 Integrated ${Object.keys(newInsights).length} enhanced insights to conversation: ${activeConversation.id} (Otaku Diary preserved and prioritized)`);
            }
        }
    );
    
    // 🔥 CRITICAL INTEGRATION: Ensure all game conversations have Otaku Diary tab
    useEffect(() => {
        if (activeConversation && activeConversation.id !== 'everything-else') {
            // Add a safeguard to prevent running this effect too many times for the same conversation
            const hasRunKey = `otaku-diary-check-${activeConversation.id}`;
            if (sessionStorage.getItem(hasRunKey)) {
                console.log(`✅ Otaku Diary check already completed for conversation: ${activeConversation.id}`);
                return;
            }
            
            console.log(`🔍 Checking Otaku Diary for conversation: ${activeConversation.id}`);
            console.log(`🔍 Current insights:`, activeConversation.insights);
            console.log(`🔍 Current insightsOrder:`, activeConversation.insightsOrder);
            console.log(`🔍 Current activeSubView:`, activeSubView);
            
            const hasOtakuDiary = activeConversation.insights?.['otaku-diary'];
            
            if (!hasOtakuDiary) {
                console.log(`🔄 Adding missing Otaku Diary tab to conversation: ${activeConversation.id}`);
                
                // Create Otaku Diary tab
                const otakuDiaryInsight = {
                    id: 'otaku-diary',
                    title: '📖 Otaku Diary',
                    content: '📝 **Your Personal Game Diary**\n\n✨ Track your tasks and favorite moments\n\n🎯 **Features:**\n• Create and manage to-do lists\n• Save favorite AI responses and insights\n• Track your gaming progress\n• Organize your thoughts and discoveries\n\n🚀 **Available for all users!**',
                    status: 'loaded' as const,
                    isNew: false,
                    lastUpdated: Date.now()
                };
                
                // Update conversation with Otaku Diary tab
                const updatedInsights = { ...(activeConversation.insights || {}), 'otaku-diary': otakuDiaryInsight };
                const updatedInsightsOrder = ['otaku-diary', ...(activeConversation.insightsOrder || []).filter(id => id !== 'otaku-diary')];
                
                // Remove duplicates from insightsOrder
                const uniqueInsightsOrder = [...new Set(updatedInsightsOrder)];
                
                updateConversation(activeConversation.id, (convo) => ({
                    ...convo,
                    insights: updatedInsights,
                    insightsOrder: uniqueInsightsOrder
                }));
                
                console.log(`✅ Added Otaku Diary tab to conversation: ${activeConversation.id}`);
                console.log(`✅ Updated insights:`, updatedInsights);
                console.log(`✅ Updated insightsOrder:`, uniqueInsightsOrder);
            } else {
                console.log(`✅ Otaku Diary tab already exists for conversation: ${activeConversation.id}`);
            }
            
            // Mark this check as completed
            sessionStorage.setItem(hasRunKey, 'true');
        }
    }, [activeConversation?.id]); // Only depend on the ID, not the entire object or updateConversation
    
    // 🔥 AGGRESSIVE INTEGRATION: Force Otaku Diary tab creation for all game conversations
    useEffect(() => {
        // Only run this effect once when conversations are first loaded, not on every change
        if (Object.keys(conversations).length === 0) return;
        
        // Add a safeguard to prevent running this effect too many times
        const hasRunKey = `otaku-diary-integration-${Object.keys(conversations).length}`;
        if (sessionStorage.getItem(hasRunKey)) {
            console.log('✅ Otaku Diary integration already completed for current conversation set');
            return;
        }
        
        // Get all game conversations (excluding 'everything-else')
        const gameConversations = Object.values(conversations).filter(conv => conv.id !== 'everything-else');
        
        // Check if any conversations need Otaku Diary tabs
        const conversationsNeedingOtakuDiary = gameConversations.filter(conversation => 
            !conversation.insights?.['otaku-diary']
        );
        
        if (conversationsNeedingOtakuDiary.length === 0) {
            console.log('✅ All game conversations already have Otaku Diary tabs');
            sessionStorage.setItem(hasRunKey, 'true');
            return;
        }
        
        console.log(`🔄 Adding Otaku Diary tabs to ${conversationsNeedingOtakuDiary.length} conversations`);
        
        conversationsNeedingOtakuDiary.forEach(conversation => {
            console.log(`🔄 Force-adding Otaku Diary tab to conversation: ${conversation.id}`);
            
            // Create Otaku Diary tab
            const otakuDiaryInsight = {
                id: 'otaku-diary',
                title: '📖 Otaku Diary',
                content: '📝 **Your Personal Game Diary**\n\n✨ Track your tasks and favorite moments\n\n🎯 **Features:**\n• Create and manage to-do lists\n• Save favorite AI responses and insights\n• Track your gaming progress\n• Organize your thoughts and discoveries\n\n🚀 **Available for all users!**',
                status: 'loaded' as const,
                isNew: false,
                lastUpdated: Date.now()
            };
            
            // Update conversation with Otaku Diary tab
            const updatedInsights = { ...(conversation.insights || {}), 'otaku-diary': otakuDiaryInsight };
            const updatedInsightsOrder = ['otaku-diary', ...(conversation.insightsOrder || []).filter(id => id !== 'otaku-diary')];
            
            // Remove duplicates from insightsOrder
            const uniqueInsightsOrder = [...new Set(updatedInsightsOrder)];
            
            updateConversation(conversation.id, (convo) => ({
                ...convo,
                insights: updatedInsights,
                insightsOrder: uniqueInsightsOrder
            }));
            
            console.log(`✅ Force-added Otaku Diary tab to conversation: ${conversation.id}`);
        });
        
        // Mark this integration as completed
        sessionStorage.setItem(hasRunKey, 'true');
    }, [conversations]); // Remove updateConversation dependency to prevent infinite loop
    
    // Enhanced suggested prompts logic that can access conversations
    const shouldShowSuggestedPromptsEnhanced = useCallback((): boolean => {
        // Only show suggested prompts based on normal logic, not development mode
        
        // Show prompts if:
        // 1. First run experience (isFirstTime is true)
        // 2. No messages in conversation (first time or cleared)
        // 3. User hasn't interacted with chat yet (no text queries or images)
        // 4. Game pill hasn't been created yet (keep available in "Everything Else" tab)
        // 5. No loading messages (hide when user is actively interacting)
        
        const hasInteractedWithChat = localStorage.getItem('otakon_has_interacted_with_chat') === 'true';
        const hasGamePill = Object.keys(conversations).some(id => id !== 'everything-else');
        const hasLoadingMessages = loadingMessages.length > 0;
        
        // Don't show prompts if there are loading messages (user is actively interacting)
        if (hasLoadingMessages) {
            return false;
        }
        
        return isFirstTime || 
               lastSuggestedPromptsShown === 0 || 
               (!hasInteractedWithChat && !hasGamePill);
    }, [lastSuggestedPromptsShown, isFirstTime, conversations, loadingMessages]);
    
    // Function to reset interaction state for testing purposes
    const resetInteractionState = useCallback(() => {
        localStorage.removeItem('otakon_has_interacted_with_chat');
        localStorage.removeItem('otakon_profile_setup_completed');
        localStorage.removeItem('otakon_welcome_message_shown');
        localStorage.removeItem('otakon_last_session_date');
        localStorage.removeItem('otakon_developer_mode'); // Clear developer mode flag
        localStorage.removeItem('otakonAuthMethod'); // Clear auth method
        localStorage.removeItem('otakonOnboardingComplete'); // Clear onboarding completion
        setLastSuggestedPromptsShown(0);
        
        // Reset suggested prompts so all 4 are available again
        suggestedPromptsService.resetUsedPrompts();
        
        // Reset welcome message tracking for testing
        try {
            supabaseDataService.resetWelcomeMessageTracking();
            console.log('🔄 Welcome message tracking reset for testing');
        } catch (error) {
            console.warn('Failed to reset welcome message tracking:', error);
        }
        
        console.log('🔄 Interaction state reset - suggested prompts and welcome message will be visible again');
    }, []);
    
    // Database synchronization function
    const syncToDatabase = useCallback(async () => {
        if (!authState.user) return;
        
        try {
            setDatabaseSyncStatus('syncing');
            
            // Sync player profile
            const profile = await playerProfileService.getProfile();
            if (profile) {
                await databaseService.syncPlayerProfile(profile);
            }
            
            // Sync game contexts for all conversations
            // Use current conversations state directly to avoid circular dependency
            const currentConversations = conversations;
            for (const [conversationId, conversation] of Object.entries(currentConversations)) {
                if (conversation.id !== 'everything-else') {
                    const gameContext = await playerProfileService.getGameContext(conversation.id);
                    if (gameContext) {
                        await databaseService.syncGameContext(conversation.id, gameContext);
                    }
                }
            }
            
            setDatabaseSyncStatus('success');
            setLastDatabaseSync(Date.now());
            
            // Reset status after 3 seconds
            setTimeout(() => setDatabaseSyncStatus('idle'), 3000);
            
        } catch (error) {
            console.error('Database sync failed:', error);
            setDatabaseSyncStatus('error');
            
            // Reset status after 5 seconds
            setTimeout(() => setDatabaseSyncStatus('idle'), 5000);
        }
    }, [authState.user]); // Remove conversations dependency to prevent circular dependency
    
    // Auto-sync to database when user is authenticated
    useEffect(() => {
        if (authState.user && databaseSyncStatus === 'idle') {
            // Sync after a short delay to ensure app is fully loaded
            const syncTimer = setTimeout(() => {
                syncToDatabase();
            }, 2000);
            
            return () => clearTimeout(syncTimer);
        }
    }, [authState.user, syncToDatabase]);
    
    // Function to log current stop flag status (for debugging)
    const logStopFlagStatus = useCallback(() => {
        const timeSinceLastStop = Date.now() - lastStopTime.current;
        console.log(`📊 Stop Flag Status:`, {
            isStopped: isStopped.current,
            timeSinceLastStop: `${timeSinceLastStop}ms`,
            cooldownRemaining: Math.max(0, STOP_COOLDOWN_MS - timeSinceLastStop),
            hasTimeout: !!stopTimeoutRef.current,
            timeoutId: stopTimeoutRef.current
        });
    }, []);
    
    // Wrapper for stopMessage that records when stop is pressed
    const handleStopMessage = useCallback((messageId: string) => {
        console.log(`🛑 Stop requested for message: ${messageId}`);
        
        // Clear any existing stop timeout
        if (stopTimeoutRef.current) {
            clearTimeout(stopTimeoutRef.current);
            stopTimeoutRef.current = null;
        }
        
        lastStopTime.current = Date.now();
        isStopped.current = true; // Set global stop flag
        console.log(`⏰ Stop cooldown started, will prevent new analysis for ${STOP_COOLDOWN_MS}ms`);
        console.log(`🚫 Global stop flag set - no new analysis will start`);
        logStopFlagStatus(); // Log the status change
        stopMessage(messageId);
        
        // Reset the stop flag after cooldown period
        stopTimeoutRef.current = setTimeout(() => {
            isStopped.current = false;
            stopTimeoutRef.current = null;
            console.log(`✅ Global stop flag reset - new analysis can start`);
            logStopFlagStatus(); // Log the status change
        }, STOP_COOLDOWN_MS);
    }, [stopMessage, logStopFlagStatus]);
    
    // Function to manually reset the stop flag (for debugging)
    const resetStopFlag = useCallback(() => {
        console.log(`🔄 Manually resetting stop flag`);
        if (stopTimeoutRef.current) {
            clearTimeout(stopTimeoutRef.current);
            stopTimeoutRef.current = null;
        }
        isStopped.current = false;
        lastStopTime.current = 0;
        console.log(`✅ Stop flag manually reset`);
        logStopFlagStatus(); // Log the status change
    }, [logStopFlagStatus]);
    
     useEffect(() => {
        const handleBeforeUnload = () => {
            console.log('beforeunload event triggered. Forcing save of conversations.');
            saveConversationsToLocalStorage();
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [saveConversationsToLocalStorage]);

    useEffect(() => {
        const disableHandsFree = () => {
            console.log("Hands-free mode disabled via media controls.");
            setIsHandsFreeMode(false);
        };
        
        const closeContextMenu = () => setContextMenu(null);
        window.addEventListener('otakon:disableHandsFree', disableHandsFree);
        window.addEventListener('focus', refreshUsage);
        window.addEventListener('click', closeContextMenu);
        window.addEventListener('scroll', closeContextMenu, true);


        return () => {
            window.removeEventListener('otakon:disableHandsFree', disableHandsFree);
            window.removeEventListener('focus', refreshUsage);
            window.removeEventListener('click', closeContextMenu);
            window.removeEventListener('scroll', closeContextMenu, true);
        };
    }, []);

    useEffect(() => {
        const audioEl = silentAudioRef.current;
        if (audioEl) {
            if (isHandsFreeMode) {
                audioEl.play().catch(error => {
                    console.warn("Silent audio playback failed to start:", error);
                    addSystemMessage("Could not activate background audio. If audio stops when the screen is off, please tap the screen and toggle Hands-Free mode again.");
                });
                console.log("Playing silent audio to maintain background execution for Hands-Free mode.");
            } else {
                audioEl.pause();
                audioEl.currentTime = 0;
                console.log("Paused silent audio.");
            }
        }
    }, [isHandsFreeMode, addSystemMessage]);

    // Helper function to display screenshots in chat
    const displayScreenshotInChat = useCallback((img: HTMLImageElement, index: number, total: number, processImmediate: boolean, timestamp: number) => {
        console.log(`🖼️ Displaying screenshot ${index}/${total} in chat`);
        
        // Create image data object for your app's format
        const imageData = {
            base64: img.src.split(',')[1] || img.src,
            mimeType: 'image/png',
            dataUrl: img.src,
            source: `connector_single_${index}`
        };
        
        // Add to images for review if not processing immediately
        if (!processImmediate) {
            setImagesForReview(prevImages => {
                const limit = usage.tier === 'pro' ? 5 : 1;
                const newImages = [...prevImages, imageData];
                if (newImages.length > limit) {
                    addSystemMessage(`You can add a maximum of ${limit} image(s) for review.`);
                    return newImages.slice(-limit);
                }
                return newImages;
            });
        }
        
        // If processing immediately, send for analysis
        if (processImmediate) {
            // Check if we're globally stopped
            if (isStopped.current) {
                console.log("🚫 Analysis blocked - global stop flag is active");
                addSystemMessage("Analysis is currently stopped. Please wait a moment before sending new screenshots.");
                return;
            }
            
            if (usage.tier === 'free' && loadingMessages.length > 0) {
                addSystemMessage("An analysis is already in progress. Please wait for it to complete before sending new screenshots.");
                return;
            }
            
            // Send message with image for AI analysis
            sendMessage('', [imageData], true);
        }
    }, [usage.tier, loadingMessages, addSystemMessage, sendMessage]);

    // Helper function to process screenshots automatically
    const processScreenshotAutomatically = useCallback(async (imageData: any, index: number, total: number) => {
        console.log(`🤖 Auto-processing screenshot ${index}/${total}`);
        
        // The image is already being processed by sendMessage above
        // This function can be used for additional processing if needed
        console.log(`✅ Screenshot ${index}/${total} auto-processing initiated`);
    }, []);

    // Note: Old multi-shot grouping functions removed - PC client now sends screenshot_batch messages

    // Dedicated function for displaying multi-shot batches
    const displayMultiShotBatch = useCallback(async (imageDataArray: any[], processImmediate: boolean) => {
        console.log(`🔄 displayMultiShotBatch called with ${imageDataArray.length} images:`, imageDataArray);
        
        // ✅ CORRECT: Pass all images as separate ImageFile objects to sendMessage
        // sendMessage will group them together in one user message
        const formattedImageFiles = imageDataArray.map((imgData, index) => ({
            base64: imgData.base64,
            mimeType: imgData.mimeType || 'image/png',
            dataUrl: imgData.dataUrl,
            source: imgData.source
        }));
        
        console.log(`🔄 Processing multi-shot batch with ${formattedImageFiles.length} images:`, formattedImageFiles.map(f => f.source));
        console.log(`🔄 Formatted image files:`, formattedImageFiles.map(f => ({
            source: f.source,
            dataUrlLength: f.dataUrl?.length || 0,
            base64Length: f.base64?.length || 0
        })));
        
        // NEW: Track multishot timeline in screenshot timeline service
        if (activeConversationId && activeConversationId !== 'everything-else') {
            try {
                const { screenshotTimelineService } = await import('./services/screenshotTimelineService');
                await screenshotTimelineService.trackMultiScreenshot(
                    activeConversationId,
                    imageDataArray,
                    Date.now(),
                    activeConversationId, // gameId
                    activeConversation?.title, // gameName
                    false // isGameSwitch - will be updated later if game switch occurs
                );
                console.log(`📸 Tracked multi-shot timeline: ${imageDataArray.length} screenshots`);
            } catch (error) {
                console.warn('Failed to track multishot timeline:', error);
            }
        }
        
        // Use sendMessage to display the images grouped together in one message
        // sendMessage will create one userMessage with all images in the images array
        const isSingleScreenshot = formattedImageFiles.length === 1;
        const timelineMessage = isSingleScreenshot 
            ? `📸 Single screenshot uploaded`
            : `📸 Multi-shot timeline: ${formattedImageFiles.length} screenshots showing progression over the last 5 minutes`;
        const result = await sendMessage(timelineMessage, formattedImageFiles, true);
        
        if (processImmediate) {
            console.log(`🚀 Multi-shot batch sent for AI analysis`);
        }
        
        console.log(`✅ Multi-shot batch displayed successfully with ${formattedImageFiles.length} images grouped together`);
        
        // Verify the images were added to the conversation
        const currentConvo = conversations[activeConversationId];
        if (currentConvo && currentConvo.messages.length > 0) {
            const lastMessage = currentConvo.messages[currentConvo.messages.length - 2]; // User message (before AI placeholder)
            if (lastMessage && lastMessage.images && lastMessage.images.length > 0) {
                console.log(`✅ Verified: ${lastMessage.images.length} images added to conversation`);
            } else {
                console.warn(`⚠️ Warning: No images found in last user message`);
            }
        }
    }, [sendMessage, conversations, activeConversationId]);

    const handleScreenshotReceived = useCallback(async (data: any) => {
        if (data.type === 'history_restore') {
            if (data.payload && Object.keys(data.payload).length > 0) {
                 console.log("Restoring conversation from server...");
                 restoreHistory(data.payload as Conversations);
            } else {
                 console.log("No history on server or empty history received.");
            }
            setHasRestored(true);
            return;
        } 
        
        // Handle screenshot_batch from enhanced connector
        else if (data.type === 'screenshot_batch') {
            setActiveSubView('chat');
            
            console.log("📸 Processing screenshot batch:", data);
            
            // Extract data from payload if it exists, otherwise use data directly
            const batchData = data.payload || data;
            
            // Check if we've already processed this batch (prevent duplicates)
            // Use a more robust key that includes the actual image content hash
            const firstImageHash = batchData.images?.[0]?.substring(batchData.images[0].length - 100) || 'no_images';
            const batchKey = `batch_${batchData.timestamp}_${batchData.images?.length}_${firstImageHash}`;
            
            if (processedBatches.current.has(batchKey)) {
                console.log("⚠️ Duplicate batch detected, skipping:", batchKey);
                return;
            }
            
            // Add to processed set BEFORE processing to prevent race conditions
            processedBatches.current.add(batchKey);
            
            // Clean up old entries to prevent memory leaks (keep only last 100)
            if (processedBatches.current.size > 100) {
                const entries = Array.from(processedBatches.current);
                processedBatches.current.clear();
                entries.slice(-50).forEach(entry => processedBatches.current.add(entry));
            }
            
            try {
                const { images, processImmediate } = batchData;
                
                if (!images || !Array.isArray(images) || images.length === 0) {
                    console.warn("⚠️ Invalid screenshot batch payload - no images");
                    return;
                }
                
                // Convert base64 strings to image data objects
                const imageDataArray = images.map((imageData: string, index: number) => {
                    // Handle both formats: base64 string or full data URL
                    let base64: string;
                    let dataUrl: string;
                    
                    console.log(`📸 Processing image ${index + 1}:`, {
                        originalLength: imageData.length,
                        startsWithDataUrl: imageData.startsWith('data:image/'),
                        firstChars: imageData.substring(0, 50),
                        lastChars: imageData.substring(imageData.length - 20)
                    });
                    
                    if (imageData.startsWith('data:image/')) {
                        // Already a data URL
                        dataUrl = imageData;
                        base64 = imageData.split(',')[1] || imageData;
                        console.log(`📸 Image ${index + 1}: Already data URL format`);
                    } else {
                        // Base64 string - convert to data URL
                        dataUrl = `data:image/png;base64,${imageData}`;
                        base64 = imageData;
                        console.log(`📸 Image ${index + 1}: Converted base64 to data URL`);
                    }
                    
                    return {
                        base64,
                        mimeType: 'image/png', // Connector sends PNG format
                        dataUrl,
                        source: `connector_batch_${index + 1}`
                    };
                });
                
                if (processImmediate) {
                    // Check if we're globally stopped
                    if (isStopped.current) {
                        // Check if the stop flag has been stuck for too long (more than 10 seconds)
                        const timeSinceLastStop = Date.now() - lastStopTime.current;
                        if (timeSinceLastStop > 10000) { // 10 seconds
                            console.log("⚠️ Stop flag stuck for too long, auto-resetting");
                            resetStopFlag();
                        } else {
                            console.log("🚫 Analysis blocked - global stop flag is active");
                            addSystemMessage("Analysis is currently stopped. Please wait a moment before sending new screenshots.");
                            return;
                        }
                    }
                    
                    // Auto-process mode - display and analyze immediately
                    // Allow multiple screenshots to be processed simultaneously for better UX
                    if (usage.tier === 'free' && loadingMessages.length > 0) {
                        // For free users, allow up to 1 concurrent analysis
                        console.log("⚠️ Free user - analysis in progress, but will queue multi-shot batch");
                        // Don't return, continue processing
                    }
                    
                    // Check if we're in cooldown period after stop was pressed
                    const timeSinceLastStop = Date.now() - lastStopTime.current;
                    if (timeSinceLastStop < STOP_COOLDOWN_MS) {
                        console.log(`⚠️ Stop cooldown active (${STOP_COOLDOWN_MS - timeSinceLastStop}ms remaining), skipping multi-shot batch`);
                        addSystemMessage("Please wait a moment after stopping before sending new screenshots.");
                        return;
                    }
                    
                    // Add system message to show batch receipt
                    addSystemMessage(`📸 Multi-shot batch received: ${imageDataArray.length} screenshots captured`);
                    
                    // Display the batch and send for analysis using our dedicated function
                    await displayMultiShotBatch(imageDataArray, true);
                } else {
                    // Manual review mode - just display the batch
                    await displayMultiShotBatch(imageDataArray, false);
                }
                
                setIsConnectionModalOpen(false);
                console.log("✅ Screenshot batch processing completed successfully");
            } catch (e) {
                const errorText = e instanceof Error ? e.message : 'Unknown error processing screenshot batch.';
                console.error("❌ Failed to process screenshot batch:", e);
                addSystemMessage(`Failed to process received screenshots. ${errorText}`);
            }
            return;
        }
        
        // Handle individual screenshot messages from PC client (single and multi-shot)
        else if (data.type === 'screenshot') {
            setActiveSubView('chat');
            
            console.log("📸 Processing individual screenshot:", data);
            
            // Extract data from payload if it exists, otherwise use data directly
            const screenshotData = data.payload || data;
            
            try {
                const { dataUrl, index, total, processImmediate, timestamp } = screenshotData;
                
                // Validate image data
                if (!dataUrl || !dataUrl.startsWith('data:image/')) {
                    console.error('❌ Invalid image data received');
                    addSystemMessage('Invalid image data received from PC client.');
                    return;
                }
                
                // Create image data object
                const imageData = {
                    base64: dataUrl.split(',')[1] || dataUrl,
                    mimeType: 'image/png',
                    dataUrl: dataUrl,
                    source: `connector_single_${index + 1}`
                };
                
                // Check if we've already processed this screenshot (prevent duplicates)
                // Use a more robust key that includes the actual image content hash
                const imageHash = dataUrl.substring(dataUrl.length - 100); // Last 100 chars for uniqueness
                const singleShotKey = `screenshot_${index}_${total}_${timestamp || Date.now()}_${imageHash}`;
                
                if (processedSingleShots.current.has(singleShotKey)) {
                    console.log("⚠️ Duplicate single shot detected, skipping:", singleShotKey);
                    return;
                }
                
                // Add to processed set BEFORE processing to prevent race conditions
                processedSingleShots.current.add(singleShotKey);
                
                // Clean up old entries to prevent memory leaks (keep only last 100)
                if (processedSingleShots.current.size > 100) {
                    const entries = Array.from(processedSingleShots.current);
                    processedSingleShots.current.clear();
                    entries.slice(-50).forEach(entry => processedSingleShots.current.add(entry));
                }
                
                // Check if this is part of a multi-shot sequence
                if (total > 1) {
                    console.log(`🔄 Multi-shot detected: ${index + 1}/${total} - but PC client should send screenshot_batch instead`);
                    console.log(`⚠️ This individual screenshot handling is deprecated. PC client should send screenshot_batch.`);
                    console.log(`❌ REJECTING individual screenshot with total > 1 - this should be a screenshot_batch message`);
                    
                    // Remove from processed set since we're rejecting it
                    processedSingleShots.current.delete(singleShotKey);
                    
                    // Don't add any system message to avoid spam
                    return;
                } else {
                    // Single screenshot - process normally
                    console.log(`📸 Single screenshot - processing normally`);
                    
                    if (processImmediate) {
                        // Check if we're globally stopped
                        if (isStopped.current) {
                            // Check if the stop flag has been stuck for too long (more than 10 seconds)
                            const timeSinceLastStop = Date.now() - lastStopTime.current;
                            if (timeSinceLastStop > 10000) { // 10 seconds
                                console.log(`⚠️ Stop flag stuck for ${timeSinceLastStop}ms, auto-resetting`);
                                resetStopFlag();
                            } else {
                                console.log(`🚫 Analysis blocked - global stop flag is active`);
                                addSystemMessage("Analysis is currently stopped. Please wait a moment before sending new screenshots.");
                                return;
                            }
                        }
                        
                        // Auto-process mode - allow multiple screenshots to be processed
                        if (usage.tier === 'free' && loadingMessages.length > 0) {
                            // For free users, allow up to 1 concurrent analysis
                            console.log(`⚠️ Free user - analysis in progress, but will queue single shot`);
                            // Don't return, continue processing
                        }
                        
                        // Check if we're in cooldown period after stop was pressed
                        const timeSinceLastStop = Date.now() - lastStopTime.current;
                        if (timeSinceLastStop < STOP_COOLDOWN_MS) {
                            console.log(`⚠️ Stop cooldown active (${STOP_COOLDOWN_MS - timeSinceLastStop}ms remaining), skipping single shot`);
                            // Only show cooldown message once to avoid spam
                            if (!cooldownMessageShown.current) {
                                addSystemMessage("Please wait a moment after stopping before sending new screenshots.");
                                cooldownMessageShown.current = true;
                                // Reset the flag after cooldown period
                                setTimeout(() => {
                                    cooldownMessageShown.current = false;
                                }, STOP_COOLDOWN_MS);
                            }
                            return;
                        }
                        
                        // NEW: Track single screenshot timeline
                        if (activeConversationId && activeConversationId !== 'everything-else') {
                            try {
                                const { screenshotTimelineService } = await import('./services/screenshotTimelineService');
                                await screenshotTimelineService.trackSingleScreenshot(
                                    activeConversationId,
                                    imageData,
                                    timestamp || Date.now(),
                                    activeConversationId, // gameId
                                    activeConversation?.title, // gameName
                                    false // isGameSwitch - will be updated later if game switch occurs
                                );
                                console.log(`📸 Tracked single screenshot timeline`);
                            } catch (error) {
                                console.warn('Failed to track single screenshot timeline:', error);
                            }
                        }
                        
                        // Process immediately - sendMessage will handle the display
                        await sendMessage('📸 Single screenshot showing current game state', [imageData], true);
                        
                    } else {
                        // Manual review mode
                        if (usage.tier === 'free' && imagesForReview.length > 0) {
                            // Only show this message once, don't spam the user
                            console.log(`⚠️ Manual review queue has images, skipping single shot`);
                            return;
                        }
                        
                        // NEW: Track single screenshot timeline for manual review
                        if (activeConversationId && activeConversationId !== 'everything-else') {
                            try {
                                const { screenshotTimelineService } = await import('./services/screenshotTimelineService');
                                await screenshotTimelineService.trackSingleScreenshot(
                                    activeConversationId,
                                    imageData,
                                    timestamp || Date.now(),
                                    activeConversationId, // gameId
                                    activeConversation?.title, // gameName
                                    false // isGameSwitch - will be updated later if game switch occurs
                                );
                                console.log(`📸 Tracked single screenshot timeline (manual review)`);
                            } catch (error) {
                                console.warn('Failed to track single screenshot timeline:', error);
                            }
                        }
                        
                        // Display in chat and add to review queue
                        displayScreenshotInChat(new Image(), 1, 1, false, timestamp);
                        setImagesForReview(prevImages => {
                            const limit = usage.tier === 'pro' ? 5 : 1;
                            const newImages = [...prevImages, imageData];
                            if (newImages.length > limit) {
                                addSystemMessage(`You can add a maximum of ${limit} image(s) for review.`);
                                return newImages.slice(-limit);
                            }
                            return newImages;
                        });
                    }
                }
                
                setIsConnectionModalOpen(false);
                console.log("✅ Screenshot processing completed successfully");
                
            } catch (e) {
                const errorText = e instanceof Error ? e.message : 'Unknown error processing screenshot.';
                console.error("❌ Failed to process screenshot:", e);
                addSystemMessage(`Failed to process received screenshot. ${errorText}`);
            }
            return;
        }
        
        // Handle other message types
        if (data.type === 'connection_test') {
            console.log('✅ Connection test received from PC client');
            addSystemMessage("Connection test successful - PC client is ready!");
            return;
        } else if (data.type === 'partner_connected') {
            console.log("Partner PC client has connected.");
        } else {
            console.warn("Received unexpected WebSocket message:", data);
        }
    }, [sendMessage, addSystemMessage, restoreHistory, isManualUploadMode, usage.tier, imagesForReview, loadingMessages]);

    const {
        status: connectionStatus,
        error: connectionError,
        connect,
        disconnect,
        connectionCode,
        send,

        lastSuccessfulConnection,
        forceReconnect,
    } = useConnection(handleScreenshotReceived);
    
    const testConnection = useCallback(() => {
        if (send) {
            console.log("🧪 Testing WebSocket connection...");
            console.log("✅ WebSocket is connected and ready");
            console.log(`Connection code: ${connectionCode}`);
            console.log(`Relay URL: wss://otakon-relay.onrender.com/${connectionCode}`);
            send({ type: 'test_connection' });
        } else {
            console.log("❌ WebSocket not connected");
        }
    }, [send, connectionCode]);

    const prevLoadingMessagesRef = useRef(loadingMessages);

    useEffect(() => {
        const wasLoading = prevLoadingMessagesRef.current.length > 0;
        const isNotLoading = loadingMessages.length === 0;

        if (wasLoading && isNotLoading) {
            if (connectionStatus === ConnectionStatus.CONNECTED && hasRestored && send) {
                console.log("Syncing conversation history after message completion.");
                send({ type: 'save_history', payload: conversations });
            }
        }
        
        prevLoadingMessagesRef.current = loadingMessages;

    }, [loadingMessages, conversations, connectionStatus, hasRestored, send]);

    const messages = activeConversation?.messages ?? [];
    
    useEffect(() => {
        // Auto-scroll to show latest AI response when generating or generated
        if (messages.length > 0 || loadingMessages.length > 0) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, loadingMessages]);
    

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const hasConnectedBefore = localStorage.getItem('otakonHasConnectedBefore') === 'true';

        if (connectionStatus === ConnectionStatus.CONNECTED) {
            if (!hasConnectedBefore) {
                // First time connecting - show proper splash screen progression
                localStorage.setItem('otakonHasConnectedBefore', 'true');
                setIsConnectionModalOpen(false);
                
                // Check current onboarding status to determine next screen
                if (onboardingStatus === 'features') {
                    // If we're in features screen, go to pro-features next
                    setOnboardingStatus('pro-features');
                    console.log('🎉 First PC connection! Showing "Pro Features" splash screen');
                } else if (onboardingStatus === 'initial') {
                    // If we're in initial screen, go to pro-features
                    setOnboardingStatus('pro-features');
                    console.log('🎉 First PC connection! Showing "Pro Features" splash screen');
                } else {
                    // Default case - show pro-features
                    setOnboardingStatus('pro-features');
                    console.log('🎉 First PC connection! Showing "Pro Features" splash screen');
                }
            } else {
                // Returning user - automatically show chat screen
                setIsConnectionModalOpen(false);
                setView('app');
                console.log('🔄 Returning user connected! Showing chat screen');
            }
        }
    }, [connectionStatus, onboardingStatus]);
    
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);
    

    const completeOnboarding = useCallback(() => {
        localStorage.setItem('otakonOnboardingComplete', 'true');
        setOnboardingStatus('complete');
    }, []);

    const handleDisconnect = useCallback(() => {
        disconnect();
        setIsConnectionModalOpen(false);
    }, [disconnect]);

    const executeFullReset = useCallback(async () => {
        try {
            // First, clear local data and reset services while still authenticated
            if (send) {
                send({ type: 'clear_history' });
            }
            ttsService.cancel();
            disconnect();
            resetConversations();
            
            // Reset services while still authenticated to avoid 403 errors
            try {
                await unifiedUsageService.reset();
            } catch (error) {
                console.warn('Failed to reset usage service:', error);
            }
            
            try {
                await playerProfileService.resetWelcomeMessageTracking();
            } catch (error) {
                console.warn('Failed to reset welcome message tracking in Supabase:', error);
            }
            
        // Clear localStorage - complete reset for fresh first run experience
        localStorage.removeItem('lastConnectionCode');
        localStorage.removeItem('otakonOnboardingComplete');
        localStorage.removeItem('otakon_profile_setup_completed');
        localStorage.removeItem('otakonHasConnectedBefore');
        localStorage.removeItem('otakonAuthMethod');
        localStorage.removeItem('otakonInstallDismissed');
        localStorage.removeItem('otakon_developer_mode'); // Clear developer mode flag
        
        // Clear any splash screen flags to force first run experience
        localStorage.removeItem('otakon_show_splash_after_login');
        
        // Clear all conversation data for fresh start
        localStorage.removeItem('otakon_conversations');
        localStorage.removeItem('otakon_conversations_order');
        localStorage.removeItem('otakon_active_conversation');
            
            // Reset welcome message tracking so it shows again on next login
            localStorage.removeItem('otakon_welcome_message_shown');
            localStorage.removeItem('otakon_last_welcome_time');
            localStorage.removeItem('otakon_app_closed_time');
            localStorage.removeItem('otakon_first_run_completed');
            
            // Now sign out from Supabase (after all authenticated operations are done)
            await authService.signOut();
            
            // Reset app state and return to login screen
            setOnboardingStatus('login');
            setIsHandsFreeMode(false);
            setIsConnectionModalOpen(false);
            setView('landing');
            
            // Reset session flags to allow welcome message on next login
            setWelcomeMessageShownThisSession(false);
            
            // Reset suggested prompts for fresh experience on next login
            suggestedPromptsService.resetUsedPrompts();
            
            // Reset welcome message tracking for fresh experience on next login
            try {
                await supabaseDataService.resetWelcomeMessageTracking();
                console.log('🔄 Welcome message tracking reset for fresh login');
            } catch (error) {
                console.warn('Failed to reset welcome message tracking:', error);
            }
            
            console.log('Full reset completed successfully');
        } catch (error) {
            console.error('Full reset error:', error);
            // Even if there's an error, try to clear local state
            setOnboardingStatus('login');
            setIsHandsFreeMode(false);
            setIsConnectionModalOpen(false);
            setView('landing');
        }
    }, [send, disconnect, resetConversations]);
    
    const handleLogout = useCallback(async () => {
        const isDeveloperMode = canAccessDeveloperFeatures(authState.user?.email);
        
        setConfirmationModal({
            title: isDeveloperMode ? 'Sign Out of Developer Mode?' : 'Sign Out?',
            message: isDeveloperMode 
                ? 'Are you sure you want to sign out of developer mode? You can sign back in anytime.'
                : 'Are you sure you want to sign out? You can sign back in anytime.',
            onConfirm: async () => {
                try {
                    // First, clear local data and reset services while still authenticated
                    if (send) {
                        send({ type: 'clear_history' });
                    }
                    ttsService.cancel();
                    disconnect();
                    resetConversations();
                    
                    // Reset services while still authenticated to avoid 403 errors
                    try {
                        await unifiedUsageService.reset();
                    } catch (error) {
                        console.warn('Failed to reset usage service:', error);
                    }
                    
                    try {
                        await playerProfileService.resetWelcomeMessageTracking();
                    } catch (error) {
                        console.warn('Failed to reset welcome message tracking in Supabase:', error);
                    }
                    
                    // Clear localStorage - complete reset for fresh first run experience
                    localStorage.removeItem('lastConnectionCode');
                    localStorage.removeItem('otakonOnboardingComplete');
                    localStorage.removeItem('otakon_profile_setup_completed');
                    localStorage.removeItem('otakonHasConnectedBefore');
                    localStorage.removeItem('otakonAuthMethod');
                    localStorage.removeItem('otakonInstallDismissed');
                    localStorage.removeItem('otakon_developer_mode'); // Clear developer mode flag
                    
                    // Clear any splash screen flags to force first run experience
                    localStorage.removeItem('otakon_show_splash_after_login');
                    
                    // Clear all conversation data for fresh start
                    localStorage.removeItem('otakon_conversations');
                    localStorage.removeItem('otakon_conversations_order');
                    localStorage.removeItem('otakon_active_conversation');
                    
                    // Reset welcome message tracking so it shows again on next login
                    localStorage.removeItem('otakon_welcome_message_shown');
                    localStorage.removeItem('otakon_last_welcome_time');
                    localStorage.removeItem('otakon_app_closed_time');
                    localStorage.removeItem('otakon_first_run_completed');
                    
                    // Now sign out from Supabase (after all authenticated operations are done)
                    await authService.signOut();
                    
                    // Reset app state and return to login screen
                    setOnboardingStatus('login');
                    setIsHandsFreeMode(false);
                    setIsConnectionModalOpen(false);
                    setView('landing');
                    
                    // Reset session flags to allow welcome message on next login
                    setWelcomeMessageShownThisSession(false);
                    
                    // Reset suggested prompts for fresh experience on next login
                    suggestedPromptsService.resetUsedPrompts();
                    
                    // Reset welcome message tracking for fresh experience on next login
                    try {
                        await supabaseDataService.resetWelcomeMessageTracking();
                        console.log('🔄 Welcome message tracking reset for fresh login');
                    } catch (error) {
                        console.warn('Failed to reset welcome message tracking:', error);
                    }
                    
                    console.log('User logged out successfully');
                } catch (error) {
                    console.error('Logout error:', error);
                    // Even if Supabase logout fails, clear local data
                    await executeFullReset();
                }
            },
        });
    }, [send, disconnect, resetConversations, executeFullReset]);
    
    const handleResetApp = useCallback(() => {
        setConfirmationModal({
            title: 'Reset Application?',
            message: 'This will permanently delete all conversation history and settings, and log you out. This action cannot be undone.',
            onConfirm: executeFullReset,
        });
    }, [executeFullReset]);

    const handleUpgrade = useCallback(async () => {
        await unifiedUsageService.upgradeToPro();
        setShowUpgradeScreen(false);
        setIsCreditModalOpen(false);
        refreshUsage();
    }, []);
    
    const handleUpgradeToVanguard = useCallback(async () => {
        await unifiedUsageService.upgradeToVanguard();
        setShowUpgradeScreen(false);
        setIsCreditModalOpen(false);
        refreshUsage();
    }, []);
    
    const handleUpgradeClick = useCallback(() => setShowUpgradeScreen(true), []);

    const handleUpgradeAndContinue = useCallback(() => {
        handleUpgrade();
        completeOnboarding();
    }, [handleUpgrade, completeOnboarding]);

    const handleUpgradeToVanguardAndContinue = useCallback(() => {
        handleUpgradeToVanguard();
        completeOnboarding();
    }, [handleUpgradeToVanguard, completeOnboarding]);

    const handleFeaturesSplashComplete = useCallback(() => {
        if (connectionStatus === ConnectionStatus.CONNECTED) {
            setOnboardingStatus('pro-features');
        } else {
            setOnboardingStatus('pro-features');
        }
    }, [connectionStatus]);
    const handleProFeaturesComplete = useCallback(() => {
        // After pro features, show "How to Use" screen for connected users
        if (connectionStatus === ConnectionStatus.CONNECTED) {
            setOnboardingStatus('how-to-use');
            console.log('📱 Pro Features complete! Showing "How to Use" screen');
        } else {
            // If not connected, complete onboarding
            completeOnboarding();
            console.log('📱 Pro Features complete! Completing onboarding');
        }
    }, [connectionStatus, completeOnboarding]);
    const handleHowToUseComplete = useCallback(() => {
        console.log('📚 "How to Use" complete! Completing onboarding');
        completeOnboarding();
    }, [completeOnboarding]);
    
    const handleSendMessage = useCallback(async (text: string, images?: ImageFile[], isFromPC: boolean = false) => {
        const startTime = performance.now();
        
        // Track user action
        performanceMonitoringService.trackUserAction('send_message', { 
            hasText: text.trim().length > 0, 
            imageCount: images?.length || 0, 
            isFromPC 
        });
        
        // IMMEDIATELY hide suggested prompts when user submits a query
        if (text.trim().length > 0 || (images && images.length > 0) || isFromPC) {
            // Hide static suggested prompts for Everything Else tab
            if (activeConversation?.id === 'everything-else') {
                localStorage.setItem('otakon_has_interacted_with_chat', 'true');
                console.log('📝 User submitted query - immediately hiding suggested prompts');
            }
            
            // Hide inline suggestions by clearing them from the last AI message
            if (activeConversation && activeConversation.messages.length > 0) {
                const lastMessage = activeConversation.messages[activeConversation.messages.length - 1];
                if (lastMessage.role === 'model' && lastMessage.suggestions) {
                    // Clear suggestions from the last AI message immediately
                    updateConversation(activeConversation.id, conv => ({
                        ...conv,
                        messages: conv.messages.map(msg => 
                            msg.id === lastMessage.id 
                                ? { ...msg, suggestions: undefined }
                                : msg
                        )
                    }));
                    console.log('📝 Cleared inline suggestions from last AI message');
                }
            }
        }
        
        setChatInputValue(''); // Clear controlled input on send
        setActiveSubView('chat');
        const result = await sendMessage(text, images, isFromPC);
        refreshUsage();

        // Check wishlist release status when user submits a query
        if (activeConversation?.id === 'everything-else') {
            try {
                // Import wishlistService dynamically to avoid circular dependencies
                const { wishlistService } = await import('./services/wishlistService');
                
                // Check all wishlist items for release status
                const wishlistItems = await wishlistService.getWishlist();
                for (const item of wishlistItems) {
                    if (item.releaseDate && !item.isReleased) {
                        await wishlistService.checkGameReleaseStatus(item.gameName);
                    }
                }
            } catch (error) {
                console.error('Failed to check wishlist release status:', error);
            }
        }

        if (result?.success) {
            // Check if a new game pill was created (conversation switched from everything-else to a game)
            if (activeConversation?.id === 'everything-else' && 
                activeConversationId !== 'everything-else' && 
                activeConversationId !== activeConversation.id) {
                // Game pill was created - hide suggested prompts
                localStorage.setItem('otakon_has_interacted_with_chat', 'true');
                console.log('🎮 Game pill created - hiding suggested prompts');
            }
            
            // Track daily engagement progress
            if (activeConversation && activeConversation.id !== 'everything-else') {
                // Update game session progress
                dailyEngagementService.updateGameStreak();
                
                // Update goal progress
                if (images && images.length > 0) {
                    dailyEngagementService.updateGoalProgress('screenshots', images.length);
                }
                if (text.trim().length > 0) {
                    dailyEngagementService.updateGoalProgress('help_others', 1);
                }
                

                
                // Check for achievements
                const goals = dailyEngagementService.getDailyGoals();
                const completedGoals = goals.filter(g => g.current >= g.target).length;
                if (completedGoals === goals.length && completedGoals > 0) {
                    // All daily goals completed!
                    setCurrentAchievement({
                        id: 'daily_master',
                        title: 'Daily Master',
                        description: 'Completed all daily goals!',
                        icon: 'fire',
                        reward: '+100 Otagon Points'
                    });
                }
            }
            
            // Update last session time
            dailyEngagementService.updateLastSessionTime();
        } else if (result?.reason === 'limit_reached') {
            setShowUpgradeScreen(true);
        }
        
        // Track performance
        const endTime = performance.now();
        performanceMonitoringService.trackPerformanceEvent('message_send', endTime - startTime, {
            success: result?.success,
            reason: result?.reason
        });
    }, [sendMessage, activeConversation, activeConversationId, setChatInputValue, setActiveSubView, refreshUsage, dailyEngagementService, setCurrentAchievement, setShowUpgradeScreen]);
    
    const clearImagesForReview = useCallback(() => {
        setImagesForReview([]);
    }, []);

    
    const handleHandsFreeClick = useCallback(async () => {
        if (usage.tier === 'free') {
            setShowUpgradeScreen(true);
            return;
        }
        
        if (!isHandsFreeMode) {
            // Initialize notification services when enabling hands-free mode
            try {
                if (smartNotificationService.isSupported()) {
                    await smartNotificationService.initialize();
                    console.log('Smart notifications initialized for hands-free mode');
                }
                if (pushNotificationService.isSupported()) {
                    await pushNotificationService.initialize();
                    console.log('Push notifications initialized for hands-free mode');
                }
            } catch (error) {
                console.error('Failed to initialize notification services:', error);
            }
        }
        
        setIsHandsFreeMode(!isHandsFreeMode);
        if (!isHandsFreeMode) {
            setIsHandsFreeModalOpen(true);
        } else {
            setIsHandsFreeModalOpen(false);
        }
    }, [isHandsFreeMode, usage.tier]);

    const handleToggleHandsFree = useCallback(() => {
        setIsHandsFreeMode(prev => !prev);
    }, []);
    
    const handleLoginComplete = useCallback(() => {
        setOnboardingStatus('initial');
        setView('app');
    }, []);

    const handleInitialSplashComplete = useCallback(() => setOnboardingStatus('features'), []);

    // Player Profile Setup Handlers
    const handleProfileSetupComplete = useCallback(async (profile: any) => {
        try {
            console.log('🎯 Starting profile setup completion...', profile);
            
            // Save profile first
            console.log('💾 Saving profile...');
            await playerProfileService.saveProfile(profile);
            console.log('✅ Profile saved successfully');
            
            // Complete first time setup
            console.log('🎉 Completing first time setup...');
            playerProfileService.completeFirstTimeSetup();
            console.log('✅ First time setup completed');
            
            // Close modal immediately
            console.log('🚪 Closing profile setup modal...');
            setShowProfileSetup(false);
            setIsFirstTime(false);
            console.log('✅ Modal closed');
            
            // Mark onboarding as complete (profile setup is handled by Supabase)
            localStorage.setItem('otakonOnboardingComplete', 'true');
            console.log('✅ Onboarding marked as complete');
            
            // Mark first run completed in Supabase with localStorage fallback
            console.log('🏁 Marking first run as completed...');
            await playerProfileService.markFirstRunCompleted();
            console.log('✅ First run marked as completed');
            
            // Add welcome message immediately for first-time users
            const timeGreeting = getTimeGreeting();
            addSystemMessage(
                `${timeGreeting}Welcome to Otagon!\n\n**Profile Setup Complete!** Your gaming experience is now personalized.\n\n**Next Steps:**\n• Upload a screenshot from a game you're playing\n• Tell me about a game you want help with\n• I'll create a dedicated conversation tab for each game\n• Get spoiler-free guidance tailored to your progress\n\nWhat game would you like to start with today?`,
                'everything-else',
                false
            );
            console.log('✅ Welcome message added');
            
            // Update welcome message tracking in Supabase with localStorage fallback
            await playerProfileService.updateWelcomeMessageShown('profile_setup');
            console.log('✅ Welcome message tracking updated');
            
            // Trigger tutorial immediately after profile setup
            console.log('🎯 Profile setup complete - opening tutorial now');
            setTimeout(() => openTutorial(), 1000); // 1 second delay to let UI settle
            
        } catch (error) {
            console.error('❌ Error in profile setup completion:', error);
            // Still close the modal even if there's an error
            setShowProfileSetup(false);
            setIsFirstTime(false);
        }
    }, [addSystemMessage, openTutorial]);

    const handleProfileSetupSkip = useCallback(async () => {
        // Set default profile
        const defaultProfile = playerProfileService.getDefaultProfile();
        await playerProfileService.saveProfile(defaultProfile);
        setShowProfileSetup(false);
        setIsFirstTime(false);
        
        // Mark onboarding as complete (profile setup is handled by Supabase)
        localStorage.setItem('otakonOnboardingComplete', 'true');
        
        // Mark first run completed in Supabase with localStorage fallback
        await playerProfileService.markFirstRunCompleted();
        
        // Trigger tutorial immediately after profile setup skip
        console.log('🎯 Profile setup skipped - opening tutorial now');
        setTimeout(() => openTutorial(), 1000); // 1 second delay to let UI settle
    }, [openTutorial]);

    const handleCloseUpgradeScreen = useCallback(() => setShowUpgradeScreen(false), []);
    
    // Function to reset welcome message tracking (useful for testing or user preference)
    const resetWelcomeMessageTracking = useCallback(async () => {
        // Reset in localStorage
        localStorage.removeItem('otakon_profile_setup_completed');
        localStorage.removeItem('otakon_welcome_message_shown');
        localStorage.removeItem('otakon_last_session_date');
        localStorage.removeItem('otakon_last_welcome_time');
        localStorage.removeItem('otakon_app_closed_time');
        localStorage.removeItem('otakon_first_run_completed');
        
        // Also reset in Supabase if possible
        try {
            await playerProfileService.resetWelcomeMessageTracking();
            console.log('🔄 Welcome message tracking reset in both localStorage and Supabase');
        } catch (error) {
            console.warn('Failed to reset in Supabase, localStorage reset successful:', error);
            console.log('🔄 Welcome message tracking reset in localStorage only');
        }
    }, []);
    
    const handleOpenConnectionModal = useCallback(() => setIsConnectionModalOpen(true), []);
    const handleCloseConnectionModal = useCallback(() => setIsConnectionModalOpen(false), []);
    const handleCloseHandsFreeModal = useCallback(() => setIsHandsFreeModalOpen(false), []);
    const handleOpenCreditModal = useCallback(() => setIsCreditModalOpen(true), []);
    const handleCloseCreditModal = useCallback(() => setIsCreditModalOpen(false), []);

    // Authentication handlers
    const handleAuthSuccess = useCallback(() => {
        setIsAuthModalOpen(false);
        
        // Reset suggested prompts on new login
        suggestedPromptsService.resetUsedPrompts();
        
        // Check if user has already completed onboarding
        const hasCompletedOnboarding = localStorage.getItem('otakonOnboardingComplete');
        const hasCompletedProfileSetup = localStorage.getItem('otakon_profile_setup_completed');
        
        if (hasCompletedOnboarding && hasCompletedProfileSetup) {
            // Returning user - skip to complete status to allow profile setup check and welcome message
            setOnboardingStatus('complete');
            setView('app');
        } else {
            // New user - go through onboarding flow
            setOnboardingStatus('initial');
            setView('app');
        }
    }, []);

    const handleOpenAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
    

    const handleBatchUploadAttempt = useCallback(() => {
        addSystemMessage("Uploading multiple images is a Pro feature. Please select only one image or upgrade for batch analysis.", activeConversationId, true);
        setShowUpgradeScreen(true);
    }, [addSystemMessage, activeConversationId]);

    const handleSubTabClick = useCallback((id: string) => {
        // Special handling for Otaku Diary tab - open modal instead of switching views
        if (id === 'otaku-diary' && activeConversation) {
            setOtakuDiaryGameInfo({
                id: activeConversation.id,
                title: activeConversation.title
            });
            setIsOtakuDiaryModalOpen(true);
            return;
        }
        
        // Special handling for Wishlist tab - open modal instead of switching views
        if (id === 'wishlist' && activeConversation?.id === 'everything-else') {
            setIsWishlistModalOpen(true);
            return;
        }
        
        setActiveSubView(id);
        
        if (activeConversation) {
            if (id !== 'chat') {
                markInsightAsRead(activeConversation.id, id);
                const insight = activeConversation.insights?.[id];
                if (insight && insight.status === 'loading') {
                    fetchInsightContent(activeConversation.id, id);
                }
            }
        }
    }, [activeConversation, fetchInsightContent, markInsightAsRead, activeSubView]);


    const handleSwitchConversation = useCallback((id: string) => {
        setActiveSubView('chat');
        switchConversation(id);
    }, [switchConversation]);

    // Context Menu Handlers
    const handleConversationContextMenu = (e: React.MouseEvent | React.TouchEvent, convo: Conversation) => {
        e.preventDefault();
        e.stopPropagation();

        if (convo.id === 'everything-else') {
            return; // No context menu for the default conversation
        }
        
        const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect();

        const menuItems: ContextMenuItem[] = [
            {
                label: convo.isPinned ? 'Unpin' : 'Pin',
                icon: PinIcon,
                action: () => pinConversation(convo.id, !convo.isPinned),
            },
            {
                label: 'Delete',
                icon: TrashIcon,
                isDestructive: true,
                action: () => {
                    setConfirmationModal({
                        title: `Delete "${convo.title}"?`,
                        message: 'This will permanently delete the entire conversation history. This action cannot be undone.',
                        onConfirm: () => deleteConversation(convo.id),
                    });
                },
            }
        ];

        setContextMenu({ targetRect, items: menuItems });
    };
    
    const handleModifyInsight = (insightTitle: string) => {
        setChatInputValue(`@${insightTitle} \\modify `);
        setTimeout(() => chatInputRef.current?.focus(), 0);
    };

    const handleInsightContextMenu = (e: React.MouseEvent | React.TouchEvent, insightId: string, insightTitle: string) => {
        e.preventDefault();
        e.stopPropagation();
        const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        
        const menuItems: ContextMenuItem[] = [
            {
                label: 'Modify',
                icon: EditIcon,
                action: () => handleModifyInsight(insightTitle),
            },
            {
                label: 'Delete',
                icon: TrashIcon,
                isDestructive: true,
                action: () => deleteInsight(activeConversationId, insightId),
            }
        ];

        setContextMenu({ targetRect, items: menuItems });
    };

    const handleSettingsClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        
        // Debug: Log current user email and developer access
        console.log('🔍 Current user email:', authState.user?.email);
        console.log('🔍 Can access developer features:', canAccessDeveloperFeatures(authState.user?.email));
        
        const menuItems: ContextMenuItem[] = [
            {
                label: 'Settings',
                icon: SettingsIcon,
                action: () => setIsSettingsModalOpen(true),
            },
            {
                label: 'Insights',
                icon: SettingsIcon, // You can create a custom icon for this
                action: () => setShowProactiveInsights(true),
            },
            {
                label: 'Watch Tutorial',
                icon: SettingsIcon, // You can create a custom icon for this
                action: () => openTutorial(),
            },
            // Cache Performance - only for developers
            ...(canAccessDeveloperFeatures(authState.user?.email) ? [{
                label: 'Cache Performance',
                icon: SettingsIcon, // You can create a custom icon for this
                action: () => setIsCacheDashboardOpen(true),
            }] : []),

            // Reset First Run Experience - only for developers
            ...(canAccessDeveloperFeatures(authState.user?.email) ? [{
                label: 'Reset First Run Experience',
                icon: SettingsIcon, // You can create a custom icon for this
                action: () => {
                    // Clear all onboarding and first-run flags
                    localStorage.removeItem('otakon_profile_setup_completed');
                    localStorage.removeItem('otakon_show_splash_after_login');
                    localStorage.removeItem('otakon_onboarding_completed');
                    localStorage.removeItem('otakon_first_run_completed');
                    localStorage.removeItem('otakon_tutorial_completed');
                    
                    // Reset onboarding status to initial
                    setOnboardingStatus('initial');
                    
                    // Show success message
                    console.log('✅ First run experience reset successfully!');
                    
                    // Close context menu
                    setContextMenu(null);
                },
            }] : []),

            // Add Sign In option for unauthenticated users
            ...(!authState.user ? [{
                label: 'Sign In',
                icon: UserIcon,
                action: handleOpenAuthModal,
            }] : []),
            {
                label: canAccessDeveloperFeatures(authState.user?.email) ? 'Logout & Reset' : 'Logout',
                icon: LogoutIcon,
                isDestructive: true,
                action: canAccessDeveloperFeatures(authState.user?.email) ? handleResetApp : handleLogout,
            }
        ];
        setContextMenu({ targetRect, items: menuItems });
    };
    
     // Feedback Handlers
    const handleFeedback = (type: 'message' | 'insight', convId: string, targetId: string, originalText: string, vote: 'up' | 'down') => {
        if (vote === 'up') {
            if (type === 'message') {
                updateMessageFeedback(convId, targetId, 'up');
            } else {
                updateInsightFeedback(convId, targetId, 'up');
            }
        } else {
             if (type === 'message') {
                updateMessageFeedback(convId, targetId, 'down');
            } else {
                updateInsightFeedback(convId, targetId, 'down');
            }
            setFeedbackModalState({ type, conversationId: convId, targetId, originalText });
        }
    };

    const handleFeedbackSubmit = (feedbackText: string) => {
        if (!feedbackModalState) return;
        
        addFeedback({
            conversationId: feedbackModalState.conversationId,
            targetId: feedbackModalState.targetId,
            originalText: feedbackModalState.originalText,
            feedbackText,
        });

        if (feedbackModalState.type === 'message') {
            updateMessageFeedback(feedbackModalState.conversationId, feedbackModalState.targetId, 'submitted');
        } else {
            updateInsightFeedback(feedbackModalState.conversationId, feedbackModalState.targetId, 'submitted');
        }
        
        setFeedbackModalState(null);
    };

    // Helper function to check if welcome message should be shown after 12+ hours of inactivity
    const shouldShowWelcomeAfterTimeout = (): boolean => {
        const lastWelcomeTime = localStorage.getItem('otakon_last_welcome_time');
        if (!lastWelcomeTime) return true;
        
        const timeSinceLastWelcome = Date.now() - parseInt(lastWelcomeTime, 10);
        const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
        
        return timeSinceLastWelcome >= TWELVE_HOURS_MS;
    };
    
    // Helper function to check if user has completed first run experience
    const hasCompletedFirstRunExperience = async (): Promise<boolean> => {
        try {
            const hasCompletedFirstRun = await supabaseDataService.getUserAppState().then(state => state.appSettings?.firstRunCompleted) || localStorage.getItem('otakon_first_run_completed') === 'true';
            if (hasCompletedFirstRun === 'true') return true;
            
            // Check if user has created any game conversations
            const hasGameConversations = Object.values(conversations).some(conv => 
                conv.id !== 'everything-else' && conv.title && conv.title !== 'New Game'
            );
            
            if (hasGameConversations) {
                localStorage.setItem('otakon_first_run_completed', 'true');
                return true;
            }
            
            return false;
        } catch (error) {
            console.warn('Error checking first run experience, falling back to localStorage:', error);
            return localStorage.getItem('otakon_first_run_completed') === 'true';
        }
    };

    // Centralized welcome message system that prevents duplicates and adapts to user queries
    useEffect(() => {
        console.log('🔍 Welcome message useEffect triggered:', { view, onboardingStatus });
        
        if (view === 'app' && onboardingStatus === 'complete') {
            // In development mode, skip welcome message checks if not authenticated
            if (import.meta.env.DEV && !authState.user) {
                console.log('⚠️ Development mode: Skipping welcome message checks (no authenticated user)');
                return;
            }
            
            // Use Supabase with localStorage fallback
            const checkWelcomeMessage = async () => {
                try {
                    const shouldShow = await supabaseDataService.shouldShowWelcomeMessage();
                    const hasCompletedProfileSetup = await supabaseDataService.getUserAppState().then(state => state.appSettings?.profileSetupCompleted) || localStorage.getItem('otakon_profile_setup_completed') === 'true';
                    
                    console.log('🔍 Welcome message check:', {
                        view,
                        onboardingStatus,
                        shouldShow,
                        hasCompletedProfileSetup,
                        conversationsCount: Object.keys(conversations).length
                    });
                    
                    // Check if there's already a welcome message in the current conversation
                    const currentConversation = conversations['everything-else'];
                    const hasExistingWelcomeMessage = currentConversation?.messages?.some(msg => 
                        msg.role === 'system' && 
                        (msg.text.includes('Welcome to Otagon') || msg.text.includes('Welcome back'))
                    );
                    
                    // Show welcome message if:
                    // 1. User has completed profile setup
                    // 2. Supabase/localStorage indicates welcome should be shown
                    // 3. No existing welcome message in current conversation
                    // Note: Removed session flag check to allow welcome messages after logout/login
                    if (hasCompletedProfileSetup && shouldShow && !hasExistingWelcomeMessage) {
                console.log('✅ Showing welcome message - conditions met');
                
                // Get current time for time-based greetings
                const currentHour = new Date().getHours();
                let timeGreeting = '';
                
                if (currentHour < 12) {
                    timeGreeting = 'Good morning! ';
                } else if (currentHour < 17) {
                    timeGreeting = 'Good afternoon! ';
                } else {
                    timeGreeting = 'Good evening! ';
                }
                
                                    // Check if user has previous conversations to determine message type
                        const hasPreviousConversations = Object.values(conversations).some(conv => 
                            conv.id !== 'everything-else' && conv.messages && conv.messages.length > 1
                        );
                        
                        // Check if user has completed first run experience (has created at least one game conversation)
                        const hasCompletedFirstRun = await hasCompletedFirstRunExperience();
                        
                        let welcomeMessage: string;
                        
                        if (hasCompletedFirstRun) {
                            // User has completed first run experience - show session summary and contextual welcome
                            const recentGames = Object.values(conversations)
                                .filter(conv => conv.id !== 'everything-else' && conv.title && conv.title !== 'New Game')
                                .slice(0, 3); // Get up to 3 recent games
                            
                            if (recentGames.length > 0) {
                                // Create session summary
                                const gameSummaries = recentGames.map(conv => {
                                    const messageCount = conv.messages?.length || 0;
                                    const progress = conv.progress || 0;
                                    const lastInteraction = conv.lastInteractionTimestamp || conv.createdAt;
                                    
                                    let summary = `**${conv.title}**`;
                                    if (progress > 0) summary += ` (${progress}% progress)`;
                                    if (messageCount > 1) summary += ` - ${messageCount} messages`;
                                    
                                    return summary;
                                });
                                
                                const totalGames = recentGames.length;
                                const totalMessages = recentGames.reduce((sum, conv) => sum + (conv.messages?.length || 0), 0);
                                
                                welcomeMessage = `${timeGreeting}Welcome back to Otagon!\n\n**Your Gaming Session Summary:**\n${gameSummaries.join('\n')}\n\n**Total:** ${totalGames} game${totalGames > 1 ? 's' : ''}, ${totalMessages} message${totalMessages > 1 ? 's' : ''}\n\nWhat's your next gaming challenge today? I'm ready to help you continue your adventures or start something new!`;
                                console.log('🎮 User with completed first run - showing session summary welcome');
                            } else {
                                welcomeMessage = `${timeGreeting}Welcome back! I'm ready to help with your next gaming challenge. What game are you tackling today, or would you like to continue where you left off?`;
                                console.log('Returning user without recent game history - showing gentle reminder');
                            }
                        } else if (hasPreviousConversations) {
                            // User has conversations but no game conversations yet - show encouragement
                            welcomeMessage = `${timeGreeting}Welcome back! I see you've been chatting with me. Ready to dive into some actual gaming? Upload a screenshot from a game you're playing, or tell me what you'd like to play, and I'll help you get unstuck without spoilers!`;
                            console.log('User with conversations but no games yet - showing encouragement');
                        } else {
                            // Returning user without any history - show gentle reminder
                            welcomeMessage = `${timeGreeting}Welcome back! Ready to dive into some gaming? Upload a screenshot or tell me what you're playing, and I'll help you get unstuck without spoilers.`;
                            console.log('Returning user without any history - showing gentle reminder');
                        }
                        
                        console.log('📝 Adding welcome message to chat:', welcomeMessage);
                        addSystemMessage(welcomeMessage, 'everything-else', false);
                        
                        // Update tracking using Supabase service with automatic fallback
                        await supabaseDataService.updateWelcomeMessageShown();
                        console.log('✅ Welcome message tracking updated via Supabase service');
                        
                        // Mark welcome message as shown this session to prevent duplicates
                        setWelcomeMessageShownThisSession(true);
                    } else {
                        console.log('❌ Welcome message not shown - conditions not met:', {
                            hasCompletedProfileSetup,
                            shouldShow,
                            hasExistingWelcomeMessage
                        });
                    }
                } catch (error) {
                    console.error('Error checking welcome message:', error);
                }
            };
            
            // Execute the welcome message check
            checkWelcomeMessage();
        }
    }, [view, onboardingStatus, addSystemMessage, conversations]);



    if (view === 'landing') {
        // Redirect to login instead of showing landing page
        setOnboardingStatus('login');
        setView('app');
        return null;
    }


    if (onboardingStatus === 'login') {
        return <LoginSplashScreen 
            onComplete={handleLoginComplete} 
            onOpenPrivacy={() => setActiveModal('privacy')}
            onOpenTerms={() => setActiveModal('about')}
        />;
    }

    if (onboardingStatus === 'initial') {
        return <InitialSplashScreen onComplete={handleInitialSplashComplete} />;
    }

    if (onboardingStatus === 'features') {
        return (
            <SplashScreen
                onComplete={handleFeaturesSplashComplete}
                onSkipConnection={handleFeaturesSplashComplete}
                onConnect={connect}
                status={connectionStatus}
                error={connectionError}
                connectionCode={connectionCode}
                onConnectionSuccess={handleFeaturesSplashComplete}
            />
        );
    }
    
    if (onboardingStatus === 'pro-features') {
        return <ProFeaturesSplashScreen onComplete={handleProFeaturesComplete} onUpgrade={handleUpgradeAndContinue} onUpgradeToVanguard={handleUpgradeToVanguardAndContinue} />;
    }
    
    if (onboardingStatus === 'how-to-use') {
        return <HowToUseSplashScreen onComplete={handleHowToUseComplete} />;
    }

    
    if (showUpgradeScreen) {
        return <UpgradeSplashScreen onUpgrade={handleUpgrade} onClose={handleCloseUpgradeScreen} onUpgradeToVanguard={handleUpgradeToVanguard} />;
    }

    const headerContent = (
        <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] leading-normal">Otagon</h1>
        </div>
    );

    const isInputDisabled = loadingMessages.length > 0;
    const isProView = usage.tier !== 'free' && activeConversation && activeConversation.id !== 'everything-else' && activeConversation.insights;
    const hasInsights = usage.tier !== 'free' && !!(activeConversation?.insightsOrder && activeConversation.insightsOrder.length > 0);

    return (
        <div className="h-screen bg-black text-[#F5F5F5] flex flex-col font-inter relative overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
            <audio ref={silentAudioRef} src={SILENT_AUDIO_URL} loop playsInline />

            <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial-at-top from-[#1C1C1C]/40 to-transparent -z-0 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-radial-at-bottom from-[#0A0A0A]/30 to-transparent -z-0 pointer-events-none"></div>
            
            <header className={`relative flex-shrink-0 flex items-center justify-between p-2 sm:p-3 md:p-4 lg:p-6 bg-black/80 backdrop-blur-xl z-20 border-b border-[#424242]/20 shadow-2xl`}>
                <button
                    type="button"
                    className="transition-all duration-200 hover:opacity-80 hover:scale-105 group flex-shrink-0"
                    aria-label="Otagon logo and title"
                >
                    <div className="flex items-center gap-4">
                        <div className="group-hover:scale-110 transition-transform duration-200">
                            {headerContent}
                        </div>
                    </div>
                </button>
                
                {/* Enhanced Features Status Bar */}
                <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
                    
                </div>
                <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
                     <CreditIndicator usage={usage} onClick={handleOpenCreditModal} />
                     <HandsFreeToggle
                        isHandsFree={isHandsFreeMode}
                        onToggle={handleHandsFreeClick}
                     />
                    <button
                        type="button"
                        onClick={handleOpenConnectionModal}
                        className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 h-10 w-10 sm:w-auto sm:px-3 md:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 disabled:opacity-50
                        ${
                            connectionStatus === ConnectionStatus.CONNECTED
                            ? 'border-2 border-[#5CBB7B]/60 text-[#5CBB7B] hover:bg-[#5CBB7B]/10 hover:border-[#5CBB7B] shadow-[0_0_20px_rgba(92,187,123,0.4)] hover:shadow-[0_0_30px_rgba(92,187,123,0.6)]'
                            : 'bg-gradient-to-r from-[#2E2E2E] to-[#1C1C1C] border-2 border-[#424242]/60 text-[#CFCFCF] hover:bg-gradient-to-r hover:from-[#424242] hover:to-[#2E2E2E] hover:border-[#5A5A5A] hover:scale-105'
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
                    >
                        <DesktopIcon className="w-5 h-5 flex-shrink-0" />
                        <span className="hidden sm:inline font-medium">
                        {
                            connectionStatus === ConnectionStatus.CONNECTED ? 'Connected' :
                            connectionStatus === ConnectionStatus.CONNECTING ? 'Connecting...' :
                            'Connect to PC'
                        }
                        </span>
                    </button>
                    
                    {/* Force Reconnect Button - Only show when disconnected and have a saved code */}
                    {connectionStatus === ConnectionStatus.DISCONNECTED && 
                     connectionCode && (
                        <button
                            type="button"
                            onClick={forceReconnect}
                            className="flex items-center gap-1.5 sm:gap-2 h-10 w-10 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-[#2E2E2E] to-[#1C1C1C] border-2 border-[#424242]/60 text-[#CFCFCF] hover:from-[#424242] hover:to-[#2E2E2E] hover:border-[#5A5A5A] hover:scale-105 transition-all duration-300 shadow-lg"
                            title="Force reconnect with saved code"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="hidden sm:inline">Reconnect</span>
                        </button>
                    )}
                    

                    
                    <button
                        type="button"
                        onClick={handleSettingsClick}
                        onContextMenu={handleSettingsClick}
                        className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 h-10 w-10 sm:w-auto sm:px-3 md:px-4 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-[#2E2E2E] to-[#1C1C1C] border-2 border-[#424242]/60 text-white/90 transition-all duration-300 hover:from-[#424242] hover:to-[#2E2E2E] hover:scale-105 hover:shadow-lg"
                        aria-label="Open settings"
                    >
                        <SettingsIcon className="w-5 h-5 flex-shrink-0" />
                        <span className="hidden sm:inline font-medium">Settings</span>
                    </button>


                </div>
            </header>
            
            {usage.tier === 'free' && (
              <div className="pb-3">
                <AdBanner />
              </div>
            )}

            {/* Daily Engagement Components */}
            {/* {showDailyCheckin && (
              <DailyCheckinBanner
                onClose={() => setShowDailyCheckin(false)}
                autoDismiss={false}
                dismissDelay={0}
              />
            )} */}



            {/* Player Profile Setup Modal - Show instead of session continuation for first-time users */}
            {showProfileSetup && (
              <PlayerProfileSetupModal
                isOpen={showProfileSetup}
                onComplete={handleProfileSetupComplete}
                onSkip={handleProfileSetupSkip}
              />
            )}

            {currentAchievement && (
              <AchievementNotification
                achievement={currentAchievement}
                onClose={() => setCurrentAchievement(null)}
                onShare={() => {
                  // Handle sharing achievement
                  console.log('Sharing achievement:', currentAchievement.title);
                }}
                autoDismiss={false}
                dismissDelay={0}
              />
            )}
            
            {/* Enhanced Features Notifications */}
            {/* Sync success notification removed - no need to show successful sync */}
            
            {databaseSyncStatus === 'error' && (
              <div className="fixed top-20 right-4 z-50 bg-red-600/90 backdrop-blur-xl text-white px-4 py-3 rounded-lg shadow-2xl border border-red-500/30 animate-fade-in">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm font-medium">Database sync failed. Click sync button to retry.</span>
                </div>
              </div>
            )}

            <ConversationTabs
                conversations={conversations}
                conversationsOrder={conversationsOrder}
                activeConversationId={activeConversationId}
                activeConversation={activeConversation}
                onSwitchConversation={handleSwitchConversation}
                onContextMenu={handleConversationContextMenu}
                onReorder={reorderConversations}
            />
            
            {/* Proactive Insights Panel */}
            {showProactiveInsights && authState.user && (
                <ProactiveInsightsPanel
                    isOpen={showProactiveInsights}
                    onClose={() => setShowProactiveInsights(false)}
                    onInsightAction={(insight) => {
                        console.log('Proactive insight action:', insight);
                        // TODO: Implement insight actions
                    }}
                />
            )}
            
            {/* Main Chat Interface - Hide when profile setup modal is active */}
            {!showProfileSetup && (
                <>
            {isProView ? (
                 <MainViewContainer
                    activeConversation={activeConversation!}
                    activeSubView={activeSubView}
                    onSubViewChange={handleSubTabClick}
                    onSendMessage={(prompt) => handleSendMessage(prompt)}
                    stopMessage={handleStopMessage}
                    isInputDisabled={isInputDisabled}
                    messages={messages}
                    loadingMessages={loadingMessages}
                    onUpgradeClick={handleUpgradeClick}
                    onFeedback={handleFeedback}
                    onRetry={retryMessage}
                    isFirstTime={isFirstTime}
                    onOpenWishlistModal={() => setIsWishlistModalOpen(true)}
                />
            ) : (
                 <main className="flex-1 flex flex-col px-3 sm:px-4 md:px-6 lg:px-8 pt-4 sm:pt-6 md:pt-8 pb-20 sm:pb-24 overflow-y-auto" ref={chatContainerRef}>
                    {messages.length === 0 && loadingMessages.length === 0 ? (
                        <div className="flex-1 flex flex-col justify-center items-center">
                            {shouldShowSuggestedPromptsEnhanced() && (
                                <SuggestedPrompts 
                                    onPromptClick={(prompt) => handleSendMessage(prompt)} 
                                    isInputDisabled={isInputDisabled}
                                    isFirstTime={isFirstTime}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 lg:gap-10 w-full max-w-[95%] sm:max-w-4xl md:max-w-5xl mx-auto my-4 sm:my-6 md:my-8 lg:my-10">
                            {(() => { const loadingSet = new Set(loadingMessages); return messages.map(msg => (
                                 <ChatMessageComponent
                                     key={msg.id}
                                     message={msg}
                                     isLoading={loadingSet.has(msg.id)}
                                     onStop={() => handleStopMessage(msg.id)}
                                     onPromptClick={(prompt) => handleSendMessage(prompt)}
                                     onUpgradeClick={handleUpgradeClick}
                                     onFeedback={(vote) => handleFeedback('message', activeConversationId, msg.id, msg.text, vote)}
                                     onRetry={() => retryMessage(msg.id)}
                                 />
                            ))})()}
                             
                             {/* Show suggested prompts directly below messages as part of chat flow - only when not loading */}
                             {shouldShowSuggestedPromptsEnhanced() && loadingMessages.length === 0 && (
                                 <SuggestedPrompts 
                                     onPromptClick={(prompt) => handleSendMessage(prompt)} 
                                     isInputDisabled={isInputDisabled}
                                     isFirstTime={isFirstTime}
                                 />
                             )}
                             
                             <div ref={chatEndRef} />
                        </div>
                    )}
                    
                </main>
            )}


                    {/* SubTabs - below prompts, visible when has insights (all users can see Otaku Diary) */}
                    {(activeConversation?.insights && activeConversation.id !== 'everything-else') || activeConversation?.id === 'everything-else' ? (
                <div className="w-full max-w-[95%] sm:max-w-4xl md:max-w-5xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4 flex items-center gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                        <SubTabs
                            activeConversation={activeConversation}
                            activeSubView={activeSubView}
                            onTabClick={handleSubTabClick}
                            userTier={usage.tier}
                            onReorder={reorderInsights}
                            onContextMenu={handleInsightContextMenu}
                            connectionStatus={connectionStatus}
                        />
                    </div>
                    <div className="flex-shrink-0">
                        <ScreenshotButton
                            isConnected={connectionStatus === ConnectionStatus.CONNECTED}
                            isProcessing={isInputDisabled}
                            isManualUploadMode={isManualUploadMode}
                            onRequestConnect={() => setIsConnectionModalOpen(true)}
                            usage={usage}
                        />
                    </div>
                </div>
            ) : null}

            

            


                    {/* Chat Input - Hide when profile setup modal is active */}
            <div className="flex-shrink-0 bg-black/60 backdrop-blur-xl z-10 border-t border-[#424242]/20 shadow-2xl">
                <ChatInput
                    value={chatInputValue}
                    onChange={setChatInputValue}
                    onSendMessage={handleSendMessage}
                    isCooldownActive={isInputDisabled}
                    onImageProcessingError={addSystemMessage}
                    usage={usage}
                    imagesForReview={imagesForReview}
                    onImagesReviewed={clearImagesForReview}
                    isManualUploadMode={isManualUploadMode}
                    onToggleManualUploadMode={() => setIsManualUploadMode(prev => !prev)}
                    connectionStatus={connectionStatus}
                    textareaRef={chatInputRef}
                    onBatchUploadAttempt={handleBatchUploadAttempt}
                    activeConversation={activeConversation}
                    hasInsights={hasInsights}
                />
            </div>
                </>
            )}
            
            {isSettingsModalOpen && (
                <React.Suspense fallback={null}>
                <SettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    usage={usage}
                    onShowUpgrade={() => setShowUpgradeScreen(true)}
                    onShowVanguardUpgrade={handleUpgradeToVanguard}
                    onLogout={handleLogout}
                    onResetApp={handleResetApp}
                    onShowHowToUse={() => setOnboardingStatus('how-to-use')}
                    userEmail={authState.user?.email || ''}
                    onClearFirstRunCache={clearFirstRunCache}
                    refreshUsage={refreshUsage}
                />
                </React.Suspense>
            )}

            {contextMenu && <ContextMenu {...contextMenu} onClose={() => setContextMenu(null)} />}

            {confirmationModal && (
                <ConfirmationModal
                    title={confirmationModal.title}
                    message={confirmationModal.message}
                    onConfirm={() => {
                        confirmationModal.onConfirm();
                        setConfirmationModal(null);
                    }}
                    onCancel={() => setConfirmationModal(null)}
                />
            )}

            {feedbackModalState && (
                <FeedbackModal
                    originalText={feedbackModalState.originalText}
                    onClose={() => setFeedbackModalState(null)}
                    onSubmit={handleFeedbackSubmit}
                />
            )}
            
             {pendingModification && (
                <InsightActionModal
                    currentTitle={activeConversation?.insights?.[pendingModification.id]?.title || 'Insight'}
                    suggestion={pendingModification}
                    onOverwrite={() => {
                        if (pendingModification.id && pendingModification.title && pendingModification.content) {
                            overwriteInsight(activeConversationId, pendingModification.id, pendingModification.title, pendingModification.content);
                        }
                        setPendingModification(null);
                    }}
                    onCreateNew={() => {
                        if (pendingModification.title && pendingModification.content) {
                            createNewInsight(activeConversationId, pendingModification.title, pendingModification.content);
                        }
                        setPendingModification(null);
                    }}
                    onCancel={() => setPendingModification(null)}
                />
            )}

            {isConnectionModalOpen && (
                <ConnectionModal
                    isOpen={isConnectionModalOpen}
                    onClose={handleCloseConnectionModal}
                    onConnect={connect}
                    onDisconnect={handleDisconnect}
                    status={connectionStatus}
                    error={connectionError}
                    connectionCode={connectionCode}
                    lastSuccessfulConnection={lastSuccessfulConnection ? new Date(lastSuccessfulConnection) : null}
                    onShowHowToUse={() => {
                        setIsConnectionModalOpen(false);
                        setOnboardingStatus('how-to-use');
                    }}
                />
            )}

            {isCreditModalOpen && (
                 <CreditModal
                    onClose={handleCloseCreditModal}
                    onUpgrade={() => setShowUpgradeScreen(true)}
                    usage={usage}
                 />
            )}

            {isHandsFreeModalOpen && (
                <HandsFreeModal
                    onClose={handleCloseHandsFreeModal}
                    isHandsFree={isHandsFreeMode}
                    onToggleHandsFree={handleToggleHandsFree}
                />
            )}

            {/* Cache Performance Dashboard */}
            {isCacheDashboardOpen && (
                <CachePerformanceDashboard
                    isOpen={isCacheDashboardOpen}
                    onClose={() => setIsCacheDashboardOpen(false)}
                />
            )}

            {/* Authentication Modal */}
            {isAuthModalOpen && (
                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                    onAuthSuccess={handleAuthSuccess}
                />
            )}

            
            {/* OAuth Callback Handler */}
            {isOAuthCallback && (
                <AuthCallbackHandler
                    onAuthSuccess={() => {
                        console.log('OAuth callback success, calling handleAuthSuccess...');
                        setIsOAuthCallback(false);
                        // Clear URL parameters
                        window.history.replaceState({}, document.title, window.location.pathname);
                        // Call the authentication success handler to properly transition
                        handleAuthSuccess();
                    }}
                    onAuthError={(error) => {
                        console.error('OAuth error:', error);
                        setIsOAuthCallback(false);
                        // Clear URL parameters
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }}
                    onRedirectToSplash={() => {
                        console.log('OAuth callback redirect to splash, calling handleAuthSuccess...');
                        setIsOAuthCallback(false);
                        // Clear URL parameters
                        window.history.replaceState({}, document.title, window.location.pathname);
                        // Call the authentication success handler to properly transition
                        handleAuthSuccess();
                    }}
                />
            )}

            {/* Direct OAuth Processing Fallback */}
            {isOAuthCallback && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-700">Processing authentication...</p>
                            <button 
                                onClick={() => {
                                    console.log('Manual OAuth completion triggered');
                                    setIsOAuthCallback(false);
                                    window.history.replaceState({}, document.title, window.location.pathname);
                                    handleAuthSuccess();
                                }}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Complete Authentication
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PWA Install Banner */}
            {/* PWA Install Banner removed - only shows on splash screens */}

            {isOtakuDiaryModalOpen && otakuDiaryGameInfo && (
                <OtakuDiaryModal
                    isOpen={isOtakuDiaryModalOpen}
                    onClose={() => setIsOtakuDiaryModalOpen(false)}
                    gameId={otakuDiaryGameInfo.id}
                    gameTitle={otakuDiaryGameInfo.title}
                />
            )}

            {/* Wishlist Modal */}
            {isWishlistModalOpen && (
                <WishlistModal
                    isOpen={isWishlistModalOpen}
                    onClose={() => setIsWishlistModalOpen(false)}
                />
            )}

            {/* UI Tutorial Modal */}
            {isTutorialOpen && (
                <UITutorial
                    isOpen={isTutorialOpen}
                    onComplete={completeTutorial}
                    onSkip={skipTutorial}
                />
            )}

        </div>
    );
};

// Wrap the app with ErrorBoundary
const App: React.FC = () => (
    <ErrorBoundary>
        <AppComponent />
    </ErrorBoundary>
);

export default App;
