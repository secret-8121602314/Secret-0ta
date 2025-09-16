import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import CameraIcon from './CameraIcon';
import SendIcon from './SendIcon';
import { ConnectionStatus, Usage, Conversation, ImageFile } from '../services/types';
import ManualUploadToggle from './ManualUploadToggle';
import CommandSuggestions from './CommandSuggestions';

const fileToBase64 = async (file: File): Promise<ImageFile> => {
    try {
        // Compress image if it's larger than 1MB
        let processedFile = file;
        if (file.size > 1024 * 1024) {
            processedFile = await compressImage(file);
        }
        
        const base64 = await convertToBase64(processedFile);
        const mimeType = processedFile.type;
        const dataUrl = base64;
        
        return {
            id: crypto.randomUUID(),
            file: processedFile,
            preview: dataUrl,
            name: processedFile.name,
            size: processedFile.size,
            type: processedFile.type,
            base64: base64.split(',')[1], // Remove data URL prefix
            mimeType,
            dataUrl
        };
    } catch (error) {
        console.error('Error processing file:', error);
        throw new Error('Failed to process image file');
    }
};

const convertImage = async (file: File, targetMimeType: 'image/jpeg' | 'image/png' | 'image/webp'): Promise<ImageFile> => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const img = new Image();
        
        img.onload = () => {
            // Calculate new dimensions while maintaining aspect ratio
            const maxWidth = 1920;
            const maxHeight = 1080;
            let { width, height } = img;
            
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw image
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to target format with compression
            const quality = 0.8; // High quality compression
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const base64 = reader.result as string;
                            resolve({
                                id: crypto.randomUUID(),
                                file: blob,
                                preview: base64,
                                name: file.name.replace(/\.[^/.]+$/, `.${targetMimeType.split('/')[1]}`),
                                size: blob.size,
                                type: targetMimeType,
                                base64: base64.split(',')[1],
                                mimeType: targetMimeType,
                                dataUrl: base64
                            });
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    } else {
                        reject(new Error('Failed to convert image'));
                    }
                },
                targetMimeType,
                quality
            );
        };
        
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
};

const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const img = new Image();
        
        img.onload = () => {
            // Calculate new dimensions while maintaining aspect ratio
            const maxWidth = 1920;
            const maxHeight = 1080;
            let { width, height } = img;
            
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress image
            ctx.drawImage(img, 0, 0, width, height);
            
            // Try WebP first, fallback to JPEG
            const mimeType = 'image/webp';
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        // Create new file with compressed data
                        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                            type: mimeType,
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    } else {
                        // Fallback to original file if compression fails
                        resolve(file);
                    }
                },
                mimeType,
                0.8 // Quality setting for WebP
            );
        };
        
        img.src = URL.createObjectURL(file);
    });
};

const convertToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};


interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSendMessage: (text: string, images?: ImageFile[]) => void;
    isCooldownActive: boolean;
    onImageProcessingError: (error: string) => void;
    usage: Usage;
    imagesForReview: ImageFile[];
    onImagesReviewed: () => void;
    isManualUploadMode: boolean;
    onToggleManualUploadMode: () => void;
    connectionStatus: ConnectionStatus;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    onBatchUploadAttempt: () => void;
    hasInsights: boolean;
    activeConversation: Conversation | undefined;
}

