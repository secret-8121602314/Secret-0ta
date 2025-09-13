

import React, { useState, useEffect } from 'react';
import { ChatMessage as ChatMessageType, ChatMessageFeedback } from '../services/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ActionButtons from './ActionButtons';
import TypingIndicator from './TypingIndicator';
import StarIcon from './StarIcon';
import DownloadIcon from './DownloadIcon';
// Static import to replace dynamic import for Firebase hosting compatibility
// Dynamic import to avoid circular dependency
// import { wishlistService } from '../services/wishlistService';
import Logo from './Logo';
import UserAvatar from './UserAvatar';
import TaskCompletionPrompt from './TaskCompletionPrompt';

// Simple inline Confetti component
const Confetti: React.FC = () => {
    const confettiCount = 50;
    const colors = ['#FF4D4D', '#FFAB40', '#5CBB7B', '#5B99E3', '#F5F5F5'];
  
    return (
      <div className="confetti-container">
        {Array.from({ length: confettiCount }).map((_, i) => (
          <div
            key={i}
            className="confetti"
            style={{
              left: `${Math.random() * 100}%`,
              backgroundColor: colors[Math.floor(Math.random() * colors.length)],
              transform: `rotate(${Math.random() * 360}deg)`,
              width: `${Math.random() * 6 + 8}px`,
              height: `${Math.random() * 4 + 6}px`,
            }}
          />
        ))}
      </div>
    );
  };

