import { Conversation, SubTab, GameTab, insightTabsConfig } from '../types';
import { aiService } from './aiService';
import { ConversationService } from './conversationService';

export interface GameTabCreationData {
  gameTitle: string;
  genre: string;
  conversationId: string;
  userId: string;
}

class GameTabService {
  /**
   * Create a new game-specific conversation tab
   */
  async createGameTab(data: GameTabCreationData): Promise<Conversation> {
    console.log('🎮 [GameTabService] Creating game tab:', data);

    // Generate initial sub-tabs based on genre
    const subTabs = this.generateInitialSubTabs(data.genre);
    
    // Create the conversation
    const conversation: Conversation = {
      id: data.conversationId,
      title: data.gameTitle,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: false,
      gameId: data.gameTitle.toLowerCase().replace(/\s+/g, '-'),
      gameTitle: data.gameTitle,
      genre: data.genre,
      subtabs: subTabs,
      subtabsOrder: subTabs.map(tab => tab.id),
      isActiveSession: false,
      activeObjective: '',
      gameProgress: 0
    };

    // Save to database
    await ConversationService.addConversation(conversation);

    // Generate initial AI insights for sub-tabs
    await this.generateInitialInsights(conversation);

    return conversation;
  }

  /**
   * Generate initial sub-tabs based on game genre
   */
  private generateInitialSubTabs(genre: string): SubTab[] {
    const config = insightTabsConfig[genre] || insightTabsConfig['Default'];
    
    return config.map(tabConfig => ({
      id: tabConfig.id,
      title: tabConfig.title,
      type: tabConfig.type,
      content: 'Loading...',
      isNew: true,
      status: 'loading' as const,
      instruction: tabConfig.instruction
    }));
  }

  /**
   * Generate initial AI insights for all sub-tabs
   */
  private async generateInitialInsights(conversation: Conversation): Promise<void> {
    console.log('🤖 [GameTabService] Generating initial insights for:', conversation.gameTitle);

    try {
      // Generate insights for each sub-tab
      const insights = await aiService.generateInitialInsights(
        conversation.gameTitle || 'Unknown Game',
        conversation.genre || 'Action RPG'
      );

      // Update sub-tabs with generated content
      const updatedSubTabs = conversation.subtabs?.map(subTab => {
        const content = insights[subTab.id] || `Welcome to ${subTab.title} for ${conversation.gameTitle}!`;
        return {
          ...subTab,
          content,
          isNew: false,
          status: 'loaded' as const
        };
      }) || [];

      // Update conversation with new sub-tab content
      const updatedConversation = {
        ...conversation,
        subtabs: updatedSubTabs,
        updatedAt: Date.now()
      };

      // Save updated conversation
      await ConversationService.updateConversation(conversation.id, updatedConversation);

    } catch (error) {
      console.error('Failed to generate initial insights:', error);
      
      // Set error state for sub-tabs
      const errorSubTabs = conversation.subtabs?.map(subTab => ({
        ...subTab,
        content: `Failed to load ${subTab.title} content. Please try again later.`,
        isNew: false,
        status: 'error' as const
      })) || [];

      const updatedConversation = {
        ...conversation,
        subtabs: errorSubTabs,
        updatedAt: Date.now()
      };

      await ConversationService.updateConversation(conversation.id, updatedConversation);
    }
  }

  /**
   * Update a specific sub-tab content
   */
  async updateSubTabContent(
    conversationId: string, 
    subTabId: string, 
    content: string
  ): Promise<void> {
    console.log('📝 [GameTabService] Updating sub-tab content:', { conversationId, subTabId });

    try {
      // Get current conversation
      const conversations = await ConversationService.getConversations();
      const conversation = conversations[conversationId];
      
      if (!conversation || !conversation.subtabs) {
        throw new Error('Conversation or sub-tabs not found');
      }

      // Update the specific sub-tab
      const updatedSubTabs = conversation.subtabs.map(tab => 
        tab.id === subTabId 
          ? { ...tab, content, isNew: false, status: 'loaded' as const }
          : tab
      );

      // Update conversation with new sub-tab content
      await ConversationService.updateConversation(conversationId, {
        subtabs: updatedSubTabs,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Failed to update sub-tab content:', error);
      throw error;
    }
  }

  /**
   * Get game tab by conversation ID
   */
  async getGameTab(conversationId: string): Promise<GameTab | null> {
    try {
      const conversations = await ConversationService.getConversations();
      const conversation = conversations[conversationId];
      
      if (!conversation || !conversation.gameTitle) {
        return null;
      }

      return {
        id: conversation.id,
        title: conversation.title,
        gameId: conversation.gameId || conversation.gameTitle.toLowerCase().replace(/\s+/g, '-'),
        gameTitle: conversation.gameTitle,
        genre: conversation.genre || 'Unknown',
        subtabs: conversation.subtabs || [],
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        isActiveSession: conversation.isActiveSession || false
      };
    } catch (error) {
      console.error('Failed to get game tab:', error);
      return null;
    }
  }

  /**
   * Check if a conversation is a game tab
   */
  isGameTab(conversation: Conversation): boolean {
    return conversation.id !== 'everything-else' && !!conversation.gameTitle;
  }

  /**
   * Generate a unique conversation ID for a game
   */
  generateGameConversationId(gameTitle: string): string {
    const sanitized = gameTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    return `game-${sanitized}-${Date.now()}`;
  }
}

export const gameTabService = new GameTabService();
