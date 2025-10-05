import React, { useState, useRef, useEffect } from 'react';
import { Conversation } from '../../types';
import Button from '../ui/Button';
import ManualUploadToggle from '../ui/ManualUploadToggle';
import ScreenshotButton from '../ui/ScreenshotButton';
// import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ChatInterfaceProps {
  conversation: Conversation | null;
  onSendMessage: (message: string, imageUrl?: string) => void;
  isLoading: boolean;
  isPCConnected?: boolean;
  onRequestConnect?: () => void;
  userTier?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversation,
  onSendMessage,
  isLoading,
  isPCConnected = false,
  onRequestConnect,
  userTier = 'free',
}) => {
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isManualUploadMode, setIsManualUploadMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

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
    setIsManualUploadMode(!isManualUploadMode);
  };

  // Show loading state if no conversation yet
  if (!conversation) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4D4D] mx-auto mb-4"></div>
          <p className="text-text-muted">Loading chat...</p>
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
              <p className="text-text-muted text-lg">Start a conversation with Otagon!</p>
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
              {msg.imageUrl && (
                <div className="chat-image-container mb-3">
                  <img
                    src={msg.imageUrl}
                    alt="Uploaded"
                    className="w-full max-w-sm rounded-lg"
                  />
                </div>
              )}
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              <p className="text-xs opacity-70 mt-3">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="chat-message-ai">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
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

      {/* Input Area - Fixed at bottom */}
      <div className="p-3 sm:p-4 lg:p-6 border-t border-surface-light/20 flex-shrink-0 bg-background" style={{ minHeight: '80px' }}>
        <form onSubmit={handleSubmit} className="flex space-x-2 sm:space-x-3 lg:space-x-4">
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
              className="btn-icon p-3 text-text-muted hover:text-text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

            <ManualUploadToggle
              isManualMode={isManualUploadMode}
              onToggle={toggleManualUploadMode}
            />

            {/* Only show ScreenshotButton when connected to PC */}
            {isPCConnected && (
              <ScreenshotButton
                isConnected={isPCConnected}
                isProcessing={isLoading}
                isManualUploadMode={isManualUploadMode}
                onRequestConnect={onRequestConnect}
                usage={{ tier: userTier as any }}
              />
            )}
            
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 input-enhanced py-4 px-4 sm:px-6 text-base min-h-[44px]"
              disabled={isLoading}
            />
          </div>
          
          <Button
            type="submit"
            disabled={!message.trim() && !imageFile}
            isLoading={isLoading}
            variant="primary"
            className="btn-primary-enhanced px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-sm sm:text-base"
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
