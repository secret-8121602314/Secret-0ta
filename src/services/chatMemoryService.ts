import { cacheService } from './cacheService';
import { Conversation, ChatMessage } from '../types';

/**
 * Chat Memory Service using centralized cache
 * Handles chat persistence, context, and memory management
 */
class ChatMemoryService {
  private readonly CONVERSATION_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly CONTEXT_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Save conversation with full context
   */
  async saveConversation(conversation: Conversation, userId?: string): Promise<void> {
    const key = `conversation:${conversation.id}`;
    await cacheService.set(key, conversation, this.CONVERSATION_TTL, 'conversation', userId);
  }

  /**
   * Load conversation with context
   */
  async loadConversation(conversationId: string): Promise<Conversation | null> {
    const key = `conversation:${conversationId}`;
    return await cacheService.get<Conversation>(key);
  }

  /**
   * Save chat context (recent messages, user preferences, etc.)
   */
  async saveChatContext(userId: string, context: {
    recentMessages: ChatMessage[];
    userPreferences: any;
    gameContext: any;
    conversationSummary: string;
  }): Promise<void> {
    await cacheService.setChatContext(userId, context);
  }

  /**
   * Load chat context
   */
  async loadChatContext(userId: string): Promise<any | null> {
    return await cacheService.getChatContext(userId);
  }

  /**
   * Save AI memory/insights about user
   */
  async saveUserMemory(userId: string, memory: {
    preferences: any;
    playStyle: string;
    favoriteGames: string[];
    lastInteractions: any[];
    personalityProfile: any;
  }): Promise<void> {
    await cacheService.setUserMemory(userId, memory);
  }

  /**
   * Load AI memory about user
   */
  async loadUserMemory(userId: string): Promise<any | null> {
    return await cacheService.getUserMemory(userId);
  }

  /**
   * Save conversation summary for quick context
   */
  async saveConversationSummary(conversationId: string, summary: {
    keyPoints: string[];
    userQuestions: string[];
    aiInsights: string[];
    gameContext: any;
  }): Promise<void> {
    const key = `conversation_summary:${conversationId}`;
    await cacheService.set(key, summary, this.CONTEXT_TTL);
  }

  /**
   * Load conversation summary
   */
  async loadConversationSummary(conversationId: string): Promise<any | null> {
    const key = `conversation_summary:${conversationId}`;
    return await cacheService.get(key);
  }

  /**
   * Save game-specific context
   */
  async saveGameContext(userId: string, gameId: string, context: {
    currentProgress: any;
    lastScreenshot: string;
    recentHints: string[];
    userFrustrationLevel: number;
    preferredHintStyle: string;
  }): Promise<void> {
    await cacheService.setGameContext(userId, gameId, context);
  }

  /**
   * Load game-specific context
   */
  async loadGameContext(userId: string, gameId: string): Promise<any | null> {
    return await cacheService.getGameContext(userId, gameId);
  }

  /**
   * Get all user conversations (for sidebar)
   */
  async getUserConversations(_userId: string): Promise<Conversation[]> {
    // This would need a different approach - maybe a separate table
    // For now, we'll use a pattern-based approach
    const conversations: Conversation[] = [];
    
    // In a real implementation, you'd query a conversations table
    // or use a different caching strategy for this
    return conversations;
  }

  /**
   * Clear all chat data for a user
   */
  async clearUserChatData(userId: string): Promise<void> {
    // Use the enhanced cache service to clear all user data
    await cacheService.clearUserCache(userId);
  }
}

export const chatMemoryService = new ChatMemoryService();
