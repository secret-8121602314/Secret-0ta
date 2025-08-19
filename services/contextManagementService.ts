import { ConversationContext, ChatMessage } from './types';

class ContextManagementService {
  private static instance: ContextManagementService;
  private conversationContexts: Map<string, ConversationContext> = new Map();
  
  static getInstance(): ContextManagementService {
    if (!ContextManagementService.instance) {
      ContextManagementService.instance = new ContextManagementService();
    }
    return ContextManagementService.instance;
  }

  // Initialize or update conversation context
  initializeConversationContext(
    conversationId: string,
    gameId: string | null = null
  ): ConversationContext {
    
    const existing = this.conversationContexts.get(conversationId);
    const now = Date.now();
    
    if (existing) {
      // Update existing context
      existing.lastInteraction = now;
      existing.messageHistory = existing.messageHistory.slice(-10); // Keep last 10 messages
      return existing;
    }
    
    // Create new context
    const newContext: ConversationContext = {
      conversationId,
      gameId,
      lastInteraction: now,
      sessionStart: now,
      messageHistory: [],
      userIntent: 'new_query',
      contextTags: {}
    };
    
    this.conversationContexts.set(conversationId, newContext);
    return newContext;
  }

  // Analyze user intent based on message and context
  analyzeUserIntent(
    conversationId: string,
    message: string,
    previousMessages: ChatMessage[]
  ): 'new_query' | 'clarification' | 'follow_up' | 'game_switch' {
    
    const context = this.conversationContexts.get(conversationId);
    if (!context) return 'new_query';

    // Check for game switching
    const gameSwitchIndicators = [
      'switch to', 'play', 'start', 'begin', 'new game',
      'let\'s play', 'i want to play', 'can we play',
      'change to', 'move to', 'go to game'
    ];
    
    const isGameSwitch = gameSwitchIndicators.some(indicator => 
      message.toLowerCase().includes(indicator)
    );
    
    if (isGameSwitch) {
      context.userIntent = 'game_switch';
      return 'game_switch';
    }

    // Check for follow-up questions
    const followUpIndicators = [
      'what about', 'how do i', 'can you explain', 'tell me more',
      'what next', 'and then', 'also', 'additionally', 'more details',
      'expand on', 'elaborate', 'go deeper', 'continue',
      'what else', 'anything else', 'other options'
    ];
    
    const isFollowUp = followUpIndicators.some(indicator => 
      message.toLowerCase().includes(indicator)
    );
    
    if (isFollowUp) {
      context.userIntent = 'follow_up';
      return 'follow_up';
    }

    // Check for clarification requests
    const clarificationIndicators = [
      'i don\'t understand', 'can you clarify', 'what do you mean',
      'i\'m confused', 'explain better', 'not clear', 'unclear',
      'what does that mean', 'i don\'t get it', 'huh?',
      'i\'m lost', 'help me understand', 'break it down'
    ];
    
    const isClarification = clarificationIndicators.some(indicator => 
      message.toLowerCase().includes(indicator)
    );
    
    if (isClarification) {
      context.userIntent = 'clarification';
      return 'clarification';
    }

    // Default to new query
    context.userIntent = 'new_query';
    return 'new_query';
  }

  // Add message to conversation history
  addMessageToHistory(conversationId: string, message: string): void {
    const context = this.conversationContexts.get(conversationId);
    if (context) {
      context.messageHistory.push(message);
      context.messageHistory = context.messageHistory.slice(-10); // Keep last 10
      context.lastInteraction = Date.now();
    }
  }

  // Get conversation context for AI injection
  getContextForAI(conversationId: string): string {
    const context = this.conversationContexts.get(conversationId);
    if (!context) return '';

    const sessionDuration = Math.floor((Date.now() - context.sessionStart) / 60000);
    const timeSinceLastInteraction = Math.floor((Date.now() - context.lastInteraction) / 60000);

    let contextString = '';
    
    // Session context
    contextString += `[META_SESSION_DURATION: ${sessionDuration} minutes]\n`;
    contextString += `[META_TIME_SINCE_LAST_INTERACTION: ${timeSinceLastInteraction} minutes]\n`;
    
    // Intent context
    contextString += `[META_USER_INTENT: ${context.userIntent}]\n`;
    
    // Message history context (last 3 messages)
    if (context.messageHistory.length > 0) {
      const recentMessages = context.messageHistory.slice(-3);
      contextString += `[META_RECENT_MESSAGE_HISTORY: ${recentMessages.join(' | ')}]\n`;
    }
    
    // Game context
    if (context.gameId) {
      contextString += `[META_CURRENT_GAME_ID: ${context.gameId}]\n`;
    }
    
    return contextString;
  }

  // Detect session continuation
  isSessionContinuation(conversationId: string): boolean {
    const context = this.conversationContexts.get(conversationId);
    if (!context) return false;
    
    // If more than 30 minutes have passed, consider it a new session
    const timeSinceLastInteraction = Date.now() - context.lastInteraction;
    return timeSinceLastInteraction < 30 * 60 * 1000; // 30 minutes
  }

  // Get session summary
  getSessionSummary(conversationId: string): string {
    const context = this.conversationContexts.get(conversationId);
    if (!context) return '';
    
    const sessionDuration = Math.floor((Date.now() - context.sessionStart) / 60000);
    const messageCount = context.messageHistory.length;
    
    return `Session Duration: ${sessionDuration} minutes | Messages: ${messageCount} | Intent: ${context.userIntent}`;
  }

  // Update game ID for a conversation
  updateGameId(conversationId: string, gameId: string | null): void {
    const context = this.conversationContexts.get(conversationId);
    if (context) {
      context.gameId = gameId;
    }
  }

  // Get all active conversation contexts
  getActiveConversations(): ConversationContext[] {
    return Array.from(this.conversationContexts.values());
  }

  // Clean up old contexts (older than 24 hours)
  cleanupOldContexts(): void {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    for (const [conversationId, context] of this.conversationContexts.entries()) {
      if (now - context.lastInteraction > oneDay) {
        this.conversationContexts.delete(conversationId);
      }
    }
  }
}

export const contextManagementService = ContextManagementService.getInstance();
