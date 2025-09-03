import { GoogleGenAI, GenerateContentResponse, Part, Content, Chat, Type } from "@google/genai";
import { ChatMessage, Conversation, GeminiModel, insightTabsConfig } from "./types";
import { profileService } from "./profileService";
import { aiContextService } from "./aiContextService";
import { characterDetectionService } from "./characterDetectionService";
import { unifiedUsageService } from "./unifiedUsageService";
import { authService } from "./supabase";
import { apiCostService } from "./apiCostService";
import { feedbackLearningEngine } from "./feedbackLearningEngine";
import { supabaseDataService } from './supabaseDataService';
import { progressTrackingService } from './progressTrackingService';
import { igdbService } from './igdbService';
import { gamingWikiSearchService } from './gamingWikiSearchService';
import { aiOutputParsingService } from './aiOutputParsingService';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API Key not found. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });
const chatSessions: Record<string, { chat: Chat, model: GeminiModel }> = {};

const COOLDOWN_KEY = 'geminiCooldownEnd';
const NEWS_CACHE_KEY = 'otakonNewsCache';
const COOLDOWN_DURATION = 60 * 60 * 1000; // 1 hour

const isQuotaError = (error: any): boolean => {
    const errorMessage = error.toString();
    const httpStatus = error.httpError?.status;
    return errorMessage.includes("RESOURCE_EXHAUSTED") || httpStatus === 429;
};

/**
 * Enhanced Gemini Service with Function Calling
 * Extends the existing Gemini service with IGDB and Wiki search capabilities
 */
export class EnhancedGeminiService {
    private static instance: EnhancedGeminiService;

    private constructor() {}

    public static getInstance(): EnhancedGeminiService {
        if (!EnhancedGeminiService.instance) {
            EnhancedGeminiService.instance = new EnhancedGeminiService();
        }
        return EnhancedGeminiService.instance;
    }

    /**
     * Get enhanced tools configuration for Gemini
     */
    private getEnhancedTools() {
        return [
            { googleSearch: {} },
            {
                functionDeclarations: [
                    {
                        name: 'searchIGDB',
                        description: 'Get comprehensive game data from IGDB gaming database for game identification, metadata, and verification.',
                        parameters: {
                            type: Type.OBJECT,
                            properties: {
                                gameName: { 
                                    type: Type.STRING, 
                                    description: 'The name of the game to search for' 
                                },
                                includeStory: { 
                                    type: Type.BOOLEAN, 
                                    description: 'Whether to include story and character information' 
                                },
                                includeProgress: { 
                                    type: Type.BOOLEAN, 
                                    description: 'Whether to include progress tracking data' 
                                }
                            },
                            required: ['gameName']
                        }
                    },
                    {
                        name: 'searchGamingWikis',
                        description: 'Search gaming wikis for detailed lore, walkthroughs, and community knowledge.',
                        parameters: {
                            type: Type.OBJECT,
                            properties: {
                                query: { 
                                    type: Type.STRING, 
                                    description: 'Search query for gaming wikis' 
                                },
                                gameName: { 
                                    type: Type.STRING, 
                                    description: 'Specific game name to focus search' 
                                },
                                year: { 
                                    type: Type.INTEGER, 
                                    description: 'Game release year for targeted wiki search' 
                                },
                                category: { 
                                    type: Type.STRING, 
                                    description: 'Wiki category: franchise, platform, or genre' 
                                }
                            },
                            required: ['query']
                        }
                    }
                ]
            }
        ];
    }

    /**
     * Enhanced system instructions with gaming knowledge capabilities
     */
    private getEnhancedSystemInstructions(existingPrompt: string): string {
        return `${existingPrompt}

ENHANCED GAMING KNOWLEDGE CAPABILITIES:
You now have access to comprehensive gaming databases and sources:

1. **searchIGDB**: Use FIRST for game facts, metadata, and verification
2. **searchGamingWikis**: Use for specialized content (lore, walkthroughs, community)
3. **googleSearch**: Use for recent news and general information

GAMING SOURCE PRIORITY:
- Game identification: searchIGDB → searchGamingWikis → googleSearch
- Story/lore questions: searchGamingWikis → searchIGDB → googleSearch
- Progress tracking: searchIGDB → user context → searchGamingWikis
- Recent news: googleSearch → searchIGDB

ALWAYS PROVIDE SOURCE ATTRIBUTION:
- IGDB data: "According to IGDB gaming database..."
- Wiki sources: "Based on [Wiki Name]..."
- Google search: "Recent search results indicate..."

REQUIRED OUTPUT FORMAT FOR NEW GAMES:
[Your helpful response to user's question]

[OTAKON_GAME_DATA: {
  "game_name": "Verified game name from IGDB",
  "igdb_id": "IGDB game ID",
  "platform": "Game platform",
  "release_date": "Release date",
  "genre": "Primary genre"
}]

[OTAKON_AI_TASKS: [
  "🎯 [Story Task] Complete the current quest: [specific quest name]",
  "🗺️ [Exploration Task] Discover [specific area] and find hidden items",
  "⚔️ [Combat Task] Master the combat mechanics by defeating [enemy type]",
  "🏆 [Achievement Task] Unlock [specific achievement] by [action]",
  "💎 [Collection Task] Find and collect [specific item type] in [area]"
]]`;
    }

