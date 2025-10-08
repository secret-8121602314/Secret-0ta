import { StorageService } from './storageService';
import { cacheService } from './cacheService';
import { chatMemoryService } from './chatMemoryService';
import { Conversations, Conversation, ChatMessage, UserTier } from '../types';
import { STORAGE_KEYS, DEFAULT_CONVERSATION_TITLE, USER_TIERS } from '../constants';

// ✅ SCALABILITY: Tier-based limits for conversations and messages
const TIER_CONVERSATION_LIMITS = {
  [USER_TIERS.FREE]: 10,      // Free users: 10 conversations max
  [USER_TIERS.PRO]: 100,      // Pro users: 100 conversations max  
  [USER_TIERS.VANGUARD_PRO]: 100, // Vanguard Pro: 100 conversations max (same as Pro)
} as const;

const TIER_MESSAGE_LIMITS = {
  [USER_TIERS.FREE]: 20,      // Free users: 20 messages per conversation
  [USER_TIERS.PRO]: 200,      // Pro users: 200 messages per conversation
  [USER_TIERS.VANGUARD_PRO]: 200, // Vanguard Pro: 200 messages per conversation (same as Pro)
} as const;

const TIER_TOTAL_MESSAGE_LIMITS = {
  [USER_TIERS.FREE]: 200,     // Free users: 200 total messages
  [USER_TIERS.PRO]: 2000,     // Pro users: 2000 total messages
  [USER_TIERS.VANGUARD_PRO]: 2000, // Vanguard Pro: 2000 total messages (same as Pro)
} as const;

export class ConversationService {
  // ✅ SCALABILITY: Get user tier from auth service
  private static async getUserTier(): Promise<UserTier> {
    try {
      // Try to get from auth service first
      const { authService } = await import('./authService');
      const user = authService.getCurrentUser();
      if (user?.tier) {
        return user.tier;
      }
    } catch (error) {
      console.warn('Could not get user tier from auth service:', error);
    }
    
    // Fallback to localStorage
    const user = StorageService.get(STORAGE_KEYS.USER, null) as any;
    return user?.tier || USER_TIERS.FREE;
  }

  // ✅ SCALABILITY: Get tier-based limits
  private static async getConversationLimit(): Promise<number> {
    const tier = await this.getUserTier();
    return TIER_CONVERSATION_LIMITS[tier] || TIER_CONVERSATION_LIMITS[USER_TIERS.FREE];
  }

  private static async getMessageLimit(): Promise<number> {
    const tier = await this.getUserTier();
    return TIER_MESSAGE_LIMITS[tier] || TIER_MESSAGE_LIMITS[USER_TIERS.FREE];
  }

  private static async getTotalMessageLimit(): Promise<number> {
    const tier = await this.getUserTier();
    return TIER_TOTAL_MESSAGE_LIMITS[tier] || TIER_TOTAL_MESSAGE_LIMITS[USER_TIERS.FREE];
  }

  // ✅ SCALABILITY: Check if user can create new conversation
  static async canCreateConversation(): Promise<{ allowed: boolean; reason?: string }> {
    const conversations = await this.getConversations();
    const conversationLimit = await this.getConversationLimit();
    const tier = await this.getUserTier();
    
    if (Object.keys(conversations).length >= conversationLimit) {
      return {
        allowed: false,
        reason: `You've reached the maximum of ${conversationLimit} conversations for ${tier} tier. Upgrade to create more conversations.`
      };
    }
    
    return { allowed: true };
  }

  // ✅ SCALABILITY: Check if user can add message to conversation
  static async canAddMessage(conversationId: string): Promise<{ allowed: boolean; reason?: string }> {
    const conversations = await this.getConversations();
    const conversation = conversations[conversationId];
    
    if (!conversation) {
      return { allowed: false, reason: 'Conversation not found' };
    }
    
    const messageLimit = await this.getMessageLimit();
    const totalMessageLimit = await this.getTotalMessageLimit();
    const tier = await this.getUserTier();
    
    // Check per-conversation limit
    if (conversation.messages.length >= messageLimit) {
      return {
        allowed: false,
        reason: `This conversation has reached the maximum of ${messageLimit} messages for ${tier} tier. Start a new conversation.`
      };
    }
    
    // Check total message limit across all conversations
    const totalMessages = Object.values(conversations)
      .reduce((total, conv) => total + conv.messages.length, 0);
    
    if (totalMessages >= totalMessageLimit) {
      return {
        allowed: false,
        reason: `You've reached the maximum of ${totalMessageLimit} total messages for ${tier} tier. Upgrade to send more messages.`
      };
    }
    
    return { allowed: true };
  }

