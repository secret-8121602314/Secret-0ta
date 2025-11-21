import { StorageService } from './storageService';
import { cacheService } from './cacheService';
import { chatMemoryService } from './chatMemoryService';
import { SupabaseService } from './supabaseService';
import { toastService } from './toastService';
import { Conversations, Conversation, ChatMessage, UserTier } from '../types';
import { STORAGE_KEYS, DEFAULT_CONVERSATION_TITLE, GAME_HUB_ID, USER_TIERS } from '../constants';

// Lazy-load Supabase service instance to avoid circular dependency
let supabaseService: SupabaseService;
const getSupabaseService = () => {
  if (!supabaseService) {
    supabaseService = SupabaseService.getInstance();
  }
  return supabaseService;
};

// ✅ QUERY-BASED LIMITS: Conversations are unlimited for all tiers.
// Limits are based on queries (text vs image) per month, tracked in database:
// - Free: 55 text + 25 image queries/month
// - Pro: 1,583 text + 328 image queries/month
// - Vanguard Pro: 1,583 text + 328 image queries/month
// See: users table (text_count, image_count, text_limit, image_limit, last_reset)

export class ConversationService {
  // ✅ PERFORMANCE: Deduplicate conversation creation attempts
  private static pendingCreations = new Map<string, Promise<{ success: boolean; reason?: string }>>();
  