interface ChatMessageProps {
    message: ChatMessageType;
    isLoading: boolean;
    onStop: () => void;
    onPromptClick: (prompt: string) => void;
    onUpgradeClick: () => void;
    onFeedback: (vote: 'up' | 'down') => void;
    onRetry?: () => void;
    conversationId?: string;
    isEverythingElse?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading, onStop, onPromptClick, onUpgradeClick, onFeedback, onRetry, conversationId, isEverythingElse }) => {
    const { id, role, text, images, suggestions, isFromPC, triumph, showUpgradeButton, feedback } = message;
    const [showConfetti, setShowConfetti] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false);

    // Check if this message is a welcome message
    const isWelcomeMessage = () => {
        if (!text) return false;
        return text.includes('Welcome to Otagon!') || text.includes('Welcome to Otagon');
    };

    // Check if this message is a suggested prompt response in Everything Else conversation
    const isSuggestedPromptResponse = () => {
        if (!text || !isEverythingElse) return false;
        
        // Check if this is one of the 4 specific suggested prompts from the app
        const specificSuggestedPrompts = [
            "What's the latest gaming news?",
            "Which games are releasing soon?",
            "What should I play next?",
            "Tell me about gaming trends"
        ];
        
        return specificSuggestedPrompts.some(prompt => text.includes(prompt));
    };

    // Check if this message is about an unreleased game (simple heuristic)
    const isAboutUnreleasedGame = () => {
        if (!text || !isEverythingElse) return false;
        
        const unreleasedKeywords = [
            'unreleased', 'upcoming', 'announced', 'teased', 'in development',
            'coming soon', 'release date', 'launch date', 'pre-order',
            'beta', 'alpha', 'early access', 'demo', 'trailer'
        ];
        
        const textLower = text.toLowerCase();
        const hasUnreleasedKeywords = unreleasedKeywords.some(keyword => textLower.includes(keyword));
        
        if (!hasUnreleasedKeywords) return false;
        
        // Check if this is about a single game (not multiple games)
        // Look for patterns that suggest multiple games
        const multipleGamePatterns = [
            /multiple games?/i,
            /several games?/i,
            /various games?/i,
            /different games?/i,
            /games? like/i,
            /similar games?/i,
            /other games?/i,
            /more games?/i,
            /additionally/i,
            /furthermore/i,
            /moreover/i,
            /also/i,
            /as well/i,
            /in addition/i
        ];
        
        // If we detect multiple game patterns, don't show wishlist button
        const hasMultipleGamePatterns = multipleGamePatterns.some(pattern => pattern.test(text));
        if (hasMultipleGamePatterns) return false;
        
        // Check for list-like structures (numbered lists, bullet points)
        const hasListStructure = /\d+\.|•|\*|\-/.test(text);
        if (hasListStructure) return false;
        
        // Check for multiple game names (look for multiple bold text or quoted text)
        const boldMatches = text.match(/\*\*(.*?)\*\*/g);
        const quoteMatches = text.match(/[""](.*?)[""]/g);
        
        // If we have multiple bold or quoted items, it's likely multiple games
        if ((boldMatches && boldMatches.length > 1) || (quoteMatches && quoteMatches.length > 1)) {
            return false;
        }
        
        // Check for conjunction words that suggest multiple items
        const conjunctionWords = ['and', 'or', 'but', 'however', 'while', 'whereas'];
        const hasConjunctions = conjunctionWords.some(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            return regex.test(text);
        });
        
        // If we have conjunctions, be more careful - only show if it's clearly about one main game
        if (hasConjunctions) {
            // Look for clear single game focus
            const singleGamePatterns = [
                /the game/i,
                /this game/i,
                /that game/i,
                /a game/i,
                /an upcoming game/i,
                /the upcoming/i,
                /this upcoming/i
            ];
            
            return singleGamePatterns.some(pattern => pattern.test(text));
        }
        
        return true;
    };

    // Add to wishlist function
    const handleAddToWishlist = async () => {
        try {
            // Extract game name from the message (simple heuristic)
            const gameName = extractGameName(text);
            if (gameName) {
                // Using static import instead of dynamic import for Firebase hosting compatibility
                const { wishlistService } = await import('../services/wishlistService');
                await wishlistService.addToWishlist({
                    gameName,
                    gameId: 'everything-else',
                    source: 'ai_response',
                    sourceMessageId: id
                });
                setIsInWishlist(true);
                console.log('✅ Added to wishlist:', gameName);
            }
        } catch (error) {
            console.error('Failed to add to wishlist:', error);
        }
    };

    // Simple game name extraction
    const extractGameName = (text: string): string | null => {
        // This is a simple heuristic - in production you might want more sophisticated parsing
        const lines = text.split('\n');
        for (const line of lines) {
            if (line.includes('**') && line.includes('**')) {
                // Look for bold text which often indicates game names
                const match = line.match(/\*\*(.*?)\*\*/);
                if (match) return match[1].trim();
            }
        }
        return null;
    };

    // Function to download image in high quality
    const downloadImage = (imageSrc: string, index: number) => {
        try {
            // Create a temporary link element
            const link = document.createElement('a');
            link.href = imageSrc;
            
            // Generate filename based on source and index
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = isFromPC 
                ? `otakon-screenshot-${index + 1}-${timestamp}.png`
                : `otakon-upload-${index + 1}-${timestamp}.png`;
            
            link.download = filename;
            link.target = '_blank';
            
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
    const downloadAllImages = () => {
        if (!images || images.length === 0) return;
        
        images.forEach((imageSrc, index) => {
            setTimeout(() => {
                downloadImage(imageSrc, index);
            }, index * 100); // Small delay between downloads to avoid browser blocking
        });
    };

    useEffect(() => {
        if (triumph) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 4000); // Duration of confetti animation
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [triumph]);

    if (role === 'user') {
        if (!text && (!images || images.length === 0)) return null;

        const containerClasses = (images && images.length > 0)
          ? "p-4"
          : "py-3 px-4";

        // Determine grid layout based on image count
        const getGridClasses = (imageCount: number) => {
            if (imageCount === 1) return 'grid-cols-1';
            if (imageCount === 2) return 'grid-cols-2';
            if (imageCount === 3) return 'grid-cols-3';
            if (imageCount === 4) return 'grid-cols-2 sm:grid-cols-4';
            if (imageCount === 5) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';
            return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
        };

        return (
            <div key={id} className="flex items-start gap-2 sm:gap-3 justify-end">
                <div className={`${containerClasses} max-w-[85%] sm:max-w-2xl`}>
                    {images && images.length > 0 && (
                        <div className={`grid gap-2 sm:gap-3 ${getGridClasses(images.length)} ${text ? 'mb-3' : ''}`}>
                            {images.map((imgSrc, index) => (
                                <div key={index} className="relative group overflow-hidden rounded-lg sm:rounded-xl">
                                    <img 
                                        src={imgSrc} 
                                        alt={`Screenshot ${index + 1}`} 
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                        style={{ aspectRatio: '16/9' }}
                                    />
                                    <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-black/80 backdrop-blur-sm text-white text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-white/20">
                                        {index + 1}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                            ))}
                        </div>
                    )}
                    {text && (
                        <p className="text-[#F5F5F5] whitespace-pre-wrap leading-relaxed">{text}</p>
                    )}
                    {!text && images && images.length > 0 && (
                        <p className="text-[#A3A3A3] text-sm mt-2 font-medium">
                            📸 {images.length} screenshot{images.length > 1 ? 's' : ''} uploaded
                        </p>
                    )}
                    
                    {/* Download buttons for images */}
                    {images && images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#424242]/30">
                            {images.length === 1 ? (
                                <button
                                    onClick={() => downloadImage(images[0], 0)}
                                    className="flex items-center justify-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] text-white text-xs sm:text-sm font-medium rounded-lg hover:from-[#E53A3A] hover:to-[#D98C1F] transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                    title="Download this screenshot"
                                >
                                    <DownloadIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                    <span className="hidden sm:inline">Download</span>
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={downloadAllImages}
                                        className="flex items-center justify-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-[#5CBB7B] to-[#4CAF50] text-white text-xs sm:text-sm font-medium rounded-lg hover:from-[#4CAF50] hover:to-[#45A049] transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                        title="Download all screenshots"
                                    >
                                        <DownloadIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                        <span className="hidden sm:inline">Download All ({images.length})</span>
                                    </button>
                                    <div className="flex gap-1">
                                        {images.map((imgSrc, index) => (
                                            <button
                                                key={index}
                                                onClick={() => downloadImage(imgSrc, index)}
                                                className="px-1.5 sm:px-2 py-1.5 sm:py-2 bg-[#2E2E2E] text-[#A3A3A3] text-xs font-medium rounded-lg hover:bg-[#424242] hover:text-[#F5F5F5] transition-all duration-300 hover:scale-105"
                                                title={`Download screenshot ${index + 1}`}
                                            >
                                                {index + 1}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
                <UserAvatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 text-[#D98C1F]" />
            </div>
        );
    }

    if (role === 'system') {
        return (
            <div key={id} className="flex items-start gap-2 sm:gap-3">
                <Logo className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" />
                <div className="bg-gradient-to-r from-[#1C1C1C]/80 to-[#0A0A0A]/80 border border-[#424242]/60 rounded-xl sm:rounded-2xl rounded-tl-none py-3 sm:py-4 px-4 sm:px-6 relative overflow-hidden backdrop-blur-sm">
                    <div className="ai-response max-w-none text-[#CFCFCF] text-sm sm:text-base">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                                p: ({ children, ...props }) => (
                                    <p {...props} className="mb-3 sm:mb-4 last:mb-0 leading-relaxed text-base sm:text-lg">
                                        {children}
                                    </p>
                                ),
                                h1: ({ children, ...props }) => (
                                    <h1 {...props} className="text-2xl font-bold mb-4 mt-6 first:mt-0 text-[#F5F5F5]">
                                        {children}
                                    </h1>
                                ),
                                h2: ({ children, ...props }) => (
                                    <h2 {...props} className="text-xl font-bold mb-3 mt-5 first:mt-0 text-[#F5F5F5]">
                                        {children}
                                    </h2>
                                ),
                                h3: ({ children, ...props }) => (
                                    <h3 {...props} className="text-lg font-semibold mb-2 mt-4 first:mt-0 text-[#F5F5F5]">
                                        {children}
                                    </h3>
                                ),
                                ul: ({ children, ...props }) => (
                                    <ul {...props} className="list-disc list-inside mb-4 space-y-1">
                                        {children}
                                    </ul>
                                ),
                                ol: ({ children, ...props }) => (
                                    <ol {...props} className="list-decimal list-inside mb-4 space-y-1">
                                        {children}
                                    </ol>
                                ),
                                li: ({ children, ...props }) => (
                                    <li {...props} className="text-[#CFCFCF]">
                                        {children}
                                    </li>
                                ),
                                blockquote: ({ children, ...props }) => (
                                    <blockquote {...props} className="border-l-4 border-[#FF4D4D] bg-[#FF4D4D]/10 pl-4 py-2 my-4 rounded-r-md italic">
                                        {children}
                                    </blockquote>
                                ),
                                code: ({ children, ...props }) => (
                                    <code {...props} className="bg-[#FFAB40]/20 text-[#FFAB40] px-1.5 py-0.5 rounded text-sm font-mono">
                                        {children}
                                    </code>
                                ),
                                pre: ({ children, ...props }) => (
                                    <pre {...props} className="bg-[#1C1C1C]/80 p-4 rounded-lg overflow-x-auto my-4">
                                        <code className="text-[#CFCFCF]">
                                            {children}
                                        </code>
                                    </pre>
                                )
                            }}
                        >
                            {text}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        );
    }

    if (role === 'model') {
        const CANCELLATION_TEXT = '*Request cancelled by user.*';
        const isCancelledMessage = text === CANCELLATION_TEXT;
        
        // Check if this is a failed response (error message)
        const isFailedResponse = text.includes('Error:') || 
                               text.includes('Failed') || 
                               text.includes('QUOTA_EXCEEDED') ||
                               text.includes('Network error') ||
                               text.includes('Timeout') ||
                               text.includes('Rate limit');

        if (isCancelledMessage) {
            return (
                <div key={id} className="flex items-start gap-2 sm:gap-3">
                    <Logo className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" />
                    <div className="flex items-center w-full max-w-[95%] sm:max-w-2xl py-2 sm:py-3 px-3 sm:px-4">
                        <p className="text-xs sm:text-sm italic text-[#CFCFCF]">Request cancelled by user.</p>
                    </div>
                </div>
            );
        }

        const bubbleClasses = `bg-[#2E2E2E]/60 border border-[#424242]/60 rounded-2xl rounded-tl-none py-3 px-4 relative overflow-hidden ${triumph ? 'triumph-glow' : ''} backdrop-blur-sm`;

        return (
                            <div key={id} className="flex items-start gap-2 sm:gap-3">
                    <Logo className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" />
                    <div className="flex flex-col gap-2 sm:gap-3 w-full max-w-[95%] sm:max-w-2xl">
                        {showConfetti && <Confetti />}
                        {text.trim() && (
                            <div className={bubbleClasses}>
                                <div className="ai-response max-w-none text-[#CFCFCF] text-sm sm:text-base">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                                            p: ({ children, ...props }) => (
                                                <p {...props} className="mb-3 sm:mb-4 last:mb-0 leading-relaxed">
                                                    {children}
                                                </p>
                                            ),
                                            h1: ({ children, ...props }) => (
                                                <h1 {...props} className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 mt-4 sm:mt-6 first:mt-0 text-[#F5F5F5]">
                                                    {children}
                                                </h1>
                                            ),
                                            h2: ({ children, ...props }) => (
                                                <h2 {...props} className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 mt-3 sm:mt-5 first:mt-0 text-[#F5F5F5]">
                                                    {children}
                                                </h2>
                                            ),
                                            h3: ({ children, ...props }) => (
                                                <h3 {...props} className="text-base sm:text-lg font-semibold mb-2 mt-3 sm:mt-4 first:mt-0 text-[#F5F5F5]">
                                                    {children}
                                                </h3>
                                            ),
                                            ul: ({ children, ...props }) => (
                                                <ul {...props} className="list-disc list-inside mb-3 sm:mb-4 space-y-1">
                                                    {children}
                                                </ul>
                                            ),
                                            ol: ({ children, ...props }) => (
                                                <ol {...props} className="list-decimal list-inside mb-3 sm:mb-4 space-y-1">
                                                    {children}
                                                </ol>
                                            ),
                                            li: ({ children, ...props }) => (
                                                <li {...props} className="text-[#CFCFCF]">
                                                    {children}
                                                </li>
                                            ),
                                            blockquote: ({ children, ...props }) => (
                                                <blockquote {...props} className="border-l-4 border-[#FF4D4D] bg-[#FF4D4D]/10 pl-3 sm:pl-4 py-2 my-3 sm:my-4 rounded-r-md italic">
                                                    {children}
                                                </blockquote>
                                            ),
                                            code: ({ children, ...props }) => (
                                                <code {...props} className="bg-[#FFAB40]/20 text-[#FFAB40] px-1.5 py-0.5 rounded text-sm font-mono">
                                                    {children}
                                                </code>
                                            ),
                                            pre: ({ children, ...props }) => (
                                                <pre {...props} className="bg-[#1C1C1C]/80 p-3 sm:p-4 rounded-lg overflow-x-auto my-3 sm:my-4">
                                                    <code className="text-[#CFCFCF] text-xs sm:text-sm">
                                                        {children}
                                                    </code>
                                                </pre>
                                            )
                                        }}
                                    >
                                        {text}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}

                    {isLoading && (
                         <div className="flex items-center gap-3 sm:gap-4 py-2 sm:py-3 px-3 sm:px-4">
                            <TypingIndicator />
                            <button
                                onClick={onStop}
                                className="text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border transition-all duration-200 bg-[#424242]/60 border-[#5A5A5A] hover:bg-[#424242] hover:border-[#6E6E6E] text-[#CFCFCF] hover:text-[#F5F5F5] hover:scale-105"
                                aria-label="Stop generating response"
                            >
                                Stop
                            </button>
                        </div>
                    )}

                    {!isLoading && text.trim() && !showUpgradeButton && !isFailedResponse && (
                         <div className="pl-2 pt-2">
                            {/* Show ActionButtons only for game conversations, not Everything Else, and not for welcome messages or suggested prompt responses */}
                            {!isEverythingElse && !isWelcomeMessage() && !isSuggestedPromptResponse() && (
                                <ActionButtons
                                    content={text}
                                    messageId={id}
                                    gameId={conversationId || 'unknown'}
                                    onThumbsUp={() => onFeedback('up')}
                                    onThumbsDown={() => onFeedback('down')}
                                    thumbsUpActive={feedback === 'up'}
                                    thumbsDownActive={feedback === 'down'}
                                />
                            )}
                            
                            {/* Show Wishlist button for Everything Else conversation when about unreleased games */}
                            {isEverythingElse && isAboutUnreleasedGame() && (
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <button
                                        onClick={handleAddToWishlist}
                                        disabled={isInWishlist}
                                        className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 ${
                                            isInWishlist
                                                ? 'bg-[#5CBB7B] text-white cursor-not-allowed'
                                                : 'bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white hover:from-[#D98C1F] hover:to-[#E53A3A] hover:scale-105'
                                        }`}
                                    >
                                        <span className="text-base sm:text-lg">🎮</span>
                                        <span className="hidden sm:inline">{isInWishlist ? 'Added to Wishlist' : 'Add to Wishlist'}</span>
                                        <span className="sm:hidden">{isInWishlist ? 'Added' : 'Add'}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Retry button for failed responses */}
                    {!isLoading && isFailedResponse && onRetry && (
                        <div className="pt-2 sm:pt-3 animate-fade-in">
                            <button
                                onClick={onRetry}
                                className="flex items-center justify-center gap-2 w-auto text-xs sm:text-sm bg-gradient-to-r from-[#5CBB7B] to-[#4CAF50] text-white font-bold py-2 sm:py-2.5 px-4 sm:px-5 rounded-lg sm:rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-[#5CBB7B]/25"
                            >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span className="hidden sm:inline">Try Again</span>
                                <span className="sm:hidden">Retry</span>
                            </button>
                        </div>
                    )}

                    {showUpgradeButton && !isLoading && (
                        <div className="pt-2 sm:pt-3 animate-fade-in">
                            <button
                                onClick={onUpgradeClick}
                                className="flex items-center justify-center gap-2 w-auto text-xs sm:text-sm bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-2 sm:py-2.5 px-4 sm:px-5 rounded-lg sm:rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-[#E53A3A]/25"
                            >
                                <StarIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Upgrade to Pro</span>
                                <span className="sm:hidden">Upgrade</span>
                            </button>
                        </div>
                    )}

                    {suggestions && !isLoading && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-3 animate-fade-in">
                            {suggestions.map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => {
                                        // Immediately hide suggestions when clicked
                                        onPromptClick(prompt);
                                    }}
                                    className="text-left p-3 sm:p-4 bg-[#1C1C1C]/60 border border-[#424242]/40 rounded-lg sm:rounded-xl transition-all duration-200 hover:bg-[#E53A3A]/20 hover:border-[#E53A3A]/60 hover:scale-[1.02] backdrop-blur-sm"
                                >
                                    <p className="text-[#CFCFCF] font-medium text-xs sm:text-sm leading-relaxed">{prompt}</p>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* NEW: Task Completion Prompt */}
                    {!isLoading && message.taskCompletionPrompt && conversationId && (
                        <div className="pl-2 pt-2">
                            <TaskCompletionPrompt
                                prompt={message.taskCompletionPrompt}
                                conversationId={conversationId}
                                onCompletionRecorded={() => {
                                    console.log('📝 Task completion recorded, will be included in next query context');
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return null;
};

export default React.memo(ChatMessage);