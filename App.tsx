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
import ChatMessageComponent from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import SuggestedPrompts from './components/SuggestedPrompts';
import { useChat } from './hooks/useChat';
import { useConnection } from './hooks/useConnection';
import ConversationTabs from './components/ConversationTabs';
import LandingPage from './components/NewLandingPage';
import ContactUsModal from './components/ContactUsModal';
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

import PolicyModal from './components/PolicyModal';
import AboutPage from './components/AboutPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import RefundPolicyPage from './components/RefundPolicyPage';
import EditIcon from './components/EditIcon';
import LogoutIcon from './components/LogoutIcon';
import UserIcon from './components/UserIcon';
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

import AutoConnectionNotification from './components/AutoConnectionNotification';
import DailyCheckinBanner from './components/DailyCheckinBanner';
import SessionContinuationModal from './components/SessionContinuationModal';
import ProgressTrackingBar from './components/ProgressTrackingBar';
import AchievementNotification from './components/AchievementNotification';
import dailyEngagementService, { Achievement } from './services/dailyEngagementService';
import { PlayerProfileSetupModal } from './components/PlayerProfileSetupModal';
import { playerProfileService } from './services/playerProfileService';
import { ProactiveInsightsPanel } from './components/ProactiveInsightsPanel';
import { useEnhancedInsights } from './hooks/useEnhancedInsights';
import { proactiveInsightService } from './services/proactiveInsightService';
import { databaseService } from './services/databaseService';


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
type ActiveModal = 'about' | 'privacy' | 'refund' | 'contact' | null;


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
    
    // Player Profile Setup State
    const [showProfileSetup, setShowProfileSetup] = useState(false);
    const [isFirstTime, setIsFirstTime] = useState(false);
    
    // Enhanced Features State
    const [showProactiveInsights, setShowProactiveInsights] = useState(false);
    const [databaseSyncStatus, setDatabaseSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
    const [lastDatabaseSync, setLastDatabaseSync] = useState<number>(Date.now());
    const [lastSuggestedPromptsShown, setLastSuggestedPromptsShown] = useState<number>(0);
    
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

    // Initialize suggested prompts cooldown from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('lastSuggestedPromptsShown');
        if (stored) {
            setLastSuggestedPromptsShown(parseInt(stored, 10));
        }
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
        console.log('Daily Engagement Effect - view:', view, 'onboardingStatus:', onboardingStatus, 'usage.tier:', usage.tier);
        
        // Show daily engagement for both onboarding and main app
        if (view === 'app' && onboardingStatus !== 'complete') {
            console.log('Checking daily engagement conditions...');
            
            // Check if we should show daily check-in
            const shouldShowCheckin = dailyEngagementService.shouldShowDailyCheckin();
            console.log('Should show daily checkin:', shouldShowCheckin);
            if (shouldShowCheckin) {
                console.log('Setting showDailyCheckin to true');
                setShowDailyCheckin(true);
            }
            
            // Check if we should show session continuation
            const shouldShowSession = dailyEngagementService.shouldShowSessionContinuation();
            console.log('Should show session continuation:', shouldShowSession);
            if (shouldShowSession && !isFirstTime) {
                console.log('Setting showSessionContinuation to true');
                setShowSessionContinuation(true);
            }
            
            // Show progress bar for pro users
            if (usage.tier !== 'free') {
                console.log('Setting showProgressBar to true for tier:', usage.tier);
                setShowProgressBar(true);
            }
        }
    }, [view, onboardingStatus, usage.tier, isFirstTime]);

    // Player Profile Setup Check
    useEffect(() => {
        if (view === 'app' && onboardingStatus === 'complete') {
            // Check if user needs profile setup
            const needsProfile = playerProfileService.needsProfileSetup();
            if (needsProfile) {
                setIsFirstTime(true);
                setShowProfileSetup(true);
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

    } = useChat(isHandsFreeMode);
    
    // Enhanced Insights Hook
    const enhancedInsights = useEnhancedInsights(
        activeConversationId,
        activeConversation?.id,
        activeConversation?.genre,
        activeConversation?.progress
    );
    
    // Enhanced suggested prompts logic that can access conversations
    const shouldShowSuggestedPromptsEnhanced = useCallback((): boolean => {
        // Show prompts if:
        // 1. First run experience (isFirstTime is true)
        // 2. No messages in conversation (first time or cleared)
        // 3. User hasn't interacted with chat yet (no text queries or images)
        // 4. Game pill hasn't been created yet (keep available in "Everything Else" tab)
        
        const hasInteractedWithChat = localStorage.getItem('otakon_has_interacted_with_chat') === 'true';
        const hasGamePill = Object.keys(conversations).some(id => id !== 'everything-else');
        
        return isFirstTime || 
               lastSuggestedPromptsShown === 0 || 
               (!hasInteractedWithChat && !hasGamePill);
    }, [lastSuggestedPromptsShown, isFirstTime, conversations]);
    
    // Database synchronization function
    const syncToDatabase = useCallback(async () => {
        if (!authState.user) return;
        
        try {
            setDatabaseSyncStatus('syncing');
            
            // Sync player profile
            const profile = playerProfileService.getProfile();
            if (profile) {
                await databaseService.syncPlayerProfile(profile);
            }
            
            // Sync game contexts for all conversations
            for (const [conversationId, conversation] of Object.entries(conversations)) {
                if (conversation.id !== 'everything-else') {
                    const gameContext = playerProfileService.getGameContext(conversation.id);
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
    }, [authState.user, conversations]);
    
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
        
        // Use sendMessage to display the images grouped together in one message
        // sendMessage will create one userMessage with all images in the images array
        const result = await sendMessage(`📸 Multi-shot capture: ${formattedImageFiles.length} screenshots`, formattedImageFiles, true);
        
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
                        
                        // Process immediately - sendMessage will handle the display
                        await sendMessage('', [imageData], true);
                        
                    } else {
                        // Manual review mode
                        if (usage.tier === 'free' && imagesForReview.length > 0) {
                            // Only show this message once, don't spam the user
                            console.log(`⚠️ Manual review queue has images, skipping single shot`);
                            return;
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
        isAutoConnecting,
        autoConnectAttempts,
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
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loadingMessages]);
    

    useEffect(() => {
        const hasConnectedBefore = localStorage.getItem('otakonHasConnectedBefore') === 'true';

        if (connectionStatus === ConnectionStatus.CONNECTED && !hasConnectedBefore) {
            localStorage.setItem('otakonHasConnectedBefore', 'true');
            // Always show "How to Use" screen after first connection, regardless of onboarding status
            setIsConnectionModalOpen(false);
            setOnboardingStatus('how-to-use');
            console.log('🎉 First PC connection! Showing "How to Use" splash screen');
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
        // Record when user interacts with chat (any text query or image upload)
        if (activeConversation?.id === 'everything-else' && !isFirstTime) {
            // Check if this is any kind of user interaction
            if (text.trim().length > 0 || (images && images.length > 0)) {
                // User has interacted with chat - hide suggested prompts
                localStorage.setItem('otakon_has_interacted_with_chat', 'true');
                console.log('📝 User interacted with chat - hiding suggested prompts');
            }
        }
        
        setChatInputValue(''); // Clear controlled input on send
        setActiveSubView('chat');
        const result = await sendMessage(text, images, isFromPC);
        refreshUsage();

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
    }, [sendMessage, activeConversation, activeConversationId, isFirstTime, setChatInputValue, setActiveSubView, refreshUsage, dailyEngagementService, setCurrentAchievement, setShowUpgradeScreen]);
    
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
        setOnboardingStatus('initial');
        setView('app');
    }, []);

    const handleInitialSplashComplete = useCallback(() => setOnboardingStatus('features'), []);

    // Player Profile Setup Handlers
    const handleProfileSetupComplete = useCallback(async (profile: any) => {
        await playerProfileService.saveProfile(profile);
        playerProfileService.completeFirstTimeSetup();
        setShowProfileSetup(false);
        setIsFirstTime(false);
        
        // Mark profile setup as completed
        localStorage.setItem('otakon_profile_setup_completed', 'true');
        
        // Add welcome message immediately for first-time users
        const timeGreeting = getTimeGreeting();
        addSystemMessage(
            `${timeGreeting}Welcome to Otakon! I'm here to be your spoiler-free guide through any game. To get started, you can upload a screenshot from a game you're currently playing, or just tell me about a game that's on your mind. What have you been playing lately?`,
            'everything-else',
            false
        );
        localStorage.setItem('otakon_welcome_message_shown', 'true');
        localStorage.setItem('otakon_last_session_date', new Date().toDateString());
    }, [addSystemMessage]);

    const handleProfileSetupSkip = useCallback(() => {
        // Set default profile
        const defaultProfile = playerProfileService.getDefaultProfile();
        playerProfileService.saveProfile(defaultProfile);
        setShowProfileSetup(false);
        setIsFirstTime(false);
        
        // Mark profile setup as completed (even when skipped)
        localStorage.setItem('otakon_profile_setup_completed', 'true');
    }, [addSystemMessage]);

    const handleCloseUpgradeScreen = useCallback(() => setShowUpgradeScreen(false), []);
    
    // Function to reset welcome message tracking (useful for testing or user preference)
    const resetWelcomeMessageTracking = useCallback(() => {
        localStorage.removeItem('otakon_welcome_message_shown');
        localStorage.removeItem('otakon_last_session_date');
    }, []);
    
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
            // Add Sign In option for unauthenticated users
            ...(!authState.user ? [{
                label: 'Sign In',
                icon: UserIcon,
                action: handleOpenAuthModal,
            }] : []),
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

    // Centralized welcome message system that prevents duplicates and adapts to user queries
    useEffect(() => {
        if (view === 'app' && onboardingStatus === 'complete') {
            const hasSeenWelcome = localStorage.getItem('otakon_welcome_message_shown');
            const hasCompletedProfileSetup = localStorage.getItem('otakon_profile_setup_completed');
            const lastSessionDate = localStorage.getItem('otakon_last_session_date');
            const currentDate = new Date().toDateString();
            
            // Show welcome message if:
            // 1. User has completed profile setup
            // 2. User hasn't seen welcome message OR it's a new day
            // 3. User is in the main app view
            if (hasCompletedProfileSetup && (!hasSeenWelcome || lastSessionDate !== currentDate)) {
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
                
                let welcomeMessage: string;
                
                if (!hasSeenWelcome) {
                    // First time user - show full welcome
                    welcomeMessage = `${timeGreeting}Welcome to Otakon! I'm here to be your spoiler-free guide through any game. To get started, you can upload a screenshot from a game you're currently playing, or just tell me about a game that's on your mind. What have you been playing lately?`;
                } else if (hasPreviousConversations) {
                    // Returning user with game history - show contextual welcome
                    const recentGames = Object.values(conversations)
                        .filter(conv => conv.id !== 'everything-else' && conv.title && conv.title !== 'New Game')
                        .slice(0, 2)
                        .map(conv => conv.title);
                    
                    if (recentGames.length > 0) {
                        welcomeMessage = `${timeGreeting}Welcome back! I see you've been playing ${recentGames.join(' and ')}. What's your next gaming challenge today?`;
                    } else {
                        welcomeMessage = `${timeGreeting}Welcome back! I'm ready to help with your next gaming challenge. What game are you tackling today, or would you like to continue where you left off?`;
                    }
                } else {
                    // Returning user without game history - show gentle reminder
                    welcomeMessage = `${timeGreeting}Welcome back! Ready to dive into some gaming? Upload a screenshot or tell me what you're playing, and I'll help you get unstuck without spoilers.`;
                }
                
                addSystemMessage(welcomeMessage, 'everything-else', false);
                
                // Update tracking
                localStorage.setItem('otakon_welcome_message_shown', 'true');
                localStorage.setItem('otakon_last_session_date', currentDate);
            }
        }
    }, [view, onboardingStatus, isFirstTime, addSystemMessage, conversations]);

    if (view === 'landing') {
        return (
            <>
                <LandingPage 
                    onGetStarted={handleGetStarted} 
                    onOpenAbout={() => setActiveModal('about')}
                    onOpenPrivacy={() => setActiveModal('privacy')}
                    onOpenRefund={() => setActiveModal('refund')}
                    onOpenContact={() => setActiveModal('contact')}
                />
                {activeModal === 'about' && <PolicyModal title="About Otakon" onClose={() => setActiveModal(null)}><AboutPage /></PolicyModal>}
                {activeModal === 'privacy' && <PolicyModal title="Privacy Policy" onClose={() => setActiveModal(null)}><PrivacyPolicyPage /></PolicyModal>}
                {activeModal === 'refund' && <PolicyModal title="Refund Policy" onClose={() => setActiveModal(null)}><RefundPolicyPage /></PolicyModal>}
                {activeModal === 'contact' && <ContactUsModal onClose={() => setActiveModal(null)} />}
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
        <div className="h-screen bg-black text-[#F5F5F5] flex flex-col font-inter relative animate-fade-in overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
            <audio ref={silentAudioRef} src={SILENT_AUDIO_URL} loop playsInline />

            <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial-at-top from-[#1C1C1C]/40 to-transparent -z-0 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-radial-at-bottom from-[#0A0A0A]/30 to-transparent -z-0 pointer-events-none"></div>
            
            <header className={`relative flex-shrink-0 flex items-center justify-between p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xl z-20 border-b border-[#424242]/20 shadow-2xl`}>
                <button
                    type="button"
                    onClick={() => setView('landing')}
                    className="transition-all duration-200 hover:opacity-80 hover:scale-105 group"
                    aria-label="Reset application and return to landing page"
                >
                    <div className="flex items-center gap-4">
                        <div className="group-hover:scale-110 transition-transform duration-200">
                            {headerContent}
                        </div>
                    </div>
                </button>
                
                {/* Enhanced Features Status Bar */}
                <div className="flex items-center gap-3">
                    {/* Database Sync Status */}
                    {authState.user && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={syncToDatabase}
                                disabled={databaseSyncStatus === 'syncing'}
                                className={`flex items-center gap-2 px-3 h-12 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    databaseSyncStatus === 'syncing' 
                                        ? 'bg-blue-600/20 text-blue-400 cursor-not-allowed' 
                                        : databaseSyncStatus === 'success'
                                        ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                                        : databaseSyncStatus === 'error'
                                        ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                                        : 'bg-gradient-to-r from-[#2E2E2E] to-[#1C1C1C] border-2 border-[#424242]/60 text-[#CFCFCF] hover:from-[#424242] hover:to-[#2E2E2E] hover:border-[#5A5A5A] hover:scale-105'
                                }`}
                                title={`Database sync: ${databaseSyncStatus === 'syncing' ? 'Syncing...' : databaseSyncStatus === 'success' ? 'Last sync: ' + new Date(lastDatabaseSync).toLocaleTimeString() : 'Click to sync'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {databaseSyncStatus === 'syncing' ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    ) : databaseSyncStatus === 'success' ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    ) : databaseSyncStatus === 'error' ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    )}
                                </svg>
                                <span className="hidden sm:inline">
                                    {databaseSyncStatus === 'syncing' ? 'Syncing...' : 'Sync'}
                                </span>
                            </button>
                        </div>
                    )}
                    
                    {/* Proactive Insights Toggle */}
                    {authState.user && (
                        <button
                            onClick={() => setShowProactiveInsights(!showProactiveInsights)}
                            className={`flex items-center gap-2 px-3 h-12 rounded-xl text-sm font-medium transition-all duration-200 ${
                                showProactiveInsights 
                                    ? 'bg-purple-600/20 text-purple-400 border-2 border-purple-500/30' 
                                    : 'bg-gradient-to-r from-[#2E2E2E] to-[#1C1C1C] border-2 border-[#424242]/60 text-[#CFCFCF] hover:from-[#424242] hover:to-[#2E2E2E] hover:border-[#5A5A5A] hover:scale-105'
                            }`}
                            title="Toggle proactive insights panel"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <span className="hidden sm:inline">Insights</span>
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3">
                     <CreditIndicator usage={usage} onClick={handleOpenCreditModal} />
                     <HandsFreeToggle
                        isHandsFree={isHandsFreeMode}
                        onToggle={handleHandsFreeClick}
                     />
                    <button
                        type="button"
                        onClick={handleOpenConnectionModal}
                        className={`flex items-center justify-center gap-3 px-4 h-12 rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-50
                        ${
                            connectionStatus === ConnectionStatus.CONNECTED
                            ? 'border-2 border-[#5CBB7B]/60 text-[#5CBB7B] hover:bg-[#5CBB7B]/10 hover:border-[#5CBB7B] shadow-[0_0_20px_rgba(92,187,123,0.4)] hover:shadow-[0_0_30px_rgba(92,187,123,0.6)]'
                            : 'bg-gradient-to-r from-[#2E2E2E] to-[#1C1C1C] border-2 border-[#424242]/60 text-[#CFCFCF] hover:bg-gradient-to-r hover:from-[#424242] hover:to-[#2E2E2E] hover:border-[#5A5A5A] hover:scale-105'
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
                        <span className="hidden sm:inline font-medium">
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
                            className="flex items-center justify-center gap-2 px-3 h-12 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#2E2E2E] to-[#1C1C1C] border-2 border-[#424242]/60 text-[#CFCFCF] hover:from-[#424242] hover:to-[#2E2E2E] hover:border-[#5A5A5A] hover:scale-105 transition-all duration-300 shadow-lg"
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
                        className="flex items-center justify-center w-12 h-12 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#2E2E2E] to-[#1C1C1C] border-2 border-[#424242]/60 text-white/90 transition-all duration-300 hover:from-[#424242] hover:to-[#2E2E2E] hover:scale-105 hover:shadow-lg"
                        aria-label="Open settings"
                    >
                        <SettingsIcon className="w-5 h-5" />
                    </button>
                </div>
            </header>
            
            {usage.tier === 'free' && (
              <div className="pb-3">
                <AdBanner />
              </div>
            )}

            {/* Daily Engagement Components */}
            {showDailyCheckin && (
              <DailyCheckinBanner
                onClose={() => setShowDailyCheckin(false)}
                autoDismiss={false}
                dismissDelay={0}
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
                autoDismiss={false}
                dismissDelay={0}
              />
            )}

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
            {databaseSyncStatus === 'success' && (
              <div className="fixed top-20 right-4 z-50 bg-green-600/90 backdrop-blur-xl text-white px-4 py-3 rounded-lg shadow-2xl border border-green-500/30 animate-fade-in">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">Database synced successfully!</span>
                </div>
              </div>
            )}
            
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
                />
            ) : (
                 <main className="flex-1 flex flex-col px-4 sm:px-6 pt-4 sm:pt-6 pb-4 overflow-y-auto">
                    {messages.length === 0 && loadingMessages.length === 0 ? (
                        <div className="flex-1 flex flex-col justify-end">
                            {/* Show suggested prompts for other tabs when no messages */}
                            {activeConversation?.id !== 'everything-else' && (
                                <SuggestedPrompts 
                                    onPromptClick={(prompt) => handleSendMessage(prompt)} 
                                    isInputDisabled={isInputDisabled}
                                    isFirstTime={isFirstTime}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6 sm:gap-8 w-full max-w-4xl sm:max-w-5xl mx-auto my-4 sm:my-6">
                            {messages.map(msg => (
                                <ChatMessageComponent
                                    key={msg.id}
                                    message={msg}
                                    isLoading={loadingMessages.includes(msg.id)}
                                    onStop={() => handleStopMessage(msg.id)}
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
                />
            )}

            {/* Suggested Prompts Above Chat Input for "Everything Else" tab - Show based on user interaction */}
            {activeConversation?.id === 'everything-else' && 
             shouldShowSuggestedPromptsEnhanced() && (
                <div className="flex-shrink-0 bg-black/40 backdrop-blur-sm border-t border-[#424242]/20 px-3 sm:px-4 py-2 sm:py-3">
                    <SuggestedPrompts 
                        onPromptClick={(prompt) => handleSendMessage(prompt)} 
                        isInputDisabled={isInputDisabled}
                        isFirstTime={isFirstTime}
                    />
                </div>
            )}
            
            <div className="flex-shrink-0 bg-black/60 backdrop-blur-xl z-10 border-t border-[#424242]/20 shadow-2xl">
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
                    onShowHowToUse={() => setOnboardingStatus('how-to-use')}
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
