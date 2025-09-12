/**
 * Context Summarization Service
 * 
 * Purpose: Manage context size and provide summarization for old messages
 * Features: Context compression, summarization, smart context selection
 * Integration: Works with existing context management systems
 */

import { ChatMessage } from './types';

export interface ContextSummary {
  id: string;
  timestamp: number;
  summary: string;
  messageCount: number;
  keyTopics: string[];
  gameEvents: string[];
}

export interface ContextCompressionResult {
  compressedMessages: ChatMessage[];
  summary: ContextSummary | null;
  originalCount: number;
  compressedCount: number;
  compressionRatio: number;
}

class ContextSummarizationService {
  private static instance: ContextSummarizationService;
  private summaries: Map<string, ContextSummary[]> = new Map();

  private constructor() {
    console.log('📊 ContextSummarizationService: Initialized');
  }

  static getInstance(): ContextSummarizationService {
    if (!ContextSummarizationService.instance) {
      ContextSummarizationService.instance = new ContextSummarizationService();
    }
    return ContextSummarizationService.instance;
  }

  /**
   * Compress conversation history by keeping recent messages and summarizing old ones
   */
  compressConversationHistory(
    conversationId: string,
    messages: ChatMessage[],
    maxRecentMessages: number = 15,
    maxSummaryAge: number = 7 * 24 * 60 * 60 * 1000 // 7 days
  ): ContextCompressionResult {
    if (messages.length <= maxRecentMessages) {
      return {
        compressedMessages: messages,
        summary: null,
        originalCount: messages.length,
        compressedCount: messages.length,
        compressionRatio: 1.0
      };
    }

    const now = Date.now();
    const cutoffTime = now - maxSummaryAge;
    
    // Split messages into recent and old
    const recentMessages = messages.slice(-maxRecentMessages);
    const oldMessages = messages.slice(0, -maxRecentMessages);
    
    // Filter old messages that are within summary age
    const messagesToSummarize = oldMessages.filter(msg => 
      true // For now, include all old messages for summarization
    );

    if (messagesToSummarize.length === 0) {
      return {
        compressedMessages: recentMessages,
        summary: null,
        originalCount: messages.length,
        compressedCount: recentMessages.length,
        compressionRatio: recentMessages.length / messages.length
      };
    }

    // Create summary of old messages
    const summary = this.createMessageSummary(conversationId, messagesToSummarize);
    
    // Store summary
    this.storeSummary(conversationId, summary);

    console.log(`📊 Context Compression: ${messages.length} → ${recentMessages.length} messages + 1 summary (${Math.round((1 - recentMessages.length / messages.length) * 100)}% compression)`);

    return {
      compressedMessages: recentMessages,
      summary,
      originalCount: messages.length,
      compressedCount: recentMessages.length + 1, // +1 for summary
      compressionRatio: (recentMessages.length + 1) / messages.length
    };
  }

