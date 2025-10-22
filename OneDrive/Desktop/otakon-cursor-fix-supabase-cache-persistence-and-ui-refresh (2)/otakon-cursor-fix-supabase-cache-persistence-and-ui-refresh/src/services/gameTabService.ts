import { Conversation, SubTab, GameTab, insightTabsConfig, AIResponse, PlayerProfile } from '../types';
import { aiService } from './aiService';
import { ConversationService } from './conversationService';
import { profileAwareTabService, GameContext, ProfileSpecificTab } from './profileAwareTabService';
import { toastService } from './toastService';

export interface GameTabCreationData {
  gameTitle: string;
  genre: string;
  conversationId: string;
  userId: string;
  aiResponse?: AIResponse; // Optional AI response to extract insights from
  playerProfile?: PlayerProfile; // Optional player profile for personalization
  gameContext?: GameContext; // Optional game context (playthrough count, etc.)
  isUnreleased?: boolean; // True for unreleased/upcoming games
}

class GameTabService {
  /**
   * Create a new game-specific conversation tab
   */
  async createGameTab(data: GameTabCreationData): Promise<Conversation> {
    console.log('🎮 [GameTabService] Creating game tab:', data);

    // For unreleased games, don't generate subtabs
    let subTabs: SubTab[] = [];
    
    if (!data.isUnreleased) {
      // Generate initial sub-tabs based on genre and profile for released games
      subTabs = this.generateInitialSubTabs(
        data.genre, 
        data.playerProfile,
        data.gameContext
      );
      
      // If AI response provided, extract insights from it
      if (data.aiResponse) {
        console.log('🎮 [GameTabService] Using AI response for initial insights');
        subTabs = this.extractInsightsFromAIResponse(data.aiResponse, subTabs);
      }
    } else {
      console.log('🎮 [GameTabService] Creating unreleased game tab (no subtabs, Discuss mode only)');
    }
    
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
      gameProgress: 0,
      isUnreleased: data.isUnreleased || false // Mark if unreleased
    };

    // Save to database
    await ConversationService.addConversation(conversation);

    // Generate AI insights in background (non-blocking)
    // Only generate if we didn't already get them from the response
    if (!data.aiResponse) {
      console.log('🎮 [GameTabService] Generating initial insights in background (no AI response provided)');
      this.generateInitialInsights(conversation, data.playerProfile).catch(error => 
        console.error('Background insight generation failed:', error)
      );
    } else {
      // If some subtabs still have "Loading..." content, generate insights for them in background
      const needsInsights = conversation.subtabs?.some(tab => tab.content === 'Loading...');
      if (needsInsights) {
        console.log('🎮 [GameTabService] Some subtabs need insights, generating in background');
        this.generateInitialInsights(conversation, data.playerProfile).catch(error => 
          console.error('Background insight generation failed:', error)
        );
      }
    }

