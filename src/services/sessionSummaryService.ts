import { Conversation, ChatMessage } from '../types';

export interface SessionSummary {
  mode: 'playing' | 'planning';
  gameTitle: string;
  conversationId: string;
  summary: string;
  keyPoints: string[];
  objectives: string[];
  timestamp: number;
  aiGenerated?: boolean; // Flag to indicate AI-powered summary
}

class SessionSummaryService {
  /**
   * Generate a summary of a playing session for planning mode
   * Uses intelligent extraction to provide meaningful summaries
   */
  async generatePlayingSessionSummary(conversation: Conversation): Promise<SessionSummary> {
    const recentMessages = conversation.messages.slice(-10); // Last 10 messages for context
    
    const keyPoints = this.extractKeyPointsIntelligent(recentMessages, 'playing');
    const objectives = this.extractObjectivesIntelligent(recentMessages, conversation);
    const progressContext = this.generateProgressContext(conversation);
    
    const summary = `**Playing Session Summary for ${conversation.gameTitle}**

${progressContext}

**Key Achievements This Session:**
${keyPoints.length > 0 ? keyPoints.map(point => `• ${point}`).join('\n') : '• Session progress recorded'}

**Current Objectives:**
${objectives.length > 0 ? objectives.map(obj => `• ${obj}`).join('\n') : '• Continue game progression'}

**Recent Activity:**
${this.extractRecentActivity(recentMessages, 3)}

---
*Switching to Planning Mode - Your progress has been saved.*`;

    return {
      mode: 'playing',
      gameTitle: conversation.gameTitle || 'Unknown Game',
      conversationId: conversation.id,
      summary,
      keyPoints,
      objectives,
      timestamp: Date.now(),
      aiGenerated: true
    };
  }

  /**
   * Generate a summary of a planning session for playing mode
   */
  async generatePlanningSessionSummary(conversation: Conversation): Promise<SessionSummary> {
    const recentMessages = conversation.messages.slice(-10);
    
    const keyPoints = this.extractKeyPointsIntelligent(recentMessages, 'planning');
    const objectives = this.extractObjectivesIntelligent(recentMessages, conversation);
    const strategicNotes = this.extractStrategicNotes(recentMessages);
    
    const summary = `**Planning Session Summary for ${conversation.gameTitle}**

**Strategies Discussed:**
${keyPoints.length > 0 ? keyPoints.map(point => `• ${point}`).join('\n') : '• No specific strategies noted'}

**Goals for Next Session:**
${objectives.length > 0 ? objectives.map(obj => `• ${obj}`).join('\n') : '• Continue exploration and progression'}

${strategicNotes ? `**Strategic Notes:**\n${strategicNotes}\n` : ''}
---
*Switching to Playing Mode - Good luck with your session!*`;

    return {
      mode: 'planning',
      gameTitle: conversation.gameTitle || 'Unknown Game',
      conversationId: conversation.id,
      summary,
      keyPoints,
      objectives,
      timestamp: Date.now(),
      aiGenerated: true
    };
  }

  /**
   * Generate progress context string
   */
  private generateProgressContext(conversation: Conversation): string {
    const parts: string[] = [];
    
    if (conversation.gameProgress && conversation.gameProgress > 0) {
      parts.push(`**Progress:** ${conversation.gameProgress}%`);
    }
    
    if (conversation.activeObjective) {
      parts.push(`**Current Focus:** ${conversation.activeObjective}`);
    }
    
    return parts.length > 0 ? parts.join('\n') : '**Progress:** Session in progress';
  }

  /**
   * Extract key points intelligently based on session mode
   */
  private extractKeyPointsIntelligent(messages: ChatMessage[], mode: 'playing' | 'planning'): string[] {
    const keyPoints: string[] = [];
    const seenTopics = new Set<string>();
    
    // Patterns for playing mode (achievements, discoveries)
    const playingPatterns = [
      { pattern: /defeated|killed|beat|vanquished/i, template: (msg: string) => this.extractContext(msg, 'boss/enemy') },
      { pattern: /found|discovered|obtained|acquired|picked up/i, template: (msg: string) => this.extractContext(msg, 'item/discovery') },
      { pattern: /unlocked|gained|learned|mastered/i, template: (msg: string) => this.extractContext(msg, 'ability/unlock') },
      { pattern: /completed|finished|cleared/i, template: (msg: string) => this.extractContext(msg, 'completion') },
      { pattern: /reached|arrived|entered/i, template: (msg: string) => this.extractContext(msg, 'location') }
    ];
    
    // Patterns for planning mode (strategies, builds)
    const planningPatterns = [
      { pattern: /build|spec|loadout|equipment/i, template: (msg: string) => this.extractContext(msg, 'build') },
      { pattern: /strategy|approach|tactic/i, template: (msg: string) => this.extractContext(msg, 'strategy') },
      { pattern: /should|recommend|best|optimal/i, template: (msg: string) => this.extractContext(msg, 'recommendation') },
      { pattern: /prepare|before|need to/i, template: (msg: string) => this.extractContext(msg, 'preparation') }
    ];
    
    const patterns = mode === 'playing' ? playingPatterns : planningPatterns;
    
    for (const msg of messages) {
      if (msg.role !== 'assistant') continue;
      
      for (const { pattern, template } of patterns) {
        if (pattern.test(msg.content)) {
          const point = template(msg.content);
          const topicKey = point.toLowerCase().substring(0, 30);
          
          if (point && !seenTopics.has(topicKey)) {
            seenTopics.add(topicKey);
            keyPoints.push(point);
            
            if (keyPoints.length >= 5) break; // Limit to 5 key points
          }
        }
      }
      
      if (keyPoints.length >= 5) break;
    }
    
    return keyPoints;
  }

