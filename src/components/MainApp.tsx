import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { User, Conversation, Conversations, newsPrompts, ConnectionStatus, SubTab, PlayerProfile, AIResponse } from '../types';
import { GAME_HUB_ID } from '../constants';
import { ConversationService } from '../services/conversationService';
import { authService } from '../services/authService';
import { aiService } from '../services/aiService';
import { useActiveSession } from '../hooks/useActiveSession';
import { suggestedPromptsService } from '../services/suggestedPromptsService';
import { shownPromptsService } from '../services/ai/shownPromptsService';
import { sessionSummaryService } from '../services/sessionSummaryService';
import { gameTabService } from '../services/gameTabService';
import { errorRecoveryService } from '../services/errorRecoveryService';
import { UserService } from '../services/userService';
import { SupabaseService } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { tabManagementService } from '../services/tabManagementService';
import { subtabsService } from '../services/subtabsService';
import { ttsService } from '../services/ttsService';
import { toastService } from '../services/toastService';
import { MessageRoutingService } from '../services/messageRoutingService';
import { sessionService } from '../services/sessionService';
import { fetchIGDBGameData, IGDBGameData, getSidebarCoverUrl } from '../services/igdbService';
import { offlineQueueService } from '../services/indexedDBService';
import Sidebar from './layout/Sidebar';
import ChatInterface from './features/ChatInterface';
import SettingsModal from './modals/SettingsModal';
import CreditModal from './modals/CreditModal';
import ConnectionModal from './modals/ConnectionModal';
import HandsFreeModal from './modals/HandsFreeModal';
import AddGameModal from './modals/AddGameModal';
import GameInfoModal from './modals/GameInfoModal';
import FeedbackModal from './modals/FeedbackModal';
import Logo from './ui/Logo';
import CreditIndicator from './ui/CreditIndicator';
import HandsFreeToggle from './ui/HandsFreeToggle';
import AIToggleButton from './ui/AIToggleButton';
import { LoadingSpinner } from './ui/LoadingSpinner';
import SettingsContextMenu from './ui/SettingsContextMenu';
import ProfileSetupBanner from './ui/ProfileSetupBanner';
import GameProgressBar from './features/GameProgressBar';
import ErrorBoundary from './ErrorBoundary';
import AdBanner from './ads/AdBanner';
import WelcomeScreen from './welcome/WelcomeScreen';
import ConnectionSplashScreen from './splash/ConnectionSplashScreen';
import ProUpgradeSplashScreen from './splash/ProUpgradeSplashScreen';
import { connect, disconnect, setHandlers } from '../services/websocketService';
import { validateScreenshotDataUrl, getDataUrlSizeMB } from '../utils/imageValidation';

// ============================================================================
// ERROR FALLBACK COMPONENTS
// ============================================================================

// ✅ NEW: Fallback UI for ChatInterface errors
const ChatErrorFallback: React.FC = () => (
  <div className="flex-1 flex items-center justify-center p-4">
    <div className="max-w-md text-center">
      <div className="text-6xl mb-4">💬</div>
      <h2 className="text-xl font-bold text-[#F5F5F5] mb-2">
        Chat Temporarily Unavailable
      </h2>
      <p className="text-[#CFCFCF] mb-4">
        We encountered an error loading the chat. Please try refreshing.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] text-white rounded-lg font-semibold hover:scale-105 transition-transform"
      >
        Refresh Page
      </button>
    </div>
  </div>
);

interface MainAppProps {
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenAbout?: () => void;
  onOpenPrivacy?: () => void;
  onOpenRefund?: () => void;
  onOpenContact?: () => void;
  onOpenTerms?: () => void;
  connectionStatus?: ConnectionStatus;
  connectionError?: string | null;
  connectionCode?: string | null;
  onConnect?: (_code: string) => void;
  onDisconnect?: () => void;
  onClearConnectionError?: () => void;
  onWebSocketMessage?: (_handler: (_data: Record<string, unknown>) => void) => void;
  showProfileSetupBanner?: boolean;
  onProfileSetupComplete?: (profile: PlayerProfile) => void;
  onProfileSetupDismiss?: () => void;
}