  static async getConversations(): Promise<Conversations> {
    // ✅ SCALABILITY: Try cache first, fallback to localStorage
    let conversations: Conversations = {};
    
    try {
      // Try to get from cache service first
      const cachedConversations = await cacheService.get<Conversations>(STORAGE_KEYS.CONVERSATIONS);
      console.log('🔍 [ConversationService] Cached conversations:', cachedConversations);
      if (cachedConversations) {
        conversations = cachedConversations;
      } else {
        // Fallback to localStorage
        conversations = StorageService.get(STORAGE_KEYS.CONVERSATIONS, {}) as Conversations;
        console.log('🔍 [ConversationService] localStorage conversations:', conversations);
        // Cache the localStorage data for future use
        await cacheService.set(STORAGE_KEYS.CONVERSATIONS, conversations, 30 * 24 * 60 * 60 * 1000); // 30 days
      }
    } catch (error) {
      console.warn('Failed to load conversations from cache, using localStorage:', error);
      conversations = StorageService.get(STORAGE_KEYS.CONVERSATIONS, {}) as Conversations;
      console.log('🔍 [ConversationService] Error fallback conversations:', conversations);
    }
    
    // Migration: Update existing "General Chat" titles to "Everything else" (one-time migration)
    let needsUpdate = false;
    Object.values(conversations).forEach((conv: Conversation) => {
      if (conv.title === 'General Chat') {
        conv.title = 'Everything else';
        needsUpdate = true;
      }
    });
    
    if (needsUpdate) {
      await this.setConversations(conversations);
    }
    
    // ✅ SCALABILITY: Enforce tier-based conversation limits
    const conversationArray = Object.values(conversations);
    const conversationLimit = await this.getConversationLimit();
    
    if (conversationArray.length > conversationLimit) {
      // Keep only the most recent conversations
      const sortedConversations = conversationArray
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, conversationLimit);
      
      const limitedConversations: Conversations = {};
      sortedConversations.forEach(conv => {
        limitedConversations[conv.id] = conv;
      });
      
      await this.setConversations(limitedConversations);
      return limitedConversations;
    }
    
