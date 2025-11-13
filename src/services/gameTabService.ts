import { Conversation, SubTab, GameTab, insightTabsConfig, AIResponse, PlayerProfile } from '../types';
import { aiService } from './aiService';
import { ConversationService } from './conversationService';
import { profileAwareTabService, GameContext, ProfileSpecificTab } from './profileAwareTabService';
import { toastService } from './toastService';
import { subtabsService } from './subtabsService';

// ✅ UUID generator utility
function generateUUID(): string {
  return globalThis.crypto?.randomUUID() || 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

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
   * Create a new game-specific conversation tab (IDEMPOTENT)
   * If tab already exists, returns it and optionally updates subtabs with new AI insights
   */
  async createGameTab(data: GameTabCreationData): Promise<Conversation> {
    console.log('🎮 [GameTabService] Creating game tab:', data);

    // ✅ IDEMPOTENT: Check if tab already exists
    const existingConv = await ConversationService.getConversation(data.conversationId);
    
    if (existingConv) {
      console.log('🎮 [GameTabService] Tab already exists:', existingConv.title);
      
      // ✅ Update subtabs if they're loading and we have new AI response
      if (data.aiResponse && existingConv.subtabs?.some(tab => tab.status === 'loading' || tab.content === 'Loading...')) {
        console.log('🎮 [GameTabService] Updating loading subtabs with new AI insights');
        const updatedSubtabs = this.extractInsightsFromAIResponse(
          data.aiResponse, 
          existingConv.subtabs
        );
        
        await ConversationService.updateConversation(existingConv.id, {
          subtabs: updatedSubtabs,
          updatedAt: Date.now()
        });
        
        return { ...existingConv, subtabs: updatedSubtabs };
      }
      
      // Return existing tab as-is
      return existingConv;
    }

    // Tab doesn't exist - create new one
    console.log('🎮 [GameTabService] Creating new tab for:', data.gameTitle);
    
    // For unreleased games, don't generate subtabs
    let subTabs: SubTab[] = [];
    
    if (!data.isUnreleased) {
      if (data.aiResponse) {
        console.error('🎮 [GameTabService] Extracting subtabs from AI response');
        
        // ✅ PRIORITY 1: Check if AI provided pre-filled subtab content (gamePillData.wikiContent)
        if (data.aiResponse.gamePillData?.wikiContent && Object.keys(data.aiResponse.gamePillData.wikiContent).length > 0) {
          console.error('🎮 [GameTabService] Found gamePillData.wikiContent with', Object.keys(data.aiResponse.gamePillData.wikiContent).length, 'tabs');
          
          // Convert wikiContent to SubTab array with proper UUIDs
          subTabs = Object.entries(data.aiResponse.gamePillData.wikiContent).map(([tabId, content]) => ({
            id: generateUUID(), // ✅ Generate proper UUID instead of using string tabId
            title: this.formatTabTitle(tabId),
            type: this.determineTabType(tabId),
            content: content,
            isNew: false,
            status: 'loaded' as const
          }));
          console.error('🎮 [GameTabService] Created', subTabs.length, 'subtabs from gamePillData.wikiContent');
        }
        // ✅ PRIORITY 2: Check for progressiveInsightUpdates
        else if (data.aiResponse.progressiveInsightUpdates && data.aiResponse.progressiveInsightUpdates.length > 0) {
          console.error('🎮 [GameTabService] Found progressiveInsightUpdates with', data.aiResponse.progressiveInsightUpdates.length, 'updates');
          
          subTabs = data.aiResponse.progressiveInsightUpdates.map(update => ({
            id: generateUUID(), // ✅ Generate proper UUID
            title: update.title,
            type: this.determineTabType(update.tabId),
            content: update.content,
            isNew: false,
            status: 'loaded' as const
          }));
          console.error('🎮 [GameTabService] Created', subTabs.length, 'subtabs from progressiveInsightUpdates');
        }
        // ✅ PRIORITY 3: Try to extract INSIGHT_UPDATE tags from AI content
        else {
          const extractedSubtabs = this.extractInsightsFromAIResponse(data.aiResponse, []);
          
          if (extractedSubtabs.length > 0) {
            subTabs = extractedSubtabs;
            console.error('🎮 [GameTabService] Created', subTabs.length, 'subtabs from INSIGHT_UPDATE tags');
          } else {
            // ✅ FALLBACK: Create template subtabs and populate them via background AI call
            subTabs = this.generateInitialSubTabs(data.genre || 'Default', data.playerProfile);
            console.error('🎮 [GameTabService] Created', subTabs.length, 'template subtabs (will populate via background AI using conversation context)');
          }
        }
      } else {
        // No AI response - create template subtabs
        subTabs = this.generateInitialSubTabs(data.genre || 'Default', data.playerProfile);
        console.error('🎮 [GameTabService] Created', subTabs.length, 'initial template subtabs (no AI response)');
      }
    } else {
      console.error('🎮 [GameTabService] Creating unreleased game tab (no subtabs, Discuss mode only)');
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

    // Save subtabs using the subtabsService (handles both JSONB and normalized approaches)
    if (subTabs.length > 0) {
      console.error('🎮 [GameTabService] Saving', subTabs.length, 'subtabs for conversation:', conversation.id);
      console.error('🎮 [GameTabService] Subtabs:', JSON.stringify(subTabs, null, 2));
      await subtabsService.setSubtabs(conversation.id, subTabs);
    } else {
      console.error('🎮 [GameTabService] No subtabs to save for conversation:', conversation.id);
    }

    // Generate AI insights in background (non-blocking)
    // Only generate if we didn't already get them from the response
    if (!data.aiResponse) {
      this.generateInitialInsights(conversation, data.playerProfile, data.aiResponse).catch(error => 
        console.error('Background insight generation failed:', error)
      );
    } else {
      // If some subtabs still have "Loading..." content, generate insights for them in background
      const needsInsights = conversation.subtabs?.some(tab => tab.content === 'Loading...');
      if (needsInsights) {
        // ✅ CRITICAL: Pass aiResponse so the AI has context from the screenshot
        this.generateInitialInsights(conversation, data.playerProfile, data.aiResponse).catch(error => 
          console.error('Background insight generation failed:', error)
        );
      }
    }

    // Return immediately without waiting for insights
    return conversation;
  }

  /**
   * Generate initial sub-tabs based on game genre and player profile
   * Note: Currently unused - tab generation now handled via Edge Function
   */
  // @ts-ignore - Kept for future reference
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
      console.error('🎮 [GameTabService] Generating profile-specific tabs for:', playerProfile.playerFocus);
      const profileTabs = profileAwareTabService.generateProfileSpecificTabs(
        playerProfile,
        gameContext
      );
      
      // Merge base tabs with profile-specific tabs
      baseTabs = [...baseTabs, ...profileTabs];
      
      // Prioritize tabs based on profile
      baseTabs = profileAwareTabService.prioritizeTabsForProfile(baseTabs, playerProfile);
    }
    
    // Convert to SubTab format with proper UUIDs
    return baseTabs.map(tabConfig => ({
      id: generateUUID(), // ✅ Generate proper UUID
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
   * ✅ NEW: Creates subtabs dynamically based on actual AI insights, not templates
   */
  private extractInsightsFromAIResponse(aiResponse: AIResponse, existingSubtabs: SubTab[]): SubTab[] {
    console.error('🤖 [GameTabService] Extracting dynamic insights from AI response');
    
    // Check if AI provided INSIGHT_UPDATE tags
    const insightUpdates = aiResponse.otakonTags.get('INSIGHT_UPDATE');
    
    if (insightUpdates) {
      console.error('🤖 [GameTabService] Found INSIGHT_UPDATE:', insightUpdates);
      
      // Check if subtab already exists
      const existingTab = existingSubtabs.find(tab => tab.id === insightUpdates.id);
      
      if (existingTab) {
        // Update existing subtab
        return existingSubtabs.map(tab => 
          tab.id === insightUpdates.id
            ? {
                ...tab,
                content: insightUpdates.content,
                isNew: true,
                status: 'loaded' as const
              }
            : tab
        );
      } else {
        // ✅ Create new subtab dynamically with proper UUID
        const newTab: SubTab = {
          id: generateUUID(), // ✅ Generate proper UUID
          title: this.formatTabTitle(insightUpdates.id),
          type: this.determineTabType(insightUpdates.id),
          content: insightUpdates.content,
          isNew: true,
          status: 'loaded' as const
        };
        return [...existingSubtabs, newTab];
      }
    }
    
    // No specific insight tags - return existing subtabs unchanged
    return existingSubtabs;
  }

  /**
   * Format subtab ID into readable title
   */
  private formatTabTitle(tabId: string): string {
    return tabId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Determine tab type based on ID
   */
  private determineTabType(tabId: string): 'chat' | 'walkthrough' | 'tips' | 'strategies' | 'story' | 'characters' | 'items' {
    if (tabId.includes('story')) {
      return 'story';
    }
    if (tabId.includes('character')) {
      return 'characters';
    }
    if (tabId.includes('strategy') || tabId.includes('tips')) {
      return 'tips';
    }
    if (tabId.includes('boss')) {
      return 'strategies';
    }
    if (tabId.includes('quest') || tabId.includes('walkthrough')) {
      return 'walkthrough';
    }
    if (tabId.includes('item')) {
      return 'items';
    }
    return 'chat';
  }

  /**
   * Generate initial AI insights for all sub-tabs
   * This runs in the background and updates the conversation when complete
   */
  private async generateInitialInsights(
    conversation: Conversation,
    playerProfile?: PlayerProfile,
    aiResponse?: AIResponse // ✅ NEW: AI response from screenshot analysis
  ): Promise<void> {
    const conversationId = conversation.id;
    const gameTitle = conversation.gameTitle;
    console.error(`🤖 [GameTabService] 🔄 [${conversationId}] Generating initial insights for: ${gameTitle}`);

    try {
      // ✅ SAFETY CHECK: Verify conversation still exists before starting expensive AI call
      const preCheckConversations = await ConversationService.getConversations(true);
      if (!preCheckConversations[conversationId]) {
        console.error(`🤖 [GameTabService] [${conversationId}] ⚠️ Conversation no longer exists, aborting insight generation`);
        return; // Early exit - user may have deleted tab or switched games
      }

      // ✅ CRITICAL: Use AI response content as context (not conversation.messages which is empty at creation time!)
      // Priority 1: Use AI response content (from screenshot analysis)
      // Priority 2: Use conversation messages (if migrated already)
      let conversationContext = '';
      
      if (aiResponse?.content) {
        conversationContext = `AI Analysis: ${aiResponse.content}`;
        console.error(`🤖 [GameTabService] [${conversationId}] Using AI response as context (${aiResponse.content.length} chars)`);
      } else if (conversation.messages.length > 0) {
        conversationContext = conversation.messages
          .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
          .join('\n\n');
        console.error(`🤖 [GameTabService] [${conversationId}] Using messages as context (${conversation.messages.length} msgs)`);
      } else {
        console.error(`🤖 [GameTabService] [${conversationId}] ⚠️ No context available`);
      }
      
      console.error(`🤖 [GameTabService] [${conversationId}] 🚀 Calling AI generateInitialInsights...`);
      const insights = await aiService.generateInitialInsights(
        gameTitle || 'Unknown Game',
        conversation.genre || 'Action RPG',
        playerProfile,
        conversationContext
      );
      console.error(`🤖 [GameTabService] [${conversationId}] 📥 AI returned:`, Object.keys(insights).length, 'insights');

      // ✅ SAFETY CHECK: Verify conversation STILL exists after AI call
      const postAICheck = await ConversationService.getConversations(true);
      if (!postAICheck[conversationId]) {
        console.error(`🤖 [GameTabService] [${conversationId}] ⚠️ Conversation deleted during AI call, discarding results`);
        return;
      }

      // ✅ Check if insights were actually generated (not empty object from error fallback)
      const hasInsights = insights && Object.keys(insights).length > 0;
      if (!hasInsights) {
        console.error(`🤖 [GameTabService] [${conversationId}] ❌ Empty insights, using fallback`);
      } else {
        console.error(`🤖 [GameTabService] [${conversationId}] ✅ Got ${Object.keys(insights).length} insights:`, Object.keys(insights));
      }

      // ✅ CRITICAL FIX: Read fresh conversation data from DB before updating
      const conversations = await ConversationService.getConversations(true);
      const freshConversation = conversations[conversationId];
      
      if (!freshConversation) {
        console.error(`🤖 [GameTabService] [${conversationId}] ⚠️ Conversation not found, may have been deleted`);
        return;
      }

      // 🔥 MAP insight keys to subtab IDs
      // AI returns keys like "story_so_far" but subtabs have UUID ids
      // We need to map based on subtab type
      const typeToKeyMap: Record<string, string> = {
        'story': 'story_so_far',
        'walkthrough': 'quest_log',
        'strategies': 'build_optimization', // First strategies tab
        'tips': 'hidden_paths'
      };
      
      console.error('🤖 [GameTabService] Building content mapping for subtabs...');
      
      // Update sub-tabs with generated content OR meaningful fallback
      const updatedSubTabs = freshConversation.subtabs?.map(subTab => {
        let content: string = '';
        
        // Map subtab type to insight key
        const insightKey = typeToKeyMap[subTab.type];
        
        // For multiple tabs of same type, use alternate keys
        if (subTab.type === 'strategies' && subTab.title.includes('Boss')) {
          const bossKey = 'boss_strategy';
          if (hasInsights && insights[bossKey]) {
            content = insights[bossKey];
            console.error(`🤖 [GameTabService] Subtab "${subTab.title}" using AI content from key "${bossKey}" (${content.length} chars)`);
          }
        }
        
        if (!content && hasInsights && insightKey && insights[insightKey]) {
          // Use AI-generated content
          content = insights[insightKey];
          console.error(`🤖 [GameTabService] Subtab "${subTab.title}" using AI content from key "${insightKey}" (${content.length} chars)`);
        }
        
        if (!content) {
          // ✅ IMPROVED FALLBACK: Use the actual AI response from initial message
          // The AI already analyzed the screenshot - use that content!
          
          // Extract the relevant part from conversation context based on tab type
          let fallbackContent = conversationContext;
          
          // Try to extract specific sections if they exist in the AI response
          if (subTab.type === 'story' && conversationContext.includes('Lore:')) {
            const loreMatch = conversationContext.match(/Lore:(.*?)(?=\n\n|\n[A-Z]|$)/s);
            fallbackContent = loreMatch ? loreMatch[1].trim() : conversationContext;
          } else if (subTab.type === 'strategies' && conversationContext.includes('Analysis:')) {
            const analysisMatch = conversationContext.match(/Analysis:(.*?)(?=\n\n|\n[A-Z]|$)/s);
            fallbackContent = analysisMatch ? analysisMatch[1].trim() : conversationContext;
          } else if (subTab.type === 'tips' && conversationContext.includes('Hint:')) {
            const hintMatch = conversationContext.match(/Hint:(.*?)(?=\n\n|\n[A-Z]|$)/s);
            fallbackContent = hintMatch ? hintMatch[1].trim() : conversationContext;
          }
          
          content = `## ${subTab.title}\n\n${fallbackContent}`;
          
          console.error(`🤖 [GameTabService] Subtab "${subTab.title}" using fallback content from AI response (${content.length} chars)`);
          console.error(`🤖 [GameTabService] Preview:`, content.substring(0, 150) + '...');
        }
        
        return {
          ...subTab,
          content,
          isNew: false,
          status: 'loaded' as const
        };
      }) || [];

      // 🔥 CRITICAL FIX: Dual-write to both normalized table AND JSONB
      // The initial subtab creation uses setSubtabs (dual-write), but updates must too!
      console.error('🤖 [GameTabService] Updating subtabs with content...');
      const subtabsDebug = updatedSubTabs.map(s => ({
        id: s.id,
        title: s.title,
        status: s.status,
        contentLength: s.content?.length || 0,
        isNew: s.isNew
      }));
      console.error('🤖 [GameTabService] Subtabs to save:', subtabsDebug);
      console.error('🤖 [GameTabService] ALL statuses:', updatedSubTabs.map(s => s.status));
      
      // ✅ FIX: Clear cache BEFORE write to prevent stale reads during write
      console.error('🤖 [GameTabService] 🗑️ Clearing cache BEFORE subtabs write...');
      ConversationService.clearCache();
      
      await subtabsService.setSubtabs(conversation.id, updatedSubTabs);
      console.error('🤖 [GameTabService] ✅ Subtabs dual-write complete (table + JSONB)');
      
      // ✅ FIX: Clear cache AGAIN after write
      ConversationService.clearCache();
      
      // ✅ FIX: Wait 500ms to ensure database write fully propagates
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ✅ VERIFICATION: Read back immediately to confirm write
      const verifyConversations = await ConversationService.getConversations(true); // skipCache
      const verifyConv = verifyConversations[conversation.id];
      if (verifyConv) {
        console.error('🤖 [GameTabService] 🔍 VERIFICATION: Read back subtabs after write:', 
          verifyConv.subtabs?.map(s => ({ title: s.title, status: s.status })) || 'NO SUBTABS');
      } else {
        console.error('🤖 [GameTabService] ⚠️ VERIFICATION: Could not find conversation after write!');
      }
      
      // Also update conversation metadata (last updated time, etc.)
      await ConversationService.updateConversation(conversation.id, {
        updatedAt: Date.now()
      });
      console.error('🤖 [GameTabService] ✅ Conversation metadata updated');

    } catch (error) {
      console.error('🤖 [GameTabService] ❌ Failed to generate initial insights:', error);
      toastService.warning('Failed to load game insights. You can still chat about the game!');
      
      // ✅ CRITICAL FIX: Read fresh conversation before updating error state
      try {
        const conversations = await ConversationService.getConversations(true); // skipCache = true
        const freshConversation = conversations[conversation.id];
        
        if (!freshConversation) {
          console.error('🤖 [GameTabService] Conversation not found for error update:', conversation.id);
          return;
        }
        
        // Set error state for sub-tabs
        const errorSubTabs = freshConversation.subtabs?.map(subTab => ({
          ...subTab,
          content: `Failed to load ${subTab.title} content. Please try again later.`,
          isNew: false,
          status: 'error' as const
        })) || [];

        // 🔥 CRITICAL FIX: Dual-write error state too!
        await subtabsService.setSubtabs(conversation.id, errorSubTabs);
        await ConversationService.updateConversation(conversation.id, {
          updatedAt: Date.now()
        });
      } catch (updateError) {
        console.error('🤖 [GameTabService] Failed to update error state:', updateError);
      }
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
    console.error('📝 [GameTabService] Updating sub-tab content:', { conversationId, subTabId });

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

      // 🔥 CRITICAL FIX: Dual-write for individual subtab updates too!
      await subtabsService.setSubtabs(conversationId, updatedSubTabs);
      await ConversationService.updateConversation(conversationId, {
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
    console.error(`📝 [GameTabService] [${conversationId}] Updating subtabs from AI response:`, updates.length);

    try {
      // ✅ RACE CONDITION SAFEGUARD: Get fresh conversation data
      const conversations = await ConversationService.getConversations(true);
      const conversation = conversations[conversationId];
      
      if (!conversation || !conversation.subtabs) {
        console.error(`📝 [GameTabService] [${conversationId}] ⚠️ Conversation or subtabs not found, aborting update`);
        return;
      }

      // Update the specific subtabs with linear progression (append, not overwrite)
      let updatedCount = 0;
      const updatedSubTabs = conversation.subtabs.map(tab => {
        const update = updates.find(u => u.tabId === tab.id);
        if (update) {
          updatedCount++;
          console.error(`📝 [GameTabService] [${conversationId}] Updating subtab: ${tab.id} - ${update.title}`);
          
          // ✅ LINEAR PROGRESSION: Append new content with timestamp separator
          const timestamp = new Date().toLocaleString();
          const separator = '\n\n---\n**Updated: ' + timestamp + '**\n\n';
          
          // Only append if there's existing content (not "Loading...")
          const shouldAppend = tab.content && 
                               tab.content.trim().length > 0 && 
                               tab.content !== 'Loading...' &&
                               tab.status === 'loaded';
          
          const newContent = shouldAppend
            ? tab.content + separator + update.content  // ✅ Append to existing
            : update.content;  // First update or loading state
          
          return {
            ...tab,
            title: update.title || tab.title, // Update title if provided
            content: newContent,  // ✅ Accumulated history
            isNew: true, // Mark as new to show indicator
            status: 'loaded' as const
          };
        }
        return tab;
      });

      // Only update if something changed
      if (updatedCount === 0) {
        console.error(`📝 [GameTabService] [${conversationId}] ⚠️ No subtabs matched for update`);
        return;
      }

      // Update conversation with new subtab content
      await ConversationService.updateConversation(conversationId, {
        subtabs: updatedSubTabs,
        updatedAt: Date.now()
      });

      console.error(`📝 [GameTabService] [${conversationId}] ✅ Updated ${updatedCount} subtabs successfully`);
    } catch (error) {
      console.error(`📝 [GameTabService] [${conversationId}] ❌ Failed to update subtabs:`, error);
      throw error;
    }
  }
}

export const gameTabService = new GameTabService();