  /**
   * Extract context around a matched pattern
   */
  private extractContext(content: string, type: string): string {
    // Extract a meaningful sentence or phrase
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      // Skip very long sentences
      if (trimmed.length > 150) continue;
      
      // Check if it's relevant based on type
      if (type === 'boss/enemy' && /defeat|kill|beat|boss|enemy/i.test(trimmed)) {
        return trimmed.substring(0, 100) + (trimmed.length > 100 ? '...' : '');
      }
      if (type === 'item/discovery' && /found|discover|obtain|item|weapon|armor/i.test(trimmed)) {
        return trimmed.substring(0, 100) + (trimmed.length > 100 ? '...' : '');
      }
      if (type === 'ability/unlock' && /unlock|gain|learn|ability|skill/i.test(trimmed)) {
        return trimmed.substring(0, 100) + (trimmed.length > 100 ? '...' : '');
      }
      if (type === 'completion' && /complete|finish|clear/i.test(trimmed)) {
        return trimmed.substring(0, 100) + (trimmed.length > 100 ? '...' : '');
      }
      if (type === 'location' && /reach|arrive|enter|area|region|zone/i.test(trimmed)) {
        return trimmed.substring(0, 100) + (trimmed.length > 100 ? '...' : '');
      }
      if (type === 'build' && /build|spec|loadout|equipment/i.test(trimmed)) {
        return trimmed.substring(0, 100) + (trimmed.length > 100 ? '...' : '');
      }
      if (type === 'strategy' && /strategy|approach|tactic/i.test(trimmed)) {
        return trimmed.substring(0, 100) + (trimmed.length > 100 ? '...' : '');
      }
      if (type === 'recommendation' && /should|recommend|best|optimal/i.test(trimmed)) {
        return trimmed.substring(0, 100) + (trimmed.length > 100 ? '...' : '');
      }
      if (type === 'preparation' && /prepare|before|need/i.test(trimmed)) {
        return trimmed.substring(0, 100) + (trimmed.length > 100 ? '...' : '');
      }
    }
    
    return '';
  }

  /**
   * Extract objectives intelligently
   */
  private extractObjectivesIntelligent(messages: ChatMessage[], conversation: Conversation): string[] {
    const objectives: string[] = [];
    
    // Add current active objective if set
    if (conversation.activeObjective) {
      objectives.push(conversation.activeObjective);
    }
    
    // Look for objective-related content in recent messages
    for (const msg of messages) {
      if (msg.role !== 'assistant') continue;
      
      const objectivePatterns = [
        /next.*(?:step|objective|goal).*[:is]\s*([^.!?\n]+)/i,
        /you (?:should|need to|must)\s+([^.!?\n]+)/i,
        /(?:focus on|head to|go to)\s+([^.!?\n]+)/i
      ];
      
      for (const pattern of objectivePatterns) {
        const match = msg.content.match(pattern);
        if (match && match[1]) {
          const objective = match[1].trim().substring(0, 80);
          if (objective && !objectives.includes(objective)) {
            objectives.push(objective);
            if (objectives.length >= 3) break;
          }
        }
      }
      
      if (objectives.length >= 3) break;
    }
    
    return objectives;
  }

  /**
   * Extract strategic notes from planning session
   */
  private extractStrategicNotes(messages: ChatMessage[]): string {
    const notes: string[] = [];
    
    for (const msg of messages) {
      if (msg.role !== 'assistant') continue;
      
      // Look for bullet points or numbered lists
      const listMatches = msg.content.match(/[•\-\*]\s+[^\n]+/g);
      if (listMatches) {
        for (const item of listMatches.slice(0, 3)) {
          notes.push(item.trim());
        }
      }
      
      if (notes.length >= 3) break;
    }
    
    return notes.join('\n');
  }

  /**
   * Extract recent activity summary
   */
  private extractRecentActivity(messages: ChatMessage[], count: number): string {
    const recentAssistant = messages
      .filter(m => m.role === 'assistant')
      .slice(-count);
    
    if (recentAssistant.length === 0) {
      return '• No recent activity recorded';
    }
    
    return recentAssistant
      .map(msg => {
        // Extract first meaningful sentence
        const firstSentence = msg.content.split(/[.!?]+/)[0]?.trim() || '';
        const cleaned = firstSentence
          .replace(/\*\*/g, '')
          .replace(/Hint:\s*/i, '')
          .substring(0, 80);
        return cleaned ? `• ${cleaned}...` : null;
      })
      .filter(Boolean)
      .join('\n');
  }

  /**
   * Store session summary in conversation
   */
  async storeSessionSummary(_conversationId: string, _summary: SessionSummary): Promise<void> {
    // Store in conversation metadata or cache
    // This would integrate with your existing conversation service
  }

  /**
   * Get the most recent session summary
   */
  async getLatestSessionSummary(_conversationId: string): Promise<SessionSummary | null> {
    // Retrieve from conversation metadata or cache
    // This would integrate with your existing conversation service
    return null;
  }
}

export const sessionSummaryService = new SessionSummaryService();