  // ✅ Get current user ID for Supabase operations
  private static async getCurrentUserId(): Promise<string | null> {
    try {
      const { authService } = await import('./authService');
      const user = authService.getCurrentUser();
      return user?.authUserId || null;
    } catch (error) {
            return null;
    }
  }

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
          }
    
    // Fallback to localStorage
    const user = StorageService.get(STORAGE_KEYS.USER, null) as import('../types').User | null;
    return user?.tier || USER_TIERS.FREE;
  }

  // ✅ QUERY-BASED LIMITS: Check if user can send a text query
  static async canSendTextQuery(): Promise<{ allowed: boolean; reason?: string; used?: number; limit?: number }> {
    try {
      const { authService } = await import('./authService');
      const user = authService.getCurrentUser();
      
      if (!user) {
        return { allowed: false, reason: 'User not authenticated' };
      }

      const textCount = user.textCount || 0;
      const textLimit = user.textLimit || 55; // Default to free tier
      
      if (textCount >= textLimit) {
        const tier = user.tier || 'free';
        return {
          allowed: false,
          reason: `You've used all ${textLimit} text queries this month. ${tier === 'free' ? 'Upgrade to Pro for 1,583 queries!' : 'Your queries will reset next month.'}`,
          used: textCount,
          limit: textLimit
        };
      }
      
      return { allowed: true, used: textCount, limit: textLimit };
    } catch (error) {
      console.error('Error checking text query limit:', error);
      toastService.error('Failed to check query limit. Please try again.');
      return { allowed: false, reason: 'Failed to check query limit' };
    }
  }

  // ✅ QUERY-BASED LIMITS: Check if user can send an image query
  static async canSendImageQuery(): Promise<{ allowed: boolean; reason?: string; used?: number; limit?: number }> {
    try {
      const { authService } = await import('./authService');
      const user = authService.getCurrentUser();
      
      if (!user) {
        return { allowed: false, reason: 'User not authenticated' };
      }

      const imageCount = user.imageCount || 0;
      const imageLimit = user.imageLimit || 25; // Default to free tier
      
      if (imageCount >= imageLimit) {
        const tier = user.tier || 'free';
        return {
          allowed: false,
          reason: `You've used all ${imageLimit} image queries this month. ${tier === 'free' ? 'Upgrade to Pro for 328 image queries!' : 'Your queries will reset next month.'}`,
          used: imageCount,
          limit: imageLimit
        };
      }
      
      return { allowed: true, used: imageCount, limit: imageLimit };
    } catch (error) {
      console.error('Error checking image query limit:', error);
      toastService.error('Failed to check query limit. Please try again.');
      return { allowed: false, reason: 'Failed to check query limit' };
    }
  }

  // ✅ In-memory cache to reduce Supabase reads during polling
  private static conversationsCache: { data: Conversations; timestamp: number } | null = null;
  private static CACHE_TTL = 5000; // 5 second cache (balance between real-time and performance)

  /**
   * Clear the conversations cache to force fresh database read
   */
  static clearCache(): void {
    console.error('🗑️ [ConversationService] Cache cleared, next read will be fresh');
    this.conversationsCache = null;
  }

  /**
   * Get cached conversations without querying Supabase
   * Returns null if cache is empty or expired
   */
  static getCachedConversations(): Conversations | null {
    if (this.conversationsCache && Date.now() - this.conversationsCache.timestamp < this.CACHE_TTL) {
      console.log('🔍 [ConversationService] Returning cached conversations (age:', Date.now() - this.conversationsCache.timestamp, 'ms)');
      
      // 🔍 DEBUG: Check messages when returning from cache
      const gameHub = this.conversationsCache.data['game-hub'];
      if (gameHub) {
        console.error('🔍 [ConversationService] Game Hub from cache:', {
          id: gameHub.id,
          messageCount: gameHub.messages?.length || 0,
          messagesPreview: gameHub.messages?.slice(0, 2).map((m: import('../types').ChatMessage) => ({
            id: m.id,
            role: m.role,
            contentLength: m.content?.length || 0
          }))
        });
      }
      
      return this.conversationsCache.data;
    }
        return null;
  }

  static async getConversations(skipCache = false): Promise<Conversations> {
    const userId = await this.getCurrentUserId();
    let conversations: Conversations = {};
    
    // ✅ PERFORMANCE: Check in-memory cache first (unless explicitly skipped)
    if (!skipCache && this.conversationsCache && Date.now() - this.conversationsCache.timestamp < this.CACHE_TTL) {
      console.log('🔍 [ConversationService] Using cached conversations (age:', Date.now() - this.conversationsCache.timestamp, 'ms)');
      return this.conversationsCache.data;
    }
    
    // ✅ PRIMARY: Load from Supabase
    if (userId) {
      try {
                const supabaseConvs = await getSupabaseService().getConversations(userId);
        
        // Convert array to object format
        conversations = supabaseConvs.reduce((acc, conv) => {
          acc[conv.id] = conv;
          return acc;
        }, {} as Conversations);
        
        console.log('🔍 [ConversationService] Loaded', Object.keys(conversations).length, 'conversations from Supabase');
        
        // 🔍 DEBUG: Check messages before caching
        const gameHubBeforeCache = conversations['game-hub'];
        if (gameHubBeforeCache) {
          console.error('🔍 [ConversationService] Game Hub BEFORE cache:', {
            id: gameHubBeforeCache.id,
            messageCount: gameHubBeforeCache.messages?.length || 0,
            hasMessages: !!gameHubBeforeCache.messages,
            messagesType: typeof gameHubBeforeCache.messages
          });
        }
        
        // ✅ Update cache
        this.conversationsCache = {
          data: conversations,
          timestamp: Date.now()
        };
        
        // 🔍 DEBUG: Check messages after caching
        const gameHubAfterCache = this.conversationsCache.data['game-hub'];
        if (gameHubAfterCache) {
          console.error('🔍 [ConversationService] Game Hub AFTER cache:', {
            id: gameHubAfterCache.id,
            messageCount: gameHubAfterCache.messages?.length || 0,
            hasMessages: !!gameHubAfterCache.messages
          });
        }
        
        // Also update localStorage as backup
        if (Object.keys(conversations).length > 0) {
          StorageService.set(STORAGE_KEYS.CONVERSATIONS, conversations);
        }
        
      } catch (error) {
        console.error('🔍 [ConversationService] Failed to load from Supabase, falling back to localStorage:', error);
        toastService.warning('Using offline conversations. Some data may not be synced.');
        conversations = StorageService.get(STORAGE_KEYS.CONVERSATIONS, {}) as Conversations;
      }
    } else {
      // No user logged in, use localStorage
            conversations = StorageService.get(STORAGE_KEYS.CONVERSATIONS, {}) as Conversations;
    }
    
    // Migration: Update existing "General Chat" or "Everything else" titles to "Game Hub"
    let needsUpdate = false;
    Object.values(conversations).forEach((conv: Conversation) => {
      if (conv.title === 'General Chat' || conv.title === 'Everything else') {
                conv.title = DEFAULT_CONVERSATION_TITLE; // "Game Hub"
        conv.id = GAME_HUB_ID; // Ensure ID is correct
        conv.isGameHub = true; // Mark as Game Hub
        needsUpdate = true;
      }
      // Also ensure any conversation with game-hub ID has the flag set
      if (conv.id === GAME_HUB_ID && !conv.isGameHub) {
                conv.isGameHub = true;
        needsUpdate = true;
      }
    });
    
    if (needsUpdate) {
      await this.setConversations(conversations);
    }
    
    // ✅ QUERY-BASED LIMITS: Conversations are now unlimited for all tiers
    // Limits are based on queries (text/image) per month, not conversation counts
    
    return conversations;
  }

  static async setConversations(conversations: Conversations, retryCount = 0): Promise<void> {
    const userId = await this.getCurrentUserId();
    console.log('🔍 [ConversationService] Saving', Object.keys(conversations).length, 'conversations');
    
    // ✅ Invalidate cache when writing
    this.conversationsCache = null;
    
    // Always save to localStorage as backup
    StorageService.set(STORAGE_KEYS.CONVERSATIONS, conversations);
        // ✅ PRIMARY: Save to Supabase if user is logged in (with retry logic)
    if (userId) {
      try {
                // ✅ FIX: Fetch existing conversations ONCE before the loop to prevent race conditions
        const existingConvs = await getSupabaseService().getConversations(userId);
        const existingIds = new Set(existingConvs.map(c => c.id));
                // Save each conversation to Supabase
        const savePromises = Object.values(conversations).map(async (conv) => {
          try {
            // Check if conversation exists in Supabase (using pre-fetched list)
            const exists = existingIds.has(conv.id);
            
            if (exists) {
              // Update existing
              await getSupabaseService().updateConversation(conv.id, conv);
            } else {
              // Create new - UPSERT will handle duplicates gracefully
              const newId = await getSupabaseService().createConversation(userId, conv);
              if (!newId) {
                console.warn(`Failed to create conversation ${conv.id} in Supabase (returned null)`);
              }
            }
          } catch (error) {
                        // Don't re-throw - allow other conversations to sync
          }
        });
        
        await Promise.all(savePromises);
              } catch (error) {
        console.error('🔍 [ConversationService] Failed to sync to Supabase:', error);
        
        // ✅ Retry with exponential backoff (3 attempts)
        if (retryCount < 3) {
          const delay = 1000 * Math.pow(2, retryCount); // 1s, 2s, 4s
          console.warn(`🔄 [ConversationService] Retrying in ${delay}ms (attempt ${retryCount + 1}/3)...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.setConversations(conversations, retryCount + 1);
        } else {
          // ✅ Final failure - notify user
          console.error('❌ [ConversationService] Supabase sync failed after 3 attempts');
          // Import toastService dynamically to avoid circular dependency
          import('./toastService').then(({ toastService }) => {
            toastService.warning('Changes saved locally. Will sync when online.');
          }).catch(err => console.error('Failed to show toast:', err));
        }
      }
    }
  }

  static createConversation(title?: string, id?: string): Conversation {
    // Validate title
    if (title && title.trim().length > 100) {
            title = title.trim().substring(0, 100);
    }
    
    const now = Date.now();
    const isGameHub = title === DEFAULT_CONVERSATION_TITLE;
    // Use 'game-hub' as ID for the default Game Hub conversation
    const conversationId = id || (isGameHub ? GAME_HUB_ID : `conv_${now}`);
    
        return {
      id: conversationId,
      title: title || DEFAULT_CONVERSATION_TITLE,
      messages: [],
      subtabs: [],
      subtabsOrder: [],
      createdAt: now,
      updatedAt: now,
      isActive: true,
      isActiveSession: false,
      isPinned: false,
      isGameHub: isGameHub, // Set flag for Game Hub
    };
  }

  static async addConversation(conversation: Conversation): Promise<{ success: boolean; reason?: string }> {
    // ✅ PERFORMANCE: Check if there's already a pending creation for this conversation
    if (this.pendingCreations.has(conversation.id)) {
            return await this.pendingCreations.get(conversation.id)!;
    }

    // Create a new promise and store it
    const creationPromise = this._addConversationInternal(conversation);
    this.pendingCreations.set(conversation.id, creationPromise);

    try {
      const result = await creationPromise;
      return result;
    } finally {
      // Clean up the pending request
      this.pendingCreations.delete(conversation.id);
    }
  }

  private static async _addConversationInternal(conversation: Conversation): Promise<{ success: boolean; reason?: string }> {
    const userId = await this.getCurrentUserId();
    
    // ✅ QUERY-BASED LIMITS: Conversations are unlimited, no need to check count
    // Query limits (text/image) are checked in aiService before sending messages
    
    const conversations = await this.getConversations();
    
    // ✅ FIX: Prevent duplicate Game Hub conversations
    if (conversation.isGameHub || conversation.title === DEFAULT_CONVERSATION_TITLE) {
      const existingGameHub = Object.values(conversations).find(
        conv => conv.isGameHub || conv.title === DEFAULT_CONVERSATION_TITLE || conv.id === GAME_HUB_ID
      );
      if (existingGameHub) {
        return { 
          success: false, 
          reason: 'A "Game Hub" conversation already exists. Please use the existing one or create a conversation with a different title.' 
        };
      }
    }
    
    // ✅ Set authUserId on the conversation object
    if (userId) {
      conversation.authUserId = userId;
    }
    
    // ✅ Conversations are unlimited - add the new conversation
    conversations[conversation.id] = conversation;
        // ✅ PRIMARY: Save to Supabase first if user logged in
    if (userId) {
      try {
        // Pass the conversation with its ID to ensure Game Hub uses 'game-hub' consistently
        const newId = await getSupabaseService().createConversation(userId, conversation);
        if (newId) {
          // Update conversation with Supabase-returned ID if different
          if (newId !== conversation.id) {
                        delete conversations[conversation.id];
            conversation.id = newId;
            conversations[newId] = conversation;
          } else {
                      }
        }
      } catch (error) {
        console.error('🔍 [ConversationService] Failed to create in Supabase:', error);
      }
    }
    
    // Save to localStorage as backup
    await this.setConversations(conversations);
    
        return { success: true };
  }

  static async updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    const userId = await this.getCurrentUserId();
    const conversations = await this.getConversations();
    
    if (conversations[id]) {
      conversations[id] = {
        ...conversations[id],
        ...updates,
        updatedAt: Date.now(),
      };
      
      // ✅ PRIMARY: Update in Supabase first
      if (userId) {
        try {
          await getSupabaseService().updateConversation(id, conversations[id]);
                  } catch (error) {
          console.error('🔍 [ConversationService] Failed to update in Supabase:', error);
        }
      }
      
      // Save to localStorage as backup
      await this.setConversations(conversations);
    }
  }

  static async deleteConversation(id: string): Promise<void> {
    const userId = await this.getCurrentUserId();
    const conversations = await this.getConversations();
    
    // ✅ PROTECTION: Prevent deletion of Game Hub
    const conversation = conversations[id];
        if (conversation?.isGameHub || id === GAME_HUB_ID) {
      console.error('🚫 [GAME_HUB_PROTECTION] BLOCKED: Attempted to delete Game Hub conversation!');
      toastService.warning('Cannot delete the Game Hub conversation. It\'s your main conversation space!');
      throw new Error('Cannot delete the Game Hub conversation');
    }
    
    delete conversations[id];
    
    // ✅ PRIMARY: Delete from Supabase first
    if (userId) {
      try {
        await getSupabaseService().deleteConversation(id);
              } catch (error) {
        console.error('🔍 [ConversationService] Failed to delete from Supabase:', error);
      }
    }
    
    // Update localStorage as backup
    await this.setConversations(conversations);
  }

  static async addMessage(conversationId: string, message: ChatMessage): Promise<{ success: boolean; reason?: string; savedMessageId?: string }> {
    // ✅ QUERY-BASED LIMITS: Message limits removed - unlimited messages per conversation
    // Query limits (text/image) are checked in aiService before sending to AI
    
    console.error('📝 [ConversationService] addMessage called:', {
      conversationId,
      messageId: message.id,
      role: message.role,
      hasImage: !!message.imageUrl,
      contentLength: message.content?.length
    });
    
    const conversations = await this.getConversations();
    console.error('📝 [ConversationService] Current conversations:', Object.keys(conversations));
    
    if (conversations[conversationId]) {
      const conversation = conversations[conversationId];
      
      console.error('📝 [ConversationService] Found conversation:', {
        id: conversation.id,
        currentMessageCount: conversation.messages?.length || 0,
        existingMessages: conversation.messages?.map(m => ({ id: m.id, role: m.role }))
      });
      
      // ✅ Check for duplicates to prevent race condition issues
      const exists = conversation.messages.some(m => m.id === message.id);
      if (exists) {
        console.error('⚠️ [ConversationService] Message already exists:', message.id);
        return { success: true, reason: 'Message already exists', savedMessageId: message.id };
      }
      
      // ✅ CRITICAL FIX: Save message to database first before adding to memory
      try {
        console.error('💾 [ConversationService] Saving message to database...');
        const { MessageService } = await import('./messageService');
        const messageService = MessageService.getInstance();
        const savedMessage = await messageService.addMessage(conversationId, {
          role: message.role,
          content: message.content,
          imageUrl: message.imageUrl,
          metadata: message.metadata
        });
        
        if (!savedMessage) {
          throw new Error('Database returned null for saved message');
        }
        
        console.error('✅ [ConversationService] Message saved to database:', savedMessage.id);
        
        // Add the message to memory (using the database-generated ID and timestamp)
        const messageWithDbFields: ChatMessage = {
          ...message,
          id: savedMessage.id,
          timestamp: savedMessage.timestamp
        };
        
        conversation.messages.push(messageWithDbFields);
        conversation.updatedAt = Date.now();
        
        console.error('✅ [ConversationService] Message added to conversation, new count:', conversation.messages.length);
        console.error('✅ [ConversationService] Updated messages:', conversation.messages.map(m => ({ id: m.id, role: m.role })));
        
        await this.setConversations(conversations);
        
        console.error('✅ [ConversationService] Conversations saved to storage');
        
        return { success: true, savedMessageId: savedMessage.id };
      } catch (error) {
        console.error('❌ [ConversationService] Failed to save message:', error);
        
        // Invalidate cache to force fresh read on next access
        this.clearCache();
        
        // Show error to user
        const { toastService } = await import('./toastService');
        toastService.error('Failed to save message. Please try again.');
        
        return { 
          success: false, 
          reason: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
      
      // ✅ SCALABILITY: Save individual conversation to cache (non-blocking)
      chatMemoryService.saveConversation(conversation)
        .catch(error => console.warn('Failed to save conversation to cache:', error));
      
      // ✅ SCALABILITY: Save chat context for AI memory (non-blocking)
      // Fire and forget - don't block on this operation
      import('./authService').then(({ authService }) => {
        const user = authService.getCurrentUser();
        if (user?.authUserId) {
          chatMemoryService.saveChatContext(user.authUserId, {
            recentMessages: conversation.messages.slice(-10), // Last 10 messages
            userPreferences: {}, // This would come from user service
            gameContext: {}, // This would come from game context
            conversationSummary: conversation.title
          }).catch(error => console.warn('Failed to save chat context:', error));
        }
      }).catch(error => console.warn('Failed to import authService:', error));
      
      return { success: true };
    }
    
    console.error('❌ [ConversationService] Conversation not found:', conversationId);
    return { success: false, reason: 'Conversation not found' };
  }

  static async getActiveConversation(): Promise<Conversation | null> {
    const conversations = await this.getConversations();
    const activeConversation = Object.values(conversations).find(conv => conv.isActive);
    return activeConversation || null;
  }

  // ✅ QUERY-BASED USAGE: Get user's current query usage statistics
  static async getUsageStats(): Promise<{
    textQueries: { current: number; limit: number; tier: UserTier };
    imageQueries: { current: number; limit: number; tier: UserTier };
    conversations: { current: number; tier: UserTier };
  }> {
    const { authService } = await import('./authService');
    const user = authService.getCurrentUser();
    const conversations = await this.getConversations();
    const tier = await this.getUserTier();
    
    if (!user) {
      // Return defaults if no user
      return {
        textQueries: { current: 0, limit: 55, tier },
        imageQueries: { current: 0, limit: 25, tier },
        conversations: { current: 0, tier }
      };
    }
    
    return {
      textQueries: {
        current: user.textCount || 0,
        limit: user.textLimit || 55,
        tier
      },
      imageQueries: {
        current: user.imageCount || 0,
        limit: user.imageLimit || 25,
        tier
      },
      conversations: {
        current: Object.keys(conversations).length,
        tier
      }
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
          }
  }

  static async clearConversation(conversationId: string): Promise<void> {
    const conversations = await this.getConversations();
    const conversation = conversations[conversationId];
    
    if (!conversation) {
            return;
    }
    
    // ✅ CRITICAL: Delete all messages from database before clearing in memory
    // Get the message service to delete messages from the database
    try {
      const { MessageService } = await import('./messageService');
      const messageService = MessageService.getInstance();
      
      // Delete all messages for this conversation from the database
      const messagesToDelete = conversation.messages || [];
      console.error('🗑️ [ConversationService] Deleting', messagesToDelete.length, 'messages from database');
      
      for (const message of messagesToDelete) {
        try {
          await messageService.deleteMessage(conversationId, message.id);
          console.error('🗑️ [ConversationService] Deleted message:', message.id);
        } catch (error) {
          console.error('❌ [ConversationService] Failed to delete message:', message.id, error);
          // Continue deleting other messages even if one fails
        }
      }
      
      console.error('✅ [ConversationService] All messages deleted from database');
    } catch (error) {
      console.error('❌ [ConversationService] Failed to delete messages:', error);
      // Still clear the messages in memory even if database deletion fails
    }
    
    // Clear messages in memory
    conversations[conversationId] = {
      ...conversations[conversationId],
      messages: [],
      updatedAt: Date.now(),
    };
    
    await this.setConversations(conversations);
    await chatMemoryService.saveConversation(conversations[conversationId]);
    
    console.error('✅ [ConversationService] Conversation cleared:', conversationId);
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
   * Optionally hydrate subtabs from normalized table if feature flag is enabled
   */
  static async getConversation(conversationId: string, hydrateSubtabs = true): Promise<Conversation | null> {
    const conversations = await this.getConversations();
    const conversation = conversations[conversationId] || null;
    
    if (!conversation || !hydrateSubtabs) {
      return conversation;
    }
    
    // If using normalized subtabs, hydrate them from the subtabs table
    // This is handled automatically by subtabsService.getSubtabs()
    // which checks FEATURE_FLAGS.USE_NORMALIZED_SUBTABS
    return conversation;
  }

  /**
   * Ensure Game Hub exists - creates it if missing
   * Returns the Game Hub conversation
   */
  static async ensureGameHubExists(): Promise<Conversation> {
    // ✅ FIX: Load from Supabase first to get the real Game Hub with messages
        const conversations = await this.getConversations();
    const existingGameHub = Object.values(conversations).find(
      conv => conv.isGameHub || conv.id === GAME_HUB_ID || conv.title === DEFAULT_CONVERSATION_TITLE
    );
    
    if (existingGameHub) {
            return existingGameHub;
    }
    
    // Not found, create new Game Hub
        const gameHub = this.createConversation(DEFAULT_CONVERSATION_TITLE, GAME_HUB_ID);
    await this.addConversation(gameHub);
    
    // Return the newly created Game Hub
        return gameHub;
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
