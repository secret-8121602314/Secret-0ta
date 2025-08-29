

import React, { useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Conversation, ChatMessage as ChatMessageType } from '../services/types';
import ChatMessage from './ChatMessage';
import SuggestedPrompts from './SuggestedPrompts';
import ActionButtons from './ActionButtons';
import { useState } from 'react';
import OtakuDiaryTab from './OtakuDiaryTab';
import WishlistTab from './WishlistTab';

interface MainViewContainerProps {
  activeConversation: Conversation;
  activeSubView: string;
  onSubViewChange: (id: string) => void;
  onSendMessage: (text: string) => void;
  stopMessage: (id: string) => void;
  isInputDisabled: boolean;
  messages: ChatMessageType[];
  loadingMessages: string[];
  onUpgradeClick: () => void;
  onFeedback: (type: 'message' | 'insight', convId: string, targetId: string, originalText: string, vote: 'up' | 'down') => void;
  onRetry: (id: string) => void;
  isFirstTime?: boolean;
  onOpenWishlistModal?: () => void;
}

const usePrevious = <T,>(value: T) => {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};


const MainViewContainer: React.FC<MainViewContainerProps> = ({
  activeConversation,
  activeSubView,
  onSubViewChange,
  onSendMessage,
  stopMessage,
  isInputDisabled,
  messages,
  loadingMessages,
  onUpgradeClick,
  onFeedback,
  onRetry,
  isFirstTime,
  onOpenWishlistModal,
}) => {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const orderedInsightIds = activeConversation.insightsOrder || Object.keys(activeConversation.insights || {});

  const views = useMemo(() => {
    return ['chat', ...orderedInsightIds];
  }, [orderedInsightIds]);

  const activeIndex = views.indexOf(activeSubView);
  const previousIndex = usePrevious(activeIndex);

  // Scroll to bottom when chat content changes
  useEffect(() => {
    if (activeSubView === 'chat') {
      console.log('🔍 Chat content changed, scrolling to bottom:', {
        messagesCount: messages.length,
        loadingCount: loadingMessages.length,
        activeSubView
      });
      
      // Immediate scroll
      scrollToBottom();
      
      // Also scroll after a delay to catch any delayed updates
      const delayedScroll = setTimeout(() => {
        scrollToBottom();
      }, 300);
      
      return () => clearTimeout(delayedScroll);
    }
  }, [messages, loadingMessages, activeSubView]);

  // Handle scroll detection to show/hide scroll to bottom button
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
      setShowScrollToBottom(!isAtBottom);
    };

    chatContainer.addEventListener('scroll', handleScroll);
    return () => {
      chatContainer.removeEventListener('scroll', handleScroll);
    };
  }, [activeSubView]);

  const scrollToBottom = () => {
    if (import.meta.env.DEV) {
      console.log('🔍 ScrollToBottom called:', {
        hasChatEndRef: !!chatEndRef.current,
        activeSubView,
        messagesCount: messages.length,
        loadingCount: loadingMessages.length,
        chatContainerRef: !!chatContainerRef.current,
        chatContainerScrollHeight: chatContainerRef.current?.scrollHeight,
        chatContainerClientHeight: chatContainerRef.current?.clientHeight,
        chatContainerScrollTop: chatContainerRef.current?.scrollTop
      });
    }
    
    if (chatEndRef.current) {
      console.log('🔍 Scrolling to chatEndRef element');
      chatEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    } else if (chatContainerRef.current) {
      console.log('🔍 Fallback: Scrolling chat container to bottom');
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      console.log('🔍 No scroll targets found!');
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      const nextIndex = Math.min(activeIndex + 1, views.length - 1);
      onSubViewChange(views[nextIndex]);
    } else if (isRightSwipe) {
      const prevIndex = Math.max(activeIndex - 1, 0);
      onSubViewChange(views[prevIndex]);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const renderContent = () => {
    // Only render the active view, not all views
    const viewId = activeSubView;
    
    // Debug logging
    if (import.meta.env.DEV) {
      console.log('🔍 MainViewContainer renderContent:', {
        viewId,
        activeSubView,
        hasInsights: !!activeConversation.insights,
        insightsKeys: Object.keys(activeConversation.insights || {}),
        otakuDiaryInsight: activeConversation.insights?.['otaku-diary']
      });
    }
    
    if (viewId === 'chat') {
      return (
        <div
          key="chat-view"
          className="flex-shrink-0 w-full h-full overflow-y-auto px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 pb-4"
          ref={chatContainerRef}
          aria-live="polite"
          aria-atomic="false"
          role="log"
        >
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col justify-end h-full">
              <SuggestedPrompts onPromptClick={onSendMessage} isInputDisabled={isInputDisabled} isFirstTime={isFirstTime} />
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 w-full max-w-5xl mx-auto my-3 sm:my-4 md:my-6">
              {messages.map(msg => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isLoading={loadingMessages.includes(msg.id)}
                  onStop={() => stopMessage(msg.id)}
                  onPromptClick={onSendMessage}
                  onUpgradeClick={onUpgradeClick}
                  onFeedback={(vote) => onFeedback('message', activeConversation.id, msg.id, msg.text, vote)}
                  onRetry={() => onRetry(msg.id)}
                  conversationId={activeConversation.id}
                  isEverythingElse={activeConversation.id === 'everything-else'}
                />
              ))}
              <div ref={chatEndRef} />
              
              {/* Show suggested prompts below messages for easy access */}
              <div className="mt-6 pt-6 border-t border-[#424242]/20">
                <SuggestedPrompts onPromptClick={onSendMessage} isInputDisabled={isInputDisabled} isFirstTime={false} />
              </div>
            </div>
          )}
          
          {/* Scroll to Bottom Button */}
          {showScrollToBottom && (
            <button
              onClick={() => {
                console.log('🔍 Scroll to bottom button clicked');
                scrollToBottom();
              }}
              className="fixed bottom-24 right-6 z-50 bg-[#E53A3A] hover:bg-[#D98C1F] text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
              title="Scroll to bottom"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          )}
        </div>
      );
    }
    
    const insight = activeConversation.insights?.[viewId];
    if (insight) {
      // Debug logging for insights
      if (import.meta.env.DEV) {
        console.log('🔍 Rendering insight:', {
          viewId,
          insightId: insight.id,
          insightTitle: insight.title,
          insightStatus: insight.status,
          isOtakuDiary: insight.id === 'otaku-diary'
        });
      }
      
      // Special handling for Otaku Diary tab
      if (insight.id === 'otaku-diary') {
        console.log('🎯 Rendering Otaku Diary tab for viewId:', viewId);
        return (
          <div key={insight.id} className="flex-shrink-0 w-full h-full overflow-y-auto">
            <OtakuDiaryTab 
              gameId={activeConversation.id}
              gameTitle={activeConversation.title}
            />
          </div>
        );
      }

      // Special handling for Wishlist tab (Everything Else conversation)
      if (viewId === 'wishlist' && activeConversation.id === 'everything-else') {
        console.log('🎯 Rendering Wishlist tab for Everything Else conversation');
        return (
          <div key="wishlist-view" className="flex-shrink-0 w-full h-full overflow-y-auto">
            <WishlistTab 
              onOpenWishlistModal={onOpenWishlistModal || (() => {})}
            />
          </div>
        );
      }

      // Regular insight tabs
      return (
        <div key={insight.id} className="flex-shrink-0 w-full h-full overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="prose prose-invert prose-base sm:prose-lg max-w-none prose-p:text-[#CFCFCF] prose-headings:text-[#F5F5F5] prose-strong:text-white prose-a:text-[#FFAB40] prose-a:no-underline hover:prose-a:underline prose-code:text-[#FFAB40] prose-code:bg-[#1C1C1C] prose-code:p-1 prose-code:rounded-md prose-li:marker:text-[#FFAB40] prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {insight.content}
            </ReactMarkdown>
          </div>
          
          {/* Action Buttons for Insights */}
          {insight.status === 'loaded' && insight.content && (
            <div className="mt-8 pt-6 border-t border-[#424242]/30">
              <ActionButtons
                content={insight.content}
                insightId={insight.id}
                gameId={activeConversation.id}
                onThumbsUp={() => onFeedback('insight', activeConversation.id, insight.id, insight.content, 'up')}
                onThumbsDown={() => onFeedback('insight', activeConversation.id, insight.id, insight.content, 'down')}
                thumbsUpActive={insight.feedback === 'up'}
                thumbsDownActive={insight.feedback === 'down'}
              />
            </div>
          )}
        </div>
      );
    }
    
    // Fallback for unknown views
    return <div key={viewId} className="flex-shrink-0 w-full h-full flex items-center justify-center text-[#CFCFCF]">View not found</div>;
  };

  return (
    <div
      className="flex-1 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Render only the active view */}
      {renderContent()}
    </div>
  );
};

export default React.memo(MainViewContainer);