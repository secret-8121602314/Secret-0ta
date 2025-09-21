import { supabase } from './supabase';
import { authService } from './supabase';

// ========================================
// 🛡️ SECURE CONVERSATION SERVICE
// ========================================
// This fixes all conversation management issues with:
// - Proper conflict resolution
// - Input validation
// - Atomic operations
// - Performance optimization
// - Data integrity

export interface Conversation {
  id: string;
  title: string;
  messages: any[];
  insights: any[];
  context: Record<string, any>;
  game_id?: string;
  gameId?: string; // Legacy property
  is_pinned: boolean;
  isPinned?: boolean; // Legacy property
  version: number;
  checksum: string;
  last_modified: string;
  lastModified?: number; // Legacy property
  created_at: string;
  createdAt?: string; // Legacy property
  updated_at: string;
}

export interface Conversations {
  [key: string]: Conversation;
}

export interface ConversationResult {
  success: boolean;
  conversation?: Conversation;
  conversations?: Conversations;
  error?: string;
  conflict_resolved?: boolean;
  version?: number;
}

export interface ConversationService {
  saveConversation(
    conversationId: string,
    title: string,
    messages: any[],
    insights?: any[],
    context?: Record<string, any>,
    gameId?: string,
    isPinned?: boolean,
    forceOverwrite?: boolean
  ): Promise<ConversationResult>;
  
  loadConversations(): Promise<ConversationResult>;
  
  deleteConversation(conversationId: string): Promise<ConversationResult>;
  
  getConversation(conversationId: string): Promise<ConversationResult>;
  
  updateConversationTitle(conversationId: string, title: string): Promise<ConversationResult>;
  
  pinConversation(conversationId: string, isPinned: boolean): Promise<ConversationResult>;
}

class SecureConversationService implements ConversationService {
  private static instance: SecureConversationService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second
  private readonly MAX_MESSAGE_LENGTH = 10000;
  private readonly MAX_TITLE_LENGTH = 255;
  private readonly MAX_INSIGHTS_LENGTH = 1000;

  static getInstance(): SecureConversationService {
    if (!SecureConversationService.instance) {
      SecureConversationService.instance = new SecureConversationService();
    }
    return SecureConversationService.instance;
  }

  private validateInput(data: any, type: string, maxLength?: number): boolean {
    if (data === null || data === undefined) {
      return false;
    }

    switch (type) {
      case 'string':
        if (typeof data !== 'string') return false;
        if (maxLength && data.length > maxLength) return false;
        return data.length > 0;
      case 'array':
        if (!Array.isArray(data)) return false;
        if (maxLength && data.length > maxLength) return false;
        return true;
      case 'object':
        if (typeof data !== 'object' || data === null) return false;
        return true;
      case 'boolean':
        return typeof data === 'boolean';
      default:
        return true;
    }
  }

  private validateConversationData(
    conversationId: string,
    title: string,
    messages: any[],
    insights?: any[],
    context?: Record<string, any>
  ): void {
    if (!this.validateInput(conversationId, 'string', this.MAX_TITLE_LENGTH)) {
      throw new Error('Invalid conversation ID');
    }

    if (!this.validateInput(title, 'string', this.MAX_TITLE_LENGTH)) {
      throw new Error('Invalid conversation title');
    }

    if (!this.validateInput(messages, 'array', this.MAX_MESSAGE_LENGTH)) {
      throw new Error('Invalid messages array');
    }

    if (insights && !this.validateInput(insights, 'array', this.MAX_INSIGHTS_LENGTH)) {
      throw new Error('Invalid insights array');
    }

    if (context && !this.validateInput(context, 'object')) {
      throw new Error('Invalid context object');
    }
  }

