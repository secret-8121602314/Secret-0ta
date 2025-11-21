import { supabase } from '../lib/supabase';
import { ChatMessage } from '../types';
import { FEATURE_FLAGS } from '../constants';
import { toJson, safeString, safeParseDate, jsonToRecord } from '../utils/typeHelpers';

/**
 * MessageService - Abstraction layer for message storage
 * 
 * Supports both approaches:
 * 1. Legacy: conversations.messages JSONB array
 * 2. Normalized: messages table with RLS and indexes
 * 
 * Toggle via FEATURE_FLAGS.USE_NORMALIZED_MESSAGES
 */
export class MessageService {
  private static instance: MessageService;

  static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  /**
   * Get all messages for a conversation
   */
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    if (FEATURE_FLAGS.USE_NORMALIZED_MESSAGES) {
      return this.getMessagesFromTable(conversationId);
    } else {
      return this.getMessagesFromJsonb(conversationId);
    }
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(
    conversationId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ): Promise<ChatMessage | null> {
    if (FEATURE_FLAGS.USE_NORMALIZED_MESSAGES) {
      return this.addMessageToTable(conversationId, message);
    } else {
      return this.addMessageToJsonb(conversationId, message);
    }
  }

  /**
   * Update a message in a conversation
   */
  async updateMessage(
    conversationId: string,
    messageId: string,
    updates: Partial<ChatMessage>
  ): Promise<boolean> {
    if (FEATURE_FLAGS.USE_NORMALIZED_MESSAGES) {
      return this.updateMessageInTable(messageId, updates);
    } else {
      return this.updateMessageInJsonb(conversationId, messageId, updates);
    }
  }

  /**
   * Delete a message from a conversation
   */
  async deleteMessage(conversationId: string, messageId: string): Promise<boolean> {
    if (FEATURE_FLAGS.USE_NORMALIZED_MESSAGES) {
      return this.deleteMessageFromTable(messageId);
    } else {
      return this.deleteMessageFromJsonb(conversationId, messageId);
    }
  }

  // ============================================================================
  // NORMALIZED MESSAGES TABLE METHODS
  // ============================================================================

