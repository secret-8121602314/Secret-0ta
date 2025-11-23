import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { User, Conversation, Conversations, newsPrompts, ConnectionStatus } from '../types';
import { GAME_HUB_ID } from '../constants';
import { ConversationService } from '../services/conversationService';
import { authService } from '../services/authService';
import { aiService } from '../services/aiService';
import { useActiveSession } from '../hooks/useActiveSession';
import { suggestedPromptsService } from '../services/suggestedPromptsService';
import { sessionSummaryService } from '../services/sessionSummaryService';
import { gameTabService } from '../services/gameTabService';
import { errorRecoveryService } from '../services/errorRecoveryService';
import { UserService } from '../services/userService';
import { SupabaseService } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { tabManagementService } from '../services/tabManagementService';
import { ttsService } from '../services/ttsService';
import { toastService } from '../services/toastService';
import { MessageRoutingService } from '../services/messageRoutingService';
import { sessionService } from '../services/sessionService';
import Sidebar from './layout/Sidebar';
import ChatInterface from './features/ChatInterface';
import SettingsModal from './modals/SettingsModal';
import CreditModal from './modals/CreditModal';
import ConnectionModal from './modals/ConnectionModal';
import HandsFreeModal from './modals/HandsFreeModal';
import AddGameModal from './modals/AddGameModal';
import Logo from './ui/Logo';
import CreditIndicator from './ui/CreditIndicator';
import HandsFreeToggle from './ui/HandsFreeToggle';
import AIToggleButton from './ui/AIToggleButton';
import { LoadingSpinner } from './ui/LoadingSpinner';
import SettingsContextMenu from './ui/SettingsContextMenu';
import ProfileSetupBanner from './ui/ProfileSetupBanner';
import GameProgressBar from './features/GameProgressBar';
import ErrorBoundary from './ErrorBoundary';
import WelcomeScreen from './welcome/WelcomeScreen';
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
  onConnect?: (_code: string) => void;
  onDisconnect?: () => void;
  onClearConnectionError?: () => void;
  onWebSocketMessage?: (_data: Record<string, unknown>) => void;
  showProfileSetupBanner?: boolean;
  onProfileSetupComplete?: (_profileData: Record<string, unknown>) => void;
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
  const [connectionCode, setConnectionCode] = useState<string | null>(null);
  const [lastSuccessfulConnection, setLastSuccessfulConnection] = useState<Date | null>(null);
  
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
  
  // Input preservation for tab switching
  const [currentInputMessage, setCurrentInputMessage] = useState<string>('');
  
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
  
  // ✅ PERFORMANCE: Memoize currentUser to prevent re-creating object on every render
  const currentUser = useMemo(() => user || { tier: 'free' } as User, [user]);
  
  // Add Game modal state
  const [addGameModalOpen, setAddGameModalOpen] = useState(false);
  
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
    ttsService.init().catch((err: Error) => {
          });
  }, []);

  // Persist auto-upload mode setting to localStorage
  useEffect(() => {
    localStorage.setItem('otakon_manual_upload_mode', String(isManualUploadMode));
  }, [isManualUploadMode]);

  // Handle WebSocket messages for screenshot processing
  const handleWebSocketMessage = useCallback((data: Record<string, unknown>) => {
    console.log('📸 [MainApp] handleWebSocketMessage called with type:', data.type);
    
    // Check if this is a connection confirmation from PC client
    if (data.type === 'partner_connected' || data.type === 'connection_alive' || data.type === 'connected' || data.status === 'connected') {
      // Get connection code from state or localStorage
      const codeToUse = connectionCode || localStorage.getItem('otakon_connection_code');
      // Update connection status in parent
      if (propOnConnect && codeToUse) {
        propOnConnect(codeToUse);
      } else if (!propOnConnect) {
      } else if (!codeToUse) {
      }
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
              setTimeout(() => {
                handleSendMessageRef.current("", dataUrl);
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
      // ✅ FIX: Validate screenshot data before processing
      const validation = validateScreenshotDataUrl(data.dataUrl);
      if (!validation.valid) {
        console.error('📸 [MainApp] Screenshot validation failed:', validation.error);
        toastService.error(`Screenshot validation failed: ${validation.error}`);
        return;
      }
      
      const sizeMB = getDataUrlSizeMB(data.dataUrl);
      console.log('📸 [MainApp] Processing screenshot:', {
        dataUrlLength: data.dataUrl.length,
        sizeMB: sizeMB,
        dataUrlPreview: data.dataUrl.substring(0, 50),
        isManualUploadMode,
        hasActiveConversation: !!activeConversation
      });
      
      if (isManualUploadMode) {
        // ✅ FIXED: In manual mode, queue the image for ChatInterface (not text input!)
                setQueuedScreenshot(data.dataUrl);
                toastService.info('Screenshot queued. Review and send when ready.');
        return; // Don't send automatically in manual mode
      }
      
      // Auto mode: Send the screenshot to the active conversation immediately
      if (activeConversation && handleSendMessageRef.current) {
                handleSendMessageRef.current("", data.dataUrl);
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

  useEffect(() => {
    const loadData = async (retryCount = 0) => {
      // ✅ PERFORMANCE: Guard against concurrent loads
      if (isLoadingConversationsRef.current) {
                return;
      }
      
      // ✅ PERFORMANCE: Skip if already loaded (unless retry)
      if (hasLoadedConversationsRef.current && retryCount === 0) {
                return;
      }
      
      isLoadingConversationsRef.current = true;
      
      try {
        // Get user from AuthService instead of UserService
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          // Also sync to UserService for compatibility
          UserService.setCurrentUser(currentUser);
        } else if (retryCount === 0) {
          // If no user on first attempt, wait a bit for auth state to settle after onboarding
                    setTimeout(() => loadData(1), 500);
          return;
        }

        console.log('🔍 [MainApp] Loading conversations (attempt', retryCount + 1, ')');
        
        // ✅ FIX: Ensure Game Hub exists first - this returns it directly (RLS workaround)
        const gameHubFromEnsure = await ConversationService.ensureGameHubExists();
                // ✅ CRITICAL: Use cached conversations instead of requerying Supabase
        // getConversations() bypasses cache and queries Supabase which fails due to RLS
        const userConversations = ConversationService.getCachedConversations() || {};
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
                    setIsInitializing(false);
        } else {
          console.error('🔍 [MainApp] ERROR: No active conversation after initialization!');
          // Force Game Hub as active if we somehow got here without one
          const gameHubConv = Object.values(userConversations).find(
            conv => conv.isGameHub || conv.title === 'Game Hub' || conv.id === 'game-hub'
          );
          if (gameHubConv) {
            await ConversationService.setActiveConversation(gameHubConv.id);
            const updatedConversations = await ConversationService.getConversations();
            setConversations(updatedConversations);
            setActiveConversation(updatedConversations[gameHubConv.id]);
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
  }, []);

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

  // ✅ PHASE 2 FIX: Real-time subscription for subtab updates
  useEffect(() => {
    if (!activeConversation?.id) return;
    
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
            if (payload.new && updated[activeConversation.id]) {
              updated[activeConversation.id] = {
                ...updated[activeConversation.id],
                ...payload.new,
                // Ensure subtabs array is properly handled
                subtabs: payload.new.subtabs || updated[activeConversation.id].subtabs || []
              };
              
                          }
            
            return updated;
          });
          
          // Update active conversation if it's the one that changed
          if (activeConversation.id === payload.new?.id) {
            setActiveConversation((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                ...payload.new,
                subtabs: payload.new.subtabs || prev.subtabs || []
              };
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
                  } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [MainApp] Real-time subscription error');
        }
      });
    
    // Cleanup subscription on unmount or when conversation changes
    return () => {
            subscription.unsubscribe();
    };
  }, [activeConversation?.id]);

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
    const handleWebSocketError = (error: string) => {
      console.error('WebSocket error:', error);
    };

    const handleWebSocketOpen = () => {
            // Save connection time for status tracking
      setLastSuccessfulConnection(new Date());
      // Update connection status in parent
      if (propOnConnect && connectionCode) {
        propOnConnect(connectionCode);
      }
    };

    const handleWebSocketClose = () => {
          };

    // Check if we have a stored connection code and try to reconnect
    const storedCode = localStorage.getItem('otakon_connection_code');
    if (storedCode) {
      console.log('🔗 [MainApp] Auto-reconnecting with stored code:', storedCode);
      setConnectionCode(storedCode);
      
      // Call connect with placeholder handlers
      connect(storedCode, () => {}, () => {}, () => {}, () => {});
      
      // ✅ CRITICAL: Immediately set handlers AFTER connect() to override and prevent stale closures
      console.log('🔗 [MainApp] Setting WebSocket handlers after auto-reconnect');
      setHandlers(
        handleWebSocketOpen,
        handleWebSocketMessage,
        handleWebSocketError,
        handleWebSocketClose
      );
    }

    // Note: Removed automatic disconnect on unmount to maintain persistent connection
    // WebSocket should only disconnect when user explicitly disconnects or logs out
  }, [activeConversation, propOnConnect, handleWebSocketMessage, connectionCode]);

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
    } else {
      // ✅ PERFORMANCE FIX: Update UI immediately without waiting for database sync
      console.error('🔄 [MainApp] ⚡ Instant UI update for conversation:', id);
      
      // Update local state first (instant UI feedback)
      setActiveConversation(targetConversation);
      setSidebarOpen(false);
      
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
    
    // Background delete with rollback on error
    ConversationService.deleteConversation(id).catch(error => {
      console.error('Failed to delete conversation:', error);
      
      // Rollback on error
      setConversations(prev => ({
        ...prev,
        [id]: deletedConversation
      }));
      
      toastService.error('Failed to delete conversation.');
      return;
    });
    
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
    // Just open the modal - don't toggle the state
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
    
    toastService.show(
      newMode ? 'AI mode enabled - Screenshots will be analyzed' : 'AI mode disabled - Screenshots will be stored only',
      'success'
    );
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
    setConnectionCode(code);
    
    // Store connection code for persistence
    localStorage.setItem('otakon_connection_code', code);
    localStorage.setItem('otakon_last_connection', new Date().toISOString());
    
    // Use prop handler if available, otherwise use local websocket
    if (propOnConnect) {
      propOnConnect(code);
    } else {
      // Fallback to local websocket connection
      connect(
        code,
        () => {
          setLastSuccessfulConnection(new Date());
          localStorage.setItem('otakonHasConnectedBefore', 'true');
        },
        (data: Record<string, unknown>) => {
                  },
        (error: string) => {
          console.error('Connection error:', error);
        },
        () => {
                  }
      );
    }
  };

  const handleDisconnect = () => {
    if (propOnDisconnect) {
      propOnDisconnect();
    } else {
      disconnect();
    }
    setConnectionCode(null);
    setLastSuccessfulConnection(null);
    localStorage.removeItem('otakon_connection_code');
    localStorage.removeItem('otakon_last_connection');
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
        
        await ConversationService.addMessage(activeConversation.id, summaryMessage);
      } catch (error) {
        console.error('Failed to create playing session summary:', error);
        toastService.error('Failed to create session summary.');
      }
    } else if (willBePlaying) {
      // Switching from Planning to Playing - create planning session summary
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
        
        await ConversationService.addMessage(activeConversation.id, summaryMessage);
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

  // Placeholder for game tab creation - will be implemented in Week 3
  const handleCreateGameTab = async (gameInfo: { gameTitle: string; genre?: string; aiResponse?: Record<string, unknown>; isUnreleased?: boolean }): Promise<Conversation | null> => {
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
                return existingConversation;
      }

      // Create new game tab with AI response data
      const newGameTab = await gameTabService.createGameTab({
        gameTitle: gameInfo.gameTitle,
        genre: gameInfo.genre || 'Action RPG',
        conversationId,
        userId: user.id,
        userTier: currentUser.tier, // Pass user tier for subtabs gating
        aiResponse: gameInfo.aiResponse, // Pass AI response for subtab population
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
    
    // Track user activity
    sessionService.trackActivity('send_message');
    
    // Prevent duplicate/concurrent sends
    if (!activeConversation || isLoading) {
      if (isLoading) {
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
          messages: [...updated[activeConversation.id].messages, newMessage],
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
      }
    }

    // Track credit usage based on query type
    const hasImage = !!imageUrl;
    
    // Determine query type: image+text or image-only = image query, text-only = text query
    const queryType = hasImage ? 'image' : 'text';
    
    // ✅ SOFT WARNING: Show warning at 90% usage
    if (user) {
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
    
    // Check if user can make the request
    if (!UserService.canMakeRequest(queryType)) {
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

    // Increment usage count
    UserService.incrementUsage(queryType);
    
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
      const isPro = user.tier === 'pro' || user.tier === 'vanguard_pro';
      
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
            content: `Screenshot saved to your gallery. AI analysis is currently disabled. Enable AI mode to get insights about your gameplay.`,
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
          // Extract only the Hint section for TTS - more precise matching
          const hintMatch = response.content.match(/Hint:\s*\n*\s*([\s\S]*?)(?=\n\s*(?:Lore:|Places of Interest:|Strategy:)|$)/i);
          let textToSpeak = '';
          
          if (hintMatch && hintMatch[1]) {
            // Found a hint section, extract only that part
            textToSpeak = hintMatch[1]
              .trim()
              // Stop at first occurrence of section headers (case insensitive)
              .split(/\n\s*(?:Lore:|Places of Interest:|Strategy:)/i)[0]
              .trim();
          } else if (!response.content.includes('Lore:') && !response.content.includes('Places of Interest:')) {
            // No structured sections detected, read the entire content
            textToSpeak = response.content;
          }
          
          if (textToSpeak) {
            // Strip markdown and special formatting for better TTS
            const cleanText = textToSpeak
              .replace(/[*_~`]/g, '') // Remove markdown formatting
              .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert [text](url) to text
              .replace(/#{1,6}\s/g, '') // Remove heading markers
              .replace(/```[\s\S]*?```/g, '') // Remove code blocks
              .replace(/`([^`]+)`/g, '$1') // Remove inline code markers
              .trim();
            
            if (cleanText) {
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
            // Extract hint for notification
            const hintMatch = response.content.match(/Hint:\s*\n*\s*([\s\S]*?)(?=\n\s*(?:Lore:|Places of Interest:|Strategy:)|$)/i);
            let notificationText = '';
            
            if (hintMatch && hintMatch[1]) {
              notificationText = hintMatch[1].trim().split(/\n\s*(?:Lore:|Places of Interest:|Strategy:)/i)[0].trim();
            } else if (!response.content.includes('Lore:') && !response.content.includes('Places of Interest:')) {
              notificationText = response.content;
            }
            
            if (notificationText) {
              // Clean markdown for notification
              const cleanText = notificationText
                .replace(/[*_~`]/g, '')
                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                .replace(/#{1,6}\s/g, '')
                .replace(/```[\s\S]*?```/g, '')
                .replace(/`([^`]+)`/g, '$1')
                .trim();
              
              if (cleanText) {
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
                        const suggestionsToUse = response.followUpPrompts || response.suggestions;
      console.log('🔍 [MainApp] suggestionsToUse (before processing):', suggestionsToUse);
      
      const processedSuggestions = suggestedPromptsService.processAISuggestions(suggestionsToUse);
      console.log('🔍 [MainApp] processedSuggestions (after processing):', processedSuggestions);
            // Handle state update tags (game progress, objectives, etc.)
      if (response.stateUpdateTags && response.stateUpdateTags.length > 0) {
        console.error('🎮 [MainApp] Processing state update tags:', response.stateUpdateTags);
        
        for (const tag of response.stateUpdateTags) {
          // Extract progress updates (e.g., "PROGRESS: 45")
          if (tag.startsWith('PROGRESS:')) {
            const progress = parseInt(tag.split(':')[1]?.trim() || '0', 10);
            if (!isNaN(progress) && progress >= 0 && progress <= 100) {
              console.error(`🎮 [MainApp] Updating game progress to ${progress}%`);
              
              // Update conversation with new progress
              const updatedConv = {
                ...activeConversation,
                gameProgress: progress,
                updatedAt: Date.now()
              };
              
              // Update local state immediately
              setConversations(prev => ({
                ...prev,
                [activeConversation.id]: updatedConv
              }));
              setActiveConversation(updatedConv);
              
              // Persist to storage (non-blocking)
              ConversationService.updateConversation(activeConversation.id, {
                gameProgress: progress,
                updatedAt: Date.now()
              }).catch(error => console.error('Failed to update game progress:', error));
            }
          }
          
          // Extract objective updates (e.g., "OBJECTIVE: Defeat the boss")
          if (tag.startsWith('OBJECTIVE:')) {
            const objective = tag.split(':')[1]?.trim();
            if (objective) {
              console.error(`🎮 [MainApp] Updating active objective: ${objective}`);
              
              // Update conversation with new objective
              const updatedConv = {
                ...activeConversation,
                activeObjective: objective,
                updatedAt: Date.now()
              };
              
              // Update local state immediately
              setConversations(prev => ({
                ...prev,
                [activeConversation.id]: updatedConv
              }));
              setActiveConversation(updatedConv);
              
              // Persist to storage (non-blocking)
              ConversationService.updateConversation(activeConversation.id, {
                activeObjective: objective,
                updatedAt: Date.now()
              }).catch(error => console.error('Failed to update objective:', error));
            }
          }
        }
      }

      // Handle progressive insight updates (if AI provided updates to existing subtabs)
      if (response.progressiveInsightUpdates && response.progressiveInsightUpdates.length > 0) {
                // Update subtabs in background (non-blocking)
        gameTabService.updateSubTabsFromAIResponse(
          activeConversation.id,
          response.progressiveInsightUpdates
        ).then(() => {
                    // Refresh conversations to show updated subtabs
          ConversationService.getConversations().then(updatedConversations => {
            const freshConversations = deepCloneConversations(updatedConversations);
            setConversations(freshConversations);
            
            // Update active conversation to reflect changes
            const refreshedConversation = freshConversations[activeConversation.id];
            if (refreshedConversation) {
              setActiveConversation(refreshedConversation);
            }
          });
        }).catch(error => {
          console.error('📝 [MainApp] Failed to update subtabs:', error);
        });
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
      if (response.otakonTags.has('GAME_ID')) {
        const gameTitle = response.otakonTags.get('GAME_ID');
        const confidence = response.otakonTags.get('CONFIDENCE');
        const isUnreleased = response.otakonTags.get('GAME_STATUS') === 'unreleased';
        const genre = response.otakonTags.get('GENRE') || 'Default';

                // Create game tab if:
        // 1. Confidence is high (game is valid)
        // 2. IS_FULLSCREEN is true (actual gameplay, not launcher/menu)
        // 3. Game can be unreleased OR released - both get tabs
        // Invalid games (low confidence, no GAME_ID, menus/launchers) stay in Game Hub
        const isFullscreen = response.otakonTags.get('IS_FULLSCREEN') === 'true';
        const shouldCreateTab = confidence === 'high' && isFullscreen;

        if (!shouldCreateTab) {
          console.log('⚠️ [MainApp] Tab creation blocked:', {
            gameTitle,
            confidence,
            isFullscreen,
            reason: !isFullscreen ? '❌ Pre-game screen detected (main menu/launcher) - staying in Game Hub' : 
                    confidence !== 'high' ? '❌ Low confidence detection' : 
                    '❌ Generic detection',
            hint: 'Take a gameplay or in-game menu screenshot (inventory, map, skills) to create a dedicated game tab'
          });
        }

        if (shouldCreateTab) {
          // ✅ Check if game tab already exists using service (not stale state)
          const targetConvId = gameTabService.generateGameConversationId(gameTitle);
          const existingGameTab = await ConversationService.getConversation(targetConvId);

          let targetConversationId: string;
          
          if (existingGameTab) {
                        targetConversationId = existingGameTab.id;
          } else {
            console.log('🎮 [MainApp] Creating new game tab for:', gameTitle, isUnreleased ? '(unreleased)' : '(released)');
            const gameInfo = { gameTitle, genre, aiResponse: response, isUnreleased };
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
                        // ✅ CRITICAL: Wait for conversation to fully persist before migrating
            // This ensures auth_user_id is set on the destination conversation
            await new Promise(resolve => setTimeout(resolve, 500));

            // ✅ Use atomic migration service to prevent race conditions
            // ✅ CRITICAL: Use database UUIDs instead of temporary client IDs
            await MessageRoutingService.migrateMessagesAtomic(
              [userMessageDbId, aiMessageDbId],
              activeConversation.id,
              targetConversationId
            );
                        // Update state to reflect the changes
            const updatedConversations = await ConversationService.getConversations();
            setConversations(updatedConversations);
            
            // Switch to the game tab
            const gameTab = updatedConversations[targetConversationId];
            if (gameTab) {
                            await ConversationService.setActiveConversation(targetConversationId);
              setActiveConversation(gameTab);
              // Auto-switch to Playing mode for new/existing game tabs
              setActiveSession(targetConversationId, true);
              // Close sidebar on mobile
              setSidebarOpen(false);
              
              // ✅ Set suggested prompts AFTER tab switch (based on FINAL active tab)
              if (processedSuggestions.length > 0) {
                                setSuggestedPrompts(processedSuggestions);
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
            }
          } else {
                        // ✅ No migration - set prompts for current tab (Game Hub or existing game tab)
            if (processedSuggestions.length > 0) {
              console.log('✅ [MainApp] Setting AI-provided suggestions (no migration):', processedSuggestions);
              setSuggestedPrompts(processedSuggestions);
            } else {
              const fallbackSuggestions = suggestedPromptsService.getFallbackSuggestions(activeConversation.id, activeConversation.isGameHub);
                            setSuggestedPrompts(fallbackSuggestions);
            }
          }
        } else {
                  }
      }

    } catch (error) {
      console.error("Failed to get AI response:", error);
      
      // Check if it was aborted
      if (error instanceof Error && error.name === 'AbortError') {
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

  if (isInitializing && (!user || Object.keys(conversations).length === 0)) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
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
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">User not found. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container h-screen bg-background flex overflow-hidden">
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
            
            <Logo size="sm" bounce={false} />
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

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
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
            <div className="px-3 sm:px-4 lg:px-6 pt-0 sm:pt-1 flex-shrink-0">
              <div className="bg-gradient-to-r from-gray-100/10 to-gray-200/10 border border-gray-300/20 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="h-16 sm:h-20 lg:h-24 overflow-hidden rounded-lg">
                  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4482938310886744"
                    crossOrigin="anonymous"></script>
                  <ins className="adsbygoogle"
                    style={{ display: 'block', height: '100%' }}
                    data-ad-client="ca-pub-4482938310886744"
                    data-ad-slot="6150844525"
                    data-ad-format="auto"
                    data-full-width-responsive="true"></ins>
                  <script dangerouslySetInnerHTML={{ __html: '(adsbygoogle = window.adsbygoogle || []).push({});' }} />
                </div>
              </div>
            </div>
          )}

          {/* Game Progress Bar - Show for game conversations (not Game Hub) */}
          {activeConversation && !activeConversation.isGameHub && activeConversation.gameTitle && (
            <div className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 flex-shrink-0">
              <GameProgressBar 
                progress={activeConversation.gameProgress || 0}
                className="px-3 sm:px-4"
              />
            </div>
          )}

          {/* Chat Thread Name - Show on mobile when sidebar is collapsed */}
          {activeConversation && (
            <div className="lg:hidden px-3 sm:px-4 mb-3 sm:mb-4 flex-shrink-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-full bg-gradient-to-r from-surface/30 to-background/30 backdrop-blur-sm border border-surface-light/20 rounded-lg px-4 py-3 transition-all duration-200 hover:from-surface/40 hover:to-background/40 hover:border-surface-light/30 active:scale-[0.98]"
              >
                <h2 className="text-sm sm:text-base font-semibold bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] bg-clip-text text-transparent text-center">
                  {activeConversation.title}
                </h2>
              </button>
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
        onTrialStart={async () => {
          // Refresh user data after trial starts
          await authService.refreshUser();
          const refreshedUser = authService.getCurrentUser();
          if (refreshedUser) {
            setUser(refreshedUser);
          }
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
