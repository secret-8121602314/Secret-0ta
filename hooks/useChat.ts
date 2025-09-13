import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChatMessage, Conversations, Conversation, newsPrompts, Insight, insightTabsConfig, InsightStatus, PendingInsightModification, ChatMessageFeedback } from '../services/types';
import { authService, supabase } from '../services/supabase';
import { databaseService } from '../services/databaseService';
import { secureConversationService } from '../services/secureConversationService';
import { ttsService } from '../services/ttsService';
import { contextManagementService } from '../services/contextManagementService';
import { playerProfileService } from '../services/playerProfileService';
import { taskCompletionPromptingService } from '../services/taskCompletionPromptingService';
import { unifiedCacheService } from '../services/unifiedCacheService';
import { smartNotificationService } from '../services/smartNotificationService';
import { screenshotTimelineService } from '../services/screenshotTimelineService';
import { longTermMemoryService } from '../services/longTermMemoryService';
import { unifiedAIService } from '../services/unifiedAIService';
import { otakuDiaryService } from '../services/otakuDiaryService';
import tabManagementService from '../services/tabManagementService';
import { 
  generateInitialProHint, 
  sendMessageWithImages, 
  sendTextToGemini, 
  isChatActive, 
  renameChatSession, 
  resetGeminiChat, 
  generateInsightWithSearch, 
  generateInsightStream, 
  generateUnifiedInsights 
} from '../services/chatService';
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
// import { unifiedCacheService } from '../services/unifiedCacheService';
// import { KNOWLEDGE_CUTOFF_LABEL } from '../services/constants';
// import { screenshotTimelineService } from '../services/screenshotTimelineService';
// import { unifiedAIService } from '../services/unifiedAIService';
// import { otakuDiaryService } from '../services/otakuDiaryService';
import { unifiedUsageService } from '../services/unifiedUsageService';
// import { smartNotificationService } from '../services/smartNotificationService';
import { unifiedAnalyticsService } from '../services/unifiedAnalyticsService';
// import { analyticsService } from '../services/analyticsService'; // Deleted - using unifiedAnalyticsService
// import { playerProfileService } from '../services/playerProfileService';
// import { contextManagementService } from '../services/contextManagementService';
// import { longTermMemoryService } from '../services/longTermMemoryService';
// import { databaseService } from '../services/databaseService';
// import { supabaseDataService } from '../services/supabaseDataService';

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
const tagCleanupRegex = new RegExp(`\\[OTAKON_(${allOtakonTags.join('|')}):.*?\\]`, 'gs');


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