  /**
   * Get messages from normalized messages table using database function
   */
  private async getMessagesFromTable(conversationId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase.rpc('get_conversation_messages', {
        p_conversation_id: conversationId,
      });

      if (error) {
        console.error('Error getting messages from table:', error);
        return [];
      }

      return (data || []).map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: new Date(msg.created_at).getTime(),
        imageUrl: msg.image_url || undefined,
        metadata: jsonToRecord(msg.metadata),
      }));
    } catch (error) {
      console.error('Error getting messages from table:', error);
      return [];
    }
  }

  /**
   * Add message to normalized messages table using database function
   * @throws Error if message cannot be saved after retries
   */
  private async addMessageToTable(
    conversationId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ): Promise<ChatMessage | null> {
    const maxRetries = 3;
    const delays = [0, 1000, 2000]; // 0ms, 1s, 2s
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, delays[attempt]));
          console.warn(`🔄 [MessageService] Retry attempt ${attempt + 1}/${maxRetries}`);
        }
        
        const { data, error } = await supabase.rpc('add_message', {
          p_conversation_id: conversationId,
          p_role: message.role,
          p_content: message.content,
          p_image_url: safeString(message.imageUrl, undefined),
          p_metadata: toJson(message.metadata || {}),
        });

        if (error) {
          // Transient errors: retry
          if (attempt < maxRetries - 1 && (error.code === 'PGRST301' || error.message?.includes('timeout') || error.message?.includes('network'))) {
            console.warn(`⚠️ [MessageService] Transient error, will retry:`, error);
            continue;
          }
          // Permanent errors: throw immediately
          throw new Error(`Failed to add message: ${error.message} (code: ${error.code})`);
        }

        // Fetch the newly created message
        const { data: newMessage, error: fetchError } = await supabase
          .from('messages')
          .select('*')
          .eq('id', data)
          .single();

        if (fetchError) {
          throw new Error(`Failed to fetch new message: ${fetchError.message}`);
        }
        
        if (!newMessage) {
          throw new Error('Message not found after insert - database inconsistency');
        }

        return {
          id: newMessage.id,
          role: newMessage.role as 'user' | 'assistant' | 'system',
          content: newMessage.content,
          timestamp: safeParseDate(newMessage.created_at),
          imageUrl: safeString(newMessage.image_url, undefined),
          metadata: jsonToRecord(newMessage.metadata),
        };
      } catch (error) {
        if (attempt === maxRetries - 1) {
          // Final attempt failed
          console.error('❌ [MessageService] All retry attempts exhausted:', error);
          throw error;
        }
      }
    }
    
    throw new Error('Unexpected: retry loop completed without result');
  }

  /**
   * Update message in normalized messages table
   */
  private async updateMessageInTable(
    messageId: string,
    updates: Partial<ChatMessage>
  ): Promise<boolean> {
    try {
      const updateData: Record<string, unknown> = {};
      if (updates.content !== undefined) {
        updateData.content = updates.content;
      }
      if (updates.imageUrl !== undefined) {
        updateData.image_url = updates.imageUrl;
      }
      if (updates.metadata !== undefined) {
        updateData.metadata = updates.metadata;
      }

      const { error } = await supabase
        .from('messages')
        .update(updateData)
        .eq('id', messageId);

      if (error) {
        console.error('Error updating message in table:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating message in table:', error);
      return false;
    }
  }

  /**
   * Delete message from normalized messages table
   */
  private async deleteMessageFromTable(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('Error deleting message from table:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting message from table:', error);
      return false;
    }
  }

  // ============================================================================
  // LEGACY JSONB METHODS
  // ============================================================================

  /**
   * Get messages from conversations.messages JSONB array (legacy)
   */
  private async getMessagesFromJsonb(conversationId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Error getting messages from JSONB:', error);
        return [];
      }

      return (Array.isArray(data?.messages) ? data.messages : []) as unknown as ChatMessage[];
    } catch (error) {
      console.error('Error getting messages from JSONB:', error);
      return [];
    }
  }

  /**
   * Add message to conversations.messages JSONB array (legacy)
   */
  private async addMessageToJsonb(
    conversationId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ): Promise<ChatMessage | null> {
    try {
      // First, get current messages
      const currentMessages = await this.getMessagesFromJsonb(conversationId);

      // Create new message with ID and timestamp
      const newMessage: ChatMessage = {
        ...message,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };

      // Update the conversation with new messages array
      const { error } = await supabase
        .from('conversations')
        .update({
          messages: toJson([...currentMessages, newMessage]),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (error) {
        console.error('Error adding message to JSONB:', error);
        return null;
      }

      return newMessage;
    } catch (error) {
      console.error('Error adding message to JSONB:', error);
      return null;
    }
  }

  /**
   * Update message in conversations.messages JSONB array (legacy)
   */
  private async updateMessageInJsonb(
    conversationId: string,
    messageId: string,
    updates: Partial<ChatMessage>
  ): Promise<boolean> {
    try {
      // Get current messages
      const currentMessages = await this.getMessagesFromJsonb(conversationId);

      // Find and update the message
      const updatedMessages = currentMessages.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      );

      // Update the conversation
      const { error } = await supabase
        .from('conversations')
        .update({
          messages: toJson(updatedMessages),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (error) {
        console.error('Error updating message in JSONB:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating message in JSONB:', error);
      return false;
    }
  }

  /**
   * Delete message from conversations.messages JSONB array (legacy)
   */
  private async deleteMessageFromJsonb(
    conversationId: string,
    messageId: string
  ): Promise<boolean> {
    try {
      // Get current messages
      const currentMessages = await this.getMessagesFromJsonb(conversationId);

      // Filter out the message
      const updatedMessages = currentMessages.filter(msg => msg.id !== messageId);

      // Update the conversation
      const { error } = await supabase
        .from('conversations')
        .update({
          messages: toJson(updatedMessages),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (error) {
        console.error('Error deleting message from JSONB:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting message from JSONB:', error);
      return false;
    }
  }

  // ============================================================================
  // MIGRATION UTILITIES
  // ============================================================================

  /**
   * Migrate all messages from JSONB to normalized table
   * Safe to run multiple times (idempotent)
   */
  async migrateMessagesToTable(): Promise<{
    conversationsProcessed: number;
    messagesCreated: number;
    errors: number;
  }> {
    try {
      const { data, error } = await supabase.rpc('migrate_messages_to_table');

      if (error) {
        console.error('Error migrating messages:', error);
        return { conversationsProcessed: 0, messagesCreated: 0, errors: 1 };
      }

      return {
        conversationsProcessed: data[0].conversations_processed,
        messagesCreated: data[0].messages_created,
        errors: data[0].errors,
      };
    } catch (error) {
      console.error('Error migrating messages:', error);
      return { conversationsProcessed: 0, messagesCreated: 0, errors: 1 };
    }
  }

  /**
   * Emergency rollback: Rebuild conversations.messages from messages table
   * Only use if normalized migration causes issues
   */
  async rollbackMessagesToJsonb(): Promise<{
    conversationsUpdated: number;
    errors: number;
  }> {
    try {
      const { data, error } = await supabase.rpc('rollback_messages_to_jsonb');

      if (error) {
        console.error('Error rolling back messages:', error);
        return { conversationsUpdated: 0, errors: 1 };
      }

      return {
        conversationsUpdated: data[0].conversations_updated,
        errors: data[0].errors,
      };
    } catch (error) {
      console.error('Error rolling back messages:', error);
      return { conversationsUpdated: 0, errors: 1 };
    }
  }
}

export const messageService = MessageService.getInstance();
