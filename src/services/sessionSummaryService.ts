import { Conversation, ChatMessage } from '../types';

export interface SessionSummary {
  mode: 'playing' | 'planning';
  gameTitle: string;
  conversationId: string;
  summary: string;
  keyPoints: string[];
  objectives: string[];
  timestamp: number;
}

class SessionSummaryService {
  /**
   * Generate a summary of a playing session for planning mode
   */
  async generatePlayingSessionSummary(conversation: Conversation): Promise<SessionSummary> {
    const playingMessages = conversation.messages.filter(msg => 
      msg.role === 'assistant' && msg.content.includes('Hint:')
    );

    const keyPoints = this.extractKeyPoints(playingMessages);
    const objectives = this.extractObjectives(playingMessages);
    
    const summary = `Playing session summary for ${conversation.gameTitle}:
    
Key Achievements:
${keyPoints.map(point => `• ${point}`).join('\n')}

Current Objectives:
${objectives.map(obj => `• ${obj}`).join('\n')}

Recent Progress:
${playingMessages.slice(-3).map(msg => `- ${msg.content.substring(0, 100)}...`).join('\n')}`;

    return {
      mode: 'playing',
      gameTitle: conversation.gameTitle || 'Unknown Game',
      conversationId: conversation.id,
      summary,
      keyPoints,
      objectives,
      timestamp: Date.now()
    };
  }

  /**
   * Generate a summary of a planning session for playing mode
   */
  async generatePlanningSessionSummary(conversation: Conversation): Promise<SessionSummary> {
    const planningMessages = conversation.messages.filter(msg => 
      msg.role === 'assistant' && !msg.content.includes('Hint:')
    );

    const keyPoints = this.extractKeyPoints(planningMessages);
    const objectives = this.extractObjectives(planningMessages);
    
    const summary = `Planning session summary for ${conversation.gameTitle}:
    
Planned Strategies:
${keyPoints.map(point => `• ${point}`).join('\n')}

Goals to Achieve:
${objectives.map(obj => `• ${obj}`).join('\n')}

Strategic Notes:
${planningMessages.slice(-3).map(msg => `- ${msg.content.substring(0, 100)}...`).join('\n')}`;

    return {
      mode: 'planning',
      gameTitle: conversation.gameTitle || 'Unknown Game',
      conversationId: conversation.id,
      summary,
      keyPoints,
      objectives,
      timestamp: Date.now()
    };
  }

  /**
   * Extract key points from messages
   */
  private extractKeyPoints(messages: ChatMessage[]): string[] {
    const keyPoints: string[] = [];
    
    messages.forEach(msg => {
      // Look for specific patterns that indicate achievements or important info
      if (msg.content.includes('defeated') || msg.content.includes('completed')) {
        keyPoints.push('Achievement unlocked or objective completed');
      }
      if (msg.content.includes('found') || msg.content.includes('discovered')) {
        keyPoints.push('New item or location discovered');
      }
      if (msg.content.includes('unlocked') || msg.content.includes('gained')) {
        keyPoints.push('New ability or feature unlocked');
      }
    });

    return keyPoints.length > 0 ? keyPoints : ['Session progress recorded'];
  }

  /**
   * Extract objectives from messages
   */
  private extractObjectives(messages: ChatMessage[]): string[] {
    const objectives: string[] = [];
    
    messages.forEach(msg => {
      // Look for objective-related content
      if (msg.content.includes('objective') || msg.content.includes('goal')) {
        objectives.push('Continue current objective');
      }
      if (msg.content.includes('next') || msg.content.includes('should')) {
        objectives.push('Follow recommended next steps');
      }
      if (msg.content.includes('explore') || msg.content.includes('investigate')) {
        objectives.push('Explore new areas or investigate leads');
      }
    });

    return objectives.length > 0 ? objectives : ['Continue game progression'];
  }

  /**
   * Store session summary in conversation
   */
  async storeSessionSummary(conversationId: string, summary: SessionSummary): Promise<void> {
    // Store in conversation metadata or cache
    // This would integrate with your existing conversation service
    console.log('Storing session summary for conversation:', conversationId, summary);
  }

  /**
   * Get the most recent session summary
   */
  async getLatestSessionSummary(conversationId: string): Promise<SessionSummary | null> {
    // Retrieve from conversation metadata or cache
    // This would integrate with your existing conversation service
    console.log('Getting latest session summary for conversation:', conversationId);
    return null;
  }
}

export const sessionSummaryService = new SessionSummaryService();