export const useChat = (isHandsFreeMode: boolean) => {
    // Services are now imported statically, no initialization needed

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
    
    const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
    const [isCooldownActive, setIsCooldownActive] = useState(false);
    const [pendingModification, setPendingModification] = useState<PendingInsightModification | null>(null);
    const abortControllersRef = useRef<Record<string, AbortController>>({});
    
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

        saveTimeoutRef.current = setTimeout(async () => {
            isSavingRef.current = true;
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
                console.error('Failed to save conversations:', error);
            } finally {
                isSavingRef.current = false;
            }
        }, 500); // 500ms debounce
    }, [secureConversationService]);

    // Legacy functions for backward compatibility (deprecated)
    const saveConversationToSupabase = useCallback(async () => {
        console.warn('saveConversationToSupabase is deprecated. Use secureConversationService instead.');
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
                // Check if user is authenticated before loading conversations
                const { data: { user } } = await supabase.auth.getUser();
                
                if (!user) {
                    console.log('🔐 User not authenticated, skipping conversation loading');
                    return;
                }
                
                const result = await secureConversationService.loadConversations();
                
                if (isMounted && result.success && result.conversations) {
                    const conversations = result.conversations as any; // Type cast to handle interface mismatch
                    const order = Object.keys(conversations).sort(sortConversations(conversations));
                    const activeId = order.length > 0 ? order[0] : EVERYTHING_ELSE_ID;
                    
                    setChatState({
                        conversations: conversations as any, // Type cast to handle interface mismatch
                        order,
                        activeId
                    });
                    
                    console.log(`💾 Conversations loaded successfully`);
                } else if (isMounted) {
                    // Fallback to default state
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
            } catch (error) {
                console.error('Failed to load conversations:', error);
                
                if (isMounted) {
                    // Fallback to default state
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

    // Listen for authentication state changes to reload conversations when user logs in
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                console.log('🔐 User signed in, reloading conversations...');
                try {
                    const result = await secureConversationService.loadConversations();
                    
                    if (result.success && result.conversations) {
                        const conversations = result.conversations as any;
                        const order = Object.keys(conversations).sort(sortConversations(conversations));
                        const activeId = order.length > 0 ? order[0] : EVERYTHING_ELSE_ID;
                        
                        setChatState({
                            conversations: conversations as any,
                            order,
                            activeId
                        });
                        
                        console.log(`💾 Conversations reloaded after authentication`);
                    }
                } catch (error) {
                    console.error('Failed to reload conversations after authentication:', error);
                }
            } else if (event === 'SIGNED_OUT') {
                console.log('🔐 User signed out, resetting conversations to default state');
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
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Use debounced save instead of the old timeout approach
    useEffect(() => {
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
    }, []);

    const activeConversation = useMemo(() => conversations[activeConversationId], [conversations, activeConversationId]);
    
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

            // Track insight deletion for game analytics
            const gameContext = unifiedAnalyticsService().extractGameContext(convo);
            unifiedAnalyticsService().trackInsightTab({
                conversationId: convoId,
                tabId: insightId,
                tabTitle: oldInsight.title,
                tabContent: oldInsight.content,
                tabType: 'custom',
                isPinned: false,
                orderIndex: 0,
                metadata: { source: 'manual_deletion', action: 'deleted' }
            });

            return { ...convo, insights: newInsights, insightsOrder: newOrder };
        });
    }, [updateConversation]);

    const reorderConversations = useCallback((sourceIndex: number, destIndex: number) => {
        setChatState(prev => {
            const newOrder = [...prev.order];
            const [removed] = newOrder.splice(sourceIndex, 1);
            newOrder.splice(destIndex, 0, removed);
            return { ...prev, order: newOrder };
        });
    }, []);

    const markInsightAsRead = useCallback((convoId: string, insightId: string) => {
        updateConversation(convoId, convo => {
            if (convo.insights?.[insightId]?.isNew) {
                const newInsights = { ...convo.insights };
                newInsights[insightId] = { ...newInsights[insightId], isNew: false };
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
            newOrder.splice(destIndex, 0, removed);
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

            // Track insight modification for game analytics
            const gameContext = unifiedAnalyticsService().extractGameContext(convo);
            unifiedAnalyticsService().trackInsightModification({
                conversationId: convoId,
                insightId: insightId,
                modificationType: 'updated',
                oldContent: oldInsight.content,
                newContent: newInsights[insightId].content,
                changeSummary: `Title changed from "${oldInsight.title}" to "${newTitle}"`,
                metadata: { source: 'manual_overwrite', oldTitle: oldInsight.title, newTitle, oldContent: oldInsight.content, newContent }
            });

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

            // Track insight creation for game analytics
            const gameContext = unifiedAnalyticsService().extractGameContext(convo);
            unifiedAnalyticsService().trackInsightCreated({
                gameId: gameContext.gameId,
                gameTitle: gameContext.gameTitle,
                conversationId: convoId,
                insightId: newId,
                insight: newInsight,
                metadata: { source: 'manual_creation', title, content }
            });

            return { ...convo, insights: newInsights, insightsOrder: newOrder };
        });
    }, [updateConversation, addSystemMessage]);

    const updateMessageFeedback = useCallback((convoId: string, messageId: string, vote: ChatMessageFeedback) => {
        updateMessageInConversation(convoId, messageId, msg => ({ ...msg, feedback: vote }));

        // Track AI response feedback for game analytics
        const conversation = conversations[convoId];
        const gameContext = unifiedAnalyticsService().extractGameContext(conversation);
        
        unifiedAnalyticsService().trackAIResponseFeedback({
            conversationId: convoId,
            messageId,
            feedbackType: vote,
            feedbackText: undefined, // No feedback text for thumbs up/down
            metadata: { 
                responseType: 'ai_message',
                feedbackType: vote,
                gameId: gameContext.gameId,
                gameTitle: gameContext.gameTitle,
                userTier: unifiedUsageService.getTier(),
                source: 'message_feedback'
            }
        });
    }, [updateMessageInConversation, conversations, unifiedUsageService]);

    const updateInsightFeedback = useCallback((convoId: string, insightId: string, vote: ChatMessageFeedback) => {
        updateConversation(convoId, convo => {
            if (!convo.insights?.[insightId]) return convo;
            
            const oldInsight = convo.insights[insightId];
            const newInsights = { ...convo.insights };
            newInsights[insightId] = { ...oldInsight, feedback: vote };

            // Track insight feedback for game analytics
            const gameContext = unifiedAnalyticsService().extractGameContext(convo);
            unifiedAnalyticsService().trackUserFeedback({
                conversationId: convoId,
                targetType: 'insight',
                targetId: insightId,
                feedbackType: vote === 'up' ? 'up' : 'down',
                feedbackText: `${vote} on insight`,
                aiResponseContext: undefined,
                metadata: { 
                    insightTitle: oldInsight.title,
                    insightContent: oldInsight.content,
                    feedbackType: vote,
                    gameId: gameContext.gameId,
                    gameTitle: gameContext.gameTitle
                }
            });

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
        if (text.startsWith('[TAB_MANAGEMENT] ')) {
            const commandText = text.replace('[TAB_MANAGEMENT] ', '');
            const result = await handleTabManagementCommand(commandText);
            
            if (result) {
                // Add a system message showing the result
                addSystemMessage(result.message, activeConversationId, false);
                return { success: result.success, reason: result.error };
            }
        }
        
        const textQueries = text.trim().length > 0 ? 1 : 0;
        const imageQueries = images ? images.length : 0;

        if (textQueries === 0 && imageQueries === 0) return { success: true };
        
        // Track feature usage
        unifiedAnalyticsService().trackFeatureUsage({
            id: `send_message_${Date.now()}`,
            eventType: 'feature_usage',
            category: 'feature_usage',
            timestamp: Date.now(),
            sessionId: 'session-' + Date.now(),
            featureName: 'send_message',
            featureCategory: 'chat',
            action: 'complete',
            metadata: { 
                hasText: textQueries > 0, 
                hasImages: imageQueries > 0,
                isFromPC: isFromPC || false
            }
        });

        // Track user query for game analytics
        const queryId = crypto.randomUUID();
        const sourceConversation = conversationsRef.current[activeConversationId];
        if (sourceConversation) {
            unifiedAnalyticsService().trackUserQuery({
                conversationId: activeConversationId,
                queryType: imageQueries > 0 ? 'image' : 'text',
                queryText: text.trim(),
                hasImages: imageQueries > 0,
                imageCount: imageQueries,
                queryLength: text.trim().length,
                responseTimeMs: 0, // Will be updated later
                success: true,
                gameContext: sourceConversation.id !== EVERYTHING_ELSE_ID ? { gameId: sourceConversation.id } : undefined
            });
        }
        
        ttsService.cancel();

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            text,
            images: images?.map(img => img.dataUrl),
            isFromPC
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
            
            const smartResponse = await gameKnowledgeService.getSmartResponse(text.trim(), gameTitle);
            
            if (smartResponse.source === 'knowledge_base' && smartResponse.confidence >= 0.8) {
                // Use knowledge base response instead of calling AI
                console.log('Using knowledge base response:', smartResponse);
                
                // Update the message with the knowledge base response
                const finalCleanedText = smartResponse.response;
                updateMessageInConversation(activeConversationId, modelMessageId, msg => ({ ...msg, text: finalCleanedText }));
                
                // Track successful knowledge base usage
                unifiedAnalyticsService().trackKnowledgeBaseUsage({
                    gameTitle: gameTitle || 'unknown',
                    query: text.trim(),
                    confidence: smartResponse.confidence,
                    metadata: smartResponse.metadata
                });
                
                // Learn from this successful interaction
                await gameKnowledgeService.learnFromAIResponse(text.trim(), smartResponse.response, gameTitle, true);
                
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
                    const cached = await unifiedCacheService().getCachedContent({
                        query: text.trim(),
                        contentType: cacheType as any,
                        gameName: sourceConversation.id === EVERYTHING_ELSE_ID ? undefined : sourceConversation.id,
                        genre: sourceConversation.genre,
                        userTier: 'paid'
                    } as any);
                    if (cached?.found && cached.content?.content) {
                        const cachedText = cached.content.content;
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

            const promptText = metaNotes + (text.trim() || "A player needs help. First, identify the game from this screenshot. Then, provide a spoiler-free hint and some interesting lore about what's happening in the image.");
            
            let rawTextResponse = "";
            let hasError = false;

            const onChunk = (chunk: string) => {
                if (isCooldownActive) setIsCooldownActive(false);
                rawTextResponse += chunk;
                const displayText = rawTextResponse.replace(tagCleanupRegex, '').replace(/^[\s`"\]\}]*/, '').trim();
                updateMessageInConversation(activeConversationId, modelMessageId, msg => ({ ...msg, text: displayText }));
                
                // 🚫 REMOVED: Real-time insight updates to prevent unauthorized API calls
                // Insights are now only updated when user explicitly requests them
                if (isProUser && chunk.length > 0) {
                    console.log('🚫 Real-time insight updates disabled - insights only updated on user request');
                }
            };

            const onStreamingError = (error: Error) => {
                hasError = true;
                if (error.message === 'QUOTA_EXCEEDED') {
                    handleQuotaError(modelMessageId);
                } else {
                    updateMessageInConversation(activeConversationId, modelMessageId, msg => ({ ...msg, text: error.message }));
                    if (isHandsFreeMode) ttsService.speak(error.message).catch(() => {});
                }
                setLoadingMessages(prev => prev.filter(id => id !== modelMessageId));
            };

            if (isProUser) {
                const imageParts = images ? images.map(img => ({ base64: img.base64, mimeType: img.mimeType })) : null;
                rawTextResponse = await generateInitialProHint(promptText, imageParts, sourceConversation, history, onError, controller.signal) || "";
            } else {
                if (images && images.length > 0) {
                    const imageParts = images.map(img => ({ base64: img.base64, mimeType: img.mimeType }));
                    await sendMessageWithImages(promptText, imageParts, sourceConversation, controller.signal, onChunk, onStreamingError, history);
                } else {
                    await sendTextToGemini(promptText, sourceConversation, controller.signal, onChunk, onStreamingError, history);
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
            if (gameIdMatch) identifiedGameName = gameIdMatch[1].trim();

            const genreMatch = rawTextResponse.match(/\[OTAKON_GENRE:\s*(.*?)\]/);
            if (genreMatch) gameGenre = genreMatch[1].trim();

            const confidenceMatch = rawTextResponse.match(/\[OTAKON_CONFIDENCE:\s*(high|low)\]/);
            const hasImages = !!(images && images.length > 0);
            const isConfidenceHigh = confidenceMatch?.[1] === 'high';
            if (isConfidenceHigh || (identifiedGameName && !hasImages)) {
                const progressMatch = rawTextResponse.match(/\[OTAKON_GAME_PROGRESS:\s*(\d+)\]/);
                if (progressMatch) gameProgress = parseInt(progressMatch[1], 10);
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
                .replace(tagCleanupRegex, '')
                .replace(/^Game Progress: \d+%\s*$/m, '')
                .replace(/^[\s`"\]\}]*/, '')
                .replace(/[\s`"\]\}]*$/, '')
                // Remove these problematic lines that filter out formatting:
                // .replace(/\s+/g, ' ') // Clean up multiple spaces
                // .replace(/\n\s*\n/g, '\n') // Clean up multiple newlines
                .trim();
            
            // Show notification for AI response if screen is locked
            if (smartNotificationService().isScreenLocked()) {
                smartNotificationService().showAINotification(finalCleanedText, sourceConvoId);
            }

            let finalTargetConvoId = sourceConvoId;
            const identifiedGameId = identifiedGameName ? generateGameId(identifiedGameName) : null;
            
            // Guardrails for promoting to a dedicated game tab (pill)
            const canPromotePill = !!identifiedGameId && (hasImages || (!hasImages && isConfidenceHigh));
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
            }

            // NEW: Generate AI suggested tasks for Pro/Vanguard users
            if (finalTargetConvoId !== EVERYTHING_ELSE_ID && rawTextResponse) {
                try {
                    const userTier = await unifiedUsageService.getTier();
                    if (userTier === 'pro' || userTier === 'vanguard_pro') {
                        // Get context for task generation using statically imported services
                        
                        const longTermContext = longTermMemoryService.getLongTermContext(finalTargetConvoId);
                        const screenshotTimelineContext = screenshotTimelineService.getTimelineContext(finalTargetConvoId);
                        
                        // Get insight tab context from the conversation
                        const targetConversation = conversations[finalTargetConvoId];
                        const insightTabContext = targetConversation?.insights ? 
                          unifiedAIService().getInsightTabContext(targetConversation) : '';
                        
                        // Generate AI suggested tasks
                        const suggestedTasks = await unifiedAIService().generateSuggestedTasks(
                          targetConversation || { 
                            id: finalTargetConvoId, 
                            title: identifiedGameName || 'Unknown Game',
                            messages: [],
                            createdAt: Date.now()
                          },
                          text,
                          rawTextResponse
                        );
                        
                        // Add tasks to Otaku Diary
                        if (suggestedTasks.length > 0) {
                          await otakuDiaryService.addAISuggestedTasks(finalTargetConvoId, suggestedTasks);
                          console.log(`🎯 Added ${suggestedTasks.length} AI suggested tasks for ${finalTargetConvoId}`);
                        }
                    }
                } catch (error) {
                  console.warn('Failed to generate AI suggested tasks:', error);
                }
            }

            // NEW: Get task completion prompt from AI response
            let taskCompletionPrompt = undefined;
            if (finalTargetConvoId !== EVERYTHING_ELSE_ID) {
                try {
                    // Using static imports instead of dynamic imports for Firebase hosting compatibility
                    
                    const userTier = await unifiedUsageService.getTier();
                    const centralTasks = await otakuDiaryService.getCentralTasks(finalTargetConvoId);
                    const aiGeneratedTasks = await otakuDiaryService.getAISuggestedTasks(finalTargetConvoId);
                    
                    taskCompletionPrompt = taskCompletionPromptingService.generateCompletionPrompt(
                        finalTargetConvoId,
                        userTier,
                        centralTasks,
                        aiGeneratedTasks
                    );
                } catch (error) {
                    console.warn('Failed to generate task completion prompt:', error);
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
                    suggestions: suggestions.length > 0 ? suggestions : undefined,
                    triumph: triumphPayload,
                    taskCompletionPrompt, // NEW: Add task completion prompt
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
                    if (isChatActive(sourceConvoId)) {
                        renameChatSession(sourceConvoId, finalTargetConvoId);
                    }
                } else {
                    sourceConvo.messages = sourceConvo.messages.map(m => m.id === modelMessageId ? finalModelMessage : m);
                }
                
                const targetConvoForUpdate = newConversations[finalTargetConvoId];
                if (targetConvoForUpdate) {
                     if (isProUser && identifiedGameName && gameGenre && !targetConvoForUpdate.insights) {
                        const tabs = insightTabsConfig[gameGenre] || insightTabsConfig.default;
                        const insightsOrder = tabs.map(t => t.id);
                        
                        // Create insight tabs with loading status - will be populated with actual content
                        const instantInsights: Record<string, Insight> = {};
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
                        
                        // Add Otaku Diary to insights and order
                        instantInsights['otaku-diary'] = otakuDiaryInsight;
                        insightsOrder.unshift('otaku-diary'); // Put Otaku Diary first
                        
                        targetConvoForUpdate.insights = instantInsights;
                        targetConvoForUpdate.insightsOrder = insightsOrder;
                        
                        console.log(`🔄 Created Otaku Diary tab for game: ${identifiedGameName}`);
                        
                        // Generate all insights in one API call for better performance
                        if (gameProgress !== null) {
                            generateAllInsightsAtOnce(identifiedGameName, gameGenre, gameProgress, finalTargetConvoId);
                        }
                    }
                    if (gameProgress !== null) targetConvoForUpdate.progress = gameProgress;
                    if (parsedInventory?.items) targetConvoForUpdate.inventory = parsedInventory.items;
                    if (gameGenre) targetConvoForUpdate.genre = gameGenre;
                    if (insightUpdate && targetConvoForUpdate.insights?.[insightUpdate.id]) {
                        const oldContent = targetConvoForUpdate.insights[insightUpdate.id].content;
                        const separator = oldContent && oldContent !== 'Loading...' ? '\n\n' : '';
                        const newContent = (oldContent === 'Loading...' ? '' : oldContent) + separator + insightUpdate.content;
                        targetConvoForUpdate.insights[insightUpdate.id].content = newContent;
                        targetConvoForUpdate.insights[insightUpdate.id].status = 'loaded';
                        targetConvoForUpdate.insights[insightUpdate.id].isNew = true;
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
                
                if (hintMatch) {
                    // Use the explicitly marked game help section
                    textToSpeak = hintMatch[1].trim();
                    console.log('🎤 Hands-free: Using explicit game help section');
                } else {
                    // Fallback: Extract the most relevant part of the response for hands-free mode
                    textToSpeak = extractGameHelpFromResponse(finalCleanedText, text.trim());
                    console.log('🎤 Hands-free: Using extracted game help (no explicit tags found)');
                }
                
                if (textToSpeak) {
                    ttsService.speak(textToSpeak).catch(error => addSystemMessage(`Could not play audio hint: ${error.message}`));
                }
            }

            // 🔥 NEW: Consolidated insight update function that only runs on user queries
            if (isProUser && finalTargetConvoId !== EVERYTHING_ELSE_ID) {
                updateInsightsOnUserQuery(finalCleanedText, finalTargetConvoId, identifiedGameName, gameGenre, gameProgress, text.trim());
            }

            // Cache paid latest-info responses for reuse across the app
            if (latestInfoQuery && finalCleanedText) {
                try {
                    // Using static import instead of dynamic import for Firebase hosting compatibility
                    const cacheType = sourceConvoId === EVERYTHING_ELSE_ID ? 'general' : 'game_info';
                    await unifiedCacheService().cacheContent({
                        query: text.trim(),
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
                        text.trim(),
                        finalCleanedText,
                        gameTitle,
                        true // Assume helpful response
                    );
                    
                    // Track knowledge learning for analytics
                    unifiedAnalyticsService().trackKnowledgeLearning({
                        gameTitle,
                        userQuery: text.trim(),
                        responseLength: finalCleanedText.length,
                        source: 'ai_response'
                    });
                }
            } catch (error) {
                console.warn('Failed to learn from AI response:', error);
            }

            // Track successful user query completion for game analytics
            const conversation = conversations[finalTargetConvoId];
            const gameContext = unifiedAnalyticsService().extractGameContext(conversation);
            
            unifiedAnalyticsService().trackUserQuery({
                conversationId: finalTargetConvoId,
                queryType: imageQueries > 0 ? 'image' : 'text',
                queryText: text,
                hasImages: imageQueries > 0,
                imageCount: imageQueries,
                queryLength: text.length,
                aiResponseLength: finalCleanedText.length,
                responseTimeMs: 0, // Stub response time
                success: true,
                gameContext,
                metadata: { 
                    userTier: unifiedUsageService.getTier(),
                    isFromPC: isFromPC || false,
                    gameGenre,
                    gameProgress,
                    isGameUnreleased,
                    hasInsights: !!insightUpdate,
                    hasObjective: !!objectiveSet
                }
            });

            return { success: true };

        } catch(e) {
            const error = e instanceof Error ? e : new Error('An unknown error occurred.');
            onError(error);

            // Track failed user query for game analytics
            const conversation = conversations[sourceConvoId];
            const gameContext = unifiedAnalyticsService().extractGameContext(conversation);
            
            unifiedAnalyticsService().trackUserQuery({
                conversationId: sourceConvoId,
                queryType: imageQueries > 0 ? 'image' : 'text',
                queryText: text,
                hasImages: imageQueries > 0,
                imageCount: imageQueries,
                queryLength: text.length,
                responseTimeMs: 0, // Stub response time
                success: false,
                errorMessage: error.message,
                gameContext,
                metadata: { 
                    userTier: unifiedUsageService.getTier(),
                    isFromPC: isFromPC || false,
                    error: error.message
                }
            });

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
            resetGeminiChat();
            
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
        setChatState({ conversations: history, order: newOrder, activeId: EVERYTHING_ELSE_ID });
    }, [resetConversations]);

    const fetchInsightContent = useCallback(async (conversationId: string, insightId: string) => {
        const conversation = conversations[conversationId];
        if (!conversation || !conversation.insights || !conversation.genre || typeof conversation.progress !== 'number') return;
    
        const insightTabConfig = (insightTabsConfig[conversation.genre] || insightTabsConfig.default).find(tab => tab.id === insightId);
        if (!insightTabConfig) return;
    
        updateConversation(conversationId, convo => ({
            ...convo,
            insights: { ...convo.insights!, [insightId]: { ...convo.insights![insightId], status: 'streaming' } }
        }));
    
        const controller = new AbortController();
        // You might want to store this controller in a ref if you need to abort it from elsewhere
    
        try {
            if (insightTabConfig.webSearch) {
                // Gate webSearch insights for Free tier
                try {
                    const tier = await unifiedUsageService.getTier();
                    if (tier === 'free') {
                        addSystemMessage('This insight requires the latest data. Upgrade to Pro/Vanguard to enable live updates.', conversationId, true);
                        updateConversation(conversationId, convo => ({
                            ...convo,
                            insights: { ...convo.insights!, [insightId]: { ...convo.insights![insightId], status: 'error', content: 'Upgrade to enable live data for this tab.' } }
                        }));
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
                    const cached = await unifiedCacheService().getCachedContent({
                        query: `${conversation.title}:${insightId}:${insightTabConfig.title}`,
                        contentType: 'insight_tab',
                        gameName: conversation.title,
                        genre: conversation.genre,
                        userTier: 'paid'
                    } as any);
                    if (cached?.found && cached.content?.content) {
                        fullContent = cached.content.content;
                    }
                } catch (e) {
                    console.warn('Insight cache lookup failed:', e);
                }

                if (!fullContent) {
                    const prompt = `${insightTabConfig.instruction || ''} for ${conversation.title}`;
                    fullContent = await generateInsightWithSearch(
                        prompt,
                        conversation,
                        controller.signal,
                        (chunk) => {
                            if (controller.signal.aborted) return;
                            fullContent += chunk;
                            updateConversation(conversationId, convo => ({
                                ...convo,
                                insights: { ...convo.insights!, [insightId]: { ...convo.insights![insightId], content: fullContent, status: 'streaming' } }
                            }), true);
                        },
                        (error) => {
                            console.error(`Error generating insight ${insightId}:`, error);
                            updateConversation(conversationId, convo => ({
                                ...convo,
                                insights: { ...convo.insights!, [insightId]: { ...convo.insights![insightId], content: `Error: ${error.message}`, status: 'error' } }
                            }));
                        }
                    );
                    // Save to cache
                    try {
                        // Using static import instead of dynamic import for Firebase hosting compatibility
                        await unifiedCacheService().cacheContent({
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
                updateConversation(conversationId, convo => ({
                    ...convo,
                    insights: { ...convo.insights!, [insightId]: { ...convo.insights![insightId], content: fullContent, status: 'loaded', isNew: true } }
                }));
            } else {
                // Use the streaming function for non-search insights
                let fullContent = '';
                const prompt = `${insightTabConfig.instruction || ''} for ${conversation.title}`;
                await generateInsightStream(
                    prompt,
                    conversation,
                    controller.signal,
                    (chunk) => {
                        if (controller.signal.aborted) return;
                        fullContent += chunk;
                        updateConversation(conversationId, convo => ({
                            ...convo,
                            insights: { ...convo.insights!, [insightId]: { ...convo.insights![insightId], content: fullContent, status: 'streaming' } }
                        }), true);
                    },
                    (error) => {
                        console.error(`Error streaming insight ${insightId}:`, error);
                        updateConversation(conversationId, convo => ({
                            ...convo,
                            insights: { ...convo.insights!, [insightId]: { ...convo.insights![insightId], content: `Error: ${error.message}`, status: 'error' } }
                        }));
                    }
                );

                if (controller.signal.aborted) return;

                updateConversation(conversationId, convo => ({
                    ...convo,
                    insights: { ...convo.insights!, [insightId]: { ...convo.insights![insightId], status: 'loaded', isNew: true } }
                }));
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                console.log(`Fetch for insight ${insightId} was aborted.`);
            } else {
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                console.error(`Error fetching content for insight ${insightId}:`, error);
                updateConversation(conversationId, convo => ({
                    ...convo,
                    insights: { ...convo.insights!, [insightId]: { ...convo.insights![insightId], content: `Error: ${errorMessage}`, status: 'error' } }
                }));
            }
        }
    }, [conversations, updateConversation]);

    // Retry function for failed messages
    const retryMessage = useCallback(async (messageId: string): Promise<{ success: boolean; reason?: string }> => {
        const conversation = conversations[activeConversationId];
        if (!conversation) return { success: false, reason: 'Conversation not found' };

        const message = conversation.messages.find(m => m.id === messageId);
        if (!message || message.role !== 'user') return { success: false, reason: 'Message not found or not a user message' };

        // Track retry usage
        unifiedAnalyticsService().trackFeatureUsage({
            featureName: 'retry_message',
            featureCategory: 'chat',
            action: 'interact',
            timestamp: Date.now(),
            category: 'feature_usage',
            id: `retry_${messageId}_${Date.now()}`,
            eventType: 'feature_usage',
            sessionId: 'current_session',
            metadata: { 
                originalMessageId: messageId,
                conversationId: activeConversationId
            }
        });

        // Remove the failed AI response
        updateConversation(activeConversationId, convo => ({
            ...convo,
            messages: convo.messages.filter(m => m.id !== messageId && m.role === 'user')
        }));

        // Resend the message - convert string[] to ImageFile[] if needed
        const imageFiles = message.images ? message.images.map(img => ({
            base64: img.split(',')[1] || img,
            mimeType: img.startsWith('data:') ? img.split(';')[0].split(':')[1] : 'image/png',
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
                        if (convo.insights![tabId].status === 'loading') {
                            convo.insights![tabId].content = '🔄 Generating comprehensive insights...';
                        }
                    });
                }
                return convo;
            });
            
            // Generate all insights in one API call using the unified service
            const result = await generateUnifiedInsights(
                `Generate comprehensive insights for ${gameName} at ${progress}% progress`,
                { title: gameName, genre, progress },
                new AbortController().signal,
                (chunk) => console.log('Insight chunk:', chunk),
                (error) => console.error('Unified insight generation error:', error)
            );
            
            if (result && result.insights) {
                // Update all insights with generated content
                updateConversation(conversationId, convo => {
                    if (convo.insights) {
                        Object.keys(result.insights).forEach(tabId => {
                            if (convo.insights![tabId]) {
                                convo.insights![tabId].content = result.insights[tabId].content;
                                convo.insights![tabId].title = result.insights[tabId].title;
                                convo.insights![tabId].status = 'loaded';
                                convo.insights![tabId].lastUpdated = Date.now();
                                convo.insights![tabId].isNew = true;
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
            if (!convo.insights) return convo;
            
            const updatedInsights = { ...convo.insights };
            tabs.forEach(tab => {
                if (updatedInsights[tab.id]?.isPlaceholder) {
                    updatedInsights[tab.id] = {
                        ...updatedInsights[tab.id],
                        status: 'placeholder',
                        content: `💡 Click to generate ${tab.title} content\n\nThis insight will be generated when you request it.`,
                        isPlaceholder: true
                    };
                }
            });
            
            return { ...convo, insights: updatedInsights };
        });
    };

    // 🚨 REMOVED: Automatic insight updates to prevent unauthorized API calls
    // Insights are now only updated when user explicitly requests them
    const updateInsightsForProgress = useCallback(async (conversationId: string, newProgress: number) => {
        const conversation = conversations[conversationId];
        if (!conversation?.insights || !conversation.genre) return;

        const currentProgress = conversation.progress || 0;
        const progressDifference = Math.abs(newProgress - currentProgress);
        
        // Only update if progress changed significantly (more than 10%)
        if (progressDifference < 10) return;

        console.log(`Progress changed from ${currentProgress}% to ${newProgress}%, updating progress only...`);

        // Update progress in conversation (no automatic insight updates)
        updateConversation(conversationId, convo => ({
            ...convo,
            progress: newProgress
        }));

        // Mark progress-dependent insights as needing updates (user must click to regenerate)
        const tabs = insightTabsConfig[conversation.genre] || insightTabsConfig.default;
        const progressDependentTabs = tabs.filter(tab => 
            (tab.instruction && tab.instruction.includes('progress')) || 
            (tab.instruction && tab.instruction.includes('current')) ||
            tab.id === 'story_so_far' ||
            tab.id === 'current_objectives'
        );

        updateConversation(conversationId, convo => {
            if (!convo.insights) return convo;
            
            const updatedInsights = { ...convo.insights };
            progressDependentTabs.forEach(tab => {
                if (updatedInsights[tab.id] && !updatedInsights[tab.id].isPlaceholder) {
                    updatedInsights[tab.id] = {
                        ...updatedInsights[tab.id],
                        content: `🔄 Progress updated to ${newProgress}%\n\n💡 Click to regenerate ${tab.title} with current progress`,
                        status: 'placeholder',
                        isNew: true,
                        lastUpdated: Date.now()
                    };
                }
            });
            
            return { ...convo, insights: updatedInsights };
        });

        console.log('🚫 Automatic insight updates disabled - insights only updated on user request');
    }, [conversations, updateConversation]);

    // 🚨 REMOVED: Real-time insight updates to prevent unauthorized API calls
    // Insights are now only updated when user explicitly requests them
    const updateInsightsInRealTime = useCallback(async (chunk: string, sourceConversation: Conversation, targetConvoId: string) => {
        // No automatic updates - insights only change when user requests them
        console.log('🚫 Real-time insight updates disabled - insights only updated on user request');
    }, []);

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
                            
                            return {
                                ...convo,
                                insights: {
                                    ...convo.insights,
                                    [tab.id]: {
                                        ...convo.insights[tab.id],
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
        return storyMatch ? storyMatch[1].trim() : null;
    };

    const extractObjectiveInfo = (response: string): string | null => {
        const objectiveMatch = response.match(/(?:objective|quest|goal|mission)[:\s]*([^.!?]+[.!?])/i);
        return objectiveMatch ? objectiveMatch[1].trim() : null;
    };

    const extractCharacterInfo = (response: string): string | null => {
        const characterMatch = response.match(/(?:character|npc|companion)[:\s]*([^.!?]+[.!?])/i);
        return characterMatch ? characterMatch[1].trim() : null;
    };

    const extractLoreInfo = (response: string): string | null => {
        const loreMatch = response.match(/(?:lore|world|history|background)[:\s]*([^.!?]+[.!?])/i);
        return loreMatch ? loreMatch[1].trim() : null;
    };

    const extractTipInfo = (response: string): string | null => {
        const tipMatch = response.match(/(?:tip|hint|strategy|advice)[:\s]*([^.!?]+[.!?])/i);
        return tipMatch ? tipMatch[1].trim() : null;
    };

    const extractInventoryInfo = (response: string): string | null => {
        const inventoryMatch = response.match(/(?:inventory|item|equipment|gear)[:\s]*([^.!?]+[.!?])/i);
        return inventoryMatch ? inventoryMatch[1].trim() : null;
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
            const sentences = firstParagraph.split(/[.!?]+/).filter(s => s.trim().length > 10);
            if (sentences.length >= 2) {
                return sentences.slice(0, 2).join('. ').trim() + '.';
            } else if (sentences.length === 1) {
                return sentences[0].trim() + '.';
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

    return {
        conversations,
        conversationsOrder,
        reorderConversations,
        activeConversationId,
        activeConversation,
        loadingMessages,
        isCooldownActive,
        sendMessage,
        stopMessage,
        resetConversations,
        addSystemMessage,
        restoreHistory,
        switchConversation,
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

