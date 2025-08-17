import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ConnectionStatus, Conversation, Conversations, Insight, UserTier, Usage, ContextMenuState, ContextMenuItem, PendingInsightModification } from './services/types';
import ConnectionModal from './components/ConnectionModal';
import HandsFreeModal from './components/HandsFreeModal';
import DesktopIcon from './components/DesktopIcon';
import SplashScreen from './components/SplashScreen';
import InitialSplashScreen from './components/InitialSplashScreen';
import HowToUseSplashScreen from './components/HowToUseSplashScreen';
import LoginSplashScreen from './components/LoginSplashScreen';
import Logo from './components/Logo';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import SuggestedPrompts from './components/SuggestedPrompts';
import { useChat } from './hooks/useChat';
import { useConnection } from './hooks/useConnection';
import ConversationTabs from './components/ConversationTabs';
import LandingPage from './components/LandingPage';
import HandsFreeToggle from './components/HandsFreeToggle';
import { ttsService } from './services/ttsService';
import { unifiedUsageService } from './services/unifiedUsageService';
import { addFeedback } from './services/feedbackService';
import UpgradeSplashScreen from './components/UpgradeSplashScreen';
import ProFeaturesSplashScreen from './components/ProFeaturesSplashScreen';
import SubTabs from './components/SubTabs';
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
import DevTierSwitcher from './components/DevTierSwitcher';
import PolicyModal from './components/PolicyModal';
import AboutPage from './components/AboutPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import RefundPolicyPage from './components/RefundPolicyPage';
import EditIcon from './components/EditIcon';
import LogoutIcon from './components/LogoutIcon';
import { authService, AuthState } from './services/supabase';
import { useMigration } from './hooks/useMigration';
import MigrationModal from './components/MigrationModal';
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
import ScreenLockDebug from './components/ScreenLockDebug';
import AutoConnectionNotification from './components/AutoConnectionNotification';
import DailyCheckinBanner from './components/DailyCheckinBanner';
import SessionContinuationModal from './components/SessionContinuationModal';
import ProgressTrackingBar from './components/ProgressTrackingBar';
import AchievementNotification from './components/AchievementNotification';
import dailyEngagementService, { Achievement } from './services/dailyEngagementService';


// A data URL for a 1-second silent WAV file. This prevents needing to host an asset
// and is used to keep the app process alive in the background for TTS.
const SILENT_AUDIO_URL = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

type ImageFile = { base64: string; mimeType: string; dataUrl: string };
type FeedbackModalState = {
    type: 'message' | 'insight';
    conversationId: string;
    targetId: string; // messageId or insightId
    originalText: string;
};
type ActiveModal = 'about' | 'privacy' | 'refund' | null;


