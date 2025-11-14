import { StorageService } from './storageService';
import { cacheService } from './cacheService';
import { chatMemoryService } from './chatMemoryService';
import { SupabaseService } from './supabaseService';
import { toastService } from './toastService';
import { Conversations, Conversation, ChatMessage, UserTier } from '../types';
import { STORAGE_KEYS, DEFAULT_CONVERSATION_TITLE, GAME_HUB_ID, USER_TIERS } from '../constants';

// Initialize Supabase service instance
const supabaseService = SupabaseService.getInstance();

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
      console.warn('Could not get user ID from auth service:', error);
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
      console.warn('Could not get user tier from auth service:', error);
    }
    
    // Fallback to localStorage
    const user = StorageService.get(STORAGE_KEYS.USER, null) as any;
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
  private static CACHE_TTL = 2000; // 2 second cache (short TTL for near-real-time)

  /**
   * Clear the conversations cache to force fresh database read
   */
  static clearCache(): void {
    console.error('🗑️ [ConversationService] Cache cleared, next read will be fresh');
    this.conversationsCache = null;
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
        console.log('🔍 [ConversationService] Loading conversations from Supabase for user:', userId);
        const supabaseConvs = await supabaseService.getConversations(userId);
        
        // Convert array to object format
        conversations = supabaseConvs.reduce((acc, conv) => {
          acc[conv.id] = conv;
          return acc;
        }, {} as Conversations);
        
        console.log('🔍 [ConversationService] Loaded', Object.keys(conversations).length, 'conversations from Supabase');
        
        // ✅ Update cache
        this.conversationsCache = {
          data: conversations,
          timestamp: Date.now()
        };
        
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
      console.log('🔍 [ConversationService] No user ID, loading from localStorage');
      conversations = StorageService.get(STORAGE_KEYS.CONVERSATIONS, {}) as Conversations;
    }
    
    // Migration: Update existing "General Chat" or "Everything else" titles to "Game Hub"
    let needsUpdate = false;
    Object.values(conversations).forEach((conv: Conversation) => {
      if (conv.title === 'General Chat' || conv.title === 'Everything else') {
        console.log('🎮 [GAME_HUB_PROTECTION] Migrating legacy conversation to Game Hub:', {
          oldTitle: conv.title,
          oldId: conv.id,
          oldIsGameHub: conv.isGameHub
        });
        conv.title = DEFAULT_CONVERSATION_TITLE; // "Game Hub"
        conv.id = GAME_HUB_ID; // Ensure ID is correct
        conv.isGameHub = true; // Mark as Game Hub
        needsUpdate = true;
      }
      // Also ensure any conversation with game-hub ID has the flag set
      if (conv.id === GAME_HUB_ID && !conv.isGameHub) {
        console.warn('🎮 [GAME_HUB_PROTECTION] Fixing missing isGameHub flag for:', conv.id);
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
    console.log('🔍 [ConversationService] Saved to localStorage');
    
    // ✅ PRIMARY: Save to Supabase if user is logged in (with retry logic)
    if (userId) {
      try {
        console.log('🔍 [ConversationService] Syncing to Supabase...');
        // Save each conversation to Supabase
        const savePromises = Object.values(conversations).map(async (conv) => {
          try {
            // Check if conversation exists in Supabase
            const existingConvs = await supabaseService.getConversations(userId);
            const exists = existingConvs.some(c => c.id === conv.id);
            
            if (exists) {
              // Update existing
              await supabaseService.updateConversation(conv.id, conv);
            } else {
              // Create new - but need to handle the ID correctly
              // Supabase generates UUID, so we may need to update our local ID
              await supabaseService.createConversation(userId, conv);
            }
          } catch (error) {
            console.warn(`Failed to save conversation ${conv.id} to Supabase:`, error);
            throw error; // Re-throw to trigger retry
          }
        });
        
        await Promise.all(savePromises);
        console.log('🔍 [ConversationService] Synced to Supabase successfully');
        
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
    const now = Date.now();
    const isGameHub = title === DEFAULT_CONVERSATION_TITLE;
    // Use 'game-hub' as ID for the default Game Hub conversation
    const conversationId = id || (isGameHub ? GAME_HUB_ID : `conv_${now}`);
    
    console.log('🎮 [GAME_HUB_PROTECTION] createConversation called:', {
      title,
      providedId: id,
      isGameHub,
      conversationId,
      GAME_HUB_ID_VALUE: GAME_HUB_ID,
      DEFAULT_TITLE: DEFAULT_CONVERSATION_TITLE
    });
    
    return {
      id: conversationId,
      title: title || DEFAULT_CONVERSATION_TITLE,
      messages: [],
      createdAt: now,
      updatedAt: now,
      isActive: true,
      isGameHub: isGameHub, // Set flag for Game Hub
    };
  }

  static async addConversation(conversation: Conversation): Promise<{ success: boolean; reason?: string }> {
    // ✅ PERFORMANCE: Check if there's already a pending creation for this conversation
    if (this.pendingCreations.has(conversation.id)) {
      console.log('🔍 [ConversationService] Deduplicating conversation creation for:', conversation.id);
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
    
    // ✅ Conversations are unlimited - add the new conversation
    conversations[conversation.id] = conversation;
    console.log('🔍 [ConversationService] Adding new conversation:', conversation.id, conversation.title);
    
    // ✅ PRIMARY: Save to Supabase first if user logged in
    if (userId) {
      try {
        // Pass the conversation with its ID to ensure Game Hub uses 'game-hub' consistently
        const newId = await supabaseService.createConversation(userId, conversation);
        if (newId) {
          // Update conversation with Supabase-returned ID if different
          if (newId !== conversation.id) {
            console.log('🔍 [ConversationService] Supabase returned different ID, updating:', conversation.id, '→', newId);
            delete conversations[conversation.id];
            conversation.id = newId;
            conversations[newId] = conversation;
          } else {
            console.log('🔍 [ConversationService] Created in Supabase with consistent ID:', newId);
          }
        }
      } catch (error) {
        console.error('🔍 [ConversationService] Failed to create in Supabase:', error);
      }
    }
    
    // Save to localStorage as backup
    await this.setConversations(conversations);
    
    console.log('🔍 [ConversationService] New conversation persisted successfully');
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
          await supabaseService.updateConversation(id, conversations[id]);
          console.log('🔍 [ConversationService] Updated conversation in Supabase:', id);
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
    console.log('🎮 [GAME_HUB_PROTECTION] deleteConversation called:', { 
      conversationId: id, 
      isGameHub: conversation?.isGameHub, 
      matchesConstant: id === GAME_HUB_ID,
      conversationTitle: conversation?.title,
      GAME_HUB_ID_VALUE: GAME_HUB_ID
    });
    
    if (conversation?.isGameHub || id === GAME_HUB_ID) {
      console.error('🚫 [GAME_HUB_PROTECTION] BLOCKED: Attempted to delete Game Hub conversation!');
      toastService.warning('Cannot delete the Game Hub conversation. It\'s your main conversation space!');
      throw new Error('Cannot delete the Game Hub conversation');
    }
    
    delete conversations[id];
    
    // ✅ PRIMARY: Delete from Supabase first
    if (userId) {
      try {
        await supabaseService.deleteConversation(id);
        console.log('🔍 [ConversationService] Deleted conversation from Supabase:', id);
      } catch (error) {
        console.error('🔍 [ConversationService] Failed to delete from Supabase:', error);
      }
    }
    
    // Update localStorage as backup
    await this.setConversations(conversations);
  }

  static async addMessage(conversationId: string, message: ChatMessage): Promise<{ success: boolean; reason?: string }> {
    // ✅ QUERY-BASED LIMITS: Message limits removed - unlimited messages per conversation
    // Query limits (text/image) are checked in aiService before sending to AI
    
    const conversations = await this.getConversations();
    if (conversations[conversationId]) {
      const conversation = conversations[conversationId];
      
      // ✅ Check for duplicates to prevent race condition issues
      const exists = conversation.messages.some(m => m.id === message.id);
      if (exists) {
        console.warn(`⚠️ [ConversationService] Message ${message.id} already exists in conversation ${conversationId}, skipping`);
        return { success: true, reason: 'Message already exists' };
      }
      
      // Simply add the message - no limits
      conversation.messages.push(message);
      conversation.updatedAt = Date.now();
      
      await this.setConversations(conversations);
      
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
      console.warn('Failed to clear conversation cache:', error);
    }
  }

  static async clearConversation(conversationId: string): Promise<void> {
    const conversations = await this.getConversations();
    const conversation = conversations[conversationId];
    
    if (!conversation) {
      console.warn('🔍 [ConversationService] clearConversation: Conversation not found:', conversationId);
      return;
    }
    
    // ✅ PROTECTION: Prevent clearing Game Hub messages
    console.log('🎮 [GAME_HUB_PROTECTION] clearConversation called:', { 
      conversationId, 
      isGameHub: conversation.isGameHub, 
      matchesConstant: conversationId === GAME_HUB_ID,
      conversationTitle: conversation.title,
      messageCount: conversation.messages?.length || 0,
      GAME_HUB_ID_VALUE: GAME_HUB_ID
    });
    
    if (conversation.isGameHub || conversationId === GAME_HUB_ID) {
      console.error('🚫 [GAME_HUB_PROTECTION] BLOCKED: Attempted to clear Game Hub conversation messages!');
      toastService.warning('Cannot clear the Game Hub conversation. It\'s your main conversation space!');
      throw new Error('Cannot clear the Game Hub conversation');
    }
    
    // Clear messages but keep the conversation
    conversations[conversationId] = {
      ...conversations[conversationId],
      messages: [],
      updatedAt: Date.now(),
    };
    
    await this.setConversations(conversations);
    await chatMemoryService.saveConversation(conversations[conversationId]);
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
    const conversations = await this.getConversations();
    
    // Check if Game Hub already exists
    const existingGameHub = Object.values(conversations).find(
      conv => conv.isGameHub || conv.id === GAME_HUB_ID || conv.title === DEFAULT_CONVERSATION_TITLE
    );
    
    if (existingGameHub) {
      console.log('🔍 [ConversationService] Game Hub already exists:', existingGameHub.id);
      return existingGameHub;
    }
    
    // Create new Game Hub
    console.log('🔍 [ConversationService] Creating Game Hub...');
    const gameHub = this.createConversation(DEFAULT_CONVERSATION_TITLE, GAME_HUB_ID);
    await this.addConversation(gameHub);
    
    console.log('🔍 [ConversationService] Game Hub created successfully');
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
