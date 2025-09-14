import { getTier } from './unifiedUsageService';
import { supabaseDataService } from './supabaseDataService';

let synth: SpeechSynthesis;
let voices: SpeechSynthesisVoice[] = [];
let isInitialized = false;

const SPEECH_RATE_KEY = 'otakonSpeechRate';

// Function to populate voices, returns a promise that resolves when voices are loaded.
const populateVoiceList = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!synth) {
            return reject(new Error("Speech synthesis not initialized."));
        }
        voices = synth.getVoices();
        if (voices.length > 0) {
            resolve();
            return;
        }
        synth.onvoiceschanged = () => {
            voices = synth.getVoices();
            resolve();
        };
        // Fallback timeout in case onvoiceschanged never fires
        setTimeout(() => {
            if (voices.length === 0) {
                console.warn("TTS voices did not load within a reasonable time.");
                voices = synth.getVoices(); // Try one last time
            }
            resolve();
        }, 1000);
    });
};

const cancel = () => {
    if (synth && synth.speaking) {
        synth.cancel();
    }
    if ('mediaSession' in navigator && navigator.mediaSession.playbackState !== 'none') {
        navigator.mediaSession.playbackState = 'paused';
    }
};

const cancelAndDisableHandsFree = () => {
    cancel();
    window.dispatchEvent(new CustomEvent('otakon:disableHandsFree'));
};

const setupMediaSession = () => {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => { /* Let audio play naturally */ });
        navigator.mediaSession.setActionHandler('pause', cancelAndDisableHandsFree);
        navigator.mediaSession.setActionHandler('stop', cancelAndDisableHandsFree);
    }
};

const init = async () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (isInitialized) return;
        isInitialized = true;
        synth = window.speechSynthesis;
        await populateVoiceList();
        setupMediaSession();
        // On some browsers (like Chrome on desktop), getVoices() is empty until speak() is called.
        // This empty utterance is a workaround to trigger the onvoiceschanged event.
        if (synth.getVoices().length === 0) {
            synth.speak(new SpeechSynthesisUtterance(''));
        }
    } else {
        console.warn("Speech Synthesis not supported in this browser.");
    }
};

const getAvailableVoices = (): SpeechSynthesisVoice[] => {
    return voices.filter(v => v.lang.startsWith('en-'));
};

const speak = async (text: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const tier = await getTier();
            if (tier !== 'pro') {
                const error = new Error("Hands-Free mode is a Pro feature.");
                console.warn(error.message);
                return reject(error);
            }
            
            if (!synth) {
                const error = new Error("Text-to-Speech is not available on this browser.");
                console.error(error.message);
                return reject(error);
            }
            if (!text.trim()) {
                return resolve();
            }

            cancel(); // Cancel any ongoing speech

            const utterance = new SpeechSynthesisUtterance(text);
            const storedRate = localStorage.getItem(SPEECH_RATE_KEY);
            utterance.rate = storedRate ? parseFloat(storedRate) : 0.94; // Use stored rate or default to 94%
            
            const preferredVoiceURI = localStorage.getItem('otakonPreferredVoiceURI');
            
            const availableVoices = getAvailableVoices();
            let voiceToUse: SpeechSynthesisVoice | undefined;

            if (preferredVoiceURI) {
                voiceToUse = availableVoices.find(v => v.voiceURI === preferredVoiceURI);
            }
            
            // If no preferred voice is set or the saved one is no longer available
            if (!voiceToUse && availableVoices.length > 0) {
                // Prioritize voices with "Female" in the name as a default.
                const femaleVoice = availableVoices.find(v => v.name.toLowerCase().includes('female'));
                if (femaleVoice) {
                    voiceToUse = femaleVoice;
                } else {
                    // As a fallback, use the first available voice.
                    voiceToUse = availableVoices[0];
                }
            }

            if (voiceToUse) {
                utterance.voice = voiceToUse;
            }

            utterance.onstart = () => {
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.playbackState = 'playing';
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: 'Otakon Hint',
                        artist: 'Your AI Gaming Companion',
                        album: 'Otakon',
                        artwork: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }]
                    });
                }
            };

            utterance.onend = () => {
                cancel();
                resolve();
            };
            
            utterance.onerror = (e) => {
                console.error("SpeechSynthesis Utterance Error", e);
                cancel();
                reject(e);
            };

            synth.speak(utterance);
        } catch (error) {
            reject(error);
        }
    });
};

// Helper functions to get/set TTS preferences from Supabase
const getTtsPreferences = async (): Promise<{ speechRate: string | null; preferredVoiceURI: string | null }> => {
    try {
        const preferences = await supabaseDataService.getUserPreferences();
        return {
            speechRate: preferences.tts?.speechRate || null,
            preferredVoiceURI: preferences.tts?.preferredVoiceURI || null
        };
    } catch (error) {
        console.warn('Failed to get TTS preferences from Supabase, using localStorage fallback:', error);
        return {
            speechRate: localStorage.getItem(SPEECH_RATE_KEY),
            preferredVoiceURI: localStorage.getItem('otakonPreferredVoiceURI')
        };
    }
};

const setTtsPreferences = async (speechRate?: string, preferredVoiceURI?: string): Promise<void> => {
    try {
        const currentPreferences = await supabaseDataService.getUserPreferences();
        const ttsPreferences = {
            ...currentPreferences.tts,
            ...(speechRate !== undefined && { speechRate }),
            ...(preferredVoiceURI !== undefined && { preferredVoiceURI })
        };
        
        await supabaseDataService.updateUserPreferences('tts', ttsPreferences);
        
        // Also update localStorage as backup
        if (speechRate !== undefined) {
            localStorage.setItem(SPEECH_RATE_KEY, speechRate);
        }
        if (preferredVoiceURI !== undefined) {
            localStorage.setItem('otakonPreferredVoiceURI', preferredVoiceURI);
        }
        
        console.log('✅ TTS preferences updated in Supabase');
    } catch (error) {
        console.warn('Failed to update TTS preferences in Supabase, using localStorage fallback:', error);
        // Fallback to localStorage only
        if (speechRate !== undefined) {
            localStorage.setItem(SPEECH_RATE_KEY, speechRate);
        }
        if (preferredVoiceURI !== undefined) {
            localStorage.setItem('otakonPreferredVoiceURI', preferredVoiceURI);
        }
    }
};

export const ttsService = {
    init,
    getAvailableVoices,
    speak,
    cancel,
    getTtsPreferences,
    setTtsPreferences,
};