    /**
     * Create enhanced chat session with function calling
     */
    async createEnhancedChat(
        conversation: Conversation,
        hasImages: boolean,
        model: GeminiModel,
        history: ChatMessage[] = []
    ): Promise<Chat> {
        const conversationId = conversation.id;
        const existingSession = chatSessions[conversationId];
        
        if (existingSession && existingSession.model === model) {
            return existingSession.chat;
        }

        if (existingSession && existingSession.model !== model) {
            console.log(`Model switch for ${conversationId}. Recreating chat from ${existingSession.model} to ${model}.`);
            delete chatSessions[conversationId];
        }
        
        console.log(`Creating new enhanced chat session for ${conversationId} with model ${model} and ${history.length} history messages.`);
        
        // Convert history to Gemini format
        const geminiHistory = this.mapMessagesToGeminiContent(history);
        
        // Get existing system instruction and enhance it
        const existingSystemInstruction = await this.getExistingSystemInstruction(conversation, hasImages);
        const enhancedSystemInstruction = this.getEnhancedSystemInstructions(existingSystemInstruction);
        
        const newChat = ai.chats.create({
            model,
            history: geminiHistory,
            config: {
                systemInstruction: enhancedSystemInstruction,
                tools: this.getEnhancedTools()
            }
        });
        
        chatSessions[conversationId] = { chat: newChat, model };
        return newChat;
    }

