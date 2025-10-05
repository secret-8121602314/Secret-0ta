import { StorageService } from './storageService';
import { Conversations, Conversation, ChatMessage } from '../types';
import { STORAGE_KEYS, DEFAULT_CONVERSATION_TITLE } from '../constants';

// ✅ SCALABILITY: Memory limits
const MAX_CONVERSATIONS = 50; // Limit total conversations
const MAX_MESSAGES_PER_CONVERSATION = 100; // Limit messages per conversation
const MAX_TOTAL_MESSAGES = 1000; // Global message limit

export class ConversationService {
  static getConversations(): Conversations {
    const conversations = StorageService.get(STORAGE_KEYS.CONVERSATIONS, {}) as Conversations;
    
    // Migration: Update existing "General Chat" titles to "Everything else" (one-time migration)
    let needsUpdate = false;
    Object.values(conversations).forEach((conv: Conversation) => {
      if (conv.title === 'General Chat') {
        conv.title = 'Everything else';
        needsUpdate = true;
      }
    });
    
    if (needsUpdate) {
      this.setConversations(conversations);
    }
    
    // ✅ SCALABILITY: Enforce conversation limits
    const conversationArray = Object.values(conversations);
    if (conversationArray.length > MAX_CONVERSATIONS) {
      // Keep only the most recent conversations
      const sortedConversations = conversationArray
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_CONVERSATIONS);
      
      const limitedConversations: Conversations = {};
      sortedConversations.forEach(conv => {
        limitedConversations[conv.id] = conv;
      });
      
      this.setConversations(limitedConversations);
      return limitedConversations;
    }
    
    return conversations;
  }

  static setConversations(conversations: Conversations): void {
    StorageService.set(STORAGE_KEYS.CONVERSATIONS, conversations);
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

  static addConversation(conversation: Conversation): void {
    const conversations = this.getConversations();
    
    // ✅ SCALABILITY: Check conversation limit
    if (Object.keys(conversations).length >= MAX_CONVERSATIONS) {
      // Remove oldest conversation
      const oldestConversation = Object.values(conversations)
        .sort((a, b) => a.updatedAt - b.updatedAt)[0];
      delete conversations[oldestConversation.id];
    }
    
    conversations[conversation.id] = conversation;
    this.setConversations(conversations);
  }

  static updateConversation(id: string, updates: Partial<Conversation>): void {
    const conversations = this.getConversations();
    if (conversations[id]) {
      conversations[id] = {
        ...conversations[id],
        ...updates,
        updatedAt: Date.now(),
      };
      this.setConversations(conversations);
    }
  }

  static deleteConversation(id: string): void {
    const conversations = this.getConversations();
    delete conversations[id];
    this.setConversations(conversations);
  }

  static addMessage(conversationId: string, message: ChatMessage): void {
    const conversations = this.getConversations();
    if (conversations[conversationId]) {
      const conversation = conversations[conversationId];
      
      // ✅ SCALABILITY: Check message limits
      if (conversation.messages.length >= MAX_MESSAGES_PER_CONVERSATION) {
        // Remove oldest message
        conversation.messages.shift();
      }
      
      conversation.messages.push(message);
      conversation.updatedAt = Date.now();
      
      // ✅ SCALABILITY: Check global message limit
      const totalMessages = Object.values(conversations)
        .reduce((total, conv) => total + conv.messages.length, 0);
      
      if (totalMessages > MAX_TOTAL_MESSAGES) {
        this.cleanupOldMessages(conversations);
      }
      
      this.setConversations(conversations);
    }
  }

  // ✅ SCALABILITY: Cleanup old messages to prevent memory bloat
  private static cleanupOldMessages(conversations: Conversations): void {
    const targetMessages = Math.floor(MAX_TOTAL_MESSAGES * 0.8); // Keep 80% of limit
    
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

  static getActiveConversation(): Conversation | null {
    const conversations = this.getConversations();
    const activeConversation = Object.values(conversations).find(conv => conv.isActive);
    return activeConversation || null;
  }

  static setActiveConversation(id: string): void {
    const conversations = this.getConversations();
    
    // Set all conversations to inactive
    Object.values(conversations).forEach(conv => {
      conv.isActive = false;
    });
    
    // Set the selected conversation as active
    if (conversations[id]) {
      conversations[id].isActive = true;
    }
    
    this.setConversations(conversations);
  }

  static clearAllConversations(): void {
    this.setConversations({});
  }
}
