import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChatMessage, Conversations, Conversation, newsPrompts, Insight, insightTabsConfig, InsightStatus, PendingInsightModification, ChatMessageFeedback } from '../services/types';
import { 
    getGameNews, 
    sendMessageWithImages, 
    sendMessage as sendTextToGemini, 
    isChatActive, 
    resetChat as resetGeminiChat, 
    renameChatSession,
    getUpcomingReleases,
    getLatestReviews,
    getGameTrailers,
    generateInitialProHint,
    generateUnifiedInsights,
    generateInsightStream,
    generateInsightWithSearch
} from '../services/geminiService';
import tabManagementService from '../services/tabManagementService';
import { ttsService } from '../services/ttsService';
import { unifiedUsageService } from '../services/unifiedUsageService';
import { smartNotificationService } from '../services/smartNotificationService';
import { gameAnalyticsService } from '../services/gameAnalyticsService';
import { analyticsService } from '../services/analyticsService';
import { playerProfileService } from '../services/playerProfileService';
import { contextManagementService } from '../services/contextManagementService';

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
    
    const conversationsRef = useRef(conversations);
    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);
    
    const conversationsOrderRef = useRef(conversationsOrder);
    useEffect(() => {
        conversationsOrderRef.current = conversationsOrder;
    }, [conversationsOrder]);
    
    const saveConversationsToLocalStorage = useCallback(() => {
        try {
            if (Object.keys(conversationsRef.current).length > 0) {
                const serialized = JSON.stringify({
                    conversations: conversationsRef.current,
                    order: conversationsOrderRef.current,
                    activeId: activeConversationId
                });
                 const size = new Blob([serialized]).size;
                if (size > 4 * 1024 * 1024) { // Warn if > 4MB
                     console.warn(`LocalStorage size is getting large: ${(size / 1024 / 1024).toFixed(2)} MB. Consider backend solution.`);
                }
                localStorage.setItem(CONVERSATIONS_STORAGE_KEY, serialized);
            }
        } catch (error) {
            console.error("Failed to save state to localStorage", error);
        }
    }, [activeConversationId]);

    useEffect(() => {
        let loadedState: { conversations: Conversations; order: string[]; activeId: string; } | null = null;
        try {
            const storedState = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
            if (storedState) loadedState = JSON.parse(storedState);
        } catch (error) {
            console.error("Failed to load state from localStorage", error);
        }

        if (loadedState && loadedState.conversations && loadedState.order) {
            setChatState(loadedState);
        } else {
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

    }, []);


    useEffect(() => {
        const handler = setTimeout(saveConversationsToLocalStorage, 500);
        return () => clearTimeout(handler);
    }, [chatState, saveConversationsToLocalStorage]);

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
            const gameContext = gameAnalyticsService.extractGameContext(convo);
            gameAnalyticsService.trackInsightTab({
                conversationId: convoId,
                tabId: insightId,
                tabTitle: oldInsight.title,
                tabContent: oldInsight.content,
                tabType: 'custom',
                isPinned: false,
                orderIndex: 0,
                metadata: { source: 'manual_deletion' }
            }, 'deleted');

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
            const gameContext = gameAnalyticsService.extractGameContext(convo);
            gameAnalyticsService.trackInsightModification({
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
            const gameContext = gameAnalyticsService.extractGameContext(convo);
            gameAnalyticsService.trackInsightCreated(
                gameContext.gameId,
                gameContext.gameTitle,
                convoId,
                newId,
                newInsight,
                { source: 'manual_creation', title, content }
            );

            return { ...convo, insights: newInsights, insightsOrder: newOrder };
        });
    }, [updateConversation, addSystemMessage]);

    const updateMessageFeedback = useCallback((convoId: string, messageId: string, vote: ChatMessageFeedback) => {
        updateMessageInConversation(convoId, messageId, msg => ({ ...msg, feedback: vote }));

        // Track AI response feedback for game analytics
        const conversation = conversations[convoId];
        const gameContext = gameAnalyticsService.extractGameContext(conversation);
        
        gameAnalyticsService.trackAIResponseFeedback(
            convoId,
            messageId,
            vote,
            undefined, // No feedback text for thumbs up/down
            { 
                responseType: 'ai_message',
                feedbackType: vote,
                gameId: gameContext.gameId,
                gameTitle: gameContext.gameTitle
            },
            { 
                userTier: unifiedUsageService.getTier(),
                source: 'message_feedback'
            }
        );
    }, [updateMessageInConversation, conversations, unifiedUsageService]);

    const updateInsightFeedback = useCallback((convoId: string, insightId: string, vote: ChatMessageFeedback) => {
        updateConversation(convoId, convo => {
            if (!convo.insights?.[insightId]) return convo;
            
            const oldInsight = convo.insights[insightId];
            const newInsights = { ...convo.insights };
            newInsights[insightId] = { ...oldInsight, feedback: vote };

            // Track insight feedback for game analytics
            const gameContext = gameAnalyticsService.extractGameContext(convo);
            gameAnalyticsService.trackUserFeedback({
                conversationId: convoId,
                targetType: 'insight',
                targetId: insightId,
                feedbackType: vote === 'up' ? 'up' : 'down',
                feedbackText: `${vote} on insight`,
                aiResponseContext: null,
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
        analyticsService.trackFeatureUsage({
            featureName: 'send_message',
            featureCategory: 'chat',
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
            gameAnalyticsService.trackUserQuery({
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
        
        const usage = unifiedUsageService.getUsage();
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

        const history = sourceConversation.messages || [];
        const isProUser = unifiedUsageService.getTier() !== 'free';
        
        const onError = (error: string) => {
            setLoadingMessages(prev => prev.filter(id => id !== modelMessageId));
            updateMessageInConversation(activeConversationId, modelMessageId, msg => ({ ...msg, text: `Error: ${error}`}));
        };

        try {
            // --- Game Knowledge System Integration ---
            // Try to get a smart response from our knowledge base first
            const { gameKnowledgeService } = await import('../services/gameKnowledgeService');
            const gameTitle = sourceConversation.id !== EVERYTHING_ELSE_ID ? sourceConversation.id : undefined;
            
            const smartResponse = await gameKnowledgeService.getSmartResponse(text.trim(), gameTitle);
            
            if (smartResponse.source === 'knowledge_base' && smartResponse.confidence >= 0.8) {
                // Use knowledge base response instead of calling AI
                console.log('Using knowledge base response:', smartResponse);
                
                // Update the message with the knowledge base response
                const finalCleanedText = smartResponse.response;
                updateMessageInConversation(activeConversationId, modelMessageId, msg => ({ ...msg, text: finalCleanedText }));
                
                // Track successful knowledge base usage
                gameAnalyticsService.trackKnowledgeBaseUsage(
                    gameTitle || 'unknown',
                    text.trim(),
                    smartResponse.confidence,
                    smartResponse.metadata
                );
                
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
            }
            // --- End Context Injection ---

            const promptText = metaNotes + (text.trim() || "A player needs help. First, identify the game from this screenshot. Then, provide a spoiler-free hint and some interesting lore about what's happening in the image.");
            
            let rawTextResponse = "";
            let hasError = false;

            const onChunk = (chunk: string) => {
                if (isCooldownActive) setIsCooldownActive(false);
                rawTextResponse += chunk;
                const displayText = rawTextResponse.replace(tagCleanupRegex, '').replace(/^[\s`"\]\}]*/, '').trim();
                updateMessageInConversation(activeConversationId, modelMessageId, msg => ({ ...msg, text: displayText }));
                
                // Real-time insight updates during AI response streaming
                if (isProUser && chunk.length > 0) {
                    // Use sourceConvoId for now, will be updated to finalTargetConvoId later
                    updateInsightsInRealTime(chunk, sourceConversation, sourceConvoId);
                }
            };

            const onStreamingError = (error: string) => {
                hasError = true;
                if (error === 'QUOTA_EXCEEDED') {
                    handleQuotaError(modelMessageId);
                } else {
                    updateMessageInConversation(activeConversationId, modelMessageId, msg => ({ ...msg, text: error }));
                    if (isHandsFreeMode) ttsService.speak(error).catch(() => {});
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
            if (confidenceMatch?.[1] === 'high' || (identifiedGameName && !images)) {
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
                .replace(/\s+/g, ' ') // Clean up multiple spaces
                .replace(/\n\s*\n/g, '\n') // Clean up multiple newlines
                .trim();
            
            // Show notification for AI response if screen is locked
            if (smartNotificationService.isScreenLocked()) {
                smartNotificationService.showAINotification(finalCleanedText, sourceConvoId);
            }
            
            let finalTargetConvoId = sourceConvoId;
            const identifiedGameId = identifiedGameName ? generateGameId(identifiedGameName) : null;
            
            if (identifiedGameId && (sourceConvoId === EVERYTHING_ELSE_ID || identifiedGameId !== sourceConvoId)) {
                console.log(`New game detected: "${identifiedGameName}". Creating/switching to new conversation tab.`);
                finalTargetConvoId = identifiedGameId;
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
                        
                        // Create insight tabs instantly with engaging placeholder content
                        const instantInsights: Record<string, Insight> = {};
                        tabs.forEach(tab => {
                            instantInsights[tab.id] = { 
                                id: tab.id, 
                                title: tab.title, 
                                content: `📋 **${tab.title}**\n\n✨ Generating comprehensive insights for you!\n\n🔄 **All insights will be ready shortly**\n\n🎮 Based on your current progress: ${gameProgress || 0}%`, 
                                status: 'idle' as any,
                                isPlaceholder: true,
                                lastUpdated: Date.now(),
                                generationAttempts: 0
                            };
                        });
                        targetConvoForUpdate.insights = instantInsights;
                        targetConvoForUpdate.insightsOrder = insightsOrder;
                        
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
                // Use the extracted hint text. Fallback to the fully cleaned text if tags are missing.
                const textToSpeak = hintMatch ? hintMatch[1].trim() : finalCleanedText;
                if (textToSpeak) {
                    ttsService.speak(textToSpeak).catch(error => addSystemMessage(`Could not play audio hint: ${error.message}`));
                }
            }

            // Update insights with final AI response information
            if (isProUser && finalTargetConvoId !== EVERYTHING_ELSE_ID) {
                updateInsightsWithFinalResponse(finalCleanedText, finalTargetConvoId, identifiedGameName, gameGenre, gameProgress);
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
                    gameAnalyticsService.trackKnowledgeLearning(
                        gameTitle,
                        text.trim(),
                        finalCleanedText.length,
                        'ai_response'
                    );
                }
            } catch (error) {
                console.warn('Failed to learn from AI response:', error);
            }

            // Track successful user query completion for game analytics
            const conversation = conversations[finalTargetConvoId];
            const gameContext = gameAnalyticsService.extractGameContext(conversation);
            
            gameAnalyticsService.trackUserQuery({
                conversationId: finalTargetConvoId,
                queryType: imageQueries > 0 ? 'image' : 'text',
                queryText: text,
                hasImages: imageQueries > 0,
                imageCount: imageQueries,
                queryLength: text.length,
                aiResponseLength: finalCleanedText.length,
                responseTimeMs: Date.now() - (gameAnalyticsService as any).queryStartTime || 0,
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
            const message = e instanceof Error ? e.message : 'An unknown error occurred.';
            onError(message);

            // Track failed user query for game analytics
            const conversation = conversations[sourceConvoId];
            const gameContext = gameAnalyticsService.extractGameContext(conversation);
            
            gameAnalyticsService.trackUserQuery({
                conversationId: sourceConvoId,
                queryType: imageQueries > 0 ? 'image' : 'text',
                queryText: text,
                hasImages: imageQueries > 0,
                imageCount: imageQueries,
                queryLength: text.length,
                responseTimeMs: Date.now() - (gameAnalyticsService as any).queryStartTime || 0,
                success: false,
                errorMessage: message,
                gameContext,
                metadata: { 
                    userTier: unifiedUsageService.getTier(),
                    isFromPC: isFromPC || false,
                    error: message
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
    
    const resetConversations = useCallback(() => {
        ttsService.cancel();
        resetGeminiChat();
        localStorage.removeItem(CONVERSATIONS_STORAGE_KEY);
        setChatState({
            conversations: { [EVERYTHING_ELSE_ID]: { id: EVERYTHING_ELSE_ID, title: 'Everything else', messages: [], createdAt: Date.now() } },
            order: [EVERYTHING_ELSE_ID],
            activeId: EVERYTHING_ELSE_ID
        });
        setLoadingMessages([]);
        Object.values(abortControllersRef.current).forEach(c => c.abort());
        abortControllersRef.current = {};
    }, []);
    
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
                // Use the non-streaming function for web search
                const prompt = `Generate content for the "${insightTabConfig.title}" insight for the game ${conversation.title} (${conversation.genre}).
                
${insightTabConfig.instruction}

Game: ${conversation.title}
Genre: ${conversation.genre}
Progress: ${conversation.progress}%`;

                const fullContent = await generateInsightWithSearch(
                    prompt,
                    'flash', // Always use Flash for cost optimization
                    controller.signal
                );
                if (controller.signal.aborted) return;
                updateConversation(conversationId, convo => ({
                    ...convo,
                    insights: { ...convo.insights!, [insightId]: { ...convo.insights![insightId], content: fullContent, status: 'loaded', isNew: true } }
                }));
            } else {
                // Use the streaming function for non-search insights
                let fullContent = '';
                await generateInsightStream(
                    conversation.title,
                    conversation.genre,
                    conversation.progress,
                    insightTabConfig.instruction,
                    insightTabConfig.title,
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
                            insights: { ...convo.insights!, [insightId]: { ...convo.insights![insightId], content: `Error: ${error}`, status: 'error' } }
                        }));
                    },
                    controller.signal
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
        analyticsService.trackFeatureUsage({
            featureName: 'retry_message',
            featureCategory: 'chat',
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
            
            // Update all tabs to loading status
            updateConversation(conversationId, convo => {
                if (convo.insights) {
                    Object.keys(convo.insights).forEach(tabId => {
                        if (convo.insights![tabId].isPlaceholder) {
                            convo.insights![tabId].status = 'loading';
                            convo.insights![tabId].content = '🔄 Generating all insights...';
                        }
                    });
                }
                return convo;
            });
            
            // Generate all insights in one API call using the unified service
            const result = await generateUnifiedInsights(
                gameName,
                genre,
                progress,
                `Generate comprehensive insights for ${gameName} at ${progress}% progress`,
                (error) => console.error('Unified insight generation error:', error),
                new AbortController().signal
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
                                convo.insights![tabId].isPlaceholder = false;
                                convo.insights![tabId].lastUpdated = Date.now();
                                convo.insights![tabId].isNew = true;
                            }
                        });
                    }
                    return convo;
                });
                
                console.log(`Successfully generated all insights for ${gameName} in one API call`);
            } else {
                // Fallback to progressive generation if unified approach fails
                console.warn('Unified insight generation failed, falling back to progressive generation');
                generateInsightsInBackground(gameName, genre, progress, conversationId);
            }
            
        } catch (error) {
            console.error('Unified insight generation failed:', error);
            
            // Fallback to progressive generation
            generateInsightsInBackground(gameName, genre, progress, conversationId);
        }
    };

    // Generate insights progressively in background for better performance (fallback method)
    const generateInsightsInBackground = async (
        gameName: string,
        genre: string,
        progress: number,
        conversationId: string
    ) => {
        try {
            const tabs = insightTabsConfig[genre] || insightTabsConfig.default;
            
            // Generate insights one by one with delays to avoid overwhelming the API
            for (let i = 0; i < tabs.length; i++) {
                const tab = tabs[i];
                
                // Skip if already generated or if user navigated away
                const currentConvo = conversations[conversationId];
                if (!currentConvo?.insights?.[tab.id]?.isPlaceholder) {
                    continue;
                }
                
                try {
                    // Update status to loading
                    updateConversation(conversationId, convo => {
                        if (convo.insights?.[tab.id]) {
                            convo.insights[tab.id].status = 'loading';
                            convo.insights[tab.id].content = '🔄 Generating...';
                        }
                        return convo;
                    });
                    
                    // Generate content using the unified service for this specific tab
                    const result = await generateUnifiedInsights(
                        gameName,
                        genre,
                        progress,
                        `Generate insight for ${tab.title}`,
                        (error) => console.error(`Error generating ${tab.title}:`, error),
                        new AbortController().signal
                    );
                    
                    if (result && result.insights && result.insights[tab.id]) {
                        // Update with real content
                        updateConversation(conversationId, convo => {
                            if (convo.insights?.[tab.id]) {
                                convo.insights[tab.id].content = result.insights[tab.id].content;
                                convo.insights[tab.id].title = result.insights[tab.id].title;
                                convo.insights[tab.id].status = 'loaded';
                                convo.insights[tab.id].isPlaceholder = false;
                                convo.insights[tab.id].lastUpdated = Date.now();
                                convo.insights[tab.id].isNew = true;
                            }
                            return convo;
                        });
                    }
                    
                    // Small delay between generations to avoid overwhelming the API
                    if (i < tabs.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                    
                } catch (error) {
                    console.warn(`Failed to generate ${tab.title}:`, error);
                    
                    // Mark as failed but keep placeholder for retry
                    updateConversation(conversationId, convo => {
                        if (convo.insights?.[tab.id]) {
                            convo.insights[tab.id].status = 'error';
                            convo.insights[tab.id].content = `❌ Failed to generate ${tab.title}\n\n💡 Click the tab to retry!`;
                            convo.insights[tab.id].generationAttempts = (convo.insights[tab.id].generationAttempts || 0) + 1;
                        }
                        return convo;
                    });
                }
            }
        } catch (error) {
            console.error('Background insight generation failed:', error);
        }
    };

    // Update insights dynamically when game progress changes significantly
    const updateInsightsForProgress = useCallback(async (conversationId: string, newProgress: number) => {
        const conversation = conversations[conversationId];
        if (!conversation?.insights || !conversation.genre) return;

        const currentProgress = conversation.progress || 0;
        const progressDifference = Math.abs(newProgress - currentProgress);
        
        // Only update if progress changed significantly (more than 10%)
        if (progressDifference < 10) return;

        console.log(`Progress changed from ${currentProgress}% to ${newProgress}%, updating insights...`);

        // Update progress in conversation
        updateConversation(conversationId, convo => ({
            ...convo,
            progress: newProgress
        }));

        // Regenerate insights that are progress-dependent
        const tabs = insightTabsConfig[conversation.genre] || insightTabsConfig.default;
        const progressDependentTabs = tabs.filter(tab => 
            tab.instruction.includes('progress') || 
            tab.instruction.includes('current') ||
            tab.id === 'story_so_far' ||
            tab.id === 'current_objectives'
        );

        for (const tab of progressDependentTabs) {
            try {
                const insight = conversation.insights[tab.id];
                if (insight && !insight.isPlaceholder) {
                    // Mark for regeneration
                    updateConversation(conversationId, convo => {
                        if (convo.insights?.[tab.id]) {
                            convo.insights[tab.id].content = '🔄 Updating for new progress...';
                            convo.insights[tab.id].status = 'loading';
                            convo.insights[tab.id].isNew = false;
                        }
                        return convo;
                    });

                    // Generate new content using unified service
                    const result = await generateUnifiedInsights(
                        conversation.title,
                        conversation.genre,
                        newProgress,
                        `Update ${tab.title} for new progress`,
                        (error) => console.error(`Error updating ${tab.title}:`, error),
                        new AbortController().signal
                    );

                    if (result && result.insights && result.insights[tab.id]) {
                        updateConversation(conversationId, convo => {
                            if (convo.insights?.[tab.id]) {
                                convo.insights[tab.id].content = result.insights[tab.id].content;
                                convo.insights[tab.id].title = result.insights[tab.id].title;
                                convo.insights[tab.id].status = 'loaded';
                                convo.insights[tab.id].isNew = true;
                                convo.insights[tab.id].lastUpdated = Date.now();
                            }
                            return convo;
                        });
                    }
                }
            } catch (error) {
                console.warn(`Failed to update ${tab.title} for new progress:`, error);
            }
        }
    }, [conversations, updateConversation]);

    // Update insights in real-time during AI response streaming
    const updateInsightsInRealTime = useCallback(async (chunk: string, sourceConversation: Conversation, targetConvoId: string) => {
        if (!sourceConversation?.insights || !sourceConversation.genre) return;
        
        try {
            // Extract any new information from the chunk that might be relevant to insights
            const newInfo = extractRelevantInfoFromChunk(chunk);
            
            if (newInfo.hasRelevantContent) {
                // Update relevant insights with new information
                const tabs = insightTabsConfig[sourceConversation.genre] || insightTabsConfig.default;
                
                for (const tab of tabs) {
                    const insight = sourceConversation.insights[tab.id];
                    if (insight && !insight.isPlaceholder && insight.status === 'loaded') {
                        
                        // Check if this chunk contains information relevant to this insight tab
                        if (isChunkRelevantToInsight(chunk, tab, newInfo)) {
                            // Update the insight with new information
                            updateConversation(targetConvoId, convo => {
                                if (convo.insights?.[tab.id]) {
                                    const currentContent = convo.insights[tab.id].content;
                                    const newContent = currentContent + '\n\n🆕 **New Information:**\n' + chunk;
                                    
                                    convo.insights[tab.id].content = newContent;
                                    convo.insights[tab.id].isNew = true;
                                    convo.insights[tab.id].lastUpdated = Date.now();
                                }
                                return convo;
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Error updating insights in real-time:', error);
        }
    }, [updateConversation]);

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

    // Update insights with final AI response information
    const updateInsightsWithFinalResponse = useCallback(async (
        finalResponse: string, 
        conversationId: string, 
        gameName: string | null, 
        genre: string | null, 
        progress: number | null
    ) => {
        if (!gameName || !genre || progress === null) return;
        
        try {
            // Extract key information from the final response
            const extractedInfo = {
                story: extractStoryInfo(finalResponse),
                objectives: extractObjectiveInfo(finalResponse),
                characters: extractCharacterInfo(finalResponse),
                lore: extractLoreInfo(finalResponse),
                tips: extractTipInfo(finalResponse),
                inventory: extractInventoryInfo(finalResponse)
            };
            
            // Update each insight tab with relevant information
            const tabs = insightTabsConfig[genre] || insightTabsConfig.default;
            
            for (const tab of tabs) {
                const insight = conversations[conversationId]?.insights?.[tab.id];
                if (insight && !insight.isPlaceholder) {
                    
                    let newContent = '';
                    switch (tab.id) {
                        case 'story_so_far':
                            if (extractedInfo.story) {
                                newContent = `📖 **Story Update**\n\n${extractedInfo.story}\n\n---\n\n${insight.content}`;
                            }
                            break;
                        case 'current_objectives':
                            if (extractedInfo.objectives) {
                                newContent = `🎯 **New Objective Information**\n\n${extractedInfo.objectives}\n\n---\n\n${insight.content}`;
                            }
                            break;
                        case 'character_insights':
                            if (extractedInfo.characters) {
                                newContent = `👤 **Character Update**\n\n${extractedInfo.characters}\n\n---\n\n${insight.content}`;
                            }
                            break;
                        case 'world_lore':
                            if (extractedInfo.lore) {
                                newContent = `🌍 **Lore Update**\n\n${extractedInfo.lore}\n\n---\n\n${insight.content}`;
                            }
                            break;
                        case 'gameplay_tips':
                            if (extractedInfo.tips) {
                                newContent = `💡 **New Tips**\n\n${extractedInfo.tips}\n\n---\n\n${insight.content}`;
                            }
                            break;
                        case 'inventory_analysis':
                            if (extractedInfo.inventory) {
                                newContent = `🎒 **Inventory Update**\n\n${extractedInfo.inventory}\n\n---\n\n${insight.content}`;
                            }
                            break;
                    }
                    
                    if (newContent) {
                        updateConversation(conversationId, convo => {
                            if (convo.insights?.[tab.id]) {
                                convo.insights[tab.id].content = newContent;
                                convo.insights[tab.id].isNew = true;
                                convo.insights[tab.id].lastUpdated = Date.now();
                            }
                            return convo;
                        });
                    }
                }
            }
        } catch (error) {
            console.warn('Error updating insights with final response:', error);
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
        saveConversationsToLocalStorage,
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

        updateInsightsForProgress,
        handleTabManagementCommand,
    };
};
