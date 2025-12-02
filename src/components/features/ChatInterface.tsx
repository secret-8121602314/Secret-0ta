import React, { useState, useRef, useEffect, memo } from 'react';
import { Conversation, ActiveSessionState, ChatMessage } from '../../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import SessionSummaryCard, { parseSessionSummaryMessage } from './SessionSummaryCard';
import ManualUploadToggle from '../ui/ManualUploadToggle';
import ScreenshotButton from '../ui/ScreenshotButton';
import DownloadIcon from '../ui/DownloadIcon';
import AIAvatar from '../ui/AIAvatar';
import TypingIndicator from '../ui/TypingIndicator';
import SendIcon from '../ui/SendIcon';
import StopIcon from '../ui/StopIcon';
import ErrorBoundary from '../ErrorBoundary';
import TTSControls from '../ui/TTSControls';
import SuggestedPrompts from './SuggestedPrompts';
import { ActiveSessionToggle } from '../ui/ActiveSessionToggle';
import SubTabs from './SubTabs';
import { gameTabService } from '../../services/gameTabService';
import { tabManagementService } from '../../services/tabManagementService';
import { ChatInterfaceSkeleton } from '../ui/Skeletons';

// ============================================================================
// ERROR FALLBACK COMPONENTS
// ============================================================================

// ✅ NEW: Fallback UI for SubTabs errors
const SubTabsErrorFallback: React.FC = () => (
  <div className="mb-4 px-3 py-4 rounded-lg bg-[#1C1C1C]/60 border border-[#FF4D4D]/30">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[#FF4D4D]">⚠️</span>
      <span className="text-sm font-semibold text-[#FF4D4D]">
        Failed to Load Insights
      </span>
    </div>
    <p className="text-xs text-[#A3A3A3]">
      There was an error loading game insights. You can still chat normally.
    </p>
  </div>
);

// ============================================================================
// MEMOIZED CHAT MESSAGE COMPONENT (Performance Optimization)
// ============================================================================
// Prevents unnecessary re-renders when other parts of the UI update
// (e.g., when subtabs update, old messages won't re-render)
interface ChatMessageComponentProps {
  message: ChatMessage;
  suggestedPrompts: string[];
  onSuggestedPromptClick?: (prompt: string) => void;
  isLoading: boolean;
  conversationId?: string;
  onDownloadImage: (url: string, index: number) => void;
  onDeleteQueuedMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, content: string) => void;
  onFeedback?: (messageId: string, type: 'up' | 'down') => void;
}

