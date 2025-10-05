import React, { useState, useEffect } from 'react';
import { User, Conversation } from '../types';
import { UserService } from '../services/userService';
import { ConversationService } from '../services/conversationService';
import { authService } from '../services/authService';
import Sidebar from './layout/Sidebar';
import ChatInterface from './features/ChatInterface';
import SettingsModal from './modals/SettingsModal';
import CreditModal from './modals/CreditModal';
import ConnectionModal from './modals/ConnectionModal';
import Logo from './ui/Logo';
import CreditIndicator from './ui/CreditIndicator';
import { LoadingSpinner } from './ui/LoadingSpinner';
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
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState({});
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [connectionCode, setConnectionCode] = useState<string | null>(null);
  const [lastSuccessfulConnection, setLastSuccessfulConnection] = useState<Date | null>(null);
  
  // Use props for connection state, fallback to local state if not provided
  const connectionStatus = propConnectionStatus ?? ConnectionStatus.DISCONNECTED;
  const connectionError = propConnectionError ?? null;

  useEffect(() => {
    const loadData = async () => {
      // Get user from AuthService instead of UserService
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        // Also sync to UserService for compatibility
        UserService.setCurrentUser(currentUser);
      }

      const userConversations = await ConversationService.getConversations();
      console.log('🔍 [MainApp] Loaded conversations:', userConversations);
      setConversations(userConversations);

      const active = await ConversationService.getActiveConversation();
      console.log('🔍 [MainApp] Active conversation:', active);
      setActiveConversation(active);

      // Auto-create a conversation if none exists
      if (!active && Object.keys(userConversations).length === 0) {
        const newConversation = ConversationService.createConversation();
        await ConversationService.addConversation(newConversation);
        await ConversationService.setActiveConversation(newConversation.id);
        
        const updatedConversations = await ConversationService.getConversations();
        setConversations(updatedConversations);
        setActiveConversation(newConversation);
      }
    };

    loadData();
  }, []);

  // WebSocket message handling (only if using local websocket)
  useEffect(() => {
    if (propOnConnect) {
      // Using App.tsx connection state, no local websocket needed
      return;
    }

    const handleWebSocketMessage = (data: any) => {
      console.log('📨 WebSocket message received:', data);
      
      if (data.type === 'screenshot') {
        // Handle screenshot received from PC client
        if (data.imageData && activeConversation) {
          // Add screenshot to current conversation
          const screenshotMessage = {
            id: `msg_${Date.now()}`,
            content: data.text || 'Screenshot captured',
            role: 'user' as const,
            timestamp: Date.now(),
            imageUrl: data.imageData, // Base64 image data
          };
          
          ConversationService.addMessage(activeConversation.id, screenshotMessage);
          setConversations(ConversationService.getConversations());
          
          // If in automatic mode, send to AI immediately
          if (data.processImmediate !== false) {
            // TODO: Send to AI for processing
            console.log('🤖 Auto-processing screenshot with AI');
          }
        }
      }
    };

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

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [activeConversation, propOnConnect]);

  const handleNewConversation = async () => {
    const newConversation = ConversationService.createConversation();
    await ConversationService.addConversation(newConversation);
    await ConversationService.setActiveConversation(newConversation.id);
    
    const updatedConversations = await ConversationService.getConversations();
    setConversations(updatedConversations);
    setActiveConversation(newConversation);
    setSidebarOpen(false);
  };

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
      const newActive = await ConversationService.getActiveConversation();
      setActiveConversation(newActive);
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

  const handleConnect = (code: string) => {
    setConnectionCode(code);
    
    // Store connection code for persistence
    localStorage.setItem('otakon_connection_code', code);
    
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
  };

  const handleSendMessage = async (message: string, imageUrl?: string) => {
    if (!activeConversation) return;

    const newMessage = {
      id: `msg_${Date.now()}`,
      content: message,
      role: 'user' as const,
      timestamp: Date.now(),
      imageUrl,
    };

    ConversationService.addMessage(activeConversation.id, newMessage);
    setConversations(ConversationService.getConversations());

    // Simulate AI response
    setIsLoading(true);
    setTimeout(() => {
      const aiMessage = {
        id: `msg_${Date.now() + 1}`,
        content: `I received your message: "${message}". This is a simulated AI response. In the real implementation, this would connect to your AI service.`,
        role: 'assistant' as const,
        timestamp: Date.now(),
      };

      ConversationService.addMessage(activeConversation.id, aiMessage);
      setConversations(ConversationService.getConversations());
      setIsLoading(false);
    }, 2000);
  };

  if (!user) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-text-muted">Loading...</p>
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
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="chat-header-fixed bg-gradient-to-r from-surface/50 to-background/50 backdrop-blur-sm border-b border-surface-light/20 px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden btn-icon p-3 text-text-muted hover:text-text-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-3">
              <Logo size="sm" bounce={false} />
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-text-primary">Otagon</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            <CreditIndicator 
              user={user} 
              onClick={handleCreditModalOpen}
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
              </svg>
            </button>
            
            <button
              onClick={() => setSettingsOpen(true)}
              className="btn-icon p-3 text-text-muted hover:text-text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
            <button
              onClick={onLogout}
              className="btn-icon p-3 text-text-muted hover:text-red-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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

          
            {/* Chat Interface - Takes remaining space */}
            <div className="flex-1 min-h-0">
              <ChatInterface
                conversation={activeConversation}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                isPCConnected={connectionStatus === ConnectionStatus.CONNECTED}
                onRequestConnect={handleConnectionModalOpen}
                userTier={user.tier}
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
    </div>
  );
};

export default MainApp;
