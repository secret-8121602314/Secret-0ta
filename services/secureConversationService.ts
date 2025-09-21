import { supabase } from './supabase';
import { authService } from './supabase';

// ========================================
// 🛡️ SECURE CONVERSATION SERVICE - FIXED VERSION
// ========================================
// This fixes ALL conversation management issues with:
// - Proper user ID mapping between auth.users and public.users
// - Complete conversation loading and saving
// - Profile setup completion handling
// - Chat memory persistence across logout/refresh
// - Proper conflict resolution and error handling

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

  private async getUserWithTimeout(timeoutMs: number = 10000): Promise<{ data: { user: any }; error: any }> {
    try {
      // Use a more robust timeout mechanism
      const authPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), timeoutMs)
      );
      
      return await Promise.race([authPromise, timeoutPromise]);
    } catch (error) {
      // If timeout occurs, return a proper error structure
      if (error instanceof Error && error.message === 'Auth timeout') {
        return { data: { user: null }, error };
      }
      throw error;
    }
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

  private log(message: string, data?: any): void {
    console.log(`[SecureConversationService] ${message}`, data || '');
  }

  private error(message: string, error: any): void {
    console.error(`[SecureConversationService] ${message}`, error);
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

      // Get current user directly from Supabase auth
      console.log('🔧 [SecureConversationService] Getting user from Supabase auth...');
      let { data: { user }, error: userError } = await this.getUserWithTimeout(5000);
      console.log('🔧 [SecureConversationService] Initial auth result:', { user: !!user, error: userError });
      
      if (userError || !user) {
        console.log('🔧 [SecureConversationService] User not found, retrying with delay...');
        // Add a longer delay to allow auth state to settle after OAuth callback
        await new Promise(resolve => setTimeout(resolve, 500));
        const { data: { user: retryUser }, error: retryError } = await this.getUserWithTimeout(5000);
        console.log('🔧 [SecureConversationService] Retry auth result:', { user: !!retryUser, error: retryError });
        if (retryError || !retryUser) {
          console.log('🔧 [SecureConversationService] User still not found, final retry...');
          // Try one more time with even longer delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: { user: finalUser }, error: finalError } = await this.getUserWithTimeout(5000);
          console.log('🔧 [SecureConversationService] Final auth result:', { user: !!finalUser, error: finalError });
          if (finalError || !finalUser) {
            throw new Error('User not authenticated');
          }
          // Use the final user
          user = finalUser;
        } else {
          // Use the retry user
          user = retryUser;
        }
      }
      console.log('🔧 [SecureConversationService] User authenticated successfully:', user.id);

      // Check if developer mode
      if (localStorage.getItem('otakon_developer_mode') === 'true') {
        return this.saveConversationDeveloperMode(
          conversationId, title, messages, insights, context, gameId, isPinned
        );
      }

      // Use Supabase RPC function with proper user ID mapping
      const { data, error } = await this.retryOperation(
        async () => {
          console.log('🔧 [SecureConversationService] Calling save_conversation with:', {
            p_user_id: user.id,
            p_conversation_id: conversationId,
            p_title: title,
            p_messages: messages,
            p_insights: insights,
            p_context: context,
            p_game_id: gameId || null,
            p_is_pinned: isPinned,
            p_force_overwrite: forceOverwrite,
            messageCount: messages.length
          });
          
                const result = await supabase.rpc('save_conversation', {
            p_user_id: user.id, // This is auth.users.id
            p_conversation_id: conversationId,
            p_title: title,
            p_messages: messages,
            p_insights: insights,
            p_context: context,
            p_game_id: gameId || null,
            p_is_pinned: isPinned,
            p_force_overwrite: forceOverwrite
          });
          
          console.log('🔧 [SecureConversationService] Supabase save_conversation result:', result);
          return result;
        },
        'saveConversation'
      );

      if (error) {
        throw new Error(`Failed to save conversation: ${error.message}`);
      }

      // Clear cache for this conversation
      this.cache.delete(this.getCacheKey(conversationId));
      this.cache.delete(this.getCacheKey('all'));

      this.log('Conversation saved successfully', { conversationId, messageCount: messages.length });

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
          version: 1,
          checksum: this.generateChecksum(messages, insights, context),
          last_modified: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
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
      // Save to localStorage for developer mode
      const conversation = {
        id: conversationId,
        title,
        messages,
        insights,
        context,
        gameId,
        isPinned,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Get existing data
      const existingData = localStorage.getItem('otakon_dev_data');
      const data = existingData ? JSON.parse(existingData) : { conversations: {}, conversationsOrder: [] };
      
      // Update conversation
      data.conversations[conversationId] = conversation;
      
      // Update order if new conversation
      if (!data.conversationsOrder.includes(conversationId)) {
        data.conversationsOrder.unshift(conversationId);
      }
      
      // Save back to localStorage
      localStorage.setItem('otakon_dev_data', JSON.stringify(data));

      this.log('Conversation saved in developer mode', { conversationId });

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
          version: 1,
          checksum: this.generateChecksum(messages, insights, context),
          last_modified: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
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

      // Get current user directly from Supabase auth
      console.log('🔧 [SecureConversationService] Getting user from Supabase auth...');
      let { data: { user }, error: userError } = await this.getUserWithTimeout(5000);
      console.log('🔧 [SecureConversationService] Initial auth result:', { user: !!user, error: userError });
      
      if (userError || !user) {
        console.log('🔧 [SecureConversationService] User not found, retrying with delay...');
        // Add a longer delay to allow auth state to settle after OAuth callback
        await new Promise(resolve => setTimeout(resolve, 500));
        const { data: { user: retryUser }, error: retryError } = await this.getUserWithTimeout(5000);
        console.log('🔧 [SecureConversationService] Retry auth result:', { user: !!retryUser, error: retryError });
        if (retryError || !retryUser) {
          console.log('🔧 [SecureConversationService] User still not found, final retry...');
          // Try one more time with even longer delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: { user: finalUser }, error: finalError } = await this.getUserWithTimeout(5000);
          console.log('🔧 [SecureConversationService] Final auth result:', { user: !!finalUser, error: finalError });
          if (finalError || !finalUser) {
            throw new Error('User not authenticated');
          }
          // Use the final user
          user = finalUser;
        } else {
          // Use the retry user
          user = retryUser;
        }
      }
      console.log('🔧 [SecureConversationService] User authenticated successfully:', user.id);

      // Check if developer mode
      if (localStorage.getItem('otakon_developer_mode') === 'true') {
        return this.loadConversationsDeveloperMode();
      }

      // Use Supabase RPC function with proper user ID mapping
      console.log('🔧 [SecureConversationService] Calling load_conversations RPC with user ID:', user.id);
      const { data, error } = await this.retryOperation(
        async () => {
          const result = await supabase.rpc('load_conversations', {
            p_user_id: user.id // This is auth.users.id
          });
          console.log('🔧 [SecureConversationService] RPC result:', result);
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
        console.log('🔧 [SecureConversationService] Raw conversation data from Supabase:', data.conversations);
        
        data.conversations.forEach((conv: any) => {
          console.log('🔧 [SecureConversationService] Processing conversation:', {
            id: conv.id,
            title: conv.title,
            messages: conv.messages,
            messagesType: typeof conv.messages,
            messagesLength: Array.isArray(conv.messages) ? conv.messages.length : 'not array'
          });
          
          // Ensure messages is properly parsed as an array
          let messages = conv.messages || [];
          if (typeof messages === 'string') {
            try {
              messages = JSON.parse(messages);
            } catch (e) {
              console.warn('Failed to parse messages string:', e);
              messages = [];
            }
          }
          
          conversations[conv.id] = {
            id: conv.id,
            title: conv.title,
            messages: messages,
            insights: conv.insights || {},
            context: conv.context || {},
            game_id: conv.game_id,
            is_pinned: conv.is_pinned || false,
            version: 1,
            checksum: '',
            last_modified: conv.updated_at || conv.created_at,
            created_at: conv.created_at,
            updated_at: conv.updated_at
          };
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
      const data = localStorage.getItem('otakon_dev_data');
      if (!data) {
        return {
          success: true,
          conversations: {}
        };
      }

      const parsedData = JSON.parse(data);
      const conversations: Conversations = {};

      if (parsedData.conversations) {
        Object.entries(parsedData.conversations).forEach(([id, conv]: [string, any]) => {
          conversations[id] = {
            id: conv.id,
            title: conv.title,
            messages: conv.messages || [],
            insights: conv.insights || [],
            context: conv.context || {},
            game_id: conv.gameId,
            is_pinned: conv.isPinned || false,
            version: 1,
            checksum: '',
            last_modified: conv.updatedAt || conv.createdAt,
            created_at: conv.createdAt,
            updated_at: conv.updatedAt
          };
        });
      }

      this.log('Conversations loaded from developer mode', { count: Object.keys(conversations).length });

      return {
        success: true,
        conversations
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
      // Get current user directly from Supabase auth
      console.log('🔧 [SecureConversationService] Getting user from Supabase auth...');
      let { data: { user }, error: userError } = await this.getUserWithTimeout(5000);
      console.log('🔧 [SecureConversationService] Initial auth result:', { user: !!user, error: userError });
      
      if (userError || !user) {
        console.log('🔧 [SecureConversationService] User not found, retrying with delay...');
        // Add a longer delay to allow auth state to settle after OAuth callback
        await new Promise(resolve => setTimeout(resolve, 500));
        const { data: { user: retryUser }, error: retryError } = await this.getUserWithTimeout(5000);
        console.log('🔧 [SecureConversationService] Retry auth result:', { user: !!retryUser, error: retryError });
        if (retryError || !retryUser) {
          console.log('🔧 [SecureConversationService] User still not found, final retry...');
          // Try one more time with even longer delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: { user: finalUser }, error: finalError } = await this.getUserWithTimeout(5000);
          console.log('🔧 [SecureConversationService] Final auth result:', { user: !!finalUser, error: finalError });
          if (finalError || !finalUser) {
            throw new Error('User not authenticated');
          }
          // Use the final user
          user = finalUser;
        } else {
          // Use the retry user
          user = retryUser;
        }
      }
      console.log('🔧 [SecureConversationService] User authenticated successfully:', user.id);

      // Check if developer mode
      if (localStorage.getItem('otakon_developer_mode') === 'true') {
        return this.deleteConversationDeveloperMode(conversationId);
      }

      // Use direct Supabase query with proper user ID mapping
      const { error } = await supabase
        .from('conversations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', conversationId)
        .eq('user_id', user.id); // This will be mapped by RLS

      if (error) {
        throw new Error(`Failed to delete conversation: ${error.message}`);
      }

      // Clear cache
      this.cache.delete(this.getCacheKey(conversationId));
      this.cache.delete(this.getCacheKey('all'));

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
      const data = localStorage.getItem('otakon_dev_data');
      if (!data) {
        return { success: true };
      }

      const parsedData = JSON.parse(data);
      
      if (parsedData.conversations && parsedData.conversations[conversationId]) {
        delete parsedData.conversations[conversationId];
        parsedData.conversationsOrder = parsedData.conversationsOrder.filter((id: string) => id !== conversationId);
        
        localStorage.setItem('otakon_dev_data', JSON.stringify(parsedData));
      }

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
      // Check cache first
      const cached = this.getCachedData<Conversation>(conversationId);
      if (cached) {
        return {
          success: true,
          conversation: cached
        };
      }

      // Get current user directly from Supabase auth
      console.log('🔧 [SecureConversationService] Getting user from Supabase auth...');
      let { data: { user }, error: userError } = await this.getUserWithTimeout(5000);
      console.log('🔧 [SecureConversationService] Initial auth result:', { user: !!user, error: userError });
      
      if (userError || !user) {
        console.log('🔧 [SecureConversationService] User not found, retrying with delay...');
        // Add a longer delay to allow auth state to settle after OAuth callback
        await new Promise(resolve => setTimeout(resolve, 500));
        const { data: { user: retryUser }, error: retryError } = await this.getUserWithTimeout(5000);
        console.log('🔧 [SecureConversationService] Retry auth result:', { user: !!retryUser, error: retryError });
        if (retryError || !retryUser) {
          console.log('🔧 [SecureConversationService] User still not found, final retry...');
          // Try one more time with even longer delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: { user: finalUser }, error: finalError } = await this.getUserWithTimeout(5000);
          console.log('🔧 [SecureConversationService] Final auth result:', { user: !!finalUser, error: finalError });
          if (finalError || !finalUser) {
            throw new Error('User not authenticated');
          }
          // Use the final user
          user = finalUser;
        } else {
          // Use the retry user
          user = retryUser;
        }
      }
      console.log('🔧 [SecureConversationService] User authenticated successfully:', user.id);

      // Check if developer mode
      if (localStorage.getItem('otakon_developer_mode') === 'true') {
        return this.getConversationDeveloperMode(conversationId);
      }

      // Use direct Supabase query with proper user ID mapping
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id) // This will be mapped by RLS
        .is('deleted_at', null)
        .single();

      if (error) {
        throw new Error(`Failed to get conversation: ${error.message}`);
      }

      const conversation: Conversation = {
        id: data.id,
        title: data.title,
        messages: data.messages || [],
        insights: data.insights || [],
        context: data.context || {},
        game_id: data.game_id,
        is_pinned: data.is_pinned || false,
        version: data.version || 1,
        checksum: data.checksum || '',
        last_modified: data.last_modified || data.updated_at,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      // Cache the result
      this.setCachedData(conversationId, conversation);

      this.log('Conversation retrieved successfully', { conversationId });

      return {
        success: true,
        conversation
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
      const data = localStorage.getItem('otakon_dev_data');
      if (!data) {
        return {
          success: false,
          error: 'Conversation not found'
        };
      }

      const parsedData = JSON.parse(data);
      const conv = parsedData.conversations?.[conversationId];

      if (!conv) {
        return {
          success: false,
          error: 'Conversation not found'
        };
      }

      const conversation: Conversation = {
        id: conv.id,
        title: conv.title,
        messages: conv.messages || [],
        insights: conv.insights || [],
        context: conv.context || {},
        game_id: conv.gameId,
        is_pinned: conv.isPinned || false,
        version: 1,
        checksum: '',
        last_modified: conv.updatedAt || conv.createdAt,
        created_at: conv.createdAt,
        updated_at: conv.updatedAt
      };

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
      if (!this.validateInput(title, 'string', this.MAX_TITLE_LENGTH)) {
        throw new Error('Invalid title');
      }

      // Get current user directly from Supabase auth
      console.log('🔧 [SecureConversationService] Getting user from Supabase auth...');
      let { data: { user }, error: userError } = await this.getUserWithTimeout(5000);
      console.log('🔧 [SecureConversationService] Initial auth result:', { user: !!user, error: userError });
      
      if (userError || !user) {
        console.log('🔧 [SecureConversationService] User not found, retrying with delay...');
        // Add a longer delay to allow auth state to settle after OAuth callback
        await new Promise(resolve => setTimeout(resolve, 500));
        const { data: { user: retryUser }, error: retryError } = await this.getUserWithTimeout(5000);
        console.log('🔧 [SecureConversationService] Retry auth result:', { user: !!retryUser, error: retryError });
        if (retryError || !retryUser) {
          console.log('🔧 [SecureConversationService] User still not found, final retry...');
          // Try one more time with even longer delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: { user: finalUser }, error: finalError } = await this.getUserWithTimeout(5000);
          console.log('🔧 [SecureConversationService] Final auth result:', { user: !!finalUser, error: finalError });
          if (finalError || !finalUser) {
            throw new Error('User not authenticated');
          }
          // Use the final user
          user = finalUser;
        } else {
          // Use the retry user
          user = retryUser;
        }
      }
      console.log('🔧 [SecureConversationService] User authenticated successfully:', user.id);

      // Check if developer mode
      if (localStorage.getItem('otakon_developer_mode') === 'true') {
        return this.updateConversationTitleDeveloperMode(conversationId, title);
      }

      // Use direct Supabase query with proper user ID mapping
      const { error } = await supabase
        .from('conversations')
        .update({ 
          title,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .eq('user_id', user.id); // This will be mapped by RLS

      if (error) {
        throw new Error(`Failed to update conversation title: ${error.message}`);
      }

      // Clear cache
      this.cache.delete(this.getCacheKey(conversationId));
      this.cache.delete(this.getCacheKey('all'));

      this.log('Conversation title updated successfully', { conversationId, title });

      return {
        success: true
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
      const data = localStorage.getItem('otakon_dev_data');
      if (!data) {
        return {
          success: false,
          error: 'Conversation not found'
        };
      }

      const parsedData = JSON.parse(data);
      
      if (parsedData.conversations && parsedData.conversations[conversationId]) {
        parsedData.conversations[conversationId].title = title;
        parsedData.conversations[conversationId].updatedAt = new Date().toISOString();
        
        localStorage.setItem('otakon_dev_data', JSON.stringify(parsedData));
      }

      this.log('Conversation title updated in developer mode', { conversationId, title });

      return {
        success: true
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
      // Get current user directly from Supabase auth
      console.log('🔧 [SecureConversationService] Getting user from Supabase auth...');
      let { data: { user }, error: userError } = await this.getUserWithTimeout(5000);
      console.log('🔧 [SecureConversationService] Initial auth result:', { user: !!user, error: userError });
      
      if (userError || !user) {
        console.log('🔧 [SecureConversationService] User not found, retrying with delay...');
        // Add a longer delay to allow auth state to settle after OAuth callback
        await new Promise(resolve => setTimeout(resolve, 500));
        const { data: { user: retryUser }, error: retryError } = await this.getUserWithTimeout(5000);
        console.log('🔧 [SecureConversationService] Retry auth result:', { user: !!retryUser, error: retryError });
        if (retryError || !retryUser) {
          console.log('🔧 [SecureConversationService] User still not found, final retry...');
          // Try one more time with even longer delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: { user: finalUser }, error: finalError } = await this.getUserWithTimeout(5000);
          console.log('🔧 [SecureConversationService] Final auth result:', { user: !!finalUser, error: finalError });
          if (finalError || !finalUser) {
            throw new Error('User not authenticated');
          }
          // Use the final user
          user = finalUser;
        } else {
          // Use the retry user
          user = retryUser;
        }
      }
      console.log('🔧 [SecureConversationService] User authenticated successfully:', user.id);

      // Check if developer mode
      if (localStorage.getItem('otakon_developer_mode') === 'true') {
        return this.pinConversationDeveloperMode(conversationId, isPinned);
      }

      // Use direct Supabase query with proper user ID mapping
      const { error } = await supabase
        .from('conversations')
        .update({ 
          is_pinned: isPinned,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .eq('user_id', user.id); // This will be mapped by RLS

      if (error) {
        throw new Error(`Failed to pin conversation: ${error.message}`);
      }

      // Clear cache
      this.cache.delete(this.getCacheKey(conversationId));
      this.cache.delete(this.getCacheKey('all'));

      this.log('Conversation pin status updated successfully', { conversationId, isPinned });

      return {
        success: true
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
      const data = localStorage.getItem('otakon_dev_data');
      if (!data) {
        return {
          success: false,
          error: 'Conversation not found'
        };
      }

      const parsedData = JSON.parse(data);
      
      if (parsedData.conversations && parsedData.conversations[conversationId]) {
        parsedData.conversations[conversationId].isPinned = isPinned;
        parsedData.conversations[conversationId].updatedAt = new Date().toISOString();
        
        localStorage.setItem('otakon_dev_data', JSON.stringify(parsedData));
      }

      this.log('Conversation pin status updated in developer mode', { conversationId, isPinned });

      return {
        success: true
      };
    } catch (error) {
      this.error('Failed to pin conversation in developer mode', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const secureConversationService = SecureConversationService.getInstance();