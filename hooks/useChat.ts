import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChatMessage, Conversations, Conversation, newsPrompts, Insight, insightTabsConfig, InsightStatus, PendingInsightModification, ChatMessageFeedback, TaskCompletionPrompt, DetectedTask } from '../services/types';
import { enhancedErrorHandlingService, ChatErrorContext } from '../services/enhancedErrorHandlingService';
import { authService, supabase } from '../services/supabase';
// Removed databaseService - not used in useChat
import { secureConversationService } from '../services/secureConversationService';
import { welcomeMessageService } from '../services/welcomeMessageService';
import { ttsService } from '../services/ttsService';
import { contextManagementService } from '../services/contextManagementService';
import { playerProfileService } from '../services/playerProfileService';
import { taskCompletionPromptingService } from '../services/taskCompletionPromptingService';
import { simpleCacheService } from '../services/simpleCacheService';
// Removed smartNotificationService - not used in useChat
import { screenshotTimelineService } from '../services/screenshotTimelineService';
import { longTermMemoryService } from '../services/longTermMemoryService';
// Removed unifiedAIService - not used in useChat
import { otakuDiaryService } from '../services/otakuDiaryService';
import tabManagementService from '../services/tabManagementService';
// Import the unifiedAIService instance
import { unifiedAIService } from '../services/unifiedAIService';
// Dynamic imports to avoid circular dependencies
// Services are now imported statically at the top of the file

// Services will be initialized on-demand when useChat is called
// initializeServices(); // Removed to prevent initialization on landing page

// Constants
const KNOWLEDGE_CUTOFF_LABEL = 'April 2024';
// import tabManagementService from '../services/tabManagementService';
// import { ttsService } from '../services/ttsService';
// Static imports to replace dynamic imports for Firebase hosting compatibility
import { gameKnowledgeService } from '../services/gameKnowledgeService';
// import { taskCompletionPromptingService } from '../services/taskCompletionPromptingService';
// Removed unifiedCacheService - was mostly stub implementation
// import { KNOWLEDGE_CUTOFF_LABEL } from '../services/constants';
// import { screenshotTimelineService } from '../services/screenshotTimelineService';
// Removed unifiedAIService - not used in useChat
// import { otakuDiaryService } from '../services/otakuDiaryService';
import { unifiedUsageService } from '../services/unifiedUsageService';
import { supabaseDataService } from '../services/supabaseDataService';
// Removed unifiedAnalyticsService - not used in useChat
// import { analyticsService } from '../services/analyticsService'; // Deleted - using unifiedAnalyticsService
// import { playerProfileService } from '../services/playerProfileService';
// import { contextManagementService } from '../services/contextManagementService';
// import { longTermMemoryService } from '../services/longTermMemoryService';
// Removed databaseService - not used in useChat

const COOLDOWN_KEY = 'geminiCooldownEnd';
const COOLDOWN_DURATION = 60 * 60 * 1000; // 1 hour

const EVERYTHING_ELSE_ID = 'everything-else';
const CONVERSATIONS_STORAGE_KEY = 'otakonConversations';

type ImageFile = { base64: string; mimeType: string; dataUrl: string };

