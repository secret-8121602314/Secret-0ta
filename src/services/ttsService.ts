import type { ExtendedNavigator, WakeLockSentinel, ExtendedWindow } from '../types/enhanced';

let synth: SpeechSynthesis;
let voices: SpeechSynthesisVoice[] = [];
let isInitialized = false;
let currentText = '';
let wakeLock: WakeLockSentinel | null = null;
let audioContext: AudioContext | null = null;
let silentAudio: HTMLAudioElement | null = null;
let isBackgroundPlayback = false;
let keepAliveInterval: NodeJS.Timeout | null = null;

const SPEECH_RATE_KEY = 'otakonSpeechRate';

// Request Wake Lock to keep screen awake during TTS
const requestWakeLock = async () => {
    try {
        const nav = navigator as ExtendedNavigator;
        if (nav.wakeLock) {
            wakeLock = await nav.wakeLock.request('screen');
            console.log('🔒 [TTS] Wake lock acquired - screen will stay on');
            wakeLock.addEventListener('release', () => {
                console.log('🔓 [TTS] Wake lock released');
                // Automatically reacquire if TTS is still speaking
                if (synth && synth.speaking && !isBackgroundPlayback) {
                    requestWakeLock();
                }
            });
        }
    } catch (err) {
        console.warn('⚠️ [TTS] Wake lock not available:', err);
    }
};

// Release Wake Lock when TTS stops
const releaseWakeLock = async () => {
    try {
        if (wakeLock !== null) {
            await wakeLock.release();
            wakeLock = null;
        }
    } catch (_err) {
            }
};

// Initialize Audio Context with silent audio to maintain background session
const initAudioContext = () => {
    try {
        if (!audioContext) {
            const win = window as ExtendedWindow;
            const AudioContextClass = win.AudioContext || win.webkitAudioContext;
            if (AudioContextClass) {
                audioContext = new AudioContextClass();
                console.log('🔊 [TTS] Audio context initialized');
            }
        }
        
        if (!silentAudio) {
            silentAudio = new Audio();
            // Use a longer silent audio that loops - helps maintain audio session
            // This is a 1-second silent WAV file
            silentAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleShtr9teleShtr9teleShtr9teleShtr9t';
            silentAudio.loop = true;
            silentAudio.volume = 0.01; // Very low volume - just enough to maintain session
            
            // Pre-load the audio
            silentAudio.load();
            console.log('🔇 [TTS] Silent audio initialized for background playback');
        }
    } catch (err) {
        console.warn('⚠️ [TTS] Audio context init failed:', err);
    }
};

// Start silent audio to maintain audio session - more aggressive approach
const startSilentAudio = async () => {
    try {
        // Resume audio context if suspended
        if (audioContext && audioContext.state === 'suspended') {
            await audioContext.resume();
            console.log('🔊 [TTS] Audio context resumed');
        }
        
        // Play silent audio
        if (silentAudio) {
            silentAudio.currentTime = 0;
            await silentAudio.play();
            console.log('🔇 [TTS] Silent audio playing for background session');
        }
        
        // Start keep-alive interval to prevent browser from suspending
        if (!keepAliveInterval) {
            keepAliveInterval = setInterval(() => {
                if (synth && synth.speaking) {
                    // Ping to keep alive - some browsers need periodic activity
                    if (audioContext && audioContext.state === 'suspended') {
                        audioContext.resume().catch(() => {});
                    }
                } else {
                    // TTS stopped, clear interval
                    if (keepAliveInterval) {
                        clearInterval(keepAliveInterval);
                        keepAliveInterval = null;
                    }
                }
            }, 5000); // Check every 5 seconds
        }
    } catch (err) {
        console.warn('⚠️ [TTS] Silent audio start failed:', err);
    }
};

// Stop silent audio when TTS is complete
const stopSilentAudio = () => {
    try {
        if (silentAudio) {
            silentAudio.pause();
            silentAudio.currentTime = 0;
            console.log('🔇 [TTS] Silent audio stopped');
        }
        // Clear keep-alive interval
        if (keepAliveInterval) {
            clearInterval(keepAliveInterval);
            keepAliveInterval = null;
        }
    } catch (err) {
        console.warn('⚠️ [TTS] Silent audio stop failed:', err);
    }
};

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
    currentText = '';
    if ('mediaSession' in navigator && navigator.mediaSession.playbackState !== 'none') {
        navigator.mediaSession.playbackState = 'paused';
    }
    // Release wake lock and stop silent audio
    releaseWakeLock();
    stopSilentAudio();
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('otakon:ttsStopped'));
};

