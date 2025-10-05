import React from 'react';
import { Conversations, Conversation } from '../../types';
import Button from '../ui/Button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversations;
  activeConversation: Conversation | null;
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  activeConversation,
  onConversationSelect,
  onNewConversation,
  onDeleteConversation,
}) => {
  const conversationList = Object.values(conversations).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-gradient-to-b from-surface to-background border-r border-surface-light/20 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`} style={{ zIndex: 50 }}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-surface-light/20 flex-shrink-0 relative" style={{ zIndex: 10 }}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Conversations</h2>
              <button
                onClick={onClose}
                className="lg:hidden btn-icon p-3 text-text-muted hover:text-text-primary active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-4 sm:p-6 flex-shrink-0 relative" style={{ zIndex: 10 }}>
            <Button
              onClick={onNewConversation}
              variant="primary"
              className="w-full btn-primary-enhanced text-sm sm:text-base"
            >
              + Everything else
            </Button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6 custom-scrollbar" style={{ minHeight: 0 }}>
            <div className="space-y-2 sm:space-y-3 pt-2">
              {conversationList.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`conversation-tab cursor-pointer transition-all duration-300 relative ${
                    activeConversation?.id === conversation.id
                      ? 'conversation-tab-active'
                      : ''
                  }`}
                  onClick={() => onConversationSelect(conversation.id)}
                  style={{ zIndex: 1 }}
                >
                  <div className="flex items-center justify-between p-4 min-h-[60px]">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">
                        {conversation.title}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        {conversation.messages.length} messages
                      </p>
                      <p className="text-xs text-text-muted">
                        {new Date(conversation.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conversation.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-3 text-text-muted hover:text-red-400 transition-all duration-200 rounded-lg hover:bg-red-500/10 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              
              {conversationList.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-text-muted text-lg">No conversations yet</p>
                  <p className="text-sm text-text-muted mt-2">Create your first conversation to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