const generateGameId = (gameName: string) => {
    return gameName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

const allOtakonTags = [
    'GAME_ID', 'CONFIDENCE', 'GAME_PROGRESS', 'GENRE',
    'GAME_IS_UNRELEASED', 'TRIUMPH', 'INVENTORY_ANALYSIS',
    'INSIGHT_UPDATE', 'SUGGESTIONS',
    'INSIGHT_MODIFY_PENDING', 'INSIGHT_DELETE_REQUEST',
    'OBJECTIVE_SET', 'OBJECTIVE_COMPLETE'
];

// More comprehensive regex to catch all possible tags and IDs that should be hidden
const tagCleanupRegex = new RegExp(`\\[OTAKON_(${allOtakonTags.join('|')}):.*?\\]`, 'gs');
const comprehensiveTagCleanupRegex = new RegExp(
    // OTAKON tags - only remove specific OTAKON internal tags
    `\\[OTAKON_(${allOtakonTags.join('|')}):.*?\\]|` +
    // Any other OTAKON tags not in the list
    `\\[OTAKON_[^\\]]*\\]|` +
    // Specific internal ID patterns (be more specific)
    `\\[ID:[A-Z0-9_-]+\\]|` +
    `\\[TAG:[A-Z0-9_-]+\\]|` +
    `\\[META:[A-Z0-9_-]+\\]|` +
    `\\[DEBUG:[A-Z0-9_-]+\\]|` +
    `\\[SYSTEM:[A-Z0-9_-]+\\]|` +
    // Handle incomplete streaming tags (tags that end without closing bracket)
    `\\[OTAKON_[^\\]]*$|` +
    `\\[ID:[A-Z0-9_-]*$|` +
    `\\[TAG:[A-Z0-9_-]*$|` +
    `\\[META:[A-Z0-9_-]*$|` +
    `\\[DEBUG:[A-Z0-9_-]*$|` +
    `\\[SYSTEM:[A-Z0-9_-]*$`,
    'gs'
);


const sortConversations = (conversations: Conversations) => (aId: string, bId: string): number => {
    const a = conversations[aId];
    const b = conversations[bId];

    if (!a || !b) return 0;

    if (a.id === EVERYTHING_ELSE_ID) return -1;
    if (b.id === EVERYTHING_ELSE_ID) return 1;

    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    const aTimestamp = a.lastInteractionTimestamp || a.createdAt;
    const bTimestamp = b.lastInteractionTimestamp || b.createdAt;
    return bTimestamp - aTimestamp;
};


export const useChat = (isHandsFreeMode: boolean, refreshUsage?: () => Promise<void>) => {
    // Services are now imported statically, no initialization needed

    // ===== HELPER FUNCTIONS FOR UNIVERSAL AI RESPONSE =====
    
    /**
     * Set suggested prompts for UI display
     */
    const setSuggestedPrompts = useCallback((prompts: string[]) => {
        // This will be handled by the parent component that manages suggested prompts
        console.log('💡 Suggested prompts updated:', prompts);
        // TODO: Implement proper state management for suggested prompts
    }, []);

    /**
     * Process state update tags from AI response
     */
    const processStateUpdateTags = useCallback((tags: string[]) => {
        tags.forEach(tag => {
            if (tag.includes('OBJECTIVE_COMPLETE')) {
                console.log('✅ Objective completed:', tag);
                // TODO: Update game state to reflect objective completion
            } else if (tag.includes('TRIUMPH')) {
                console.log('🏆 Boss defeated:', tag);
                // TODO: Update game state to reflect boss defeat
            } else {
                console.log('🏷️ State update:', tag);
                // TODO: Handle other state updates
            }
        });
    }, []);

    const [chatState, setChatState] = useState<{ 
        conversations: Conversations, 
        order: string[],
        activeId: string,
    }>({
        conversations: {},
        order: [],
        activeId: EVERYTHING_ELSE_ID,
    });
    const { conversations, order: conversationsOrder, activeId: activeConversationId } = chatState;
    
    // DEBUG: Log chatState changes
    useEffect(() => {
        console.log('🔧 [useChat] chatState updated:');
        console.log('  - conversationCount:', Object.keys(chatState.conversations).length);
        console.log('  - conversationIds:', Object.keys(chatState.conversations));
        console.log('  - order:', chatState.order);
        console.log('  - activeId:', chatState.activeId);
        console.log('  - conversations:', chatState.conversations);
    }, [chatState]);
    
    const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
    const [isCooldownActive, setIsCooldownActive] = useState(false);
    const [activeSubView, setActiveSubView] = useState<string>('chat');
    const [pendingModification, setPendingModification] = useState<PendingInsightModification | null>(null);
    const abortControllersRef = useRef<Record<string, AbortController>>({});
    const hasLoggedUnauthenticatedRef = useRef(false);
    
    // ✅ MEMORY LEAK FIXES: Track resources for cleanup
    const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());
    const eventListenersRef = useRef<Map<string, () => void>>(new Map());
    
    // Use refs to avoid unnecessary re-renders and memory leaks
    const conversationsRef = useRef(conversations);
    const conversationsOrderRef = useRef(conversationsOrder);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isSavingRef = useRef(false);
    
    // Update refs only when values actually change
    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);
    
    useEffect(() => {
        conversationsOrderRef.current = conversationsOrder;
    }, [conversationsOrder]);
    
    // Use the imported atomic conversation service directly

    // Debounced save function with race condition protection
    const debouncedSave = useCallback(async (conversations: Conversations) => {
        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Prevent concurrent saves
        if (isSavingRef.current) {
            return;
        }

        // Check if user is authenticated before saving
        const authState = authService.getCurrentState();
        if (!authState.user) {
            // Only log once per session to reduce console noise
            if (!hasLoggedUnauthenticatedRef.current) {
                console.log('🔐 User not authenticated, skipping conversation save');
                hasLoggedUnauthenticatedRef.current = true;
            }
            return;
        }

        saveTimeoutRef.current = setTimeout(async () => {
            isSavingRef.current = true;
            try {
                // First, save to localStorage as backup
                try {
                    localStorage.setItem('otakon_conversations', JSON.stringify(conversations));
                    console.log('💾 Conversations saved to localStorage backup');
                } catch (localError) {
                    console.warn('Failed to save conversations to localStorage:', localError);
                }
                
                // Then save each conversation individually to Supabase
                for (const [conversationId, conversation] of Object.entries(conversations)) {
                    try {
                        console.log('🔧 [useChat] debouncedSave - Saving conversation:', {
                            conversationId,
                            title: conversation.title,
                            messages: conversation.messages,
                            messageCount: Array.isArray(conversation.messages) ? conversation.messages.length : 'not array',
                            messagesType: typeof conversation.messages
                        });
                        
                        const result = await secureConversationService.saveConversation(
                            conversationId,
                            conversation.title,
                            conversation.messages,
                            conversation.insights ? Object.values(conversation.insights) : [],
                            { 
                                progress: conversation.progress,
                                genre: conversation.genre,
                                inventory: conversation.inventory,
                                activeObjective: conversation.activeObjective,
                                lastTrailerTimestamp: conversation.lastTrailerTimestamp,
                                lastInteractionTimestamp: conversation.lastInteractionTimestamp,
                                isPinned: conversation.isPinned
                            }
                        );
                        
                        if (!result.success) {
                            console.warn(`Failed to save conversation ${conversationId} to Supabase:`, result.error);
                        } else {
                            console.log(`✅ Conversation ${conversationId} saved to Supabase`);
                        }
                    } catch (convError) {
                        console.error(`Error saving conversation ${conversationId}:`, convError);
                    }
                }
            } catch (error) {
                console.error('Failed to save conversations:', error);
            } finally {
                isSavingRef.current = false;
            }
        }, 500); // 500ms debounce
    }, [secureConversationService]);

    // Legacy functions for backward compatibility (deprecated)
    const saveConversationToSupabase = useCallback(async () => {
        console.warn('saveConversationToSupabase is deprecated. Use secureConversationService instead.');
        
        // Check if user is authenticated before saving
        const authState = authService.getCurrentState();
        if (!authState.user) {
            console.log('🔐 User not authenticated, skipping conversation save');
            return;
        }
        
        try {
            // Save each conversation individually
            for (const [conversationId, conversation] of Object.entries(conversations)) {
                await secureConversationService.saveConversation(
                    conversationId,
                    conversation.title,
                    conversation.messages,
                    conversation.insights ? Object.values(conversation.insights) : [],
                    { 
                        progress: conversation.progress,
                        genre: conversation.genre,
                        inventory: conversation.inventory,
                        activeObjective: conversation.activeObjective,
                        lastTrailerTimestamp: conversation.lastTrailerTimestamp,
                        lastInteractionTimestamp: conversation.lastInteractionTimestamp,
                        isPinned: conversation.isPinned
                    }
                );
            }
        } catch (error) {
            console.warn('Failed to save conversations to Supabase:', error);
        }
    }, [conversations, secureConversationService]);
    
    const saveConversationToLocalStorage = useCallback(() => {
        try {
            // Save conversations to localStorage for persistence in developer mode
            const conversationsToSave = {
                ...conversations,
                // Ensure we have the everything-else conversation
                [EVERYTHING_ELSE_ID]: conversations[EVERYTHING_ELSE_ID] || {
                    id: EVERYTHING_ELSE_ID,
                    title: 'Everything else',
                    messages: [],
                    createdAt: Date.now(),
                }
            };
            
            localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversationsToSave));
            localStorage.setItem('otakon_conversations_order', JSON.stringify(conversationsOrder));
            localStorage.setItem('otakon_active_conversation', activeConversationId);
            console.log('💾 Conversations saved to localStorage');
        } catch (error) {
            console.warn('Failed to save conversations to localStorage:', error);
        }
    }, [conversations, conversationsOrder, activeConversationId]);

    // Load conversations using atomic service
    useEffect(() => {
        let isMounted = true;
        
        const loadConversations = async () => {
            try {
                // CRITICAL FIX: Simplified auth state check - single check with timeout
                const authState = authService.getCurrentState();
                
                // If auth is still loading, wait briefly then proceed
                if (authState.loading) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
                
                // Always create default conversation for immediate chat access
                // Check if we need to add a welcome message for authenticated users
                const isDevMode = localStorage.getItem('otakon_developer_mode') === 'true';
                const welcomeAddedThisSession = sessionStorage.getItem('otakon_welcome_added_session');
                const devWelcomeShown = isDevMode && localStorage.getItem('otakon_dev_welcome_message_shown') === 'true';
                const shouldAddWelcome = authState.user && !welcomeAddedThisSession && !devWelcomeShown;
                
                const welcomeMessage = shouldAddWelcome ? {
                    id: crypto.randomUUID(),
                    role: 'model' as const,
                    text: 'Welcome to Otagon! I\'m your AI gaming assistant, here to help you get unstuck in games with hints, not spoilers. Upload screenshots, ask questions, or connect your PC for instant help while playing!',
                    metadata: { type: 'welcome' }
                } : null;
                
                const defaultConversations = {
                    [EVERYTHING_ELSE_ID]: {
                        id: EVERYTHING_ELSE_ID,
                        title: 'Everything else',
                        messages: welcomeMessage ? [welcomeMessage] : [],
                        insights: {},
                        insightsOrder: [],
                        context: {},
                        createdAt: Date.now(),
                        isPinned: false
                    }
                };
                
                // Mark welcome message as added if we added it
                if (shouldAddWelcome) {
                    sessionStorage.setItem('otakon_welcome_added_session', 'true');
                    if (isDevMode) {
                        localStorage.setItem('otakon_dev_welcome_message_shown', 'true');
                        localStorage.setItem('otakon_dev_welcome_message_time', new Date().toISOString());
                        console.log('🔧 [useChat] Developer mode: Welcome message tracking updated in localStorage');
                    }
                    console.log('🔧 [useChat] Welcome message added to default conversation');
                }
                
                // Set default state immediately
                if (isMounted) {
                    setChatState({
                        conversations: defaultConversations,
                        order: [EVERYTHING_ELSE_ID],
                        activeId: EVERYTHING_ELSE_ID
                    });
                    console.log('🔧 [useChat] setChatState called - default conversation created immediately:');
                    console.log('  - conversations:', defaultConversations);
                    console.log('  - order:', [EVERYTHING_ELSE_ID]);
                    console.log('  - activeId:', EVERYTHING_ELSE_ID);
                    console.log('💬 [useChat] Default conversation created immediately');

                    // Ensure welcome message exists (idempotent, race-safe) and tracked
                    try {
                        await welcomeMessageService.ensureInserted(EVERYTHING_ELSE_ID, 'Everything else');
                    } catch (e) {
                        console.warn('Failed to ensure welcome message insertion:', e);
                    }
                }
                
                // If user is not authenticated, try to restore from localStorage for developer mode
                if (!authState.user) {
                    // Check if we're in developer mode with an active session
                    const isDevMode = localStorage.getItem('otakon_developer_mode') === 'true';
                    const devSessionStart = localStorage.getItem('otakon_dev_session_start');
                    const hasActiveDevSession = devSessionStart && (Date.now() - parseInt(devSessionStart, 10)) < (24 * 60 * 60 * 1000); // 24 hours
                    
                    if (isDevMode && hasActiveDevSession) {
                        console.log('🔧 [useChat] Developer mode with active session detected, loading from localStorage');
                        try {
                            const devData = localStorage.getItem('otakon_dev_data');
                            if (devData) {
                                const parsedData = JSON.parse(devData);
                                if (parsedData.conversations && Object.keys(parsedData.conversations).length > 0) {
                                    const conversations = parsedData.conversations;
                                    const order = parsedData.conversationsOrder || Object.keys(conversations);
                                    const activeId = parsedData.activeConversation || order[0] || EVERYTHING_ELSE_ID;
                                    
                                    if (isMounted) {
                                        setChatState({
                                            conversations: conversations as any,
                                            order,
                                            activeId
                                        });
                                        console.log('💾 [useChat] Developer conversations loaded from localStorage');
                                    }
                                }
                            }
                        } catch (error) {
                            console.warn('Failed to load developer conversations from localStorage:', error);
                        }
                    } else {
                        // Only log once per session to reduce console noise
                        if (!hasLoggedUnauthenticatedRef.current) {
                            console.log('🔐 User not authenticated, using default conversation');
                            hasLoggedUnauthenticatedRef.current = true;
                        }
                    }
                    return;
                }
                
                // For authenticated users, load conversations from Supabase
                if (authState.user) {
                        console.log('🔐 User signed in, loading conversations...');
                        
                        try {
                            const result = await secureConversationService.loadConversations();
                        
                        console.log('🔐 Conversation loading result:', {
                            success: result.success,
                            hasConversations: !!result.conversations,
                            conversationCount: result.conversations ? Object.keys(result.conversations).length : 0,
                            error: result.error
                        });
                        
                        // If loading failed, preserve existing conversations and don't create new ones
                        if (!result.success) {
                            console.log('🔧 [useChat] Conversation loading failed, preserving existing conversations:', result.error);
                            return; // Exit early to preserve existing conversations
                        }
                        
                        if (isMounted && result.success && result.conversations) {
                            const conversations = result.conversations as any; // Type cast to handle interface mismatch
                            
                            console.log('🔧 [useChat] Processing loaded conversations:', {
                                conversationCount: Object.keys(conversations).length,
                                conversationIds: Object.keys(conversations),
                                conversations: conversations
                            });
                            
                            // CRITICAL FIX: If Supabase returns empty conversations, preserve existing ones
                            if (Object.keys(conversations).length === 0) {
                                console.log('🔧 [useChat] Supabase returned empty conversations, preserving existing...');
                                console.log('🔧 [useChat] Current conversations before preservation:', Object.keys(chatState.conversations));
                                
                                // Don't overwrite existing conversations if we have them
                                if (Object.keys(chatState.conversations).length > 0) {
                                    console.log('🔧 [useChat] Preserving existing conversations, skipping empty overwrite');
                                    return; // Exit early to preserve existing conversations
                                }
                                
                                // Only create default if we truly have no conversations AND we're not in the middle of loading
                                console.log('🔧 [useChat] No existing conversations, checking if we should create default...');
                                
                                // Check if we already have a default conversation in the state
                                if (chatState.conversations[EVERYTHING_ELSE_ID]) {
                                    console.log('🔧 [useChat] Default conversation already exists in state, not creating new one');
                                    return;
                                }
                                
                                const welcomeAddedThisSession = sessionStorage.getItem('otakon_welcome_added_session');
                                if (!welcomeAddedThisSession) {
                                    const welcomeMessage: ChatMessage = {
                                        id: crypto.randomUUID(),
                                        role: 'model' as const,
                                        text: 'Welcome to Otagon! I\'m your AI gaming assistant, here to help you get unstuck in games with hints, not spoilers. Upload screenshots, ask questions, or connect your PC for instant help while playing!'
                                    };
                                    
                                    const defaultConversations = {
                                        [EVERYTHING_ELSE_ID]: {
                                            id: EVERYTHING_ELSE_ID,
                                            title: 'Everything else',
                                            messages: [welcomeMessage],
                                            insights: {},
                                            insightsOrder: [],
                                            context: {},
                                            createdAt: Date.now(),
                                            isPinned: false
                                        }
                                    };
                                    
                                    setChatState({
                                        conversations: defaultConversations,
                                        order: [EVERYTHING_ELSE_ID],
                                        activeId: EVERYTHING_ELSE_ID
                                    });
                                    
                                    // Mark that we've added a welcome message this session
                                    sessionStorage.setItem('otakon_welcome_added_session', 'true');
                                    
                                    // Update welcome message shown in Supabase (but don't block on this)
                                    try {
                                        await supabaseDataService.updateWelcomeMessageShown('returning_user');
                                    } catch (error) {
                                        console.warn('Failed to update welcome message tracking:', error);
                                    }
                                }
                                return; // Exit early after creating default
                            }
                            
                            // CRITICAL FIX: Ensure we always have a default conversation with welcome message
                            if (!conversations[EVERYTHING_ELSE_ID] || 
                                (conversations[EVERYTHING_ELSE_ID] && 
                                 (!conversations[EVERYTHING_ELSE_ID].messages || 
                                  conversations[EVERYTHING_ELSE_ID].messages.length === 0))) {
                                
                                console.log('🔧 [useChat] Ensuring default conversation with welcome message exists...');
                                
                                const welcomeAddedThisSession = sessionStorage.getItem('otakon_welcome_added_session');
                                if (!welcomeAddedThisSession) {
                                    const welcomeMessage: ChatMessage = {
                                        id: crypto.randomUUID(),
                                        role: 'model' as const,
                                        text: 'Welcome to Otagon! I\'m your AI gaming assistant, here to help you get unstuck in games with hints, not spoilers. Upload screenshots, ask questions, or connect your PC for instant help while playing!'
                                    };
                                    
                                    conversations[EVERYTHING_ELSE_ID] = {
                                        id: EVERYTHING_ELSE_ID,
                                        title: 'Everything else',
                                        messages: [welcomeMessage],
                                        insights: {},
                                        insightsOrder: [],
                                        context: {},
                                        createdAt: Date.now(),
                                        isPinned: false
                                    };
                                    
                                    // Mark that we've added a welcome message this session
                                    sessionStorage.setItem('otakon_welcome_added_session', 'true');
                                    
                                    console.log('🔧 [useChat] Welcome message added to loaded conversations');
                                    
                                    // Try to save the conversation
                                    try {
                                        await secureConversationService.saveConversation(
                                            EVERYTHING_ELSE_ID,
                                            'Everything Else',
                                            [welcomeMessage],
                                            [],
                                            {},
                                            undefined,
                                            false,
                                            true
                                        );
                                        console.log('🔧 [useChat] Welcome message conversation saved to database');
                                    } catch (saveError) {
                                        console.error('Failed to save welcome message conversation:', saveError);
                                    }
                                }
                            }
                            
                            // Restore insights from localStorage for Pro/Vanguard users if missing
                            for (const [conversationId, conversation] of Object.entries(conversations)) {
                                const conv = conversation as any;
                                if (conv.id !== EVERYTHING_ELSE_ID && (!conv.insights || Object.keys(conv.insights).length === 0)) {
                                    try {
                                        const insightsBackup = localStorage.getItem(`otakon_insights_${conversationId}`);
                                        if (insightsBackup) {
                                            const parsedInsights = JSON.parse(insightsBackup);
                                            if (parsedInsights.insights && Object.keys(parsedInsights.insights).length > 0) {
                                                conv.insights = parsedInsights.insights;
                                                conv.insightsOrder = parsedInsights.insightsOrder;
                                                console.log(`✅ Insights restored from localStorage for conversation: ${conversationId}`, Object.keys(parsedInsights.insights).length, 'tabs');
                                            }
                                        }
                                    } catch (error) {
                                        console.warn(`Failed to restore insights for conversation ${conversationId}:`, error);
                                    }
                                }
                            }
                            
                            const order = Object.keys(conversations).sort(sortConversations(conversations));
                            
                            // Preserve current active conversation if it still exists, otherwise use first available
                            const currentActiveId = chatState.activeId;
                            const activeId = (currentActiveId && conversations[currentActiveId]) 
                                ? currentActiveId 
                                : (order.length > 0 ? order[0]! : EVERYTHING_ELSE_ID);
                            
                            console.log('🔧 [useChat] Setting chat state with processed conversations:', {
                                conversationCount: Object.keys(conversations).length,
                                conversationIds: Object.keys(conversations),
                                order,
                                currentActiveId,
                                preservedActiveId: activeId
                            });
                            
                            setChatState({
                                conversations: conversations,
                                order,
                                activeId
                            });
                            console.log('🔧 [useChat] setChatState called with:');
                            console.log('  - conversationCount:', Object.keys(conversations).length);
                            console.log('  - conversationIds:', Object.keys(conversations));
                            console.log('  - order:', order);
                            console.log('  - activeId:', activeId);
                            console.log('  - conversations:', conversations);
                            console.log('✅ Conversations loaded from Supabase:', Object.keys(conversations).length);
                            
                            // CRITICAL FIX: Ensure welcome message exists after loading conversations
                            try {
                                await welcomeMessageService.ensureInserted(EVERYTHING_ELSE_ID, 'Everything else');
                                console.log('🔧 [useChat] Welcome message ensured after loading conversations');
                            } catch (welcomeError) {
                                console.warn('Failed to ensure welcome message after loading conversations:', welcomeError);
                            }
                        } else if (isMounted && result.success && (!result.conversations || Object.keys(result.conversations).length === 0)) {
                            // No conversations found in Supabase, but user is authenticated
                            // PRESERVE existing conversations instead of overwriting with empty
                            console.log('🔧 [useChat] No conversations found in Supabase, preserving existing conversations...');
                            console.log('🔧 [useChat] Current conversations before preservation:', Object.keys(chatState.conversations));
                            
                            // Don't overwrite existing conversations if we have them
                            if (Object.keys(chatState.conversations).length > 0) {
                                console.log('🔧 [useChat] Preserving existing conversations, skipping empty overwrite');
                                return; // Exit early to preserve existing conversations
                            }
                            
                            // Only create default if we truly have no conversations
                            console.log('🔧 [useChat] No existing conversations, creating default with welcome message...');
                            
                            // Use welcomeMessageService to ensure proper welcome message handling
                            try {
                                await welcomeMessageService.ensureInserted(EVERYTHING_ELSE_ID, 'Everything else');
                                console.log('🔧 [useChat] Welcome message ensured for new user');
                                
                                // Reload conversations to get the welcome message that was just created
                                const reloadResult = await secureConversationService.loadConversations();
                                if (reloadResult.success && reloadResult.conversations) {
                                    const conversations = reloadResult.conversations as any;
                                    const order = Object.keys(conversations);
                                    const activeId = EVERYTHING_ELSE_ID;
                                    
                                    setChatState({
                                        conversations,
                                        order,
                                        activeId
                                    });
                                    console.log('🔧 [useChat] Conversations reloaded with welcome message');
                                }
                            } catch (welcomeError) {
                                console.error('Failed to ensure welcome message for new user:', welcomeError);
                            }
                        } else {
                            // Loading failed, try to restore from localStorage as fallback
                            console.warn('⚠️ Failed to load conversations from Supabase, trying localStorage fallback');
                            try {
                                const fallbackData = localStorage.getItem('otakon_conversations');
                                if (fallbackData) {
                                    const parsedData = JSON.parse(fallbackData);
                                    if (parsedData && Object.keys(parsedData).length > 0) {
                                        const conversations = parsedData as any;
                                        
                                        // Restore insights from localStorage for Pro/Vanguard users
                                        for (const [conversationId, conversation] of Object.entries(conversations)) {
                                            const conv = conversation as any;
                                            if (conv.id !== EVERYTHING_ELSE_ID && (!conv.insights || Object.keys(conv.insights).length === 0)) {
                                                try {
                                                    const insightsBackup = localStorage.getItem(`otakon_insights_${conversationId}`);
                                                    if (insightsBackup) {
                                                        const parsedInsights = JSON.parse(insightsBackup);
                                                        if (parsedInsights.insights && Object.keys(parsedInsights.insights).length > 0) {
                                                            conv.insights = parsedInsights.insights;
                                                            conv.insightsOrder = parsedInsights.insightsOrder;
                                                            console.log(`✅ Insights restored from localStorage fallback for conversation: ${conversationId}`, Object.keys(parsedInsights.insights).length, 'tabs');
                                                        }
                                                    }
                                                } catch (error) {
                                                    console.warn(`Failed to restore insights fallback for conversation ${conversationId}:`, error);
                                                }
                                            }
                                        }
                                        
                                        const order = Object.keys(conversations).sort(sortConversations(conversations));
                                        const activeId = order.length > 0 ? order[0]! : EVERYTHING_ELSE_ID;
                                        
                                        if (isMounted) {
                                            setChatState({
                                                conversations: conversations,
                                                order,
                                                activeId
                                            });
                                            console.log('✅ Conversations restored from localStorage fallback:', Object.keys(conversations).length);
                                        }
                                    }
                                }
                            } catch (fallbackError) {
                                console.error('Failed to restore conversations from localStorage:', fallbackError);
                            }
                        }
                    } catch (error) {
                        console.error('🔐 Error loading conversations:', error);
                        
                        // Try localStorage fallback on error
                        try {
                            const fallbackData = localStorage.getItem('otakon_conversations');
                            if (fallbackData) {
                                const parsedData = JSON.parse(fallbackData);
                                if (parsedData && Object.keys(parsedData).length > 0) {
                                    const conversations = parsedData as any;
                                    
                                    // Restore insights from localStorage for Pro/Vanguard users
                                    for (const [conversationId, conversation] of Object.entries(conversations)) {
                                        const conv = conversation as any;
                                        if (conv.id !== EVERYTHING_ELSE_ID && (!conv.insights || Object.keys(conv.insights).length === 0)) {
                                            try {
                                                const insightsBackup = localStorage.getItem(`otakon_insights_${conversationId}`);
                                                if (insightsBackup) {
                                                    const parsedInsights = JSON.parse(insightsBackup);
                                                    if (parsedInsights.insights && Object.keys(parsedInsights.insights).length > 0) {
                                                        conv.insights = parsedInsights.insights;
                                                        conv.insightsOrder = parsedInsights.insightsOrder;
                                                        console.log(`✅ Insights restored from localStorage after error for conversation: ${conversationId}`, Object.keys(parsedInsights.insights).length, 'tabs');
                                                    }
                                                }
                                            } catch (error) {
                                                console.warn(`Failed to restore insights after error for conversation ${conversationId}:`, error);
                                            }
                                        }
                                    }
                                    
                                    const order = Object.keys(conversations).sort(sortConversations(conversations));
                                    const activeId = order.length > 0 ? order[0]! : EVERYTHING_ELSE_ID;
                                    
                                    if (isMounted) {
                                        setChatState({
                                            conversations: conversations,
                                            order,
                                            activeId
                                        });
                                        console.log('✅ Conversations restored from localStorage after error:', Object.keys(conversations).length);
                                    }
                                }
                            }
                        } catch (fallbackError) {
                            console.error('Failed to restore conversations from localStorage after error:', fallbackError);
                        }
                    }
                        
                    // Check if we need to add welcome message for returning users
                    // Only add welcome message for truly empty conversations (not just missing messages array)
                    if (conversations[EVERYTHING_ELSE_ID] && 
                        conversations[EVERYTHING_ELSE_ID].messages && 
                        conversations[EVERYTHING_ELSE_ID].messages.length === 0) {
                        
                        // Additional check: verify this is actually an empty conversation, not a data loading issue
                        const conversationExists = conversations[EVERYTHING_ELSE_ID].id === EVERYTHING_ELSE_ID;
                        const hasValidStructure = conversations[EVERYTHING_ELSE_ID].title && conversations[EVERYTHING_ELSE_ID].title === 'Everything else';
                        
                        if (conversationExists && hasValidStructure) {
                            // Check if welcome message was already shown in dev mode
                            const isDevMode = localStorage.getItem('otakon_developer_mode') === 'true';
                            const devWelcomeShown = isDevMode && localStorage.getItem('otakon_dev_welcome_message_shown') === 'true';
                            
                            if (devWelcomeShown) {
                                console.log('🔧 [useChat] Developer mode: Welcome message already shown, skipping');
                                return;
                            }
                            
                            // Ensure welcome message via centralized service
                            await welcomeMessageService.ensureInserted(EVERYTHING_ELSE_ID, 'Everything else');
                            console.log('🔧 [useChat] Ensured welcome message during conversation loading');
                            } else {
                                console.log('🔧 [useChat] Welcome message already added this session, skipping');
                            }
                        }
                    } else if (conversations[EVERYTHING_ELSE_ID] && 
                               conversations[EVERYTHING_ELSE_ID].messages && 
                               conversations[EVERYTHING_ELSE_ID].messages.length > 0) {
                        console.log('🔧 [useChat] Conversation already has messages, skipping welcome message');
                    }
                    
                    const order = Object.keys(conversations).sort(sortConversations(conversations));
                    const activeId = order.length > 0 ? order[0]! : EVERYTHING_ELSE_ID;
                    
                    console.log('🔐 Setting chat state with conversations:', {
                        conversationIds: Object.keys(conversations),
                        order,
                        activeId,
                        conversations: conversations
                    });
                    
                    setChatState({
                        conversations: conversations as any, // Type cast to handle interface mismatch
                        order,
                        activeId
                    });
                    
                    console.log(`💾 Conversations loaded successfully`);
            } catch (error) {
                console.error('Failed to load conversations:', error);
                
                if (isMounted) {
                    // Ensure we always have a default conversation
                    setChatState({
                        conversations: {
                            [EVERYTHING_ELSE_ID]: {
                                id: EVERYTHING_ELSE_ID,
                                title: 'Everything else',
                                messages: [],
                                createdAt: Date.now(),
                            }
                        },
                        order: [EVERYTHING_ELSE_ID],
                        activeId: EVERYTHING_ELSE_ID
                    });
                }
            }
        };

        loadConversations();
        
        return () => {
            isMounted = false;
        };
    }, [secureConversationService]);

    // ✅ INFINITE LOOP FIX: Disabled duplicate auth listener in useChat
    // The App.tsx now handles all auth state changes centrally
    // This prevents the infinite loop caused by multiple auth listeners
    /*
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                console.log('🔐 User signed in, triggering conversation reload...');
                
                // Prevent duplicate operations with improved flag management
                if (isLoadingConversationsRef.current) {
                    console.log('🔧 [useChat] Conversation loading already in progress, skipping...');
                    return;
                }
                
                isLoadingConversationsRef.current = true;
                
                try {
                    // Wait for auth state to stabilize with longer delay
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // Reload conversations from database
                    const result = await secureConversationService.loadConversations();
                    
                    if (result.success && result.conversations && Object.keys(result.conversations).length > 0) {
                        console.log('✅ Conversations loaded from database after sign in:', Object.keys(result.conversations).length);
                        
                        // Convert database format to local format
                        const conversations: Record<string, Conversation> = {};
                        const order: string[] = [];
                        
                        Object.values(result.conversations).forEach((conv: any) => {
                            conversations[conv.id] = {
                                id: conv.id,
                                title: conv.title,
                                messages: conv.messages || [],
                                insights: conv.insights || {},
                                insightsOrder: Object.keys(conv.insights || {}),
                                context: conv.context || {},
                                createdAt: conv.createdAt || Date.now(),
                                isPinned: conv.is_pinned || false
                            };
                            order.push(conv.id);
                        });
                        
                        setChatState({
                            conversations,
                            order,
                            activeId: order[0] || EVERYTHING_ELSE_ID
                        });
                    } else {
                        console.log('🔧 No conversations found in database, creating default...');
                        
                        // Create default conversation with welcome message
                        const welcomeAddedThisSession = sessionStorage.getItem('otakon_welcome_added_session');
                        if (!welcomeAddedThisSession) {
                            const welcomeMessage: ChatMessage = {
                                id: crypto.randomUUID(),
                                role: 'model' as const,
                                text: 'Welcome to Otagon! I\'m your AI gaming assistant, here to help you get unstuck in games with hints, not spoilers. Upload screenshots, ask questions, or connect your PC for instant help while playing!'
                            };
                            
                            const defaultConversations = {
                                [EVERYTHING_ELSE_ID]: {
                                    id: EVERYTHING_ELSE_ID,
                                    title: 'Everything else',
                                    messages: [welcomeMessage],
                                    insights: {},
                                    insightsOrder: [],
                                    context: {},
                                    createdAt: Date.now(),
                                    isPinned: false
                                }
                            };
                            
                            setChatState({
                                conversations: defaultConversations,
                                order: [EVERYTHING_ELSE_ID],
                                activeId: EVERYTHING_ELSE_ID
                            });
                            
                            // Mark that we've added a welcome message this session
                            sessionStorage.setItem('otakon_welcome_added_session', 'true');
                            
                            console.log('🔧 [useChat] Default conversation with welcome message created after sign in');
                            
                            // Try to save the conversation
                            try {
                                await secureConversationService.saveConversation(
                                    EVERYTHING_ELSE_ID,
                                    'Everything Else',
                                    [welcomeMessage],
                                    [],
                                    {},
                                    undefined,
                                    false,
                                    true
                                );
                                console.log('🔧 [useChat] Welcome message conversation saved to database');
                            } catch (saveError) {
                                console.error('Failed to save welcome message conversation:', saveError);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error loading conversations after sign in:', error);
                } finally {
                    // Clear loading flag
                    isLoadingConversationsRef.current = false;
                }
            } else if (event === 'SIGNED_OUT') {
                console.log('🔐 User signed out, resetting conversations to default state');
                
                // Clear welcome message session flag for next login
                sessionStorage.removeItem('otakon_welcome_added_session');
                sessionStorage.removeItem('otakon_welcome_shown_session');
                
                // Reset to default state
                setChatState({
                    conversations: {
                        [EVERYTHING_ELSE_ID]: {
                            id: EVERYTHING_ELSE_ID,
                            title: 'Everything else',
                            messages: [],
                            insights: {},
                            insightsOrder: [],
                            context: {},
                            createdAt: Date.now(),
                            isPinned: false
                        }
                    },
                    order: [EVERYTHING_ELSE_ID],
                    activeId: EVERYTHING_ELSE_ID
                });
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [secureConversationService]);
    */

    // REMOVED: Duplicate conversation creation effect to prevent race conditions

    // Use debounced save instead of the old timeout approach
    // Add a ref to track if we're currently loading conversations to prevent immediate save
    const isLoadingConversationsRef = useRef(false);
    
    useEffect(() => {
        // Don't save if we're currently loading conversations
        if (isLoadingConversationsRef.current) {
            console.log('🔧 [useChat] Skipping debouncedSave - currently loading conversations');
            return;
        }
        
        debouncedSave(conversations);
    }, [conversations, debouncedSave]);

    // Cleanup function to prevent memory leaks
    useEffect(() => {
        return () => {
            // Clear any pending save operations
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            
            // Cancel any pending abort controllers
            Object.values(abortControllersRef.current).forEach(controller => {
                controller.abort();
            });
            
            // Clean up service (no cleanup method available)
        };
    }, [secureConversationService]);

    useEffect(() => {
        const cooldownEnd = localStorage.getItem(COOLDOWN_KEY);
        if (cooldownEnd && Date.now() < parseInt(cooldownEnd, 10)) {
            setIsCooldownActive(true);
            const timeRemaining = parseInt(cooldownEnd, 10) - Date.now();
            const timer = setTimeout(() => setIsCooldownActive(false), timeRemaining > 0 ? timeRemaining : 0);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, []);

    const activeConversation = useMemo(() => {
        const conv = conversations[activeConversationId];
        console.log('🔧 [useChat] Active conversation lookup:', {
            activeConversationId,
            hasConversation: !!conv,
            conversationId: conv?.id,
            messageCount: conv?.messages?.length || 0,
            availableConversations: Object.keys(conversations),
            conversationsCount: Object.keys(conversations).length
        });
        
        // FIXED: Ensure we always return a conversation, even if it's not the expected one
        if (!conv && Object.keys(conversations).length > 0) {
            console.log('🔧 [useChat] Active conversation not found, falling back to first available');
            const firstConversationId = Object.keys(conversations)[0];
            return conversations[firstConversationId!];
        }
        
        return conv;
    }, [conversations, activeConversationId]);
    
    const updateConversation = useCallback((convoId: string, updateFn: (convo: Conversation) => Conversation, skipTimestamp?: boolean) => {
        setChatState(prev => {
            const newConversations = { ...prev.conversations };
            const convo = newConversations[convoId];
            if (convo) {
                const updatedConvo = updateFn(convo);
                if (!skipTimestamp) {
                    updatedConvo.lastInteractionTimestamp = Date.now();
                }
                newConversations[convoId] = updatedConvo;
                const newOrder = [...prev.order].sort(sortConversations(newConversations));
                return { ...prev, conversations: newConversations, order: newOrder };
            }
            return prev;
        });
    }, []);

    const updateMessageInConversation = useCallback((convoId: string, messageId: string, updateFn: (msg: ChatMessage) => ChatMessage) => {
        updateConversation(convoId, convo => ({
            ...convo,
            messages: convo.messages.map(m => m.id === messageId ? updateFn(m) : m)
        }));
    }, [updateConversation]);
    
    const addSystemMessage = useCallback((text: string, convoId?: string, showUpgradeButton?: boolean) => {
        const targetConvoId = convoId || activeConversationId;
        const message: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'model',
            text,
            showUpgradeButton: showUpgradeButton || false,
        };
        updateConversation(targetConvoId, convo => ({
            ...convo,
            messages: [...convo.messages, message]
        }));
    }, [activeConversationId, updateConversation]);

    const handleQuotaError = useCallback((failedMessageId: string) => {
        setIsCooldownActive(true);
        setTimeout(() => setIsCooldownActive(false), COOLDOWN_DURATION);
        const errorText = "The AI is currently resting due to high traffic. Service will resume in about an hour.";
        updateMessageInConversation(activeConversationId, failedMessageId, msg => ({ ...msg, text: `Error: ${errorText}` }));
        setLoadingMessages(prev => prev.filter(id => id !== failedMessageId));
    }, [activeConversationId, updateMessageInConversation]);

    const deleteInsight = useCallback((convoId: string, insightId: string) => {
        updateConversation(convoId, convo => {
            if (!convo.insights || !convo.insightsOrder) return convo;
            
            const oldInsight = convo.insights[insightId];
            const newInsights = { ...convo.insights };
            delete newInsights[insightId];
            const newOrder = convo.insightsOrder.filter(id => id !== insightId);

            // Removed unifiedAnalyticsService - not used

            return { ...convo, insights: newInsights, insightsOrder: newOrder };
        });
    }, [updateConversation]);

    const reorderConversations = useCallback((sourceIndex: number, destIndex: number) => {
        setChatState(prev => {
            const newOrder = [...prev.order];
            const [removed] = newOrder.splice(sourceIndex, 1);
            if (removed) {
                newOrder.splice(destIndex!, 0, removed);
            }
            return { ...prev, order: newOrder };
        });
    }, []);

    const markInsightAsRead = useCallback((convoId: string, insightId: string) => {
        updateConversation(convoId, convo => {
            if (convo.insights?.[insightId]?.isNew) {
                const newInsights = { ...convo.insights };
                const existingInsight = newInsights[insightId];
                if (existingInsight) {
                    newInsights[insightId] = { ...existingInsight, isNew: false };
                }
                return { ...convo, insights: newInsights };
            }
            return convo;
        }, true); // skip timestamp update
    }, [updateConversation]);

    const pinConversation = useCallback((convoId: string, isPinned: boolean) => {
        updateConversation(convoId, convo => ({
            ...convo,
            isPinned,
        }));
    }, [updateConversation]);

    const deleteConversation = useCallback((convoId: string) => {
        if (convoId === EVERYTHING_ELSE_ID) return;
        setChatState(prev => {
            const newConversations = { ...prev.conversations };
            delete newConversations[convoId];
            const newOrder = prev.order.filter(id => id !== convoId);
            let newActiveId = prev.activeId;
            if (prev.activeId === convoId) {
                newActiveId = EVERYTHING_ELSE_ID;
            }
            return { conversations: newConversations, order: newOrder, activeId: newActiveId };
        });
    }, []);

    const reorderInsights = useCallback((convoId: string, sourceIndex: number, destIndex: number) => {
        updateConversation(convoId, convo => {
            if (!convo.insightsOrder) return convo;
            const newOrder = [...convo.insightsOrder];
            const [removed] = newOrder.splice(sourceIndex, 1);
            if (removed) {
                newOrder.splice(destIndex!, 0, removed);
            }
            return { ...convo, insightsOrder: newOrder };
        });
    }, [updateConversation]);

    const overwriteInsight = useCallback((convoId: string, insightId: string, newTitle: string, newContent: string) => {
        updateConversation(convoId, convo => {
            if (!convo.insights || !convo.insights[insightId]) return convo;
            
            const oldInsight = convo.insights[insightId];
            const newInsights = { ...convo.insights };
            newInsights[insightId] = {
                ...oldInsight,
                title: newTitle,
                content: newContent,
                status: 'loaded',
                isNew: true,
            };

            // Removed unifiedAnalyticsService - not used

            return { ...convo, insights: newInsights };
        });
    }, [updateConversation]);

    const createNewInsight = useCallback((convoId: string, title: string, content: string) => {
        updateConversation(convoId, convo => {
            const newId = generateGameId(title);
            if (convo.insights?.[newId]) {
                addSystemMessage(`An insight with a similar title already exists. Please choose a different title.`);
                return convo;
            }
            const newInsight: Insight = {
                id: newId,
                title,
                content,
                status: 'loaded',
                isNew: true,
            };
            const newInsights = { ...(convo.insights || {}), [newId]: newInsight };
            const newOrder = [...(convo.insightsOrder || []), newId];

            // Removed unifiedAnalyticsService - not used

            return { ...convo, insights: newInsights, insightsOrder: newOrder };
        });
    }, [updateConversation, addSystemMessage]);

    const updateMessageFeedback = useCallback((convoId: string, messageId: string, vote: ChatMessageFeedback) => {
        updateMessageInConversation(convoId, messageId, msg => ({ ...msg, feedback: vote }));

        // Removed unifiedAnalyticsService - not used
    }, [updateMessageInConversation, conversations, unifiedUsageService]);

    const updateInsightFeedback = useCallback((convoId: string, insightId: string, vote: ChatMessageFeedback) => {
        updateConversation(convoId, convo => {
            if (!convo.insights?.[insightId]) return convo;
            
            const oldInsight = convo.insights[insightId];
            const newInsights = { ...convo.insights };
            newInsights[insightId] = { ...oldInsight, feedback: vote };

            // Removed unifiedAnalyticsService - not used

            return { ...convo, insights: newInsights };
        });
    }, [updateConversation]);

    // Function to trigger intelligent insight updates based on AI response context
    const triggerIntelligentInsightUpdate = useCallback(async (
        conversationId: string,
        aiResponseText: string,
        gameName?: string,
        genre?: string,
        progress?: number
    ) => {
        if (!gameName || !genre || progress === undefined) {
            console.log('Missing game context for intelligent insight update');
            return;
        }

        const conversation = conversations[conversationId];
        if (!conversation || !conversation.insights) {
            console.log('No insights found for intelligent update');
            return;
        }

        console.log(`🧠 Triggering intelligent insight update for: ${gameName} based on AI response context`);
        
        // This would integrate with the enhanced insights system
        // For now, we'll log the context for future integration
        console.log('AI Response Context:', aiResponseText.substring(0, 200) + '...');
        console.log('Game Context:', { gameName, genre, progress });
        
        // TODO: Integrate with enhanced insights system to trigger updates
        // This would call the updateInsightsForUserQuery function with the AI response context
    }, [conversations]);
    
    const sendMessage = useCallback(async (text: string, images?: ImageFile[], isFromPC?: boolean): Promise<{ success: boolean; reason?: string }> => {
        // Check if this is a tab management command
        if (text && typeof text === 'string' && text.startsWith('[TAB_MANAGEMENT] ')) {
            const commandText = text.replace('[TAB_MANAGEMENT] ', '');
            const result = await handleTabManagementCommand(commandText);
            
            if (result) {
                // Add a system message showing the result
                addSystemMessage(result.message, activeConversationId, false);
                return { success: result.success, ...(result.error && { reason: result.error }) };
            }
        }
        
        const textQueries = (text && typeof text === 'string' && text.trim().length > 0) ? 1 : 0;
        const imageQueries = images ? images.length : 0;
        const hasImages = !!(images && images.length > 0);

        if (textQueries === 0 && imageQueries === 0) return { success: true };
        
        // Removed unifiedAnalyticsService - not used

        // Track user query for game analytics
        const queryId = crypto.randomUUID();
        const sourceConversation = conversationsRef.current[activeConversationId];
        if (sourceConversation) {
            // Removed unifiedAnalyticsService - not used
        }
        
        ttsService.cancel();

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            text,
            ...(images && { images: images.map(img => img.dataUrl) }),
            ...(isFromPC !== undefined && { isFromPC })
        };

        const sourceConvoId = activeConversationId;
        
        const modelMessageId = crypto.randomUUID();
        const placeholderMessage: ChatMessage = { id: modelMessageId, role: 'model', text: '' };

        // Add user and placeholder messages to the source conversation immediately for UI responsiveness
        updateConversation(sourceConvoId, convo => ({
            ...convo,
            messages: [...convo.messages, userMessage, placeholderMessage]
        }));
        setLoadingMessages(prev => [...prev, modelMessageId]);
        
        const usage = await unifiedUsageService.getUsage();
        const { tier, textCount, textLimit, imageCount, imageLimit } = usage;
        
        if (tier === 'free') {
            if ((textQueries > 0 && textCount >= textLimit) || (imageQueries > 0 && imageCount >= imageLimit)) {
                 addSystemMessage(`You've used all your free queries for this month. Upgrade to Pro for more.`, sourceConvoId, true);
                 setLoadingMessages(prev => prev.filter(id => id !== modelMessageId));
                 updateMessageInConversation(sourceConvoId, modelMessageId, msg => ({...msg, text: ""}));
                return { success: false, reason: 'limit_reached' };
            }
        }
        
        await unifiedUsageService.incrementQueryCount('text', textQueries);
        await unifiedUsageService.incrementQueryCount('image', imageQueries);

        // Refresh the UI to show updated credit counts
        if (refreshUsage) {
            try {
                await refreshUsage();
                console.log('🔄 Credit indicator refreshed after query');
            } catch (error) {
                console.warn('Failed to refresh credit indicator:', error);
            }
        }

        const controller = new AbortController();
        abortControllersRef.current[modelMessageId] = controller;
        
        if (!sourceConversation) return { success: false, reason: 'conversation_not_found' };

        const history = { 
            messages: (sourceConversation.messages || []).map(msg => ({
                id: msg.id,
                content: msg.text,
                role: (msg.role === 'model' ? 'assistant' : msg.role) as 'user' | 'assistant',
                timestamp: Date.now()
            }))
        };
        const isProUser = (await unifiedUsageService.getTier()) !== 'free';
        
        const onError = (error: Error) => {
            setLoadingMessages(prev => prev.filter(id => id !== modelMessageId));
            updateMessageInConversation(activeConversationId, modelMessageId, msg => ({ ...msg, text: `Error: ${error.message}`}));
        };

        try {
            // --- Game Knowledge System Integration ---
            // Try to get a smart response from our knowledge base first
            // Using static import instead of dynamic import for Firebase hosting compatibility
            const gameTitle = sourceConversation.id !== EVERYTHING_ELSE_ID ? sourceConversation.id : undefined;
            
            const smartResponse = await gameKnowledgeService.getSmartResponse(text && typeof text === 'string' ? text.trim() : '', gameTitle);
            
            if (smartResponse.source === 'knowledge_base' && smartResponse.confidence >= 0.8) {
                // Use knowledge base response instead of calling AI
                console.log('Using knowledge base response:', smartResponse);
                
                // Update the message with the knowledge base response
                const finalCleanedText = smartResponse.response;
                updateMessageInConversation(activeConversationId, modelMessageId, msg => ({ ...msg, text: finalCleanedText }));
                
                // Removed unifiedAnalyticsService - not used
                
                // Learn from this successful interaction
                await gameKnowledgeService.learnFromAIResponse(text && typeof text === 'string' ? text.trim() : '', smartResponse.response, gameTitle, true);
                
                setLoadingMessages(prev => prev.filter(id => id !== modelMessageId));
                return { success: true, reason: 'knowledge_base_response' };
            }
            
            // --- Context Injection for Companion AI ---
            let metaNotes = '';
            
            // Initialize conversation context
            const context = contextManagementService.initializeConversationContext(
                sourceConversation.id,
                sourceConversation.id !== EVERYTHING_ELSE_ID ? sourceConversation.id : null
            );
            
            // Add message to history
            contextManagementService.addMessageToHistory(sourceConversation.id, text);
            
            // Add player profile context
            const profileContext = playerProfileService.getProfileContext();
            if (profileContext) {
                metaNotes += `${profileContext}\n`;
            }
            
            // Add conversation context
            const conversationContext = contextManagementService.getContextForAI(sourceConversation.id);
            if (conversationContext) {
                metaNotes += `${conversationContext}\n`;
            }
            
            if(sourceConversation.id !== EVERYTHING_ELSE_ID) {
                // Add game context
                const gameContext = playerProfileService.getGameContextForAI(sourceConversation.id);
                if (gameContext) {
                    metaNotes += `${gameContext}\n`;
                }
                
                // Existing context injection
                if (sourceConversation.insights?.story_so_far?.content) {
                    metaNotes += `[META_STORY_SO_FAR: ${sourceConversation.insights.story_so_far.content}]\n`;
                }
                if (sourceConversation.activeObjective) {
                    metaNotes += `[META_ACTIVE_OBJECTIVE: ${JSON.stringify(sourceConversation.activeObjective)}]\n`;
                }
                 if (sourceConversation.inventory?.length) {
                    metaNotes += `[META_INVENTORY: ${sourceConversation.inventory.join(', ')}]\n`;
                }
                
                // NEW: Insight tab context injection to prevent repetition
                if (sourceConversation.insights) {
                    const insightTabs = Object.entries(sourceConversation.insights);
                    if (insightTabs.length > 0) {
                        metaNotes += `[META_INSIGHT_TABS_CONTEXT: The following insight tabs already exist with content - DO NOT regenerate similar content for these tabs:\n`;
                        
                        insightTabs.forEach(([tabId, insight]) => {
                            if (insight && insight.content) {
                                // Truncate content to avoid context bloat
                                const truncatedContent = insight.content.length > 200 
                                    ? insight.content.substring(0, 200) + '...' 
                                    : insight.content;
                                metaNotes += `- ${tabId}: "${truncatedContent}"\n`;
                            }
                        });
                        
                        metaNotes += `When generating new insights, avoid duplicating content from these existing tabs and focus on new, complementary information.]\n`;
                    }
                }
            }

            // NEW: Add task completion context
            if (sourceConversation.id !== EVERYTHING_ELSE_ID) {
                // Using static import instead of dynamic import for Firebase hosting compatibility
                const completionContext = taskCompletionPromptingService.formatCompletionContext(sourceConversation.id);
                if (completionContext) {
                    metaNotes += `${completionContext}\n`;
                    // Clear the pending completions after they've been included in context
                    taskCompletionPromptingService.clearPendingCompletions(sourceConversation.id);
                }
            }
            // --- End Context Injection ---

            // Paid latest-info queries: universal cache lookup and cutoff guidance
            const userTierNow = await unifiedUsageService.getTier();
            const isProUser = userTierNow !== 'free';
            const latestInfoQuery = isProUser && isLatestInfoQuery(text);
            if (latestInfoQuery) {
                try {
                    // Using static import instead of dynamic import for Firebase hosting compatibility
                    const cacheType = sourceConversation.id === EVERYTHING_ELSE_ID ? 'general' : 'game_info';
                    const cached = await simpleCacheService.getCachedContent({
                        query: text && typeof text === 'string' ? text.trim() : '',
                        contentType: cacheType as any,
                        gameName: sourceConversation.id === EVERYTHING_ELSE_ID ? undefined : sourceConversation.id,
                        genre: sourceConversation.genre,
                        userTier: 'paid'
                    } as any);
                    if (cached) {
                        const cachedText = cached;
                        updateMessageInConversation(activeConversationId, modelMessageId, msg => ({ ...msg, text: cachedText }));
                        setLoadingMessages(prev => prev.filter(id => id !== modelMessageId));
                        return { success: true, reason: 'cache_hit' };
                    }
                } catch (e) {
                    console.warn('Universal cache lookup failed:', e);
                }
                // Append cutoff guidance for paid, latest-info queries
                try {
                    // Using static import instead of dynamic import for Firebase hosting compatibility
                    metaNotes += `[KNOWLEDGE_CUTOFF: ${KNOWLEDGE_CUTOFF_LABEL}] For information after this date, prefer current, verified sources.\n`;
                } catch {
                    metaNotes += `[KNOWLEDGE_CUTOFF: January 2025] For information after this date, prefer current, verified sources.\n`;
                }
            }

            const promptText = metaNotes + ((text && typeof text === 'string' ? text.trim() : '') || "A player needs help. First, identify the game from this screenshot. Then, provide a spoiler-free hint and some interesting lore about what's happening in the image.");
            
            let rawTextResponse = "";
            let hasError = false;

            const onChunk = (chunk: string) => {
                if (isCooldownActive) setIsCooldownActive(false);
                rawTextResponse += chunk;
                const displayText = rawTextResponse
                    .replace(comprehensiveTagCleanupRegex, '')
                    .trim();
                updateMessageInConversation(activeConversationId, modelMessageId, msg => ({ ...msg, text: displayText }));
                
                // 🚫 REMOVED: Real-time insight updates to prevent unauthorized API calls
                // Insights are now only updated when user explicitly requests them
                if (isProUser && chunk.length > 0) {
                    console.log('🚫 Real-time insight updates disabled - insights only updated on user request');
                }
            };

            const onStreamingError = async (error: Error) => {
                hasError = true;
                
                // Use enhanced error handling for streaming errors
                try {
                    const errorContext: ChatErrorContext = {
                        operation: 'streaming_response',
                        component: 'useChat',
                        conversationId: activeConversationId,
                        messageId: modelMessageId,
                        isHandsFreeMode
                    };
                    
                    const errorInfo = await enhancedErrorHandlingService.handleChatError(
                        error, 
                        errorContext
                    );
                    
                    // Update message with user-friendly error message
                    updateMessageInConversation(activeConversationId, modelMessageId, msg => ({ 
                        ...msg, 
                        text: errorInfo.userMessage 
                    }));
                    
                    // Handle TTS for error message (only if TTS-safe)
                    if (isHandsFreeMode && errorInfo.ttsSafe) {
                        ttsService.speak(errorInfo.userMessage).catch(ttsError => {
                            console.warn('TTS failed for streaming error message:', ttsError);
                        });
                    }
                    
                } catch (enhancedErrorHandlingError) {
                    // Fallback to original error handling if enhanced service fails
                    console.warn('Enhanced error handling failed for streaming error, using fallback:', enhancedErrorHandlingError);
                    
                    if (error.message === 'QUOTA_EXCEEDED') {
                        handleQuotaError(modelMessageId);
                    } else {
                        updateMessageInConversation(activeConversationId, modelMessageId, msg => ({ ...msg, text: error.message }));
                        if (isHandsFreeMode) ttsService.speak(error.message).catch(() => {});
                    }
                }
                
                setLoadingMessages(prev => prev.filter(id => id !== modelMessageId));
            };

            const onErrorString = async (error: string) => {
                hasError = true;
                
                // Use enhanced error handling for better user experience
                try {
                    const errorContext: ChatErrorContext = {
                        operation: 'chat_response',
                        component: 'useChat',
                        conversationId: activeConversationId,
                        messageId: modelMessageId,
                        isHandsFreeMode
                    };
                    
                    const errorInfo = await enhancedErrorHandlingService.handleChatError(
                        { message: error }, 
                        errorContext
                    );
                    
                    // Update message with user-friendly error message
                    updateMessageInConversation(activeConversationId, modelMessageId, msg => ({ 
                        ...msg, 
                        text: errorInfo.userMessage 
                    }));
                    
                    // Handle TTS for error message (only if TTS-safe)
                    if (isHandsFreeMode && errorInfo.ttsSafe) {
                        ttsService.speak(errorInfo.userMessage).catch(ttsError => {
                            console.warn('TTS failed for error message:', ttsError);
                        });
                    }
                    
                    // Add recovery action if available
                    if (errorInfo.recoveryAction) {
                        // For now, we'll just log the recovery action
                        // In a full implementation, we'd show a retry button
                        console.log('Recovery action available:', errorInfo.recoveryAction);
                    }
                    
                } catch (enhancedErrorHandlingError) {
                    // Fallback to original error handling if enhanced service fails
                    console.warn('Enhanced error handling failed, using fallback:', enhancedErrorHandlingError);
                    
                    if (error === 'QUOTA_EXCEEDED') {
                        handleQuotaError(modelMessageId);
                    } else {
                        updateMessageInConversation(activeConversationId, modelMessageId, msg => ({ ...msg, text: error }));
                        if (isHandsFreeMode) ttsService.speak(error).catch(() => {});
                    }
                }
                
                setLoadingMessages(prev => prev.filter(id => id !== modelMessageId));
            };

            // Try universal AI response first (1:1 API call architecture)
            try {
                const universalResponse = await unifiedAIService().generateUniversalResponse(
                    sourceConversation,
                    promptText,
                    hasImages,
                    controller.signal,
                    history.messages.map(msg => ({ 
                        ...msg, 
                        text: msg.content, 
                        role: msg.role === 'assistant' ? 'model' as const : msg.role as 'user' | 'system' 
                    }))
                );

                if (universalResponse && !controller.signal.aborted) {
                    rawTextResponse = universalResponse.narrativeResponse;
                    
                    // Process suggested tasks if available
                    if (universalResponse.suggestedTasks && universalResponse.suggestedTasks.length > 0) {
                        try {
                            const userTier = await unifiedUsageService.getTier();
                            if (userTier === 'pro' || userTier === 'vanguard_pro') {
                                await otakuDiaryService.addAISuggestedTasks(sourceConvoId, universalResponse.suggestedTasks);
                                console.log(`🎯 Added ${universalResponse.suggestedTasks.length} AI suggested tasks for ${sourceConvoId}`);
                            }
                        } catch (error) {
                            console.warn('Failed to add suggested tasks:', error);
                        }
                    }

                    // Process task completion prompt if available
                    if (universalResponse.taskCompletionPrompt) {
                        console.log('📋 Task completion prompt generated:', universalResponse.taskCompletionPrompt);
                    }

                    // Process progressive insight updates if available
                    if (universalResponse.progressiveInsightUpdates && universalResponse.progressiveInsightUpdates.length > 0) {
                        console.log('🔄 Progressive insight updates received:', universalResponse.progressiveInsightUpdates.length);
                        
                        // Apply updates to conversation insights for Pro/Vanguard users
                        try {
                            const userTier = await unifiedUsageService.getTier();
                            if (userTier === 'pro' || userTier === 'vanguard_pro') {
                                updateConversation(activeConversationId, convo => {
                                    if (!convo.insights) return convo;
                                    
                                    const updatedInsights = { ...convo.insights };
                                    universalResponse.progressiveInsightUpdates.forEach(update => {
                                        if (updatedInsights[update.tabId]) {
                                            const existingInsight = updatedInsights[update.tabId];
                                            if (existingInsight) {
                                                updatedInsights[update.tabId] = {
                                                    ...existingInsight,
                                                    title: update.title,
                                                    content: update.content,
                                                    status: 'loaded',
                                                    isNew: true,
                                                    lastUpdated: Date.now()
                                                };
                                            }
                                        }
                                    });
                                    
                                    return { ...convo, insights: updatedInsights };
                                });
                                
                                console.log('✅ Progressive insight updates applied to UI');
                            } else {
                                console.log('🚫 Progressive updates skipped for free user');
                            }
                        } catch (error) {
                            console.warn('Failed to apply progressive insight updates:', error);
                        }
                    }

                    // Process follow-up prompts if available
                    if (universalResponse.followUpPrompts && universalResponse.followUpPrompts.length > 0) {
                        console.log('💡 Follow-up prompts generated:', universalResponse.followUpPrompts.length);
                        // Store follow-up prompts for UI display
                        setSuggestedPrompts(universalResponse.followUpPrompts);
                    }

                    // Process state update tags if available
                    if (universalResponse.stateUpdateTags && universalResponse.stateUpdateTags.length > 0) {
                        console.log('🏷️ State update tags:', universalResponse.stateUpdateTags);
                        // Process state changes (e.g., objective completion, boss defeats)
                        processStateUpdateTags(universalResponse.stateUpdateTags);
                    }

                    // Process game pill data if available (Pro/Vanguard only)
                    if (universalResponse.gamePillData?.shouldCreate) {
                        console.log('🎮 Game pill creation data received:', universalResponse.gamePillData.gameName);
                        // Game pill creation is handled by the AI service internally
                    }
                } else {
                    console.warn('Universal response returned null or was aborted, falling back to basic streaming');
                }
            } catch (error) {
                console.warn('Universal AI response failed, falling back to streaming methods:', error);
                
                // Fallback to existing streaming methods
                if (isProUser) {
                    const imageParts = images ? images.map(img => ({ base64: img.base64, mimeType: img.mimeType })) : null;
                    const historyMessages = history.messages.map(msg => ({ 
                        ...msg, 
                        text: msg.content, 
                        role: msg.role === 'assistant' ? 'model' as const : msg.role as 'user' | 'system' 
                    }));
                    rawTextResponse = await unifiedAIService().generateInitialProHint(promptText, imageParts, sourceConversation, historyMessages, onErrorString, controller.signal) || "";
                } else {
                    if (images && images.length > 0) {
                        const imageParts = images.map(img => ({ base64: img.base64, mimeType: img.mimeType }));
                        const historyMessages = history.messages.map(msg => ({ 
                        ...msg, 
                        text: msg.content, 
                        role: msg.role === 'assistant' ? 'model' as const : msg.role as 'user' | 'system' 
                    }));
                        await unifiedAIService().sendMessageWithImages(promptText, imageParts, sourceConversation, controller.signal, onChunk, onErrorString, historyMessages);
                    } else {
                        const historyMessages = history.messages.map(msg => ({ 
                        ...msg, 
                        text: msg.content, 
                        role: msg.role === 'assistant' ? 'model' as const : msg.role as 'user' | 'system' 
                    }));
                        await unifiedAIService().sendMessage(promptText, sourceConversation, controller.signal, onChunk, onErrorString, historyMessages);
                    }
                }
            }
            
            if (controller.signal.aborted || hasError || !rawTextResponse) {
                if (!hasError) setLoadingMessages(prev => prev.filter(id => id !== modelMessageId));
                return { success: false, reason: 'cancelled' };
            }
            
            console.log("Raw model response:", rawTextResponse);
            setLoadingMessages(prev => prev.filter(id => id !== modelMessageId));

            // --- TTS EXTRACTION ---
            // Extract hint for TTS *before* stripping any tags
            const hintMatch = rawTextResponse.match(/\[OTAKON_HINT_START\]([\s\S]*?)\[OTAKON_HINT_END\]/);

            // --- Step 1: Extract all data from the raw response before cleaning ---
            let identifiedGameName: string | null = null;
            let gameGenre: string | null = null;
            let gameProgress: number | null = null;
            let suggestions: string[] = [];
            let triumphPayload: ChatMessage['triumph'] | undefined;
            let parsedInventory: { items: string[] } | null = null;
            let insightUpdate: { id: string; content: string } | null = null;
            let insightModifyPending: PendingInsightModification | null = null;
            let insightDeleteRequest: { id: string } | null = null;
            let isGameUnreleased = false;
            let objectiveSet: { description: string } | null = null;
            let objectiveComplete = false;

            const gameIdMatch = rawTextResponse.match(/\[OTAKON_GAME_ID:\s*(.*?)\]/);
            if (gameIdMatch?.[1]) identifiedGameName = gameIdMatch[1].trim();

            const genreMatch = rawTextResponse.match(/\[OTAKON_GENRE:\s*(.*?)\]/);
            if (genreMatch?.[1]) gameGenre = genreMatch[1].trim();

            const confidenceMatch = rawTextResponse.match(/\[OTAKON_CONFIDENCE:\s*(high|low)\]/);
            const isConfidenceHigh = confidenceMatch?.[1] === 'high';
            if (isConfidenceHigh || (identifiedGameName && !hasImages)) {
                const progressMatch = rawTextResponse.match(/\[OTAKON_GAME_PROGRESS:\s*(\d+)\]/);
                if (progressMatch?.[1]) gameProgress = parseInt(progressMatch[1], 10);
            }

            if (rawTextResponse.includes('[OTAKON_GAME_IS_UNRELEASED: true]')) {
                isGameUnreleased = true;
            }

            const triumphMatch = rawTextResponse.match(/\[OTAKON_TRIUMPH:\s*({.*?})\]/s);
            if (triumphMatch?.[1]) try { triumphPayload = JSON.parse(triumphMatch[1]); } catch(e){ console.warn('Failed to parse OTAKON_TRIUMPH:', e, 'Raw:', triumphMatch[1]); }

            const inventoryMatch = rawTextResponse.match(/\[OTAKON_INVENTORY_ANALYSIS:\s*({.*?})\]/s);
            if (inventoryMatch?.[1]) try { parsedInventory = JSON.parse(inventoryMatch[1]); } catch(e){ console.warn('Failed to parse OTAKON_INVENTORY_ANALYSIS:', e, 'Raw:', inventoryMatch[1]); }

            const suggestionsMatch = rawTextResponse.match(/\[OTAKON_SUGGESTIONS:\s*(\[.*?\])\]/s);
            if (suggestionsMatch?.[1]) try { suggestions = JSON.parse(suggestionsMatch[1]); } catch(e){ console.warn('Failed to parse OTAKON_SUGGESTIONS:', e, 'Raw:', suggestionsMatch[1]); }

            const insightUpdateMatch = rawTextResponse.match(/\[OTAKON_INSIGHT_UPDATE:\s*({.*?})\]/s);
            if (insightUpdateMatch?.[1]) try { insightUpdate = JSON.parse(insightUpdateMatch[1]); } catch(e){ console.warn('Failed to parse OTAKON_INSIGHT_UPDATE:', e, 'Raw:', insightUpdateMatch[1]); }

            const insightModifyPendingMatch = rawTextResponse.match(/\[OTAKON_INSIGHT_MODIFY_PENDING:\s*({.*?})\]/s);
            if (insightModifyPendingMatch?.[1]) try { insightModifyPending = JSON.parse(insightModifyPendingMatch[1]); } catch(e){ console.warn('Failed to parse OTAKON_INSIGHT_MODIFY_PENDING:', e, 'Raw:', insightModifyPendingMatch[1]); }

            const insightDeleteRequestMatch = rawTextResponse.match(/\[OTAKON_INSIGHT_DELETE_REQUEST:\s*({.*?})\]/s);
            if (insightDeleteRequestMatch?.[1]) try { insightDeleteRequest = JSON.parse(insightDeleteRequestMatch[1]); } catch(e){ console.warn('Failed to parse OTAKON_INSIGHT_DELETE_REQUEST:', e, 'Raw:', insightDeleteRequestMatch[1]); }
            
            const objectiveSetMatch = rawTextResponse.match(/\[OTAKON_OBJECTIVE_SET:\s*({.*?})\]/s);
            if (objectiveSetMatch?.[1]) try { objectiveSet = JSON.parse(objectiveSetMatch[1]); } catch(e){ console.warn('Failed to parse OTAKON_OBJECTIVE_SET:', e, 'Raw:', objectiveSetMatch[1]); }

            if (rawTextResponse.includes('[OTAKON_OBJECTIVE_COMPLETE: true]')) {
                objectiveComplete = true;
            }

            // --- Step 2: Clean the text and update conversation state ---
            const hintTagsRegex = /\[OTAKON_HINT_START\]|\[OTAKON_HINT_END\]/g;
            
            let finalCleanedText = rawTextResponse
                .replace(hintTagsRegex, '') // Remove hint tags for display
                .replace(comprehensiveTagCleanupRegex, '')
                .replace(/^Game Progress: \d+%\s*$/m, '')
                .trim();
            
            // Removed smartNotificationService - not used

            let finalTargetConvoId = sourceConvoId;
            const identifiedGameId = identifiedGameName ? generateGameId(identifiedGameName) : null;
            
            // Guardrails for promoting to a dedicated game tab (pill)
            const canPromotePill = !!identifiedGameId && !isGameUnreleased && (hasImages || (!hasImages && isConfidenceHigh));
            if (canPromotePill && (sourceConvoId === EVERYTHING_ELSE_ID || identifiedGameId !== sourceConvoId)) {
                console.log(`New game detected: "${identifiedGameName}". Creating/switching to new conversation tab.`);
                finalTargetConvoId = identifiedGameId;
                
                // NEW: Track game switch in screenshot timeline service
                if (images && images.length > 0) {
                    try {
                        // Using static import instead of dynamic import for Firebase hosting compatibility
                        await screenshotTimelineService.handleGameSwitch(
                            sourceConvoId,
                            finalTargetConvoId,
                            identifiedGameName!,
                            identifiedGameId
                        );
                        console.log(`🔄 Game switch tracked in timeline: ${sourceConvoId} → ${finalTargetConvoId}`);
                    } catch (error) {
                        console.warn('Failed to track game switch in timeline:', error);
                    }
                }
            } else if (!!identifiedGameId && !hasImages && !isConfidenceHigh) {
                // Low confidence text-only: keep in Everything Else and ask for confirmation
                try {
                    const confirmMsg = `I think you're asking about ${identifiedGameName}. Upload a screenshot or say \"Create tab for ${identifiedGameName}\" to set up a dedicated tab.`;
                    addSystemMessage(confirmMsg, sourceConvoId, false);
                } catch (e) {
                    console.log('Could not add low-confidence confirmation message:', e);
                }
            } else if (!!identifiedGameId && isGameUnreleased) {
                // Unreleased game: keep in Everything Else and inform user
                try {
                    const unreleasedMsg = `${identifiedGameName} is an unreleased game. I'll keep our conversation in the Everything Else tab for now.`;
                    addSystemMessage(unreleasedMsg, sourceConvoId, false);
                } catch (e) {
                    console.log('Could not add unreleased game message:', e);
                }
            }

            // Task completion prompt processing (now handled by enhanced response above)
            let taskCompletionPrompt: TaskCompletionPrompt | undefined = undefined;
            if (finalTargetConvoId !== EVERYTHING_ELSE_ID) {
                try {
                    const userTier = await unifiedUsageService.getTier();
                    const centralTasks = await otakuDiaryService.getCentralTasks(finalTargetConvoId);
                    const aiGeneratedTasks = await otakuDiaryService.getAISuggestedTasks(finalTargetConvoId);
                    
                    taskCompletionPrompt = taskCompletionPromptingService.generateCompletionPrompt(
                        finalTargetConvoId,
                        userTier,
                        centralTasks,
                        aiGeneratedTasks
                    ) || undefined;
                } catch (error) {
                    console.warn('Failed to generate task completion prompt:', error);
                }
            }

            // Process extracted suggestions into AI tasks for Pro/Vanguard users
            if (suggestions && suggestions.length > 0 && finalTargetConvoId !== EVERYTHING_ELSE_ID) {
                try {
                    const userTier = await unifiedUsageService.getTier();
                    if (userTier === 'pro' || userTier === 'vanguard_pro') {
                        // Convert suggestions to DetectedTask format
                        const detectedTasks: DetectedTask[] = suggestions.map((suggestion, index) => ({
                            title: suggestion,
                            description: `AI-generated task based on your query: "${text}"`,
                            category: 'custom' as const,
                            confidence: 0.8,
                            source: 'ai_response'
                        }));
                        
                        await otakuDiaryService.addAISuggestedTasks(finalTargetConvoId, detectedTasks);
                        console.log(`🎯 Added ${suggestions.length} AI suggested tasks from streaming response for ${finalTargetConvoId}`);
                    }
                } catch (error) {
                    console.warn('Failed to add suggested tasks from streaming response:', error);
                }
            }
            
            setChatState(prev => {
                let newConversations = { ...prev.conversations };
                let newOrder = [...prev.order];
                let newActiveId = prev.activeId;
                const sourceConvo = newConversations[sourceConvoId];
                if (!sourceConvo) return prev;

                const finalModelMessage: ChatMessage = {
                    id: modelMessageId, role: 'model', text: finalCleanedText,
                    ...(suggestions.length > 0 && { suggestions }),
                    ...(triumphPayload && { triumph: triumphPayload }),
                    ...(taskCompletionPrompt && { taskCompletionPrompt })
                };
                
                const isNewConversation = finalTargetConvoId !== sourceConvoId;
                if (isNewConversation) {
                    const doesTargetExist = !!newConversations[finalTargetConvoId];
                    const targetConvo = newConversations[finalTargetConvoId] || { id: finalTargetConvoId, title: identifiedGameName!, messages: [], createdAt: Date.now() };
                    targetConvo.messages = [...targetConvo.messages, userMessage, finalModelMessage];
                    newConversations[finalTargetConvoId] = targetConvo;
                    sourceConvo.messages = sourceConvo.messages.filter(m => m.id !== userMessage.id && m.id !== modelMessageId);
                    
                    if (!doesTargetExist) {
                        const newOrderSet = new Set([EVERYTHING_ELSE_ID, finalTargetConvoId, ...prev.order]);
                        newOrder = Array.from(newOrderSet);
                    }
                    if (unifiedAIService().isChatActive(sourceConvoId)) {
                        unifiedAIService().renameChatSession(sourceConvoId, finalTargetConvoId);
                    }
                } else {
                    sourceConvo.messages = sourceConvo.messages.map(m => m.id === modelMessageId ? finalModelMessage : m);
                }
                
                const targetConvoForUpdate = newConversations[finalTargetConvoId];
                if (targetConvoForUpdate) {
                    // Create Otaku Diary tab for ALL users (free, pro, vanguard) when game pill is created
                    if (identifiedGameName && gameGenre && !targetConvoForUpdate.insights) {
                        // 🔥 CRITICAL INTEGRATION: Add Otaku Diary tab for ALL users (free, pro, vanguard)
                        const otakuDiaryInsight: Insight = {
                            id: 'otaku-diary',
                            title: '📖 Otaku Diary',
                            content: '📝 **Your Personal Game Diary**\n\n✨ Track your tasks and favorite moments\n\n🎯 **Features:**\n• Create and manage to-do lists\n• Save favorite AI responses and insights\n• Track your gaming progress\n• Organize your thoughts and discoveries\n\n🚀 **Available for all users!**',
                            status: 'loaded' as any,
                            isPlaceholder: false,
                            lastUpdated: Date.now(),
                            generationAttempts: 0
                        };
                        
                        // Create insights object with Otaku Diary
                        const instantInsights: Record<string, Insight> = {
                            'otaku-diary': otakuDiaryInsight
                        };
                        
                        // For Pro/Vanguard users, also create other insight tabs
                        if (isProUser) {
                            const tabs = insightTabsConfig[gameGenre] || insightTabsConfig.default;
                            if (tabs) {
                                const insightsOrder = tabs.map(t => t.id);
                                
                                // Create insight tabs with loading status - will be populated with actual content
                                tabs.forEach(tab => {
                                instantInsights[tab.id] = { 
                                    id: tab.id, 
                                    title: tab.title, 
                                    content: '🔄 Generating comprehensive insights for you...', 
                                    status: 'loading' as any,
                                    isPlaceholder: false,
                                    lastUpdated: Date.now(),
                                    generationAttempts: 0
                                };
                            });
                            
                            // Add Otaku Diary to insights order (first)
                            insightsOrder.unshift('otaku-diary');
                            targetConvoForUpdate.insightsOrder = insightsOrder;
                        }
                            
                        console.log(`🔄 Created Otaku Diary + ${tabs?.length || 0} insight tabs for Pro user: ${identifiedGameName}`);
                            
                            // Generate all insights in one API call for better performance
                            if (gameProgress !== null) {
                                generateAllInsightsAtOnce(identifiedGameName, gameGenre, gameProgress, finalTargetConvoId);
                            }
                        } else {
                            // For free users, only create Otaku Diary tab
                            targetConvoForUpdate.insightsOrder = ['otaku-diary'];
                            console.log(`🔄 Created Otaku Diary tab for free user: ${identifiedGameName}`);
                        }
                        
                        targetConvoForUpdate.insights = instantInsights;
                    }
                    if (gameProgress !== null) targetConvoForUpdate.progress = gameProgress;
                    if (parsedInventory?.items) targetConvoForUpdate.inventory = parsedInventory.items;
                    if (gameGenre) targetConvoForUpdate.genre = gameGenre;
                    if (insightUpdate && targetConvoForUpdate.insights?.[insightUpdate.id]) {
                        const insight = targetConvoForUpdate.insights[insightUpdate.id];
                        if (insight) {
                            const oldContent = insight.content;
                            const separator = oldContent && oldContent !== 'Loading...' ? '\n\n' : '';
                            const newContent = (oldContent === 'Loading...' ? '' : oldContent) + separator + insightUpdate.content;
                            insight.content = newContent;
                            insight.status = 'loaded';
                            insight.isNew = true;
                        }
                    }
                    if(isGameUnreleased) targetConvoForUpdate.lastTrailerTimestamp = Date.now();
                     if (objectiveSet) {
                        targetConvoForUpdate.activeObjective = { description: objectiveSet.description, isCompleted: false };
                    }
                    if (objectiveComplete && targetConvoForUpdate.activeObjective) {
                        targetConvoForUpdate.activeObjective.isCompleted = true;
                    }
                    targetConvoForUpdate.lastInteractionTimestamp = Date.now();
                }

                newActiveId = finalTargetConvoId;
                newOrder = newOrder.sort(sortConversations(newConversations));

                return { conversations: newConversations, order: newOrder, activeId: newActiveId };
            });

            if (isHandsFreeMode) {
                // Use the extracted game help section. If missing, extract the most relevant part of the response.
                let textToSpeak = '';
                
                if (hintMatch?.[1]) {
                    // Use the explicitly marked game help section
                    textToSpeak = hintMatch[1].trim();
                    console.log('🎤 Hands-free: Using explicit game help section');
                } else {
                    // Fallback: Extract the most relevant part of the response for hands-free mode
                    textToSpeak = extractGameHelpFromResponse(finalCleanedText, text && typeof text === 'string' ? text.trim() : '');
                    console.log('🎤 Hands-free: Using extracted game help (no explicit tags found)');
                }
                
                if (textToSpeak) {
                    ttsService.speak(textToSpeak).catch(error => addSystemMessage(`Could not play audio hint: ${error.message}`));
                }
            }

            // 🔥 NEW: Consolidated insight update function that only runs on user queries
            if (isProUser && finalTargetConvoId !== EVERYTHING_ELSE_ID) {
                updateInsightsOnUserQuery(finalCleanedText, finalTargetConvoId, identifiedGameName, gameGenre, gameProgress, text && typeof text === 'string' ? text.trim() : '');
                
                // Ensure insights are saved to database immediately
                try {
                    const targetConvo = conversations[finalTargetConvoId];
                    if (targetConvo?.insights && targetConvo?.insightsOrder) {
                        // Save insights as object (not array) for proper persistence
                        const insightsObject = targetConvo.insights;
                        
                        await secureConversationService.saveConversation(
                            finalTargetConvoId,
                            targetConvo.title,
                            targetConvo.messages,
                            Object.values(insightsObject), // Convert object to array
                            targetConvo.context,
                            targetConvo.context?.gameId,
                            targetConvo.isPinned,
                            true // force overwrite
                        );
                        console.log('✅ Insights saved to database for conversation:', finalTargetConvoId, 'with', Object.keys(insightsObject).length, 'tabs');
                        
                        // Also save to localStorage as backup
                        try {
                            localStorage.setItem(`otakon_insights_${finalTargetConvoId}`, JSON.stringify({
                                insights: insightsObject,
                                insightsOrder: targetConvo.insightsOrder,
                                lastSaved: Date.now()
                            }));
                            console.log('💾 Insights saved to localStorage backup for conversation:', finalTargetConvoId);
                        } catch (localError) {
                            console.warn('Failed to save insights to localStorage:', localError);
                        }
                    }
                } catch (error) {
                    console.error('Failed to save insights to database:', error);
                }
            }

            // Cache paid latest-info responses for reuse across the app
            if (latestInfoQuery && finalCleanedText) {
                try {
                    // Using static import instead of dynamic import for Firebase hosting compatibility
                    const cacheType = sourceConvoId === EVERYTHING_ELSE_ID ? 'general' : 'game_info';
                    // Removed unifiedCacheService - using simpleCacheService instead
                    await simpleCacheService.cacheContent({
                        query: text && typeof text === 'string' ? text.trim() : '',
                        content: finalCleanedText,
                        contentType: cacheType as any,
                        gameName: sourceConvoId === EVERYTHING_ELSE_ID ? undefined : sourceConvoId,
                        genre: gameGenre || sourceConversation.genre,
                        userTier: 'paid'
                    } as any);
                } catch (e) {
                    console.warn('Universal cache save failed:', e);
                }
            }

            // Note: Insights are now generated in one unified API call for better performance
            // All insight tabs are populated simultaneously when the user makes a query

            if (insightModifyPending) setPendingModification(insightModifyPending);
            if (insightDeleteRequest) deleteInsight(finalTargetConvoId, insightDeleteRequest.id);

            // --- Game Knowledge Learning ---
            // Learn from this AI response to improve our knowledge base
            try {
                const gameTitle = finalTargetConvoId !== EVERYTHING_ELSE_ID ? finalTargetConvoId : identifiedGameName;
                if (gameTitle && finalCleanedText) {
                    await gameKnowledgeService.learnFromAIResponse(
                        text && typeof text === 'string' ? text.trim() : '',
                        finalCleanedText,
                        gameTitle,
                        true // Assume helpful response
                    );
                    
                    // Removed unifiedAnalyticsService - not used
                }
            } catch (error) {
                console.warn('Failed to learn from AI response:', error);
            }

            // Removed unifiedAnalyticsService - not used

            return { success: true };

        } catch(e) {
            const error = e instanceof Error ? e : new Error('An unknown error occurred.');
            onError(error);

            // Removed unifiedAnalyticsService - not used

            return { success: false, reason: 'error' };
        } finally {
            delete abortControllersRef.current[modelMessageId];
        }
    }, [activeConversationId, isHandsFreeMode, addSystemMessage, handleQuotaError, updateConversation, updateMessageInConversation, deleteInsight]);
    
    const stopMessage = useCallback((messageId: string) => {
        ttsService.cancel();
        abortControllersRef.current[messageId]?.abort();
        delete abortControllersRef.current[messageId];
        setLoadingMessages(prev => prev.filter(id => id !== messageId));
        updateMessageInConversation(activeConversationId, messageId, msg => ({ ...msg, text: '*Request cancelled by user.*' }));
    }, [activeConversationId, updateMessageInConversation]);
    
    const resetConversations = useCallback(async () => {
        try {
            // Cancel any ongoing operations
            ttsService.cancel();
            unifiedAIService().resetChat();
            
            // Clear abort controllers
            Object.values(abortControllersRef.current).forEach(controller => {
                controller.abort();
            });
            abortControllersRef.current = {};
            
            // Clear any pending save operations
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
            }
            
            // Check if user is authenticated before saving
            const authState = authService.getCurrentState();
            if (!authState.user) {
                console.log('🔐 User not authenticated, skipping conversation reset save');
                // Still update local state even if not authenticated
                const defaultConversations = {
                    [EVERYTHING_ELSE_ID]: {
                        id: EVERYTHING_ELSE_ID,
                        title: 'Everything else',
                        messages: [],
                        createdAt: Date.now(),
                    }
                };
                
                setChatState({
                    conversations: defaultConversations,
                    order: [EVERYTHING_ELSE_ID],
                    activeId: EVERYTHING_ELSE_ID
                });
                
                setLoadingMessages([]);
                console.log('✅ Conversations reset successfully (local only)');
                return;
            }
            
            // Reset using atomic service
            const defaultConversations = {
                [EVERYTHING_ELSE_ID]: {
                    id: EVERYTHING_ELSE_ID,
                    title: 'Everything else',
                    messages: [],
                    createdAt: Date.now(),
                }
            };
            
            // Save the reset state atomically
            for (const [conversationId, conversation] of Object.entries(defaultConversations)) {
                await secureConversationService.saveConversation(
                    conversationId,
                    conversation.title,
                    conversation.messages,
                    [],
                    {}
                );
            }
            
            // Update local state
            setChatState({
                conversations: defaultConversations,
                order: [EVERYTHING_ELSE_ID],
                activeId: EVERYTHING_ELSE_ID
            });
            
            setLoadingMessages([]);
            console.log('✅ Conversations reset successfully');
        } catch (error) {
            console.error('Failed to reset conversations:', error);
            
            // Fallback: just update local state
            setChatState({
                conversations: {
                    [EVERYTHING_ELSE_ID]: {
                        id: EVERYTHING_ELSE_ID,
                        title: 'Everything else',
                        messages: [],
                        createdAt: Date.now(),
                    }
                },
                order: [EVERYTHING_ELSE_ID],
                activeId: EVERYTHING_ELSE_ID
            });
            setLoadingMessages([]);
        }
    }, [secureConversationService]);
    
    const switchConversation = useCallback((id: string) => {
        ttsService.cancel();
        if (conversations[id]) {
            setChatState(prev => ({...prev, activeId: id}));
        }
    }, [conversations]);
    
    const restoreHistory = useCallback((history: Conversations) => {
        if (!history || Object.keys(history).length === 0 || !history[EVERYTHING_ELSE_ID]) {
            resetConversations();
            return;
        }
        const newOrder = Object.keys(history).sort(sortConversations(history));
        
        // Preserve current active conversation if it still exists, otherwise use first available
        const currentActiveId = chatState.activeId;
        const activeId = (currentActiveId && history[currentActiveId]) 
            ? currentActiveId 
            : (newOrder.length > 0 ? newOrder[0] : EVERYTHING_ELSE_ID);
            
        console.log('🔧 [useChat] Restoring history with preserved active conversation:', {
            currentActiveId,
            preservedActiveId: activeId,
            conversationCount: Object.keys(history).length
        });
        
        setChatState({ conversations: history, order: newOrder, activeId: activeId || EVERYTHING_ELSE_ID });
    }, [resetConversations, chatState.activeId]);

    const fetchInsightContent = useCallback(async (conversationId: string, insightId: string) => {
        const conversation = conversations[conversationId];
        if (!conversation || !conversation.insights || !conversation.genre || typeof conversation.progress !== 'number') return;
    
        const tabs = insightTabsConfig[conversation.genre] || insightTabsConfig.default;
        const insightTabConfig = tabs?.find(tab => tab.id === insightId);
        if (!insightTabConfig) return;
    
        updateConversation(conversationId, convo => {
            const existingInsight = convo.insights?.[insightId];
            if (!existingInsight) return convo;
            
            return {
                ...convo,
                insights: { 
                    ...convo.insights!, 
                    [insightId]: { 
                        ...existingInsight, 
                        status: 'streaming' 
                    } 
                }
            };
        });
    
        const controller = new AbortController();
        // You might want to store this controller in a ref if you need to abort it from elsewhere
    
        try {
            if (insightTabConfig.webSearch) {
                // Gate webSearch insights for Free tier
                try {
                    const tier = await unifiedUsageService.getTier();
                    if (tier === 'free') {
                        addSystemMessage('This insight requires the latest data. Upgrade to Pro/Vanguard to enable live updates.', conversationId, true);
                        updateConversation(conversationId, convo => {
                            const existingInsight = convo.insights?.[insightId];
                            if (!existingInsight) return convo;
                            
                            return {
                                ...convo,
                                insights: { 
                                    ...convo.insights!, 
                                    [insightId]: { 
                                        ...existingInsight, 
                                        status: 'error', 
                                        content: 'Upgrade to enable live data for this tab.' 
                                    } 
                                }
                            };
                        });
                        return;
                    }
                } catch (e) {
                    console.warn('Failed to check tier for webSearch gating:', e);
                }

                // Use the non-streaming function for web search
                const prompt = `Generate content for the "${insightTabConfig.title}" insight for the game ${conversation.title} (${conversation.genre}).
                
${insightTabConfig.instruction}

Game: ${conversation.title}
Genre: ${conversation.genre}
Progress: ${conversation.progress}%`;

                // Try cache first (global, device-agnostic)
                let fullContent = '';
                try {
                    // Using static import instead of dynamic import for Firebase hosting compatibility
                    const cached = await simpleCacheService.getCachedContent({
                        query: `${conversation.title}:${insightId}:${insightTabConfig.title}`,
                        contentType: 'insight_tab',
                        gameName: conversation.title,
                        genre: conversation.genre,
                        userTier: 'paid'
                    } as any);
                    if (cached) {
                        fullContent = cached;
                    }
                } catch (e) {
                    console.warn('Insight cache lookup failed:', e);
                }

                if (!fullContent) {
                    const prompt = `${insightTabConfig.instruction || ''} for ${conversation.title}`;
                    fullContent = await unifiedAIService().generateInsightWithSearch(
                        prompt,
                        'flash',
                        controller.signal
                    );
                    // Save to cache
                    try {
                        // Using static import instead of dynamic import for Firebase hosting compatibility
                        await simpleCacheService.cacheContent({
                            query: `${conversation.title}:${insightId}:${insightTabConfig.title}`,
                            content: fullContent,
                            contentType: 'insight_tab',
                            gameName: conversation.title,
                            genre: conversation.genre,
                            userTier: 'paid'
                        } as any);
                    } catch (e) {
                        console.warn('Insight cache save failed:', e);
                    }
                }
                if (controller.signal.aborted) return;
                updateConversation(conversationId, convo => {
                    const existingInsight = convo.insights?.[insightId];
                    if (!existingInsight) return convo;
                    
                    return {
                        ...convo,
                        insights: { 
                            ...convo.insights!, 
                            [insightId]: { 
                                ...existingInsight, 
                                content: fullContent, 
                                status: 'loaded', 
                                isNew: true 
                            } 
                        }
                    };
                });
            } else {
                // Use the streaming function for non-search insights
                let fullContent = '';
                const prompt = `${insightTabConfig.instruction || ''} for ${conversation.title}`;
                await unifiedAIService().generateInsightStream(
                    conversation.title,
                    conversation.genre || 'Unknown',
                    conversation.progress || 0,
                    insightTabConfig.instruction || '',
                    insightId,
                    (chunk) => {
                        if (controller.signal.aborted) return;
                        fullContent += chunk;
                        // Clean the content before displaying to hide tags and IDs
                        const cleanedContent = fullContent
                            .replace(comprehensiveTagCleanupRegex, '')
                            .trim();
                        updateConversation(conversationId, convo => {
                            const existingInsight = convo.insights?.[insightId];
                            if (!existingInsight) return convo;
                            
                            return {
                                ...convo,
                                insights: { 
                                    ...convo.insights!, 
                                    [insightId]: { 
                                        ...existingInsight, 
                                        content: cleanedContent, 
                                        status: 'streaming' 
                                    } 
                                }
                            };
                        }, true);
                    },
                    (error) => {
                        console.error(`Error streaming insight ${insightId}:`, error);
                        updateConversation(conversationId, convo => {
                            const existingInsight = convo.insights?.[insightId];
                            if (!existingInsight) return convo;
                            
                            return {
                                ...convo,
                                insights: { 
                                    ...convo.insights!, 
                                    [insightId]: { 
                                        ...existingInsight, 
                                        content: `Error: ${error}`, 
                                        status: 'error' 
                                    } 
                                }
                            };
                        });
                    },
                    controller.signal
                );

                if (controller.signal.aborted) return;

                updateConversation(conversationId, convo => {
                    const existingInsight = convo.insights?.[insightId];
                    if (!existingInsight) return convo;
                    
                    return {
                        ...convo,
                        insights: { 
                            ...convo.insights!, 
                            [insightId]: { 
                                ...existingInsight, 
                                status: 'loaded', 
                                isNew: true 
                            } 
                        }
                    };
                });
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                console.log(`Fetch for insight ${insightId} was aborted.`);
            } else {
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                console.error(`Error fetching content for insight ${insightId}:`, error);
                updateConversation(conversationId, convo => {
                    const existingInsight = convo.insights?.[insightId];
                    if (!existingInsight) return convo;
                    
                    return {
                        ...convo,
                        insights: { 
                            ...convo.insights!, 
                            [insightId]: { 
                                ...existingInsight, 
                                content: `Error: ${errorMessage}`, 
                                status: 'error' 
                            } 
                        }
                    };
                });
            }
        }
    }, [conversations, updateConversation]);

    // Retry function for failed messages
    const retryMessage = useCallback(async (messageId: string): Promise<{ success: boolean; reason?: string }> => {
        const conversation = conversations[activeConversationId];
        if (!conversation) return { success: false, reason: 'Conversation not found' };

        const message = conversation.messages.find(m => m.id === messageId);
        if (!message || message.role !== 'user') return { success: false, reason: 'Message not found or not a user message' };

        // Removed unifiedAnalyticsService - not used

        // Remove the failed AI response
        updateConversation(activeConversationId, convo => ({
            ...convo,
            messages: convo.messages.filter(m => m.id !== messageId && m.role === 'user')
        }));

        // Resend the message - convert string[] to ImageFile[] if needed
        const imageFiles = message.images ? message.images.map(img => ({
            base64: img.split(',')[1] || img,
            mimeType: img.startsWith('data:') ? (img.split(';')[0]?.split(':')[1] || 'image/png') : 'image/png',
            dataUrl: img
        })) : undefined;
        return await sendMessage(message.text, imageFiles, message.isFromPC);
    }, [conversations, activeConversationId, updateConversation, sendMessage]);





    // Generate all insights in one API call for better performance
    const generateAllInsightsAtOnce = async (
        gameName: string,
        genre: string,
        progress: number,
        conversationId: string
    ) => {
        try {
            const tabs = insightTabsConfig[genre] || insightTabsConfig.default;
            
            // Update all tabs to show generation progress
            updateConversation(conversationId, convo => {
                if (convo.insights) {
                    Object.keys(convo.insights).forEach(tabId => {
                        const insight = convo.insights![tabId];
                        if (insight && insight.status === 'loading') {
                            insight.content = '🔄 Generating comprehensive insights...';
                        }
                    });
                }
                return convo;
            });
            
            // Generate all insights in one API call using the unified service
            const result = await unifiedAIService().generateUnifiedInsights(
                gameName,
                genre,
                progress,
                `Generate comprehensive insights for ${gameName} at ${progress}% progress`,
                new AbortController().signal
            );
            
            if (result && result.insights) {
                // Update all insights with generated content
                updateConversation(conversationId, convo => {
                    if (convo.insights && result.insights) {
                        Object.keys(result.insights).forEach(tabId => {
                            const insight = convo.insights![tabId];
                            const resultInsight = (result.insights as any)[tabId];
                            if (insight && resultInsight) {
                                insight.content = resultInsight.content;
                                insight.title = resultInsight.title;
                                insight.status = 'loaded';
                                insight.lastUpdated = Date.now();
                                insight.isNew = true;
                            }
                        });
                    }
                    return convo;
                });
                
                console.log(`Successfully generated all insights for ${gameName} in one API call`);
            } else {
                // 🚫 REMOVED: Fallback to progressive generation to prevent unauthorized API calls
                console.warn('🚫 Progressive insight generation disabled - insights only generated on user request');
            }
            
        } catch (error) {
            console.error('🚫 Unified insight generation failed:', error);
            console.warn('🚫 Progressive insight generation disabled - insights only generated on user request');
        }
    };

    // 🚨 REMOVED: Automatic background insight generation to prevent unauthorized API calls
    // Insights are now only generated when user explicitly requests them
    const generateInsightsInBackground = async (
        gameName: string,
        genre: string,
        progress: number,
        conversationId: string
    ) => {
        console.log('🚫 Background insight generation disabled - insights only generated on user request');
        
        // Set all insights to placeholder status - they will be generated when user clicks
        const tabs = insightTabsConfig[genre] || insightTabsConfig.default;
        
        updateConversation(conversationId, convo => {
            if (!convo.insights || !tabs) return convo;
            
            const updatedInsights = { ...convo.insights };
            tabs.forEach(tab => {
                if (updatedInsights[tab.id]?.isPlaceholder) {
                    const existingInsight = updatedInsights[tab.id];
                    if (existingInsight) {
                        updatedInsights[tab.id] = {
                            ...existingInsight,
                            status: 'placeholder',
                            content: `💡 Click to generate ${tab.title} content\n\nThis insight will be generated when you request it.`,
                            isPlaceholder: true
                        };
                    }
                }
            });
            
            return { ...convo, insights: updatedInsights };
        });
    };

    // Restore automatic progress updates for Pro/Vanguard users
    const updateInsightsForProgress = useCallback(async (conversationId: string, newProgress: number) => {
        const conversation = conversations[conversationId];
        if (!conversation?.insights || !conversation.genre) return;

        const currentProgress = conversation.progress || 0;
        const progressDifference = Math.abs(newProgress - currentProgress);
        
        // Only update if progress changed significantly (more than 10%)
        if (progressDifference < 10) return;

        // Only auto-update for Pro/Vanguard users
        try {
            const userTier = await unifiedUsageService.getTier();
            if (userTier !== 'pro' && userTier !== 'vanguard_pro') {
                console.log('🚫 Progress updates skipped for free user');
                return;
            }
        } catch (error) {
            console.warn('Failed to check user tier for progress updates:', error);
            return;
        }

        console.log(`Progress changed from ${currentProgress}% to ${newProgress}%, updating insights...`);

        // Update progress in conversation
        updateConversation(conversationId, convo => ({
            ...convo,
            progress: newProgress
        }));

        // Get progress-dependent tabs
        const tabs = insightTabsConfig[conversation.genre] || insightTabsConfig.default;
        if (!tabs) return;
        
        const progressDependentTabs = tabs.filter(tab => 
            (tab.instruction && tab.instruction.includes('progress')) || 
            (tab.instruction && tab.instruction.includes('current')) ||
            tab.id === 'story_so_far' ||
            tab.id === 'current_objectives'
        );

        // Generate new insights for progress-dependent tabs
        for (const tab of progressDependentTabs) {
            try {
                const newInsight = await unifiedAIService().generateInsight(
                    conversation.title || 'Unknown Game',
                    conversation.genre || 'default',
                    newProgress,
                    tab.id,
                    conversationId
                );
                
                if (newInsight) {
                    updateConversation(conversationId, convo => ({
                        ...convo,
                        insights: {
                            ...convo.insights,
                            [tab.id]: {
                                id: tab.id,
                                title: newInsight.title,
                                content: newInsight.content,
                                status: 'loaded',
                                isNew: true,
                                lastUpdated: Date.now()
                            }
                        }
                    }));
                }
            } catch (error) {
                console.warn(`Failed to update ${tab.id} for progress ${newProgress}%:`, error);
            }
        }
    }, [conversations, updateConversation, unifiedUsageService]);

    // Restore real-time insight updates for Pro/Vanguard users
    const updateInsightsInRealTime = useCallback(async (chunk: string, sourceConversation: Conversation, targetConvoId: string) => {
        // Only process for Pro/Vanguard users to control costs
        try {
            const userTier = await unifiedUsageService.getTier();
            if (userTier !== 'pro' && userTier !== 'vanguard_pro') {
                return; // Skip for free users
            }
            
            // Check if chunk contains relevant content
            const { hasRelevantContent } = extractRelevantInfoFromChunk(chunk);
            if (!hasRelevantContent) return;
            
            // Get stored progressive updates
            const progressiveUpdates = unifiedAIService().getProgressiveUpdates(targetConvoId);
            if (progressiveUpdates && Object.keys(progressiveUpdates).length > 0) {
                // Apply updates to conversation insights
                updateConversation(targetConvoId, convo => {
                    if (!convo.insights) return convo;
                    
                    const updatedInsights = { ...convo.insights };
                    Object.entries(progressiveUpdates).forEach(([tabId, update]) => {
                        if (updatedInsights[tabId]) {
                            updatedInsights[tabId] = {
                                ...updatedInsights[tabId],
                                title: update.title,
                                content: update.content,
                                status: 'loaded',
                                isNew: true,
                                lastUpdated: Date.now()
                            };
                        }
                    });
                    
                    return { ...convo, insights: updatedInsights };
                });
                
                // Clear processed updates
                unifiedAIService().clearProgressiveUpdates(targetConvoId);
                console.log('✅ Real-time progressive updates applied');
            }
        } catch (error) {
            console.warn('Failed to process real-time insight updates:', error);
        }
    }, [conversations, updateConversation, unifiedUsageService]);

    // Helper function to extract relevant information from streaming chunks
    const extractRelevantInfoFromChunk = (chunk: string) => {
        const hasRelevantContent = chunk.includes('story') || 
                                  chunk.includes('character') || 
                                  chunk.includes('quest') || 
                                  chunk.includes('objective') || 
                                  chunk.includes('inventory') || 
                                  chunk.includes('progress') ||
                                  chunk.includes('hint') ||
                                  chunk.includes('lore');
        
        return { hasRelevantContent };
    };

    // Helper function to check if a chunk is relevant to a specific insight tab
    const isChunkRelevantToInsight = (chunk: string, tab: any, newInfo: any) => {
        const tabId = tab.id;
        const chunkLower = chunk.toLowerCase();
        
        switch (tabId) {
            case 'story_so_far':
                return chunkLower.includes('story') || chunkLower.includes('plot') || chunkLower.includes('narrative');
            case 'current_objectives':
                return chunkLower.includes('objective') || chunkLower.includes('quest') || chunkLower.includes('goal');
            case 'character_insights':
                return chunkLower.includes('character') || chunkLower.includes('npc') || chunkLower.includes('companion');
            case 'world_lore':
                return chunkLower.includes('lore') || chunkLower.includes('world') || chunkLower.includes('history');
            case 'gameplay_tips':
                return chunkLower.includes('tip') || chunkLower.includes('hint') || chunkLower.includes('strategy');
            case 'inventory_analysis':
                return chunkLower.includes('inventory') || chunkLower.includes('item') || chunkLower.includes('equipment');
            default:
                return false;
        }
    };

    // 🔥 NEW: Consolidated insight update function that only runs on user queries
    const updateInsightsOnUserQuery = useCallback(async (
        finalResponse: string,
        conversationId: string,
        gameName: string | null,
        genre: string | null,
        progress: number | null,
        userQuery: string
    ) => {
        if (!gameName || !genre || progress === null || conversationId === EVERYTHING_ELSE_ID) {
            return;
        }

        try {
            console.log(`🔄 Updating insights for user query: "${userQuery}"`);
            
            // Extract all relevant information from the AI response
            const extractedInfo = {
                story: extractStoryInfo(finalResponse),
                objectives: extractObjectiveInfo(finalResponse),
                characters: extractCharacterInfo(finalResponse),
                lore: extractLoreInfo(finalResponse),
                tips: extractTipInfo(finalResponse),
                inventory: extractInventoryInfo(finalResponse),
                progress: progress,
                userQuery: userQuery
            };

            // Get insight tabs for this genre
            const tabs = insightTabsConfig[genre] || insightTabsConfig.default;
            if (!tabs) return;
            
            // Update each insight tab with new information from this query/response
            for (const tab of tabs) {
                const insight = conversations[conversationId]?.insights?.[tab.id];
                if (insight && tab.id !== 'otaku-diary') { // Skip Otaku Diary
                    
                    let newContent = '';
                    let shouldUpdate = false;
                    
                    // Determine if this insight should be updated based on the response content
                    switch (tab.id) {
                        case 'story_so_far':
                            if (extractedInfo.story) {
                                newContent = `📖 **Story Update from Query**\n\n**Your Question:** ${userQuery}\n\n**New Information:** ${extractedInfo.story}\n\n---\n\n${insight.content}`;
                                shouldUpdate = true;
                            }
                            break;
                            
                        case 'current_objectives':
                            if (extractedInfo.objectives) {
                                newContent = `🎯 **Objective Update from Query**\n\n**Your Question:** ${userQuery}\n\n**New Information:** ${extractedInfo.objectives}\n\n---\n\n${insight.content}`;
                                shouldUpdate = true;
                            }
                            break;
                            
                        case 'character_insights':
                            if (extractedInfo.characters) {
                                newContent = `👤 **Character Update from Query**\n\n**Your Question:** ${userQuery}\n\n**New Information:** ${extractedInfo.characters}\n\n---\n\n${insight.content}`;
                                shouldUpdate = true;
                            }
                            break;
                            
                        case 'world_lore':
                            if (extractedInfo.lore) {
                                newContent = `🌍 **Lore Update from Query**\n\n**Your Question:** ${userQuery}\n\n**New Information:** ${extractedInfo.lore}\n\n---\n\n${insight.content}`;
                                shouldUpdate = true;
                            }
                            break;
                            
                        case 'gameplay_tips':
                            if (extractedInfo.tips) {
                                newContent = `💡 **Tips Update from Query**\n\n**Your Question:** ${userQuery}\n\n**New Information:** ${extractedInfo.tips}\n\n---\n\n${insight.content}`;
                                shouldUpdate = true;
                            }
                            break;
                            
                        case 'inventory_analysis':
                            if (extractedInfo.inventory) {
                                newContent = `🎒 **Inventory Update from Query**\n\n**Your Question:** ${userQuery}\n\n**New Information:** ${extractedInfo.inventory}\n\n---\n\n${insight.content}`;
                                shouldUpdate = true;
                            }
                            break;
                    }
                    
                    // Update the insight if new content was found
                    if (shouldUpdate && newContent) {
                        updateConversation(conversationId, convo => {
                            if (!convo.insights?.[tab.id]) return convo;
                            
                            const existingInsight = convo.insights[tab.id];
                            if (!existingInsight) return convo;
                            
                            return {
                                ...convo,
                                insights: {
                                    ...convo.insights,
                                    [tab.id]: {
                                        ...existingInsight,
                                        content: newContent,
                                        status: 'loaded',
                                        isNew: true,
                                        lastUpdated: Date.now(),
                                        lastUpdatedFromQuery: userQuery
                                    }
                                }
                            };
                        });
                        
                        console.log(`✅ Updated ${tab.title} with new information from user query`);
                    }
                }
            }
            
            // Update progress if it changed
            const currentProgress = conversations[conversationId]?.progress || 0;
            if (Math.abs(progress - currentProgress) >= 5) { // Lower threshold for more responsive updates
                updateConversation(conversationId, convo => ({
                    ...convo,
                    progress: progress
                }));
                console.log(`📊 Progress updated to ${progress}% from user query`);
            }
            
        } catch (error) {
            console.error('Error updating insights on user query:', error);
        }
    }, [conversations, updateConversation]);

    // Helper functions to extract specific information from AI responses
    const extractStoryInfo = (response: string): string | null => {
        const storyMatch = response.match(/(?:story|plot|narrative)[:\s]*([^.!?]+[.!?])/i);
        return storyMatch?.[1]?.trim() || null;
    };

    const extractObjectiveInfo = (response: string): string | null => {
        const objectiveMatch = response.match(/(?:objective|quest|goal|mission)[:\s]*([^.!?]+[.!?])/i);
        return objectiveMatch?.[1]?.trim() || null;
    };

    const extractCharacterInfo = (response: string): string | null => {
        const characterMatch = response.match(/(?:character|npc|companion)[:\s]*([^.!?]+[.!?])/i);
        return characterMatch?.[1]?.trim() || null;
    };

    const extractLoreInfo = (response: string): string | null => {
        const loreMatch = response.match(/(?:lore|world|history|background)[:\s]*([^.!?]+[.!?])/i);
        return loreMatch?.[1]?.trim() || null;
    };

    const extractTipInfo = (response: string): string | null => {
        const tipMatch = response.match(/(?:tip|hint|strategy|advice)[:\s]*([^.!?]+[.!?])/i);
        return tipMatch?.[1]?.trim() || null;
    };

    const extractInventoryInfo = (response: string): string | null => {
        const inventoryMatch = response.match(/(?:inventory|item|equipment|gear)[:\s]*([^.!?]+[.!?])/i);
        return inventoryMatch?.[1]?.trim() || null;
    };

    // Helper function to extract the most relevant game help content for hands-free mode
    const extractGameHelpFromResponse = (response: string, userQuery: string): string => {
        // First, try to find the most relevant section based on the user's query
        const queryLower = userQuery.toLowerCase();
        
        // Look for direct answers to common game help queries
        if (queryLower.includes('how') || queryLower.includes('what') || queryLower.includes('where') || queryLower.includes('why')) {
            // Try to find the first complete sentence that seems to answer the question
            const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 10);
            for (const sentence of sentences) {
                const sentenceLower = sentence.toLowerCase();
                if (sentenceLower.includes('you can') || sentenceLower.includes('try') || sentenceLower.includes('look for') || 
                    sentenceLower.includes('check') || sentenceLower.includes('find') || sentenceLower.includes('go to')) {
                    return sentence.trim() + '.';
                }
            }
        }
        
        // Look for hint-like content
        const hintPatterns = [
            /(?:hint|tip|suggestion|advice)[:\s]*([^.!?]+[.!?])/i,
            /(?:you should|try to|look for|check|find|go to)[^.!?]*[.!?]/i,
            /(?:the key is|the solution is|you need to)[^.!?]*[.!?]/i
        ];
        
        for (const pattern of hintPatterns) {
            const match = response.match(pattern);
            if (match) {
                return match[0].trim();
            }
        }
        
        // Fallback: return the first meaningful paragraph (first 2-3 sentences)
        const paragraphs = response.split('\n\n').filter(p => p.trim().length > 20);
        if (paragraphs.length > 0) {
            const firstParagraph = paragraphs[0];
            if (firstParagraph) {
                const sentences = firstParagraph.split(/[.!?]+/).filter(s => s.trim().length > 10);
                if (sentences.length >= 2) {
                    return sentences.slice(0, 2).join('. ').trim() + '.';
                } else if (sentences.length === 1) {
                    return sentences[0]?.trim() + '.';
                }
            }
        }
        
        // Last resort: return the first 200 characters of the response
        return response.substring(0, 200).trim() + (response.length > 200 ? '...' : '');
    };

    // Detect if a query is "latest info" and should use cutoff + caching when paid
    const isLatestInfoQuery = (query: string): boolean => {
        const q = (query || '').toLowerCase();
        return (
            q.includes('latest') ||
            q.includes('new') ||
            q.includes('meta') ||
            q.includes('strategy') ||
            q.includes('build') ||
            q.includes('patch') ||
            q.includes('update') ||
            q.includes('trailer') ||
            q.includes('release date')
        );
    };

    // Tab management command handler
    const handleTabManagementCommand = useCallback(async (text: string) => {
        const command = tabManagementService.parseTabCommand(text);
        if (!command) return null;

        try {
            const currentConversation = conversations[activeConversationId];
            if (!currentConversation?.insights) return null;

            const currentTabs = Object.values(currentConversation.insights).map(insight => ({
                id: insight.id,
                title: insight.title,
                content: insight.content
            }));

            const result = await tabManagementService.executeTabCommand(
                command,
                currentTabs,
                (updatedTabs) => {
                    // Update the conversation with new tab structure
                    const updatedInsights: Record<string, Insight> = {};
                    updatedTabs.forEach((tab, index) => {
                        updatedInsights[tab.id] = {
                            id: tab.id,
                            title: tab.title,
                            content: tab.content,
                            status: 'loaded' as any,
                            lastUpdated: Date.now()
                        };
                    });

                    updateConversation(activeConversationId, convo => ({
                        ...convo,
                        insights: updatedInsights,
                        insightsOrder: updatedTabs.map(t => t.id)
                    }));
                }
            );

            return result;
        } catch (error) {
            console.error('Error executing tab management command:', error);
            return {
                success: false,
                message: '❌ Error executing command',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }, [activeConversationId, conversations, updateConversation]);

    // Handle sub view changes (for switching between chat and insights)
    const handleSubViewChange = useCallback((viewId: string) => {
        setActiveSubView(viewId);
    }, []);

    // ✅ MEMORY LEAK FIXES: Cleanup on unmount
    useEffect(() => {
        return () => {
            // Clear all intervals
            intervalsRef.current.forEach(interval => clearInterval(interval));
            intervalsRef.current.clear();
            
            // Abort all pending requests
            Object.values(abortControllersRef.current).forEach(controller => controller.abort());
            abortControllersRef.current = {};
            
            // Remove all event listeners
            eventListenersRef.current.forEach(cleanup => cleanup());
            eventListenersRef.current.clear();
            
            // Clear save timeout
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
            }
        };
    }, []);

    return {
        conversations,
        conversationsOrder,
        reorderConversations,
        activeConversationId,
        activeConversation,
        activeSubView,
        loadingMessages,
        isCooldownActive,
        sendMessage,
        stopMessage,
        resetConversations,
        addSystemMessage,
        restoreHistory,
        switchConversation,
        handleSubViewChange,
        fetchInsightContent,
        markInsightAsRead,
        saveConversationToLocalStorage,
        pinConversation,
        deleteConversation,
        deleteInsight,
        reorderInsights,
        pendingModification,
        setPendingModification,
        overwriteInsight,
        createNewInsight,
        updateMessageFeedback,
        updateInsightFeedback,
        retryMessage,
        updateConversation, // 🔥 ADDED: For enhanced insights integration
        triggerIntelligentInsightUpdate, // 🔥 NEW: Intelligent insight updates based on AI response context

        updateInsightsForProgress,
        updateInsightsOnUserQuery, // 🔥 NEW: Consolidated insight updates on user queries
        handleTabManagementCommand,
    };
};

