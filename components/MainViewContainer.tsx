

import React, { useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Conversation, ChatMessage as ChatMessageType } from '../services/types';
import ChatMessage from './ChatMessage';
import SuggestedPrompts from './SuggestedPrompts';
import ActionButtons from './ActionButtons';
import { useState } from 'react';
import { useResponsive } from '../utils/responsive';
import { UniversalResponsiveContainer, UniversalResponsiveFlex, UniversalResponsiveText } from './layout/UniversalResponsiveLayout';
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
  conversations?: Record<string, Conversation>; // NEW: Pass conversations to check for game pills
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
  conversations,
}) => {
  // Safety check to prevent rendering when activeConversation is undefined
  if (!activeConversation) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading chat...</p>
        </div>
      </div>
    );
  }

  const { isMobile, isTablet, isLaptop, isDesktop, isUltrawide, deviceType } = useResponsive();
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const orderedInsightIds = activeConversation?.insightsOrder || Object.keys(activeConversation?.insights || {});

  // NEW: Determine if we should show suggested prompts
  const isEverythingElse = activeConversation.id === 'everything-else';
  const hasGamePills = conversations ? Object.keys(conversations).some(id => id !== 'everything-else') : false;
  
  // Check if the latest AI response has suggestions
  const latestMessage = messages[messages.length - 1];
  const aiResponseHasSuggestions = latestMessage?.role === 'model' && 
    latestMessage?.suggestions && 
    latestMessage.suggestions.length > 0;

  const views = useMemo(() => {
    return ['chat', ...orderedInsightIds];
  }, [orderedInsightIds]);

  const activeIndex = views.indexOf(activeSubView);
  const previousIndex = usePrevious(activeIndex);

  // Auto-scroll to top when switching to insight tabs to show latest information
  useEffect(() => {
    if (activeSubView !== 'chat' && activeSubView !== String(previousIndex)) {
      const insightContainer = document.querySelector(`[data-insight-id="${activeSubView}"]`);
      if (insightContainer) {
        insightContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [activeSubView, previousIndex]);

  // Auto-scroll to show latest AI response when generating or generated
  useEffect(() => {
    if (activeSubView === 'chat') {
      console.log('🔍 Chat content changed, checking for AI response:', {
        messagesCount: messages.length,
        loadingCount: loadingMessages.length,
        activeSubView
      });
      
      // Always scroll to show latest interaction (AI response or loading)
      if (messages.length > 0 || loadingMessages.length > 0) {
        // Immediate scroll
        scrollToBottom();
        
        // Also scroll after a delay to catch any delayed updates (streaming responses)
        const delayedScroll = setTimeout(() => {
          scrollToBottom();
        }, 300);
        
        return () => clearTimeout(delayedScroll);
      }
    }
    return undefined;
  }, [messages, loadingMessages, activeSubView]);


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
        <div className="flex-1 w-full h-full flex flex-col">
          {/* Scrollable Chat Messages Area */}
          <UniversalResponsiveContainer
            maxWidth="full"
            padding="none"
            className="flex-1 w-full overflow-y-auto"
          >
            <div
              ref={chatContainerRef}
              aria-live="polite"
              aria-atomic="false"
              role="log"
              className="w-full"
            >
              <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 lg:gap-5 w-full max-w-[95%] sm:max-w-4xl md:max-w-5xl mx-auto mt-4 sm:mt-6 md:mt-8 lg:mt-10 mb-0">
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
                
                {/* Suggested Prompts integrated directly into messages flow */}
                {loadingMessages.length === 0 && (
                  <SuggestedPrompts 
                    onPromptClick={onSendMessage} 
                    isInputDisabled={isInputDisabled} 
                    isFirstTime={isFirstTime}
                    isEverythingElse={activeConversation.id === 'everything-else'}
                    hasGamePills={false}
                    aiResponseHasSuggestions={aiResponseHasSuggestions}
                  />
                )}
                
                <div ref={chatEndRef} className="h-0" />
              </div>
            </div>
          </UniversalResponsiveContainer>
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
          <div key={insight.id} className="flex-1 w-full h-full overflow-y-auto">
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
          <div key="wishlist-view" className="flex-1 w-full h-full overflow-y-auto">
            <WishlistTab 
              onOpenWishlistModal={onOpenWishlistModal || (() => {})}
            />
          </div>
        );
      }

      // Regular insight tabs
      return (
        <div key={insight.id} data-insight-id={insight.id} className="flex-1 w-full h-full overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="prose prose-invert prose-sm sm:prose-base md:prose-lg max-w-none prose-p:text-[#CFCFCF] prose-headings:text-[#F5F5F5] prose-strong:text-white prose-a:text-[#FFAB40] prose-a:no-underline hover:prose-a:underline prose-code:text-[#FFAB40] prose-code:bg-[#1C1C1C] prose-code:p-1 prose-code:rounded-md prose-li:marker:text-[#FFAB40] prose-h2:text-xl sm:text-2xl prose-h3:text-lg sm:text-xl prose-h4:text-base sm:text-lg">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {insight.content}
            </ReactMarkdown>
          </div>
          
          {/* Action Buttons for Insights */}
          {insight.status === 'loaded' && insight.content && (
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#424242]/30">
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