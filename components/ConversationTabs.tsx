import React, { useRef, useEffect, useState } from 'react';
import { Conversations, Conversation } from '../services/types';
import { useLongPress } from '../hooks/useLongPress';
import PinIcon from './PinIcon';

interface ConversationTabsProps {
    conversations: Conversations;
    conversationsOrder: string[];
    activeConversation: Conversation | undefined;
    activeConversationId: string;
    onSwitchConversation: (id: string) => void;
    onContextMenu: (e: React.MouseEvent | React.TouchEvent, conversation: Conversation) => void;
    onReorder: (sourceIndex: number, destIndex: number) => void;
}

const ConversationTabs: React.FC<ConversationTabsProps> = React.memo(({ conversations, conversationsOrder, activeConversation, activeConversationId, onSwitchConversation, onContextMenu, onReorder }) => {
    const activeTabRef = useRef<HTMLButtonElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const draggedItem = useRef<number | null>(null);
    const longPressActionFired = useRef(false);
    const [dragOverItem, setDragOverItem] = useState<number | null>(null);

    const orderedConversations = conversationsOrder
        .map(id => conversations[id])
        .filter((c): c is Conversation => !!c);

    const progress = activeConversation?.progress;

    useEffect(() => {
        if (activeTabRef.current && containerRef.current) {
            const container = containerRef.current;
            const tab = activeTabRef.current;
            const containerRect = container.getBoundingClientRect();
            const tabRect = tab.getBoundingClientRect();

            if (tabRect.right > containerRect.right) {
                container.scrollLeft += tabRect.right - containerRect.right + 16;
            } else if (tabRect.left < containerRect.left) {
                container.scrollLeft -= containerRect.left - tabRect.left - 16;
            }
        }
    }, [activeConversationId]);

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

    const longPressEvents = useLongPress();

    const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, index: number) => {
        draggedItem.current = index;
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (index: number) => {
        if (orderedConversations[index]?.title === 'Everything else') return;
        setDragOverItem(index);
    };

    const handleDragEnd = () => {
        if (draggedItem.current !== null && dragOverItem !== null && draggedItem.current !== dragOverItem) {
            onReorder(draggedItem.current, dragOverItem);
        }
        draggedItem.current = null;
        setDragOverItem(null);
    };

    return (
        <div 
            className={`flex-shrink-0 ${activeConversation?.title !== 'Everything else' ? 'border-b border-[#424242]/30' : ''} bg-black/40 backdrop-blur-sm`}
            onDragLeave={() => setDragOverItem(null)}
        >
            <div ref={containerRef} className="flex items-center gap-3 p-4 overflow-x-auto scroll-smooth">
                {orderedConversations.map((convo, index) => {
                    const isActive = convo.id === activeConversationId;
                    const isEverythingElse = convo.title === 'Everything else';
                    const isBeingDraggedOver = dragOverItem === index;

                    return (
                        <button
                            key={convo.id}
                            ref={isActive ? activeTabRef : null}
                            draggable={!isEverythingElse}
                            onDragStart={isEverythingElse ? undefined : (e) => handleDragStart(e, index)}
                            onDragEnter={isEverythingElse ? undefined : () => handleDragEnter(index)}
                            onDragEnd={isEverythingElse ? undefined : handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            {...longPressEvents((e) => {
                                if (isEverythingElse) return;
                                longPressActionFired.current = true;
                                onContextMenu(e, convo);
                            })}
                            onClick={(e) => {
                                if (longPressActionFired.current) {
                                    longPressActionFired.current = false;
                                    e.stopPropagation();
                                    return;
                                }
                                onSwitchConversation(convo.id);
                            }}
                            onContextMenu={(e) => {
                                if (!isEverythingElse) {
                                    e.preventDefault();
                                    onContextMenu(e, convo);
                                }
                            }}
                            className={`select-none flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border-2 flex items-center gap-2.5 active:scale-95 shadow-lg
                                ${isActive
                                    ? 'bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 border-[#E53A3A]/60 text-[#F5F5F5] shadow-[0_0_20px_rgba(229,61,61,0.3)] hover:shadow-[0_0_30px_rgba(229,61,61,0.5)]'
                                    : 'bg-gradient-to-r from-[#2E2E2E]/80 to-[#1C1C1C]/80 text-[#CFCFCF] hover:bg-gradient-to-r hover:from-[#424242]/80 hover:to-[#2E2E2E]/80 hover:border-[#5A5A5A] hover:scale-105 hover:shadow-xl'
                                }
                                ${isBeingDraggedOver && !isEverythingElse ? 'border-amber-400 scale-110 shadow-[0_0_30px_rgba(251,191,36,0.5)]' : 'border-[#424242]/60'}
                            `}
                        >
                            {convo.isPinned && !isEverythingElse && (
                                <PinIcon className="w-4 h-4 text-[#E53A3A] drop-shadow-sm" />
                            )}
                            <span className="whitespace-nowrap">{convo.title}</span>
                        </button>
                    );
                })}
            </div>
            {typeof progress === 'number' && activeConversation?.title !== 'Everything else' && (
                <div className="px-6 pb-4 pt-2 animate-fade-in" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Game story progress: ${progress}%`}>
                    <div className="w-full h-2 bg-[#1C1C1C]/80 rounded-full relative overflow-hidden border border-[#424242]/40">
                        <div
                            className="h-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(229,61,61,0.5)]"
                            style={{ width: `${progress}%` }}
                        ></div>
                        <div
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-700 border-2 border-[#E53A3A]/60"
                            style={{ left: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-left text-[#A3A3A3] mt-3 font-medium">Story completed so far...</p>
                </div>
            )}
        </div>
    );
});

export default ConversationTabs;