const ChatMessageComponent: React.FC<ChatMessageComponentProps> = ({
  message,
  suggestedPrompts,
  onSuggestedPromptClick,
  isLoading,
  conversationId,
  onDownloadImage,
  onDeleteQueuedMessage,
  onEditMessage,
  onFeedback
}) => {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);
  
  // Check if this is a session summary message
  const sessionSummaryData = message.role === 'assistant' 
    ? parseSessionSummaryMessage(message.content) 
    : null;
  
  // Handle feedback with local state tracking
  const handleFeedback = (type: 'up' | 'down') => {
    setFeedbackGiven(type);
    onFeedback?.(message.id, type);
  };
  
  // Render session summary card if this is a summary message
  if (sessionSummaryData) {
    return (
      <div 
        className="flex flex-col items-start w-full"
        data-message-id={message.id}
      >
        <SessionSummaryCard key={message.id} {...sessionSummaryData} />
      </div>
    );
  }
  
  return (
    <>
      {/* Image Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 flex items-center justify-center bg-[#1C1C1C] border border-[#424242] rounded-full text-white hover:bg-[#2C2C2C] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={expandedImage}
              alt="Full size"
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex justify-center mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadImage(expandedImage, 0);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#FF4D4D] text-white text-sm font-medium rounded-lg hover:bg-[#E53A3A] transition-colors"
              >
                <DownloadIcon className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div 
        className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
        data-message-id={message.id}
      >
        <div
          className={`${
            message.role === 'user'
              ? 'max-w-[75%] sm:max-w-[80%] chat-message-user'
              : 'max-w-[85%] sm:max-w-[85%] chat-message-ai'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Avatar - Only show for AI messages */}
          {message.role === 'assistant' && (
            <div className="flex-shrink-0">
              <AIAvatar className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0" />
            </div>
          )}
          
          {/* Message content */}
          <div className="flex-1 min-w-0">
            {message.imageUrl && (
              <div className="chat-image-container mb-3">
                <div 
                  className="relative inline-block cursor-pointer group"
                  onClick={() => setExpandedImage(message.imageUrl || null)}
                >
                  <img
                    src={message.imageUrl}
                    alt="Uploaded"
                    className="w-64 h-48 sm:w-80 sm:h-60 object-cover rounded-lg border border-[#424242]/50 hover:border-[#FF4D4D]/50 transition-colors"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 rounded-lg transition-colors">
                    <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-[10px] text-[#A3A3A3]">Click to view full size</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadImage(message.imageUrl || '', 0);
                    }}
                    className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-[#FF4D4D] border border-[#FF4D4D]/50 rounded hover:bg-[#FF4D4D]/10 transition-colors"
                  >
                    <DownloadIcon className="w-3 h-3" />
                    Download
                  </button>
                </div>
              </div>
            )}
            <MarkdownRenderer 
              content={message.content} 
              variant="chat" 
              className="text-[#F5F5F5] leading-relaxed"
            />
            
            {/* TTS Controls for AI messages */}
            {message.role === 'assistant' && <TTSControls />}
            
            {/* Show suggested prompts after AI response */}
            {message.role === 'assistant' && suggestedPrompts.length > 0 && onSuggestedPromptClick && !isLoading && (
              <div className="mt-4">
                <SuggestedPrompts
                  prompts={suggestedPrompts}
                  onPromptClick={onSuggestedPromptClick}
                  isLoading={isLoading}
                  conversationId={conversationId}
                />
              </div>
            )}
            
            {/* Timestamp */}
            <p className="text-xs text-[#A3A3A3] mt-2">
              {new Date(message.timestamp).toLocaleTimeString()}
            </p>
            
            {/* Delete button for queued messages - inside bubble */}
            {message.id.startsWith('msg_pending_') && onDeleteQueuedMessage && (
              <button
                onClick={() => onDeleteQueuedMessage(message.id)}
                className="flex items-center gap-1 px-2 py-0.5 mt-2 text-xs text-[#FF4D4D] border border-[#FF4D4D]/50 rounded hover:bg-[#FF4D4D]/10 transition-colors"
                title="Remove from queue"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
      
        {/* Edit button for user messages - aligned to end of bubble */}
        {message.role === 'user' && !message.id.startsWith('msg_pending_') && onEditMessage && (
          <div className="flex justify-end mt-1.5 mr-1">
            <button
              onClick={() => {
                const cleanContent = message.content.replace(/\n\n_⏳ Queued.*_$/, '');
                onEditMessage(message.id, cleanContent);
              }}
              className="flex items-center justify-center w-7 h-7 text-[#666] active:text-[#FF4D4D] active:bg-[#FF4D4D]/10 sm:hover:text-[#FF4D4D] sm:hover:bg-[#FF4D4D]/10 rounded-full"
              title="Edit and resubmit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Feedback buttons for AI messages - Below the bubble, aligned with avatar */}
        {message.role === 'assistant' && onFeedback && !isLoading && (
          <div className="flex items-center justify-start gap-1.5 mt-1.5 ml-11 sm:ml-12">
            <button
              onClick={() => handleFeedback('up')}
              disabled={feedbackGiven !== null}
              className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
                feedbackGiven === 'up'
                  ? 'text-green-500 bg-green-500/15'
                  : feedbackGiven === 'down'
                    ? 'text-[#444] cursor-not-allowed'
                    : 'text-[#666] active:text-green-500 active:bg-green-500/10 sm:hover:text-green-500 sm:hover:bg-green-500/10'
              }`}
              title={feedbackGiven ? (feedbackGiven === 'up' ? 'You liked this' : 'Feedback given') : 'Good response'}
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill={feedbackGiven === 'up' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
              </svg>
            </button>
            <button
              onClick={() => handleFeedback('down')}
              disabled={feedbackGiven !== null}
              className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
                feedbackGiven === 'down'
                  ? 'text-red-500 bg-red-500/15'
                  : feedbackGiven === 'up'
                    ? 'text-[#444] cursor-not-allowed'
                    : 'text-[#666] active:text-red-500 active:bg-red-500/10 sm:hover:text-red-500 sm:hover:bg-red-500/10'
              }`}
              title={feedbackGiven ? (feedbackGiven === 'down' ? 'You disliked this' : 'Feedback given') : 'Poor response'}
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill={feedbackGiven === 'down' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 0 1-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 0 0 7.5 19.5a2.25 2.25 0 0 0 2.25 2.25.75.75 0 0 0 .75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 0 0 2.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.487-.36 2.89-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96.417-.66.778-1.378 1.07-2.128.426-1.1.654-2.224.654-3.375a9.116 9.116 0 0 0-1.4-4.887Z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// Memoize the component to prevent unnecessary re-renders
// Only re-renders if message props actually change
const MemoizedChatMessage = memo(ChatMessageComponent, (prevProps, nextProps) => {
  // Custom comparison: only re-render if message props actually change
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.timestamp === nextProps.message.timestamp &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.suggestedPrompts.length === nextProps.suggestedPrompts.length &&
    prevProps.onDeleteQueuedMessage === nextProps.onDeleteQueuedMessage &&
    prevProps.onEditMessage === nextProps.onEditMessage &&
    prevProps.onFeedback === nextProps.onFeedback
  );
});

MemoizedChatMessage.displayName = 'MemoizedChatMessage';

// ============================================================================
// MAIN CHAT INTERFACE COMPONENT
// ============================================================================

interface ChatInterfaceProps {
  conversation: Conversation | null;
  onSendMessage: (message: string, imageUrl?: string) => void;
  isLoading: boolean;
  isPCConnected?: boolean;
  onRequestConnect?: () => void;
  userTier?: string;
  onStop?: () => void;
  isManualUploadMode?: boolean;
  onToggleManualUploadMode?: () => void;
  suggestedPrompts?: string[];
  onSuggestedPromptClick?: (prompt: string) => void;
  activeSession?: ActiveSessionState;
  onToggleActiveSession?: () => void;
  initialMessage?: string;
  onMessageChange?: (message: string) => void;
  queuedImage?: string | null;
  onImageQueued?: () => void;
  isSidebarOpen?: boolean;
  onDeleteQueuedMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, content: string) => void;
  onFeedback?: (messageId: string, type: 'up' | 'down') => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversation,
  onSendMessage,
  isLoading,
  isPCConnected = false,
  onRequestConnect,
  userTier = 'free',
  onStop,
  isManualUploadMode = false,
  onToggleManualUploadMode,
  suggestedPrompts = [],
  onSuggestedPromptClick,
  activeSession,
  onToggleActiveSession,
  initialMessage = '',
  onMessageChange,
  queuedImage = null,
  onImageQueued,
  isSidebarOpen = false,
  onDeleteQueuedMessage,
  onEditMessage,
  onFeedback,
}) => {
  const [message, setMessage] = useState(initialMessage);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  // Mobile: collapsed by default, Desktop: expanded by default
  const [isQuickActionsExpanded, setIsQuickActionsExpanded] = useState(() => {
    return window.innerWidth > 640; // Collapsed on mobile (<=640px), expanded on desktop
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);
  const lastMessageIdRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ✅ NEW: Scroll to show the START of new AI messages instead of the end
  const scrollToLatestMessage = () => {
    if (!conversation || !messagesContainerRef.current) {return;}
    
    const messages = conversation.messages;
    const messageCount = messages.length;
    
    if (messageCount === 0) return;
    
    const lastMessage = messages[messageCount - 1];
    
    // Always scroll for new messages (compare message count OR id changed)
    const shouldScroll = messageCount > lastMessageCountRef.current || 
      (messageCount > 0 && lastMessage.id !== lastMessageIdRef.current);
    
    if (shouldScroll) {
      // If it's an AI message (assistant), scroll to show the START of the message
      if (lastMessage.role === 'assistant') {
        // Find the last message element in the DOM
        const messageElements = messagesContainerRef.current.querySelectorAll('[data-message-id]');
        const lastMessageElement = messageElements[messageElements.length - 1];
        
        if (lastMessageElement) {
          // Scroll to show the top of the message with some padding
          lastMessageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        // For user messages, scroll to bottom as usual
        scrollToBottom();
      }
      
      lastMessageCountRef.current = messageCount;
      lastMessageIdRef.current = lastMessage.id;
    }
  };

  // Auto-resize textarea functionality
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const MAX_HEIGHT = 120; // Max 5 lines
      const MIN_HEIGHT = 44; // Single line height
      
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, MIN_HEIGHT), MAX_HEIGHT);
      textarea.style.height = `${newHeight}px`;
    }
  };

  // Handle textarea value change
  const handleValueChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);
    adjustTextareaHeight();
    // Notify parent of message change
    onMessageChange?.(newValue);

    // Check for @ command to show autocomplete
    if (conversation && newValue.startsWith('@')) {
      const availableTabs = tabManagementService.getAvailableTabNames(conversation);
      if (availableTabs.length > 0) {
        setAutocompleteSuggestions(availableTabs);
        setShowAutocomplete(true);
        setSelectedSuggestionIndex(0);
      } else {
        setShowAutocomplete(false);
      }
    } else {
      setShowAutocomplete(false);
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (tabId: string) => {
    setMessage(`@${tabId} `);
    setShowAutocomplete(false);
    textareaRef.current?.focus();
  };

  // Handle key down events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle autocomplete navigation
    if (showAutocomplete && autocompleteSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < autocompleteSuggestions.length - 1 ? prev + 1 : 0
        );
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : autocompleteSuggestions.length - 1
        );
        return;
      } else if (e.key === 'Tab' || (e.key === 'Enter' && showAutocomplete)) {
        e.preventDefault();
        handleSelectSuggestion(autocompleteSuggestions[selectedSuggestionIndex]);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowAutocomplete(false);
        return;
      }
    }

    // Handle normal Enter key
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as React.FormEvent);
    }
  };

  useEffect(() => {
    // Add delay to ensure DOM is updated before scrolling (longer for session summaries)
    const timeoutId = setTimeout(() => {
      scrollToLatestMessage();
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [conversation?.messages?.length, conversation?.messages?.[conversation?.messages?.length - 1]?.id]);

  // Adjust textarea height when message changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  // Update message when initialMessage prop changes (e.g., from edit button or tab switch)
  // Use a ref to track the last applied initialMessage to avoid infinite loops
  const lastAppliedInitialMessage = useRef(initialMessage);
  useEffect(() => {
    // Only update if initialMessage actually changed from what we last applied
    if (initialMessage !== lastAppliedInitialMessage.current) {
      lastAppliedInitialMessage.current = initialMessage;
      setMessage(initialMessage);
      // Focus the textarea when editing a message
      if (initialMessage && textareaRef.current) {
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
      }
    }
  }, [initialMessage]);

  // ✅ NEW: Handle queued image from WebSocket (manual mode)
  useEffect(() => {
    if (queuedImage && isManualUploadMode) {
      console.log('📸 [ChatInterface] Queued image received from WebSocket:', {
        queuedImageLength: queuedImage.length,
        queuedImagePreview: queuedImage.substring(0, 50),
        currentImagePreview: imagePreview?.substring(0, 50),
        isManualUploadMode
      });
      setImagePreview(queuedImage);
      // Notify parent that image was accepted
      onImageQueued?.();
    }
    // ✅ FIX: Removed imagePreview from dependencies to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queuedImage, isManualUploadMode, onImageQueued]);

  // ✅ NEW: Close quick actions when sidebar opens to prevent overlap
  useEffect(() => {
    if (isSidebarOpen && isQuickActionsExpanded) {
      setIsQuickActionsExpanded(false);
    }
  }, [isSidebarOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📤 [ChatInterface] Submit attempt:', { 
      message: message.trim(), 
      hasMessage: !!message.trim(), 
      hasImageFile: !!imageFile, 
      hasImagePreview: !!imagePreview,
      shouldSubmit: !(!message.trim() && !imageFile)
    });
    
    // Allow submission if there's either a message OR an image
    if (!message.trim() && !imageFile) {
            return;
    }

    // Collapse quick actions when sending a message
    if (conversation?.isGameHub) {
      setIsQuickActionsExpanded(false);
    }

    const imageUrl = imagePreview || undefined;
    console.log('📤 [ChatInterface] Submitting:', { message, hasImage: !!imageUrl, imageUrl: imageUrl?.substring(0, 50) + '...' });
    onSendMessage(message, imageUrl);
    setMessage('');
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
        if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log('📸 [ChatInterface] Image preview created:', { 
          hasResult: !!result, 
          resultLength: result?.length,
          resultStart: result?.substring(0, 50) + '...'
        });
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleManualUploadMode = () => {
    onToggleManualUploadMode?.();
  };

  // Function to download image in high quality
  const downloadImage = (imageSrc: string, index: number) => {
    try {
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = imageSrc;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `otakon-screenshot-${index + 1}-${timestamp}.png`;
      link.download = filename;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download image:', error);
      // Fallback: open image in new tab
      window.open(imageSrc, '_blank');
    }
  };

  // Show loading state if no conversation yet - use skeleton for better UX
  if (!conversation) {
    return <ChatInterfaceSkeleton />;
  }

  // Safety check for conversation
  if (!conversation) {
    return <ChatInterfaceSkeleton />;
  }

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      {/* Messages Area - Only this should scroll */}
      <div 
        ref={messagesContainerRef}
        className={`flex-1 p-3 sm:p-5 space-y-3 sm:space-y-5 min-h-0 ${conversation.messages.length > 0 ? 'overflow-y-auto custom-scrollbar' : 'overflow-y-hidden'}`}
      >
        {conversation.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <img
                src="/images/mascot/4.png"
                alt="Otagon Mascot"
                className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain aspect-square mx-auto mb-4"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <p className="text-text-muted text-lg">
                Start a conversation with <span className="bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] bg-clip-text text-transparent font-semibold">Otagon</span>
              </p>
              <p className="text-text-muted text-sm mt-2">Ask me anything about gaming, strategies, or tips. You can also start uploading gameplay screenshots for help!</p>
            </div>
          </div>
        ) : (
          conversation.messages.map((msg) => (
            <MemoizedChatMessage
              key={msg.id}
              message={msg}
              suggestedPrompts={msg.role === 'assistant' ? suggestedPrompts : []}
              onSuggestedPromptClick={onSuggestedPromptClick}
              isLoading={isLoading}
              conversationId={conversation?.id}
              onDownloadImage={downloadImage}
              onDeleteQueuedMessage={onDeleteQueuedMessage}
              onEditMessage={onEditMessage}
              onFeedback={onFeedback}
            />
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-3">
              <AIAvatar className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0" />
              <TypingIndicator variant="dots" showText={false} />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview - Show inside the chat input area */}
      {/* Removed - will show preview inside the input form instead */}

      {/* Sub-tabs Section - Show for released game conversations only (not Game Hub, not unreleased) */}
      {conversation && !conversation.isGameHub && !conversation.isUnreleased && conversation.subtabs && conversation.subtabs.length > 0 && (
        <div className="flex-shrink-0 px-3 pb-2">
          <ErrorBoundary fallback={<SubTabsErrorFallback />}>
            <SubTabs
              key={`subtabs-${conversation.id}`}
              subtabs={conversation.subtabs}
              isLoading={isLoading}
              onFeedback={onFeedback}
            />
          </ErrorBoundary>
        </div>
      )}

      {/* Game Hub Quick Prompts - Only show in Game Hub tab */}
      {conversation?.isGameHub && (
        <div className="flex-shrink-0 mx-3 pb-1.5 relative">
          {/* Collapsible Header */}
          <button
            onClick={() => setIsQuickActionsExpanded(!isQuickActionsExpanded)}
            className="w-full flex items-center justify-between mb-2 py-2 px-3 rounded-lg bg-[#1C1C1C]/50 hover:bg-[#1C1C1C] border border-[#424242]/30 hover:border-[#424242]/60 transition-all duration-200 relative z-10"
          >
            <div className={`text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
              isQuickActionsExpanded 
                ? 'bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] bg-clip-text text-transparent' 
                : 'text-[#A3A3A3]'
            }`}>
              Latest Gaming News
            </div>
            <svg
              className={`w-4 h-4 transition-all duration-200 ${
                isQuickActionsExpanded 
                  ? 'rotate-180 text-[#FF4D4D]' 
                  : 'text-[#A3A3A3]'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Collapsible Content - Overlay positioned above the button */}
          {isQuickActionsExpanded && (
            <div
              className="absolute bottom-full left-0 right-0 mb-2 z-50 animate-fade-in"
            >
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#1C1C1C]/95 backdrop-blur-md border border-[#424242]/60 shadow-2xl">
                {[
                  { text: "What's the latest gaming news?", shape: "✕" },
                  { text: "Which games are releasing soon?", shape: "■" },
                  { text: "What are the latest game reviews?", shape: "▲" },
                  { text: "Show me the hottest new game trailers.", shape: "◯" }
                ].map((prompt) => (
                  <button
                    key={prompt.text}
                    onClick={() => {
                      setIsQuickActionsExpanded(false);
                      onSuggestedPromptClick?.(prompt.text);
                    }}
                    disabled={isLoading}
                    className="group relative px-3 py-3 rounded-xl bg-gradient-to-br from-[#1C1C1C] to-[#0F0F0F] hover:from-[#252525] hover:to-[#1A1A1A] border border-[#424242]/30 hover:border-[#E53A3A]/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-left overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#E53A3A]/10 to-[#FF6B35]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <span className="text-lg flex-shrink-0 text-[#E53A3A] font-bold leading-none">{prompt.shape}</span>
                      <span className="text-xs sm:text-sm text-[#E5E5E5] font-medium group-hover:text-white transition-colors leading-tight">
                        {prompt.text}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Chat Input Section with Gradient Border */}
      <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm">
        <div className="mx-3 my-3 rounded-2xl p-px transition-all duration-300" style={{
          background: isFocused 
            ? 'linear-gradient(135deg, #FF4D4D, #FFAB40)'
            : 'transparent'
        }}>
          <form onSubmit={handleSubmit} className="relative p-3 rounded-2xl bg-gradient-to-r from-[#1A1A1A] to-[#0F0F0F] animate-pulse-glow" style={{
            background: 'linear-gradient(135deg, #1A1A1A 0%, #0F0F0F 100%)',
            boxShadow: '0 0 20px rgba(255, 77, 77, 0.3), 0 0 40px rgba(255, 171, 64, 0.2), 0 0 60px rgba(0, 0, 0, 0.1)'
          }}>
          
          {/* Autocomplete Dropdown */}
          {showAutocomplete && autocompleteSuggestions.length > 0 && (
            <div 
              ref={autocompleteRef}
              className="absolute bottom-full mb-2 left-3 right-3 bg-[#1C1C1C] border border-[#424242] rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
            >
              <div className="p-2">
                <div className="text-xs text-[#A3A3A3] mb-2 px-2">
                  Select a subtab to update:
                </div>
                {autocompleteSuggestions.map((tabId, index) => {
                  const tab = conversation?.subtabs?.find(t => t.id === tabId);
                  return (
                    <button
                      key={tabId}
                      type="button"
                      onClick={() => handleSelectSuggestion(tabId)}
                      className={`w-full text-left px-3 py-2 rounded transition-colors ${
                        index === selectedSuggestionIndex
                          ? 'bg-[#E53A3A]/20 border border-[#E53A3A]/60'
                          : 'hover:bg-[#2A2A2A] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[#E53A3A] font-mono text-sm">@{tabId}</span>
                        {tab && (
                          <span className="text-[#888888] text-xs">- {tab.title}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="px-3 py-2 border-t border-[#424242]/30 bg-[#1A1A1A]/50">
                <div className="text-xs text-[#888888]">
                  Use ↑↓ to navigate, Tab/Enter to select, Esc to cancel
                </div>
              </div>
            </div>
          )}

          {/* Textarea Container - Grows upward */}
          <div className="relative mb-2">
            {/* Image Preview - Inside the form so it doesn't push input off screen */}
            {imagePreview && (
              <div className="mb-2 flex items-center gap-2">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-lg border border-[#424242]/40"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
                <div className="text-xs text-[#A3A3A3]">
                  <p className="font-semibold">Image Ready</p>
                  <p>Add a message or send</p>
                </div>
              </div>
            )}
            
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleValueChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Type your message..."
              className="w-full px-4 sm:px-6 text-base text-[#F5F5F5] placeholder-[#A3A3A3] resize-none overflow-y-auto focus:outline-none disabled:opacity-60 bg-transparent border-0 rounded-xl"
              style={{
                minHeight: '44px',
                maxHeight: '120px',
                lineHeight: '44px',
                height: '44px',
                paddingTop: '10px',
                paddingBottom: '10px'
              }}
              disabled={isLoading}
              rows={1}
            />
            </div>
          
          {/* Fixed Button Row - Always at bottom */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex-1 flex items-center space-x-2 sm:space-x-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-r from-[#2E2E2E]/90 to-[#1C1C1C]/90 flex items-center justify-center transition-all duration-300 hover:scale-105 text-text-muted hover:text-text-primary"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Only show ScreenshotButton and ManualUploadToggle when connected to PC */}
              {isPCConnected && (
                <>
                  <ManualUploadToggle
                    isManualMode={isManualUploadMode}
                    onToggle={toggleManualUploadMode}
                    isConnected={isPCConnected}
                  />
                  <ScreenshotButton
                    isConnected={isPCConnected}
                    isProcessing={isLoading}
                    isManualUploadMode={isManualUploadMode}
                    onRequestConnect={onRequestConnect}
                    usage={{ tier: userTier as import('../../types').UserTier }}
                  />
                </>
              )}

            </div>
            
            {/* Active Session Toggle - Show only for released game tabs */}
            {/* For unreleased games, show "Discuss" mode label with disabled toggle */}
            {conversation && gameTabService.isGameTab(conversation) && activeSession && (
              conversation.isUnreleased ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-surface/50 rounded-lg border border-surface-light/20">
                  <span className="text-sm font-medium text-text-muted">Discuss Mode</span>
                  <div className="text-xs text-text-muted/60">(No Playing mode until release)</div>
                </div>
              ) : onToggleActiveSession && (
                <div className="flex-shrink-0">
                  <ActiveSessionToggle
                    isActive={activeSession.isActive && activeSession.currentGameId === conversation.id}
                    onClick={onToggleActiveSession}
                  />
                </div>
              )
            )}
            
            {isLoading && onStop ? (
              <button
                type="button"
                onClick={onStop}
                aria-label="Stop generating"
                className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl transition-all duration-300 bg-[#EF4444] text-white scale-100 md:hover:scale-105 md:hover:bg-[#DC2626] active:scale-95"
              >
                <StopIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!message.trim() && !imageFile}
                aria-label="Send message"
                className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl transition-all duration-300 disabled:cursor-not-allowed ${
                  !message.trim() && !imageFile
                    ? 'bg-[#2E2E2E]/15 text-[#A3A3A3]/25 scale-100'
                    : 'bg-gradient-to-r from-[#FFAB40] to-[#FF8C00] text-[#181818] scale-100 md:hover:scale-105 md:hover:shadow-lg md:hover:shadow-[#FFAB40]/25 active:scale-95 font-semibold'
                }`}
              >
                <SendIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
