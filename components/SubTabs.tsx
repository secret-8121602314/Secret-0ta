import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Conversation, UserTier, ConnectionStatus } from '../services/types';
import { useLongPress } from '../hooks/useLongPress';
// Dynamic import to avoid bundle conflicts
let wishlistService: any = null;
const getWishlistService = async () => {
  if (!wishlistService) {
    const module = await import('../services/wishlistService');
    wishlistService = module.wishlistService;
  }
  return wishlistService;
};

interface SubTabsProps {
    activeConversation: Conversation | null;
    activeSubView: string;
    onTabClick: (tabId: string) => void;
    userTier: string;
    onReorder: (conversationId: string, fromIndex: number, toIndex: number) => void;
    onContextMenu: (e: React.MouseEvent, tabId: string, insightTitle: string) => void;
    connectionStatus: ConnectionStatus;
}

const SubTabs: React.FC<SubTabsProps> = ({ 
    activeConversation, 
    activeSubView, 
    onTabClick, 
    userTier, 
    onReorder, 
    onContextMenu,
    connectionStatus
}) => {
    const draggedItem = useRef<number | null>(null);
    const [dragOverItem, setDragOverItem] = useState<number | null>(null);
    const [wishlistNotifications, setWishlistNotifications] = useState(0);
    const longPressEvents = useLongPress();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        let ticking = false;
        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY === 0) return;
            e.preventDefault();
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                container.scrollTo({
                    left: container.scrollLeft + e.deltaY,
                    behavior: 'smooth'
                });
                ticking = false;
            });
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, []);

    // Memoize computed values to prevent unnecessary recalculations
    const shouldShowSubtabs = useMemo(() => 
        activeConversation?.insights && activeConversation.id !== 'everything-else', 
        [activeConversation?.insights, activeConversation?.id]
    );

    const isEverythingElse = useMemo(() => 
        activeConversation?.id === 'everything-else', 
        [activeConversation?.id]
    );

    const shouldShowWishlistTab = useMemo(() => isEverythingElse, [isEverythingElse]);

    // Check for wishlist notifications
    useEffect(() => {
        if (shouldShowWishlistTab) {
            const checkNotifications = async () => {
                try {
                    const service = await getWishlistService();
                    const newlyReleased = service.getNewlyReleasedCount();
                    setWishlistNotifications(newlyReleased);
                } catch (error) {
                    console.error('Failed to check wishlist notifications:', error);
                }
            };
            
            checkNotifications();
        }
    }, [shouldShowWishlistTab]);

    // Memoize computed values to prevent unnecessary recalculations

    // Memoize computed values to prevent unnecessary recalculations

    // Memoize ordered insights to prevent recalculation on every render
    const orderedInsights = useMemo(() => {
        if (!shouldShowSubtabs || !activeConversation?.insights) return [];
        
        return (activeConversation.insightsOrder || Object.keys(activeConversation.insights))
            .map(id => activeConversation.insights?.[id])
            .filter((i): i is NonNullable<typeof i> => !!i)
            .sort((a, b) => {
                // Ensure Chat tab is always first
                if (a.id === 'chat') return -1;
                if (b.id === 'chat') return 1;
                
                // For other tabs, maintain the order from insightsOrder
                const orderA = activeConversation.insightsOrder?.indexOf(a.id) ?? -1;
                const orderB = activeConversation.insightsOrder?.indexOf(b.id) ?? -1;
                
                // If both are in insightsOrder, maintain that order
                if (orderA >= 0 && orderB >= 0) {
                    return orderA - orderB;
                }
                
                // If only one is in insightsOrder, prioritize the ordered one
                if (orderA >= 0) return -1;
                if (orderB >= 0) return 1;
                
                // Fallback to alphabetical order
                return a.title.localeCompare(b.title);
            });
    }, [shouldShowSubtabs, activeConversation?.insights, activeConversation?.insightsOrder]);

    // Memoize tabs array to prevent recreation on every render
    const tabs = useMemo(() => {
        if (shouldShowSubtabs) {
            return [
                { id: 'chat', title: 'Chat', isNew: false, status: 'loaded' },
                { id: 'otaku-diary', title: 'Otaku Diary', isNew: false, status: 'loaded' },
                ...(userTier !== 'free' ? [
                    { id: 'story-so-far', title: 'Story So Far', isNew: false, status: 'loaded' },
                    { id: 'lore', title: 'Lore', isNew: false, status: 'loaded' },
                    { id: 'build', title: 'Build', isNew: false, status: 'loaded' }
                ] : [])
            ];
        } else if (shouldShowWishlistTab) {
            return [
                { id: 'chat', title: 'Chat', isNew: false, status: 'loaded' },
                { id: 'wishlist', title: 'Wishlist', isNew: false, status: 'loaded', hasNotifications: wishlistNotifications > 0 }
            ];
        }
        return [];
    }, [shouldShowSubtabs, shouldShowWishlistTab, orderedInsights, userTier, wishlistNotifications]);



    // Memoize event handlers to prevent recreation on every render
    const handleDragStart = useCallback((e: React.DragEvent<HTMLButtonElement>, index: number) => {
        draggedItem.current = index;
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleDragEnter = useCallback((index: number) => {
        setDragOverItem(index);
    }, []);

    const handleDragEnd = useCallback(() => {
        if (draggedItem.current !== null && dragOverItem !== null && draggedItem.current !== dragOverItem && activeConversation) {
            onReorder(activeConversation.id, draggedItem.current, dragOverItem);
        }
        draggedItem.current = null;
        setDragOverItem(null);
    }, [dragOverItem, onReorder, activeConversation?.id]);

    const handleTabClick = useCallback((tabId: string) => {
        onTabClick(tabId);
    }, [onTabClick]);

    const handleContextMenu = useCallback((e: React.MouseEvent, tabId: string, insightTitle: string) => {
        onContextMenu(e, tabId, insightTitle);
    }, [onContextMenu]);

    return (
        <div className="w-full flex-shrink-0">
             <div 
                ref={containerRef}
                className="flex items-center gap-3 overflow-x-auto scroll-smooth"
                onDragLeave={() => setDragOverItem(null)}
            >
                {/* Tabs Container - Flexible width; parent will place screenshot button to the right */}
                <div className="flex items-center gap-3 overflow-x-auto scroll-smooth min-w-0 flex-1">
                    {(shouldShowSubtabs || shouldShowWishlistTab) && tabs.map((tab, index) => {
                        const isActive = activeSubView === tab.id;
                        const isLoading = tab.status === 'loading';
                        const isChatTab = tab.id === 'chat';
                        const isPlaceholder = (tab as any).isPlaceholder;
                        const hasError = tab.status === 'error';
                        const hasNotifications = (tab as any).hasNotifications;

                        return (
                            <button
                                key={tab.id}
                                draggable={!isChatTab}
                                onDragStart={(e) => handleDragStart(e, index - 1)} // Adjust index for chat tab
                                onDragEnter={() => handleDragEnter(index - 1)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => e.preventDefault()}
                                {...longPressEvents(isChatTab ? () => {} : (e: any) => handleContextMenu(e, tab.id, tab.title))}
                                onClick={() => handleTabClick(tab.id)}
                                disabled={isLoading}
                                className={`select-none relative flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border-2 flex items-center active:scale-95 shadow-lg
                                    ${isActive
                                        ? 'bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 border-[#E53A3A]/60 text-[#F5F5F5] shadow-[0_0_20px_rgba(229,61,61,0.3)] hover:shadow-[0_0_30px_rgba(229,61,61,0.5)]'
                                        : isLoading
                                        ? 'bg-gradient-to-r from-[#2E2E2E]/50 to-[#1C1C1C]/50 border-transparent text-[#A3A3A3] animate-pulse cursor-not-allowed'
                                        : hasError
                                        ? 'bg-gradient-to-r from-[#FF4D4D]/20 to-[#FF6B6B]/20 border-[#FF4D4D]/60 text-[#FF8080] hover:from-[#FF4D4D]/30 hover:to-[#FF6B6B]/30 hover:scale-105'
                                        : isPlaceholder
                                        ? 'bg-gradient-to-r from-[#FFAB40]/20 to-[#FFC107]/20 border-[#FFAB40]/60 text-[#FFCC80] hover:from-[#FFAB40]/30 hover:to-[#FFC107]/30 hover:scale-105'
                                        : 'bg-gradient-to-r from-[#2E2E2E]/80 to-[#1C1C1C]/80 border-[#424242]/60 text-[#CFCFCF] hover:from-[#424242]/80 hover:to-[#2E2E2E]/80 hover:scale-105 hover:shadow-xl'
                                    }
                                    ${dragOverItem === index -1 ? 'border-[#FFAB40] scale-110 shadow-[0_0_30px_rgba(251,191,36,0.5)]' : ''}
                                `}
                            >
                                <span className="whitespace-nowrap">{tab.title}</span>
                                {tab.isNew && !isActive && (
                                    <span className="absolute -top-1 -right-1 block w-3 h-3 bg-gradient-to-r from-[#FF4D4D] to-[#FF6B6B] rounded-full ring-2 ring-black shadow-lg" aria-label="New content"></span>
                                )}
                                {hasNotifications && (
                                    <span className="absolute -top-1 -right-1 block w-3 h-3 bg-gradient-to-r from-[#5CBB7B] to-[#4CAF50] rounded-full ring-2 ring-black shadow-lg animate-pulse" aria-label="Notifications"></span>
                                )}
                                {isPlaceholder && (
                                    <span className="ml-2 text-xs opacity-80">✨</span>
                                )}
                                {hasError && (
                                    <span className="ml-2 text-xs opacity-80">⚠️</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default React.memo(SubTabs);