const ChatInput: React.FC<ChatInputProps> = React.memo(({ value, onChange, onSendMessage, isCooldownActive, onImageProcessingError, usage, imagesForReview, onImagesReviewed, isManualUploadMode, onToggleManualUploadMode, connectionStatus, textareaRef, onBatchUploadAttempt, hasInsights, activeConversation }) => {
    const [selectedImages, setSelectedImages] = useState<ImageFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Command Suggestion State
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionQuery, setSuggestionQuery] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
    const [suggestionStartPosition, setSuggestionStartPosition] = useState<number | null>(null);

    useLayoutEffect(() => {
        const textarea = textareaRef?.current;
        if (textarea) {
            const MAX_HEIGHT = 120; // Reduced for mobile (approx 5 lines)
            const MIN_HEIGHT = 24; // Single line height

            if ((value?.trim() || '') === '' && selectedImages.length === 0) {
                 textarea.style.height = `${MIN_HEIGHT}px`;
            } else {
                textarea.style.height = 'auto';
                const scrollHeight = textarea.scrollHeight;
                const newHeight = Math.min(Math.max(scrollHeight, MIN_HEIGHT), MAX_HEIGHT);
                textarea.style.height = `${newHeight}px`;
            }
        }
    }, [value, selectedImages, textareaRef]);

    useEffect(() => {
        if (imagesForReview && imagesForReview.length > 0) {
            setSelectedImages(prev => {
                const combined = [...prev, ...imagesForReview];
                const limit = usage.tier !== 'free' ? 5 : 1;
                if (combined.length > limit) {
                    return combined.slice(-limit);
                }
                return combined;
            });
            onImagesReviewed();
        }
    }, [imagesForReview, onImagesReviewed, usage.tier]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) {
            if (event.target) event.target.value = '';
            return;
        }

        if (usage.tier === 'free' && (files.length > 1 || selectedImages.length > 0)) {
            onBatchUploadAttempt();
            if (event.target) event.target.value = '';
            return;
        }

        const limit = usage.tier !== 'free' ? 5 : 1;
        if (selectedImages.length + files.length > limit) {
            onImageProcessingError(`You can select a maximum of ${limit} image(s).`);
            if (event.target) event.target.value = '';
            return;
        }

        const newImagesPromises = Array.from(files).map(async file => {
            if (!file.type.startsWith('image/')) return null;
            try {
                if (file.type === 'image/avif' || file.type === 'image/heic' || file.type === 'image/heif') {
                    return await convertImage(file, 'image/jpeg');
                } else {
                    return await fileToBase64(file);
                }
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during file processing.';
                onImageProcessingError(`Failed to process image. ${errorMessage}`);
                return null;
            }
        });

        const newImages = (await Promise.all(newImagesPromises)).filter((img): img is ImageFile => img !== null);
        setSelectedImages(prev => [...prev, ...newImages]);

        if (event.target) event.target.value = '';
    };
    
    const submitMessage = () => {
        if (!(value?.trim()) && selectedImages.length === 0) return;
        
        // Check if this is a tab management command
        const trimmedValue = (value || '').trim();
        if (trimmedValue.toLowerCase().includes('tab') && 
            (trimmedValue.toLowerCase().includes('add') || 
             trimmedValue.toLowerCase().includes('create') || 
             trimmedValue.toLowerCase().includes('modify') || 
             trimmedValue.toLowerCase().includes('edit') || 
             trimmedValue.toLowerCase().includes('delete') || 
             trimmedValue.toLowerCase().includes('remove') || 
             trimmedValue.toLowerCase().includes('move'))) {
            // This looks like a tab management command, send it as a special message
            onSendMessage(`[TAB_MANAGEMENT] ${trimmedValue}`, selectedImages.length > 0 ? selectedImages : undefined);
        } else {
            // Regular message
            onSendMessage(value || '', selectedImages.length > 0 ? selectedImages : undefined);
        }
        
        setSelectedImages([]);
        setShowSuggestions(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (showSuggestions && suggestions.length > 0) {
            handleSelectSuggestion(suggestions[activeSuggestionIndex]);
        } else {
            submitMessage();
        }
    };

    const handleSelectSuggestion = (suggestion: string) => {
        if (suggestionStartPosition === null) return;

        const textBefore = (value || '').substring(0, suggestionStartPosition);
        const textAfter = (value || '').substring(suggestionStartPosition + suggestionQuery.length + 1); // +1 for the @

        const newValue = `${textBefore}@${suggestion} ${textAfter.trimStart()}`;
        onChange(newValue);

        setShowSuggestions(false);
        setTimeout(() => textareaRef?.current?.focus(), 0);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSelectSuggestion(suggestions[activeSuggestionIndex]);
            } else if (e.key === 'Tab') {
                e.preventDefault();
                handleSelectSuggestion(suggestions[activeSuggestionIndex]);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowSuggestions(false);
            }
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitMessage();
        }
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        onChange(newValue);

        if (usage.tier === 'free' || !activeConversation || !activeConversation.insights) {
            setShowSuggestions(false);
            return;
        }

        const cursorPos = e.target.selectionStart;
        const textUpToCursor = newValue.slice(0, cursorPos);
        const atIndex = textUpToCursor.lastIndexOf('@');
        
        // Trigger condition: '@' is at the start of the string or preceded by a space.
        const isTrigger = atIndex !== -1 && (atIndex === 0 || /\s/.test(newValue[atIndex - 1]));

        if (isTrigger) {
            const query = textUpToCursor.substring(atIndex + 1);
            // Don't show suggestions if there's another '@' or a newline after the trigger.
            if (query.includes('@') || query.includes('\n')) {
                setShowSuggestions(false);
                return;
            }

            const insightTitles = activeConversation.insightsOrder
                ? activeConversation.insightsOrder.map(id => activeConversation.insights![id].title)
                : [];

            const filtered = insightTitles.filter(title => title.toLowerCase().includes(query.toLowerCase()));
            
            if (filtered.length > 0) {
                setSuggestions(filtered);
                setActiveSuggestionIndex(0);
                setSuggestionQuery(query);
                setSuggestionStartPosition(atIndex);
                setShowSuggestions(true);
            } else {
                setShowSuggestions(false);
            }
        } else {
            setShowSuggestions(false);
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setSelectedImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };
    
    const isProcessing = isCooldownActive;
    const canSubmit = (!!(value?.trim()) || selectedImages.length > 0) && !isProcessing;
    const showReviewToggle = connectionStatus === ConnectionStatus.CONNECTED;

    const getPlaceholderText = () => {
        if (isProcessing) {
            return "AI is thinking...";
        }
        if (usage.tier !== 'free' && hasInsights) {
            return "Ask or use @ for tabs...";
        }
        return "Ask a question";
    };
    const placeholderText = getPlaceholderText();
    const maxImages = usage.tier !== 'free' ? 5 : 1;

            return (
            <div className="pt-2 sm:pt-3 md:pt-4 pb-[calc(env(safe-area-inset-bottom)+12px)] sm:pb-[calc(env(safe-area-inset-bottom)+16px)] md:pb-[calc(env(safe-area-inset-bottom)+24px)]">
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2 sm:gap-3 md:gap-4">
                {selectedImages.length > 0 && (
                     <div className="flex overflow-x-auto space-x-2 sm:space-x-3 p-2 sm:p-3 scroll-smooth bg-[#1C1C1C]/40 rounded-xl sm:rounded-2xl border border-[#424242]/30">
                        {selectedImages.map((image, index) => (
                            <div key={index} className="relative flex-shrink-0 animate-fade-in group">
                                <img 
                                    src={image.dataUrl} 
                                    alt={`Selected preview ${index + 1}`} 
                                    className="h-16 sm:h-20 md:h-24 w-auto rounded-lg sm:rounded-xl object-cover border-2 border-[#424242]/40 group-hover:border-[#E53A3A]/60 transition-all duration-300 group-hover:scale-105"
                                />
                                <button 
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-xs sm:text-sm font-bold hover:scale-110 transition-all duration-200 shadow-lg hover:shadow-[#E53A3A]/50"
                                    aria-label={`Remove image ${index + 1}`}
                                >
                                    &times;
                                </button>
                                <div className="absolute bottom-1 left-1 bg-black/80 backdrop-blur-sm text-white text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-white/20">
                                    {index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="p-0 bg-transparent rounded-xl sm:rounded-2xl border-2 border-[#424242]/60 focus-within:p-[2px] focus-within:bg-gradient-to-r focus-within:from-[#E53A3A] focus-within:to-[#D98C1F] focus-within:border-transparent focus-within:shadow-[0_0_20px_rgba(229,58,58,0.4)] sm:focus-within:shadow-[0_0_30px_rgba(229,58,58,0.5)] transition-all duration-300">
                    <div className="flex items-center bg-gradient-to-r from-[#1C1C1C] to-[#0A0A0A] rounded-xl sm:rounded-2xl w-full px-2 sm:px-3 md:px-4 gap-2 sm:gap-3 py-1.5 sm:py-2 md:py-2.5">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/png,image/jpeg,image/webp,image/heic,image/heif,image/avif" 
                            multiple={usage.tier !== 'free'} 
                            className="hidden"
                        />
                         <button
                            type="button"
                            onClick={() => fileInputRef?.current?.click()}
                            aria-label="Upload screenshot"
                            disabled={isProcessing || selectedImages.length >= maxImages}
                            className="flex-shrink-0 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg sm:rounded-xl text-[#FF4D4D] hover:bg-[#2E2E2E]/60 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:scale-100 border border-[#424242]/40 hover:border-[#FF4D4D]/40"
                        >
                            <CameraIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5"/>
                        </button>
                        <div className="relative flex-grow flex items-center">
                             {showSuggestions && (
                                <CommandSuggestions
                                    suggestions={suggestions}
                                    activeIndex={activeSuggestionIndex}
                                    onSelect={handleSelectSuggestion}
                                    onHover={setActiveSuggestionIndex}
                                />
                            )}
                            <textarea
                                ref={textareaRef}
                                rows={1}
                                style={{ 
                                    minHeight: '24px', 
                                    height: '24px',
                                    lineHeight: '24px', 
                                    padding: '0',
                                    margin: '0'
                                }}
                                value={value}
                                onChange={handleValueChange}
                                onKeyDown={handleKeyDown}
                                placeholder={placeholderText}
                                className="flex-grow w-full bg-transparent py-0 px-2 sm:px-3 text-[#F5F5F5] placeholder-[#A3A3A3] focus:outline-none resize-none overflow-y-auto disabled:opacity-60 text-xs sm:text-sm md:text-base leading-tight chat-input-textarea"
                                aria-label="Chat input"
                                disabled={isProcessing}
                            />
                        </div>

                        <div className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2">
                            {showReviewToggle && (
                                <ManualUploadToggle
                                    isManualMode={isManualUploadMode}
                                    onToggle={onToggleManualUploadMode}
                                />
                            )}
                            
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                aria-label="Send message"
                                className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg sm:rounded-xl transition-all duration-300 disabled:cursor-not-allowed ${
                                    canSubmit 
                                    ? 'bg-gradient-to-r from-[#FFAB40] to-[#FF8C00] text-[#181818] scale-100 hover:scale-105 hover:shadow-lg hover:shadow-[#FFAB40]/25 active:scale-95 font-semibold' 
                                    : 'bg-[#2E2E2E]/60 text-[#A3A3A3] scale-100 border border-[#424242]/40'
                                }`}
                            >
                                <SendIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
});

export default ChatInput;