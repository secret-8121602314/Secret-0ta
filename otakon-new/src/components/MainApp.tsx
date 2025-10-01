import React, { useState, useEffect } from 'react';
import { User, Conversation, UserTier } from '../types';
import { UserService } from '../services/userService';
import { ConversationService } from '../services/conversationService';
import { authService } from '../services/authService';
import Sidebar from './layout/Sidebar';
import ChatInterface from './features/ChatInterface';
import SettingsModal from './modals/SettingsModal';
import TrialBanner from './trial/TrialBanner';
import Button from './ui/Button';
import Logo from './ui/Logo';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface MainAppProps {
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenAbout?: () => void;
  onOpenPrivacy?: () => void;
  onOpenRefund?: () => void;
  onOpenContact?: () => void;
  onOpenTerms?: () => void;
}

const MainApp: React.FC<MainAppProps> = ({
  onLogout,
  onOpenSettings: _onOpenSettings,
  onOpenAbout: _onOpenAbout,
  onOpenPrivacy: _onOpenPrivacy,
  onOpenRefund: _onOpenRefund,
  onOpenContact: _onOpenContact,
  onOpenTerms: _onOpenTerms,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState({});
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    // Get user from AuthService instead of UserService
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      // Also sync to UserService for compatibility
      UserService.setCurrentUser(currentUser);
    }

    const userConversations = ConversationService.getConversations();
    setConversations(userConversations);

    const active = ConversationService.getActiveConversation();
    setActiveConversation(active);
  }, []);

  const handleNewConversation = () => {
    const newConversation = ConversationService.createConversation();
    ConversationService.addConversation(newConversation);
    ConversationService.setActiveConversation(newConversation.id);
    
    setConversations(ConversationService.getConversations());
    setActiveConversation(newConversation);
    setSidebarOpen(false);
  };

  const handleConversationSelect = (id: string) => {
    ConversationService.setActiveConversation(id);
    const updatedConversations = ConversationService.getConversations();
    setConversations(updatedConversations);
    setActiveConversation(updatedConversations[id]);
    setSidebarOpen(false);
  };

  const handleDeleteConversation = (id: string) => {
    ConversationService.deleteConversation(id);
    const updatedConversations = ConversationService.getConversations();
    setConversations(updatedConversations);
    
    if (activeConversation?.id === id) {
      const newActive = ConversationService.getActiveConversation();
      setActiveConversation(newActive);
    }
  };

  const handleTierChange = (newTier: UserTier) => {
    if (user) {
      const updatedUser = { ...user, tier: newTier };
      setUser(updatedUser);
      UserService.setCurrentUser(updatedUser);
    }
  };

  const handleTrialStart = () => {
    // Refresh user data to reflect trial status
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      // Also sync to UserService for compatibility
      UserService.setCurrentUser(currentUser);
    }
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
        <header className="chat-header-fixed bg-gradient-to-r from-surface/50 to-background/50 backdrop-blur-sm border-b border-surface-light/20 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden btn-icon p-3 text-text-muted hover:text-text-primary"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-3">
              <Logo size="sm" />
              <span className="text-2xl font-bold text-text-primary">Otagon</span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-sm text-text-muted bg-surface/30 px-4 py-2 rounded-xl">
              {user.tier.toUpperCase()} • {user.usage.textCount}/{user.usage.textLimit} messages
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSettingsOpen(true)}
                className="btn-icon p-3 text-text-muted hover:text-text-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              <button
                onClick={onLogout}
                className="btn-icon p-3 text-text-muted hover:text-red-400 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1">
          {/* Trial Banner */}
          <div className="px-6 pt-6">
            <TrialBanner
              userTier={user.tier}
              onTrialStart={handleTrialStart}
            />
          </div>
          
          {activeConversation ? (
            <ChatInterface
              conversation={activeConversation}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Logo size="lg" className="mx-auto mb-8 opacity-50" />
                <h2 className="text-4xl font-bold text-text-primary mb-4">
                  Welcome to Otagon
                </h2>
                <p className="text-xl text-text-muted mb-8 max-w-md mx-auto">
                  Start a new conversation to begin your gaming adventure
                </p>
                <Button onClick={handleNewConversation} variant="primary" className="btn-primary-enhanced">
                  Start New Chat
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
        onTierChange={handleTierChange}
      />
    </div>
  );
};

export default MainApp;
