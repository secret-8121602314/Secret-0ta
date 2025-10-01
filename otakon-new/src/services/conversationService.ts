import { StorageService } from './storageService';
import { Conversations, Conversation, ChatMessage } from '../types';
import { STORAGE_KEYS, DEFAULT_CONVERSATION_TITLE } from '../constants';

export class ConversationService {
  static getConversations(): Conversations {
    return StorageService.get(STORAGE_KEYS.CONVERSATIONS, {});
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
      conversations[conversationId].messages.push(message);
      conversations[conversationId].updatedAt = Date.now();
      this.setConversations(conversations);
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
