import React, { useState, useRef, useEffect } from 'react';
import { Conversation } from '../../types';
import Button from '../ui/Button';
import ManualUploadToggle from '../ui/ManualUploadToggle';
import ScreenshotButton from '../ui/ScreenshotButton';
import DownloadIcon from '../ui/DownloadIcon';
import UserAvatar from '../ui/UserAvatar';
import AIAvatar from '../ui/AIAvatar';
import TypingIndicator from '../ui/TypingIndicator';
import SendIcon from '../ui/SendIcon';
// import { LoadingSpinner } from '../ui/LoadingSpinner';

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
}) => {
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  // Handle key down events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  // Adjust textarea height when message changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !imageFile) return;

    const imageUrl = imagePreview || undefined;
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
        setImagePreview(e.target?.result as string);
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

  // Function to download all images in a group
  const downloadAllImages = (images: string[]) => {
    if (!images || images.length === 0) return;
    
    images.forEach((imageSrc, index) => {
      setTimeout(() => {
        downloadImage(imageSrc, index);
      }, index * 100); // Small delay between downloads to avoid browser blocking
    });
  };

  // Show loading state if no conversation yet
  if (!conversation) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4D4D] mx-auto mb-4"></div>
          <p className="text-text-muted">Loading chat...</p>
          <p className="text-text-muted text-sm mt-2">This may take a moment after completing onboarding</p>
        </div>
      </div>
    );
  }

  // Safety check for conversation
  if (!conversation) {
    return (
      <div className="h-full bg-background flex flex-col overflow-hidden">
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-text-muted text-lg">Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      {/* Messages Area - Only this should scroll */}
      <div className={`flex-1 p-6 space-y-6 min-h-0 ${conversation.messages.length > 0 ? 'overflow-y-auto custom-scrollbar' : 'overflow-y-hidden'}`}>
        {conversation.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-text-muted text-lg">
                Start a conversation with <span className="bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] bg-clip-text text-transparent font-semibold">Otagon</span>
              </p>
              <p className="text-text-muted text-sm mt-2">Ask me anything about gaming, strategies, or tips.</p>
            </div>
          </div>
        ) : (
          conversation.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] ${
                msg.role === 'user'
                  ? 'chat-message-user'
                  : 'chat-message-ai'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {msg.role === 'user' ? (
                    <UserAvatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 text-[#D98C1F]" />
                  ) : (
                    <AIAvatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
                  )}
                </div>
                
                {/* Message content */}
                <div className="flex-1 min-w-0">
              {msg.imageUrl && (
                <div className="chat-image-container mb-3">
                  <img
                    src={msg.imageUrl}
                    alt="Uploaded"
                    className="w-full max-w-sm rounded-lg"
                  />
                  {/* Download button for single image */}
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#424242]/30">
                    <button
                      onClick={() => downloadImage(msg.imageUrl!, 0)}
                      className="flex items-center justify-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 border border-[#FF4D4D] text-[#FF4D4D] text-xs sm:text-sm font-medium rounded-lg hover:bg-[#FF4D4D] hover:text-white transition-all duration-300 hover:scale-105"
                      title="Download this screenshot"
                    >
                      <DownloadIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="hidden sm:inline">Download</span>
                    </button>
                  </div>
                </div>
              )}
                  {msg.role === 'ai' && (
                    <p className="text-base font-bold text-white mb-2">Hint:</p>
                  )}
                  <p className="text-[#F5F5F5] whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p className="text-xs text-[#A3A3A3] mt-3">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start gap-3">
              {/* AI Avatar */}
              <div className="flex-shrink-0">
                <AIAvatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
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

      {/* Image Preview */}
      {imagePreview && (
        <div className="p-4 border-t border-surface-light/20 flex-shrink-0">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-xl border-2 border-[#424242]/40"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Floating Chat Input Section with Gradient Border */}
      <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm">
        <div className="mx-3 my-3 rounded-2xl p-px transition-all duration-300" style={{
          background: isFocused 
            ? 'linear-gradient(135deg, #FF4D4D, #FFAB40)'
            : 'transparent'
        }}>
          <div className="relative p-3 rounded-2xl bg-gradient-to-r from-[#1A1A1A] to-[#0F0F0F] animate-pulse-glow" style={{
            background: 'linear-gradient(135deg, #1A1A1A 0%, #0F0F0F 100%)',
            boxShadow: '0 0 20px rgba(255, 77, 77, 0.3), 0 0 40px rgba(255, 171, 64, 0.2), 0 0 60px rgba(0, 0, 0, 0.1)'
          }}>
          
          {/* Textarea Container - Grows upward */}
          <div className="relative mb-2">
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
                    usage={{ tier: userTier as any }}
                  />
                </>
              )}
            </div>
            
            <button
              type="submit"
              disabled={!message.trim() && !imageFile}
              aria-label="Send message"
              className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl transition-all duration-300 disabled:cursor-not-allowed ${
                (!message.trim() && !imageFile) || isLoading
                  ? 'bg-[#2E2E2E]/15 text-[#A3A3A3]/25 scale-100'
                  : 'bg-gradient-to-r from-[#FFAB40] to-[#FF8C00] text-[#181818] scale-100 hover:scale-105 hover:shadow-lg hover:shadow-[#FFAB40]/25 active:scale-95 font-semibold'
              }`}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
              ) : (
                <SendIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
