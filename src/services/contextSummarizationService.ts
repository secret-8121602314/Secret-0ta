import { Conversation, ChatMessage } from '../types';
import { aiService } from './aiService';

interface SummarizationResult {
  summary: string;
  wordCount: number;
  messagesIncluded: number;
  originalWordCount: number;
}

/**
 * Context Summarization Service
 * Keeps conversation context manageable by summarizing message history to 300-word limit
 */
class ContextSummarizationService {
  private readonly MAX_WORDS = 300;
  private readonly RECENT_MESSAGE_COUNT = 8; // Keep last 8 messages unsummarized for context continuity

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Calculate total word count of messages
   */
  private getTotalWordCount(messages: ChatMessage[]): number {
    return messages.reduce((total, msg) => {
      const contentWords = this.countWords(msg.content);
      return total + contentWords;
    }, 0);
  }

  /**
   * Check if conversation needs summarization
   */
  shouldSummarize(conversation: Conversation): boolean {
    if (!conversation.messages || conversation.messages.length <= this.RECENT_MESSAGE_COUNT) {
      return false; // Too few messages to benefit from summarization
    }

    const totalWords = this.getTotalWordCount(conversation.messages);
    console.log(`📊 [ContextSummarization] Total words in conversation: ${totalWords}`);

    // Summarize if exceeding 3x the target (900 words) to keep context manageable
    return totalWords > this.MAX_WORDS * 3;
  }

  /**
   * Split messages into "to summarize" and "to keep"
   */
  private splitMessages(messages: ChatMessage[]): { toSummarize: ChatMessage[]; toKeep: ChatMessage[] } {
    if (messages.length <= this.RECENT_MESSAGE_COUNT) {
      return { toSummarize: [], toKeep: messages };
    }

    const splitIndex = messages.length - this.RECENT_MESSAGE_COUNT;
    return {
      toSummarize: messages.slice(0, splitIndex),
      toKeep: messages.slice(splitIndex)
    };
  }

  /**
   * Generate a concise summary of older messages
   */
  async summarizeMessages(
    messages: ChatMessage[], 
    gameTitle?: string,
    genre?: string
  ): Promise<SummarizationResult> {
    console.log(`📝 [ContextSummarization] Summarizing ${messages.length} messages`);

    const originalWordCount = this.getTotalWordCount(messages);

    // Build context for summarization
    const conversationText = messages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    const contextInfo = gameTitle && genre
      ? `This is a conversation about "${gameTitle}" (${genre}).`
      : 'This is a general conversation.';

    const summaryPrompt = `${contextInfo}

Please provide a concise summary of the following conversation history. Focus on:
- Key topics discussed
- Important decisions or choices made
- Game progress or story developments (if applicable)
- User preferences or interests mentioned

Keep the summary under ${this.MAX_WORDS} words while preserving essential context.

Conversation to summarize:
${conversationText}

Provide ONLY the summary, no additional commentary.`;

    try {
      // Create a temporary conversation for summarization
      const tempConversation: Conversation = {
        id: 'temp-summary',
        title: 'Summary Request',
        messages: [{ 
          id: 'summary-msg-' + Date.now(),
          role: 'user', 
          content: summaryPrompt, 
          timestamp: Date.now() 
        }],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isActive: false,
        isGameHub: false
      };

      // Get AI summary using getChatResponse
      // Create minimal user object for summarization
      const summaryUser = {
        id: 'system',
        email: 'system@otakon.ai',
        profileData: null
      } as any;

      const response = await aiService.getChatResponse(
        tempConversation,
        summaryUser,
        summaryPrompt,
        false, // Not active session
        false // No images
      );

      const summary = response.content.trim();
      const summaryWordCount = this.countWords(summary);

      console.log(`✅ [ContextSummarization] Summary generated: ${summaryWordCount} words (reduced from ${originalWordCount})`);

      return {
        summary,
        wordCount: summaryWordCount,
        messagesIncluded: messages.length,
        originalWordCount
      };

    } catch (error) {
      console.error('❌ [ContextSummarization] Failed to generate summary:', error);
      
      // Fallback: Create simple concatenated summary
      const fallbackSummary = messages
        .slice(0, 5) // Take first 5 messages
        .map(msg => msg.content.substring(0, 100)) // Truncate each
        .join(' ... ')
        .substring(0, this.MAX_WORDS * 6); // Rough word limit

      return {
        summary: `[Previous conversation context] ${fallbackSummary}`,
        wordCount: this.countWords(fallbackSummary),
        messagesIncluded: messages.length,
        originalWordCount
      };
    }
  }

  /**
   * Apply summarization to conversation
   * Returns updated conversation with summarized history
   */
  async applyContextSummarization(conversation: Conversation): Promise<Conversation> {
    if (!this.shouldSummarize(conversation)) {
      console.log('📊 [ContextSummarization] No summarization needed');
      return conversation;
    }

    console.log('🔄 [ContextSummarization] Applying context summarization...');

    const { toSummarize, toKeep } = this.splitMessages(conversation.messages);

    if (toSummarize.length === 0) {
      return conversation; // Nothing to summarize
    }

    // Generate summary of older messages
    const summaryResult = await this.summarizeMessages(
      toSummarize,
      conversation.gameTitle,
      conversation.genre
    );

    // Create summary message
    const summaryMessage: ChatMessage = {
      id: 'summary-' + Date.now(),
      role: 'system',
      content: summaryResult.summary,
      timestamp: toSummarize[toSummarize.length - 1].timestamp,
      metadata: {
        isSummary: true,
        messagesIncluded: summaryResult.messagesIncluded,
        originalWordCount: summaryResult.originalWordCount,
        summaryWordCount: summaryResult.wordCount
      }
    };

    // Build new message array: [summary] + [recent messages]
    const updatedMessages = [summaryMessage, ...toKeep];

    // Store text-only summary (max 500 words) for persistence
    const textOnlySummary = summaryResult.summary.replace(/!\[.*?\]\(data:image\/.*?\)/g, '');
    const words = textOnlySummary.split(/\s+/).filter(w => w.length > 0);
    const cappedSummary = words.length > 500 
      ? words.slice(0, 500).join(' ') + '...'
      : textOnlySummary;

    console.log(`✅ [ContextSummarization] Context optimized: ${conversation.messages.length} messages → ${updatedMessages.length} (${summaryResult.originalWordCount} words → ${summaryResult.wordCount} + recent)`);

    return {
      ...conversation,
      messages: updatedMessages,
      contextSummary: cappedSummary,  // Store persistent summary (500 word cap)
      lastSummarizedAt: Date.now(),   // Track when summarization occurred
      updatedAt: Date.now()
    };
  }

  /**
   * Get context-aware message history for AI
   * Ensures context stays under limit before sending to AI
   */
  async getOptimizedContext(conversation: Conversation): Promise<ChatMessage[]> {
    if (!this.shouldSummarize(conversation)) {
      return conversation.messages;
    }

    const optimizedConversation = await this.applyContextSummarization(conversation);
    return optimizedConversation.messages;
  }

  /**
   * Estimate if next message will trigger summarization
   */
  willTriggerSummarization(conversation: Conversation): boolean {
    const totalWords = this.getTotalWordCount(conversation.messages);
    // Will trigger if we're at 80% of the threshold
    return totalWords > (this.MAX_WORDS * 3 * 0.8);
  }
}

export const contextSummarizationService = new ContextSummarizationService();
