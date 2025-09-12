import React, { useState, useEffect, useRef } from 'react';
// Dynamic import to avoid circular dependency
// import { voiceService, VoiceCommand } from '../services/voiceService';
import MicIcon from './MicIcon';
import MicOffIcon from './MicOffIcon';
import SendIcon from './SendIcon';

interface VoiceCommand {
  transcript: string;
  command: string;
  confidence: number;
}

interface VoiceChatInputProps {
  onSendMessage: (message: string) => void;
  onVoiceCommand?: (command: VoiceCommand) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const VoiceChatInput: React.FC<VoiceChatInputProps> = ({
  onSendMessage,
  onVoiceCommand,
  placeholder = "Ask Otakon AI anything...",
  disabled = false,
  className = ""
}) => {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [lastVoiceCommand, setLastVoiceCommand] = useState<VoiceCommand | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const initializeVoiceService = async () => {
      try {
        const { voiceService } = await import('../services/voiceService');
        setVoiceSupported(voiceService.isSupported());

        // Set up voice command callback
        voiceService.onCommand((command) => {
          setLastVoiceCommand(command);
          setIsListening(false);
          
          // Process the voice command
          if (onVoiceCommand) {
            onVoiceCommand(command);
          } else {
            // Default behavior: send the transcript as a message
            setMessage(command.transcript);
            onSendMessage(command.transcript);
          }
        });

        // Set up error callback
        voiceService.onError((error) => {
          console.error('Voice service error:', error);
          setIsListening(false);
        });

        return voiceService;
      } catch (error) {
        console.error('Failed to initialize voice service:', error);
        return null;
      }
    };

    let voiceService: any = null;
    initializeVoiceService().then((service) => {
      voiceService = service;
    });

    return () => {
      if (voiceService) {
        voiceService.destroy();
      }
    };
  }, [onVoiceCommand, onSendMessage]);

  useEffect(() => {
    // Update listening state from voice service
    const interval = setInterval(async () => {
      try {
        const { voiceService } = await import('../services/voiceService');
        setIsListening(voiceService.getListeningState());
        setIsSpeaking(voiceService.getSpeakingState());
      } catch (error) {
        // Service not available, ignore
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      
      // Auto-resize textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const toggleVoiceListening = async () => {
    if (isListening) {
      const { voiceService } = await import('../services/voiceService');
      voiceService.stopListening();
      setIsListening(false);
    } else {
      const { voiceService } = await import('../services/voiceService');
      if (voiceService.startListening()) {
        setIsListening(true);
      }
    }
  };

  const handleVoiceCommand = async (command: VoiceCommand) => {
    try {
      // Process the voice command
      const { voiceService } = await import('../services/voiceService');
      const response = await voiceService.processVoiceCommand(command);
      
      // Speak the response if it should be spoken
      if (response.shouldSpeak) {
        const { voiceService } = await import('../services/voiceService');
        await voiceService.speak(response.text);
      }
      
      // Update the input with the command transcript
      setMessage(command.transcript);
      
    } catch (error) {
      console.error('Error processing voice command:', error);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Voice Command Display */}
      {lastVoiceCommand && (
        <div className="mb-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-sm font-medium text-blue-300">Voice Command Detected</span>
          </div>
          <p className="text-sm text-blue-200 mb-2">
            <strong>You said:</strong> "{lastVoiceCommand.transcript}"
          </p>
          <p className="text-xs text-blue-300">
            <strong>Command:</strong> {lastVoiceCommand.command.replace('_', ' ')}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => handleVoiceCommand(lastVoiceCommand)}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
            >
              Process Command
            </button>
            <button
              onClick={() => setLastVoiceCommand(null)}
              className="text-xs bg-neutral-600 hover:bg-neutral-700 text-white px-2 py-1 rounded transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Input Area */}
      <div className="flex items-end gap-3 bg-[#2E2E2E] border border-[#424242] rounded-lg p-3 focus-within:border-[#FFAB40] transition-colors">
        {/* Voice Button */}
        {voiceSupported && (
          <button
            onClick={toggleVoiceListening}
            disabled={disabled || isSpeaking}
            className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-[#424242] text-neutral-400 hover:bg-[#5A5A5A] hover:text-white'
            } ${disabled || isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? (
              <MicOffIcon className="w-5 h-5" />
            ) : (
              <MicIcon className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Text Input */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent text-[#F5F5F5] placeholder-[#6E6E6E] resize-none outline-none disabled:opacity-50"
            style={{ minHeight: '24px', maxHeight: '120px' }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSendMessage}
          disabled={disabled || !message.trim()}
          className="flex-shrink-0 p-2 bg-[#E53A3A] hover:bg-[#D42A2A] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Send message"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Voice Status Indicators */}
      <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500">
        {voiceSupported && (
          <>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-neutral-500'}`}></div>
              <span>{isListening ? 'Listening...' : 'Voice ready'}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-neutral-500'}`}></div>
              <span>{isSpeaking ? 'Speaking...' : 'Speech ready'}</span>
            </div>
          </>
        )}
        
        {!voiceSupported && (
          <span className="text-yellow-500">Voice features not supported in this browser</span>
        )}
      </div>

      {/* Voice Commands Help */}
      {voiceSupported && (
        <div className="mt-3 p-3 bg-neutral-800/50 rounded-lg">
          <details className="text-xs text-neutral-400">
            <summary className="cursor-pointer hover:text-neutral-300 mb-2">
              🎤 Voice Commands Available
            </summary>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <strong>Help:</strong> "help me", "give me a hint"
              </div>
              <div>
                <strong>Progress:</strong> "where am i", "what should i do next"
              </div>
              <div>
                <strong>Combat:</strong> "how do i fight", "what weapon should i use"
              </div>
              <div>
                <strong>Exploration:</strong> "where should i go", "is there a secret here"
              </div>
              <div>
                <strong>Story:</strong> "what is the story", "who is this character"
              </div>
              <div>
                <strong>Control:</strong> "stop talking", "speak slower"
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default VoiceChatInput;
