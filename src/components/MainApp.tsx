import React, { useState, useEffect } from 'react';
import { User, Conversation, Conversations } from '../types';
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
import Sidebar from './layout/Sidebar';
import ChatInterface from './features/ChatInterface';
import SettingsModal from './modals/SettingsModal';
import CreditModal from './modals/CreditModal';
import ConnectionModal from './modals/ConnectionModal';
import Logo from './ui/Logo';
import CreditIndicator from './ui/CreditIndicator';
import { LoadingSpinner } from './ui/LoadingSpinner';
import SettingsContextMenu from './ui/SettingsContextMenu';
import { ConnectionStatus } from '../types';
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
  onConnect?: (code: string) => void;
  onDisconnect?: () => void;
  onWebSocketMessage?: (data: any) => void;
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
  const [isManualUploadMode, setIsManualUploadMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [connectionCode, setConnectionCode] = useState<string | null>(null);
  const [lastSuccessfulConnection, setLastSuccessfulConnection] = useState<Date | null>(null);
  
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
  
  // Debug connection state
  console.log('🔍 [MainApp] Connection state:', {
    propConnectionStatus,
    connectionStatus,
    propConnectionError,
    connectionError
  });

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

  // Handle WebSocket messages for screenshot processing
  const handleWebSocketMessage = (data: any) => {
    console.log('🔗 [MainApp] Received WebSocket message:', data);
    
    if (data.type === 'screenshot' && data.dataUrl) {
      console.log('📸 Processing screenshot in MainApp:', data);
      
      if (isManualUploadMode) {
        // In manual mode, queue the image for review instead of auto-sending
        console.log('📸 Manual mode: Screenshot queued for review');
        // TODO: Implement image queue for manual review
        // For now, we'll still send it but this is where the queue logic would go
      }
      
      // Send the screenshot to the active conversation
      if (activeConversation) {
        handleSendMessage("", data.dataUrl);
      } else {
        console.warn('📸 No active conversation to send screenshot to');
      }
    }
  };

  // Expose the message handler to parent
  useEffect(() => {
    if (propOnWebSocketMessage) {
      propOnWebSocketMessage(handleWebSocketMessage);
    }
  }, [propOnWebSocketMessage, activeConversation]);

  useEffect(() => {
    const loadData = async (retryCount = 0) => {
      try {
        // Get user from AuthService instead of UserService
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          // Also sync to UserService for compatibility
          UserService.setCurrentUser(currentUser);
        }

        console.log('🔍 [MainApp] Loading conversations (attempt', retryCount + 1, ')');
        const userConversations = await ConversationService.getConversations();
        console.log('🔍 [MainApp] Loaded conversations:', userConversations);
        setConversations(userConversations);

        const active = await ConversationService.getActiveConversation();
        console.log('🔍 [MainApp] Active conversation:', active);
        setActiveConversation(active);

        // Auto-create a conversation if none exists
        if (!active && Object.keys(userConversations).length === 0) {
          console.log('🔍 [MainApp] No conversations found, creating new one...');
          
          // Check if there's already an "Everything else" conversation
          const existingEverythingElse = Object.values(userConversations).find(
            conv => conv.title === 'Everything else'
          );
          
          if (existingEverythingElse) {
            // Use the existing "Everything else" conversation
            console.log('🔍 [MainApp] Using existing "Everything else" conversation');
            await ConversationService.setActiveConversation(existingEverythingElse.id);
            setActiveConversation(existingEverythingElse);
          } else {
            // Create a new conversation
            console.log('🔍 [MainApp] Creating new conversation...');
            const newConversation = ConversationService.createConversation();
            await ConversationService.addConversation(newConversation);
            await ConversationService.setActiveConversation(newConversation.id);
            
            const updatedConversations = await ConversationService.getConversations();
            setConversations(updatedConversations);
            setActiveConversation(newConversation);
            console.log('🔍 [MainApp] New conversation created and set as active');
          }
        } else if (active) {
          console.log('🔍 [MainApp] Found active conversation:', active.title);
        }
        
        // Mark initialization as complete
        setIsInitializing(false);
      } catch (error) {
        console.error('🔍 [MainApp] Error loading data:', error);
        
        // Retry up to 3 times with exponential backoff
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          console.log(`🔍 [MainApp] Retrying in ${delay}ms...`);
          setTimeout(() => loadData(retryCount + 1), delay);
        } else {
          console.error('🔍 [MainApp] Failed to load data after 3 attempts');
          // Set a fallback state to prevent infinite loading
          setActiveConversation(null);
          setIsInitializing(false);
        }
      }
    };

    loadData();
  }, []);

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
    await ConversationService.setActiveConversation(id);
    const updatedConversations = await ConversationService.getConversations();
    setConversations(updatedConversations);
    setActiveConversation(updatedConversations[id]);
    setSidebarOpen(false);
  };

  const handleDeleteConversation = async (id: string) => {
    await ConversationService.deleteConversation(id);
    const updatedConversations = await ConversationService.getConversations();
    setConversations(updatedConversations);
    
    if (activeConversation?.id === id) {
      // If we're deleting the current active conversation, switch to "Everything Else" tab
      const everythingElseTab = updatedConversations['everything-else'];
      if (everythingElseTab) {
        setActiveConversation(everythingElseTab);
        // Also clear any active session since we're switching away from a game tab
        setActiveSession('', false);
      } else {
        // Fallback to any available conversation
        const newActive = await ConversationService.getActiveConversation();
        setActiveConversation(newActive);
      }
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

  const handleConnectionModalOpen = () => {
    setConnectionModalOpen(true);
  };

  const handleConnectionModalClose = () => {
    setConnectionModalOpen(false);
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

  // Handle active session toggle with session summaries
  const handleToggleActiveSession = async () => {
    if (!activeConversation) return;

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

  // Placeholder for game tab creation - will be implemented in Week 3
  const handleCreateGameTab = async (gameInfo: { gameTitle: string; genre?: string }) => {
    console.log('🎮 [MainApp] Game tab creation requested:', gameInfo);
    
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        console.error('User not authenticated for game tab creation');
        return;
      }

      // Generate unique conversation ID
      const conversationId = gameTabService.generateGameConversationId(gameInfo.gameTitle);
      
      // Check if game tab already exists
      const existingConversation = conversations[conversationId];
      if (existingConversation) {
        console.log('🎮 [MainApp] Game tab already exists, switching to it');
        setActiveConversation(existingConversation);
        return;
      }

      // Create new game tab
      const newGameTab = await gameTabService.createGameTab({
        gameTitle: gameInfo.gameTitle,
        genre: gameInfo.genre || 'Action RPG',
        conversationId,
        userId: user.id
      });

      // Add to conversations state
      setConversations(prev => ({
        ...prev,
        [conversationId]: newGameTab
      }));

      // Switch to the new game tab
      setActiveConversation(newGameTab);

      // Auto-switch to Playing mode for new game tabs
      setActiveSession(conversationId, true);

      console.log('🎮 [MainApp] Game tab created successfully:', newGameTab.title);
    } catch (error) {
      console.error('Failed to create game tab:', error);
      // You could show a user-friendly error message here
    }
  };

  const handleSendMessage = async (message: string, imageUrl?: string) => {
    if (!activeConversation || isLoading) return;

    console.log('📸 [MainApp] Sending message with image:', { message, hasImage: !!imageUrl, imageUrl: imageUrl?.substring(0, 50) + '...' });

    // Auto-switch to Playing mode for game help requests
    const isGameHelpRequest = imageUrl || 
      (message && (
        message.toLowerCase().includes('help') ||
        message.toLowerCase().includes('how to') ||
        message.toLowerCase().includes('what should') ||
        message.toLowerCase().includes('stuck') ||
        message.toLowerCase().includes('tutorial') ||
        message.toLowerCase().includes('guide')
      ));

    if (isGameHelpRequest && activeConversation.id !== 'everything-else') {
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
      }
      return updated;
    });

    // Add message to service
    await ConversationService.addMessage(activeConversation.id, newMessage);

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
        }
        return updated;
      });
      
      await ConversationService.addMessage(activeConversation.id, errorMessage);
      return;
    }

    // Increment usage count
    UserService.incrementUsage(queryType);
    
    // Also update in Supabase
    if (user?.authUserId) {
      try {
        const supabaseService = new SupabaseService();
        await supabaseService.incrementUsage(user.authUserId, queryType);
        console.log(`📊 [MainApp] Credit usage updated: ${queryType} query`);
        
        // Refresh user data to update credit indicator
        await refreshUserData();
      } catch (error) {
        console.warn('Failed to update usage in Supabase:', error);
      }
    }

    // Clear previous suggestions and start loading
    setSuggestedPrompts([]);
    setIsLoading(true);
    
    // Create abort controller for stop functionality
    const controller = new AbortController();
    setAbortController(controller);
    
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const response = await aiService.getChatResponse(
        activeConversation,
        user,
        message,
        session.isActive && session.currentGameId === activeConversation.id,
        !!imageUrl,
        imageUrl
      );

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
        }
        return updated;
      });

      // Add message to service
      await ConversationService.addMessage(activeConversation.id, aiMessage);

      // Process suggested prompts
      console.log('🔍 [MainApp] Raw suggestions from AI:', response.suggestions);
      const processedSuggestions = suggestedPromptsService.processAISuggestions(response.suggestions);
      console.log('🔍 [MainApp] Processed suggestions:', processedSuggestions);
      
      if (processedSuggestions.length > 0) {
        setSuggestedPrompts(processedSuggestions);
      } else {
        // Use fallback suggestions if AI doesn't provide any
        const fallbackSuggestions = suggestedPromptsService.getFallbackSuggestions(activeConversation.id);
        console.log('🔍 [MainApp] Using fallback suggestions:', fallbackSuggestions);
        setSuggestedPrompts(fallbackSuggestions);
      }

      // Handle game tab creation if game is identified
      if (response.otakonTags.has('GAME_ID')) {
        const gameInfo = {
          gameTitle: response.otakonTags.get('GAME_ID'),
          genre: response.otakonTags.get('GENRE') || 'Default'
        };
        await handleCreateGameTab(gameInfo);
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

  if (!user || isInitializing) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-text-muted">{!user ? 'Loading...' : 'Initializing chat...'}</p>
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
            <div className="mr-2 sm:mr-3 lg:mr-4">
              <CreditIndicator 
                user={user} 
                onClick={handleCreditModalOpen}
              />
            </div>
            
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
          {/* AdSense Placeholder Banner - Always show for free users */}
          {user.tier === 'free' && (
            <div className="px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-6 flex-shrink-0">
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
                userTier={user.tier}
                onStop={handleStopAI}
                isManualUploadMode={isManualUploadMode}
                onToggleManualUploadMode={() => setIsManualUploadMode(!isManualUploadMode)}
                suggestedPrompts={suggestedPrompts}
                onSuggestedPromptClick={handleSuggestedPromptClick}
                activeSession={session}
                onToggleActiveSession={handleToggleActiveSession}
              />
            </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
      />

      {/* Credit Modal */}
      <CreditModal
        isOpen={creditModalOpen}
        onClose={handleCreditModalClose}
        onUpgrade={handleUpgrade}
        user={user}
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

      {/* Settings Context Menu */}
      <SettingsContextMenu
        isOpen={settingsContextMenu.isOpen}
        position={settingsContextMenu.position}
        onClose={closeSettingsContextMenu}
        onOpenSettings={handleOpenSettings}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default MainApp;
