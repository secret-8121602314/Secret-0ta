import { Conversation, SubTab, GameTab, insightTabsConfig, AIResponse, PlayerProfile } from '../types';
import { aiService } from './aiService';
import { ConversationService } from './conversationService';
import { profileAwareTabService, GameContext, ProfileSpecificTab } from './profileAwareTabService';
import { toastService } from './toastService';
import { subtabsService } from './subtabsService';
import { chatMemoryService } from './chatMemoryService';

// ============================================================================
// SUBTAB CONTENT LIMITS
// ============================================================================
// Prevent subtabs from growing indefinitely during long sessions
const MAX_SUBTAB_CONTENT_LENGTH = 3000;  // Characters before summarization
const SUBTAB_SUMMARY_TARGET = 1500;       // Target length after summarization

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
  userTier?: string; // User tier for feature gating (free, pro, vanguard_pro)
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
        // ✅ IDEMPOTENT: Check if tab already exists
    const existingConv = await ConversationService.getConversation(data.conversationId);
    
    if (existingConv) {
            // ✅ Update subtabs if they're loading and we have new AI response
      if (data.aiResponse && existingConv.subtabs?.some(tab => tab.status === 'loading' || tab.content === 'Loading...')) {
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
    // 🔒 TIER-GATING: Check if subtabs should be generated based on user tier
    const userTier = data.userTier || 'free';
    const isPro = userTier === 'pro' || userTier === 'vanguard_pro';
    
    console.log('🎮 [GameTabService] Creating new game tab:', {
      gameTitle: data.gameTitle,
      userTier,
      isPro,
      isUnreleased: data.isUnreleased,
      hasAiResponse: !!data.aiResponse
    });
    
    // For unreleased games, don't generate subtabs
    let subTabs: SubTab[] = [];
    
    if (!data.isUnreleased && isPro) {
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
        // No AI response - create template subtabs for pro users
        subTabs = this.generateInitialSubTabs(data.genre || 'Default', data.playerProfile);
        console.error('🎮 [GameTabService] Created', subTabs.length, 'initial template subtabs (no AI response)');
      }
    } else if (data.isUnreleased) {
      console.error('🎮 [GameTabService] Creating unreleased game tab (no subtabs, Discuss mode only)');
    } else {
      console.error('🔒 [GameTabService] Subtabs disabled for free tier users');
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
      isActiveSession: true, // Default to Playing Mode when user asks for help
      activeObjective: '',
      gameProgress: 0,
      isUnreleased: data.isUnreleased || false // Mark if unreleased
    };

    // Save to database
    await ConversationService.addConversation(conversation);

    // Save subtabs using the subtabsService (handles both JSONB and normalized approaches)
    if (subTabs.length > 0 && isPro) {
      console.error('🎮 [GameTabService] Saving', subTabs.length, 'subtabs for conversation:', conversation.id);
      console.error('🎮 [GameTabService] Subtabs:', JSON.stringify(subTabs.map(s => ({ id: s.id, title: s.title, type: s.type, hasType: !!s.type })), null, 2));
      
      // ✅ OPTIMIZED: Reduced from 1000ms to 200ms - Supabase writes complete in <100ms
      // This ensures the conversation exists with auth_user_id set before subtab insert
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const success = await subtabsService.setSubtabs(conversation.id, subTabs);
      if (!success) {
        console.error('❌ [GameTabService] Failed to save subtabs - conversation may not exist yet');
        // Don't throw - let background insights retry
      }
    } else if (!isPro) {
      console.error('🔒 [GameTabService] Skipping subtabs save for free tier user');
    } else {
      console.error('🎮 [GameTabService] No subtabs to save for conversation:', conversation.id);
    }

    // 🔒 TIER-GATING: Generate AI insights in background only for Pro users
    // Only generate if we didn't already get them from the response
    if (isPro) {
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
    } else {
      console.error('🔒 [GameTabService] Skipping AI insight generation for free tier user');
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
    const rawInsightUpdates = aiResponse.otakonTags.get('INSIGHT_UPDATE');
    
    if (rawInsightUpdates) {
      console.error('🤖 [GameTabService] Found INSIGHT_UPDATE:', rawInsightUpdates);
      
      // Cast to expected type
      const insightUpdates = rawInsightUpdates as { id?: string; content?: string };
      if (!insightUpdates.id) {
        console.error('🤖 [GameTabService] INSIGHT_UPDATE missing id, skipping');
        return existingSubtabs;
      }
      
      // Check if subtab already exists
      const existingTab = existingSubtabs.find(tab => tab.id === insightUpdates.id);
      
      if (existingTab) {
        // Update existing subtab
        return existingSubtabs.map(tab => 
          tab.id === insightUpdates.id
            ? {
                ...tab,
                content: insightUpdates.content || tab.content,
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
          content: insightUpdates.content || '',
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

      // ✅ Use conversation context for subtab generation
      // Priority 1: Use cached summary if messages > 10 (efficiency)
      // Priority 2: Use recent messages (last 10) + summary if available
      // Priority 3: Fall back to AI response for new tabs
      // 
      // RACE CONDITION SAFEGUARD: Summary might be slightly stale if being regenerated.
      // We ALWAYS include the last 5 messages alongside summary to ensure fresh context.
      // This guarantees the most recent user interactions are captured even if summary lags.
      let conversationContext = '';
      
      const freshConv = preCheckConversations[conversationId];
      const messageCount = freshConv.messages?.length || 0;
      
      if (messageCount > 10) {
        // For long conversations, use summary + recent messages for efficiency
        try {
          const summary = await chatMemoryService.loadConversationSummary(conversationId);
          // Always get the last 5 messages to ensure we have fresh context
          // even if summary is slightly stale (race condition safeguard)
          const recentMessages = freshConv.messages.slice(-5)
            .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
            .join('\n\n');
            
          if (summary) {
            conversationContext = `Previous Context Summary:\n${JSON.stringify(summary)}\n\nRecent Messages (guaranteed fresh):\n${recentMessages}`;
            console.error(`🤖 [GameTabService] [${conversationId}] ✅ Using summary + 5 recent messages (${messageCount} total msgs)`);
          } else {
            // No summary, use last 10 messages
            conversationContext = freshConv.messages.slice(-10)
              .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
              .join('\n\n');
            console.error(`🤖 [GameTabService] [${conversationId}] Using last 10 messages (no summary available)`);
          }
        } catch (err) {
          // Fallback to last 10 messages
          conversationContext = freshConv.messages.slice(-10)
            .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
            .join('\n\n');
          console.error(`🤖 [GameTabService] [${conversationId}] Using last 10 messages (summary load failed)`);
        }
      } else if (messageCount > 0) {
        // For shorter conversations, use all messages
        conversationContext = freshConv.messages
          .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
          .join('\n\n');
        console.error(`🤖 [GameTabService] [${conversationId}] ✅ Using all ${messageCount} messages`);
      } else if (aiResponse?.content) {
        // Fall back to AI response if no messages yet (new tab scenario)
        conversationContext = `AI Analysis: ${aiResponse.content}`;
        console.error(`🤖 [GameTabService] [${conversationId}] Using AI response as context (${aiResponse.content.length} chars)`);
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

      // ✅ Check if insights were actually generated (not empty object from error fallback)
      const hasInsights = insights && Object.keys(insights).length > 0;
      if (!hasInsights) {
        console.error(`🤖 [GameTabService] [${conversationId}] ❌ Empty insights, using fallback`);
      } else {
        console.error(`🤖 [GameTabService] [${conversationId}] ✅ Got ${Object.keys(insights).length} insights:`, Object.keys(insights));
      }

      // ✅ OPTIMIZED: Reuse preCheckConversations instead of fetching again (saved ~100ms)
      // The conversation won't be deleted during our own AI call in the same request context
      const freshConversation = preCheckConversations[conversationId];
      if (!freshConversation) {
        console.error(`🤖 [GameTabService] [${conversationId}] ⚠️ Conversation not found, may have been deleted`);
        return;
      }

      // ✅ CRITICAL: Read subtabs from database (not from cached conversation object)
      // The conversation object has the old "loading" subtabs, we need the actual database subtabs with types
      const dbSubtabs = await subtabsService.getSubtabs(conversationId);
      console.error(`🤖 [GameTabService] [${conversationId}] 📖 Read ${dbSubtabs.length} subtabs from database`);
      
      // Replace freshConversation.subtabs with actual database subtabs
      freshConversation.subtabs = dbSubtabs;

      // 🔥 MAP insight keys to subtab IDs
      // AI returns keys like "story_so_far" but subtabs have UUID ids
      // ✅ FIX: Map by TITLE instead of type (all tab_type = 'chat')
      const titleToKeyMap: Record<string, string> = {
        // Story/Lore tabs
        'Story So Far': 'story_so_far',
        'Relevant Lore': 'game_lore',
        'Lore Exploration': 'lore_exploration',
        'Environmental Storytelling': 'environmental_storytelling',
        
        // Quest/Progression tabs
        'Active Quests': 'quest_log',
        'Story Progression': 'story_progression',
        'Quest Guide': 'quest_guide',
        
        // Strategy tabs (Action RPG, RPG)
        'Build Optimization': 'build_optimization',
        'Build Guide': 'build_guide',
        'Character Building': 'character_building',
        'Combat Strategies': 'combat_strategies',
        'Boss Strategy': 'boss_strategy',
        'Upcoming Boss Strategy': 'boss_strategy',
        'Consumable Strategy': 'consumable_strategy',
        
        // Tips/Secrets tabs
        'Hidden Paths & Secrets': 'hidden_paths',
        'Pro Tips': 'pro_tips',
        'Exploration Tips': 'exploration_tips',
        'Hidden Secrets': 'hidden_secrets',
        
        // Items/Collectibles tabs
        'Items You May Have Missed': 'missed_items',
        'Collectible Hunting': 'collectible_hunting',
        
        // Points of Interest
        'Points of Interest': 'points_of_interest',
        'Region Guide': 'points_of_interest',
        
        // Planning/Objectives
        'Plan Your Next Session': 'next_session_plan',
        'Activity Checklist': 'next_session_plan',
        
        // World/Exploration
        'Dynamic World Events': 'points_of_interest',
        'Exploration Route': 'exploration_route',
        
        // Optimization/Efficiency
        'Fast Travel Optimization': 'pro_tips',
        'Progression Balance': 'next_session_plan',
        
        // Souls-like specific tabs
        'Death Recovery Strategy': 'death_recovery',
        'NPC Questlines': 'npc_questlines',
        'Level Layout Insights': 'level_layout',
        
        // RPG-specific tabs
        'Companion Management': 'companion_management',
        'Side Activity Guide': 'side_activity_guide',
        'NPC Interactions': 'npc_interactions',
        
        // Metroidvania-specific tabs
        'New Ability Unlocked': 'ability_unlocks',
        'Backtracking Guide': 'backtracking_guide',
        'Map Completion': 'map_completion',
        'Sequence Breaking Options': 'sequence_breaking',
        'Upgrade Priority': 'upgrade_priority',
        
        // Open-World specific tabs (already defined above, removed duplicates)
        
        // Survival-Crafting specific tabs
        'Resource Locations': 'resource_locations',
        'Base Building Guide': 'base_building',
        'Crafting Priority': 'crafting_priority',
        'Survival Tips': 'survival_tips',
        'Exploration Targets': 'exploration_targets',
        'Progression Roadmap': 'progression_roadmap',
        'Danger Warnings': 'danger_warnings',
        'Multiplayer Synergy': 'multiplayer_synergy',
        'Seasonal Preparation': 'seasonal_preparation',
        
        // Horror specific tabs
        'Resource Management': 'resource_management',
        'Safe Zone Mapping': 'safe_zone_mapping',
        'Sanity Management': 'sanity_management',
        'Progressive Fear Adaptation': 'fear_adaptation',
        
        // FPS-specific tabs
        'Loadout Analysis': 'loadout_analysis',
        'Map Strategies': 'map_strategies',
        'Enemy Intel': 'enemy_intel',
        'Weapon Mastery': 'weapon_mastery',
        'Audio Cues Guide': 'audio_cues',
        'Progression Tracker': 'progression_tracker',
        
        // Strategy game tabs
        'Current State Analysis': 'current_board_state',
        'Opening Builds': 'opening_moves',
        'Unit Counters': 'unit_counters',
        'Economy Management': 'economy_guide',
        'Tech Tree Priority': 'tech_tree_priority',
        'Map Control Points': 'map_control_points',
        'Opponent Analysis': 'opponent_analysis',
        
        // Adventure game tabs
        'Puzzle Solving': 'puzzle_solving',
        'Inventory Optimization': 'inventory_optimization'
      };
      
      console.error('🤖 [GameTabService] Building content mapping for subtabs...');
      
      // Update sub-tabs with generated content OR meaningful fallback
      const updatedSubTabs = freshConversation.subtabs?.map(subTab => {
        let content: string = '';
        
        // ✅ FIX: Map subtab TITLE to insight key (not type)
        const insightKey = titleToKeyMap[subTab.title];
        
        if (hasInsights && insightKey && insights[insightKey]) {
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
          status: 'loaded' as const,
          type: subTab.type
        };
      }) || [];

      // 🔥 CRITICAL FIX: Dual-write to both normalized table AND JSONB
      // The initial subtab creation uses setSubtabs (dual-write), but updates must too!
      console.error('🤖 [GameTabService] Updating subtabs with content...');
      const subtabsDebug = updatedSubTabs.map(s => ({
        id: s.id,
        title: s.title,
        type: s.type,
        status: s.status,
        contentLength: s.content?.length || 0,
        isNew: s.isNew,
        hasType: !!s.type
      }));
      console.error('🤖 [GameTabService] Subtabs to save:', subtabsDebug);
      console.error('🤖 [GameTabService] ALL statuses:', updatedSubTabs.map(s => s.status));
      console.error('🤖 [GameTabService] ALL types:', updatedSubTabs.map(s => s.type || 'MISSING_TYPE'));
      
      // ✅ FIX: Clear cache BEFORE write to prevent stale reads during write
      console.error('🤖 [GameTabService] 🗑️ Clearing cache BEFORE subtabs write...');
      ConversationService.clearCache();
      
      const success = await subtabsService.setSubtabs(conversation.id, updatedSubTabs);
      if (!success) {
        throw new Error('Failed to update subtabs in database');
      }
      console.error('🤖 [GameTabService] ✅ Subtabs dual-write complete (table + JSONB)');
      
      // ✅ FIX: Clear cache after write
      ConversationService.clearCache();
      
      // ✅ OPTIMIZED: Skip verification read in production - trust the write succeeded
      // The subtabsService.setSubtabs already returns success/failure status
      console.error('🤖 [GameTabService] 🔍 Subtabs saved successfully, skipping verification read');
      
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
   * Update subtabs after migration with context from the target conversation
   * Called AFTER migration to ensure subtabs are updated (not regenerated) with new context
   * This is critical when:
   * 1. A screenshot is uploaded from Game Hub and migrates to a game tab
   * 2. A screenshot of Game B is uploaded from Game A and migrates to Game B
   * The subtabs should be UPDATED (appended) with new insights, not regenerated
   */
  async updateSubtabsAfterMigration(
    conversationId: string,
    aiResponse?: AIResponse
  ): Promise<void> {
    console.error(`🔄 [GameTabService] [${conversationId}] Updating subtabs after migration...`);
    
    try {
      // Get fresh conversation data with all migrated messages
      const conversations = await ConversationService.getConversations(true);
      const conversation = conversations[conversationId];
      
      if (!conversation) {
        console.error(`🔄 [GameTabService] [${conversationId}] ⚠️ Conversation not found, aborting`);
        return;
      }
      
      // If no subtabs exist yet, this will be handled by createGameTab
      if (!conversation.subtabs || conversation.subtabs.length === 0) {
        console.error(`🔄 [GameTabService] [${conversationId}] No subtabs to update`);
        return;
      }
      
      // Check if AI response has progressive updates
      if (aiResponse?.progressiveInsightUpdates && aiResponse.progressiveInsightUpdates.length > 0) {
        console.error(`🔄 [GameTabService] [${conversationId}] Applying ${aiResponse.progressiveInsightUpdates.length} progressive updates`);
        await this.updateSubTabsFromAIResponse(conversationId, aiResponse.progressiveInsightUpdates);
      } else {
        console.error(`🔄 [GameTabService] [${conversationId}] No progressive updates in AI response`);
      }
      
      console.error(`🔄 [GameTabService] [${conversationId}] ✅ Subtab update complete`);
    } catch (error) {
      console.error(`🔄 [GameTabService] [${conversationId}] ❌ Failed to update subtabs:`, error);
    }
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
          
          let newContent = shouldAppend
            ? tab.content + separator + update.content  // ✅ Append to existing
            : update.content;  // First update or loading state
          
          // ✅ CONTENT LIMIT CHECK: Prevent indefinite growth
          if (newContent.length > MAX_SUBTAB_CONTENT_LENGTH) {
            console.error(`📝 [GameTabService] [${conversationId}] Subtab ${tab.id} exceeds ${MAX_SUBTAB_CONTENT_LENGTH} chars, needs summarization`);
            // For now, keep most recent content by trimming oldest entries
            // TODO: In future, use AI to summarize the content
            const entries = newContent.split('\n\n---\n');
            if (entries.length > 2) {
              // Keep first entry (original context) and last few entries (most recent)
              const firstEntry = entries[0];
              const recentEntries = entries.slice(-3).join('\n\n---\n');
              newContent = firstEntry + '\n\n---\n**[Earlier entries summarized]**\n\n---\n' + recentEntries;
              console.error(`📝 [GameTabService] [${conversationId}] Subtab ${tab.id} content trimmed to ${newContent.length} chars`);
            }
          }
          
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

      // 🔥 CRITICAL FIX: Use subtabsService.setSubtabs() to write to normalized table!
      // The old code used ConversationService.updateConversation() which IGNORES subtabs
      // because the schema migrated to a normalized subtabs table.
      console.error(`📝 [GameTabService] [${conversationId}] Writing ${updatedCount} updated subtabs to normalized table...`);
      const success = await subtabsService.setSubtabs(conversationId, updatedSubTabs);
      
      if (!success) {
        console.error(`📝 [GameTabService] [${conversationId}] ❌ Failed to write subtabs to table`);
        throw new Error('Failed to update subtabs in database');
      }
      
      // Clear cache to ensure fresh reads
      ConversationService.clearCache();
      
      // Also update conversation timestamp
      await ConversationService.updateConversation(conversationId, {
        updatedAt: Date.now()
      });

      console.error(`📝 [GameTabService] [${conversationId}] ✅ Updated ${updatedCount} subtabs successfully (table + cache cleared)`);
    } catch (error) {
      console.error(`📝 [GameTabService] [${conversationId}] ❌ Failed to update subtabs:`, error);
      throw error;
    }
  }

  /**
   * Generate subtabs for game tabs that don't have them (used after tier upgrade)
   * Processes each game tab one by one in background to avoid overwhelming the API
   * @param conversations - All user conversations
   * @param playerProfile - Optional player profile for personalization
   * @param onProgress - Optional callback to report progress
   */
  async generateSubtabsForExistingGameTabs(
    conversations: Record<string, Conversation>,
    playerProfile?: PlayerProfile,
    onProgress?: (completed: number, total: number, currentGame: string) => void
  ): Promise<void> {
    // Find all game tabs that need subtabs (not Game Hub, not unreleased, no subtabs or empty subtabs)
    const gameTabs = Object.values(conversations).filter(conv => 
      !conv.isGameHub && 
      !conv.isUnreleased && 
      conv.gameTitle && 
      (!conv.subtabs || conv.subtabs.length === 0)
    );

    if (gameTabs.length === 0) {
      console.log('🔄 [GameTabService] No game tabs need subtabs generation');
      return;
    }

    console.log(`🔄 [GameTabService] Found ${gameTabs.length} game tabs that need subtabs`);

    // Process each game tab one by one
    for (let i = 0; i < gameTabs.length; i++) {
      const conv = gameTabs[i];
      
      try {
        console.log(`🔄 [GameTabService] Generating subtabs for "${conv.gameTitle}" (${i + 1}/${gameTabs.length})`);
        
        // Report progress
        onProgress?.(i, gameTabs.length, conv.gameTitle || conv.title);

        // Generate initial subtabs
        const subTabs = this.generateInitialSubTabs(conv.genre || 'Default', playerProfile);
        
        // Update conversation with subtabs
        await ConversationService.updateConversation(conv.id, {
          subtabs: subTabs,
          subtabsOrder: subTabs.map(tab => tab.id),
          updatedAt: Date.now()
        });

        // Save subtabs to database
        await subtabsService.setSubtabs(conv.id, subTabs);

        // Generate insights in background
        await this.generateInitialInsights(
          { ...conv, subtabs: subTabs },
          playerProfile
        );

        console.log(`✅ [GameTabService] Successfully generated subtabs for "${conv.gameTitle}"`);

        // Small delay between games to avoid rate limiting
        if (i < gameTabs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ [GameTabService] Failed to generate subtabs for "${conv.gameTitle}":`, error);
        // Continue with next game even if one fails
      }
    }

    // Final progress callback
    onProgress?.(gameTabs.length, gameTabs.length, 'Complete');
    console.log(`🔄 [GameTabService] Finished generating subtabs for ${gameTabs.length} game tabs`);
  }
}

export const gameTabService = new GameTabService();