const AppComponent: React.FC = () => {
    const [view, setView] = useState<'landing' | 'app'>('landing');
    const [onboardingStatus, setOnboardingStatus] = useState<'login' | 'initial' | 'features' | 'pro-features' | 'how-to-use' | 'tier-splash' | 'complete'>(() => {
        const hasCompletedOnboarding = localStorage.getItem('otakonOnboardingComplete');
        return hasCompletedOnboarding ? 'complete' : 'login';
    });
    const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
    const [isHandsFreeModalOpen, setIsHandsFreeModalOpen] = useState(false);
    const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [hasRestored, setHasRestored] = useState(false);
    const [isHandsFreeMode, setIsHandsFreeMode] = useState(false);
    const [isManualUploadMode, setIsManualUploadMode] = useState(false);
    const [showUpgradeScreen, setShowUpgradeScreen] = useState(false);
    const [usage, setUsage] = useState<Usage>(() => unifiedUsageService.getUsage());
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
    
    // Migration State
    const { migrationState, migrateData, retryMigration, skipMigration } = useMigration();
    const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
    
    // Interactivity State
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [confirmationModal, setConfirmationModal] = useState<{ title: string; message: string; onConfirm: () => void; } | null>(null);
    const [feedbackModalState, setFeedbackModalState] = useState<FeedbackModalState | null>(null);
    const [chatInputValue, setChatInputValue] = useState('');

    // Daily Engagement State
    const [showDailyCheckin, setShowDailyCheckin] = useState(false);
    const [showSessionContinuation, setShowSessionContinuation] = useState(false);
    const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
    const [showProgressBar, setShowProgressBar] = useState(false);

    const chatInputRef = useRef<HTMLTextAreaElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const silentAudioRef = useRef<HTMLAudioElement>(null);

    const refreshUsage = useCallback(async () => {
        const syncedUsage = await unifiedUsageService.getUsageWithSync();
        setUsage(syncedUsage);
    }, []);

    // Authentication effect
    useEffect(() => {
        const unsubscribe = authService.subscribe(setAuthState);
        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
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
    
    // Check for OAuth callback on component mount
    useEffect(() => {
        const checkOAuthCallback = async () => {
            // Check if we're returning from an OAuth flow
            const urlParams = new URLSearchParams(window.location.search);
            const hasAuthParams = urlParams.has('access_token') || urlParams.has('refresh_token') || urlParams.has('error');
            
            if (hasAuthParams) {
                setIsOAuthCallback(true);
            }
        };
        
        checkOAuthCallback();
    }, []);

    // Migration effect
    useEffect(() => {
        if (authState.user && !migrationState.hasMigrated && !migrationState.isMigrating) {
            // Check if there's actually data to migrate
            const hasLocalData = localStorage.getItem('otakonConversations') || localStorage.getItem('otakonUsage');
            
            if (hasLocalData) {
                // Show migration modal if there's data to migrate
                setIsMigrationModalOpen(true);
            } else {
                // No data to migrate, go directly to main app
                setOnboardingStatus('complete');
                setView('app');
            }
        } else if (authState.user && migrationState.hasMigrated) {
            // Migration is complete (either successful or skipped), go to main app
            setOnboardingStatus('complete');
            setView('app');
        }
    }, [authState.user, migrationState.hasMigrated, migrationState.isMigrating]);

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
        if (view === 'app' && onboardingStatus === 'complete') {
            // Check if we should show daily check-in
            if (dailyEngagementService.shouldShowDailyCheckin()) {
                setShowDailyCheckin(true);
            }
            
            // Check if we should show session continuation
            if (dailyEngagementService.shouldShowSessionContinuation()) {
                setShowSessionContinuation(true);
            }
            
            // Show progress bar for pro users
            if (usage.tier !== 'free') {
                setShowProgressBar(true);
            }
        }
    }, [view, onboardingStatus, usage.tier]);

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
        loadInsightContent,
    } = useChat(isHandsFreeMode);
    
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
        } else if (data.type === 'screenshot' && data.dataUrl) {
            setActiveSubView('chat');
            const { dataUrl } = data;
            try {
                const [meta, base64] = dataUrl.split(',');
                if (!meta || !base64) throw new Error("Invalid Data URL from WebSocket.");
                
                const mimeTypeMatch = meta.match(/:(.*?);/);
                if (!mimeTypeMatch?.[1]) throw new Error("Could not extract MIME type.");
                
                setIsConnectionModalOpen(false);
                const imageData = { base64, mimeType: mimeTypeMatch[1], dataUrl };

                if (isManualUploadMode) {
                     if (usage.tier === 'free' && imagesForReview.length > 0) {
                        addSystemMessage("Multiple hotkeys detected in manual review mode. Free users can only analyze one screenshot at a time. Please send or clear the current image before capturing a new one.");
                        return; // Ignore the new screenshot for free users
                    }
                    setImagesForReview(prevImages => {
                        const limit = usage.tier === 'pro' ? 5 : 1;
                        const newImages = [...prevImages, imageData];
                        if (newImages.length > limit) {
                            addSystemMessage(`You can add a maximum of ${limit} image(s) for review.`);
                            return newImages.slice(-limit); // Keep the latest N images
                        }
                        return newImages;
                    });
                } else {
                    if (usage.tier === 'free' && loadingMessages.length > 0) {
                        addSystemMessage("An analysis is already in progress. Please wait for it to complete before sending a new screenshot.");
                        return;
                    }
                    await sendMessage('', [imageData], true);
                }
            } catch (e) {
                const errorText = e instanceof Error ? e.message : 'Unknown error processing screenshot.';
                addSystemMessage(`Failed to process received screenshot. ${errorText}`);
            }
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
        isAutoConnecting,
        autoConnectAttempts,
        lastSuccessfulConnection,
        forceReconnect,
    } = useConnection(handleScreenshotReceived);
    
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
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loadingMessages]);
    

    useEffect(() => {
        const hasConnectedBefore = localStorage.getItem('otakonHasConnectedBefore') === 'true';

        if (connectionStatus === ConnectionStatus.CONNECTED && !hasConnectedBefore) {
            localStorage.setItem('otakonHasConnectedBefore', 'true');
            if (onboardingStatus === 'complete') {
                setIsConnectionModalOpen(false);
                setOnboardingStatus('how-to-use');
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

    const executeFullReset = useCallback(() => {
        if (send) {
            send({ type: 'clear_history' });
        }
        ttsService.cancel();
        disconnect();
        resetConversations();
        unifiedUsageService.reset();
        refreshUsage();
        localStorage.removeItem('lastConnectionCode');
        localStorage.removeItem('otakonOnboardingComplete');
        localStorage.removeItem('otakonHasConnectedBefore');
        localStorage.removeItem('otakonAuthMethod');
        localStorage.removeItem('otakonInstallDismissed');
        setOnboardingStatus('login');
        setIsHandsFreeMode(false);
        setIsConnectionModalOpen(false);
        setView('landing');
    }, [send, disconnect, resetConversations]);
    
    const handleLogout = useCallback(async () => {
        setConfirmationModal({
            title: 'Sign Out?',
            message: 'Are you sure you want to sign out? You can sign back in anytime.',
            onConfirm: async () => {
                try {
                    // Sign out from Supabase
                    await authService.signOut();
                    
                    // Clear local data
                    if (send) {
                        send({ type: 'clear_history' });
                    }
                    ttsService.cancel();
                    disconnect();
                    resetConversations();
                    unifiedUsageService.reset();
                    refreshUsage();
                    
                    // Clear localStorage
                    localStorage.removeItem('lastConnectionCode');
                    localStorage.removeItem('otakonOnboardingComplete');
                    localStorage.removeItem('otakonHasConnectedBefore');
                    localStorage.removeItem('otakonAuthMethod');
                    localStorage.removeItem('otakonInstallDismissed');
                    
                    // Reset app state
                    setOnboardingStatus('login');
                    setIsHandsFreeMode(false);
                    setIsConnectionModalOpen(false);
                    setView('landing');
                    
                    console.log('User logged out successfully');
                } catch (error) {
                    console.error('Logout error:', error);
                    // Even if Supabase logout fails, clear local data
                    executeFullReset();
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
    const handleProFeaturesComplete = useCallback(() => completeOnboarding(), [completeOnboarding]);
    const handleHowToUseComplete = useCallback(() => completeOnboarding(), []);
    
    const handleSendMessage = useCallback(async (text: string, images?: ImageFile[], isFromPC: boolean = false) => {
        setChatInputValue(''); // Clear controlled input on send
        setActiveSubView('chat');
        const result = await sendMessage(text, images, isFromPC);
        refreshUsage();

        if (result?.success) {
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
                
                // Update session progress
                const gameProgress = activeConversation.progress || 0;
                dailyEngagementService.updateSessionProgress(
                    activeConversation.id,
                    activeConversation.id,
                    gameProgress,
                    'Chat interaction'
                );
                
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
                        reward: '+100 Otakon Points'
                    });
                }
            }
            
            // Update last session time
            dailyEngagementService.updateLastSessionTime();
        } else if (result?.reason === 'limit_reached') {
            setShowUpgradeScreen(true);
        }
    }, [sendMessage, activeConversation]);
    
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
    
    const handleGetStarted = useCallback(() => setView('app'), []);
    const handleLoginComplete = useCallback(() => {
        // Check if user skipped login (for testing/development)
        const authMethod = localStorage.getItem('otakonAuthMethod');
        if (authMethod === 'skip') {
            // Skip mode - go directly to app with tier switching enabled
            setOnboardingStatus('complete');
            setView('app');
        } else {
            // Normal login - go to initial splash screen
            setOnboardingStatus('initial');
        }
    }, []);
    const handleInitialSplashComplete = useCallback(() => setOnboardingStatus('features'), []);
    const handleCloseUpgradeScreen = useCallback(() => setShowUpgradeScreen(false), []);
    const handleOpenConnectionModal = useCallback(() => setIsConnectionModalOpen(true), []);
    const handleCloseConnectionModal = useCallback(() => setIsConnectionModalOpen(false), []);
    const handleCloseHandsFreeModal = useCallback(() => setIsHandsFreeModalOpen(false), []);
    const handleOpenCreditModal = useCallback(() => setIsCreditModalOpen(true), []);
    const handleCloseCreditModal = useCallback(() => setIsCreditModalOpen(false), []);

    // Authentication handlers
    const handleAuthSuccess = useCallback(() => {
        setIsAuthModalOpen(false);
        // After successful login, take user to the first splash screen
        setOnboardingStatus('initial');
        setView('app');
    }, []);

    const handleOpenAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
    
    const handleMigrationSuccess = useCallback(() => {
        setIsMigrationModalOpen(false);
        // After successful migration, go to the first splash screen
        setOnboardingStatus('initial');
        setView('app');
    }, []);

    const handleBatchUploadAttempt = useCallback(() => {
        addSystemMessage("Uploading multiple images is a Pro feature. Please select only one image or upgrade for batch analysis.", activeConversationId, true);
        setShowUpgradeScreen(true);
    }, [addSystemMessage, activeConversationId]);

    const handleSubTabClick = useCallback((id: string) => {
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
    }, [activeConversation, fetchInsightContent, markInsightAsRead]);


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
        const menuItems: ContextMenuItem[] = [
            {
                label: 'Settings',
                icon: SettingsIcon,
                action: () => setIsSettingsModalOpen(true),
            },
            {
                label: 'Logout & Reset',
                icon: LogoutIcon,
                isDestructive: true,
                action: handleResetApp,
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

    if (view === 'landing') {
        return (
            <>
                <LandingPage 
                    onGetStarted={handleGetStarted} 
                    onOpenAbout={() => setActiveModal('about')}
                    onOpenPrivacy={() => setActiveModal('privacy')}
                    onOpenRefund={() => setActiveModal('refund')}
                />
                {activeModal === 'about' && <PolicyModal title="About Otakon" onClose={() => setActiveModal(null)}><AboutPage /></PolicyModal>}
                {activeModal === 'privacy' && <PolicyModal title="Privacy Policy" onClose={() => setActiveModal(null)}><PrivacyPolicyPage /></PolicyModal>}
                {activeModal === 'refund' && <PolicyModal title="Refund Policy" onClose={() => setActiveModal(null)}><RefundPolicyPage /></PolicyModal>}
            </>
        );
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
        <div className="flex items-center gap-3">
            <Logo className="h-8 w-8" />
            <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40]">Otakon</h1>
        </div>
    );

    const isInputDisabled = loadingMessages.length > 0;
    const isProView = usage.tier !== 'free' && activeConversation && activeConversation.id !== 'everything-else' && activeConversation.insights;
    const hasInsights = usage.tier !== 'free' && !!(activeConversation?.insightsOrder && activeConversation.insightsOrder.length > 0);

    return (
        <div className="h-screen bg-black text-[#F5F5F5] flex flex-col font-inter relative animate-fade-in" onContextMenu={(e) => e.preventDefault()}>
            <audio ref={silentAudioRef} src={SILENT_AUDIO_URL} loop playsInline />

            <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial-at-top from-[#1C1C1C]/30 to-transparent -z-0 pointer-events-none"></div>
            <header className={`relative flex-shrink-0 flex items-center justify-between p-4 bg-black/70 backdrop-blur-lg z-20`}>
                <button
                    type="button"
                    onClick={() => setView('landing')}
                    className="transition-opacity hover:opacity-80"
                    aria-label="Reset application and return to landing page"
                >
                    {headerContent}
                </button>
                <div className="flex items-center gap-2">
                     <CreditIndicator usage={usage} onClick={handleOpenCreditModal} />
                     <DevTierSwitcher currentTier={usage.tier} onSwitch={refreshUsage} />
                     <HandsFreeToggle
                        isHandsFree={isHandsFreeMode}
                        onToggle={handleHandsFreeClick}
                     />
                    <button
                        type="button"
                        onClick={handleOpenConnectionModal}
                        className={`flex items-center justify-center gap-2 px-3 h-10 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50
                        ${
                            connectionStatus === ConnectionStatus.CONNECTED
                            ? 'border border-[#5CBB7B]/50 text-[#5CBB7B] hover:bg-[#5CBB7B]/10 shadow-[0_0_12px_rgba(92,187,123,0.3)]'
                            : 'bg-[#2E2E2E] border border-[#424242] text-[#CFCFCF] hover:bg-[#424242] hover:border-[#5A5A5A]'
                        }
                        ${
                            connectionStatus === ConnectionStatus.CONNECTING || isAutoConnecting ? 'animate-pulse' : ''
                        }
                        `}
                        title={
                            isAutoConnecting 
                                ? `Auto-connecting... (Attempt ${autoConnectAttempts}/3)` 
                                : connectionStatus === ConnectionStatus.CONNECTED 
                                    ? 'Connected to PC' 
                                    : 'Connect to PC'
                        }
                    >
                        <DesktopIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">
                        {
                            connectionStatus === ConnectionStatus.CONNECTED ? 'Connected' :
                            connectionStatus === ConnectionStatus.CONNECTING ? 'Connecting...' :
                            isAutoConnecting ? `Auto-connecting (${autoConnectAttempts}/3)` :
                            'Connect to PC'
                        }
                        </span>
                    </button>
                    
                    {/* Force Reconnect Button - Only show when disconnected and have a saved code */}
                    {connectionStatus === ConnectionStatus.DISCONNECTED && 
                     connectionCode && 
                     !isAutoConnecting && (
                        <button
                            type="button"
                            onClick={forceReconnect}
                            className="flex items-center justify-center gap-2 px-2 h-10 rounded-lg text-xs font-medium bg-[#2E2E2E] border border-[#424242] text-[#CFCFCF] hover:bg-[#424242] hover:border-[#5A5A5A] transition-all duration-200"
                            title="Force reconnect with saved code"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="hidden sm:inline">Reconnect</span>
                        </button>
                    )}
                    
                    {/* Authentication Button */}
                    {!authState.user ? (
                        <button
                            type="button"
                            onClick={handleOpenAuthModal}
                            className="flex items-center justify-center gap-2 px-3 h-10 rounded-lg text-sm font-medium bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white transition-transform hover:scale-105"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="hidden sm:inline">Sign In</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-2 px-3 h-10 rounded-lg text-sm font-medium bg-[#2E2E2E] border border-[#424242] text-white/80 transition-colors hover:bg-[#424242]"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    )}
                    
                    <button
                        type="button"
                        onClick={handleSettingsClick}
                        onContextMenu={handleSettingsClick}
                        className="flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium bg-[#2E2E2E] border border-[#424242] text-white/80 transition-colors hover:bg-[#424242]"
                        aria-label="Open settings"
                    >
                        <SettingsIcon className="w-5 h-5" />
                    </button>
                </div>
            </header>
            
            {usage.tier === 'free' && (
              <div className="pb-2">
                <AdBanner />
              </div>
            )}

            {/* Daily Engagement Components */}
            {showDailyCheckin && (
              <DailyCheckinBanner
                onClose={() => setShowDailyCheckin(false)}
                autoDismiss={true}
                dismissDelay={15000}
              />
            )}

            {showSessionContinuation && (
              <SessionContinuationModal
                onClose={() => setShowSessionContinuation(false)}
                onContinueSession={(gameId) => {
                  // Switch to the specific game conversation
                  if (conversations[gameId]) {
                    switchConversation(gameId);
                  }
                  setShowSessionContinuation(false);
                }}
                onStartNew={() => {
                  // Switch to "Everything Else" conversation
                  switchConversation('everything-else');
                  setShowSessionContinuation(false);
                }}
                autoDismiss={true}
                dismissDelay={20000}
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
                autoDismiss={true}
                dismissDelay={10000}
              />
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
            
            {isProView ? (
                 <MainViewContainer
                    activeConversation={activeConversation!}
                    activeSubView={activeSubView}
                    onSubViewChange={handleSubTabClick}
                    onSendMessage={(prompt) => handleSendMessage(prompt)}
                    stopMessage={stopMessage}
                    isInputDisabled={isInputDisabled}
                    messages={messages}
                    loadingMessages={loadingMessages}
                    onUpgradeClick={handleUpgradeClick}
                    onFeedback={handleFeedback}
                    onRetry={retryMessage}
                />
            ) : (
                 <main className="flex-1 flex flex-col px-4 pt-4 pb-2 overflow-y-auto">
                    {messages.length === 0 && loadingMessages.length === 0 ? (
                        <div className="flex-1 flex flex-col justify-end">
                            <SuggestedPrompts onPromptClick={(prompt) => handleSendMessage(prompt)} isInputDisabled={isInputDisabled} />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto my-4">
                            {messages.map(msg => (
                                <ChatMessage
                                    key={msg.id}
                                    message={msg}
                                    isLoading={loadingMessages.includes(msg.id)}
                                    onStop={() => stopMessage(msg.id)}
                                    onPromptClick={(prompt) => handleSendMessage(prompt)}
                                    onUpgradeClick={handleUpgradeClick}
                                    onFeedback={(vote) => handleFeedback('message', activeConversationId, msg.id, msg.text, vote)}
                                    onRetry={() => retryMessage(msg.id)}
                                />
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                    )}
                </main>
            )}

            {isProView && (
                <SubTabs
                    activeConversation={activeConversation}
                    activeSubView={activeSubView}
                    onTabClick={handleSubTabClick}
                    userTier={usage.tier}
                    onReorder={reorderInsights}
                    onContextMenu={handleInsightContextMenu}
                    onLoadInsight={loadInsightContent}
                />
            )}

            <div className="flex-shrink-0 bg-black/50 backdrop-blur-sm z-10">
                {/* Progress Tracking Bar for Pro Users */}
                {showProgressBar && activeConversation && activeConversation.id !== 'everything-else' && (
                  <ProgressTrackingBar
                    gameId={activeConversation.id}
                    gameTitle={activeConversation.id}
                    onViewProgress={() => {
                      // TODO: Open progress dashboard
                      console.log('View progress clicked');
                    }}
                    onSetGoals={() => {
                      // TODO: Open goals setting modal
                      console.log('Set goals clicked');
                    }}
                  />
                )}
                
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
            
            {isSettingsModalOpen && (
                <SettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    usage={usage}
                    onShowUpgrade={() => setShowUpgradeScreen(true)}
                    onShowVanguardUpgrade={handleUpgradeToVanguard}
                    onLogout={handleLogout}
                    onResetApp={handleResetApp}
                    userEmail={authState.user?.email}
                />
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
                        overwriteInsight(activeConversationId, pendingModification.id, pendingModification.title, pendingModification.content);
                        setPendingModification(null);
                    }}
                    onCreateNew={() => {
                        createNewInsight(activeConversationId, pendingModification.title, pendingModification.content);
                        setPendingModification(null);
                    }}
                    onCancel={() => setPendingModification(null)}
                />
            )}

            {isConnectionModalOpen && (
                <ConnectionModal
                    onClose={handleCloseConnectionModal}
                    onConnect={connect}
                    onDisconnect={handleDisconnect}
                    status={connectionStatus}
                    error={connectionError}
                    connectionCode={connectionCode}
                    isAutoConnecting={isAutoConnecting}
                    autoConnectAttempts={autoConnectAttempts}
                    lastSuccessfulConnection={lastSuccessfulConnection}
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

            {/* Authentication Modal */}
            {isAuthModalOpen && (
                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                    onAuthSuccess={handleAuthSuccess}
                />
            )}

            {/* Migration Modal */}
            {isMigrationModalOpen && (
                <MigrationModal
                    isOpen={isMigrationModalOpen}
                    onClose={handleMigrationSuccess}
                    migrationState={migrationState}
                    onMigrate={migrateData}
                    onRetry={retryMigration}
                    onSkip={skipMigration}
                />
            )}
            
            {/* OAuth Callback Handler */}
            {isOAuthCallback && (
                <AuthCallbackHandler
                    onAuthSuccess={() => {
                        setIsOAuthCallback(false);
                        // Clear URL parameters
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }}
                    onAuthError={(error) => {
                        console.error('OAuth error:', error);
                        setIsOAuthCallback(false);
                        // Clear URL parameters
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }}
                    onRedirectToSplash={() => {
                        setIsOAuthCallback(false);
                        // Clear URL parameters
                        window.history.replaceState({}, document.title, window.location.pathname);
                        // Redirect to initial splash screen
                        setOnboardingStatus('initial');
                        setView('app');
                    }}
                />
            )}

            {/* PWA Install Banner */}
            <PWAInstallBanner />
            <ScreenLockDebug />
            <AutoConnectionNotification
                isAutoConnecting={isAutoConnecting}
                autoConnectAttempts={autoConnectAttempts}
                connectionStatus={connectionStatus}
                connectionCode={connectionCode}
                lastSuccessfulConnection={lastSuccessfulConnection}
            />
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
