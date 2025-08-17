import React, { useRef, useState, useEffect } from 'react';
import { Conversation, UserTier } from '../services/types';
import { useLongPress } from '../hooks/useLongPress';

interface SubTabsProps {
    activeConversation: Conversation | null;
    activeSubView: string;
    onTabClick: (tabId: string) => void;
    userTier: string;
    onReorder: (conversationId: string, fromIndex: number, toIndex: number) => void;
    onContextMenu: (e: React.MouseEvent, tabId: string, insightTitle: string) => void;
    onLoadInsight?: (insightId: string) => void; // New prop for lazy loading
}

const SubTabs: React.FC<SubTabsProps> = ({ 
    activeConversation, 
    activeSubView, 
    onTabClick, 
    userTier, 
    onReorder, 
    onContextMenu,
    onLoadInsight 
}) => {
    const draggedItem = useRef<number | null>(null);
    const [dragOverItem, setDragOverItem] = useState<number | null>(null);
    const longPressEvents = useLongPress();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY === 0) return;
            e.preventDefault();
            container.scrollTo({
                left: container.scrollLeft + e.deltaY,
                behavior: 'smooth'
            });
        };

        container.addEventListener('wheel', handleWheel);
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, []);

    if (userTier === 'free' || !activeConversation?.insights || activeConversation.id === 'everything-else') {
        return null;
    }

    const orderedInsights = (activeConversation.insightsOrder || Object.keys(activeConversation.insights))
        .map(id => activeConversation.insights?.[id])
        .filter((i): i is NonNullable<typeof i> => !!i);

    const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, index: number) => {
        draggedItem.current = index;
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (index: number) => {
        setDragOverItem(index);
    };

    const handleDragEnd = () => {
        if (draggedItem.current !== null && dragOverItem !== null && draggedItem.current !== dragOverItem) {
            onReorder(activeConversation.id, draggedItem.current, dragOverItem);
        }
        draggedItem.current = null;
        setDragOverItem(null);
    };

    const tabs = [
        { id: 'chat', title: 'Chat', isNew: false, status: 'loaded' },
        ...orderedInsights
    ];

    return (
        <div className="w-full max-w-4xl mx-auto px-2 pt-2 flex-shrink-0">
             <div 
                ref={containerRef}
                className="flex items-center gap-2 pb-2 overflow-x-auto scroll-smooth"
                onDragLeave={() => setDragOverItem(null)}
            >
                {tabs.map((tab, index) => {
                    const isActive = activeSubView === tab.id;
                    const isLoading = tab.status === 'loading';
                    const isChatTab = tab.id === 'chat';
                    const isPlaceholder = (tab as any).isPlaceholder;
                    const hasError = tab.status === 'error';

                    return (
                        <button
                            key={tab.id}
                            draggable={!isChatTab}
                            onDragStart={(e) => handleDragStart(e, index - 1)} // Adjust index for chat tab
                            onDragEnter={() => handleDragEnter(index - 1)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            {...longPressEvents(isChatTab ? () => {} : (e: any) => onContextMenu(e, tab.id, tab.title))}
                            onClick={() => {
                                onTabClick(tab.id);
                                // Trigger lazy loading for placeholders or failed insights
                                if (tab.id !== 'chat' && onLoadInsight && 
                                    (tab.status === 'idle' || tab.status === 'error' || (tab as any).isPlaceholder)) {
                                    onLoadInsight(tab.id);
                                }
                            }}
                            disabled={isLoading}
                            className={`select-none relative flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border flex items-center active:scale-95
                                ${isActive
                                    ? 'bg-[#E53A3A]/30 border-[#E53A3A]/70 text-[#F5F5F5] shadow-sm'
                                    : isLoading
                                    ? 'bg-[#2E2E2E]/50 border-transparent text-[#A3A3A3] animate-pulse cursor-not-allowed'
                                    : hasError
                                    ? 'bg-[#FF4D4D]/20 border-[#FF4D4D]/50 text-[#FF8080] hover:bg-[#FF4D4D]/30'
                                    : isPlaceholder
                                    ? 'bg-[#FFAB40]/20 border-[#FFAB40]/50 text-[#FFCC80] hover:bg-[#FFAB40]/30'
                                    : 'bg-[#2E2E2E]/80 border-[#424242] text-[#CFCFCF] hover:bg-[#424242]/70 hover:border-[#5A5A5A]'
                                }
                                ${dragOverItem === index -1 ? 'border-[#FFAB40]' : ''}
                            `}
                        >
                            {tab.title}
                            {tab.isNew && !isActive && (
                                <span className="absolute top-1.5 right-1.5 block w-2 h-2 bg-[#FF4D4D] rounded-full ring-2 ring-black" aria-label="New content"></span>
                            )}
                            {isPlaceholder && (
                                <span className="ml-2 text-xs opacity-70">✨</span>
                            )}
                            {hasError && (
                                <span className="ml-2 text-xs opacity-70">⚠️</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default React.memo(SubTabs);