  /**
   * Create a summary of old messages
   */
  private createMessageSummary(conversationId: string, messages: ChatMessage[]): ContextSummary {
    const keyTopics = this.extractKeyTopics(messages);
    const gameEvents = this.extractGameEvents(messages);
    const summary = this.generateSummaryText(messages, keyTopics, gameEvents);

    return {
      id: `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      summary,
      messageCount: messages.length,
      keyTopics,
      gameEvents
    };
  }

  /**
   * Extract key topics from messages
   */
  private extractKeyTopics(messages: ChatMessage[]): string[] {
    const topics = new Set<string>();
    
    messages.forEach(message => {
      if (message.text) {
        // Simple topic extraction - in production, consider using NLP
        const text = message.text.toLowerCase();
        
        // Game-related topics
        if (text.includes('boss') || text.includes('enemy')) topics.add('combat');
        if (text.includes('quest') || text.includes('mission')) topics.add('quests');
        if (text.includes('item') || text.includes('weapon')) topics.add('items');
        if (text.includes('level') || text.includes('area')) topics.add('exploration');
        if (text.includes('skill') || text.includes('ability')) topics.add('character_progression');
        if (text.includes('story') || text.includes('narrative')) topics.add('story');
        if (text.includes('secret') || text.includes('hidden')) topics.add('secrets');
        if (text.includes('tip') || text.includes('strategy')) topics.add('strategy');
      }
    });

    return Array.from(topics).slice(0, 5); // Limit to 5 topics
  }

  /**
   * Extract game events from messages
   */
  private extractGameEvents(messages: ChatMessage[]): string[] {
    const events = new Set<string>();
    
    messages.forEach(message => {
      if (message.text) {
        const text = message.text.toLowerCase();
        
        // Extract game events
        if (text.includes('defeated') || text.includes('beat')) events.add('boss_defeated');
        if (text.includes('completed') || text.includes('finished')) events.add('quest_completed');
        if (text.includes('found') || text.includes('discovered')) events.add('discovery');
        if (text.includes('unlocked') || text.includes('gained')) events.add('unlock');
        if (text.includes('leveled') || text.includes('upgraded')) events.add('progression');
      }
    });

    return Array.from(events).slice(0, 3); // Limit to 3 events
  }

  /**
   * Generate summary text from messages
   */
  private generateSummaryText(messages: ChatMessage[], keyTopics: string[], gameEvents: string[]): string {
    const userMessages = messages.filter(m => m.role === 'user').length;
    const aiMessages = messages.filter(m => m.role === 'model').length;
    
    let summary = `Previous session summary (${messages.length} messages: ${userMessages} user, ${aiMessages} AI): `;
    
    if (keyTopics.length > 0) {
      summary += `Discussed ${keyTopics.join(', ')}. `;
    }
    
    if (gameEvents.length > 0) {
      summary += `Key events: ${gameEvents.join(', ')}. `;
    }
    
    // Add a general summary
    summary += `User engaged in gameplay discussion and received AI assistance.`;
    
    return summary;
  }

  /**
   * Store summary for future reference
   */
  private storeSummary(conversationId: string, summary: ContextSummary): void {
    if (!this.summaries.has(conversationId)) {
      this.summaries.set(conversationId, []);
    }
    
    const conversationSummaries = this.summaries.get(conversationId)!;
    conversationSummaries.push(summary);
    
    // Keep only last 5 summaries per conversation
    if (conversationSummaries.length > 5) {
      conversationSummaries.shift();
    }
  }

  /**
   * Get summaries for a conversation
   */
  getSummaries(conversationId: string): ContextSummary[] {
    return this.summaries.get(conversationId) || [];
  }

  /**
   * Get context summary for AI injection
   */
  getContextSummaryForAI(conversationId: string): string {
    const summaries = this.getSummaries(conversationId);
    
    if (summaries.length === 0) {
      return '';
    }

    let contextString = `[META_CONTEXT_SUMMARIES: Previous session summaries to maintain continuity:\n`;
    
    summaries.forEach((summary, index) => {
      contextString += `${index + 1}. ${summary.summary}\n`;
    });
    
    contextString += `Use these summaries to maintain context and avoid repeating previous discussions.]\n`;
    
    return contextString;
  }

  /**
   * Clean up old summaries
   */
  cleanupOldSummaries(maxAge: number = 30 * 24 * 60 * 60 * 1000): void { // 30 days
    const now = Date.now();
    
    for (const [conversationId, summaries] of this.summaries.entries()) {
      const filteredSummaries = summaries.filter(summary => 
        now - summary.timestamp < maxAge
      );
      
      if (filteredSummaries.length === 0) {
        this.summaries.delete(conversationId);
      } else {
        this.summaries.set(conversationId, filteredSummaries);
      }
    }
  }

  /**
   * Get compression statistics
   */
  getCompressionStats(): { totalSummaries: number; conversationsWithSummaries: number } {
    let totalSummaries = 0;
    for (const summaries of this.summaries.values()) {
      totalSummaries += summaries.length;
    }
    
    return {
      totalSummaries,
      conversationsWithSummaries: this.summaries.size
    };
  }
}

export const contextSummarizationService = ContextSummarizationService.getInstance();
