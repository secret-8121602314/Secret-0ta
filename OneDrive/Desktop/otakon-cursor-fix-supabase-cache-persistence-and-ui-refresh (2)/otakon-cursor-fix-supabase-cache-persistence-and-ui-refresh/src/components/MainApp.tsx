import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { tabManagementService } from '../services/tabManagementService';
import { ttsService } from '../services/ttsService';
import { toastService } from '../services/toastService';
import { MessageRoutingService } from '../services/messageRoutingService';
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
import { LoadingSpinner } from './ui/LoadingSpinner';
import SettingsContextMenu from './ui/SettingsContextMenu';
import ProfileSetupBanner from './ui/ProfileSetupBanner';
import WelcomeScreen from './welcome/WelcomeScreen';
import GameProgressBar from './features/GameProgressBar';
import { connect, disconnect } from '../services/websocketService';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onWebSocketMessage?: (_data: any) => void;
  showProfileSetupBanner?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onProfileSetupComplete?: (_profileData: any) => void;
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
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [connectionCode, setConnectionCode] = useState<string | null>(null);
  const [lastSuccessfulConnection, setLastSuccessfulConnection] = useState<Date | null>(null);
  
  // Hands-free mode state
  const [isHandsFreeMode, setIsHandsFreeMode] = useState(false);
  const [handsFreeModalOpen, setHandsFreeModalOpen] = useState(false);
  
  // Input preservation for tab switching
  const [currentInputMessage, setCurrentInputMessage] = useState<string>('');
  
  // ✅ NEW: Queued screenshot from WebSocket (manual mode)
  const [queuedScreenshot, setQueuedScreenshot] = useState<string | null>(null);
  
  // Welcome screen state
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
  
  // ✅ PERFORMANCE: Loading guards to prevent concurrent conversation loading
  const isLoadingConversationsRef = useRef(false);
  const hasLoadedConversationsRef = useRef(false);
  
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
        // Force new subtabs array reference if it exists
        subtabs: conversations[key].subtabs ? [...conversations[key].subtabs!] : undefined,
        // Force new messages array reference
        messages: [...conversations[key].messages]
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
      console.warn('Failed to initialize TTS service:', err);
    });
  }, []);

  // Persist auto-upload mode setting to localStorage
  useEffect(() => {
    localStorage.setItem('otakon_manual_upload_mode', String(isManualUploadMode));
  }, [isManualUploadMode]);

  // Handle WebSocket messages for screenshot processing
  const handleWebSocketMessage = (data: any) => {
    console.log('🔗 [MainApp] Received WebSocket message:', data);
    
    if (data.type === 'screenshot' && data.dataUrl) {
      console.log('📸 Processing screenshot in MainApp:', data);
      
      if (isManualUploadMode) {
        // ✅ FIXED: In manual mode, queue the image for ChatInterface (not text input!)
        console.log('📸 Manual mode: Screenshot queued for review');
        setQueuedScreenshot(data.dataUrl);
        toastService.info('Screenshot queued. Review and send when ready.');
        return; // Don't send automatically in manual mode
      }
      
      // Auto mode: Send the screenshot to the active conversation immediately
      if (activeConversation) {
        console.log('📸 Auto mode: Sending screenshot immediately');
        handleSendMessage("", data.dataUrl);
        // Clear the queued screenshot immediately after sending in auto mode
        setQueuedScreenshot(null);
      } else {
        console.warn('📸 No active conversation to send screenshot to');
        toastService.warning('No active conversation. Please select or create a conversation first.');
      }
    }
  };

  // Clear queued screenshot when it's been used
  const handleScreenshotQueued = () => {
    setQueuedScreenshot(null);
  };

  // Expose the message handler to parent
  useEffect(() => {
    if (propOnWebSocketMessage) {
      propOnWebSocketMessage(handleWebSocketMessage);
    }
  }, [propOnWebSocketMessage, activeConversation]);

  useEffect(() => {
    const loadData = async (retryCount = 0) => {
      // ✅ PERFORMANCE: Guard against concurrent loads
      if (isLoadingConversationsRef.current) {
        console.log('🔍 [MainApp] Already loading conversations, skipping...');
        return;
      }
      
      // ✅ PERFORMANCE: Skip if already loaded (unless retry)
      if (hasLoadedConversationsRef.current && retryCount === 0) {
        console.log('🔍 [MainApp] Conversations already loaded, skipping...');
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
          console.log('🔍 [MainApp] No user found, retrying in 500ms...');
          setTimeout(() => loadData(1), 500);
          return;
        }

        console.log('🔍 [MainApp] Loading conversations (attempt', retryCount + 1, ')');
        const userConversations = await ConversationService.getConversations();
        console.log('🔍 [MainApp] Loaded conversations:', userConversations);
        
        // Check if this is a new user and show welcome screen
        const isNewUser = Object.keys(userConversations).length === 0 || 
          (Object.keys(userConversations).length === 1 && userConversations[GAME_HUB_ID]);
        
        if (isNewUser && !localStorage.getItem('otakon_welcome_shown')) {
          setShowWelcomeScreen(true);
          localStorage.setItem('otakon_welcome_shown', 'true');
        }
        
        // Migration: Fix old "Everything else" or ensure Game Hub exists
        // Note: conversationService.getConversations() already handles the migration
        
        setConversations(userConversations);

        let active = await ConversationService.getActiveConversation();
        console.log('🔍 [MainApp] Active conversation from service:', active);

        // Handle all cases to ensure "Game Hub" is always available and active by default
        const currentGameHub = Object.values(userConversations).find(
          conv => conv.isGameHub || conv.title === 'Game Hub' || conv.id === 'game-hub'
        );

        // Case 1: No conversations at all - create "Game Hub" and set as active
        if (Object.keys(userConversations).length === 0) {
          console.log('🔍 [MainApp] No conversations found, creating "Game Hub"...');
          const newConversation = ConversationService.createConversation('Game Hub', 'game-hub');
          await ConversationService.addConversation(newConversation);
          await ConversationService.setActiveConversation(newConversation.id);
          
          const updatedConversations = await ConversationService.getConversations();
          setConversations(updatedConversations);
          active = updatedConversations['game-hub'];
          setActiveConversation(active);
          console.log('🔍 [MainApp] Created and activated "Game Hub" conversation');
        }
        // Case 2: "Game Hub" exists but nothing is active - set "Game Hub" as active
        else if (!active && currentGameHub) {
          console.log('🔍 [MainApp] No active conversation, setting "Game Hub" as active');
          await ConversationService.setActiveConversation(currentGameHub.id);
          const updatedConversations = await ConversationService.getConversations();
          setConversations(updatedConversations);
          active = updatedConversations[currentGameHub.id];
          setActiveConversation(active);
        }
        // Case 3: No "Game Hub" conversation but other conversations exist - create and activate it
        else if (!currentGameHub) {
          console.log('🔍 [MainApp] "Game Hub" missing, creating it...');
          const newConversation = ConversationService.createConversation('Game Hub', 'game-hub');
          await ConversationService.addConversation(newConversation);
          
          // If no active conversation, make "Game Hub" active
          if (!active) {
            await ConversationService.setActiveConversation(newConversation.id);
            const updatedConversations = await ConversationService.getConversations();
            setConversations(updatedConversations);
            active = updatedConversations['game-hub'];
            setActiveConversation(active);
            console.log('🔍 [MainApp] Created "Game Hub" and set as active');
          } else {
            // Otherwise, just add it but keep current active conversation
            const updatedConversations = await ConversationService.getConversations();
            setConversations(updatedConversations);
            setActiveConversation(active);
            console.log('🔍 [MainApp] Created "Game Hub" but kept existing active conversation:', active.title);
          }
        }
        // Case 4: Active conversation exists - restore it
        else if (active) {
          console.log('🔍 [MainApp] Restoring active conversation:', active.title, 'with ID:', active.id);
          setActiveConversation(active);
        }

        // Set initial suggested prompts for the active conversation
        if (active) {
          if (active.isGameHub || active.id === GAME_HUB_ID) {
            // For Game Hub tab, show news prompts if no messages
            if (!active.messages || active.messages.length === 0) {
              setSuggestedPrompts(newsPrompts);
            } else {
              const fallbackPrompts = suggestedPromptsService.getFallbackSuggestions(active.id, active.isGameHub);
              setSuggestedPrompts(fallbackPrompts);
            }
          } else {
            // For game tabs, show fallback prompts
            const fallbackPrompts = suggestedPromptsService.getFallbackSuggestions(active.id, active.isGameHub);
            setSuggestedPrompts(fallbackPrompts);
          }
        }
        
        // Mark initialization as complete
        setIsInitializing(false);
        
        // ✅ PERFORMANCE: Mark conversations as successfully loaded
        hasLoadedConversationsRef.current = true;
      } catch (error) {
        console.error('🔍 [MainApp] Error loading data:', error);
        
        // Retry up to 3 times with exponential backoff
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          console.log(`🔍 [MainApp] Retrying in ${delay}ms...`);
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

  // Safety timeout: Force initialization complete after 1 second to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isInitializing) {
        // Only force complete if we have conversations, even without user
        if (Object.keys(conversations).length > 0 || activeConversation) {
          console.warn('⚠️ [MainApp] Initialization timeout - but we have conversations, forcing completion');
          setIsInitializing(false);
        } else {
          // Try to get user and load conversations one more time
          console.warn('⚠️ [MainApp] Initialization timeout - retrying to load user and conversations');
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            UserService.setCurrentUser(currentUser);
            setIsInitializing(false);
          }
        }
      }
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [isInitializing, conversations, activeConversation]);

  // Poll for conversation updates when subtabs are loading
  useEffect(() => {
    const pollForSubtabUpdates = async () => {
      // Check if any conversation has loading subtabs
      const hasLoadingSubtabs = Object.values(conversations).some(conv => 
        conv.subtabs?.some(tab => tab.status === 'loading')
      );

      if (hasLoadingSubtabs) {
        console.log('🔄 [MainApp] Polling for subtab updates...');
        
        // ✅ FIX 1: Only update subtabs, don't overwrite entire conversations state
        // This prevents wiping out messages that were just migrated
        const updatedConversations = await ConversationService.getConversations();
        
        // ✅ FIX 2: Only update if subtabs actually changed (prevents unnecessary re-renders)
        setConversations(prevConversations => {
          const freshConversations = deepCloneConversations(updatedConversations);
          
          // Check if subtabs have actually been updated
          let hasChanges = false;
          Object.keys(freshConversations).forEach(convId => {
            const prev = prevConversations[convId];
            const curr = freshConversations[convId];
            
            if (prev && curr && prev.subtabs && curr.subtabs) {
              const prevLoadingCount = prev.subtabs.filter(t => t.status === 'loading').length;
              const currLoadingCount = curr.subtabs.filter(t => t.status === 'loading').length;
              
              if (prevLoadingCount !== currLoadingCount) {
                hasChanges = true;
              }
            }
          });
          
          // Only update if subtabs changed
          if (hasChanges) {
            console.log('🔄 [MainApp] Subtabs updated, refreshing state');
            
            // ✅ CRITICAL: Always update activeConversation when subtabs change
            // This ensures the user sees newly loaded content immediately without switching tabs
            if (activeConversation && freshConversations[activeConversation.id]) {
              console.log('🔄 [MainApp] Updating active conversation with fresh data (including subtab content)');
              setActiveConversation(freshConversations[activeConversation.id]);
            }
            
            return freshConversations;
          }
          
          console.log('🔄 [MainApp] No subtab changes, keeping current state');
          return prevConversations; // Keep existing state (preserves messages)
        });
      }
    };

    // ✅ FIX 3: Reduce polling frequency to 3 seconds (was 2 seconds)
    const interval = setInterval(pollForSubtabUpdates, 3000);
    
    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [conversations, activeConversation]);

  // Function to refresh user data (for credit updates)
  const refreshUserData = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        UserService.setCurrentUser(currentUser);
        console.log('📊 [MainApp] User data refreshed for credit update');
      }
    } catch (error) {
      console.warn('Failed to refresh user data:', error);
      toastService.warning('Failed to refresh user data. Please refresh the page if you experience issues.');
    }
  };

  // WebSocket message handling (only if using local websocket)
  useEffect(() => {
    if (propOnConnect) {
      // Using App.tsx connection state, no local websocket needed
      return;
    }


    const handleWebSocketError = (error: string) => {
      console.error('WebSocket error:', error);
    };

    const handleWebSocketOpen = () => {
      console.log('🔌 WebSocket connected');
    };

    const handleWebSocketClose = () => {
      console.log('🔌 WebSocket disconnected');
    };

    // Check if we have a stored connection code and try to reconnect
    const storedCode = localStorage.getItem('otakon_connection_code');
    if (storedCode) {
      setConnectionCode(storedCode);
      connect(storedCode, handleWebSocketOpen, handleWebSocketMessage, handleWebSocketError, handleWebSocketClose);
    }

    // Note: Removed automatic disconnect on unmount to maintain persistent connection
    // WebSocket should only disconnect when user explicitly disconnects or logs out
  }, [activeConversation, propOnConnect]);


  const handleConversationSelect = async (id: string) => {
    console.log('🔄 [MainApp] Switching to conversation:', id);
    
    // ✅ FIX: Use current conversations state instead of reloading from cache
    // This prevents losing newly created tabs that haven't been cached yet
    const targetConversation = conversations[id];
    if (!targetConversation) {
      console.warn('🔄 [MainApp] Conversation not found in state, reloading from service:', id);
      const updatedConversations = await ConversationService.getConversations();
      setConversations(updatedConversations);
      setActiveConversation(updatedConversations[id]);
    } else {
      // Update active conversation in service
      await ConversationService.setActiveConversation(id);
      setActiveConversation(targetConversation);
    }
    
    setSidebarOpen(false);

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
    
    // Delete the conversation
    await ConversationService.deleteConversation(id);
    
    // Get fresh conversations from service
    const updatedConversations = await ConversationService.getConversations();
    
    // Force a new object reference to ensure React detects the change
    const freshConversations = { ...updatedConversations };
    
    // Update conversations state immediately
    setConversations(freshConversations);
    
    if (wasActive) {
      // If we're deleting the current active conversation, switch to "Game Hub" tab
      const gameHubTab = freshConversations[GAME_HUB_ID] || freshConversations['game-hub'];
      if (gameHubTab) {
        // Persist the active conversation change
        await ConversationService.setActiveConversation(gameHubTab.id);
        setActiveConversation(gameHubTab);
        // Also clear any active session since we're switching away from a game tab
        setActiveSession('', false);
      } else {
        // Fallback to first available conversation
        const firstConversation = Object.values(freshConversations)[0] || null;
        if (firstConversation) {
          await ConversationService.setActiveConversation(firstConversation.id);
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
      alert('You can only pin up to 3 conversations. Please unpin another conversation first.');
      return;
    }

    await ConversationService.updateConversation(id, { 
      isPinned: true, 
      pinnedAt: Date.now() 
    });
    const updatedConversations = await ConversationService.getConversations();
    setConversations(updatedConversations);
  };

  const handleUnpinConversation = async (id: string) => {
    await ConversationService.updateConversation(id, { 
      isPinned: false, 
      pinnedAt: undefined 
    });
    const updatedConversations = await ConversationService.getConversations();
    setConversations(updatedConversations);
  };

  const handleClearConversation = async (id: string) => {
    await ConversationService.clearConversation(id);
    const updatedConversations = await ConversationService.getConversations();
    setConversations(updatedConversations);
    
    // If this was the active conversation, update it
    if (activeConversation?.id === id) {
      setActiveConversation(updatedConversations[id]);
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
    console.log('Upgrade clicked');
  };

  const handleStartChat = () => {
    console.log('🔍 [handleStartChat] Starting chat, current activeConversation:', activeConversation?.id);
    
    // Game Hub is guaranteed to exist from initial load - just activate it
    const currentGameHub = conversations[GAME_HUB_ID];
    console.log('🔍 [handleStartChat] Current Game Hub:', currentGameHub?.id);
    
    if (currentGameHub) {
      // Set Game Hub as active immediately (synchronous for instant UI)
      console.log('🔍 [handleStartChat] Activating Game Hub...');
      setActiveConversation(currentGameHub);
      
      // Update storage asynchronously in background
      ConversationService.setActiveConversation(GAME_HUB_ID);
      console.log('🔍 [handleStartChat] Game Hub activated');
    } else {
      // This should never happen, but as a fallback, try to find any Game Hub
      console.warn('⚠️ [handleStartChat] Game Hub not found in state, searching...');
      const anyGameHub = Object.values(conversations).find(
        conv => conv.isGameHub || conv.title === 'Game Hub' || conv.id === 'game-hub'
      );
      if (anyGameHub) {
        setActiveConversation(anyGameHub);
        ConversationService.setActiveConversation(anyGameHub.id);
      }
    }
    
    // Load suggested prompts for Game Hub (static news prompts)
    const newsPrompts = suggestedPromptsService.getStaticNewsPrompts();
    setSuggestedPrompts(newsPrompts);
    
    // Hide welcome screen immediately - activeConversation is already set
    setShowWelcomeScreen(false);
  };

  const handleOpenGuide = () => {
    setShowWelcomeScreen(true);
  };

  const handleAddGame = () => {
    // Close welcome screen if it's open
    setShowWelcomeScreen(false);
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
    
    // If disabling hands-free mode, stop any ongoing speech
    if (!newMode) {
      ttsService.cancel();
    }
  };

  // Settings context menu handlers
  const handleSettingsContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSettingsContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
    });
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
        (data: any) => {
          console.log('Connection message:', data);
        },
        (error: string) => {
          console.error('Connection error:', error);
        },
        () => {
          console.log('Connection closed');
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
  const handleSuggestedPromptClick = (prompt: string) => {
    handleSendMessage(prompt);
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
      console.log('📝 [MainApp] Creating Playing session summary for Planning mode');
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
      console.log('📝 [MainApp] Creating Planning session summary for Playing mode');
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
  const pollForSubtabUpdates = async (conversationId: string, attempts = 0, maxAttempts = 30) => {
    // Stop after 30 attempts (30 seconds)
    if (attempts >= maxAttempts) {
      console.log('🎮 [MainApp] ⏱️ Stopped polling for subtab updates after', attempts, 'attempts');
      return;
    }

    // Wait 1 second before checking
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // ✅ CRITICAL FIX: Skip cache to ensure we get fresh data after Supabase sync
      // When subtabs finish loading, gameTabService calls updateConversation which:
      // 1. Updates Supabase (async)
      // 2. Calls setConversations which syncs (async)
      // 3. If we use cache here, we might get OLD data before sync completes!
      const updatedConversations = await ConversationService.getConversations(true); // skipCache = true
      const targetConv = updatedConversations[conversationId];

      if (targetConv) {
        const stillLoading = targetConv.subtabs?.some(tab => tab.status === 'loading');
        
        if (!stillLoading) {
          // Subtabs have finished loading!
          console.log('🎮 [MainApp] ✅ Background subtabs loaded successfully');
          
          // Deep clone to ensure React detects changes
          const freshConversations = deepCloneConversations(updatedConversations);
          
          setConversations(freshConversations);
          
          // Update active conversation with new reference
          if (activeConversation?.id === conversationId) {
            console.log('🎮 [MainApp] ✅ Updating active conversation with loaded subtabs');
            setActiveConversation(freshConversations[conversationId]);
          }
          return;
        }

        // Still loading, continue polling
        console.log('🎮 [MainApp] 🔄 Subtabs still loading, polling again... (attempt', attempts + 1, ')');
        pollForSubtabUpdates(conversationId, attempts + 1, maxAttempts);
      }
    } catch (error) {
      console.error('Error polling for subtab updates:', error);
    }
  };

  // Placeholder for game tab creation - will be implemented in Week 3
  const handleCreateGameTab = async (gameInfo: { gameTitle: string; genre?: string; aiResponse?: any; isUnreleased?: boolean }): Promise<Conversation | null> => {
    console.log('🎮 [MainApp] Game tab creation requested:', gameInfo);
    
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
        console.log('🎮 [MainApp] Game tab already exists, returning it');
        return existingConversation;
      }

      // Create new game tab with AI response data
      const newGameTab = await gameTabService.createGameTab({
        gameTitle: gameInfo.gameTitle,
        genre: gameInfo.genre || 'Action RPG',
        conversationId,
        userId: user.id,
        aiResponse: gameInfo.aiResponse, // Pass AI response for subtab population
        isUnreleased: gameInfo.isUnreleased || false // Pass unreleased status
      });

      // Add to conversations state
      setConversations(prev => ({
        ...prev,
        [conversationId]: newGameTab
      }));

      console.log('🎮 [MainApp] Game tab created successfully:', newGameTab.title);
      toastService.success(`Game tab "${gameInfo.gameTitle}" created!`);
      return newGameTab;
    } catch (error) {
      console.error('Failed to create game tab:', error);
      toastService.error('Failed to create game tab. Please try again.');
      return null;
    }
  };

  const handleSendMessage = async (message: string, imageUrl?: string) => {
    if (!activeConversation || isLoading) {
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
        console.log('🎮 [MainApp] Auto-switching to Playing mode for game help request');
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
    await ConversationService.addMessage(activeConversation.id, newMessage);

    // Clear the input message after sending
    setCurrentInputMessage('');

    // Check if message contains a tab command (for Command Centre)
    if (tabManagementService.hasTabCommand(message)) {
      const command = tabManagementService.parseTabCommand(message, activeConversation);
      if (command) {
        console.log('📝 [MainApp] Tab command detected:', command);
        console.log('📝 [MainApp] Command description:', tabManagementService.describeCommand(command));
      }
    }

    // Track credit usage based on query type
    const hasImage = !!imageUrl;
    
    // Determine query type: image+text or image-only = image query, text-only = text query
    const queryType = hasImage ? 'image' : 'text';
    
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
      return;
    }

    // Increment usage count
    UserService.incrementUsage(queryType);
    
    // Update in Supabase (non-blocking - fire and forget)
    if (user?.authUserId) {
      const supabaseService = new SupabaseService();
      supabaseService.incrementUsage(user.authUserId, queryType)
        .then(() => {
          console.log(`📊 [MainApp] Credit usage updated: ${queryType} query`);
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

      // Apply context summarization before sending to AI (keeps context manageable)
      let conversationWithOptimizedContext = activeConversation;
      if (activeConversation.messages.length > 10) {
        const { contextSummarizationService } = await import('../services/contextSummarizationService');
        
        if (contextSummarizationService.shouldSummarize(activeConversation)) {
          console.log('📊 [MainApp] Applying context summarization...');
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
          
          console.log('✅ [MainApp] Context summarized successfully');
        }
      }

      const response = await aiService.getChatResponseWithStructure(
        conversationWithOptimizedContext,
        user,
        message,
        session.isActive && session.currentGameId === activeConversation.id,
        !!imageUrl,
        imageUrl,
        controller.signal
      );

      // Check if request was aborted before adding response to conversation
      if (controller.signal.aborted) {
        console.log('AI request was aborted, skipping response');
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
      await ConversationService.addMessage(activeConversation.id, aiMessage);

      // 🎤 Hands-Free Mode: Read AI response aloud if enabled
      if (isHandsFreeMode && response.content) {
        try {
          // Strip markdown and special formatting for better TTS
          const cleanText = response.content
            .replace(/[*_~`]/g, '') // Remove markdown formatting
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert [text](url) to text
            .replace(/#{1,6}\s/g, '') // Remove heading markers
            .replace(/```[\s\S]*?```/g, '') // Remove code blocks
            .replace(/`([^`]+)`/g, '$1') // Remove inline code markers
            .trim();
          
          if (cleanText) {
            await ttsService.speak(cleanText);
          }
        } catch (ttsError) {
          console.error('TTS Error:', ttsError);
          // Don't block the flow if TTS fails
        }
      }

      // ✅ DEFERRED: Process suggested prompts AFTER tab migration (moved to after tab switch)
      // This ensures prompts are based on the FINAL active tab, not the intermediate Game Hub state
      console.log('🔍 [MainApp] Raw suggestions from AI:', response.suggestions);
      const suggestionsToUse = response.followUpPrompts || response.suggestions;
      const processedSuggestions = suggestedPromptsService.processAISuggestions(suggestionsToUse);
      console.log('🔍 [MainApp] Processed suggestions:', processedSuggestions);

      // Handle progressive insight updates (if AI provided updates to existing subtabs)
      if (response.progressiveInsightUpdates && response.progressiveInsightUpdates.length > 0) {
        console.log('📝 [MainApp] AI provided progressive insight updates:', response.progressiveInsightUpdates.length);
        
        // Update subtabs in background (non-blocking)
        gameTabService.updateSubTabsFromAIResponse(
          activeConversation.id,
          response.progressiveInsightUpdates
        ).then(() => {
          console.log('📝 [MainApp] Subtabs updated successfully');
          
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
        
        console.log('📝 [MainApp] Processing tab management commands from AI');

        // Handle INSIGHT_UPDATE (update content of existing tab)
        if (response.otakonTags.has('OTAKON_INSIGHT_UPDATE')) {
          const updateData = response.otakonTags.get('OTAKON_INSIGHT_UPDATE');
          console.log('📝 [MainApp] INSIGHT_UPDATE:', updateData);
          
          if (typeof updateData === 'string') {
            try {
              const parsed = JSON.parse(updateData);
              if (parsed.id && parsed.content) {
                gameTabService.updateSubTabsFromAIResponse(
                  activeConversation.id,
                  [{ tabId: parsed.id, title: '', content: parsed.content }]
                ).then(() => {
                  console.log('📝 [MainApp] Tab updated via command:', parsed.id);
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
          console.log('📝 [MainApp] INSIGHT_MODIFY_PENDING:', modifyData);
          
          if (typeof modifyData === 'string') {
            try {
              const parsed = JSON.parse(modifyData);
              if (parsed.id && (parsed.title || parsed.content)) {
                gameTabService.updateSubTabsFromAIResponse(
                  activeConversation.id,
                  [{ tabId: parsed.id, title: parsed.title || '', content: parsed.content || '' }]
                ).then(() => {
                  console.log('📝 [MainApp] Tab modified via command:', parsed.id);
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
          console.log('📝 [MainApp] INSIGHT_DELETE_REQUEST:', deleteData);
          
          if (typeof deleteData === 'string') {
            try {
              const parsed = JSON.parse(deleteData);
              if (parsed.id) {
                // Remove the subtab from conversation
                const updatedSubtabs = activeConversation.subtabs?.filter(tab => tab.id !== parsed.id) || [];
                ConversationService.updateConversation(activeConversation.id, {
                  subtabs: updatedSubtabs
                }).then(() => {
                  console.log('📝 [MainApp] Tab deleted via command:', parsed.id);
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

        console.log('🎮 [MainApp] Game detection:', { 
          gameTitle, 
          confidence, 
          isUnreleased, 
          genre,
          currentTab: activeConversation.id,
          messageIds: { user: newMessage.id, ai: aiMessage.id }
        });

        // Create game tab if:
        // 1. Confidence is high (game is valid)
        // 2. Game can be unreleased OR released - both get tabs
        // Invalid games (low confidence, no GAME_ID) stay in Game Hub
        const shouldCreateTab = confidence === 'high';

        if (shouldCreateTab) {
          // ✅ Check if game tab already exists using service (not stale state)
          const targetConvId = gameTabService.generateGameConversationId(gameTitle);
          const existingGameTab = await ConversationService.getConversation(targetConvId);

          let targetConversationId: string;
          
          if (existingGameTab) {
            console.log('🎮 [MainApp] Found existing game tab:', existingGameTab.title);
            targetConversationId = existingGameTab.id;
          } else {
            console.log('🎮 [MainApp] Creating new game tab for:', gameTitle, isUnreleased ? '(unreleased)' : '(released)');
            const gameInfo = { gameTitle, genre, aiResponse: response, isUnreleased };
            const newGameTab = await handleCreateGameTab(gameInfo);
            targetConversationId = newGameTab?.id || '';
          }

          // Move the user message and AI response to the game tab if we're currently in "Game Hub"
          const shouldMigrateMessages = targetConversationId && activeConversation.isGameHub;
          console.log('🎮 [MainApp] Should migrate messages?', shouldMigrateMessages, {
            hasTargetConversation: !!targetConversationId,
            currentConversationId: activeConversation.id,
            isGameHub: activeConversation.isGameHub
          });
          
          if (shouldMigrateMessages) {
            console.log('🎮 [MainApp] ✅ Starting ATOMIC message migration from Game Hub to game tab');
            console.log('🎮 [MainApp] Message IDs to move:', { userMsgId: newMessage.id, aiMsgId: aiMessage.id });
            
            // ✅ Use atomic migration service to prevent race conditions
            await MessageRoutingService.migrateMessagesAtomic(
              [newMessage.id, aiMessage.id],
              activeConversation.id,
              targetConversationId
            );
            console.log('🎮 [MainApp] ✅ Atomic migration complete');
            
            // Update state to reflect the changes
            const updatedConversations = await ConversationService.getConversations();
            setConversations(updatedConversations);
            
            // Switch to the game tab
            const gameTab = updatedConversations[targetConversationId];
            if (gameTab) {
              console.log('🎮 [MainApp] ✅ Switching to game tab:', gameTab.title, 'with', gameTab.messages.length, 'messages');
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
                console.log('🔍 [MainApp] Using fallback suggestions for game tab:', fallbackSuggestions);
                setSuggestedPrompts(fallbackSuggestions);
              }
              
              // Poll for subtab updates if they're still loading
              const hasLoadingSubtabs = gameTab.subtabs?.some(tab => tab.status === 'loading');
              if (hasLoadingSubtabs) {
                console.log('🎮 [MainApp] 🔄 Starting background refresh for loading subtabs');
                pollForSubtabUpdates(targetConversationId);
              }
            }
          } else {
            console.log('🎮 [MainApp] ⚠️ Skipping message migration - not in Everything Else tab or no target');
            
            // ✅ No migration - set prompts for current tab (Game Hub or existing game tab)
            if (processedSuggestions.length > 0) {
              setSuggestedPrompts(processedSuggestions);
            } else {
              const fallbackSuggestions = suggestedPromptsService.getFallbackSuggestions(activeConversation.id, activeConversation.isGameHub);
              console.log('🔍 [MainApp] Using fallback suggestions:', fallbackSuggestions);
              setSuggestedPrompts(fallbackSuggestions);
            }
          }
        } else {
          console.log('🎮 [MainApp] Not creating game tab:', { 
            reason: !confidence ? 'no confidence' : confidence !== 'high' ? 'low confidence' : 'unreleased game'
          });
        }
      }

    } catch (error) {
      console.error("Failed to get AI response:", error);
      
      // Check if it was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('AI request was aborted by user');
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

  // Show welcome screen for new users or when guide is opened
  if (showWelcomeScreen) {
    return <WelcomeScreen onStartChat={handleStartChat} onAddGame={handleAddGame} />;
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
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar */}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="chat-header-fixed bg-gradient-to-r from-surface/50 to-background/50 backdrop-blur-sm border-b border-surface-light/20 px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6 flex items-center justify-between">
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

            <HandsFreeToggle
              isHandsFree={isHandsFreeMode}
              onToggle={handleHandsFreeToggle}
            />
            
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
              <ProfileSetupBanner
                onComplete={onProfileSetupComplete}
                onDismiss={onProfileSetupDismiss}
              />
            </div>
          )}

          {/* AdSense Placeholder Banner - Always show for free users */}
          {currentUser.tier === 'free' && (
            <div className="px-3 sm:px-4 lg:px-6 pt-0 sm:pt-1 flex-shrink-0">
              <div className="bg-gradient-to-r from-gray-100/10 to-gray-200/10 border border-gray-300/20 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex items-center justify-center h-16 sm:h-20 lg:h-24 bg-gray-100/20 rounded-lg border-2 border-dashed border-gray-300/40">
                  <div className="text-center">
                    <div className="text-gray-400 text-xs sm:text-sm font-medium mb-1">Advertisement</div>
                    <div className="text-gray-300 text-xs">AdSense Placeholder</div>
                  </div>
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
              <div className="bg-gradient-to-r from-surface/30 to-background/30 backdrop-blur-sm border border-surface-light/20 rounded-lg px-4 py-3">
                <h2 className="text-sm sm:text-base font-semibold bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] bg-clip-text text-transparent text-center">
                  {activeConversation.title}
                </h2>
              </div>
            </div>
          )}

          
            {/* Chat Interface - Takes remaining space */}
            <div className="flex-1 min-h-0">
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
    </div>
  );
};

export default MainApp;