    /**
     * Map messages to Gemini content format
     */
    private mapMessagesToGeminiContent(history: ChatMessage[]): Content[] {
        return history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));
    }

    /**
     * Get existing system instruction (placeholder - would integrate with existing service)
     */
    private async getExistingSystemInstruction(conversation: Conversation, hasImages: boolean): Promise<string> {
        // This would integrate with your existing getSystemInstruction function
        // For now, returning a basic instruction
        return `You are Otakon, a world-class, spoiler-free gaming assistant AI. Your entire existence is dedicated to helping users with video games.`;
    }

    /**
     * Handle function calls from Gemini
     */
    async handleFunctionCall(functionCall: any): Promise<any> {
        try {
            const { name, args } = functionCall;
            
            switch (name) {
                case 'searchIGDB':
                    return await this.handleIGDBSearch(args);
                case 'searchGamingWikis':
                    return await this.handleWikiSearch(args);
                default:
                    console.warn(`Unknown function call: ${name}`);
                    return null;
            }
        } catch (error) {
            console.error('Function call handling failed:', error);
            return null;
        }
    }

    /**
     * Handle IGDB search function calls
     */
    private async handleIGDBSearch(args: any): Promise<any> {
        try {
            const { gameName, includeStory = false, includeProgress = false } = args;
            
            console.log(`🔍 IGDB Function Call: "${gameName}", story: ${includeStory}, progress: ${includeProgress}`);
            
            const result = await igdbService.searchGames(gameName, includeStory);
            
            if (result.success && result.data && result.data.length > 0) {
                const game = result.data[0]; // Get first result
                return {
                    success: true,
                    game: {
                        name: game.name,
                        summary: game.summary,
                        storyline: game.storyline,
                        release_date: game.release_dates?.[0]?.human,
                        platform: game.platforms?.[0]?.name,
                        genre: game.genres?.[0]?.name,
                        developer: game.developer?.name,
                        publisher: game.publisher?.name,
                        rating: game.rating,
                        igdb_id: game.id
                    }
                };
            } else {
                return {
                    success: false,
                    error: result.error || 'No games found'
                };
            }
        } catch (error) {
            console.error('IGDB search function call failed:', error);
            return {
                success: false,
                error: 'IGDB search failed'
            };
        }
    }

    /**
     * Handle wiki search function calls
     */
    private async handleWikiSearch(args: any): Promise<any> {
        try {
            const { query, gameName, year, category } = args;
            
            console.log(`🔍 Wiki Function Call: "${query}", game: ${gameName}, year: ${year}, category: ${category}`);
            
            const gameContext = {
                year: year ? parseInt(year) : undefined,
                platform: undefined,
                genre: undefined,
                franchise: undefined
            };
            
            const result = await gamingWikiSearchService.searchGamingWikis(query, gameContext, 5);
            
            if (result.success && result.results) {
                return {
                    success: true,
                    results: result.results.map(r => ({
                        title: r.title,
                        snippet: r.snippet,
                        source: r.source,
                        link: r.link,
                        relevance: r.relevance
                    }))
                };
            } else {
                return {
                    success: false,
                    error: result.error || 'No wiki results found'
                };
            }
        } catch (error) {
            console.error('Wiki search function call failed:', error);
            return {
                success: false,
                error: 'Wiki search failed'
            };
        }
    }

    /**
     * Send enhanced message with function calling support
     */
    async sendEnhancedMessage(
        message: string,
        conversation: Conversation,
        signal: AbortSignal,
        onChunk: (chunk: string) => void,
        onError: (error: string) => void,
        history: ChatMessage[]
    ): Promise<void> {
        try {
            const model = this.getOptimalModel('chat');
            const chat = await this.createEnhancedChat(conversation, false, model, history);

            const streamPromise = chat.sendMessageStream({ message });
            const abortPromise = new Promise<never>((_, reject) => {
                if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
                signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
            });

            const stream = await Promise.race([streamPromise, abortPromise]);
            if (signal.aborted) return;
            
            let fullResponse = '';
            await Promise.race([
                (async () => {
                    for await (const chunk of stream) {
                        if (signal.aborted) break;
                        if (chunk.text) {
                            fullResponse += chunk.text;
                            onChunk(chunk.text);
                        }
                    }
                })(),
                abortPromise
            ]);

            // Parse AI output for structured data
            if (fullResponse) {
                const parsedOutput = aiOutputParsingService.parseAIOutput(fullResponse);
                
                // Handle parsed data (game data, AI tasks, etc.)
                await this.handleParsedOutput(parsedOutput, conversation);
            }
            
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                console.log("Enhanced message was aborted.");
                onError("Request cancelled.");
            } else {
                console.error('Enhanced message failed:', error);
                onError(error instanceof Error ? error.message : 'Unknown error');
            }
        }
    }

    /**
     * Handle parsed AI output
     */
    private async handleParsedOutput(parsedOutput: any, conversation: Conversation): Promise<void> {
        try {
            // Handle game data
            if (parsedOutput.gameData) {
                console.log('🎮 Game data parsed:', parsedOutput.gameData);
                // TODO: Store game data in conversation context
            }

            // Handle AI tasks
            if (parsedOutput.aiTasks) {
                console.log('📝 AI tasks parsed:', parsedOutput.aiTasks);
                // TODO: Add tasks to Otaku Diary
            }

            // Handle insight updates
            if (parsedOutput.insightUpdate) {
                console.log('🔄 Insight update parsed:', parsedOutput.insightUpdate);
                // TODO: Update insight tabs
            }

            // Log any parsing errors
            if (parsedOutput.parsingErrors && parsedOutput.parsingErrors.length > 0) {
                console.warn('⚠️ AI output parsing errors:', parsedOutput.parsingErrors);
            }

        } catch (error) {
            console.error('Failed to handle parsed output:', error);
        }
    }

    /**
     * Get optimal model for different use cases
     */
    private getOptimalModel(useCase: string): GeminiModel {
        switch (useCase) {
            case 'chat':
            case 'chat_with_images':
                return 'gemini-2.5-pro';
            case 'insight_generation':
                return 'gemini-2.5-pro';
            default:
                return 'gemini-2.5-flash';
        }
    }

    /**
     * Health check for enhanced service
     */
    async healthCheck(): Promise<{ healthy: boolean; message: string }> {
        try {
            const igdbHealth = await igdbService.healthCheck();
            const wikiHealth = await gamingWikiSearchService.healthCheck();
            const parsingHealth = aiOutputParsingService.healthCheck();

            if (igdbHealth.healthy && wikiHealth.healthy && parsingHealth.healthy) {
                return {
                    healthy: true,
                    message: 'Enhanced Gemini Service is healthy and ready'
                };
            } else {
                return {
                    healthy: false,
                    message: `Service health issues: IGDB(${igdbHealth.healthy}), Wiki(${wikiHealth.healthy}), Parsing(${parsingHealth.healthy})`
                };
            }
        } catch (error) {
            return {
                healthy: false,
                message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
}

// Export singleton instance
export const enhancedGeminiService = EnhancedGeminiService.getInstance();
