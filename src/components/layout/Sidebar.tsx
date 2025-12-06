import React, { useState, useRef } from 'react';
import { Conversations, Conversation, UserTier } from '../../types';
import ContextMenu from '../ui/ContextMenu';
import Logo from '../ui/Logo';

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
  onAddGame?: () => void;
  onOpenExplorer?: () => void;
  userTier?: UserTier;
  isOnTrial?: boolean;
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
  onAddGame,
  onOpenExplorer,
  userTier,
  isOnTrial = false,
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
  const longPressTarget = useRef<HTMLElement | null>(null);
  const longPressDelay = 1500; // 1.5 seconds

  // Sort conversations: Game Hub first, then pinned, then others (newest last)
  const conversationList = Object.values(conversations).sort((a, b) => {
    // "Game Hub" always at top
    const aIsGameHub = a.isGameHub || a.id === 'game-hub' || a.title === 'Game Hub';
    const bIsGameHub = b.isGameHub || b.id === 'game-hub' || b.title === 'Game Hub';
    
    if (aIsGameHub && !bIsGameHub) {
      return -1;
    }
    if (!aIsGameHub && bIsGameHub) {
      return 1;
    }
    
    // Pinned conversations next (sorted by pinned date, oldest pinned first)
    if (a.isPinned && !b.isPinned) {
      return -1;
    }
    if (!a.isPinned && b.isPinned) {
      return 1;
    }
    if (a.isPinned && b.isPinned) {
      return (a.pinnedAt || 0) - (b.pinnedAt || 0);
    }
    
    // Then by creation date (oldest first, newest last)
    return a.createdAt - b.createdAt;
  });

  const handleContextMenu = (e: React.MouseEvent, conversationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get the target element's bounding rect for fixed positioning
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // Position menu to the right of the tab, just below the top of the tab
    // Add some padding to prevent going off-screen
    const x = Math.min(rect.right + 8, window.innerWidth - 180); // 180 = approximate menu width + margin
    const y = Math.min(rect.top, window.innerHeight - 200); // 200 = approximate menu height + margin
    
    setContextMenu({
      isOpen: true,
      position: { x, y },
      conversationId,
    });
  };

  const handleLongPressStart = (e: React.MouseEvent | React.TouchEvent, conversationId: string) => {
    longPressTarget.current = e.currentTarget as HTMLElement;
    longPressTimer.current = setTimeout(() => {
      if (longPressTarget.current) {
        const rect = longPressTarget.current.getBoundingClientRect();
        const x = Math.min(rect.right + 8, window.innerWidth - 180);
        const y = Math.min(rect.top, window.innerHeight - 200);
        setContextMenu({
          isOpen: true,
          position: { x, y },
          conversationId,
        });
      }
    }, longPressDelay);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressTarget.current = null;
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
      closeContextMenu();
    }
  };

  const handlePin = () => {
    if (contextMenu.conversationId && onPinConversation) {
      onPinConversation(contextMenu.conversationId);
      closeContextMenu();
    }
  };

  const handleUnpin = () => {
    if (contextMenu.conversationId && onUnpinConversation) {
      onUnpinConversation(contextMenu.conversationId);
      closeContextMenu();
    }
  };

  const handleClearConversation = () => {
    if (contextMenu.conversationId && onClearConversation) {
      onClearConversation(contextMenu.conversationId);
      closeContextMenu();
    }
  };

  return (
    <>
      {/* Overlay - z-[55] ensures it's above SubTabs (z-50) but below Sidebar (z-60) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[55] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - z-[60] ensures it's above SubTabs expanded panel (z-50) when open on mobile */}
      <div className={`fixed inset-y-0 left-0 z-[60] w-72 sm:w-80 bg-gradient-to-b from-surface to-background border-r border-surface-light/20 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`} style={{ zIndex: 60 }}>
        <div className="flex flex-col h-full">
          {/* Header with Explorer Button - matches main header padding */}
          <div className="px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6 border-b border-surface-light/20 flex-shrink-0 relative" style={{ zIndex: 10 }}>
            <div className="flex items-center justify-between gap-2">
              {/* Explorer/HQ Button - Gaming-centric design */}
              {onOpenExplorer ? (
                <button
                  onClick={onOpenExplorer}
                  className="group flex-1 flex items-center gap-3 px-4 py-2.5 sm:px-5 sm:py-3 bg-gradient-to-r from-[#1A1A1A] to-[#141414] hover:from-[#E53A3A]/10 hover:to-[#D98C1F]/10 rounded-xl transition-all duration-300 border border-[#424242]/40 hover:border-[#E53A3A]/60 hover:shadow-[0_0_20px_rgba(229,58,58,0.15)]"
                >
                  {/* Tier-based Logo Icon */}
                  <Logo 
                    size="sm" 
                    userTier={userTier} 
                    isOnTrial={isOnTrial}
                    className="flex-shrink-0"
                  />
                  <div className="flex flex-col items-start">
                    <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-[#F5F5F5] to-[#CFCFCF] group-hover:from-[#FF6B6B] group-hover:to-[#FFAB40] bg-clip-text text-transparent transition-all duration-300">HQ</span>
                    <span className="text-[10px] sm:text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors">Command Center</span>
                  </div>
                </button>
              ) : (
                <h2 className="text-xl sm:text-2xl font-bold text-text-primary flex-1">Conversations</h2>
              )}
              <button
                onClick={onClose}
                className="lg:hidden btn-icon p-2.5 sm:p-3 text-text-muted hover:text-text-primary active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Add Game Button */}
          {onAddGame && (
            <div className="px-3 sm:px-4 lg:px-6 pt-4 pb-0">
              <button
                onClick={onAddGame}
                className="w-full px-4 py-3 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] md:hover:from-[#D42A2A] md:hover:to-[#C87A1A] text-white font-medium rounded-lg transition-all shadow-lg md:hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Game</span>
              </button>
            </div>
          )}

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-6 pt-4 pb-3 sm:pb-4 lg:pb-6" style={{ minHeight: 0, maxHeight: '100%' }}>
            <div className="space-y-4">
              {conversationList.map((conversation) => {
                const isGameHub = conversation.isGameHub || conversation.id === 'game-hub' || conversation.title === 'Game Hub';
                const isUnreleased = conversation.isUnreleased || false;
                const isRegularGame = !isGameHub && !isUnreleased && conversation.gameTitle;
                
                // Debug: Log cover URL status for game tabs
                if ((isRegularGame || isUnreleased) && !conversation.coverUrl) {
                  console.log('🖼️ [Sidebar] Missing coverUrl for:', conversation.title, 'gameTitle:', conversation.gameTitle, 'isUnreleased:', isUnreleased);
                }
                
                // Determine border color based on tab type
                let borderClass = '';
                let titleClass = 'text-text-primary';
                
                if (isGameHub) {
                  // Game Hub: Otagon brand gradient (red to orange)
                  borderClass = 'border-l-2 border-gradient-to-b from-[#FF4D4D] to-[#FFAB40]';
                  titleClass = 'bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] bg-clip-text text-transparent';
                } else if (isUnreleased) {
                  // Unreleased games: Yellow
                  borderClass = 'border-l-2 border-yellow-500';
                  titleClass = 'text-yellow-400';
                } else if (isRegularGame) {
                  // Regular games: Orange
                  borderClass = 'border-l-2 border-orange-500';
                  titleClass = 'text-orange-400';
                }
                // Non-game conversations: No border, default text color
                
                return (
                  <div
                    key={conversation.id}
                    className={`conversation-tab cursor-pointer transition-all duration-300 relative ${
                      activeConversation?.id === conversation.id
                        ? 'conversation-tab-active'
                        : ''
                    } ${borderClass}`}
                    onClick={() => onConversationSelect(conversation.id)}
                    onContextMenu={(e) => handleContextMenu(e, conversation.id)}
                    onMouseDown={(e) => handleLongPressStart(e, conversation.id)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onTouchStart={(e) => handleLongPressStart(e, conversation.id)}
                    onTouchEnd={handleLongPressEnd}
                    style={{ zIndex: 1 }}
                  >
                    <div className="flex p-3">
                      {/* Cover Art Thumbnail for game/unreleased tabs */}
                      {(isRegularGame || isUnreleased) && conversation.coverUrl && (
                        <div className="flex-shrink-0 mr-3">
                          <img
                            src={conversation.coverUrl}
                            alt={conversation.title}
                            className="w-14 h-[80px] object-cover rounded shadow-md"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className={`flex-1 min-w-0 flex flex-col ${(isRegularGame || isUnreleased) && conversation.coverUrl ? 'justify-center' : ''}`}>
                        <div className="flex items-center space-x-2">
                          <p className={`text-xs font-medium truncate ${titleClass}`}>
                            {conversation.title}
                          </p>
                          {isUnreleased && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 bg-yellow-500/20 border border-yellow-500/40 rounded text-[10px] text-yellow-400 font-medium">
                              UPCOMING
                            </span>
                          )}
                          {conversation.isPinned && (
                            <svg className="w-3 h-3 text-primary-dark flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          )}
                        </div>
                        {/* Progress bar for games with progress > 0 */}
                        {isRegularGame && conversation.gameProgress !== undefined && conversation.gameProgress > 0 && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <div className="flex-1 h-1.5 bg-surface-light/30 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-[#D98C1F] to-[#FFB366] rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, conversation.gameProgress)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-[#D98C1F] font-medium min-w-[28px] text-right">
                              {conversation.gameProgress}%
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-text-muted mt-1.5">
                          {conversation.messages.filter(m => m.role === 'assistant').length} messages
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {new Date(conversation.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {/* Delete button - only show for non-Game Hub conversations */}
                      {!isGameHub && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conversation.id);
                          }}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-2 text-text-muted hover:text-red-400 transition-all duration-200 rounded-lg hover:bg-red-500/10 active:scale-95 ml-2"
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
        canDelete={contextMenu.conversationId ? !conversations[contextMenu.conversationId]?.isGameHub : true}
        canPin={contextMenu.conversationId ? !conversations[contextMenu.conversationId]?.isGameHub : true}
        isPinned={contextMenu.conversationId ? conversations[contextMenu.conversationId]?.isPinned : false}
        isEverythingElse={contextMenu.conversationId ? conversations[contextMenu.conversationId]?.isGameHub === true : false}
      />
    </>
  );
};

export default Sidebar;
