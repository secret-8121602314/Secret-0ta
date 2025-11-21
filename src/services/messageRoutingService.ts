/* eslint-disable no-console */
import { ConversationService } from './conversationService';
import { ChatMessage, Conversations } from '../types';

/**
 * Message Routing Service
 * Handles atomic message migration between tabs to prevent race conditions
 */
export class MessageRoutingService {
  // Active migration locks to prevent concurrent migrations
  private static activeMigrations = new Set<string>();
  private static readonly LOCK_TIMEOUT = 10000; // 10 seconds
  /**
   * Acquire a migration lock to prevent concurrent operations
   * Returns true if lock was acquired, false if already locked
   */
  private static async acquireMigrationLock(fromId: string, toId: string): Promise<boolean> {
    // Sort IDs to prevent deadlocks (AB vs BA)
    const lockKey = [fromId, toId].sort().join('|');
    
    if (this.activeMigrations.has(lockKey)) {
      console.warn('🔒 [MessageRouting] Migration already in progress:', lockKey);
      return false;
    }
    
    this.activeMigrations.add(lockKey);
    
    // Auto-release after timeout to prevent permanent locks
    setTimeout(() => {
      this.activeMigrations.delete(lockKey);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔓 [MessageRouting] Lock auto-released after timeout:', lockKey);
      }
    }, this.LOCK_TIMEOUT);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 [MessageRouting] Lock acquired:', lockKey);
    }
    
    return true;
  }

  /**
   * Release a migration lock
   */
  private static releaseMigrationLock(fromId: string, toId: string): void {
    const lockKey = [fromId, toId].sort().join('|');
    this.activeMigrations.delete(lockKey);
    if (process.env.NODE_ENV === 'development') {
      console.log('🔓 [MessageRouting] Lock released:', lockKey);
    }
  }

  /**
   * Atomically migrate messages from one conversation to another
   * This prevents race conditions by doing all operations in a single transaction
   */
  static async migrateMessagesAtomic(
    messageIds: string[],
    fromConversationId: string,
    toConversationId: string
  ): Promise<void> {
    console.error('📦 [MessageRouting] Migration requested:', {
      messageIds,
      from: fromConversationId,
      to: toConversationId
    });
    
    // Acquire lock to prevent concurrent migrations
    const lockAcquired = await this.acquireMigrationLock(fromConversationId, toConversationId);
    if (!lockAcquired) {
      console.warn('⚠️ [MessageRouting] Skipping migration - another migration in progress');
      return;
    }

    try {
    console.error('📦 [MessageRouting] Lock acquired, starting migration');

    // ✅ FIX: Use cached data (in-memory) which has the most recent state
    // Including the newly created game tab AND the game-hub with its messages
    // skipCache=true was causing issues because game-hub might not be synced to Supabase yet
    const conversations = await ConversationService.getConversations(false); // Use cache
    
    console.error('📦 [MessageRouting] Loaded conversations:', Object.keys(conversations));
    
    const fromConv = conversations[fromConversationId];
    const toConv = conversations[toConversationId];
    
    if (!fromConv) {
      console.error('📦 [MessageRouting] Source conversation not found:', fromConversationId);
      console.error('📦 [MessageRouting] Available conversations:', Object.keys(conversations));
      throw new Error(`Source conversation ${fromConversationId} not found`);
    }
    
    if (!toConv) {
      console.error('📦 [MessageRouting] Destination conversation not found:', toConversationId);
      console.error('📦 [MessageRouting] Available conversations:', Object.keys(conversations));
      throw new Error(`Destination conversation ${toConversationId} not found`);
    }
    
    console.error('📦 [MessageRouting] Source messages:', fromConv.messages?.map(m => ({ id: m.id, role: m.role })));
    console.error('📦 [MessageRouting] Destination messages before:', toConv.messages?.map(m => ({ id: m.id, role: m.role })));
    
    // Get messages to move
    const messagesToMove = fromConv.messages.filter(m => messageIds.includes(m.id));
    
    console.error('📦 [MessageRouting] Messages to move:', messagesToMove.map(m => ({ id: m.id, role: m.role })));
    
    if (messagesToMove.length === 0) {
      console.error('📦 [MessageRouting] No messages found to migrate');
      return;
    }
    
    // Check for duplicates in destination (prevent duplicate messages)
    const messagesToAdd = messagesToMove.filter(msg => 
      !toConv.messages.some(existing => existing.id === msg.id)
    );
    
    console.error('📦 [MessageRouting] Messages to add (after duplicate check):', messagesToAdd.map(m => ({ id: m.id, role: m.role })));
    
    // ATOMIC UPDATE: Modify both conversations in a single object
    const updatedConversations: Conversations = {
      ...conversations,
      [toConversationId]: {
        ...toConv,
        messages: [...toConv.messages, ...messagesToAdd],
        updatedAt: Date.now()
      },
      [fromConversationId]: {
        ...fromConv,
        messages: fromConv.messages.filter(m => !messageIds.includes(m.id)),
        updatedAt: Date.now()
      }
    };
    
    console.error('📦 [MessageRouting] Updated source messages:', updatedConversations[fromConversationId].messages?.map(m => ({ id: m.id, role: m.role })));
    console.error('📦 [MessageRouting] Updated destination messages:', updatedConversations[toConversationId].messages?.map(m => ({ id: m.id, role: m.role })));
    
    // Single write operation
    await ConversationService.setConversations(updatedConversations);
    
    console.error('✅ [MessageRouting] Migration complete, conversations saved');
    } finally {
      // Always release lock, even if migration fails
      this.releaseMigrationLock(fromConversationId, toConversationId);
    }
  }

  /**
   * Check if a message should be routed to a different tab based on game detection
   */
  static shouldRouteMessage(
    currentTabId: string,
    targetGameTabId: string | null,
    isGameHub: boolean
  ): boolean {
    // Don't route if no target game detected
    if (!targetGameTabId) {
      return false;
    }
    
    // Don't route if already in the target tab
    if (currentTabId === targetGameTabId) {
      return false;
    }
    
    // Route if currently in Game Hub and game detected
    if (isGameHub && targetGameTabId) {
      return true;
    }
    
    return false;
  }

  /**
   * Duplicate check for messages before adding
   */
  static messageExists(messages: ChatMessage[], messageId: string): boolean {
    return messages.some(m => m.id === messageId);
  }
}