  private generateChecksum(messages: any[], insights: any[], context: Record<string, any>): string {
    const data = JSON.stringify({ messages, insights, context });
    // Use Unicode-safe encoding instead of btoa to handle special characters
    try {
      return btoa(unescape(encodeURIComponent(data))).slice(0, 64);
    } catch (error) {
      // Fallback to simple hash if encoding fails
      return this.simpleHash(data).slice(0, 64);
    }
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    retries: number = this.MAX_RETRIES
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        this.log(`Retrying ${operationName}, ${retries} attempts left`);
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        return this.retryOperation(operation, operationName, retries - 1);
      }
      throw error;
    }
  }

  private getCacheKey(key: string): string {
    const authState = authService.getCurrentState();
    return `conv_${key}_${authState.user?.id || 'anonymous'}`;
  }

  private getCachedData<T>(key: string): T | null {
    const cacheKey = this.getCacheKey(key);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    
    this.cache.delete(cacheKey);
    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    const cacheKey = this.getCacheKey(key);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  private clearCache(): void {
    this.cache.clear();
  }

  async saveConversation(
    conversationId: string,
    title: string,
    messages: any[],
    insights: any[] = [],
    context: Record<string, any> = {},
    gameId?: string,
    isPinned: boolean = false,
    forceOverwrite: boolean = false
  ): Promise<ConversationResult> {
    try {
      // Validate input
      this.validateConversationData(conversationId, title, messages, insights, context);

      const authState = authService.getCurrentState();
      
      if (!authState.user) {
        throw new Error('User not authenticated');
      }

      // Check if developer mode
      if (localStorage.getItem('otakon_developer_mode') === 'true') {
        return this.saveConversationDeveloperMode(
          conversationId, title, messages, insights, context, gameId, isPinned
        );
      }

      // Generate checksum for conflict detection
      const checksum = this.generateChecksum(messages, insights, context);

      // Use Supabase RPC function for atomic operation
      const { data, error } = await this.retryOperation(
        async () => {
          const result = await supabase.rpc('save_conversation', {
            p_user_id: authState.user!.id,
            p_conversation_id: conversationId,
            p_title: title,
            p_messages: messages,
            p_insights: insights,
            p_context: context,
            p_game_id: gameId,
            p_is_pinned: isPinned,
            p_force_overwrite: forceOverwrite
          });
          return result;
        },
        'saveConversation'
      );

      if (error) {
        throw new Error(`Failed to save conversation: ${error.message}`);
      }

      // Clear cache
      this.clearCache();

      this.log('Conversation saved successfully', { conversationId, version: data.version });

      return {
        success: true,
        conversation: {
          id: conversationId,
          title,
          messages,
          insights,
          context,
          game_id: gameId,
          is_pinned: isPinned,
          version: data.version,
          checksum: data.checksum,
          last_modified: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        conflict_resolved: data.conflict_resolved,
        version: data.version
      };

    } catch (error) {
      this.error('Failed to save conversation', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async saveConversationDeveloperMode(
    conversationId: string,
    title: string,
    messages: any[],
    insights: any[],
    context: Record<string, any>,
    gameId?: string,
    isPinned: boolean = false
  ): Promise<ConversationResult> {
    try {
      // Get existing developer data
      const devData = localStorage.getItem('otakon_dev_data');
      const parsedData = devData ? JSON.parse(devData) : { conversations: {} };

      // Create conversation object
      const conversation: Conversation = {
        id: conversationId,
        title,
        messages,
        insights,
        context,
        game_id: gameId,
        is_pinned: isPinned,
        version: 1,
        checksum: this.generateChecksum(messages, insights, context),
        last_modified: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Update conversations
      parsedData.conversations[conversationId] = conversation;
      
      // Update active conversation if it's the first one
      if (!parsedData.activeConversation) {
        parsedData.activeConversation = conversationId;
      }

      // Update conversations order
      if (!parsedData.conversationsOrder.includes(conversationId)) {
        parsedData.conversationsOrder.unshift(conversationId);
      }

      // Save to localStorage
      localStorage.setItem('otakon_dev_data', JSON.stringify(parsedData));

      this.log('Conversation saved in developer mode', { conversationId });

      return {
        success: true,
        conversation
      };

    } catch (error) {
      this.error('Failed to save conversation in developer mode', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async loadConversations(): Promise<ConversationResult> {
    try {
      // Check cache first
      const cached = this.getCachedData<Conversations>('all');
      if (cached) {
        return {
          success: true,
          conversations: cached
        };
      }

      const authState = authService.getCurrentState();
      
      if (!authState.user) {
        throw new Error('User not authenticated');
      }

      // Check if developer mode
      if (localStorage.getItem('otakon_developer_mode') === 'true') {
        return this.loadConversationsDeveloperMode();
      }

      // Use Supabase RPC function
      const { data, error } = await this.retryOperation(
        async () => {
          const result = await supabase.rpc('load_conversations', {
            p_user_id: authState.user!.id
          });
          return result;
        },
        'loadConversations'
      );

      if (error) {
        throw new Error(`Failed to load conversations: ${error.message}`);
      }

      // Convert array to object
      const conversations: Conversations = {};
      if (data.conversations && Array.isArray(data.conversations)) {
        data.conversations.forEach((conv: any) => {
          conversations[conv.id] = conv;
        });
      }

      // Cache the result
      this.setCachedData('all', conversations);

      this.log('Conversations loaded successfully', { count: data.count });

      return {
        success: true,
        conversations
      };

    } catch (error) {
      this.error('Failed to load conversations', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async loadConversationsDeveloperMode(): Promise<ConversationResult> {
    try {
      const devData = localStorage.getItem('otakon_dev_data');
      const parsedData = devData ? JSON.parse(devData) : { conversations: {} };

      this.log('Conversations loaded from developer mode', { 
        count: Object.keys(parsedData.conversations).length 
      });

      return {
        success: true,
        conversations: parsedData.conversations
      };

    } catch (error) {
      this.error('Failed to load conversations from developer mode', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async deleteConversation(conversationId: string): Promise<ConversationResult> {
    try {
      if (!this.validateInput(conversationId, 'string', this.MAX_TITLE_LENGTH)) {
        throw new Error('Invalid conversation ID');
      }

      const authState = authService.getCurrentState();
      
      if (!authState.user) {
        throw new Error('User not authenticated');
      }

      // Check if developer mode
      if (localStorage.getItem('otakon_developer_mode') === 'true') {
        return this.deleteConversationDeveloperMode(conversationId);
      }

      // Delete from Supabase
      const { error } = await this.retryOperation(
        async () => {
          const result = await supabase
            .from('conversations')
            .update({ 
              deleted_at: new Date().toISOString()
            })
            .eq('id', conversationId)
            .eq('user_id', authState.user!.id);
          return result;
        },
        'deleteConversation'
      );

      if (error) {
        throw new Error(`Failed to delete conversation: ${error.message}`);
      }

      // Clear cache
      this.clearCache();

      this.log('Conversation deleted successfully', { conversationId });

      return {
        success: true
      };

    } catch (error) {
      this.error('Failed to delete conversation', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async deleteConversationDeveloperMode(conversationId: string): Promise<ConversationResult> {
    try {
      const devData = localStorage.getItem('otakon_dev_data');
      const parsedData = devData ? JSON.parse(devData) : { conversations: {}, conversationsOrder: [] };

      // Remove from conversations
      delete parsedData.conversations[conversationId];

      // Remove from order
      parsedData.conversationsOrder = parsedData.conversationsOrder.filter((id: string) => id !== conversationId);

      // Update active conversation if needed
      if (parsedData.activeConversation === conversationId) {
        parsedData.activeConversation = parsedData.conversationsOrder[0] || '';
      }

      // Save to localStorage
      localStorage.setItem('otakon_dev_data', JSON.stringify(parsedData));

      this.log('Conversation deleted in developer mode', { conversationId });

      return {
        success: true
      };

    } catch (error) {
      this.error('Failed to delete conversation in developer mode', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getConversation(conversationId: string): Promise<ConversationResult> {
    try {
      if (!this.validateInput(conversationId, 'string', this.MAX_TITLE_LENGTH)) {
        throw new Error('Invalid conversation ID');
      }

      // Check cache first
      const cached = this.getCachedData<Conversation>(conversationId);
      if (cached) {
        return {
          success: true,
          conversation: cached
        };
      }

      const authState = authService.getCurrentState();
      
      if (!authState.user) {
        throw new Error('User not authenticated');
      }

      // Check if developer mode
      if (localStorage.getItem('otakon_developer_mode') === 'true') {
        return this.getConversationDeveloperMode(conversationId);
      }

      // Get from Supabase
      const { data, error } = await this.retryOperation(
        async () => {
          const result = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .eq('user_id', authState.user!.id)
            .is('deleted_at', null)
            .single();
          return result;
        },
        'getConversation'
      );

      if (error) {
        throw new Error(`Failed to get conversation: ${error.message}`);
      }

      // Cache the result
      this.setCachedData(conversationId, data);

      this.log('Conversation retrieved successfully', { conversationId });

      return {
        success: true,
        conversation: data
      };

    } catch (error) {
      this.error('Failed to get conversation', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async getConversationDeveloperMode(conversationId: string): Promise<ConversationResult> {
    try {
      const devData = localStorage.getItem('otakon_dev_data');
      const parsedData = devData ? JSON.parse(devData) : { conversations: {} };

      const conversation = parsedData.conversations[conversationId];

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      this.log('Conversation retrieved from developer mode', { conversationId });

      return {
        success: true,
        conversation
      };

    } catch (error) {
      this.error('Failed to get conversation from developer mode', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async updateConversationTitle(conversationId: string, title: string): Promise<ConversationResult> {
    try {
      if (!this.validateInput(conversationId, 'string', this.MAX_TITLE_LENGTH)) {
        throw new Error('Invalid conversation ID');
      }

      if (!this.validateInput(title, 'string', this.MAX_TITLE_LENGTH)) {
        throw new Error('Invalid conversation title');
      }

      const authState = authService.getCurrentState();
      
      if (!authState.user) {
        throw new Error('User not authenticated');
      }

      // Check if developer mode
      if (localStorage.getItem('otakon_developer_mode') === 'true') {
        return this.updateConversationTitleDeveloperMode(conversationId, title);
      }

      // Update in Supabase
      const { data, error } = await this.retryOperation(
        async () => {
          const result = await supabase
            .from('conversations')
            .update({ 
              title,
              updated_at: new Date().toISOString()
            })
            .eq('id', conversationId)
            .eq('user_id', authState.user!.id)
            .is('deleted_at', null)
            .select()
            .single();
          return result;
        },
        'updateConversationTitle'
      );

      if (error) {
        throw new Error(`Failed to update conversation title: ${error.message}`);
      }

      // Clear cache
      this.clearCache();

      this.log('Conversation title updated successfully', { conversationId, title });

      return {
        success: true,
        conversation: data
      };

    } catch (error) {
      this.error('Failed to update conversation title', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async updateConversationTitleDeveloperMode(conversationId: string, title: string): Promise<ConversationResult> {
    try {
      const devData = localStorage.getItem('otakon_dev_data');
      const parsedData = devData ? JSON.parse(devData) : { conversations: {} };

      if (!parsedData.conversations[conversationId]) {
        throw new Error('Conversation not found');
      }

      // Update title
      parsedData.conversations[conversationId].title = title;
      parsedData.conversations[conversationId].updated_at = new Date().toISOString();

      // Save to localStorage
      localStorage.setItem('otakon_dev_data', JSON.stringify(parsedData));

      this.log('Conversation title updated in developer mode', { conversationId, title });

      return {
        success: true,
        conversation: parsedData.conversations[conversationId]
      };

    } catch (error) {
      this.error('Failed to update conversation title in developer mode', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async pinConversation(conversationId: string, isPinned: boolean): Promise<ConversationResult> {
    try {
      if (!this.validateInput(conversationId, 'string', this.MAX_TITLE_LENGTH)) {
        throw new Error('Invalid conversation ID');
      }

      if (!this.validateInput(isPinned, 'boolean')) {
        throw new Error('Invalid pin status');
      }

      const authState = authService.getCurrentState();
      
      if (!authState.user) {
        throw new Error('User not authenticated');
      }

      // Check if developer mode
      if (localStorage.getItem('otakon_developer_mode') === 'true') {
        return this.pinConversationDeveloperMode(conversationId, isPinned);
      }

      // Update in Supabase
      const { data, error } = await this.retryOperation(
        async () => {
          const result = await supabase
            .from('conversations')
            .update({ 
              is_pinned: isPinned,
              updated_at: new Date().toISOString()
            })
            .eq('id', conversationId)
            .eq('user_id', authState.user!.id)
            .is('deleted_at', null)
            .select()
            .single();
          return result;
        },
        'pinConversation'
      );

      if (error) {
        throw new Error(`Failed to pin conversation: ${error.message}`);
      }

      // Clear cache
      this.clearCache();

      this.log('Conversation pin status updated successfully', { conversationId, isPinned });

      return {
        success: true,
        conversation: data
      };

    } catch (error) {
      this.error('Failed to pin conversation', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async pinConversationDeveloperMode(conversationId: string, isPinned: boolean): Promise<ConversationResult> {
    try {
      const devData = localStorage.getItem('otakon_dev_data');
      const parsedData = devData ? JSON.parse(devData) : { conversations: {} };

      if (!parsedData.conversations[conversationId]) {
        throw new Error('Conversation not found');
      }

      // Update pin status
      parsedData.conversations[conversationId].is_pinned = isPinned;
      parsedData.conversations[conversationId].updated_at = new Date().toISOString();

      // Save to localStorage
      localStorage.setItem('otakon_dev_data', JSON.stringify(parsedData));

      this.log('Conversation pin status updated in developer mode', { conversationId, isPinned });

      return {
        success: true,
        conversation: parsedData.conversations[conversationId]
      };

    } catch (error) {
      this.error('Failed to pin conversation in developer mode', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private log(message: string, data?: any): void {
    if (import.meta.env.DEV) {
      console.log(`🛡️ [ConversationService] ${message}`, data || '');
    }
  }

  private error(message: string, error?: any): void {
    console.error(`🛡️ [ConversationService] ${message}`, error || '');
  }
}

export const secureConversationService = SecureConversationService.getInstance();