const MainApp: React.FC<MainAppProps> = ({
  onLogout,
  onOpenSettings: _onOpenSettings,
  onOpenAbout: _onOpenAbout,
  onOpenPrivacy: _onOpenPrivacy,
  onOpenRefund: _onOpenRefund,
  onOpenContact: _onOpenContact,
  onOpenTerms: _onOpenTerms,
  connectionStatus: propConnectionStatus,
  connectionError: propConnectionError,
  connectionCode: propConnectionCode,
  onConnect: propOnConnect,
  onDisconnect: propOnDisconnect,
  onClearConnectionError: propOnClearConnectionError,
  onWebSocketMessage: propOnWebSocketMessage,
  showProfileSetupBanner = false,
  onProfileSetupComplete,
  onProfileSetupDismiss,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversations>({});
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // Active session management
  const { session, toggleSession, setActiveSession } = useActiveSession();
  const [isManualUploadMode, setIsManualUploadMode] = useState(() => {
    // Restore from localStorage, default to true (auto-upload OFF)
    const saved = localStorage.getItem('otakon_manual_upload_mode');
    return saved !== null ? saved === 'true' : true;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [welcomeScreenOpen, setWelcomeScreenOpen] = useState(false);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [connectionSplashOpen, setConnectionSplashOpen] = useState(false);
  const [proUpgradeSplashOpen, setProUpgradeSplashOpen] = useState(false);
  const [upgradedTier, setUpgradedTier] = useState<'pro' | 'vanguard_pro'>('pro');
  const [localConnectionCode, setLocalConnectionCode] = useState<string | null>(null);
  const [lastSuccessfulConnection, setLastSuccessfulConnection] = useState<Date | null>(null);
  
  // Use prop connection code if provided, otherwise use local state
  const connectionCode = propConnectionCode ?? localConnectionCode;
  const setConnectionCode = setLocalConnectionCode;
  
  // Hands-free mode state (persisted to localStorage)
  const [isHandsFreeMode, setIsHandsFreeMode] = useState(() => {
    const saved = localStorage.getItem('otakonHandsFreeMode');
    return saved === 'true';
  });
  const [handsFreeModalOpen, setHandsFreeModalOpen] = useState(false);
  
  // AI mode state (Pro/Vanguard only - persisted to localStorage)
  const [aiModeEnabled, setAiModeEnabled] = useState(() => {
    const saved = localStorage.getItem('otakonAiMode');
    return saved !== 'false'; // Default to true (AI ON)
  });
  
  // ✅ Track if pause mode was active before AI mode was turned off (to restore when turned back on)
  const pauseStateBeforeAiOffRef = useRef<boolean | null>(null);
  
  // Input preservation for tab switching
  const [currentInputMessage, setCurrentInputMessage] = useState<string>('');
  
  // ✅ Track message being edited (ID of the user message to replace on resubmit)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  
  // ✅ NEW: Queued screenshot from WebSocket (manual mode)
  const [queuedScreenshot, setQueuedScreenshot] = useState<string | null>(null);
  
  // ✅ PERFORMANCE: Loading guards to prevent concurrent conversation loading
  const isLoadingConversationsRef = useRef(false);
  const hasLoadedConversationsRef = useRef(false);
  
  // ✅ Ref to store latest handleSendMessage function
  const handleSendMessageRef = useRef<((message: string, imageUrl?: string) => Promise<void>) | null>(null);
  
  // ✅ RATE LIMITING: Track last request time to prevent rapid-fire duplicate requests
  const lastRequestTimeRef = useRef<number>(0);
  const RATE_LIMIT_DELAY_MS = 500; // Minimum 500ms between requests (prevents duplicate clicks)
  
  // ✅ TIER UPGRADE: Track previous tier to detect upgrades
  const previousTierRef = useRef<string | null>(null);
  const [isGeneratingSubtabs, setIsGeneratingSubtabs] = useState(false);
  const [generatingSubtabsProgress, setGeneratingSubtabsProgress] = useState<{current: number; total: number; gameName: string} | null>(null);
  
  // ✅ PERFORMANCE: Memoize currentUser to prevent re-creating object on every render
  const currentUser = useMemo(() => user || { tier: 'free' } as User, [user]);
  
  // Add Game modal state
  const [addGameModalOpen, setAddGameModalOpen] = useState(false);
  
  // Game Info Modal state (IGDB integration)
  const [gameInfoModalOpen, setGameInfoModalOpen] = useState(false);
  const [currentGameIGDBData, setCurrentGameIGDBData] = useState<IGDBGameData | null>(null);
  const [isLoadingIGDBData, setIsLoadingIGDBData] = useState(false);
  const igdbFetchedForRef = useRef<string | null>(null); // Track which game we've fetched for
  
  // Helper function to deep clone conversations to force React re-renders
  const deepCloneConversations = (conversations: Conversations): Conversations => {
    const cloned: Conversations = {};
    Object.keys(conversations).forEach(key => {
      cloned[key] = {
        ...conversations[key],
        // ✅ DEEP CLONE: Clone array AND each subtab object (fixes React change detection)
        subtabs: conversations[key].subtabs 
          ? conversations[key].subtabs?.map(tab => ({ ...tab }))
          : undefined,
        // ✅ DEEP CLONE: Clone each message object
        messages: conversations[key].messages.map(msg => ({ ...msg }))
      };
    });
    return cloned;
  };
  
  // Settings context menu state
  const [settingsContextMenu, setSettingsContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
  });
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  
  // Use props for connection state, fallback to local state if not provided
  const connectionStatus = propConnectionStatus ?? ConnectionStatus.DISCONNECTED;
  const connectionError = propConnectionError ?? null;

  // Restore connection state from localStorage on mount
  useEffect(() => {
    const savedConnectionCode = localStorage.getItem('otakon_connection_code');
    if (savedConnectionCode) {
      setConnectionCode(savedConnectionCode);
      const lastConnection = localStorage.getItem('otakon_last_connection');
      if (lastConnection) {
        setLastSuccessfulConnection(new Date(lastConnection));
      }
    }
  }, []);

  // Initialize TTS service on mount
  useEffect(() => {
    ttsService.init().catch((_err: Error) => {
          });
  }, []);

  // Persist auto-upload mode setting to localStorage
  useEffect(() => {
    localStorage.setItem('otakon_manual_upload_mode', String(isManualUploadMode));
  }, [isManualUploadMode]);

  // Handle WebSocket messages for screenshot processing
  // Note: Connection confirmation (partner_connected) is handled by MainAppRoute
  // This handler processes screenshots and other data messages
  const handleWebSocketMessage = useCallback((data: Record<string, unknown>) => {
    console.log('📸 [MainApp] handleWebSocketMessage called with type:', data.type);
    
    // Connection confirmation is handled by MainAppRoute's WebSocket handlers
    // We just log it here for debugging
    if (data.type === 'partner_connected' || data.type === 'connection_alive' || data.type === 'connected' || data.status === 'connected') {
      console.log('📸 [MainApp] Connection confirmation received (handled by MainAppRoute)');
      // Update last successful connection time
      setLastSuccessfulConnection(new Date());
      return;
    }
    
    // ✅ FIX: Handle screenshot-single from PC client F1 hotkey
    if (data.type === 'screenshot-single') {
      console.log('📸 [MainApp] screenshot-single received from PC client');
      const payload = data.payload as Record<string, unknown> | undefined;
      const images = payload?.images as string[] | undefined;
      
      if (images && Array.isArray(images) && images.length > 0) {
        console.log('📸 [MainApp] Processing single screenshot from F1');
        const dataUrl = images[0];
        
        // Validate screenshot data
        const validation = validateScreenshotDataUrl(dataUrl);
        if (!validation.valid) {
          console.error('📸 [MainApp] Screenshot validation failed:', validation.error);
          toastService.error(`Screenshot validation failed: ${validation.error}`);
          return;
        }
        
        const sizeMB = getDataUrlSizeMB(dataUrl);
        console.log('📸 [MainApp] Screenshot validated:', { sizeMB, length: dataUrl.length });
        
        // Process screenshot same way as legacy 'screenshot' type
        if (isManualUploadMode) {
          setQueuedScreenshot(dataUrl);
          toastService.info('Screenshot queued. Review and send when ready.');
          return;
        }
        
        // Auto mode: Send immediately
        if (activeConversation && handleSendMessageRef.current) {
          handleSendMessageRef.current("", dataUrl);
          setQueuedScreenshot(null);
        } else {
          toastService.warning('No active conversation. Please select or create a conversation first.');
        }
      } else {
        console.warn('📸 [MainApp] screenshot-single received but no images in payload');
      }
      return;
    }
    
    // ✅ FIX: Handle screenshot-multi from PC client F2 hotkey (Pro/Vanguard only)
    if (data.type === 'screenshot-multi') {
      console.log('📸 [MainApp] screenshot-multi received from PC client');
      
      // Get user directly from authService to ensure we have the latest tier info
      const currentUser = authService.getCurrentUser();
      const userTier = currentUser?.tier || 'free';
      console.log('📸 [MainApp] Checking tier access - userTier:', userTier, 'user:', currentUser?.email);
      
      if (userTier !== 'pro' && userTier !== 'vanguard_pro') {
        console.warn('📸 [MainApp] screenshot-multi blocked - Free tier users can only use F1 (single screenshot)');
        console.log('📸 [MainApp] Showing upgrade toast for free user');
        toastService.warning('Batch screenshots (F2) are a Pro feature. Upgrade to unlock!');
        return;
      }
      
      const payload = data.payload as Record<string, unknown> | undefined;
      const images = payload?.images as string[] | undefined;
      
      if (images && Array.isArray(images) && images.length > 0) {
        console.log('📸 [MainApp] Processing', images.length, 'buffered screenshots from F2');
        
        images.forEach((dataUrl: string, index: number) => {
          console.log('📸 [MainApp] Processing screenshot', index + 1, 'of', images.length);
          
          const validation = validateScreenshotDataUrl(dataUrl);
          if (!validation.valid) {
            console.error('📸 [MainApp] Screenshot', index + 1, 'validation failed:', validation.error);
            return;
          }
          
          // Process each screenshot
          if (isManualUploadMode) {
            // In manual mode, only queue the first screenshot (to avoid overwhelming UI)
            if (index === 0) {
              setQueuedScreenshot(dataUrl);
              toastService.info(`${images.length} screenshots received. First one queued.`);
            }
          } else {
            // Auto mode: Send each screenshot
            if (activeConversation && handleSendMessageRef.current) {
              const handler = handleSendMessageRef.current;
              setTimeout(() => {
                handler("", dataUrl);
              }, index * 500); // Stagger by 500ms to avoid overwhelming AI
            }
          }
        });
      } else {
        console.warn('📸 [MainApp] screenshot-multi received but no images in payload');
      }
      return;
    }
    
    // Legacy screenshot format (keep for backward compatibility)
    if (data.type === 'screenshot' && data.dataUrl) {
      // Cast dataUrl to string since we know it exists at this point
      const dataUrl = data.dataUrl as string;
      
      // ✅ FIX: Validate screenshot data before processing
      const validation = validateScreenshotDataUrl(dataUrl);
      if (!validation.valid) {
        console.error('📸 [MainApp] Screenshot validation failed:', validation.error);
        toastService.error(`Screenshot validation failed: ${validation.error}`);
        return;
      }
      
      const sizeMB = getDataUrlSizeMB(dataUrl);
      console.log('📸 [MainApp] Processing screenshot:', {
        dataUrlLength: dataUrl.length,
        sizeMB: sizeMB,
        dataUrlPreview: dataUrl.substring(0, 50),
        isManualUploadMode,
        hasActiveConversation: !!activeConversation
      });
      
      if (isManualUploadMode) {
        // ✅ FIXED: In manual mode, queue the image for ChatInterface (not text input!)
                setQueuedScreenshot(dataUrl);
                toastService.info('Screenshot queued. Review and send when ready.');
        return; // Don't send automatically in manual mode
      }
      
      // Auto mode: Send the screenshot to the active conversation immediately
      if (activeConversation && handleSendMessageRef.current) {
                handleSendMessageRef.current("", dataUrl);
        // Clear the queued screenshot immediately after sending in auto mode
        setQueuedScreenshot(null);
      } else {
                toastService.warning('No active conversation. Please select or create a conversation first.');
      }
    }
  }, [isManualUploadMode, activeConversation, propOnConnect, connectionCode]);

  // Clear queued screenshot when it's been used
  const handleScreenshotQueued = () => {
    setQueuedScreenshot(null);
  };

  // Debug: Log when queuedScreenshot changes
  useEffect(() => {
    console.log('📸 [MainApp] queuedScreenshot state changed:', {
      hasQueuedScreenshot: !!queuedScreenshot,
      queuedScreenshotLength: queuedScreenshot?.length,
      queuedScreenshotPreview: queuedScreenshot?.substring(0, 50)
    });
  }, [queuedScreenshot]);

  // Expose the message handler to parent
  useEffect(() => {
    if (propOnWebSocketMessage) {
      propOnWebSocketMessage(handleWebSocketMessage);
    }
  }, [propOnWebSocketMessage, handleWebSocketMessage]);

  // ✅ FIX: Update WebSocket handlers when connected so MainApp receives screenshot messages
  // MainAppRoute handles the initial connection, but we need to update handlers to process screenshots
  useEffect(() => {
    if (connectionStatus === ConnectionStatus.CONNECTED) {
      console.log('📸 [MainApp] Connection is CONNECTED - updating WebSocket handlers to receive screenshots');
      setHandlers(
        // onOpen - no-op, connection already open
        () => {
          console.log('📸 [MainApp] WebSocket onOpen (already connected)');
        },
        // onMessage - route to MainApp's handler for screenshot processing
        handleWebSocketMessage,
        // onError - log but let MainAppRoute handle state
        (error: string) => {
          console.error('📸 [MainApp] WebSocket error:', error);
        },
        // onClose - log but let MainAppRoute handle state
        () => {
          console.log('📸 [MainApp] WebSocket closed');
        }
      );
    }
  }, [connectionStatus, handleWebSocketMessage]);

  // ✅ PWA FIX: Track if we're in the middle of logout to prevent race conditions
  const isLoggingOutRef = useRef(false);
  
  // ✅ FIX: Track user ID to detect new user login after logout
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const previousUserIdRef = useRef<string | null>(null);
  
  // ✅ PWA FIX: Listen for logout event to reset refs and state
  // This ensures re-login works correctly after logout
  useEffect(() => {
    const handleUserLogout = () => {
      console.log('🔍 [MainApp] User logout detected - setting logout flag and resetting state');
      
      // ✅ CRITICAL: Set logout flag to prevent loadData from running during logout
      isLoggingOutRef.current = true;
      
      // Reset loading guard refs so next login can initialize properly
      isLoadingConversationsRef.current = false;
      hasLoadedConversationsRef.current = false;
      
      // Clear state to prevent showing stale data
      setUser(null);
      setConversations({});
      setActiveConversation(null);
      setIsInitializing(true);
      setSuggestedPrompts([]);
      setQueuedScreenshot(null);
      
      // ✅ FIX: Reset current user ID to allow new user detection
      setCurrentUserId(null);
      previousUserIdRef.current = null;
      
      console.log('🔍 [MainApp] State and refs reset for new login');
    };
    
    const handleCachesCleared = () => {
      console.log('🔍 [MainApp] Caches cleared event received - logout complete, ready for new user');
      // ✅ FIX: Clear logout flag immediately - no delay needed
      // The 100ms delay was causing a race condition where User B's auth state
      // would arrive during the delay window and be blocked from setting currentUserId
      isLoggingOutRef.current = false;
      console.log('🔍 [MainApp] Logout flag cleared - new user can now load');
    };

    window.addEventListener('otakon:user-logout', handleUserLogout);
    window.addEventListener('otakon:caches-cleared', handleCachesCleared);
    
    return () => {
      window.removeEventListener('otakon:user-logout', handleUserLogout);
      window.removeEventListener('otakon:caches-cleared', handleCachesCleared);
    };
  }, []);

  // ✅ FIX: Subscribe to auth state changes to detect new user login after logout
  useEffect(() => {
    const unsubscribe = authService.subscribe((authState) => {
      const newUserId = authState.user?.authUserId || null;
      
      // ✅ FIX: Always update if user ID changed - don't block on logout flag
      // If a new user arrives, logout is complete by definition
      if (newUserId !== currentUserId) {
        console.log('🔍 [MainApp] Auth state change detected:', {
          previousUserId: currentUserId,
          newUserId,
          isLoading: authState.isLoading,
          isLoggingOut: isLoggingOutRef.current
        });
        
        // Update current user ID
        if (newUserId) {
          // ✅ FIX: If we're getting a new user ID, logout is complete
          // Clear the flag to allow loadData to proceed
          if (isLoggingOutRef.current) {
            console.log('🔍 [MainApp] New user detected while logout flag was set - clearing flag');
            isLoggingOutRef.current = false;
          }
          setCurrentUserId(newUserId);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUserId]);

  useEffect(() => {
    const loadData = async (retryCount = 0) => {
      // ✅ PWA FIX: Don't load if logout is in progress
      if (isLoggingOutRef.current) {
        console.log('🔍 [MainApp] Skipping loadData - logout in progress');
        return;
      }
      
      // ✅ PERFORMANCE: Guard against concurrent loads
      if (isLoadingConversationsRef.current) {
                return;
      }
      
      // ✅ FIX: Check if this is a new user login (different from previous user)
      const isNewUserLogin = currentUserId && previousUserIdRef.current !== currentUserId;
      
      // ✅ PERFORMANCE: Skip if already loaded (unless retry or new user)
      if (hasLoadedConversationsRef.current && retryCount === 0 && !isNewUserLogin) {
                return;
      }
      
      // ✅ FIX: If new user login, reset the loaded flag and force refresh
      if (isNewUserLogin) {
        console.log('🔍 [MainApp] New user detected, resetting for fresh load:', {
          previousUser: previousUserIdRef.current,
          newUser: currentUserId
        });
        hasLoadedConversationsRef.current = false;
        previousUserIdRef.current = currentUserId;
      }
      
      isLoadingConversationsRef.current = true;
      
      try {
        // Get user from AuthService instead of UserService
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          // Also sync to UserService for compatibility
          UserService.setCurrentUser(currentUser);
          
          // ✅ FIX: Update currentUserId if not set (initial mount case)
          if (!currentUserId) {
            setCurrentUserId(currentUser.authUserId);
            previousUserIdRef.current = currentUser.authUserId;
          }
        } else if (retryCount === 0) {
          // If no user on first attempt, wait a bit for auth state to settle after onboarding
                    setTimeout(() => loadData(1), 500);
          return;
        }

        console.log('🔍 [MainApp] Loading conversations (attempt', retryCount + 1, ')');
        
        // ✅ PWA FIX: Force refresh on first load attempt to ensure we get the current user's data
        // ✅ FIX: Also force refresh if this is a new user login
        // This prevents stale cache data from previous user affecting new user
        const forceRefresh = retryCount === 0 || !!isNewUserLogin;
        
        // ✅ FIX: Ensure Game Hub exists first - this returns it directly (RLS workaround)
        const gameHubFromEnsure = await ConversationService.ensureGameHubExists(forceRefresh);
        console.log('🔍 [MainApp] Game Hub from ensureGameHubExists:', {
          id: gameHubFromEnsure?.id,
          title: gameHubFromEnsure?.title,
          isGameHub: gameHubFromEnsure?.isGameHub
        });
        
        // ✅ FIX: Don't use getCachedConversations() - it may be stale or null after cache invalidation
        // Instead, call getConversations() to get fresh data from Supabase
        const userConversations = await ConversationService.getConversations(forceRefresh);
        console.log('🔍 [MainApp] Conversations from getConversations:', Object.keys(userConversations));
        console.log('🔍 [MainApp] Conversation count:', Object.keys(userConversations).length);
        
        // ✅ Ensure Game Hub is in the loaded conversations
        if (gameHubFromEnsure && !userConversations[gameHubFromEnsure.id]) {
                    userConversations[gameHubFromEnsure.id] = gameHubFromEnsure;
        }
        
        setConversations(userConversations);

        let active = await ConversationService.getActiveConversation();
                // Handle all cases to ensure "Game Hub" is always available and active by default
        let currentGameHub = Object.values(userConversations).find(
          conv => conv.isGameHub || conv.title === 'Game Hub' || conv.id === 'game-hub'
        );
        
        // ✅ FIX: If still no Game Hub found, use the one from ensure
        if (!currentGameHub && gameHubFromEnsure) {
                    currentGameHub = gameHubFromEnsure;
        }

        // Case 1: No conversations at all (should not happen since we call ensureGameHubExists)
        if (Object.keys(userConversations).length === 0) {
                    const newConversation = ConversationService.createConversation('Game Hub', 'game-hub');
          await ConversationService.addConversation(newConversation);
          await ConversationService.setActiveConversation(newConversation.id);
          
          // 🔧 FIX: Use the newly created conversation directly
          // If Supabase sync fails, ensure we still have the conversation in state
          const updatedConversations = await ConversationService.getConversations();
          
          // Ensure the new conversation is in the state (merge if needed)
          const finalConversations = Object.keys(updatedConversations).length > 0 
            ? updatedConversations 
            : { [newConversation.id]: newConversation };
          
          setConversations(finalConversations);
          active = finalConversations[newConversation.id];
          setActiveConversation(active);
          
          // Mark as first-run complete since we just created and activated Game Hub
          localStorage.setItem('otakon_has_used_app', 'true');
          console.log('🔍 [MainApp] Created and activated "Game Hub" conversation (first-run complete)');
                  }
        // Case 2: Game Hub exists but nothing is active - set Game Hub as active
        // This handles first-time users after onboarding, as well as returning users
        else if (!active && currentGameHub) {
                    await ConversationService.setActiveConversation(currentGameHub.id);
          const updatedConversations = await ConversationService.getConversations();
          setConversations(updatedConversations);
          active = updatedConversations[currentGameHub.id];
          setActiveConversation(active);
                  }
        // Case 4: No "Game Hub" conversation but other conversations exist - create and activate it
        else if (!currentGameHub) {
                    const newConversation = ConversationService.createConversation('Game Hub', 'game-hub');
          await ConversationService.addConversation(newConversation);
          
          // If no active conversation, make "Game Hub" active
          if (!active) {
            await ConversationService.setActiveConversation(newConversation.id);
            const updatedConversations = await ConversationService.getConversations();
            setConversations(updatedConversations);
            active = updatedConversations['game-hub'];
            setActiveConversation(active);
                      } else {
            // Otherwise, just add it but keep current active conversation
            const updatedConversations = await ConversationService.getConversations();
            setConversations(updatedConversations);
            setActiveConversation(active);
                      }
        }
        // Case 5: Active conversation exists - restore it
        else if (active) {
                    setActiveConversation(active);
        }
        // Case 6: FALLBACK - No active conversation but Game Hub exists
        else if (currentGameHub) {
                    await ConversationService.setActiveConversation(currentGameHub.id);
          const updatedConversations = await ConversationService.getConversations();
          setConversations(updatedConversations);
          setActiveConversation(updatedConversations[currentGameHub.id]);
        }

        // Set initial suggested prompts for the active conversation
        const finalActive = active || currentGameHub;
        if (finalActive) {
          if (finalActive.isGameHub || finalActive.id === GAME_HUB_ID) {
            // For Game Hub tab, show news prompts if no messages
            if (!finalActive.messages || finalActive.messages.length === 0) {
              setSuggestedPrompts(newsPrompts);
            } else {
              const fallbackPrompts = suggestedPromptsService.getFallbackSuggestions(finalActive.id, finalActive.isGameHub);
              setSuggestedPrompts(fallbackPrompts);
            }
          } else {
            // For game tabs, show fallback prompts
            const fallbackPrompts = suggestedPromptsService.getFallbackSuggestions(finalActive.id, finalActive.isGameHub);
            setSuggestedPrompts(fallbackPrompts);
          }
        }
        
        // 🔧 CRITICAL: Only mark initialization as complete if we have an active conversation
        // This prevents showing "Loading chat..." when there's no active conversation set
        if (finalActive) {
          console.log('🔍 [MainApp] Initialization complete with active conversation:', finalActive.id);
          setIsInitializing(false);
        } else {
          console.error('🔍 [MainApp] ERROR: No active conversation after initialization!');
          console.log('🔍 [MainApp] userConversations:', Object.keys(userConversations));
          console.log('🔍 [MainApp] gameHubFromEnsure:', gameHubFromEnsure?.id);
          
          // Force Game Hub as active if we somehow got here without one
          // First, try to find any Game Hub in the loaded conversations
          let gameHubConv = Object.values(userConversations).find(
            conv => conv.isGameHub || conv.title === 'Game Hub' || conv.id === 'game-hub'
          );
          
          // If not found in userConversations, use the one from ensureGameHubExists
          if (!gameHubConv && gameHubFromEnsure) {
            console.log('🔍 [MainApp] Using gameHubFromEnsure as fallback');
            gameHubConv = gameHubFromEnsure;
            // Make sure it's in the conversations state
            userConversations[gameHubConv.id] = gameHubConv;
            setConversations({...userConversations});
          }
          
          if (gameHubConv) {
            console.log('🔍 [MainApp] Setting Game Hub as active:', gameHubConv.id);
            await ConversationService.setActiveConversation(gameHubConv.id);
            const updatedConversations = await ConversationService.getConversations();
            setConversations(updatedConversations);
            setActiveConversation(updatedConversations[gameHubConv.id] || gameHubConv);
          } else {
            console.error('🔍 [MainApp] CRITICAL: No Game Hub found at all! Creating new one...');
            // Last resort: create a new Game Hub
            const newGameHub = ConversationService.createConversation('Game Hub', 'game-hub');
            await ConversationService.addConversation(newGameHub);
            await ConversationService.setActiveConversation(newGameHub.id);
            setConversations({ [newGameHub.id]: newGameHub });
            setActiveConversation(newGameHub);
          }
          setIsInitializing(false);
        }
        
        // ✅ PERFORMANCE: Mark conversations as successfully loaded
        hasLoadedConversationsRef.current = true;
      } catch (error) {
        console.error('🔍 [MainApp] Error loading data:', error);
        
        // Retry up to 3 times with exponential backoff
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
                    setTimeout(() => loadData(retryCount + 1), delay);
        } else {
          console.error('🔍 [MainApp] Failed to load data after 3 attempts');
          toastService.error('Failed to load conversations. Please refresh the page.', {
            action: {
              label: 'Refresh',
              onClick: () => window.location.reload()
            }
          });
          // Set a fallback state to prevent infinite loading
          setActiveConversation(null);
          setIsInitializing(false);
        }
      } finally {
        // ✅ PERFORMANCE: Always clear the loading flag
        isLoadingConversationsRef.current = false;
      }
    };

    loadData();
  }, [currentUserId]); // ✅ FIX: Re-run when currentUserId changes (new user login)

  // Safety timeout: Force initialization complete after 3 seconds to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isInitializing) {
        // Only force complete if we have conversations, even without user
        if (Object.keys(conversations).length > 0 || activeConversation) {
                    setIsInitializing(false);
        } else {
          // Try to get user and load conversations one more time
                    const currentUser = authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            UserService.setCurrentUser(currentUser);
            setIsInitializing(false);
          }
        }
      }
    }, 3000); // Increased from 1s to 3s to allow Game Hub creation to complete
    
    return () => clearTimeout(timeout);
  }, [isInitializing, conversations, activeConversation]);

  // ✅ TIER UPGRADE: Detect tier changes and generate subtabs for existing game tabs
  // ✅ FIX: Track if we've finished initial user load to avoid false upgrade detection
  const hasInitializedTierRef = useRef(false);
  
  useEffect(() => {
    const currentTier = currentUser?.tier || 'free';
    const previousTier = previousTierRef.current;
    
    // Update ref for next comparison
    previousTierRef.current = currentTier;
    
    // Skip on initial mount (no previous tier set yet)
    if (previousTier === null) {
      console.log('🔄 [TierChange] Initial tier set:', currentTier);
      return;
    }
    
    // ✅ FIX: Skip if we're still in the initial loading phase
    // This prevents false upgrade detection when user data loads with actual tier
    if (isInitializing) {
      console.log('🔄 [TierChange] Skipping tier change during initialization');
      return;
    }
    
    // ✅ FIX: Mark as initialized after first proper load, skip first "real" tier set
    if (!hasInitializedTierRef.current && user?.id) {
      hasInitializedTierRef.current = true;
      console.log('🔄 [TierChange] First user load - tier initialized to:', currentTier);
      return;
    }
    
    // Skip if tier hasn't changed
    if (previousTier === currentTier) {
      return;
    }
    
    console.log('🔄 [TierChange] Tier changed from', previousTier, 'to', currentTier);
    
    // Check if upgrading from free to paid tier
    const wasFree = previousTier === 'free';
    const isPaidNow = currentTier === 'pro' || currentTier === 'vanguard_pro';
    
    if (wasFree && isPaidNow) {
      console.log('🔄 [TierChange] User upgraded from free to', currentTier, '- generating subtabs for existing game tabs');
      
      // Check if we've shown the upgrade splash for this tier before
      const shownUpgradeSplashKey = `otakon_upgrade_splash_shown_${currentTier}`;
      const hasShownUpgradeSplash = localStorage.getItem(shownUpgradeSplashKey) === 'true';
      
      if (!hasShownUpgradeSplash) {
        // First time upgrading to this tier - show splash screen
        console.log('🔄 [TierChange] Showing upgrade splash for first-time', currentTier, 'user');
        setUpgradedTier(currentTier as 'pro' | 'vanguard_pro');
        setProUpgradeSplashOpen(true);
        localStorage.setItem(shownUpgradeSplashKey, 'true');
      } else {
        // Already shown before - just show toast
        toastService.success('Upgrade Complete! 🎉 Generating game insights...');
      }
      
      setIsGeneratingSubtabs(true);
      
      // Generate subtabs in background
      gameTabService.generateSubtabsForExistingGameTabs(
        conversations,
        undefined, // playerProfile - could get from profileService if needed
        async (completed, total, currentGame) => {
          console.log(`🔄 [TierChange] Progress: ${completed}/${total} - ${currentGame}`);
          
          // Update progress state for UI banner
          setGeneratingSubtabsProgress({ current: completed + 1, total, gameName: currentGame });
          
          // Show progress toast for each game
          if (completed < total) {
            // Removed toast - now showing in banner instead
            
            // ✅ INCREMENTAL REFRESH: Update UI after each game to show progress immediately
            try {
              const updatedConvs = await ConversationService.getConversations(true);
              setConversations(updatedConvs);
            } catch (err) {
              console.warn('Failed to incrementally refresh conversations:', err);
            }
          } else {
            toastService.success(`All insights generated! ✨ Created insights for ${total} games`);
            setIsGeneratingSubtabs(false);
            setGeneratingSubtabsProgress(null);
            
            // Final refresh to get all updated subtabs
            ConversationService.getConversations(true).then(updatedConvs => {
              setConversations(updatedConvs);
            }).catch(err => {
              console.error('Failed to refresh conversations:', err);
            });
          }
        }
      ).catch(error => {
        console.error('🔄 [TierChange] Failed to generate subtabs:', error);
        setIsGeneratingSubtabs(false);
        setGeneratingSubtabsProgress(null);
        toastService.error('Error generating insights. Some game insights may not have been created.');
      });
    } else if (!wasFree && currentTier === 'free') {
      // Downgrading to free - just log, subtabs are preserved but won't update
      console.log('🔄 [TierChange] User downgraded to free tier - subtabs preserved but will not update');
      toastService.info('Subscription ended. Your game insights are preserved but won\'t update until you resubscribe.');
    }
  }, [currentUser?.tier, conversations, isInitializing, user?.id]);

  // ✅ PHASE 2 FIX: Real-time subscription for subtab updates
  useEffect(() => {
    if (!activeConversation?.id) {return;}
    
        // Subscribe to conversation updates
    const subscription = supabase
      .channel(`conversation:${activeConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${activeConversation.id}`
        },
        async (payload: Record<string, unknown>) => {
                    // Update conversations state with fresh data
          setConversations((prev) => {
            const updated = { ...prev };
            
            // Merge the updated conversation data
            const newData = payload.new as Record<string, unknown> | undefined;
            if (newData && updated[activeConversation.id]) {
              updated[activeConversation.id] = {
                ...updated[activeConversation.id],
                ...newData,
                // Ensure subtabs array is properly handled
                subtabs: (newData.subtabs as SubTab[]) || updated[activeConversation.id].subtabs || []
              };
              
                          }
            
            return updated;
          });
          
          // Update active conversation if it's the one that changed
          const newPayload = payload.new as Record<string, unknown> | undefined;
          if (activeConversation.id === newPayload?.id) {
            setActiveConversation((prev) => {
              if (!prev) {return prev;}
              return {
                ...prev,
                ...(newPayload as Partial<Conversation>),
                subtabs: (newPayload.subtabs as SubTab[]) || prev.subtabs || []
              };
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Successfully subscribed to real-time updates
          console.log('✅ [MainApp] Real-time subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [MainApp] Real-time subscription error');
        }
      });
    
    // Cleanup subscription on unmount or when conversation changes
    return () => {
            subscription.unsubscribe();
    };
  }, [activeConversation?.id]);

  // ✅ IGDB Integration: Fetch game data when switching to a game tab (parallel loading)
  useEffect(() => {
    const fetchGameData = async () => {
      console.log('🎮 [IGDB] Effect triggered:', {
        hasActiveConv: !!activeConversation,
        gameTitle: activeConversation?.gameTitle,
        isGameHub: activeConversation?.isGameHub,
        convId: activeConversation?.id,
        prevFetched: igdbFetchedForRef.current
      });

      // Only fetch for game tabs (not Game Hub)
      if (!activeConversation?.gameTitle || activeConversation.isGameHub) {
        console.log('🎮 [IGDB] Skipping fetch - no gameTitle or is Game Hub');
        setCurrentGameIGDBData(null);
        igdbFetchedForRef.current = null;
        return;
      }

      const gameTitle = activeConversation.gameTitle;
      
      // Avoid re-fetching for the same game
      if (igdbFetchedForRef.current === gameTitle) {
        console.log('🎮 [IGDB] Already fetched for this game, skipping');
        return;
      }

      console.log('🎮 [MainApp] Fetching IGDB data for:', gameTitle);
      setIsLoadingIGDBData(true);
      igdbFetchedForRef.current = gameTitle;

      try {
        const igdbData = await fetchIGDBGameData(gameTitle);
        setCurrentGameIGDBData(igdbData);
        if (igdbData) {
          console.log('✅ [MainApp] IGDB data loaded:', igdbData.name);
          
          // Update conversation with cover URL for sidebar display
          const coverUrl = getSidebarCoverUrl(igdbData);
          console.log('🖼️ [MainApp] Cover URL for sidebar:', coverUrl, 'Original:', igdbData.cover?.url);
          if (coverUrl && activeConversation) {
            const updatedConversations = { ...conversations };
            updatedConversations[activeConversation.id] = {
              ...activeConversation,
              coverUrl
            };
            setConversations(updatedConversations);
            console.log('🖼️ [MainApp] Updated conversation with coverUrl:', activeConversation.id);
          }
        } else {
          console.log('ℹ️ [MainApp] No IGDB data found for:', gameTitle);
        }
      } catch (error) {
        console.error('❌ [MainApp] Failed to fetch IGDB data:', error);
        setCurrentGameIGDBData(null);
      } finally {
        setIsLoadingIGDBData(false);
      }
    };

    fetchGameData();
  }, [activeConversation?.gameTitle, activeConversation?.isGameHub]);

  // Function to refresh user data (for credit updates)
  const refreshUserData = async () => {
    try {
      // ✅ FIX: Call refreshUser() to fetch fresh data from Supabase, not getCurrentUser() which returns cached data
      await authService.refreshUser();
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        UserService.setCurrentUser(currentUser);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      toastService.warning('Failed to refresh user data. Please refresh the page if you experience issues.');
    }
  };

  // WebSocket message handling and auto-reconnection
  useEffect(() => {
    // Check if we have a stored connection code and try to reconnect
    const storedCode = localStorage.getItem('otakon_connection_code');
    if (storedCode && !connectionCode) {
      console.log('🔗 [MainApp] Found stored code, triggering reconnection via parent...');
      setConnectionCode(storedCode);
      
      // If we have a prop handler (MainAppRoute), let it handle the WebSocket connection
      // This ensures the proper flow: CONNECTING -> partner_connected -> CONNECTED
      if (propOnConnect) {
        console.log('🔗 [MainApp] Using propOnConnect for reconnection');
        propOnConnect(storedCode);
      } else {
        // Fallback: Handle reconnection locally (shouldn't happen normally)
        console.log('🔗 [MainApp] No propOnConnect, handling WebSocket locally');
        
        const handleWebSocketError = (error: string) => {
          console.error('WebSocket error:', error);
        };

        const handleWebSocketOpen = () => {
          console.log('🔗 [MainApp] Local WebSocket opened');
        };

        const handleWebSocketClose = () => {
          console.log('🔗 [MainApp] Local WebSocket closed');
        };
        
        // Call connect with handlers
        connect(storedCode, handleWebSocketOpen, handleWebSocketMessage, handleWebSocketError, handleWebSocketClose);
      }
    }

    // Note: Removed automatic disconnect on unmount to maintain persistent connection
    // WebSocket should only disconnect when user explicitly disconnects or logs out
  }, []); // Only run once on mount

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Ctrl/Cmd + K: Focus search/input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const chatInput = document.querySelector('textarea[placeholder*="message"]') as HTMLTextAreaElement;
        if (chatInput) {
          chatInput.focus();
          toastService.info('Chat input focused');
        }
      }

      // Ctrl/Cmd + G: Switch to Game Hub (changed from Ctrl+N to avoid browser conflict)
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        const gameHub = Object.values(conversations).find(c => c.isGameHub);
        if (gameHub) {
          handleConversationSelect(gameHub.id);
          toastService.info('Switched to Game Hub');
        }
      }

      // Escape: Stop generation
      if (e.key === 'Escape' && isLoading) {
        e.preventDefault();
        if (abortController) {
          abortController.abort();
          toastService.info('Generation stopped');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [conversations, isLoading, abortController]);

  const handleConversationSelect = async (id: string) => {
    console.error('🔄 [MainApp] Switching to conversation:', id);
    
    // Clear editing state when switching conversations
    if (editingMessageId) {
      setEditingMessageId(null);
    }
    
    // ✅ CRITICAL FIX: ALWAYS use local state as source of truth
    // Reloading from service can cause race conditions where newly created tabs disappear
    // because background sync hasn't completed yet
    const targetConversation = conversations[id];
    if (!targetConversation) {
      console.error('🔄 [MainApp] ⚠️ Conversation not found in local state:', id);
      console.error('🔄 [MainApp] Available conversations:', Object.keys(conversations));
      console.error('🔄 [MainApp] This should NOT happen - conversation should exist in state');
      
      // Last resort: reload from service, but this indicates a bug
      const updatedConversations = await ConversationService.getConversations();
      const mergedConversations = {
        ...conversations, // Keep existing local state
        ...updatedConversations // Add anything from DB
      };
      setConversations(mergedConversations);
      setActiveConversation(mergedConversations[id]);
      
      // Auto-enable Playing mode ONLY when switching to a DIFFERENT game tab
      // Don't reset session if staying on the same tab
      const targetConv = mergedConversations[id];
      const isCurrentTab = session.currentGameId === id;
      if (!isCurrentTab && targetConv && gameTabService.isGameTab(targetConv) && !targetConv.isGameHub && !targetConv.isUnreleased) {
        setActiveSession(id, true);
      } else if (!isCurrentTab && (!targetConv || targetConv.isGameHub)) {
        setActiveSession('', false);
      }
    } else {
      // ✅ PERFORMANCE FIX: Update UI immediately without waiting for database sync
      console.error('🔄 [MainApp] ⚡ Instant UI update for conversation:', id);
      
      // Update local state first (instant UI feedback)
      setActiveConversation(targetConversation);
      setSidebarOpen(false);
      
      // ✅ Auto-enable Playing mode ONLY when switching to a DIFFERENT game tab
      // Don't reset session if staying on the same tab (preserves user's toggle choice)
      const isCurrentTab = session.currentGameId === id;
      if (!isCurrentTab && gameTabService.isGameTab(targetConversation) && !targetConversation.isGameHub && !targetConversation.isUnreleased) {
        setActiveSession(id, true);
      } else if (!isCurrentTab && (!targetConversation || targetConversation.isGameHub)) {
        setActiveSession('', false);
      }
      
      // ✅ CRITICAL FIX: Save current conversations state to DB BEFORE switching
      // This ensures the new tab is persisted even if user switches quickly
      ConversationService.setConversations(conversations).catch(error => {
        console.error('🔄 [MainApp] Failed to persist conversations:', error);
      });
      
      // Update active conversation in service in background (don't await)
      // This prevents blocking the UI while syncing to Supabase
      ConversationService.setActiveConversation(id).catch(error => {
        console.error('🔄 [MainApp] Failed to sync active conversation:', error);
      });
    }
    
    // Close sidebar immediately after selecting
    if (!targetConversation) {
      setSidebarOpen(false);
    }

    // Set initial suggested prompts for Game Hub tab
    const conversation = conversations[id];
    if (conversation?.isGameHub || id === GAME_HUB_ID) {
      // If no messages yet, show news prompts (they will be displayed by SuggestedPrompts component)
      if (!conversation || !conversation.messages || conversation.messages.length === 0) {
        // SuggestedPrompts component will handle showing newsPrompts for Game Hub
        // We just need to ensure prompts array is not empty
        setSuggestedPrompts(newsPrompts);
      } else {
        // If there are messages, show contextual fallback prompts
        const fallbackPrompts = suggestedPromptsService.getFallbackSuggestions(id, conversation.isGameHub);
        setSuggestedPrompts(fallbackPrompts);
      }
    } else {
      // For game tabs, set appropriate fallback prompts
      const fallbackPrompts = suggestedPromptsService.getFallbackSuggestions(id, conversation?.isGameHub);
      setSuggestedPrompts(fallbackPrompts);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    const wasActive = activeConversation?.id === id;
    const deletedConversation = conversations[id];
    
    // ✅ OPTIMISTIC: Delete from local state immediately (instant UI)
    setConversations(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    
    // ✅ FIX: Await the delete operation to ensure it completes before any refresh
    try {
      await ConversationService.deleteConversation(id);
      console.log(`✅ [MainApp] Successfully deleted conversation: ${id}`);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      
      // Rollback on error
      setConversations(prev => ({
        ...prev,
        [id]: deletedConversation
      }));
      
      toastService.error('Failed to delete conversation.');
      return;
    }
    
    if (wasActive) {
      // If we're deleting the current active conversation, switch to "Game Hub" tab
      const gameHubTab = conversations[GAME_HUB_ID] || conversations['game-hub'];
      if (gameHubTab) {
        // Persist the active conversation change (background, non-blocking)
        ConversationService.setActiveConversation(gameHubTab.id).catch(console.error);
        setActiveConversation(gameHubTab);
        // Also clear any active session since we're switching away from a game tab
        setActiveSession('', false);
      } else {
        // Fallback to first available conversation
        const firstConversation = Object.values(conversations)[0] || null;
        if (firstConversation) {
          ConversationService.setActiveConversation(firstConversation.id).catch(console.error);
          setActiveConversation(firstConversation);
        } else {
          setActiveConversation(null);
        }
      }
      // Close sidebar on mobile after switching
      setSidebarOpen(false);
    }
  };

  const handlePinConversation = async (id: string) => {
    // Check if we can pin (max 3 pinned conversations)
    const pinnedCount = Object.values(conversations).filter((conv: Conversation) => conv.isPinned).length;
    if (pinnedCount >= 3) {
      toastService.warning('You can only pin up to 3 conversations.');
      return;
    }

    const pinnedAt = Date.now();
    
    // ✅ OPTIMISTIC: Update local state immediately (instant UI)
    setConversations(prev => ({
      ...prev,
      [id]: { ...prev[id], isPinned: true, pinnedAt }
    }));
    
    // Background sync with rollback on error
    ConversationService.updateConversation(id, { 
      isPinned: true, 
      pinnedAt 
    }).catch(error => {
      console.error('Failed to pin conversation:', error);
      
      // Rollback on error
      setConversations(prev => ({
        ...prev,
        [id]: { ...prev[id], isPinned: false, pinnedAt: undefined }
      }));
      
      toastService.error('Failed to pin conversation.');
    });
  };

  const handleUnpinConversation = async (id: string) => {
    // ✅ OPTIMISTIC: Update local state immediately (instant UI)
    setConversations(prev => ({
      ...prev,
      [id]: { ...prev[id], isPinned: false, pinnedAt: undefined }
    }));
    
    // Background sync with rollback on error
    ConversationService.updateConversation(id, { 
      isPinned: false, 
      pinnedAt: undefined 
    }).catch(error => {
      console.error('Failed to unpin conversation:', error);
      
      // Rollback on error
      setConversations(prev => ({
        ...prev,
        [id]: { ...prev[id], isPinned: true, pinnedAt: conversations[id].pinnedAt }
      }));
      
      toastService.error('Failed to unpin conversation.');
    });
  };

  const handleClearConversation = async (id: string) => {
    try {
            // ✅ OPTIMISTIC: Clear messages locally immediately (instant UI)
      setConversations(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          messages: [],
          updatedAt: Date.now()
        }
      }));
      
      // Update active conversation if it's the one being cleared
      if (activeConversation?.id === id) {
        setActiveConversation(prev => prev ? ({
          ...prev,
          messages: [],
          updatedAt: Date.now()
        }) : null);
      }
      
      // Background sync (non-blocking)
      ConversationService.clearConversation(id).catch(error => {
        console.error('Failed to clear conversation:', error);
        toastService.error('Failed to clear conversation.');
      });
      
      toastService.success('Conversation cleared');
    } catch (error) {
      console.error('Failed to clear conversation:', error);
    }
  };

  const handleCreditModalOpen = () => {
    setCreditModalOpen(true);
  };

  const handleCreditModalClose = () => {
    setCreditModalOpen(false);
  };

  const handleUpgrade = () => {
    // TODO: Implement upgrade functionality
      };

  const handleOpenGuide = () => {
    // Open the welcome screen guide
    setWelcomeScreenOpen(true);
  };

  const handleAddGame = () => {
    setAddGameModalOpen(true);
  };

  const handleCreateGame = async (gameName: string, query: string) => {
    // Switch to Game Hub
    const gameHub = Object.values(conversations).find(
      (conv) => conv.isGameHub || conv.id === 'game-hub' || conv.title === 'Game Hub'
    );
    
    if (!gameHub) {
      toastService.error('Game Hub not found. Please refresh the page.');
      return;
    }

    // Switch to Game Hub and close modal
    await ConversationService.setActiveConversation(gameHub.id);
    setActiveConversation(gameHub);
    setAddGameModalOpen(false);
    
    // Send formatted query to Game Hub
    // Format: "I'm playing [GAME]. [USER_QUERY]"
    const formattedMessage = `I'm playing ${gameName}. ${query}`;
    
    // Show processing message
    toastService.info(`Checking ${gameName}...`);
    
    // Send message immediately - UI is already switched to Game Hub
    // The AI will respond and determine if it's a valid/released/unreleased game
    // The handleSendMessage flow will handle tab creation based on AI response
    handleSendMessage(formattedMessage);
  };

  const handleConnectionModalOpen = () => {
    setConnectionModalOpen(true);
  };

  const handleConnectionModalClose = () => {
    setConnectionModalOpen(false);
  };

  const handleClearConnectionError = () => {
    if (propOnClearConnectionError) {
      propOnClearConnectionError();
    }
  };

  const handleHandsFreeToggle = () => {
    // Verify Pro tier before opening modal (extra safety check)
    const currentUser = authService.getCurrentUser();
    const isPro = currentUser?.tier === 'pro' || currentUser?.tier === 'vanguard_pro';
    
    if (!isPro) {
      toastService.show('Hands-free mode is a Pro feature', 'info');
      return;
    }
    
    // Open the modal
    setHandsFreeModalOpen(true);
  };

  const handleHandsFreeModalClose = () => {
    setHandsFreeModalOpen(false);
  };

  const handleToggleHandsFreeFromModal = () => {
    // This is the actual toggle that enables/disables hands-free mode
    const newMode = !isHandsFreeMode;
    setIsHandsFreeMode(newMode);
    localStorage.setItem('otakonHandsFreeMode', String(newMode));
    
    // If disabling hands-free mode, stop any ongoing speech
    if (!newMode) {
      ttsService.cancel();
    }
  };

  // AI mode toggle handler (Pro/Vanguard only)
  const handleAiModeToggle = () => {
    // Get user directly from authService to ensure we have the latest tier info
    const currentUser = authService.getCurrentUser();
    const isPro = currentUser?.tier === 'pro' || currentUser?.tier === 'vanguard_pro';
    
    if (!isPro) {
      toastService.show('AI mode toggle is a Pro feature', 'info');
      return;
    }
    
    const newMode = !aiModeEnabled;
    setAiModeEnabled(newMode);
    localStorage.setItem('otakonAiMode', String(newMode));
    
    // ✅ FIX: When AI mode is turned OFF and we're in manual/pause mode,
    // save the pause state and switch to auto/play mode
    if (!newMode && isManualUploadMode) {
      // Remember that pause was active before we turned AI mode off
      pauseStateBeforeAiOffRef.current = true;
      setIsManualUploadMode(false);
      localStorage.setItem('otakon_manual_upload_mode', 'false');
      toastService.show(
        'AI mode disabled - Auto-upload enabled for direct screenshot capture',
        'success'
      );
    } else if (newMode && pauseStateBeforeAiOffRef.current === true) {
      // ✅ FIX: When AI mode is turned back ON, restore the previous pause state
      pauseStateBeforeAiOffRef.current = null; // Clear the saved state
      setIsManualUploadMode(true);
      localStorage.setItem('otakon_manual_upload_mode', 'true');
      toastService.show(
        'AI mode enabled - Pause mode restored',
        'success'
      );
    } else {
      // Clear saved state if turning off AI mode while not in pause mode
      if (!newMode) {
        pauseStateBeforeAiOffRef.current = null;
      }
      toastService.show(
        newMode ? 'AI mode enabled - Screenshots will be analyzed' : 'AI mode disabled - Screenshots will be stored only',
        'success'
      );
    }
  };

  // Settings context menu handlers
  const handleSettingsContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Toggle the menu if it's already open
    if (settingsContextMenu.isOpen) {
      closeSettingsContextMenu();
    } else {
      setSettingsContextMenu({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
      });
    }
  };

  const closeSettingsContextMenu = () => {
    setSettingsContextMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
    });
  };

  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };

  const handleLogout = () => {
    onLogout();
  };

  const handleConnect = (code: string) => {
    console.log('[MainApp] handleConnect called with code:', code);
    setConnectionCode(code);
    
    // Let the parent (MainAppRoute) handle the actual WebSocket connection
    // This ensures proper connection flow: CONNECTING -> wait for partner_connected -> CONNECTED
    if (propOnConnect) {
      propOnConnect(code);
    } else {
      // Fallback to local websocket connection (shouldn't happen normally)
      console.warn('[MainApp] No propOnConnect provided, using local WebSocket connection');
      connect(
        code,
        () => {
          console.log('[MainApp] Local WebSocket opened');
        },
        (data: Record<string, unknown>) => {
          // Check for partner_connected to confirm connection
          if (data.type === 'partner_connected' || data.type === 'connection_alive') {
            setLastSuccessfulConnection(new Date());
            localStorage.setItem('otakon_connection_code', code);
            localStorage.setItem('otakon_last_connection', new Date().toISOString());
            localStorage.setItem('otakonHasConnectedBefore', 'true');
          }
        },
        (error: string) => {
          console.error('[MainApp] Connection error:', error);
        },
        () => {
          console.log('[MainApp] Local WebSocket closed');
        }
      );
    }
  };

  const handleDisconnect = () => {
    console.log('[MainApp] handleDisconnect called');
    if (propOnDisconnect) {
      propOnDisconnect();
    } else {
      disconnect();
    }
    setConnectionCode(null);
    setLastSuccessfulConnection(null);
  };

  // Handle suggested prompt clicks
  const handleSuggestedPromptClick = async (prompt: string) => {
        // Guard: Don't allow if already loading or no active conversation
    if (isLoading || !activeConversation) {
            return;
    }
    
    try {
      await handleSendMessage(prompt);
    } catch (error) {
      console.error('🎯 [MainApp] Error in handleSuggestedPromptClick:', error);
      // Ensure loading state is cleared on error
      setIsLoading(false);
    }
  };

  // Handle input message change
  const handleInputMessageChange = (message: string) => {
    setCurrentInputMessage(message);
    
    // If user clears the input while editing, cancel the edit
    if (!message.trim() && editingMessageId) {
      setEditingMessageId(null);
      toastService.info('Edit cancelled');
    }
  };

  // Handle active session toggle with session summaries
  const handleToggleActiveSession = async () => {
    if (!activeConversation) {
      return;
    }

    const wasPlaying = session.isActive && session.currentGameId === activeConversation.id;
    const willBePlaying = !wasPlaying;

    // Create summary of current session before switching
    if (wasPlaying) {
      // Switching from Playing to Planning - create playing session summary
      toastService.info('Generating session summary...');
      try {
        const playingSummary = await sessionSummaryService.generatePlayingSessionSummary(activeConversation);
        await sessionSummaryService.storeSessionSummary(activeConversation.id, playingSummary);
        
        // Add summary message to conversation
        const summaryMessage = {
          id: `msg_${Date.now()}`,
          content: `**Session Summary - Switching to Planning Mode**\n\n${playingSummary.summary}`,
          role: 'assistant' as const,
          timestamp: Date.now(),
        };
        
        // Update conversations state
        setConversations(prev => {
          const updated = { ...prev };
          if (updated[activeConversation.id]) {
            updated[activeConversation.id] = {
              ...updated[activeConversation.id],
              messages: [...updated[activeConversation.id].messages, summaryMessage],
              updatedAt: Date.now()
            };
          }
          return updated;
        });
        
        // Also update activeConversation to ensure UI updates immediately
        setActiveConversation(prev => {
          if (prev && prev.id === activeConversation.id) {
            return {
              ...prev,
              messages: [...prev.messages, summaryMessage],
              updatedAt: Date.now()
            };
          }
          return prev;
        });
        
        await ConversationService.addMessage(activeConversation.id, summaryMessage);
        toastService.success('Switched to Planning Mode 📋');
      } catch (error) {
        console.error('Failed to create playing session summary:', error);
        toastService.error('Failed to create session summary.');
      }
    } else if (willBePlaying) {
      // Switching from Planning to Playing - create planning session summary
      toastService.info('Generating session summary...');
      try {
        const planningSummary = await sessionSummaryService.generatePlanningSessionSummary(activeConversation);
        await sessionSummaryService.storeSessionSummary(activeConversation.id, planningSummary);
        
        // Add summary message to conversation
        const summaryMessage = {
          id: `msg_${Date.now()}`,
          content: `**Session Summary - Switching to Playing Mode**\n\n${planningSummary.summary}`,
          role: 'assistant' as const,
          timestamp: Date.now(),
        };
        
        // Update conversations state
        setConversations(prev => {
          const updated = { ...prev };
          if (updated[activeConversation.id]) {
            updated[activeConversation.id] = {
              ...updated[activeConversation.id],
              messages: [...updated[activeConversation.id].messages, summaryMessage],
              updatedAt: Date.now()
            };
          }
          return updated;
        });
        
        // Also update activeConversation to ensure UI updates immediately
        setActiveConversation(prev => {
          if (prev && prev.id === activeConversation.id) {
            return {
              ...prev,
              messages: [...prev.messages, summaryMessage],
              updatedAt: Date.now()
            };
          }
          return prev;
        });
        
        await ConversationService.addMessage(activeConversation.id, summaryMessage);
        toastService.success('Switched to Playing Mode 🎮');
      } catch (error) {
        console.error('Failed to create planning session summary:', error);
        toastService.error('Failed to create session summary.');
      }
    }

    // Toggle the session
    toggleSession(activeConversation.id);
  };

  // Handle stop AI request
  const handleStopAI = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
      setSuggestedPrompts([]);
    }
  };

  // Poll for subtab updates when background insights are being generated
  const pollForSubtabUpdates = async (conversationId: string, attempts = 0, maxAttempts = 60) => {
    // Stop after 60 attempts (60 seconds) - increased from 30s to allow for AI generation
    if (attempts >= maxAttempts) {
      console.error('🎮 [MainApp] ⏱️ Stopped polling for subtab updates after', attempts, 'attempts');
      return;
    }

    // Wait 1 second before checking
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // ✅ FIX: Aggressively clear cache before every poll to prevent stale reads
      ConversationService.clearCache();
      
      // ✅ CRITICAL FIX: Skip cache to ensure we get fresh data after Supabase sync
      const updatedConversations = await ConversationService.getConversations(true); // skipCache = true
      const targetConv = updatedConversations[conversationId];

      if (!targetConv) {
        console.error('🎮 [MainApp] ❌ Conversation not found:', conversationId);
        return;
      }

      // ✅ CRITICAL FIX: Check if conversation even HAS subtabs
      if (!targetConv.subtabs || targetConv.subtabs.length === 0) {
        console.error(`🎮 [MainApp] ⚠️ Conversation "${targetConv.title}" has no subtabs, stopping poll`);
        return;
      }

      // ✅ DEFENSIVE: Handle both correct shape and potential edge cases
      const loadingSubtabs = targetConv.subtabs.filter(tab => {
        const status = tab.status || (tab.metadata?.status as string);
        return status === 'loading';
      });
      const loadedSubtabs = targetConv.subtabs.filter(tab => {
        const status = tab.status || (tab.metadata?.status as string);
        return status === 'loaded';
      });
      const stillLoading = loadingSubtabs.length > 0;
      
      if (attempts === 0) {
        console.error(`🎮 [MainApp] 🔍 Starting poll for "${targetConv.title}" (${targetConv.subtabs.length} subtabs, ${loadingSubtabs.length} loading)`);
      }
      
      if (!stillLoading) {
        // Subtabs have finished loading!
        console.error(`🎮 [MainApp] ✅ All subtabs loaded for "${targetConv.title}" after ${attempts} attempts`);
        console.error(`🎮 [MainApp] 📊 Final status: ${loadedSubtabs.length} loaded, ${loadingSubtabs.length} loading`);
        
        // ✅ FIX: Deep clone to ensure React detects changes
        const freshConversations = deepCloneConversations(updatedConversations);
        
        // ✅ FIX: Force update conversations state with new reference
        setConversations(freshConversations);
        
        // ✅ FIX: CRITICAL - ALWAYS update active conversation if this is the active tab
        console.error('🎮 [MainApp] 🔍 Active conversation check:', {
          activeConvId: activeConversation?.id,
          targetConvId: conversationId,
          matches: activeConversation?.id === conversationId
        });
        
        // ✅ CRITICAL FIX: Update active conversation to force React re-render
        // Add timestamp to guarantee object reference change
        const updatedActiveConv = {
          ...freshConversations[conversationId],
          subtabs: freshConversations[conversationId].subtabs?.map(st => ({ ...st })) || [],
          _updateTimestamp: Date.now() // Force new object reference
        };
        
        console.error('🎮 [MainApp] ✅ FORCE-UPDATING active conversation with loaded subtabs');
        console.error('🎮 [MainApp] 📊 Subtab statuses:', updatedActiveConv.subtabs.map(s => ({ title: s.title, status: s.status })));
        console.error('🎮 [MainApp] 📊 Setting active conversation to trigger re-render...');
        console.error('🎮 [MainApp] 📊 Old active conv ID:', activeConversation?.id);
        console.error('🎮 [MainApp] 📊 New active conv ID:', updatedActiveConv.id);
        
        // ✅ First update conversations dict
        setConversations({
          ...freshConversations
        });
        
        // ✅ Then update active conversation (this should trigger ChatInterface re-render)
        setActiveConversation(updatedActiveConv);
        return;
      }

      // Still loading, continue polling
      if (attempts % 5 === 0 || attempts === 1) {
        console.error(`🎮 [MainApp] 🔄 "${targetConv.title}": ${loadingSubtabs.length} subtabs still loading... (attempt ${attempts + 1})`);
      }
      pollForSubtabUpdates(conversationId, attempts + 1, maxAttempts);
    } catch (error) {
      console.error('🎮 [MainApp] ❌ Error polling for subtab updates:', error);
    }
  };

  // ✅ FIX: Monitor active conversation for loading subtabs and start polling
  // This ensures subtabs load even when switching to a tab that was created earlier
  const pollingConversationRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Only check if we have an active conversation with subtabs
    if (!activeConversation?.subtabs || activeConversation.subtabs.length === 0) {
      return;
    }
    
    // Don't poll for Game Hub or unreleased games
    if (activeConversation.isGameHub || activeConversation.isUnreleased) {
      return;
    }
    
    // Check if any subtabs are in loading state
    const hasLoadingSubtabs = activeConversation.subtabs.some(tab => tab.status === 'loading');
    
    // Only start polling if:
    // 1. There are loading subtabs
    // 2. We're not already polling for this conversation
    if (hasLoadingSubtabs && pollingConversationRef.current !== activeConversation.id) {
      console.error(`🎮 [MainApp] 🔄 Detected loading subtabs on tab switch for "${activeConversation.title}"`);
      console.error(`🎮 [MainApp] 📊 Subtab statuses:`, activeConversation.subtabs.map(s => ({ title: s.title, status: s.status })));
      
      // Mark that we're polling for this conversation
      pollingConversationRef.current = activeConversation.id;
      
      // Start polling after a short delay to allow background AI to work
      setTimeout(() => {
        // Verify we're still on the same conversation before polling
        if (pollingConversationRef.current === activeConversation.id) {
          pollForSubtabUpdates(activeConversation.id);
        }
      }, 2000); // 2 second delay before starting poll
    } else if (!hasLoadingSubtabs && pollingConversationRef.current === activeConversation.id) {
      // Clear polling ref when subtabs are no longer loading
      pollingConversationRef.current = null;
    }
  }, [activeConversation?.id, activeConversation?.subtabs]);

  // Placeholder for game tab creation - will be implemented in Week 3
  const handleCreateGameTab = async (gameInfo: { gameTitle: string; genre?: string; aiResponse?: Record<string, unknown>; isUnreleased?: boolean }): Promise<Conversation | null> => {
    console.log('🎮 [MainApp] handleCreateGameTab called:', {
      gameTitle: gameInfo.gameTitle,
      currentUserTier: currentUser.tier,
      hasAiResponse: !!gameInfo.aiResponse,
      isUnreleased: gameInfo.isUnreleased
    });
    
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        console.error('User not authenticated for game tab creation');
        toastService.error('Please sign in to create game tabs.');
        return null;
      }

      // Generate unique conversation ID based on game title (without timestamp for consistency)
      const sanitizedTitle = gameInfo.gameTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      const conversationId = `game-${sanitizedTitle}`;
      
      // Check if game tab already exists
      const existingConversation = conversations[conversationId];
      if (existingConversation) {
        console.log('🎮 [MainApp] Game tab already exists in local state:', conversationId);
        return existingConversation;
      }

      console.log('🎮 [MainApp] Creating new game tab via gameTabService:', {
        conversationId,
        userTier: currentUser.tier
      });

      // Create new game tab with AI response data
      const newGameTab = await gameTabService.createGameTab({
        gameTitle: gameInfo.gameTitle,
        genre: gameInfo.genre || 'Action RPG',
        conversationId,
        userId: user.id,
        userTier: currentUser.tier, // Pass user tier for subtabs gating
        aiResponse: gameInfo.aiResponse as AIResponse | undefined, // Pass AI response for subtab population
        isUnreleased: gameInfo.isUnreleased || false // Pass unreleased status
      });

      // Add to conversations state
      setConversations(prev => ({
        ...prev,
        [conversationId]: newGameTab
      }));

      // ✅ GAME HUB TRACKING: Mark tab as created in game_hub_interactions table
      if (user.authUserId) {
        aiService.markGameHubTabCreated(user.authUserId, gameInfo.gameTitle, conversationId)
          .catch(error => console.warn('Failed to track Game Hub tab creation:', error));
      }

            toastService.success(`Game tab "${gameInfo.gameTitle}" created!`);
      return newGameTab;
    } catch (error) {
      console.error('Failed to create game tab:', error);
      toastService.error('Failed to create game tab. Please try again.');
      return null;
    }
  };

  // ✅ DELETE QUEUED MESSAGE: Remove a message from the offline queue
  const handleDeleteQueuedMessage = useCallback(async (messageId: string) => {
    console.log('🗑️ [MainApp] Deleting queued message:', messageId);
    
    // Find the message to get its queueId
    const allMessages = Object.values(conversations).flatMap(conv => conv.messages);
    const targetMessage = allMessages.find(m => m.id === messageId);
    
    // Remove from IndexedDB queue if we have a queueId
    if (targetMessage && (targetMessage as { queueId?: string }).queueId) {
      const queueId = (targetMessage as { queueId?: string }).queueId;
      if (queueId) {
        await offlineQueueService.removePendingMessage(queueId);
      }
    } else {
      // Fallback: clear all messages (shouldn't happen normally)
      console.warn('[MainApp] No queueId found, clearing all pending messages');
      await offlineQueueService.clearAllMessages();
    }
    
    // Remove from UI state
    setConversations(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(convId => {
        updated[convId] = {
          ...updated[convId],
          messages: updated[convId].messages.filter(m => m.id !== messageId),
          updatedAt: Date.now()
        };
      });
      return updated;
    });
    
    // Update activeConversation if needed
    if (activeConversation) {
      setActiveConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.filter(m => m.id !== messageId),
        updatedAt: Date.now()
      } : null);
    }
    
    toastService.success('Queued message removed');
  }, [conversations, activeConversation]);

  // ✅ EDIT MESSAGE: Allow user to edit and resubmit a query
  const handleEditMessage = useCallback((messageId: string, content: string) => {
    console.log('✏️ [MainApp] Setting up edit for message:', messageId);
    
    if (!activeConversation) {
      return;
    }
    
    // Find the message to ensure it exists
    const messageIndex = activeConversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {
      return;
    }
    
    // Store which message is being edited - will be used on submit to remove old messages
    setEditingMessageId(messageId);
    
    // Set the message in the input field for editing
    setCurrentInputMessage(content);
    
    toastService.info('Editing message - modify and resend, or clear to cancel');
  }, [activeConversation]);

  // ✅ FEEDBACK: Handle thumbs up/down on AI responses
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackMessageId, setFeedbackMessageId] = useState<string | null>(null);
  const [feedbackOriginalResponse, setFeedbackOriginalResponse] = useState<string>('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  
  const handleFeedback = useCallback(async (messageId: string, type: 'up' | 'down', messageContent?: string) => {
    // Determine content type based on ID format:
    // - Message IDs start with 'msg_' (e.g., 'msg_1732836123456')
    // - Subtab IDs are snake_case identifiers (e.g., 'story_so_far', 'missed_items')
    const contentType = messageId.startsWith('msg_') ? 'message' : 'subtab';
    
    console.log('📊 [MainApp] Feedback:', { messageId, type, contentType });
    
    if (!activeConversation) {
      return;
    }
    
    if (type === 'up') {
      // Quick positive feedback - submit immediately
      const { feedbackService } = await import('../services/feedbackService');
      const result = await feedbackService.submitPositiveFeedback(
        messageId,
        activeConversation.id,
        contentType
      );
      
      if (result.success) {
        toastService.success('Thanks for your feedback! 👍');
      }
    } else {
      // Negative feedback - open modal for details
      setFeedbackMessageId(messageId);
      setFeedbackOriginalResponse(messageContent || '');
      setFeedbackModalOpen(true);
    }
  }, [activeConversation]);
  
  const handleSubmitNegativeFeedback = useCallback(async (category: string, comment: string) => {
    if (!feedbackMessageId || !activeConversation) {
      return;
    }
    
    // Determine content type based on ID format (same logic as handleFeedback)
    const contentType = feedbackMessageId.startsWith('msg_') ? 'message' : 'subtab';
    
    setIsSubmittingFeedback(true);
    
    try {
      const { feedbackService } = await import('../services/feedbackService');
      type FeedbackCategoryType = 'not_helpful' | 'incorrect' | 'off_topic' | 'inappropriate' | 'correction' | 'other';
      const result = await feedbackService.submitNegativeFeedback(
        feedbackMessageId,
        activeConversation.id,
        category as FeedbackCategoryType,
        comment,
        contentType
      );
      
      if (result.success) {
        toastService.success('Thanks for helping us improve! 🙏');
        // ✅ Confirm the feedback in the UI by calling the message component's confirm callback
        const messageElement = document.querySelector(`[data-message-id="${feedbackMessageId}"]`) as HTMLElement & { __confirmFeedback?: (type: 'up' | 'down') => void };
        if (messageElement && messageElement.__confirmFeedback) {
          messageElement.__confirmFeedback('down');
        }
      } else {
        toastService.error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('[MainApp] Error submitting feedback:', error);
      toastService.error('Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
      setFeedbackModalOpen(false);
      setFeedbackMessageId(null);
      setFeedbackOriginalResponse('');
    }
  }, [feedbackMessageId, activeConversation]);

  // 🎓 CORRECTION: Handle AI behavior corrections
  const handleSubmitCorrection = useCallback(async (
    correctionText: string,
    correctionType: 'factual' | 'style' | 'terminology' | 'behavior',
    correctionScope: 'global' | 'game'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!feedbackMessageId || !activeConversation) {
      return { success: false, error: 'No message selected' };
    }
    
    setIsSubmittingFeedback(true);
    
    try {
      const { feedbackService } = await import('../services/feedbackService');
      const result = await feedbackService.submitCorrection({
        messageId: feedbackMessageId,
        conversationId: activeConversation.id,
        originalResponse: feedbackOriginalResponse,
        correctionText,
        correctionType,
        correctionScope,
        gameTitle: activeConversation.isGameHub ? null : (activeConversation.gameTitle ?? null),
      });
      
      if (result.success) {
        toastService.success('🎓 OTAKON will learn from this! Thanks for teaching!');
      }
      
      return result;
    } catch (error) {
      console.error('[MainApp] Error submitting correction:', error);
      return { success: false, error: 'Failed to submit correction' };
    } finally {
      setIsSubmittingFeedback(false);
    }
  }, [feedbackMessageId, feedbackOriginalResponse, activeConversation]);

  // ✅ SUBTAB MANAGEMENT: Handle modify and delete actions
  const handleModifySubtab = useCallback(async (
    tabId: string, 
    tabTitle: string, 
    suggestion: string, 
    currentContent: string
  ) => {
    if (!activeConversation) {
      return;
    }
    
    console.log('✏️ [MainApp] Modifying subtab:', { tabId, tabTitle, suggestion });
    
    try {
      // 1. Update the subtab status to loading
      const updatedSubtabs = activeConversation.subtabs?.map(subtab => 
        subtab.id === tabId 
          ? { ...subtab, status: 'loading' as const, content: 'Regenerating based on your feedback...' }
          : subtab
      ) || [];
      
      const updatedConversation = {
        ...activeConversation,
        subtabs: updatedSubtabs,
        updatedAt: Date.now()
      };
      
      // Update conversation with loading state
      setConversations(prev => ({
        ...prev,
        [activeConversation.id]: updatedConversation
      }));
      
      // ✅ FIX: Also update activeConversation to trigger re-render
      setActiveConversation(updatedConversation);
      
      // 2. Create a special prompt that instructs the AI to regenerate the subtab
      const regeneratePrompt = `[SYSTEM: Regenerate the "${tabTitle}" insight tab based on user feedback]

User's feedback for the "${tabTitle}" tab:
"${suggestion}"

Previous content:
${currentContent.slice(0, 500)}${currentContent.length > 500 ? '...' : ''}

Please regenerate the "${tabTitle}" content incorporating the user's feedback. Make sure to use the OTAKON INSIGHT_UPDATE tag to update the tab.`;
      
      // 3. Send as a system-level message to regenerate (use ref to avoid circular dependency)
      if (handleSendMessageRef.current) {
        await handleSendMessageRef.current(regeneratePrompt);
      }
      
      toastService.info(`Regenerating "${tabTitle}"...`);
    } catch (error) {
      console.error('[MainApp] Error modifying subtab:', error);
      toastService.error(`Failed to modify "${tabTitle}"`);
    }
  }, [activeConversation, setConversations]);
  
  const handleDeleteSubtab = useCallback(async (tabId: string) => {
    if (!activeConversation) {
      return;
    }
    
    const subtabToDelete = activeConversation.subtabs?.find(s => s.id === tabId);
    if (!subtabToDelete) {
      return;
    }
    
    console.log('🗑️ [MainApp] Deleting subtab:', { tabId, title: subtabToDelete.title });
    
    try {
      // 1. Delete from database
      const success = await subtabsService.deleteSubtab(activeConversation.id, tabId);
      
      if (!success) {
        throw new Error('Failed to delete subtab from database');
      }
      
      // 2. Update local state
      const updatedSubtabs = activeConversation.subtabs?.filter(s => s.id !== tabId) || [];
      
      const updatedConversation = {
        ...activeConversation,
        subtabs: updatedSubtabs,
        subtabsOrder: updatedSubtabs.map(s => s.id),
        updatedAt: Date.now()
      };
      
      setConversations(prev => ({
        ...prev,
        [activeConversation.id]: updatedConversation
      }));
      
      // ✅ FIX: Also update activeConversation to trigger re-render
      setActiveConversation(updatedConversation);
      
      toastService.success(`"${subtabToDelete.title}" deleted`);
    } catch (error) {
      console.error('[MainApp] Error deleting subtab:', error);
      toastService.error(`Failed to delete "${subtabToDelete.title}"`);
    }
  }, [activeConversation, setConversations]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSendMessage = async (message: string, imageUrl?: string) => {
    // ✅ RATE LIMITING: Prevent rapid-fire duplicate requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;
    
    if (timeSinceLastRequest < RATE_LIMIT_DELAY_MS) {
      console.warn(`⏱️ [MainApp] Rate limit: ${timeSinceLastRequest}ms since last request (min ${RATE_LIMIT_DELAY_MS}ms)`);
      return; // Silently ignore - no user-visible delay
    }
    
    lastRequestTimeRef.current = now;
    
    // ✅ OFFLINE QUEUE: Queue message when offline instead of failing
    if (!navigator.onLine) {
      console.log('📴 [MainApp] User is offline, attempting to queue message...');
      
      if (!activeConversation) {
        toastService.error('Cannot queue message: no active conversation');
        return;
      }
      
      // Check if we can still queue (max 10 messages)
      const canQueue = await offlineQueueService.canQueueMessage();
      if (!canQueue) {
        toastService.error('Offline queue is full (max 10 messages). Please wait for network to restore.');
        return;
      }
      
      // Queue the message for later
      const queuedId = await offlineQueueService.queueMessage({
        conversationId: activeConversation.id,
        content: message,
        imageUrl: imageUrl
      });
      
      if (queuedId) {
        // Add message to local state with pending indicator
        // Store queueId so we can delete it later
        const pendingMessage = {
          id: `msg_pending_${Date.now()}`,
          content: message + '\n\n_⏳ Queued - will send when online_',
          role: 'user' as const,
          timestamp: Date.now(),
          imageUrl,
          queueId: queuedId, // Track the IndexedDB queue ID
        };
        
        setConversations(prev => {
          const updated = { ...prev };
          if (updated[activeConversation.id]) {
            updated[activeConversation.id] = {
              ...updated[activeConversation.id],
              messages: [...updated[activeConversation.id].messages, pendingMessage],
              updatedAt: Date.now()
            };
            setActiveConversation(updated[activeConversation.id]);
          }
          return updated;
        });
        
        // Simple toast - user can delete from the chat UI
        toastService.info('Message queued - will send when online');
        console.log('✅ [MainApp] Message queued for offline sending:', queuedId);
      } else {
        toastService.error('Failed to queue message for offline sending');
      }
      
      return; // Exit early - don't try to send while offline
    }
    
    // Track user activity
    sessionService.trackActivity('send_message');
    
    // Prevent duplicate/concurrent sends
    if (!activeConversation || isLoading) {
      if (isLoading) {
        // Already processing a message, skip this request
      }
      console.warn('📸 [MainApp] handleSendMessage blocked:', { 
        hasActiveConversation: !!activeConversation, 
        isLoading,
        message: message?.substring(0, 50)
      });
      return;
    }

    // Validate message content
    if (!imageUrl && !message?.trim()) {
      toastService.error('Please enter a message');
      return;
    }

    if (message && message.length > 10000) {
      toastService.error('Message is too long (max 10,000 characters)');
      return;
    }

    console.log('📸 [MainApp] Sending message with image:', { message, hasImage: !!imageUrl, imageUrl: imageUrl?.substring(0, 50) + '...' });

    // Auto-switch to Playing mode for game help requests (not in Game Hub)
    const isGameHelpRequest = imageUrl || 
      (message && (
        message.toLowerCase().includes('help') ||
        message.toLowerCase().includes('how to') ||
        message.toLowerCase().includes('what should') ||
        message.toLowerCase().includes('stuck') ||
        message.toLowerCase().includes('tutorial') ||
        message.toLowerCase().includes('guide')
      ));

    if (isGameHelpRequest && !activeConversation.isGameHub) {
      // Switch to Playing mode if not already active
      if (!session.isActive || session.currentGameId !== activeConversation.id) {
                setActiveSession(activeConversation.id, true);
      }
    }

    // ✅ EDIT MODE: If we're editing a message, remove the old message and all subsequent messages first
    let messagesToKeep = activeConversation.messages;
    if (editingMessageId) {
      const messageIndex = activeConversation.messages.findIndex(m => m.id === editingMessageId);
      if (messageIndex !== -1) {
        const messagesToRemove = activeConversation.messages.slice(messageIndex);
        messagesToKeep = activeConversation.messages.slice(0, messageIndex);
        
        console.log('✏️ [MainApp] Edit mode: removing messages from index', messageIndex, 'onwards');
        
        // Remove messages from database (fire and forget)
        import('../services/messageService').then(({ MessageService }) => {
          const messageService = MessageService.getInstance();
          messagesToRemove.forEach(msg => {
            messageService.deleteMessage(activeConversation.id, msg.id)
              .catch(err => console.warn('Failed to delete message from DB:', err));
          });
        }).catch(err => console.warn('Failed to import MessageService:', err));
      }
      
      // Clear editing state
      setEditingMessageId(null);
    }

    const newMessage = {
      id: `msg_${Date.now()}`,
      content: message,
      role: 'user' as const,
      timestamp: Date.now(),
      imageUrl,
    };

    // Optimized: Update state immediately without re-fetching
    setConversations(prev => {
      const updated = { ...prev };
      if (updated[activeConversation.id]) {
        updated[activeConversation.id] = {
          ...updated[activeConversation.id],
          messages: [...messagesToKeep, newMessage],
          subtabs: editingMessageId ? [] : updated[activeConversation.id].subtabs, // Clear subtabs only if editing
          updatedAt: Date.now()
        };
        // Update activeConversation immediately so UI reflects the new message
        setActiveConversation(updated[activeConversation.id]);
      }
      return updated;
    });

    // Add message to service - MUST await to ensure it's saved before potential migration
    const userMessageResult = await ConversationService.addMessage(activeConversation.id, newMessage);
    
    // ✅ CRITICAL: Get the database UUID for migration
    const userMessageDbId = userMessageResult.message?.id || newMessage.id;

    // Clear the input message after sending
    setCurrentInputMessage('');

    // Check if message contains a tab command (for Command Centre)
    if (tabManagementService.hasTabCommand(message)) {
      const command = tabManagementService.parseTabCommand(message, activeConversation);
      if (command) {
        console.log('📝 [MainApp] Command description:', tabManagementService.describeCommand(command));
        
        // ✅ DELETE COMMANDS: Handle directly without AI (no credit cost)
        if (command.type === 'delete') {
          console.log('🗑️ [MainApp] Delete command detected - handling directly without AI');
          
          // Add AI response message confirming the delete
          const deleteConfirmMessage = {
            id: `msg_${Date.now() + 1}`,
            content: `✅ Deleted "${command.tabName}" from your insights.`,
            role: 'assistant' as const,
            timestamp: Date.now(),
          };
          
          // Delete the subtab directly
          await handleDeleteSubtab(command.tabId);
          
          // Add confirmation message
          setConversations(prev => {
            const updated = { ...prev };
            if (updated[activeConversation.id]) {
              updated[activeConversation.id] = {
                ...updated[activeConversation.id],
                messages: [...updated[activeConversation.id].messages, deleteConfirmMessage],
                updatedAt: Date.now(),
              };
              setActiveConversation(updated[activeConversation.id]);
            }
            return updated;
          });
          
          // Save confirmation message to DB
          ConversationService.addMessage(activeConversation.id, deleteConfirmMessage).catch((err: unknown) => 
            console.error('Failed to save delete confirmation:', err)
          );
          
          // Return early - no AI call, no credits consumed
          return;
        }
      }
    }

    // Track credit usage based on query type
    const hasImage = !!imageUrl;
    
    // Determine query type: image+text or image-only = image query, text-only = text query
    const queryType = hasImage ? 'image' : 'text';
    
    // ✅ AI MODE CREDIT LOGIC:
    // - Free tier: ALL queries deplete credits (always uses AI)
    // - Pro/Vanguard with AI ON: ALL queries deplete credits
    // - Pro/Vanguard with AI OFF + image: NO credits depleted (image stored, no AI call)
    // - Pro/Vanguard with AI OFF + text: Credits depleted (text always goes to AI)
    const isPro = user?.tier === 'pro' || user?.tier === 'vanguard_pro';
    const shouldDepleteCredits = !isPro || aiModeEnabled || !hasImage;
    
    // ✅ SOFT WARNING: Show warning at 90% usage (only if credits will be depleted)
    if (user && shouldDepleteCredits) {
      const currentCount = queryType === 'text' ? user.textCount : user.imageCount;
      const limit = queryType === 'text' ? user.textLimit : user.imageLimit;
      const usagePercent = (currentCount / limit) * 100;
      
      if (usagePercent >= 90 && usagePercent < 100) {
        const remaining = limit - currentCount;
        toastService.warning(
          `${remaining} ${queryType} ${remaining === 1 ? 'query' : 'queries'} remaining this month (${Math.floor(usagePercent)}% used)`
        );
      }
    }
    
    // Check if user can make the request (only check limits if credits will be depleted)
    if (shouldDepleteCredits && !UserService.canMakeRequest(queryType)) {
      const errorMessage = {
        id: `msg_${Date.now() + 1}`,
        content: `You've reached your ${queryType} query limit for this month. Upgrade to Pro for more queries.`,
        role: 'assistant' as const,
        timestamp: Date.now(),
      };
      
      // Add error message to conversation
      setConversations(prev => {
        const updated = { ...prev };
        if (updated[activeConversation.id]) {
          updated[activeConversation.id] = {
            ...updated[activeConversation.id],
            messages: [...updated[activeConversation.id].messages, errorMessage],
            updatedAt: Date.now()
          };
          // Update activeConversation immediately so UI reflects the error message
          setActiveConversation(updated[activeConversation.id]);
        }
        return updated;
      });
      
      // Save error message (non-blocking)
      ConversationService.addMessage(activeConversation.id, errorMessage)
        .catch(error => console.error('Failed to save error message:', error));
      
      // ✅ HARD BLOCK: Show upgrade prompt
      toastService.error('Monthly limit reached! Upgrade to Pro for unlimited queries.');
      return;
    }

    // Increment usage count (only if credits should be depleted)
    if (shouldDepleteCredits) {
      UserService.incrementUsage(queryType);
      
      // ✅ IMMEDIATE UI UPDATE: Update React state for credit indicator
      if (user) {
        const updatedUser = {
          ...user,
          usage: {
            ...user.usage,
            textCount: queryType === 'text' ? user.usage.textCount + 1 : user.usage.textCount,
            imageCount: queryType === 'image' ? user.usage.imageCount + 1 : user.usage.imageCount,
            totalRequests: user.usage.totalRequests + 1,
          },
          updatedAt: Date.now(),
        };
        setUser(updatedUser);
      }
      
      // Update in Supabase (non-blocking - fire and forget)
      if (user?.authUserId) {
        const supabaseService = new SupabaseService();
        supabaseService.incrementUsage(user.authUserId, queryType)
          .then(() => {
                      // Refresh user data in background to update credit indicator
            return refreshUserData();
          })
          .catch(error => console.warn('Failed to update usage in Supabase:', error));
      }
    } else {
      console.log('🔄 [MainApp] AI mode OFF - image query will not deplete credits (Pro/Vanguard)');
    }

    // Clear previous suggestions and start loading
    setSuggestedPrompts([]);
    setIsLoading(true);
    
    // Create abort controller for stop functionality
    const controller = new AbortController();
    setAbortController(controller);
    
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // ✅ AI MODE TOGGLE: If AI mode is OFF and we have a screenshot, upload to storage instead of processing
      let finalImageUrl = imageUrl;
      // Note: isPro already defined above in credit depletion logic
      
      if (imageUrl && isPro && !aiModeEnabled) {
        console.log('🔄 [MainApp] AI mode OFF - uploading screenshot to storage...');
        
        // Import storage service dynamically
        const { uploadScreenshot } = await import('../services/screenshotStorageService');
        
        // Upload to Supabase Storage
        const uploadResult = await uploadScreenshot(imageUrl, user.authUserId);
        
        if (uploadResult.success && uploadResult.publicUrl) {
          console.log('✅ [MainApp] Screenshot uploaded to storage:', {
            url: uploadResult.publicUrl,
            size: uploadResult.fileSize
          });
          
          finalImageUrl = uploadResult.publicUrl;
          
          // Add a simple acknowledgment message (no AI processing)
          const storageMessage = {
            id: `msg_${Date.now() + 1}`,
            content: `Screenshot saved to your chat. AI analysis is currently disabled. Enable AI mode to get insights about your gameplay.`,
            role: 'assistant' as const,
            timestamp: Date.now(),
          };
          
          // Update state with storage acknowledgment
          setConversations(prev => {
            const updated = { ...prev };
            if (updated[activeConversation.id]) {
              updated[activeConversation.id] = {
                ...updated[activeConversation.id],
                messages: [...updated[activeConversation.id].messages, storageMessage],
                updatedAt: Date.now()
              };
              setActiveConversation(updated[activeConversation.id]);
            }
            return updated;
          });
          
          // Save message
          await ConversationService.addMessage(activeConversation.id, storageMessage);
          
          // ✅ FIX: Clear suggested prompts for AI-off screenshot uploads (no follow-up needed)
          setSuggestedPrompts([]);
          
          // Clear loading state and exit early (skip AI processing)
          setIsLoading(false);
          setAbortController(null);
          return;
        } else {
          console.error('❌ [MainApp] Failed to upload screenshot:', uploadResult.error);
          toastService.error(`Failed to save screenshot: ${uploadResult.error}`);
          // Continue with original data URL if upload fails
        }
      }

      // Apply context summarization before sending to AI (keeps context manageable)
      let conversationWithOptimizedContext = activeConversation;
      if (activeConversation.messages.length > 10) {
        const { contextSummarizationService } = await import('../services/contextSummarizationService');
        
        if (contextSummarizationService.shouldSummarize(activeConversation)) {
                    const summarizedConversation = await contextSummarizationService.applyContextSummarization(activeConversation);
          
          // Update conversation with summarized context
          await ConversationService.updateConversation(activeConversation.id, summarizedConversation);
          conversationWithOptimizedContext = summarizedConversation;
          
          // Update local state
          setConversations(prev => ({
            ...prev,
            [activeConversation.id]: summarizedConversation
          }));
          setActiveConversation(summarizedConversation);
          
                  }
      }

      const response = await aiService.getChatResponseWithStructure(
        conversationWithOptimizedContext,
        user,
        message,
        session.isActive && session.currentGameId === activeConversation.id,
        !!finalImageUrl,
        finalImageUrl,
        controller.signal
      );

      // Check if request was aborted before adding response to conversation
      if (controller.signal.aborted) {
                return;
      }

      const aiMessage = {
        id: `msg_${Date.now() + 1}`,
        content: response.content,
        role: 'assistant' as const,
        timestamp: Date.now(),
      };

      // Optimized: Update state immediately
      setConversations(prev => {
        const updated = { ...prev };
        if (updated[activeConversation.id]) {
          updated[activeConversation.id] = {
            ...updated[activeConversation.id],
            messages: [...updated[activeConversation.id].messages, aiMessage],
            updatedAt: Date.now()
          };
          // Update activeConversation immediately so UI reflects the new message
          setActiveConversation(updated[activeConversation.id]);
        }
        return updated;
      });

      // Add message to service - MUST await to ensure it's saved before potential migration
      const aiMessageResult = await ConversationService.addMessage(activeConversation.id, aiMessage);
      
      // ✅ CRITICAL: Get the database UUID for migration
      const aiMessageDbId = aiMessageResult.message?.id || aiMessage.id;

      //  Hands-Free Mode: Read AI response aloud if enabled
      if (isHandsFreeMode && response.content) {
        try {
          // Extract only the Hint section for TTS - stop at any section header
          let textToSpeak = '';
          
          // Check if content has a Hint section
          const hintStartMatch = response.content.match(/\*?\*?Hint:?\*?\*?\s*/i);
          
          if (hintStartMatch) {
            // Get the index where Hint content starts
            const hintStartIndex = (hintStartMatch.index || 0) + hintStartMatch[0].length;
            const contentAfterHint = response.content.substring(hintStartIndex);
            
            // Find where the next section starts (Lore, Strategy, Places of Interest, etc.)
            const nextSectionMatch = contentAfterHint.match(/\n\s*\*?\*?(?:Lore|Places of Interest|Strategy|Characters|Items|Walkthrough|Tips):?\*?\*?/i);
            
            if (nextSectionMatch && nextSectionMatch.index !== undefined) {
              // Extract only the Hint content up to the next section
              textToSpeak = contentAfterHint.substring(0, nextSectionMatch.index).trim();
            } else {
              // No next section found, but limit to first paragraph or reasonable length
              const paragraphs = contentAfterHint.split(/\n\n/);
              textToSpeak = paragraphs[0].trim();
            }
          } else if (!response.content.match(/\*?\*?(?:Lore|Places of Interest|Strategy):?\*?\*?/i)) {
            // No structured sections detected at all, read the first paragraph only
            const paragraphs = response.content.split(/\n\n/);
            textToSpeak = paragraphs[0].trim();
          }
          // If there's Lore but no Hint, don't read anything
          
          if (textToSpeak) {
            // Strip markdown and special formatting for better TTS
            const cleanText = textToSpeak
              .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
              .replace(/\*([^*]+)\*/g, '$1') // Remove italics
              .replace(/[_~`]/g, '') // Remove other markdown formatting
              .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert [text](url) to text
              .replace(/#{1,6}\s/g, '') // Remove heading markers
              .replace(/```[\s\S]*?```/g, '') // Remove code blocks
              .replace(/`([^`]+)`/g, '$1') // Remove inline code markers
              .replace(/\n+/g, ' ') // Replace newlines with spaces
              .replace(/\s+/g, ' ') // Collapse multiple spaces
              .trim();
            
            if (cleanText && cleanText.length > 10) {
              console.log('🔊 [TTS] Speaking hint only:', cleanText.substring(0, 100) + '...');
              // Don't await - let TTS run in background without blocking chat flow
              ttsService.speak(cleanText).catch(err => console.error('TTS Error:', err));
            }
          }
        } catch (ttsError) {
          console.error('TTS Error:', ttsError);
          // Don't block the flow if TTS fails
        }
      } else if (!isHandsFreeMode && response.content) {
        // 📱 Show notification if TTS is OFF and screen is locked
        try {
          const { showAINotification, isScreenLockedOrHidden } = await import('../services/toastService');
          
          if (isScreenLockedOrHidden()) {
            // Extract only hint for notification - same logic as TTS
            let notificationText = '';
            
            const hintStartMatch = response.content.match(/\*?\*?Hint:?\*?\*?\s*/i);
            
            if (hintStartMatch) {
              const hintStartIndex = (hintStartMatch.index || 0) + hintStartMatch[0].length;
              const contentAfterHint = response.content.substring(hintStartIndex);
              
              const nextSectionMatch = contentAfterHint.match(/\n\s*\*?\*?(?:Lore|Places of Interest|Strategy|Characters|Items|Walkthrough|Tips):?\*?\*?/i);
              
              if (nextSectionMatch && nextSectionMatch.index !== undefined) {
                notificationText = contentAfterHint.substring(0, nextSectionMatch.index).trim();
              } else {
                const paragraphs = contentAfterHint.split(/\n\n/);
                notificationText = paragraphs[0].trim();
              }
            } else if (!response.content.match(/\*?\*?(?:Lore|Places of Interest|Strategy):?\*?\*?/i)) {
              const paragraphs = response.content.split(/\n\n/);
              notificationText = paragraphs[0].trim();
            }
            
            if (notificationText) {
              // Clean markdown for notification
              const cleanText = notificationText
                .replace(/\*\*([^*]+)\*\*/g, '$1')
                .replace(/\*([^*]+)\*/g, '$1')
                .replace(/[_~`]/g, '')
                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                .replace(/#{1,6}\s/g, '')
                .replace(/```[\s\S]*?```/g, '')
                .replace(/`([^`]+)`/g, '$1')
                .replace(/\n+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
              
              if (cleanText && cleanText.length > 10) {
                showAINotification(
                  cleanText,
                  activeConversation.title || 'Otagon AI'
                );
              }
            }
          }
        } catch (notificationError) {
          console.error('Notification Error:', notificationError);
        }
      }

      // ✅ DEFERRED: Process suggested prompts AFTER tab migration (moved to after tab switch)
      // This ensures prompts are based on the FINAL active tab, not the intermediate Game Hub state
      
      // 🚨 CRITICAL DEBUG - This should ALWAYS appear after AI response
      console.warn('🚨🚨🚨 [MainApp] AI RESPONSE PROCESSING STARTED 🚨🚨🚨');
      console.warn('🚨 Response object:', JSON.stringify({
        hasContent: !!response.content,
        contentLength: response.content?.length,
        stateUpdateTags: response.stateUpdateTags,
        hasOtakonTags: response.otakonTags?.size > 0,
        otakonTagKeys: response.otakonTags ? Array.from(response.otakonTags.keys()) : []
      }, null, 2));
      
      const suggestionsToUse = response.followUpPrompts || response.suggestions;
      console.log('🔍 [MainApp] suggestionsToUse (before processing):', suggestionsToUse);
      
      let processedSuggestions = suggestedPromptsService.processAISuggestions(suggestionsToUse);
      console.log('🔍 [MainApp] processedSuggestions (after processing):', processedSuggestions);
      
      // 🔄 Filter out already shown prompts to prevent repetition
      if (user?.authUserId && processedSuggestions.length > 0) {
        try {
          const gameTitle = activeConversation?.isGameHub ? null : (activeConversation?.gameTitle ?? null);
          processedSuggestions = await shownPromptsService.filterNewPrompts(
            user.authUserId,
            processedSuggestions,
            'suggested',
            gameTitle
          );
          console.log('🔍 [MainApp] processedSuggestions (after shown filter):', processedSuggestions);
        } catch (filterError) {
          console.warn('[MainApp] Failed to filter shown prompts, using unfiltered:', filterError);
        }
      }
      
      // ✅ DEBUG: Log all response fields for progress tracking
      console.log('📊 [MainApp] AI Response received:', {
        hasStateUpdateTags: !!response.stateUpdateTags,
        stateUpdateTags: response.stateUpdateTags,
        hasOtakonTags: response.otakonTags?.size > 0,
        otakonTagKeys: response.otakonTags ? Array.from(response.otakonTags.keys()) : [],
        contentPreview: response.content?.substring(0, 200)
      });
      
      // Handle state update tags (game progress, objectives, etc.)
      // ✅ DEFERRED: Collect updates but DON'T apply yet - we need to wait until after
      // migration decision to apply them to the CORRECT conversation (game tab, not Game Hub)
      let progressUpdate: number | null = null;
      let objectiveUpdate: string | null = null;
      
      if (response.stateUpdateTags && response.stateUpdateTags.length > 0) {
        console.error('🎮 [MainApp] Processing state update tags:', response.stateUpdateTags);
        
        for (const tag of response.stateUpdateTags) {
          // Extract progress updates (e.g., "PROGRESS: 45")
          if (tag.startsWith('PROGRESS:')) {
            const progress = parseInt(tag.split(':')[1]?.trim() || '0', 10);
            if (!isNaN(progress) && progress >= 0 && progress <= 100) {
              console.error(`🎮 [MainApp] Found progress in stateUpdateTags: ${progress}%`);
              progressUpdate = progress;
            }
          }
          
          // Extract objective updates (e.g., "OBJECTIVE: Defeat the boss")
          if (tag.startsWith('OBJECTIVE:')) {
            const objective = tag.split(':')[1]?.trim();
            if (objective) {
              console.error(`🎮 [MainApp] Found objective in stateUpdateTags: ${objective}`);
              objectiveUpdate = objective;
            }
          }
        }
      }
      
      // Also check otakonTags for progress/objective (fallback/alternative source)
      if (response.otakonTags?.has('PROGRESS') && progressUpdate === null) {
        const progress = response.otakonTags.get('PROGRESS') as number;
        if (typeof progress === 'number' && progress >= 0 && progress <= 100) {
          console.error(`🎮 [MainApp] Found progress in otakonTags: ${progress}%`);
          progressUpdate = progress;
        }
      }
      
      if (response.otakonTags?.has('OBJECTIVE') && objectiveUpdate === null) {
        const objective = response.otakonTags.get('OBJECTIVE') as string;
        if (objective && typeof objective === 'string' && objective.trim()) {
          console.error(`🎮 [MainApp] Found objective in otakonTags: ${objective}`);
          objectiveUpdate = objective;
        }
      }
      
      // ✅ DEFERRED: Progress/objective updates will be applied AFTER migration decision
      // See the migration block below where we apply to the correct target conversation
      const hasPendingProgressUpdates = progressUpdate !== null || objectiveUpdate !== null;
      if (hasPendingProgressUpdates) {
        console.error('🎮 [MainApp] 📌 Deferring progress/objective updates until after migration decision:', {
          progressUpdate,
          objectiveUpdate
        });
      }

      // ✅ DEFER subtab updates - will be applied AFTER migration to the correct target conversation
      // Store the updates to apply after we know which conversation they should go to
      const pendingSubtabUpdates = response.progressiveInsightUpdates || [];
      if (pendingSubtabUpdates.length > 0) {
        console.error('🎮 [MainApp] 📌 Deferring', pendingSubtabUpdates.length, 'subtab updates until after migration decision');
      }

      // ✅ NEW: Handle OTAKON_SUBTAB_UPDATE for automatic subtab content updates
      if (response.otakonTags.has('SUBTAB_UPDATE')) {
        const subtabUpdates = response.otakonTags.get('SUBTAB_UPDATE') as Array<{tab: string; content: string}>;
        if (Array.isArray(subtabUpdates) && subtabUpdates.length > 0) {
          console.log(`📝 [MainApp] OTAKON_SUBTAB_UPDATE detected:`, subtabUpdates.length, 'updates');
          
          // Map tab names to subtab IDs and update
          const currentSubtabs = activeConversation.subtabs || [];
          const tabNameToId: Record<string, string> = {};
          
          // Build mapping from tab title/type to ID
          currentSubtabs.forEach(subtab => {
            const normalizedTitle = subtab.title.toLowerCase().replace(/\s+/g, '_');
            tabNameToId[normalizedTitle] = subtab.id;
            if (subtab.type) {
              tabNameToId[subtab.type] = subtab.id;
            }
          });
          
          // Convert SUBTAB_UPDATE format to progressiveInsightUpdates format
          const mappedUpdates = subtabUpdates
            .map(update => {
              const tabId = tabNameToId[update.tab] || tabNameToId[update.tab.toLowerCase().replace(/\s+/g, '_')];
              if (tabId) {
                return {
                  tabId,
                  title: update.tab.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                  content: update.content
                };
              }
              console.warn(`📝 [MainApp] Could not find subtab for: ${update.tab}`);
              return null;
            })
            .filter(Boolean) as Array<{tabId: string; title: string; content: string}>;
          
          if (mappedUpdates.length > 0) {
            gameTabService.updateSubTabsFromAIResponse(activeConversation.id, mappedUpdates)
              .then(() => {
                console.log(`📝 [MainApp] Successfully updated ${mappedUpdates.length} subtabs`);
                ConversationService.getConversations().then(updatedConversations => {
                  const freshConversations = deepCloneConversations(updatedConversations);
                  setConversations(freshConversations);
                  const refreshedConversation = freshConversations[activeConversation.id];
                  if (refreshedConversation) {
                    setActiveConversation(refreshedConversation);
                  }
                });
              })
              .catch(error => console.error('📝 [MainApp] Failed to update subtabs:', error));
          }
        }
      }

      // Handle tab management commands (Command Centre)
      if (response.otakonTags.has('OTAKON_INSIGHT_UPDATE') || 
          response.otakonTags.has('OTAKON_INSIGHT_MODIFY_PENDING') || 
          response.otakonTags.has('OTAKON_INSIGHT_DELETE_REQUEST')) {
        
                // Handle INSIGHT_UPDATE (update content of existing tab)
        if (response.otakonTags.has('OTAKON_INSIGHT_UPDATE')) {
          const updateData = response.otakonTags.get('OTAKON_INSIGHT_UPDATE');
                    if (typeof updateData === 'string') {
            try {
              const parsed = JSON.parse(updateData);
              if (parsed.id && parsed.content) {
                gameTabService.updateSubTabsFromAIResponse(
                  activeConversation.id,
                  [{ tabId: parsed.id, title: '', content: parsed.content }]
                ).then(() => {
                                    // Refresh UI
                  ConversationService.getConversations().then(updatedConversations => {
                    const freshConversations = deepCloneConversations(updatedConversations);
                    setConversations(freshConversations);
                    const refreshedConversation = freshConversations[activeConversation.id];
                    if (refreshedConversation) {
                      setActiveConversation(refreshedConversation);
                    }
                  });
                }).catch(error => console.error('Failed to update tab:', error));
              }
            } catch (error) {
              console.error('Failed to parse INSIGHT_UPDATE:', error);
            }
          }
        }

        // Handle INSIGHT_MODIFY_PENDING (modify/rename tab)
        if (response.otakonTags.has('OTAKON_INSIGHT_MODIFY_PENDING')) {
          const modifyData = response.otakonTags.get('OTAKON_INSIGHT_MODIFY_PENDING');
                    if (typeof modifyData === 'string') {
            try {
              const parsed = JSON.parse(modifyData);
              if (parsed.id && (parsed.title || parsed.content)) {
                gameTabService.updateSubTabsFromAIResponse(
                  activeConversation.id,
                  [{ tabId: parsed.id, title: parsed.title || '', content: parsed.content || '' }]
                ).then(() => {
                                    // Refresh UI
                  ConversationService.getConversations().then(updatedConversations => {
                    const freshConversations = deepCloneConversations(updatedConversations);
                    setConversations(freshConversations);
                    const refreshedConversation = freshConversations[activeConversation.id];
                    if (refreshedConversation) {
                      setActiveConversation(refreshedConversation);
                    }
                  });
                }).catch(error => console.error('Failed to modify tab:', error));
              }
            } catch (error) {
              console.error('Failed to parse INSIGHT_MODIFY_PENDING:', error);
            }
          }
        }

        // Handle INSIGHT_DELETE_REQUEST (delete tab)
        if (response.otakonTags.has('OTAKON_INSIGHT_DELETE_REQUEST')) {
          const deleteData = response.otakonTags.get('OTAKON_INSIGHT_DELETE_REQUEST');
                    if (typeof deleteData === 'string') {
            try {
              const parsed = JSON.parse(deleteData);
              if (parsed.id) {
                // Remove the subtab from conversation
                const updatedSubtabs = activeConversation.subtabs?.filter(tab => tab.id !== parsed.id) || [];
                ConversationService.updateConversation(activeConversation.id, {
                  subtabs: updatedSubtabs
                }).then(() => {
                                    // Refresh UI
                  ConversationService.getConversations().then(updatedConversations => {
                    setConversations(updatedConversations);
                    const refreshedConversation = updatedConversations[activeConversation.id];
                    if (refreshedConversation) {
                      setActiveConversation(refreshedConversation);
                    }
                  });
                }).catch(error => console.error('Failed to delete tab:', error));
              }
            } catch (error) {
              console.error('Failed to parse INSIGHT_DELETE_REQUEST:', error);
            }
          }
        }
      }

      // Handle game tab creation if game is identified
      // 🔍 DEBUG: Log all otakon tags for debugging game tab creation
      console.log('🎮 [MainApp] DEBUG - All otakon tags from AI response:', {
        hasGameId: response.otakonTags.has('GAME_ID'),
        allTagKeys: Array.from(response.otakonTags.keys()),
        allTagValues: Object.fromEntries(response.otakonTags),
        imageUrl: imageUrl ? '(has image)' : '(no image)',
        activeConversationId: activeConversation.id,
        isGameHub: activeConversation.isGameHub
      });
      
      if (response.otakonTags.has('GAME_ID')) {
        const gameTitle = response.otakonTags.get('GAME_ID');
        const confidence = response.otakonTags.get('CONFIDENCE');
        const isUnreleased = response.otakonTags.get('GAME_STATUS') === 'unreleased';
        const genre = response.otakonTags.get('GENRE') || 'Default';

        // Create game tab if confidence is high (game is valid)
        // 
        // SIMPLIFIED LOGIC:
        // - For TEXT queries: Create tab if confidence is high
        // - For IMAGE queries (screenshots OR camera photos): Create tab if confidence is high
        //   - Removed IS_FULLSCREEN requirement because:
        //     1. Users can upload camera photos of their screen (not fullscreen)
        //     2. Camera photos of gameplay should still create tabs
        //     3. High confidence already indicates the AI recognized actual gameplay
        // 
        // The AI's high confidence in game identification is sufficient to create a tab.
        // Low confidence (menus, launchers, unclear images) will stay in Game Hub.
        const shouldCreateTab = confidence === 'high';
        
        // Keep IS_FULLSCREEN for informational/logging purposes only
        const isFullscreen = response.otakonTags.get('IS_FULLSCREEN') === 'true';
        const wasImageQuery = !!imageUrl;
        
        // 🔍 DEBUG: Log all decision factors for game tab creation
        console.log('🎮 [MainApp] DEBUG - Game tab creation decision:', {
          gameTitle,
          confidence,
          confidenceIsHigh: confidence === 'high',
          isFullscreen: isFullscreen, // Informational only
          wasImageQuery,
          shouldCreateTab,
          note: 'IS_FULLSCREEN no longer blocks tab creation - high confidence is sufficient'
        });

        if (!shouldCreateTab) {
          console.log('⚠️ [MainApp] Tab creation blocked:', {
            gameTitle,
            confidence,
            isFullscreen,
            wasImageQuery,
            reason: confidence !== 'high' ? '❌ Low confidence detection - game not clearly identified' : '❌ Unknown reason',
            hint: 'Make sure the game is clearly visible in the image or mention it by name'
          });
        }

        if (shouldCreateTab) {
          // ✅ Check if game tab already exists using service (not stale state)
          const targetConvId = gameTabService.generateGameConversationId(gameTitle as string);
          const existingGameTab = await ConversationService.getConversation(targetConvId);

          let targetConversationId: string;
          
          if (existingGameTab) {
                        targetConversationId = existingGameTab.id;
          } else {
            console.log('🎮 [MainApp] Creating new game tab for:', gameTitle, isUnreleased ? '(unreleased)' : '(released)');
            const gameInfo = { gameTitle: gameTitle as string, genre: genre as string | undefined, aiResponse: response as unknown as Record<string, unknown>, isUnreleased };
            const newGameTab = await handleCreateGameTab(gameInfo);
            targetConversationId = newGameTab?.id || '';
            
            // ✅ CRITICAL: Refresh conversations immediately after creating new tab
            // This ensures the new tab is available for message migration
            const refreshedConversations = await ConversationService.getConversations();
            setConversations(refreshedConversations);
                      }

          // Move the user message and AI response to the game tab if we detected a DIFFERENT game
          // Allow migration from Game Hub OR from a different game tab
          const shouldMigrateMessages = targetConversationId && targetConversationId !== activeConversation.id;
                              if (shouldMigrateMessages) {
            // ✅ FIX: Update local state IMMEDIATELY so messages appear in the new tab right away
            // This prevents the visual gap where messages disappear during migration
            // ✅ CRITICAL: Use database IDs for the messages to migrate (not temp client IDs)
            const userMsgWithDbId = { ...newMessage, id: userMessageDbId };
            const aiMsgWithDbId = { ...aiMessage, id: aiMessageDbId };
            const messagesToMigrate = [userMsgWithDbId, aiMsgWithDbId];
            
            // Get fresh conversations state for immediate update
            const currentConversations = await ConversationService.getConversations();
            const sourceConv = currentConversations[activeConversation.id];
            const destConv = currentConversations[targetConversationId];
            
            if (sourceConv && destConv) {
              // Optimistically update state BEFORE database operations
              // ✅ FIX: Filter using database UUIDs, not temporary client IDs
              const updatedSourceMessages = sourceConv.messages.filter(
                m => m.id !== userMessageDbId && m.id !== aiMessageDbId
              );
              const updatedDestMessages = [...destConv.messages, ...messagesToMigrate];
              
              setConversations(prev => ({
                ...prev,
                [activeConversation.id]: {
                  ...prev[activeConversation.id],
                  messages: updatedSourceMessages,
                  updatedAt: Date.now()
                },
                [targetConversationId]: {
                  ...prev[targetConversationId],
                  messages: updatedDestMessages,
                  updatedAt: Date.now()
                }
              }));
              
              // Set active conversation to dest WITH messages already included
              setActiveConversation({
                ...destConv,
                messages: updatedDestMessages,
                updatedAt: Date.now()
              });
              
              console.log('📦 [MainApp] Optimistically updated UI with migrated messages');
            }
            
            // ✅ Now do database migration in background (non-blocking for UI)
            // Wait for conversation to fully persist before migrating
            await new Promise(resolve => setTimeout(resolve, 500));

            // ✅ Use atomic migration service to prevent race conditions
            // ✅ CRITICAL: Use database UUIDs instead of temporary client IDs
            await MessageRoutingService.migrateMessagesAtomic(
              [userMessageDbId, aiMessageDbId],
              activeConversation.id,
              targetConversationId
            );
            
            // ✅ After migration, update subtabs with new context from the AI response
            // This updates existing subtabs progressively, not regenerating them
            gameTabService.updateSubtabsAfterMigration(targetConversationId, response as unknown as AIResponse)
              .catch(error => console.error('🔄 [MainApp] Background subtab update failed:', error));
            
            // Update state to reflect the final changes from database
            const updatedConversations = await ConversationService.getConversations();
            setConversations(updatedConversations);
            
            // Switch to the game tab
            const gameTab = updatedConversations[targetConversationId];
            if (gameTab) {
              // ✅ APPLY DEFERRED PROGRESS UPDATES to the TARGET game tab (not Game Hub!)
              if (progressUpdate !== null || objectiveUpdate !== null) {
                const progressUpdates: Partial<Conversation> = { updatedAt: Date.now() };
                
                if (progressUpdate !== null) {
                  progressUpdates.gameProgress = progressUpdate;
                  console.error(`🎮 [MainApp] ✅ Applying progress ${progressUpdate}% to TARGET: ${gameTab.title} (${targetConversationId})`);
                }
                
                if (objectiveUpdate !== null) {
                  progressUpdates.activeObjective = objectiveUpdate;
                  console.error(`🎮 [MainApp] ✅ Applying objective to TARGET: ${gameTab.title}`);
                }
                
                // Update in database first
                await ConversationService.updateConversation(targetConversationId, progressUpdates);
                
                // Merge into gameTab for immediate UI update
                Object.assign(gameTab, progressUpdates);
                
                // Update state with progress included
                setConversations(prev => ({
                  ...prev,
                  [targetConversationId]: { ...prev[targetConversationId], ...progressUpdates }
                }));
              }
              
              await ConversationService.setActiveConversation(targetConversationId);
              setActiveConversation(gameTab);
              // Auto-switch to Playing mode for new/existing game tabs
              setActiveSession(targetConversationId, true);
              // Close sidebar on mobile
              setSidebarOpen(false);
              
              // ✅ Set suggested prompts AFTER tab switch (based on FINAL active tab)
              if (processedSuggestions.length > 0) {
                setSuggestedPrompts(processedSuggestions);
                // 🔄 Record shown prompts to prevent future repetition
                if (user?.authUserId) {
                  const promptsToRecord = processedSuggestions.map(p => ({
                    promptText: p,
                    promptType: 'suggested' as const,
                    gameTitle: gameTab.gameTitle ?? null
                  }));
                  shownPromptsService.recordShownPrompts(user.authUserId, promptsToRecord)
                    .catch((err: unknown) => console.warn('[MainApp] Failed to record shown prompts:', err));
                }
              } else {
                // Use fallback suggestions based on the GAME TAB, not Game Hub
                const fallbackSuggestions = suggestedPromptsService.getFallbackSuggestions(gameTab.id, false);
                setSuggestedPrompts(fallbackSuggestions);
              }
              
              // Poll for subtab updates if they're still loading
              const hasLoadingSubtabs = gameTab.subtabs?.some(tab => tab.status === 'loading');
              console.error(`🎮 [MainApp] 🔍 Checking if polling needed for "${gameTab.title}" (ID: ${targetConversationId})`);
              console.error(`🎮 [MainApp] 🔍 Subtabs status: ${gameTab.subtabs?.length || 0} total, ${hasLoadingSubtabs ? 'HAS LOADING' : 'all loaded or none'}`);
              
              if (hasLoadingSubtabs) {
                console.error('🎮 [MainApp] 🔄 Starting background refresh for loading subtabs');
                // ✅ FIX: Increase delay to 8 seconds to give background AI task time to complete
                // Background insight generation takes ~5-7 seconds, so we wait 8 to be safe.
                // This prevents excessive polling when subtabs haven't been generated yet.
                setTimeout(() => {
                  console.error(`🎮 [MainApp] ⏰ Delay complete, starting poll for conversation: ${targetConversationId}`);
                  pollForSubtabUpdates(targetConversationId);
                }, 8000); // Wait 8 seconds before first poll (was 2 seconds)
              } else {
                console.error(`🎮 [MainApp] ✅ No loading subtabs for "${gameTab.title}", skipping poll`);
              }
              
              // ✅ CRITICAL: Apply deferred subtab updates to TARGET conversation (not source!)
              // This ensures subtab updates go to Game B when you upload a Game B screenshot from Game A
              if (pendingSubtabUpdates.length > 0) {
                console.error(`🎮 [MainApp] ✅ Applying ${pendingSubtabUpdates.length} deferred subtab updates to TARGET: ${gameTab.title}`);
                gameTabService.updateSubTabsFromAIResponse(
                  targetConversationId,  // ✅ Use TARGET conversation, not source
                  pendingSubtabUpdates
                ).then(() => {
                  console.error('🎮 [MainApp] ✅ Successfully applied deferred subtab updates to target');
                  // Refresh to show updated subtabs
                  ConversationService.getConversations().then(refreshedConvs => {
                    const freshConversations = deepCloneConversations(refreshedConvs);
                    setConversations(freshConversations);
                    const refreshedTarget = freshConversations[targetConversationId];
                    if (refreshedTarget) {
                      setActiveConversation(refreshedTarget);
                    }
                  });
                }).catch(error => {
                  console.error('🎮 [MainApp] ❌ Failed to apply deferred subtab updates:', error);
                });
              }
            }
          } else {
            // ✅ No migration - apply progress updates to CURRENT conversation
            if (progressUpdate !== null || objectiveUpdate !== null) {
              const progressUpdates: Partial<Conversation> = { updatedAt: Date.now() };
              
              if (progressUpdate !== null) {
                progressUpdates.gameProgress = progressUpdate;
                console.error(`🎮 [MainApp] ✅ Applying progress ${progressUpdate}% to CURRENT: ${activeConversation.title} (${activeConversation.id})`);
              }
              
              if (objectiveUpdate !== null) {
                progressUpdates.activeObjective = objectiveUpdate;
                console.error(`🎮 [MainApp] ✅ Applying objective to CURRENT: ${activeConversation.title}`);
              }
              
              // Update conversation with progress
              const updatedConv = { ...activeConversation, ...progressUpdates };
              
              setConversations(prev => ({
                ...prev,
                [activeConversation.id]: updatedConv
              }));
              setActiveConversation(updatedConv);
              
              // Persist to database
              ConversationService.updateConversation(activeConversation.id, progressUpdates)
                .catch(error => console.error('Failed to update progress:', error));
            }
            
            // ✅ No migration - apply subtab updates to CURRENT conversation
            if (pendingSubtabUpdates.length > 0) {
              console.error(`🎮 [MainApp] ✅ Applying ${pendingSubtabUpdates.length} subtab updates to CURRENT: ${activeConversation.title}`);
              gameTabService.updateSubTabsFromAIResponse(
                activeConversation.id,
                pendingSubtabUpdates
              ).then(() => {
                console.error('🎮 [MainApp] ✅ Successfully applied subtab updates');
                ConversationService.getConversations().then(refreshedConvs => {
                  const freshConversations = deepCloneConversations(refreshedConvs);
                  setConversations(freshConversations);
                  const refreshedConv = freshConversations[activeConversation.id];
                  if (refreshedConv) {
                    setActiveConversation(refreshedConv);
                  }
                });
              }).catch(error => {
                console.error('🎮 [MainApp] ❌ Failed to apply subtab updates:', error);
              });
            }
            
            // ✅ No migration - set prompts for current tab (Game Hub or existing game tab)
            if (processedSuggestions.length > 0) {
              console.log('✅ [MainApp] Setting AI-provided suggestions (no migration):', processedSuggestions);
              setSuggestedPrompts(processedSuggestions);
              // 🔄 Record shown prompts to prevent future repetition
              if (user?.authUserId) {
                const gameTitle = activeConversation.isGameHub ? null : (activeConversation.gameTitle ?? null);
                const promptsToRecord = processedSuggestions.map(p => ({
                  promptText: p,
                  promptType: 'suggested' as const,
                  gameTitle: gameTitle
                }));
                shownPromptsService.recordShownPrompts(user.authUserId, promptsToRecord)
                  .catch((err: unknown) => console.warn('[MainApp] Failed to record shown prompts:', err));
              }
            } else {
              const fallbackSuggestions = suggestedPromptsService.getFallbackSuggestions(activeConversation.id, activeConversation.isGameHub);
              setSuggestedPrompts(fallbackSuggestions);
            }
          }
        }
        // else: No GAME_ID tag in response, nothing to process for game tab creation
      }

    } catch (error) {
      console.error("Failed to get AI response:", error);
      
      // Check if it was aborted (user stopped the response)
      if (error instanceof Error && error.name === 'AbortError') {
        // Add a system message to indicate the response was stopped
        const stoppedMessage = {
          id: `msg_${Date.now() + 1}`,
          content: "*Response stopped by user*",
          role: 'assistant' as const,
          timestamp: Date.now(),
        };
        
        // Update state immediately
        setConversations(prev => {
          const updated = { ...prev };
          if (updated[activeConversation.id]) {
            updated[activeConversation.id] = {
              ...updated[activeConversation.id],
              messages: [...updated[activeConversation.id].messages, stoppedMessage],
              updatedAt: Date.now()
            };
            setActiveConversation(updated[activeConversation.id]);
          }
          return updated;
        });
        
        // Save to database
        await ConversationService.addMessage(activeConversation.id, stoppedMessage);
        return;
      }
      
      // Use error recovery service
      const recoveryAction = await errorRecoveryService.handleAIError(
        error as Error,
        {
          operation: 'handleSendMessage',
          conversationId: activeConversation.id,
          userId: user?.id,
          timestamp: Date.now(),
          retryCount: 0
        }
      );
      
      // Add error message to chat
      const errorMessage = {
        id: `msg_${Date.now() + 1}`,
        content: recoveryAction.message || "Sorry, I'm having trouble thinking right now. Please try again.",
        role: 'assistant' as const,
        timestamp: Date.now(),
      };
      
      // Optimized: Update state immediately
      setConversations(prev => {
        const updated = { ...prev };
        if (updated[activeConversation.id]) {
          updated[activeConversation.id] = {
            ...updated[activeConversation.id],
            messages: [...updated[activeConversation.id].messages, errorMessage],
            updatedAt: Date.now()
          };
          // Update activeConversation immediately so UI reflects the error message
          setActiveConversation(updated[activeConversation.id]);
        }
        return updated;
      });

      await ConversationService.addMessage(activeConversation.id, errorMessage);
      
      // Display user notification if needed
      if (recoveryAction.type === 'user_notification') {
        errorRecoveryService.displayError(recoveryAction.message || 'An error occurred', 'error');
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  // Update ref whenever handleSendMessage changes
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  }, [handleSendMessage]);

  // ✅ OFFLINE QUEUE: Flush queued messages when network is restored
  useEffect(() => {
    const handleNetworkRestored = async () => {
      console.log('🌐 [MainApp] Network restored - checking for queued messages...');
      
      try {
        const pendingMessages = await offlineQueueService.getPendingMessages();
        
        if (pendingMessages.length === 0) {
          console.log('✅ [MainApp] No queued messages to send');
          return;
        }
        
        console.log(`📤 [MainApp] Flushing ${pendingMessages.length} queued messages...`);
        toastService.info(`Sending ${pendingMessages.length} queued message(s)...`);
        
        // Process messages in order (sequential processing required for proper ordering)
        // eslint-disable-next-line no-await-in-loop
        for (const pending of pendingMessages) {
          try {
            // Wait a bit between messages to avoid rate limiting
            // eslint-disable-next-line no-await-in-loop
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Switch to the conversation if needed
            if (activeConversation?.id !== pending.conversationId) {
              console.log(`📝 [MainApp] Queued message for different conversation: ${pending.conversationId}`);
              // Just log for now - user may have changed conversations
            }
            
            // Send the message (only if we're in the right conversation)
            if (handleSendMessageRef.current && activeConversation?.id === pending.conversationId) {
              // Remove the pending message from state first (the one with "⏳ Queued" marker)
              setConversations(prev => {
                const updated = { ...prev };
                if (updated[pending.conversationId]) {
                  updated[pending.conversationId] = {
                    ...updated[pending.conversationId],
                    messages: updated[pending.conversationId].messages.filter(
                      m => !m.content.includes('⏳ Queued') || m.content.replace('\n\n_⏳ Queued - will send when online_', '') !== pending.content
                    ),
                    updatedAt: Date.now()
                  };
                }
                return updated;
              });
              
              // Re-send the actual message
              // eslint-disable-next-line no-await-in-loop
              await handleSendMessageRef.current(pending.content, pending.imageUrl);
              
              // Remove from queue after successful send
              // eslint-disable-next-line no-await-in-loop
              await offlineQueueService.removePendingMessage(pending.id);
              console.log(`✅ [MainApp] Sent queued message: ${pending.content.substring(0, 30)}...`);
            } else {
              console.log(`⏭️ [MainApp] Skipping queued message (different conversation): ${pending.conversationId}`);
              // Keep in queue for now - user might switch back
            }
          } catch (error) {
            console.error(`❌ [MainApp] Failed to send queued message:`, error);
            // Keep the message in queue for retry
          }
        }
        
        // Check how many remain
        const remaining = await offlineQueueService.getPendingMessages();
        if (remaining.length === 0) {
          toastService.success('All queued messages sent!');
        } else {
          toastService.info(`${remaining.length} message(s) still queued for other conversations`);
        }
      } catch (error) {
        console.error('❌ [MainApp] Failed to flush offline queue:', error);
      }
    };
    
    window.addEventListener('otakon:network-restored', handleNetworkRestored);
    
    return () => {
      window.removeEventListener('otakon:network-restored', handleNetworkRestored);
    };
  }, [activeConversation]);

  if (isInitializing && (!user || Object.keys(conversations).length === 0)) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-text-muted">{!user ? 'Loading...' : 'Initializing chat...'}</p>
        </div>
      </div>
    );
  }

  // If no user but we have initialization done, still show error or redirect
  if (!user && !isInitializing) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">User not found. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container h-full bg-background flex overflow-hidden">
      {/* Sidebar */}
      <ErrorBoundary fallback={
        <div className="w-64 bg-[#1C1C1C] p-4 border-r border-[#424242] flex items-center justify-center">
          <div className="text-center text-[#CFCFCF]">
            <p className="mb-2 text-2xl">⚠️</p>
            <p className="text-sm mb-2">Sidebar unavailable</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-3 py-1 bg-[#FF4D4D] rounded text-xs hover:bg-[#FF6B6B] transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      }>
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          conversations={conversations}
          activeConversation={activeConversation}
          onConversationSelect={handleConversationSelect}
          onDeleteConversation={handleDeleteConversation}
          onPinConversation={handlePinConversation}
          onUnpinConversation={handleUnpinConversation}
          onClearConversation={handleClearConversation}
          onAddGame={handleAddGame}
        />
      </ErrorBoundary>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="chat-header-fixed bg-surface backdrop-blur-sm border-b border-surface-light/20 px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden btn-icon p-3 text-text-muted hover:text-text-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <Logo 
              size="md" 
              bounce={false} 
              userTier={currentUser.tier} 
              isOnTrial={Boolean(currentUser.trialExpiresAt && currentUser.trialExpiresAt > Date.now())}
            />
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            <div className="mr-1 sm:mr-2">
              <CreditIndicator 
                user={currentUser} 
                onClick={handleCreditModalOpen}
              />
            </div>

            {/* AI Mode Toggle - Pro/Vanguard only */}
            {(currentUser.tier === 'pro' || currentUser.tier === 'vanguard_pro') && (
              <AIToggleButton
                isEnabled={aiModeEnabled}
                onToggle={handleAiModeToggle}
                isPro={true}
              />
            )}

            {/* Hands-Free Toggle - Pro/Vanguard only */}
            {(currentUser.tier === 'pro' || currentUser.tier === 'vanguard_pro') && (
              <HandsFreeToggle
                isHandsFree={isHandsFreeMode}
                onToggle={handleHandsFreeToggle}
              />
            )}
            
            <button
              onClick={handleConnectionModalOpen}
              className={`btn-icon p-3 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                connectionStatus === ConnectionStatus.CONNECTED 
                  ? 'text-green-400 hover:text-green-300' 
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title={connectionStatus === ConnectionStatus.CONNECTED ? 'PC Connected - Click to manage' : 'Connect to PC'}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01" />
              </svg>
            </button>
            
            <button
              ref={settingsButtonRef}
              onClick={handleSettingsContextMenu}
              className="btn-icon p-3 text-text-muted hover:text-text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
          </div>
        </header>

        {/* Chat Area - key forces remount when profile banner visibility changes */}
        {/* This ensures flex layout properly recalculates on Safari PWA */}
        <div 
          key={`chat-area-${showProfileSetupBanner ? 'with-banner' : 'no-banner'}`}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {/* Profile Setup Banner - Show if user hasn't set up profile */}
          {showProfileSetupBanner && onProfileSetupComplete && onProfileSetupDismiss && (
            <div className="flex-shrink-0 pt-3 sm:pt-4 lg:pt-6">
              <ErrorBoundary fallback={<div className="px-6 py-2"><p className="text-xs text-[#CFCFCF]">Profile banner unavailable</p></div>}>
                <ProfileSetupBanner
                  onComplete={onProfileSetupComplete}
                  onDismiss={onProfileSetupDismiss}
                />
              </ErrorBoundary>
            </div>
          )}

          {/* Google AdSense Banner - Always show for free users */}
          {currentUser.tier === 'free' && (
            <AdBanner />
          )}

          {/* Subtabs Generation Progress Banner - Show during tier upgrade */}
          {isGeneratingSubtabs && generatingSubtabsProgress && (
            <div className="mx-3 sm:mx-4 lg:mx-6 mb-3 flex-shrink-0">
              <div className="bg-gradient-to-r from-[#1C1C1C] to-[#252525] border border-[#FF4D4D]/30 rounded-xl px-4 py-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-[#FF4D4D] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        Generating Insights: {generatingSubtabsProgress.gameName}
                      </span>
                      <span className="text-xs text-[#A3A3A3] flex-shrink-0">
                        {generatingSubtabsProgress.current}/{generatingSubtabsProgress.total}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 bg-[#2E2E2E] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${(generatingSubtabsProgress.current / generatingSubtabsProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Game Progress Bar with Game Info Button - Show for game conversations (not Game Hub) */}
          {activeConversation && !activeConversation.isGameHub && activeConversation.gameTitle && (
            <div className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex-1">
                  <GameProgressBar 
                    progress={activeConversation.gameProgress || 0}
                    gameTitle={activeConversation.gameTitle}
                    className="px-3 sm:px-4"
                  />
                </div>
                {/* Game Info Button - Only show when IGDB data is available (desktop) */}
                {currentGameIGDBData && (
                  <button
                    onClick={() => setGameInfoModalOpen(true)}
                    className="hidden lg:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#E53A3A]/10 to-[#FF6B6B]/5 backdrop-blur-sm border border-[#E53A3A]/30 rounded-lg hover:border-[#E53A3A]/60 hover:from-[#E53A3A]/15 hover:to-[#FF6B6B]/10 transition-all duration-200 group"
                    title="View game information"
                  >
                    <svg 
                      className="w-4 h-4 text-[#E53A3A] group-hover:text-[#FF6B6B] transition-colors" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-medium text-[#E53A3A] group-hover:text-[#FF6B6B] transition-colors">
                      Game Info
                    </span>
                  </button>
                )}
                {/* Loading indicator for IGDB (desktop) */}
                {isLoadingIGDBData && (
                  <div className="hidden lg:flex items-center gap-2 px-3 py-2 text-xs text-[#A3A3A3]">
                    <div className="w-3 h-3 border border-[#FF4D4D] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat Thread Name - Show on mobile when sidebar is collapsed */}
          {/* z-20 ensures consistent stacking with other fixed elements, below SubTabs expanded panel (z-40) */}
          {activeConversation && (
            <div className="lg:hidden px-3 sm:px-4 mb-3 sm:mb-4 flex-shrink-0 relative z-20">
              <div className="flex items-center gap-2">
                {/* Thread name button */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="flex-1 bg-gradient-to-r from-surface/30 to-background/30 backdrop-blur-sm border border-surface-light/20 rounded-lg px-4 py-3 transition-all duration-200 hover:from-surface/40 hover:to-background/40 hover:border-surface-light/30 active:scale-[0.98]"
                >
                  <h2 className="text-sm sm:text-base font-semibold bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] bg-clip-text text-transparent text-center">
                    {activeConversation.title}
                  </h2>
                </button>
                {/* Game Info Button - Mobile (right of thread name) */}
                {!activeConversation.isGameHub && activeConversation.gameTitle && currentGameIGDBData && (
                  <button
                    onClick={() => setGameInfoModalOpen(true)}
                    className="flex-shrink-0 p-3 bg-gradient-to-r from-[#E53A3A]/10 to-[#FF6B6B]/5 backdrop-blur-sm border border-[#E53A3A]/30 rounded-lg hover:border-[#E53A3A]/60 hover:from-[#E53A3A]/15 hover:to-[#FF6B6B]/10 transition-all duration-200 group"
                    title="View game information"
                  >
                    <svg 
                      className="w-5 h-5 text-[#E53A3A] group-hover:text-[#FF6B6B] transition-colors" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          
            {/* Chat Interface - Takes remaining space */}
            <div className="flex-1 min-h-0">
              <ErrorBoundary fallback={<ChatErrorFallback />}>
                <ChatInterface
                  conversation={activeConversation}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  isPCConnected={connectionStatus === ConnectionStatus.CONNECTED}
                  onRequestConnect={handleConnectionModalOpen}
                  userTier={currentUser.tier}
                  onStop={handleStopAI}
                  isManualUploadMode={isManualUploadMode}
                  onToggleManualUploadMode={() => setIsManualUploadMode(!isManualUploadMode)}
                  suggestedPrompts={suggestedPrompts}
                  onSuggestedPromptClick={handleSuggestedPromptClick}
                  activeSession={session}
                  onToggleActiveSession={handleToggleActiveSession}
                  initialMessage={currentInputMessage}
                  onMessageChange={handleInputMessageChange}
                  queuedImage={queuedScreenshot}
                  onImageQueued={handleScreenshotQueued}
                  isSidebarOpen={sidebarOpen}
                  onDeleteQueuedMessage={handleDeleteQueuedMessage}
                  onEditMessage={handleEditMessage}
                  onFeedback={handleFeedback}
                  onModifySubtab={handleModifySubtab}
                  onDeleteSubtab={handleDeleteSubtab}
                />
              </ErrorBoundary>
            </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={currentUser}
      />

      {/* Credit Modal */}
      <CreditModal
        isOpen={creditModalOpen}
        onClose={handleCreditModalClose}
        onUpgrade={handleUpgrade}
        user={currentUser}
      />

      {/* Connection Modal */}
      <ConnectionModal
        isOpen={connectionModalOpen}
        onClose={handleConnectionModalClose}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onClearError={handleClearConnectionError}
        status={connectionStatus}
        error={connectionError}
        connectionCode={connectionCode}
        lastSuccessfulConnection={lastSuccessfulConnection}
        onShowConnectionSplash={() => setConnectionSplashOpen(true)}
      />

      {/* Connection Success Splash Screen */}
      <ConnectionSplashScreen
        isOpen={connectionSplashOpen}
        onClose={() => setConnectionSplashOpen(false)}
      />

      {/* Pro Upgrade Splash Screen */}
      <ProUpgradeSplashScreen
        isOpen={proUpgradeSplashOpen}
        onClose={() => setProUpgradeSplashOpen(false)}
        tierName={upgradedTier}
      />

      {/* Hands-Free Modal */}
      <HandsFreeModal
        isOpen={handsFreeModalOpen}
        onClose={handleHandsFreeModalClose}
        isHandsFree={isHandsFreeMode}
        onToggleHandsFree={handleToggleHandsFreeFromModal}
      />

      {/* Add Game Modal */}
      <AddGameModal
        isOpen={addGameModalOpen}
        onClose={() => setAddGameModalOpen(false)}
        onCreateGame={handleCreateGame}
        onCloseSidebar={() => setSidebarOpen(false)}
      />


      {/* Game Info Modal - IGDB Integration */}
      <GameInfoModal
        isOpen={gameInfoModalOpen}
        onClose={() => setGameInfoModalOpen(false)}
        gameData={currentGameIGDBData}
        gameName={activeConversation?.gameTitle || ''}
      />

      {/* Feedback Modal - AI Response Feedback */}
      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => {
          setFeedbackModalOpen(false);
          setFeedbackMessageId(null);
          setFeedbackOriginalResponse('');
        }}
        onSubmit={handleSubmitNegativeFeedback}
        onSubmitCorrection={handleSubmitCorrection}
        isSubmitting={isSubmittingFeedback}
        isAuthenticated={!!currentUser?.authUserId}
        originalResponse={feedbackOriginalResponse}
        gameTitle={activeConversation?.isGameHub ? null : activeConversation?.gameTitle}
      />

      {/* Settings Context Menu */}
      <SettingsContextMenu
        isOpen={settingsContextMenu.isOpen}
        position={settingsContextMenu.position}
        onClose={closeSettingsContextMenu}
        onOpenSettings={handleOpenSettings}
        onOpenGuide={handleOpenGuide}
        onLogout={handleLogout}
        userTier={currentUser.tier}
        buttonRef={settingsButtonRef}
        onTrialStart={async () => {
          // Refresh user data after trial starts
          await authService.refreshUser();
          const refreshedUser = authService.getCurrentUser();
          if (refreshedUser) {
            setUser(refreshedUser);
          }
        }}
        onUpgradeClick={() => {
          setCreditModalOpen(true);
          closeSettingsContextMenu();
        }}
      />

      {/* Welcome Screen / Guide */}
      {welcomeScreenOpen && (
        <WelcomeScreen
          onStartChat={() => setWelcomeScreenOpen(false)}
          onAddGame={handleAddGame}
        />
      )}
    </div>
  );
};

export default MainApp;
