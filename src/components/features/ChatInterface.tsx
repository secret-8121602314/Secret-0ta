import React, { useState, useRef, useEffect, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Conversation, ActiveSessionState, ChatMessage } from '../../types';
import ManualUploadToggle from '../ui/ManualUploadToggle';
import ScreenshotButton from '../ui/ScreenshotButton';
import DownloadIcon from '../ui/DownloadIcon';
import AIAvatar from '../ui/AIAvatar';
import TypingIndicator from '../ui/TypingIndicator';
import SendIcon from '../ui/SendIcon';
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
              ? 'max-w-[80%] chat-message-user'
              : 'max-w-[95%] sm:max-w-[85%] chat-message-ai'
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
            <div className="text-[#F5F5F5] leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-lg font-bold text-[#F5F5F5] mb-3 mt-2">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-semibold text-[#F5F5F5] mb-2 mt-2">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-semibold text-[#F5F5F5] mb-2 mt-2">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-[#CFCFCF] leading-relaxed mb-3">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside ml-5 text-[#CFCFCF] mb-3 space-y-1.5">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside ml-5 text-[#CFCFCF] mb-3 space-y-1.5">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-[#CFCFCF] leading-relaxed">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-[#F5F5F5]">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-[#E0E0E0]">{children}</em>
                  ),
                  code: ({ children }) => (
                    <code className="bg-[#2E2E2E] text-[#FF4D4D] px-1.5 py-0.5 rounded text-xs font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-[#1C1C1C] border border-[#424242] rounded-lg p-3 overflow-x-auto mb-3">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-[#FF4D4D] pl-4 italic text-[#B0B0B0] my-3">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#FF4D4D] hover:text-[#FF6B6B] underline"
                    >
                      {children}
                    </a>
                  ),
                  br: () => <br className="my-1" />
                }}
              >
                {message.content.replace(/\\\*/g, '*')}
              </ReactMarkdown>
            </div>
            
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
      
        {/* Edit button for user messages - OUTSIDE the bubble, small icon only */}
        {message.role === 'user' && !message.id.startsWith('msg_pending_') && onEditMessage && (
          <button
            onClick={() => {
              const cleanContent = message.content.replace(/\n\n_⏳ Queued.*_$/, '');
              onEditMessage(message.id, cleanContent);
            }}
            className="mt-1.5 p-1.5 text-[#666] hover:text-[#FF4D4D] hover:bg-[#FF4D4D]/10 rounded-md transition-colors"
            title="Edit and resubmit"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        
        {/* Feedback buttons for AI messages - OUTSIDE the bubble, consistent size, middle-aligned */}
        {message.role === 'assistant' && onFeedback && !isLoading && (
          <div className="flex items-center justify-center gap-1 mt-1.5 ml-11">
            <button
              onClick={() => onFeedback(message.id, 'up')}
              className="p-1.5 text-[#666] hover:text-green-500 hover:bg-green-500/10 rounded-md transition-colors"
              title="Good response"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </button>
            <button
              onClick={() => onFeedback(message.id, 'down')}
              className="p-1.5 text-[#666] hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
              title="Poor response"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ✅ NEW: Scroll to show the START of new AI messages instead of the end
  const scrollToLatestMessage = () => {
    if (!conversation || !messagesContainerRef.current) {return;}
    
    const messages = conversation.messages;
    const messageCount = messages.length;
    
    // Only scroll if a new message was added
    if (messageCount > lastMessageCountRef.current) {
      const lastMessage = messages[messageCount - 1];
      
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
    scrollToLatestMessage();
  }, [conversation?.messages]);

  // Adjust textarea height when message changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  // Update message when initialMessage prop changes (e.g., after tab switch)
  useEffect(() => {
    if (initialMessage !== undefined && initialMessage !== message) {
      setMessage(initialMessage);
    }
  }, [initialMessage, message]);

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
        className={`flex-1 p-6 space-y-6 min-h-0 ${conversation.messages.length > 0 ? 'overflow-y-auto custom-scrollbar' : 'overflow-y-hidden'}`}
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
            <div className="flex items-start gap-3">
              {/* AI Avatar */}
              <div className="flex-shrink-0">
                <AIAvatar className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0" />
              </div>
              
              {/* Loading content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 sm:gap-4 py-2 sm:py-3">
                  <TypingIndicator variant="dots" showText={false} />
                  {onStop && (
                    <button
                      onClick={onStop}
                      className="text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-200 bg-[#424242]/60 text-[#CFCFCF] hover:bg-[#424242] hover:text-[#F5F5F5] hover:scale-105"
                      aria-label="Stop generating response"
                    >
                      Stop
                    </button>
                  )}
                </div>
              </div>
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
            
            <button
              type="submit"
              disabled={!message.trim() && !imageFile}
              aria-label="Send message"
              className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl transition-all duration-300 disabled:cursor-not-allowed ${
                (!message.trim() && !imageFile) || isLoading
                  ? 'bg-[#2E2E2E]/15 text-[#A3A3A3]/25 scale-100'
                  : 'bg-gradient-to-r from-[#FFAB40] to-[#FF8C00] text-[#181818] scale-100 md:hover:scale-105 md:hover:shadow-lg md:hover:shadow-[#FFAB40]/25 active:scale-95 font-semibold'
              }`}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
              ) : (
                <SendIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
