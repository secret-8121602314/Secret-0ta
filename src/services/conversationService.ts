import { StorageService } from './storageService';
import { cacheService } from './cacheService';
import { chatMemoryService } from './chatMemoryService';
import { SupabaseService } from './supabaseService';
import { toastService } from './toastService';
import { fetchCoverUrlsFromCache } from './igdbService';
import { Conversations, Conversation, ChatMessage, UserTier } from '../types';
import { STORAGE_KEYS, DEFAULT_CONVERSATION_TITLE, GAME_HUB_ID, USER_TIERS, FEATURE_FLAGS } from '../constants';

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
// - Free: 20 text + 15 image queries/month
// - Pro: 350 text + 150 image queries/month
// - Vanguard Pro: 350 text + 150 image queries/month
// See: users table (text_count, image_count, text_limit, image_limit, last_reset)

export class ConversationService {
  // ✅ PERFORMANCE: Deduplicate conversation creation attempts
  private static pendingCreations = new Map<string, Promise<{ success: boolean; reason?: string }>>();
  
  // ✅ PERFORMANCE: Cache Game Hub to avoid repeated DB calls
  private static gameHubCache: { userId: string; gameHub: Conversation; timestamp: number } | null = null;
  private static readonly GAME_HUB_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  // ✅ Get current user ID for Supabase operations
  private static async getCurrentUserId(): Promise<string | null> {
    try {
      const { authService } = await import('./authService');
      const user = authService.getCurrentUser();
      return user?.authUserId || null;
    } catch {
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
    } catch (_e) {
      // Fall through to localStorage fallback
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
      const textLimit = user.textLimit || 20; // Default to free tier
      
      if (textCount >= textLimit) {
        const tier = user.tier || 'free';
        return {
          allowed: false,
          reason: `You've used all ${textLimit} text queries this month. ${tier === 'free' ? 'Upgrade to Pro for 350 queries!' : 'Your queries will reset next month.'}`,
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
      const imageLimit = user.imageLimit || 15; // Default to free tier
      
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
  // ✅ SECURITY: Now includes userId to prevent data leakage between accounts
  private static conversationsCache: { userId: string; data: Conversations; timestamp: number } | null = null;
  private static CACHE_TTL = 5000; // 5 second cache (balance between real-time and performance)
  private static MAX_MESSAGES_IN_LOCALSTORAGE = 50; // Keep only recent messages in localStorage

  /**
   * Trim conversations for localStorage storage to prevent quota exceeded errors.
   * Full message history is always preserved in Supabase.
   */
  private static trimConversationsForLocalStorage(conversations: Conversations): Conversations {
    const trimmed: Conversations = {};
    
    for (const [id, conv] of Object.entries(conversations)) {
      trimmed[id] = { ...conv };
      
      // Keep only the last N messages in localStorage
      if (conv.messages && conv.messages.length > this.MAX_MESSAGES_IN_LOCALSTORAGE) {
        trimmed[id].messages = conv.messages.slice(-this.MAX_MESSAGES_IN_LOCALSTORAGE);
      }
    }
    
    return trimmed;
  }

  /**
   * Clear the conversations cache to force fresh database read
   */
  static clearCache(): void {
    this.conversationsCache = null;
    this.gameHubCache = null; // ✅ Also clear Game Hub cache
  }

  /**
   * Background cache refresh (non-blocking)
   */
  private static async refreshCacheInBackground(userId: string): Promise<void> {
    try {
      const supabaseConvs = await getSupabaseService().getConversations(userId);
      const conversations = supabaseConvs.reduce((acc, conv) => {
        acc[conv.id] = conv;
        return acc;
      }, {} as Conversations);
      
      this.conversationsCache = {
        userId,
        data: conversations,
        timestamp: Date.now()
      };
      console.log('🔍 [ConversationService] Background cache refresh complete');
    } catch (error) {
      console.error('🔍 [ConversationService] Background cache refresh failed:', error);
    }
  }

  /**
   * ✅ Cleanup conversations for localStorage storage to prevent quota exceeded
   * Keeps only the last 20 messages per conversation and removes large data
   */
  private static cleanupConversationsForStorage(conversations: Conversations): Conversations {
    const cleaned: Conversations = {};
    
    for (const [id, conv] of Object.entries(conversations)) {
      // Keep only last 20 messages per conversation
      const messages = conv.messages?.slice(-20) || [];
      
      // Remove image URLs from messages (large base64 data)
      const cleanedMessages = messages.map(msg => ({
        ...msg,
        imageUrl: msg.imageUrl ? '[removed]' : undefined
      }));
      
      // Keep subtabs but limit content
      const cleanedSubtabs = conv.subtabs?.map(tab => ({
        ...tab,
        content: tab.content?.substring(0, 1000) || '' // Keep only first 1000 chars
      }));
      
      cleaned[id] = {
        ...conv,
        messages: cleanedMessages,
        subtabs: cleanedSubtabs
      };
    }
    
    return cleaned;
  }

  /**
   * ✅ SECURITY FIX: Clear ALL cached data - call on logout to prevent data leakage
   * This prevents User B from seeing User A's conversations after logout
   */
  static clearAllCaches(): void {
    console.log('🗑️ [ConversationService] Clearing all caches and state to prevent data leakage');
    
    // Clear conversations cache
    this.conversationsCache = null;
    
    // Clear pending creation promises
    this.pendingCreations.clear();
    
    // Clear localStorage backup
    localStorage.removeItem('otakon_conversations');
    localStorage.removeItem('otakon_active_conversation');
    
    // ✅ PWA FIX: Dispatch event to notify MainApp that caches are cleared
    // This ensures MainApp resets its loading guards AFTER caches are cleared
    window.dispatchEvent(new CustomEvent('otakon:caches-cleared'));
    
    console.log('✅ [ConversationService] All caches cleared - ready for new user login');
  }

  /**
   * Get cached conversations without querying Supabase
   * Returns null if cache is empty or expired
   */
  static getCachedConversations(): Conversations | null {
    // ✅ SECURITY: Cache validation is now done in getConversations() with userId check
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
    
    // ✅ SECURITY: Check in-memory cache first (unless explicitly skipped)
    // ✅ CRITICAL: Validate userId matches cache to prevent data leakage between accounts
    // ✅ FIX: Use merge strategy - never return stale cache that's missing new data
    if (!skipCache && 
        this.conversationsCache && 
        this.conversationsCache.userId === userId &&
        Date.now() - this.conversationsCache.timestamp < this.CACHE_TTL) {
      // Return cache immediately, but also refresh in background if approaching TTL
      if (Date.now() - this.conversationsCache.timestamp > this.CACHE_TTL / 2) {
        this.refreshCacheInBackground(userId);
      }
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
        
        // ✅ Fetch cover URLs from IGDB cache for game tabs
        const gameConvs = Object.values(conversations).filter(
          conv => (conv.gameTitle && !conv.isGameHub) || conv.isUnreleased
        );
        if (gameConvs.length > 0) {
          const gameNames = gameConvs
            .map(conv => conv.gameTitle || conv.title)
            .filter((name): name is string => !!name);
          
          if (gameNames.length > 0) {
            const coverUrls = await fetchCoverUrlsFromCache(gameNames);
            
            // Attach cover URLs to conversations
            for (const conv of gameConvs) {
              const gameName = (conv.gameTitle || conv.title)?.toLowerCase().trim();
              if (gameName && coverUrls.has(gameName)) {
                conversations[conv.id].coverUrl = coverUrls.get(gameName);
              }
            }
          }
        }
        
        // ✅ SECURITY: Update cache with userId validation
        this.conversationsCache = {
          userId: userId,
          data: conversations,
          timestamp: Date.now()
        };
        
        // Also update localStorage as backup
        if (Object.keys(conversations).length > 0) {
          try {
            // ✅ FIX: Cleanup old messages before saving to prevent quota exceeded
            const cleanedConversations = this.cleanupConversationsForStorage(conversations);
            StorageService.set(STORAGE_KEYS.CONVERSATIONS, cleanedConversations);
          } catch (storageError) {
            // If localStorage is full, just log warning and continue
            // The app will still work fine using Supabase and in-memory cache
            console.warn('⚠️ [ConversationService] localStorage full, skipping backup:', storageError);
          }
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
    
    // ✅ Invalidate cache when writing
    this.conversationsCache = null;
    
    // ✅ Trim conversations for localStorage (keep last 50 messages per conversation)
    // Full history is always preserved in Supabase
    const trimmedForLocalStorage = this.trimConversationsForLocalStorage(conversations);
    
    // Always save to localStorage as backup (with trimmed messages)
    StorageService.set(STORAGE_KEYS.CONVERSATIONS, trimmedForLocalStorage);
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
          } catch {
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
    const pendingCreation = this.pendingCreations.get(conversation.id);
    if (pendingCreation) {
      return await pendingCreation;
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
            // ID changed - update local reference
            delete conversations[conversation.id];
            conversation.id = newId;
            conversations[newId] = conversation;
          }
          // else: ID matches, no action needed
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

  static async addMessage(conversationId: string, message: ChatMessage): Promise<{ success: boolean; reason?: string; message?: ChatMessage }> {
    // ✅ QUERY-BASED LIMITS: Message limits removed - unlimited messages per conversation
    // Query limits (text/image) are checked in aiService before sending to AI
    
    const conversations = await this.getConversations();
    
    if (conversations[conversationId]) {
      const conversation = conversations[conversationId];
      
      // ✅ Check for duplicates to prevent race condition issues
      const exists = conversation.messages.some(m => m.id === message.id);
      if (exists) {
        return { success: true, reason: 'Message already exists' };
      }
      
      // ✅ CRITICAL FIX: Save message to database first before adding to memory
      let messageWithDbFields: ChatMessage;
      try {
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
        messageWithDbFields = {
          ...message,
          id: savedMessage.id,
          timestamp: savedMessage.timestamp
        };
        
        conversation.messages.push(messageWithDbFields);
        conversation.updatedAt = Date.now();
        
        await this.setConversations(conversations);
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
      
      // ✅ CRITICAL: Return the message with database UUID for migration
      return { success: true, message: messageWithDbFields };
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
        textQueries: { current: 0, limit: 20, tier },
        imageQueries: { current: 0, limit: 15, tier },
        conversations: { current: 0, tier }
      };
    }
    
    return {
      textQueries: {
        current: user.textCount || 0,
        limit: user.textLimit || 20,
        tier
      },
      imageQueries: {
        current: user.imageCount || 0,
        limit: user.imageLimit || 15,
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
    } catch (_e) {
      // Cache clear failed - non-critical
    }
  }

  static async clearConversation(conversationId: string): Promise<void> {
    const conversations = await this.getConversations();
    const conversation = conversations[conversationId];
    
    if (!conversation) {
            return;
    }
    
    // ✅ CRITICAL: Delete messages from database when using normalized messages
    if (FEATURE_FLAGS.USE_NORMALIZED_MESSAGES && conversation.messages.length > 0) {
      try {
        const messageIds = conversation.messages.map(m => m.id);
        console.error('🗑️ [ConversationService] Deleting', messageIds.length, 'messages from database for conversation:', conversationId);
        
        const { MessageService } = await import('./messageService');
        const messageService = MessageService.getInstance();
        
        // Delete messages one by one (MessageService only has deleteMessage, not deleteMessages)
        for (const messageId of messageIds) {
          // eslint-disable-next-line no-await-in-loop
          await messageService.deleteMessage(conversationId, messageId);
        }
        
        console.error('✅ [ConversationService] Messages deleted from database');
      } catch (error) {
        console.error('❌ [ConversationService] Failed to delete messages from database:', error);
        // Continue anyway to clear in-memory messages
      }
    }
    
    // Clear messages but keep the conversation (including Game Hub)
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
   * @param forceRefresh - If true, skip cache and query database directly
   */
  static async ensureGameHubExists(forceRefresh = false): Promise<Conversation> {
    // ✅ PERFORMANCE: Check Game Hub cache first (unless forced refresh)
    const userId = await this.getCurrentUserId();
    if (!forceRefresh && 
        userId && 
        this.gameHubCache && 
        this.gameHubCache.userId === userId &&
        Date.now() - this.gameHubCache.timestamp < this.GAME_HUB_CACHE_TTL) {
      return this.gameHubCache.gameHub;
    }
    
    // ✅ FIX: Load from Supabase first to get the real Game Hub with messages
    // ✅ PWA FIX: Force refresh on new user login to ensure we get correct user's data
    if (forceRefresh) {
      this.clearCache();
    }
    
    const conversations = await this.getConversations(forceRefresh);
    const existingGameHub = Object.values(conversations).find(
      conv => conv.isGameHub || conv.id === GAME_HUB_ID || conv.title === DEFAULT_CONVERSATION_TITLE
    );
    
    if (existingGameHub) {
      // ✅ Cache the Game Hub for this user
      if (userId) {
        this.gameHubCache = {
          userId,
          gameHub: existingGameHub,
          timestamp: Date.now()
        };
      }
      return existingGameHub;
    }
    
    // Not found, create new Game Hub
    const gameHub = this.createConversation(DEFAULT_CONVERSATION_TITLE, GAME_HUB_ID);
    await this.addConversation(gameHub);
    
    // Cache the newly created Game Hub
    if (userId) {
      this.gameHubCache = {
        userId,
        gameHub,
        timestamp: Date.now()
      };
    }
    
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