    // Return immediately without waiting for insights
    return conversation;
  }

  /**
   * Generate initial sub-tabs based on game genre and player profile
   */
  private generateInitialSubTabs(
    genre: string,
    playerProfile?: PlayerProfile,
    gameContext?: GameContext
  ): SubTab[] {
    // Get base genre tabs
    const config = insightTabsConfig[genre] || insightTabsConfig['Default'];
    let baseTabs: ProfileSpecificTab[] = config.map(tabConfig => ({
      ...tabConfig,
      priority: 'medium' as const,
      isProfileSpecific: false
    }));
    
    // If player profile exists, add profile-specific tabs
    if (playerProfile) {
      console.log('🎮 [GameTabService] Generating profile-specific tabs for:', playerProfile.playerFocus);
      const profileTabs = profileAwareTabService.generateProfileSpecificTabs(
        playerProfile,
        gameContext
      );
      
      // Merge base tabs with profile-specific tabs
      baseTabs = [...baseTabs, ...profileTabs];
      
      // Prioritize tabs based on profile
      baseTabs = profileAwareTabService.prioritizeTabsForProfile(baseTabs, playerProfile);
    }
    
    // Convert to SubTab format
    return baseTabs.map(tabConfig => ({
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
   * Extract subtab insights from AI response tags
   */
  private extractInsightsFromAIResponse(aiResponse: AIResponse, subtabs: SubTab[]): SubTab[] {
    console.log('🤖 [GameTabService] Extracting insights from AI response');
    
    // Check if AI provided INSIGHT_UPDATE tags
    const insightUpdates = aiResponse.otakonTags.get('INSIGHT_UPDATE');
    
    if (insightUpdates) {
      console.log('🤖 [GameTabService] Found INSIGHT_UPDATE:', insightUpdates);
      
      // Update the matching subtab
      return subtabs.map(tab => {
        if (tab.id === insightUpdates.id) {
          return {
            ...tab,
            content: insightUpdates.content,
            isNew: false,
            status: 'loaded' as const
          };
        }
        return tab;
      });
    }
    
    // Fallback: Use the AI response content as initial content for the first subtab (chat/tips)
    if (aiResponse.content && subtabs.length > 0) {
      console.log('🤖 [GameTabService] Using AI response content for first subtab');
      const updatedSubtabs = [...subtabs];
      updatedSubtabs[0] = {
        ...updatedSubtabs[0],
        content: aiResponse.content,
        isNew: false,
        status: 'loaded' as const
      };
      return updatedSubtabs;
    }
    
    return subtabs;
  }

  /**
   * Generate initial AI insights for all sub-tabs
   * This runs in the background and updates the conversation when complete
   */
  private async generateInitialInsights(
    conversation: Conversation,
    playerProfile?: PlayerProfile
  ): Promise<void> {
    console.log('🤖 [GameTabService] 🔄 Generating initial insights in background for:', conversation.gameTitle);

    try {
      // Generate insights for each sub-tab (this is the slow AI call)
      const insights = await aiService.generateInitialInsights(
        conversation.gameTitle || 'Unknown Game',
        conversation.genre || 'Action RPG',
        playerProfile
      );

      console.log('🤖 [GameTabService] ✅ Background insights generated successfully');

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

      // Save updated conversation (this will trigger UI update)
      await ConversationService.updateConversation(conversation.id, updatedConversation);
      console.log('🤖 [GameTabService] ✅ Subtabs updated in conversation');

    } catch (error) {
      console.error('🤖 [GameTabService] ❌ Failed to generate initial insights:', error);
      toastService.warning('Failed to load game insights. You can still chat about the game!');
      
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
      toastService.error('Failed to load game tab.');
      return null;
    }
  }

  /**
   * Check if a conversation is a game tab
   */
  isGameTab(conversation: Conversation): boolean {
    return !conversation.isGameHub && !!conversation.gameTitle;
  }

  /**
   * Generate a unique conversation ID for a game
   * Note: Removed timestamp to ensure consistent IDs for the same game
   */
  generateGameConversationId(gameTitle: string): string {
    const sanitized = gameTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    return `game-${sanitized}`;
  }

  /**
   * Update subtabs from AI response (progressive updates)
   * This allows AI to update existing subtabs based on new information
   */
  async updateSubTabsFromAIResponse(
    conversationId: string,
    updates: Array<{ tabId: string; title: string; content: string }>
  ): Promise<void> {
    console.log('📝 [GameTabService] Updating subtabs from AI response:', { conversationId, updateCount: updates.length });

    try {
      // Get current conversation
      const conversations = await ConversationService.getConversations();
      const conversation = conversations[conversationId];
      
      if (!conversation || !conversation.subtabs) {
        console.warn('📝 [GameTabService] Conversation or subtabs not found:', conversationId);
        return;
      }

      // Update the specific subtabs
      let updatedCount = 0;
      const updatedSubTabs = conversation.subtabs.map(tab => {
        const update = updates.find(u => u.tabId === tab.id);
        if (update) {
          updatedCount++;
          console.log('📝 [GameTabService] Updating subtab:', { tabId: tab.id, title: update.title });
          return {
            ...tab,
            title: update.title || tab.title, // Update title if provided
            content: update.content,
            isNew: true, // Mark as new to show indicator
            status: 'loaded' as const
          };
        }
        return tab;
      });

      // Only update if something changed
      if (updatedCount === 0) {
        console.log('📝 [GameTabService] No subtabs matched for update');
        return;
      }

      // Update conversation with new subtab content
      await ConversationService.updateConversation(conversationId, {
        subtabs: updatedSubTabs,
        updatedAt: Date.now()
      });

      console.log('📝 [GameTabService] Successfully updated', updatedCount, 'subtabs');
    } catch (error) {
      console.error('📝 [GameTabService] Failed to update subtabs from AI response:', error);
      throw error;
    }
  }
}

export const gameTabService = new GameTabService();