const pause = () => {
    if (synth && synth.speaking && !synth.paused) {
        synth.pause();
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
        }
        window.dispatchEvent(new CustomEvent('otakon:ttsPaused'));
    }
};

const resume = () => {
    if (synth && synth.paused) {
        synth.resume();
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
        }
        window.dispatchEvent(new CustomEvent('otakon:ttsResumed'));
    }
};

const restart = async () => {
    if (currentText) {
        cancel();
        await speak(currentText);
    }
};

const isSpeaking = (): boolean => {
    return synth ? synth.speaking : false;
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

// Handle visibility change to maintain audio in background
const handleVisibilityChange = async () => {
    if (document.hidden) {
        // Screen locked or app backgrounded
        isBackgroundPlayback = true;
        console.log('📱 [TTS] App went to background, isSpeaking:', synth?.speaking);
        
        // Keep silent audio playing to maintain audio session
        if (synth && synth.speaking) {
            await startSilentAudio();
            
            // On some devices, we need to "nudge" the speech synthesis
            // by pausing and resuming to prevent it from stopping
            if (!synth.paused) {
                // Brief pause/resume can help keep TTS alive on some browsers
                setTimeout(() => {
                    if (synth && synth.speaking && !synth.paused) {
                        console.log('📱 [TTS] Nudging speech synthesis to stay alive');
                    }
                }, 100);
            }
        }
    } else {
        // Screen unlocked or app foregrounded
        isBackgroundPlayback = false;
        console.log('📱 [TTS] App came to foreground, isSpeaking:', synth?.speaking);
        
        // Reacquire wake lock if TTS is still speaking
        if (synth && synth.speaking) {
            await requestWakeLock();
        }
    }
};

const init = async () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (isInitialized) {
          return;
        }
        isInitialized = true;
        synth = window.speechSynthesis;
        await populateVoiceList();
        setupMediaSession();
        // Initialize audio context for background playback
        initAudioContext();
        // Setup visibility change listener for background playback
        document.addEventListener('visibilitychange', handleVisibilityChange);
        // On some browsers (like Chrome on desktop), getVoices() is empty until speak() is called.
        // This empty utterance is a workaround to trigger the onvoiceschanged event.
        if (synth.getVoices().length === 0) {
            synth.speak(new SpeechSynthesisUtterance(''));
        }
    } else {
            }
};

const getAvailableVoices = (): SpeechSynthesisVoice[] => {
    return voices.filter(v => v.lang.startsWith('en-'));
};

const speak = async (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        try {
            if (!synth) {
                console.error("Text-to-Speech is not available on this browser.");
                return reject(new Error("Text-to-Speech is not available on this browser."));
            }
            
            if (!text.trim()) {
                return resolve();
            }

            cancel(); // Cancel any ongoing speech

            currentText = text; // Store for restart functionality
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

            utterance.onstart = async () => {
                // Request wake lock and start silent audio for background playback
                await requestWakeLock();
                await startSilentAudio();
                
                // Notify service worker that TTS started
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'TTS_STARTED'
                    });
                }
                
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.playbackState = 'playing';
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: text.length > 50 ? text.substring(0, 50) + '...' : text,
                        artist: 'Your AI Gaming Companion',
                        album: 'Otakon',
                        artwork: [
                            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
                            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
                        ]
                    });
                }
                window.dispatchEvent(new CustomEvent('otakon:ttsStarted'));
            };

            utterance.onend = () => {
                currentText = '';
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.playbackState = 'paused';
                }
                // Notify service worker that TTS stopped
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'TTS_STOPPED'
                    });
                }
                // Release wake lock and stop silent audio when TTS completes
                releaseWakeLock();
                stopSilentAudio();
                window.dispatchEvent(new CustomEvent('otakon:ttsStopped'));
                resolve();
            };
            
            utterance.onerror = (e) => {
                console.error("SpeechSynthesis Utterance Error", e);
                cancel();
                reject(e);
            };

            synth.speak(utterance);
        } catch (error) {
            console.error("TTS Error:", error);
            reject(error);
        }
    });
};

export const ttsService = {
    init,
    getAvailableVoices,
    speak,
    cancel,
    pause,
    resume,
    restart,
    isSpeaking,
};

