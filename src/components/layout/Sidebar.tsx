import React, { useState, useRef } from 'react';
import { Conversations, Conversation } from '../../types';
import ContextMenu from '../ui/ContextMenu';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversations;
  activeConversation: Conversation | null;
  onConversationSelect: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onPinConversation?: (id: string) => void;
  onUnpinConversation?: (id: string) => void;
  onClearConversation?: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  activeConversation,
  onConversationSelect,
  onDeleteConversation,
  onPinConversation,
  onUnpinConversation,
  onClearConversation,
}) => {
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    conversationId: string | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    conversationId: null,
  });

  // Long press detection
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressDelay = 1500; // 1.5 seconds

  // Sort conversations: pinned first, then by creation date
  const conversationList = Object.values(conversations).sort((a, b) => {
    // Pinned conversations first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // Then by creation date (newest first)
    return b.createdAt - a.createdAt;
  });

  const handleContextMenu = (e: React.MouseEvent, conversationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      conversationId,
    });
  };

  const handleLongPressStart = (conversationId: string) => {
    longPressTimer.current = setTimeout(() => {
      setContextMenu({
        isOpen: true,
        position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        conversationId,
      });
    }, longPressDelay);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const closeContextMenu = () => {
    setContextMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
      conversationId: null,
    });
  };

  const handleDelete = () => {
    if (contextMenu.conversationId) {
      onDeleteConversation(contextMenu.conversationId);
    }
  };

  const handlePin = () => {
    if (contextMenu.conversationId && onPinConversation) {
      onPinConversation(contextMenu.conversationId);
    }
  };

  const handleUnpin = () => {
    if (contextMenu.conversationId && onUnpinConversation) {
      onUnpinConversation(contextMenu.conversationId);
    }
  };

  const handleClearConversation = () => {
    if (contextMenu.conversationId && onClearConversation) {
      onClearConversation(contextMenu.conversationId);
    }
  };

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


          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6 custom-scrollbar" style={{ minHeight: 0 }}>
            <div className="space-y-2 sm:space-y-3 pt-2">
              {conversationList.map((conversation) => {
                const isEverythingElse = conversation.title === 'Everything else';
                return (
                  <div
                    key={conversation.id}
                    className={`conversation-tab cursor-pointer transition-all duration-300 relative ${
                      activeConversation?.id === conversation.id
                        ? 'conversation-tab-active'
                        : ''
                    }`}
                    onClick={() => onConversationSelect(conversation.id)}
                    onContextMenu={(e) => handleContextMenu(e, conversation.id)}
                    onMouseDown={() => handleLongPressStart(conversation.id)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onTouchStart={() => handleLongPressStart(conversation.id)}
                    onTouchEnd={handleLongPressEnd}
                    style={{ zIndex: 1 }}
                  >
                    <div className="flex items-center justify-between p-4 min-h-[60px]">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-xs font-medium text-text-primary truncate">
                            {conversation.title}
                          </p>
                          {conversation.isPinned && (
                            <svg className="w-3 h-3 text-primary-dark flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          )}
                        </div>
                        <p className="text-xs text-text-muted mt-1">
                          {conversation.messages.length} messages
                      </p>
                      <p className="text-xs text-text-muted">
                        {new Date(conversation.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* Delete button - only show for non-Everything else conversations */}
                    {!isEverythingElse && (
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
                    )}
                  </div>
                </div>
                );
              })}
              
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

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        onDelete={handleDelete}
        onPin={handlePin}
        onUnpin={handleUnpin}
        onClearConversation={handleClearConversation}
        canDelete={contextMenu.conversationId ? conversations[contextMenu.conversationId]?.title !== 'Everything else' : true}
        canPin={contextMenu.conversationId ? conversations[contextMenu.conversationId]?.title !== 'Everything else' : true}
        isPinned={contextMenu.conversationId ? conversations[contextMenu.conversationId]?.isPinned : false}
        isEverythingElse={contextMenu.conversationId ? conversations[contextMenu.conversationId]?.title === 'Everything else' : false}
      />
    </>
  );
};

export default Sidebar;