    return conversations;
  }

  static async setConversations(conversations: Conversations): Promise<void> {
    // ✅ SCALABILITY: Store in both cache and localStorage for reliability
    try {
      // Store in cache service (primary storage)
      await cacheService.set(STORAGE_KEYS.CONVERSATIONS, conversations, 30 * 24 * 60 * 60 * 1000); // 30 days
      
      // Also store in localStorage as backup
      StorageService.set(STORAGE_KEYS.CONVERSATIONS, conversations);
      
      // Store individual conversations for better performance
      await Promise.all(
        Object.values(conversations).map(conv => 
          chatMemoryService.saveConversation(conv)
        )
      );
    } catch (error) {
      console.warn('Failed to store conversations in cache, using localStorage only:', error);
      StorageService.set(STORAGE_KEYS.CONVERSATIONS, conversations);
    }
  }

  static createConversation(title?: string): Conversation {
    const now = Date.now();
    const id = `conv_${now}`;
    
    return {
      id,
      title: title || DEFAULT_CONVERSATION_TITLE,
      messages: [],
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };
  }

  static async addConversation(conversation: Conversation): Promise<{ success: boolean; reason?: string }> {
    // ✅ SCALABILITY: Check if user can create conversation
    const canCreate = await this.canCreateConversation();
    if (!canCreate.allowed) {
      return { success: false, reason: canCreate.reason };
    }
    
    const conversations = await this.getConversations();
    const conversationLimit = await this.getConversationLimit();
    
    // ✅ FIX: Prevent duplicate "Everything else" conversations
    if (conversation.title === DEFAULT_CONVERSATION_TITLE) {
      const existingEverythingElse = Object.values(conversations).find(
        conv => conv.title === DEFAULT_CONVERSATION_TITLE
      );
      if (existingEverythingElse) {
        return { 
          success: false, 
          reason: 'An "Everything else" conversation already exists. Please use the existing one or create a conversation with a different title.' 
        };
      }
    }
    
    // If at limit, remove oldest conversation
    if (Object.keys(conversations).length >= conversationLimit) {
      const oldestConversation = Object.values(conversations)
        .sort((a, b) => a.updatedAt - b.updatedAt)[0];
      delete conversations[oldestConversation.id];
    }
    
    conversations[conversation.id] = conversation;
    await this.setConversations(conversations);
    
    // ✅ SCALABILITY: Save individual conversation to cache for better performance
    await chatMemoryService.saveConversation(conversation);
    
    return { success: true };
  }

  static async updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    const conversations = await this.getConversations();
    if (conversations[id]) {
      conversations[id] = {
        ...conversations[id],
        ...updates,
        updatedAt: Date.now(),
      };
      await this.setConversations(conversations);
      
      // ✅ SCALABILITY: Update individual conversation in cache
      await chatMemoryService.saveConversation(conversations[id]);
    }
  }

  static async deleteConversation(id: string): Promise<void> {
    const conversations = await this.getConversations();
    delete conversations[id];
    await this.setConversations(conversations);
    
    // ✅ SCALABILITY: Remove from cache
    await cacheService.delete(`conversation:${id}`);
  }

  static async addMessage(conversationId: string, message: ChatMessage): Promise<{ success: boolean; reason?: string }> {
    // ✅ SCALABILITY: Check if user can add message
    const canAdd = await this.canAddMessage(conversationId);
    if (!canAdd.allowed) {
      return { success: false, reason: canAdd.reason };
    }
    
    const conversations = await this.getConversations();
    if (conversations[conversationId]) {
      const conversation = conversations[conversationId];
      const messageLimit = await this.getMessageLimit();
      
      // If at per-conversation limit, remove oldest message
      if (conversation.messages.length >= messageLimit) {
        conversation.messages.shift();
      }
      
      conversation.messages.push(message);
      conversation.updatedAt = Date.now();
      
      // ✅ SCALABILITY: Check global message limit
      const totalMessageLimit = await this.getTotalMessageLimit();
      const totalMessages = Object.values(conversations)
        .reduce((total, conv) => total + conv.messages.length, 0);
      
      if (totalMessages > totalMessageLimit) {
        await this.cleanupOldMessages(conversations);
      }
      
      await this.setConversations(conversations);
      
      // ✅ SCALABILITY: Save individual conversation to cache
      await chatMemoryService.saveConversation(conversation);
      
      // ✅ SCALABILITY: Save chat context for AI memory
      try {
        // Try to get actual user ID from auth service
        const { authService } = await import('./authService');
        const user = authService.getCurrentUser();
        if (user?.authUserId) {
          // Use the auth user ID for cache operations (app_cache table references auth.users)
          await chatMemoryService.saveChatContext(user.authUserId, {
            recentMessages: conversation.messages.slice(-10), // Last 10 messages
            userPreferences: {}, // This would come from user service
            gameContext: {}, // This would come from game context
            conversationSummary: conversation.title
          });
        }
      } catch (error) {
        console.warn('Failed to save chat context:', error);
      }
      
      return { success: true };
    }
    
    return { success: false, reason: 'Conversation not found' };
  }

  // ✅ SCALABILITY: Cleanup old messages to prevent memory bloat
  private static async cleanupOldMessages(conversations: Conversations): Promise<void> {
    const totalMessageLimit = await this.getTotalMessageLimit();
    const targetMessages = Math.floor(totalMessageLimit * 0.8); // Keep 80% of limit
    
    // Get all messages with conversation info
    const allMessages: Array<{ message: ChatMessage; conversationId: string; conversation: Conversation }> = [];
    
    Object.values(conversations).forEach(conv => {
      conv.messages.forEach(msg => {
        allMessages.push({ message: msg, conversationId: conv.id, conversation: conv });
      });
    });
    
    // Sort by timestamp (oldest first)
    allMessages.sort((a, b) => a.message.timestamp - b.message.timestamp);
    
    // Remove oldest messages until we're under the target
    let messagesToRemove = allMessages.length - targetMessages;
    for (let i = 0; i < messagesToRemove && i < allMessages.length; i++) {
      const { conversationId, message } = allMessages[i];
      const conversation = conversations[conversationId];
      if (conversation) {
        const messageIndex = conversation.messages.findIndex(m => m.id === message.id);
        if (messageIndex !== -1) {
          conversation.messages.splice(messageIndex, 1);
        }
      }
    }
  }

  static async getActiveConversation(): Promise<Conversation | null> {
    const conversations = await this.getConversations();
    const activeConversation = Object.values(conversations).find(conv => conv.isActive);
    return activeConversation || null;
  }

  // ✅ SCALABILITY: Get user's current usage statistics
  static async getUsageStats(): Promise<{
    conversations: { current: number; limit: number; tier: UserTier };
    messages: { current: number; limit: number; tier: UserTier };
    totalMessages: { current: number; limit: number; tier: UserTier };
  }> {
    const conversations = await this.getConversations();
    const tier = await this.getUserTier();
    
    const conversationCount = Object.keys(conversations).length;
    const conversationLimit = await this.getConversationLimit();
    
    const totalMessages = Object.values(conversations)
      .reduce((total, conv) => total + conv.messages.length, 0);
    const totalMessageLimit = await this.getTotalMessageLimit();
    
    // Get max messages per conversation for display
    const messageLimit = await this.getMessageLimit();
    
    return {
      conversations: {
        current: conversationCount,
        limit: conversationLimit,
        tier
      },
      messages: {
        current: 0, // This would be per-conversation, calculated when needed
        limit: messageLimit,
        tier
      },
      totalMessages: {
        current: totalMessages,
        limit: totalMessageLimit,
        tier
      }
    };
  }

  // ✅ SCALABILITY: Get conversation-specific message count
  static async getConversationMessageCount(conversationId: string): Promise<{ current: number; limit: number; tier: UserTier }> {
    const conversations = await this.getConversations();
    const conversation = conversations[conversationId];
    const tier = await this.getUserTier();
    const messageLimit = await this.getMessageLimit();
    
    return {
      current: conversation?.messages.length || 0,
      limit: messageLimit,
      tier
    };
  }

  static async setActiveConversation(id: string): Promise<void> {
    const conversations = await this.getConversations();
    
    // Set all conversations to inactive
    Object.values(conversations).forEach(conv => {
      conv.isActive = false;
    });
    
    // Set the selected conversation as active
    if (conversations[id]) {
      conversations[id].isActive = true;
    }
    
    await this.setConversations(conversations);
  }

  static async clearAllConversations(): Promise<void> {
    await this.setConversations({});
    
    // ✅ SCALABILITY: Clear all conversation cache entries
    try {
      await cacheService.clear();
    } catch (error) {
      console.warn('Failed to clear conversation cache:', error);
    }
  }

  static async clearConversation(conversationId: string): Promise<void> {
    const conversations = await this.getConversations();
    if (conversations[conversationId]) {
      // Clear messages but keep the conversation
      conversations[conversationId] = {
        ...conversations[conversationId],
        messages: [],
        updatedAt: Date.now(),
      };
      
      await this.setConversations(conversations);
      await chatMemoryService.saveConversation(conversations[conversationId]);
    }
  }

  /**
   * Update sub-tab content for a conversation
   */
  static async updateSubTabContent(conversationId: string, subTabId: string, content: string): Promise<void> {
    const conversations = await this.getConversations();
    const conversation = conversations[conversationId];
    
    if (!conversation || !conversation.subtabs) {
      throw new Error('Conversation or sub-tabs not found');
    }

    const updatedSubTabs = conversation.subtabs.map(tab => 
      tab.id === subTabId 
        ? { ...tab, content, isNew: false, status: 'loaded' as const }
        : tab
    );

    await this.updateConversation(conversationId, {
      subtabs: updatedSubTabs,
      updatedAt: Date.now()
    });
  }

  /**
   * Get a specific conversation by ID
   */
  static async getConversation(conversationId: string): Promise<Conversation | null> {
    const conversations = await this.getConversations();
    return conversations[conversationId] || null;
  }

  /**
   * Update session state for a conversation
   */
  static async setSessionState(conversationId: string, isActive: boolean): Promise<void> {
    await this.updateConversation(conversationId, {
      isActiveSession: isActive,
      updatedAt: Date.now()
    });
  }

  /**
   * Update game progress and active objective
   */
  static async updateGameProgress(conversationId: string, progress: number, objective: string): Promise<void> {
    await this.updateConversation(conversationId, {
      gameProgress: progress,
      activeObjective: objective,
      updatedAt: Date.now()
    });
  }
}
