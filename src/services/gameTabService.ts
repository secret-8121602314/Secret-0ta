import { Conversation, SubTab, GameTab, insightTabsConfig, AIResponse, PlayerProfile } from '../types';
import { aiService } from './aiService';
import { ConversationService } from './conversationService';
import { profileAwareTabService, GameContext, ProfileSpecificTab } from './profileAwareTabService';
import { toastService } from './toastService';
import { subtabsService } from './subtabsService';
import { chatMemoryService } from './chatMemoryService';
import { unreleasedTabLimitService } from './unreleasedTabLimitService';
import { triggerGameKnowledgeFetch } from './gameKnowledgeFetcher';
import { libraryStorage } from './gamingExplorerStorage';

// ============================================================================
// SUBTAB CONTENT LIMITS
// ============================================================================
// Prevent subtabs from growing indefinitely during long sessions
const MAX_SUBTAB_CONTENT_LENGTH = 3000;  // Characters before summarization
// Note: SUBTAB_SUMMARY_TARGET (1500 chars) is the target length after summarization

// ✅ UUID generator utility
function generateUUID(): string {
  return globalThis.crypto?.randomUUID() || 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

// ✅ FIX 4: Track pending insight generation to prevent stuck loading states
const pendingInsightGenerations = new Set<string>();

/**
 * Check if insight generation is currently running for a conversation
 * Used by polling logic to detect if generation failed to start
 */
export function isGeneratingInsights(conversationId: string): boolean {
  return pendingInsightGenerations.has(conversationId);
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
    
    // 🔒 UNRELEASED TAB LIMIT: Check if user can create unreleased game tab
    if (data.isUnreleased) {
      const limitCheck = await unreleasedTabLimitService.canCreateUnreleasedTab(data.userId, userTier);
      if (!limitCheck.canCreate) {
        throw new Error(`You've reached your limit of ${limitCheck.limit} unreleased game tabs. ${isPro ? 'Delete an existing unreleased tab to add a new one.' : 'Upgrade to Pro for up to 10 unreleased game tabs.'}`);
      }
    }
    
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
      // ✅ FIX: ALWAYS create template subtabs for new tabs
      // progressiveInsightUpdates and gamePillData.wikiContent are for UPDATES, not initial content
      // This ensures consistent subtab structure that can be properly updated later
      subTabs = this.generateInitialSubTabs(data.genre || 'Default', data.playerProfile, {});
      console.error('🎮 [GameTabService] Created', subTabs.length, 'template subtabs (will be populated by generateInitialInsights)');
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
    
    // ✅ PERFORMANCE: Keep cache intact - the conversation we return is already fresh
    // No need to clear cache since we're returning the authoritative object
    console.log('🎮 [GameTabService] Created new tab (cache preserved for performance):', conversation.id);
    
    // 🎮 BACKGROUND GAME KNOWLEDGE: Trigger non-blocking fetch for game knowledge
    // This runs in background and populates cache for future use
    if (!data.isUnreleased && isPro) {
      const libraryGame = libraryStorage.getByGameTitle(data.gameTitle);
      if (libraryGame?.igdbGameId) {
        console.log(`🎮 [GameTabService] Triggering background game knowledge fetch for ${data.gameTitle} (IGDB: ${libraryGame.igdbGameId})`);
        triggerGameKnowledgeFetch(libraryGame.igdbGameId, data.gameTitle);
      } else {
        console.log(`🎮 [GameTabService] No IGDB ID for ${data.gameTitle}, skipping knowledge fetch`);
      }
    }
    
    // 🔒 UNRELEASED TAB TRACKING: Track unreleased tab creation
    if (data.isUnreleased) {
      // Extract IGDB game ID from conversationId or use a placeholder
      const gameId = 0; // Will be updated when we have IGDB data
      await unreleasedTabLimitService.trackUnreleasedTab(data.userId, conversation.id, gameId, data.gameTitle);
    }

    // Save subtabs using the subtabsService (handles both JSONB and normalized approaches)
    if (subTabs.length > 0 && isPro) {
      console.error('🎮 [GameTabService] Saving', subTabs.length, 'subtabs for conversation:', conversation.id);
      console.error('🎮 [GameTabService] Subtabs:', JSON.stringify(subTabs.map(s => ({ id: s.id, title: s.title, type: s.type, hasType: !!s.type })), null, 2));
      
      // ✅ OPTIMIZED: Reduced from 1000ms to 200ms - Supabase writes complete in <100ms
      // This ensures the conversation exists with auth_user_id set before subtab insert
      await new Promise(resolve => setTimeout(resolve, 200));
      
      let success = await subtabsService.setSubtabs(conversation.id, subTabs);
      
      // ✅ FIX: Retry once if initial write fails (RLS policy timing issue)
      if (!success) {
        console.error('⚠️ [GameTabService] First setSubtabs attempt failed, waiting and retrying...');
        await new Promise(resolve => setTimeout(resolve, 500));
        success = await subtabsService.setSubtabs(conversation.id, subTabs);
        
        if (!success) {
          console.error('❌ [GameTabService] Retry also failed - subtabs will be created by generateInitialInsights');
        } else {
          console.error('✅ [GameTabService] Retry succeeded');
        }
      }
    } else if (!isPro) {
      console.error('🔒 [GameTabService] Skipping subtabs save for free tier user');
    } else {
      console.error('🎮 [GameTabService] No subtabs to save for conversation:', conversation.id);
    }

    // 🔒 TIER-GATING: Generate AI insights in background only for Pro users
    // ✅ OPTIMIZED: Only generate insights on FIRST message in a game tab (not subsequent messages)
    // This prevents extra Gemini calls on every message
    const isFirstMessage = conversation.messages.length <= 2; // User message + AI response = 2
    
    if (isPro && isFirstMessage) {
      console.log(`🎯 [GameTabService] First message detected - will generate initial insights for: ${conversation.gameTitle}`);
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
    } else if (isPro && !isFirstMessage) {
      console.log(`📝 [GameTabService] Subsequent message (${conversation.messages.length} msgs) - skipping insight generation to save Gemini calls`);
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
  /**
   * Get game-specific subtab customizations
   * Returns custom tab titles/instructions for specific games, or null to use genre defaults
   * Types: 'chat' | 'walkthrough' | 'tips' | 'strategies' | 'story' | 'characters' | 'items'
   * 
   * NOTE: Currently disabled - using null in generateInitialSubTabs
   */
  // @ts-ignore - Disabled for now
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getGameSpecificTabCustomizations(gameTitle: string): ProfileSpecificTab[] | null {
    const gameLower = gameTitle.toLowerCase();
    
    // Elden Ring - customize for Sites of Grace, bosses, remembrances
    if (gameLower.includes('elden ring')) {
      return [
        { 
          id: generateUUID(),
          title: 'Story So Far', 
          type: 'story',
          instruction: 'Track the Tarnished\'s journey through the Lands Between, major demigod encounters, and story progression.',
          priority: 'high',
          isProfileSpecific: false
        },
        { 
          id: generateUUID(),
          title: 'Sites of Grace Nearby', 
          type: 'tips',
          instruction: 'List nearby Sites of Grace, their locations, and what areas they unlock.',
          priority: 'high',
          isProfileSpecific: false
        },
        { 
          id: generateUUID(),
          title: 'Boss Strategy', 
          type: 'strategies',
          instruction: 'Detailed strategies for Great Rune bearers, remembrance bosses, and field bosses.',
          priority: 'high',
          isProfileSpecific: false
        },
        { 
          id: generateUUID(),
          title: 'Character Questlines', 
          type: 'characters',
          instruction: 'Track NPC questlines like Ranni, Fia, Millicent, and their current progress.',
          priority: 'high',
          isProfileSpecific: false
        },
        { 
          id: generateUUID(),
          title: 'Remembrances & Items', 
          type: 'items',
          instruction: 'Track collected remembrances, Great Runes, and legendary armaments/ashes of war.',
          priority: 'high',
          isProfileSpecific: false
        }
      ];
    }
    
    // Cyberpunk 2077 - customize for fixers, gigs, cyberware
    if (gameLower.includes('cyberpunk')) {
      return [
        {
          id: generateUUID(),
          title: 'Story Progress', 
          type: 'story',
          instruction: 'Track main story missions, relationship with Johnny Silverhand, and key choices made.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'Fixers & Gigs', 
          type: 'walkthrough',
          instruction: 'List available fixers in current district, active gigs, and completed contracts.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'Cyberware Build', 
          type: 'strategies',
          instruction: 'Current cyberware loadout, recommended upgrades, and build synergies.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'Characters & Relationships', 
          type: 'characters',
          instruction: 'Track relationships with Panam, Judy, River, Kerry, and romance options.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'Night City Secrets', 
          type: 'tips',
          instruction: 'Hidden legendary weapons, iconic gear locations, and easter eggs in current area.',
          priority: 'high',
          isProfileSpecific: false
        }
      ];
    }
    
    // Dark Souls series - customize for bonfires, covenant, boss souls
    if (gameLower.includes('dark souls')) {
      return [
        {
          id: generateUUID(),
          title: 'Story So Far', 
          type: 'story',
          instruction: 'Track the Chosen Undead\'s journey, Lords of Cinder defeated, and covenant allegiances.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'Nearby Bonfires', 
          type: 'tips',
          instruction: 'List nearby bonfires, their locations, and connectivity to other areas.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'Boss Strategy', 
          type: 'strategies',
          instruction: 'Strategies for Lord Souls, required bosses, and optional powerful enemies.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'Covenant Progress', 
          type: 'walkthrough',
          instruction: 'Track covenant memberships, offering progress, and covenant-specific rewards.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'Upgrade Paths', 
          type: 'items',
          instruction: 'Weapon upgrade materials, blacksmith locations, and recommended upgrade paths for current build.',
          priority: 'high',
          isProfileSpecific: false
        }
      ];
    }
    
    // Baldur's Gate 3 - customize for companions, choices, D&D mechanics
    if (gameLower.includes('baldur') || gameLower.includes('bg3')) {
      return [
        {
          id: generateUUID(),
          title: 'Story & Choices', 
          type: 'story',
          instruction: 'Track main story progress, major decisions made, and their consequences. Note which companions were recruited and key story branches taken.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'Companion Approval', 
          type: 'characters',
          instruction: 'Track companion relationships, approval ratings, personal quests, and romance progress.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'Build & Multiclass', 
          type: 'strategies',
          instruction: 'Current character build, multiclass options, and synergistic spell/ability combinations.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'Active Quests', 
          type: 'walkthrough',
          instruction: 'List active main quests and important side quests in current act, with quest objectives.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'Secrets & Items', 
          type: 'items',
          instruction: 'Hidden legendary items, secret areas, and missable content in current region.',
          priority: 'high',
          isProfileSpecific: false
        }
      ];
    }
    
    // The Witcher 3 - customize for contracts, potions, Gwent
    if (gameLower.includes('witcher')) {
      return [
        {
          id: generateUUID(),
          title: 'Story Progress', 
          type: 'story',
          instruction: 'Track main story, key decisions, Ciri\'s journey, and major political developments.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'Contracts & Quests', 
          type: 'walkthrough',
          instruction: 'Active witcher contracts, treasure hunts, and important side quests in current region.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'Combat & Alchemy', 
          type: 'strategies',
          instruction: 'Best potions, oils, and decoctions for current enemies. Sign usage tips and combat strategies.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'Characters & Romance', 
          type: 'characters',
          instruction: 'Track relationships with Yennefer, Triss, and other key characters. Romance quest progress.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'Gear & Diagrams', 
          type: 'items',
          instruction: 'Witcher gear sets available, diagram locations, and upgrade materials needed.',
          priority: 'high',
          isProfileSpecific: false
        }
      ];
    }
    
    // Hollow Knight - customize for charms, area exploration, boss challenges
    if (gameLower.includes('hollow knight')) {
      return [
        {
          id: generateUUID(),
          title: 'Exploration Progress', 
          type: 'story',
          instruction: 'Track areas explored, lore discovered, and connections between regions.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'Boss Strategies', 
          type: 'strategies',
          instruction: 'Detailed strategies for current and nearby bosses, including dream versions and optional challenges.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'Charm Builds', 
          type: 'items',
          instruction: 'Recommended charm combinations for current playstyle, and where to find new charms.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'Hidden Secrets', 
          type: 'tips',
          instruction: 'Secret paths, hidden rooms, and breakable walls in current and nearby areas.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'NPC Questlines', 
          type: 'characters',
          instruction: 'Track NPC locations, quest progress for characters like Hornet, Quirrel, and Bretta.',
          priority: 'high',
          isProfileSpecific: false
        }
      ];
    }
    
    // God of War (2018/Ragnarok) - customize for realms, collectibles, upgrades
    if (gameLower.includes('god of war')) {
      return [
        {
          id: generateUUID(),
          title: 'Story & Mythology', 
          type: 'story',
          instruction: 'Track main story progress, realm visits, and Norse mythology lore discovered.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'Boss & Enemy Tactics', 
          type: 'strategies',
          instruction: 'Strategies for bosses and tough enemies, including optimal runic attacks and Spartan Rage usage.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'Gear & Upgrades', 
          type: 'items',
          instruction: 'Best armor sets for current level, weapon upgrades, and where to find crafting materials.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'Realm Exploration', 
          type: 'tips',
          instruction: 'Areas to explore in current realm, hidden chests, and optional content.',
          priority: 'high',
          isProfileSpecific: false
        },
        {
          id: generateUUID(),
          title: 'Collectibles', 
          type: 'walkthrough',
          instruction: 'Track Odin\'s Ravens, Nornir Chests, artifacts, and other collectibles in current regions.',
          priority: 'high',
          isProfileSpecific: false
        }
      ];
    }
    
    // Return null for unmapped games - will fall back to genre-based tabs
    return null;
  }

  // @ts-ignore - Kept for future reference
  private generateInitialSubTabs(
    genre: string,
    playerProfile?: PlayerProfile,
    gameContext?: GameContext
  ): SubTab[] {
    // Check for game-specific customizations first
    const gameTitle = '';
    const gameCustomizations = null; // Disabled for now
    
    // Get base tabs (game-specific or genre-based)
    let baseTabs: ProfileSpecificTab[];
    if (gameCustomizations) {
      // Use game-specific tabs with proper types already configured
      baseTabs = gameCustomizations;
      console.error('🎮 [GameTabService] Using game-specific subtabs for:', gameTitle);
    } else {
      // Use genre-based tabs
      const config = insightTabsConfig[genre] || insightTabsConfig['Default'];
      baseTabs = config.map(tabConfig => ({
        ...tabConfig,
        priority: 'medium' as const,
        isProfileSpecific: false
      }));
      console.error('🎮 [GameTabService] Using genre-based subtabs for genre:', genre);
    }
    
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

    // ✅ FIX 4: Track generation start
    pendingInsightGenerations.add(conversationId);
    
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
        } catch (_err) {
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
        conversationContext,
        freshConv.gameProgress || 0 // ✅ Pass game progress for progress-aware subtabs
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
      let dbSubtabs = await subtabsService.getSubtabs(conversationId);
      console.error(`🤖 [GameTabService] [${conversationId}] 📖 Read ${dbSubtabs.length} subtabs from database`);
      
      // ✅ FIX: If no subtabs in DB but we have them in memory, the initial write may have failed
      // Re-try writing the subtabs to DB before proceeding
      if (dbSubtabs.length === 0 && conversation.subtabs && conversation.subtabs.length > 0) {
        console.error(`🤖 [GameTabService] [${conversationId}] ⚠️ No subtabs in DB but ${conversation.subtabs.length} in memory - retrying write`);
        
        // Wait a bit for any pending DB operations
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Retry the write
        const retrySuccess = await subtabsService.setSubtabs(conversationId, conversation.subtabs);
        if (retrySuccess) {
          console.error(`🤖 [GameTabService] [${conversationId}] ✅ Retry write succeeded`);
          dbSubtabs = await subtabsService.getSubtabs(conversationId);
          console.error(`🤖 [GameTabService] [${conversationId}] 📖 Re-read ${dbSubtabs.length} subtabs from database`);
        } else {
          console.error(`🤖 [GameTabService] [${conversationId}] ❌ Retry write failed - using memory subtabs as fallback`);
          // Use memory subtabs as last resort
          dbSubtabs = conversation.subtabs;
        }
      }
      
      // Replace freshConversation.subtabs with actual database subtabs (or memory fallback)
      freshConversation.subtabs = dbSubtabs;

      // 🔥 MAP insight keys to subtab IDs
      // AI returns keys like "story_so_far" but subtabs have UUID ids
      // ✅ FIX: Map by TITLE instead of type (all tab_type = 'chat')
      // ✅ COMPLETE MAPPING: All titles from all genres in insightTabsConfig
      const titleToKeyMap: Record<string, string> = {
        // === Default/Common tabs ===
        'Story So Far': 'story_so_far',
        'Items You May Have Missed': 'missed_items',
        'Relevant Lore': 'game_lore',
        'Build Guide': 'build_guide',
        'Plan Your Next Session': 'next_session_plan',
        
        // === Action RPG tabs ===
        'Active Quests': 'quest_log',
        'Build Optimization': 'build_optimization',
        'Upcoming Boss Strategy': 'boss_strategy',
        'Boss Strategy': 'boss_strategy',
        'Hidden Paths & Secrets': 'hidden_paths',
        'Points of Interest': 'points_of_interest',
        'NPC Interactions': 'npc_interactions',
        'Consumable Strategy': 'consumable_strategy',
        
        // === RPG tabs ===
        'Character Building': 'character_building',
        'Combat Strategies': 'combat_strategies',
        'Quest Guide': 'quest_guide',
        'Lore Exploration': 'lore_exploration',
        'Companion Management': 'companion_management',
        'Side Activity Guide': 'side_activity_guide',
        
        // === First-Person Shooter tabs ===
        'Loadout Analysis': 'loadout_analysis',
        'Map Strategies': 'map_strategies',
        'Enemy Intel': 'enemy_intel',
        'Pro Tips': 'pro_tips',
        'Weapon Mastery': 'weapon_mastery',
        'Audio Cues Guide': 'audio_cues',
        'Progression Tracker': 'progression_tracker',
        
        // === Strategy tabs ===
        'Current State Analysis': 'current_board_state',
        'Opening Builds': 'opening_moves',
        'Unit Counters': 'unit_counters',
        'Economy Management': 'economy_guide',
        'Tech Tree Priority': 'tech_tree_priority',
        'Map Control Points': 'map_control_points',
        'Opponent Analysis': 'opponent_analysis',
        
        // === Adventure tabs ===
        'Exploration Tips': 'exploration_tips',
        'Puzzle Solving': 'puzzle_solving',
        'Story Progression': 'story_progression',
        'Hidden Secrets': 'hidden_secrets',
        'Inventory Optimization': 'inventory_optimization',
        'Environmental Storytelling': 'environmental_storytelling',
        
        // === Simulation tabs ===
        'Goal Suggestions': 'goal_suggestions',
        'Efficiency & Optimization': 'efficiency_tips',
        'Hidden Mechanics': 'hidden_mechanics',
        'Disaster Prep': 'disaster_prep',
        'Milestone Roadmap': 'milestone_roadmap',
        'System Bottleneck Analysis': 'bottleneck_analysis',
        'Expansion Strategy': 'expansion_strategy',
        
        // === Sports tabs ===
        'Team Management': 'team_management',
        'Training Focus': 'training_focus',
        'Tactical Analysis': 'tactical_analysis',
        'Season Progression': 'season_progression',
        'Transfer Market Insights': 'transfer_market_insights',
        'Injury & Fatigue Management': 'injury_fatigue_management',
        'Opposition Scouting': 'opposition_scouting',
        
        // === Multiplayer Shooter tabs ===
        'Meta Analysis': 'meta_analysis',
        'Team Coordination': 'team_coordination',
        'Map Control': 'map_control',
        'Skill Development': 'skill_development',
        'Ranked Climbing Guide': 'ranked_climbing_guide',
        'Warm-up Routine': 'warmup_routine',
        'Counter-Meta Strategies': 'counter_meta_strategies',
        
        // === Multiplayer Sports tabs ===
        'Competitive Strategy': 'competitive_strategy',
        'Team Synergy': 'team_synergy',
        'Performance Optimization': 'performance_optimization',
        'Ranked Progression': 'ranked_progression',
        'Seasonal Meta Shifts': 'seasonal_meta_shifts',
        'Communication Protocols': 'communication_protocols',
        'VOD Review Focus Points': 'vod_review_focus',
        
        // === Racing tabs ===
        'Vehicle Tuning': 'vehicle_tuning',
        'Track Strategy': 'track_strategy',
        'Race Craft': 'race_craft',
        'Championship Focus': 'championship_focus',
        'Weather Adaptation': 'weather_adaptation',
        'Qualifying Strategy': 'qualifying_strategy',
        'Rival Analysis': 'rival_analysis',
        
        // === Fighting tabs ===
        'Character Analysis': 'character_analysis',
        'Matchup Strategy': 'matchup_strategy',
        'Execution Training': 'execution_training',
        'Tournament Prep': 'tournament_prep',
        'Frame Data Insights': 'frame_data_insights',
        'Mid-Match Adaptation': 'adaptation_tactics',
        'Character Lab Work': 'character_lab_work',
        
        // === Battle Royale tabs ===
        'Drop Strategy': 'drop_strategy',
        'Positioning Tactics': 'positioning_tactics',
        'Loadout Optimization': 'loadout_optimization',
        'Endgame Strategy': 'endgame_strategy',
        'Rotation Management': 'rotation_management',
        'Audio Warfare': 'audio_warfare',
        'Inventory Economy': 'inventory_economy',
        
        // === MMORPG tabs ===
        'Class Optimization': 'class_optimization',
        'Content Progression': 'content_progression',
        'Social Strategies': 'social_strategies',
        'Alt Character Strategy': 'alt_character_strategy',
        'Reputation & Faction Guide': 'reputation_faction_guide',
        'Raid Preparation': 'raid_preparation',
        
        // === Puzzle tabs ===
        'Puzzle Patterns': 'puzzle_patterns',
        'Logical Reasoning': 'logical_reasoning',
        'Time Optimization': 'time_optimization',
        'Difficulty Progression': 'difficulty_progression',
        'Mental Breaks Strategy': 'mental_breaks_strategy',
        'Pattern Library': 'pattern_library',
        'Achievement & Challenge Guide': 'achievement_guide',
        
        // === Horror tabs ===
        'Survival Strategies': 'survival_strategies',
        'Enemy Behavior': 'enemy_behavior',
        'Atmosphere Navigation': 'atmosphere_navigation',
        'Resource Management': 'resource_management',
        'Safe Zone Mapping': 'safe_zone_mapping',
        'Sanity Management': 'sanity_management',
        'Progressive Fear Adaptation': 'fear_adaptation',
        
        // === Souls-like tabs ===
        'Death Recovery Strategy': 'death_recovery',
        'Level Layout Insights': 'level_layout',
        'NPC Questlines': 'npc_questlines',
        
        // === Metroidvania tabs ===
        'New Ability Unlocked': 'ability_unlocks',
        'Backtracking Guide': 'backtracking_guide',
        'Map Completion': 'map_completion',
        'Sequence Breaking Options': 'sequence_breaking',
        'Upgrade Priority': 'upgrade_priority',
        
        // === Open-World tabs ===
        'Region Guide': 'region_guide',
        'Activity Checklist': 'activity_checklist',
        'Collectible Hunting': 'collectible_hunting',
        'Dynamic World Events': 'world_events',
        'Exploration Route': 'exploration_route',
        'Fast Travel Optimization': 'fast_travel_optimization',
        'Progression Balance': 'progression_balance',
        
        // === Survival-Crafting tabs ===
        'Resource Locations': 'resource_locations',
        'Base Building Guide': 'base_building',
        'Crafting Priority': 'crafting_priority',
        'Survival Tips': 'survival_tips',
        'Exploration Targets': 'exploration_targets',
        'Progression Roadmap': 'progression_roadmap',
        'Danger Warnings': 'danger_warnings',
        'Multiplayer Synergy': 'multiplayer_synergy',
        'Seasonal Preparation': 'seasonal_preparation'
      };
      
      console.error('🤖 [GameTabService] Building content mapping for subtabs...');
      console.error('🤖 [GameTabService] AI returned insight keys:', Object.keys(insights));
      
      // Update sub-tabs with generated content OR meaningful fallback
      const updatedSubTabs = freshConversation.subtabs?.map(subTab => {
        let content: string = '';
        
        // ✅ FIX: Map subtab TITLE to insight key (not type)
        const insightKey = titleToKeyMap[subTab.title];
        
        if (!insightKey) {
          console.error(`⚠️ [GameTabService] MISSING MAPPING: No titleToKeyMap entry for "${subTab.title}" - will use fallback`);
        }
        
        if (hasInsights && insightKey && insights[insightKey]) {
          // Use AI-generated content
          content = insights[insightKey];
          console.error(`✅ [GameTabService] Subtab "${subTab.title}" → key "${insightKey}" → AI content (${content.length} chars)`);
        } else if (hasInsights && insightKey) {
          console.error(`⚠️ [GameTabService] Subtab "${subTab.title}" → key "${insightKey}" → NOT FOUND in AI response`);
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

      // ✅ FIX: Check if we have any subtabs to update
      if (updatedSubTabs.length === 0) {
        console.error(`🤖 [GameTabService] [${conversationId}] ⚠️ No subtabs to update - aborting`);
        return;
      }

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
      
      const success = await subtabsService.setSubtabs(conversation.id, updatedSubTabs, true); // true = isUpdate
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
    } finally {
      // ✅ FIX 4: Always remove from tracking, even on error
      pendingInsightGenerations.delete(conversation.id);
      console.error(`🤖 [GameTabService] [${conversation.id}] Generation tracking cleaned up`);
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
    console.error(`📝 [GameTabService] [${conversationId}] Updates to apply:`, updates.map(u => ({ tabId: u.tabId, title: u.title, contentLength: u.content?.length || 0 })));

    try {
      // ✅ RACE CONDITION SAFEGUARD: Get fresh conversation data
      const conversations = await ConversationService.getConversations(true);
      const conversation = conversations[conversationId];
      
      if (!conversation || !conversation.subtabs) {
        console.error(`📝 [GameTabService] [${conversationId}] ⚠️ Conversation or subtabs not found, aborting update`);
        return;
      }

      console.error(`📝 [GameTabService] [${conversationId}] Found ${conversation.subtabs.length} subtabs:`, 
        conversation.subtabs.map(s => ({ id: s.id, title: s.title })));

      // ✅ Build mapping from title/key to subtab (same as titleToKeyMap but reversed)
      // AI sends updates with tabId like "story_so_far" but subtabs have UUID ids
      const titleToKeyMap: Record<string, string> = {
        'Story So Far': 'story_so_far',
        'Items You May Have Missed': 'missed_items',
        'Relevant Lore': 'game_lore',
        'Build Guide': 'build_guide',
        'Plan Your Next Session': 'next_session_plan',
        'Active Quests': 'quest_log',
        'Build Optimization': 'build_optimization',
        'Upcoming Boss Strategy': 'boss_strategy',
        'Boss Strategy': 'boss_strategy',
        'Hidden Paths & Secrets': 'hidden_paths',
        'Points of Interest': 'points_of_interest',
        'NPC Interactions': 'npc_interactions',
        'Consumable Strategy': 'consumable_strategy',
        'Character Building': 'character_building',
        'Combat Strategies': 'combat_strategies',
        'Quest Guide': 'quest_guide',
        'Lore Exploration': 'lore_exploration',
        'Companion Management': 'companion_management',
        'Side Activity Guide': 'side_activity_guide',
        'Loadout Analysis': 'loadout_analysis',
        'Map Strategies': 'map_strategies',
        'Enemy Intel': 'enemy_intel',
        'Pro Tips': 'pro_tips',
        'Weapon Mastery': 'weapon_mastery',
        'Audio Cues Guide': 'audio_cues',
        'Progression Tracker': 'progression_tracker',
        'Current State Analysis': 'current_board_state',
        'Opening Builds': 'opening_moves',
        'Unit Counters': 'unit_counters',
        'Economy Management': 'economy_guide',
        'Tech Tree Priority': 'tech_tree_priority',
        'Map Control Points': 'map_control_points',
        'Opponent Analysis': 'opponent_analysis',
        'Exploration Tips': 'exploration_tips',
        'Puzzle Solving': 'puzzle_solving',
        'Story Progression': 'story_progression',
        'Hidden Secrets': 'hidden_secrets',
        'Inventory Optimization': 'inventory_optimization',
        'Environmental Storytelling': 'environmental_storytelling',
        'Goal Suggestions': 'goal_suggestions',
        'Efficiency & Optimization': 'efficiency_tips',
        'Hidden Mechanics': 'hidden_mechanics',
        'Disaster Prep': 'disaster_prep',
        'Milestone Roadmap': 'milestone_roadmap',
        'System Bottleneck Analysis': 'bottleneck_analysis',
        'Expansion Strategy': 'expansion_strategy',
        'Team Management': 'team_management',
        'Training Focus': 'training_focus',
        'Tactical Analysis': 'tactical_analysis',
        'Season Progression': 'season_progression',
        'Transfer Market Insights': 'transfer_market_insights',
        'Injury & Fatigue Management': 'injury_fatigue_management',
        'Opposition Scouting': 'opposition_scouting',
        'Meta Analysis': 'meta_analysis',
        'Team Coordination': 'team_coordination',
        'Map Control': 'map_control',
        'Skill Development': 'skill_development',
        'Ranked Climbing Guide': 'ranked_climbing_guide',
        'Warm-up Routine': 'warmup_routine',
        'Counter-Meta Strategies': 'counter_meta_strategies',
        'Competitive Strategy': 'competitive_strategy',
        'Team Synergy': 'team_synergy',
        'Performance Optimization': 'performance_optimization',
        'Ranked Progression': 'ranked_progression',
        'Seasonal Meta Shifts': 'seasonal_meta_shifts',
        'Communication Protocols': 'communication_protocols',
        'VOD Review Focus Points': 'vod_review_focus',
        'Vehicle Tuning': 'vehicle_tuning',
        'Track Strategy': 'track_strategy',
        'Race Craft': 'race_craft',
        'Championship Focus': 'championship_focus',
        'Weather Adaptation': 'weather_adaptation',
        'Qualifying Strategy': 'qualifying_strategy',
        'Rival Analysis': 'rival_analysis',
        'Character Analysis': 'character_analysis',
        'Matchup Strategy': 'matchup_strategy',
        'Execution Training': 'execution_training',
        'Tournament Prep': 'tournament_prep',
        'Frame Data Insights': 'frame_data_insights',
        'Mid-Match Adaptation': 'adaptation_tactics',
        'Character Lab Work': 'character_lab_work',
        'Drop Strategy': 'drop_strategy',
        'Positioning Tactics': 'positioning_tactics',
        'Loadout Optimization': 'loadout_optimization',
        'Endgame Strategy': 'endgame_strategy',
        'Rotation Management': 'rotation_management',
        'Audio Warfare': 'audio_warfare',
        'Inventory Economy': 'inventory_economy',
        'Class Optimization': 'class_optimization',
        'Content Progression': 'content_progression',
        'Social Strategies': 'social_strategies',
        'Alt Character Strategy': 'alt_character_strategy',
        'Reputation & Faction Guide': 'reputation_faction_guide',
        'Raid Preparation': 'raid_preparation',
        'Puzzle Patterns': 'puzzle_patterns',
        'Logical Reasoning': 'logical_reasoning',
        'Time Optimization': 'time_optimization',
        'Difficulty Progression': 'difficulty_progression',
        'Mental Breaks Strategy': 'mental_breaks_strategy',
        'Pattern Library': 'pattern_library',
        'Achievement & Challenge Guide': 'achievement_guide',
        'Survival Strategies': 'survival_strategies',
        'Enemy Behavior': 'enemy_behavior',
        'Atmosphere Navigation': 'atmosphere_navigation',
        'Resource Management': 'resource_management',
        'Safe Zone Mapping': 'safe_zone_mapping',
        'Sanity Management': 'sanity_management',
        'Progressive Fear Adaptation': 'fear_adaptation',
        'Death Recovery Strategy': 'death_recovery',
        'Level Layout Insights': 'level_layout',
        'NPC Questlines': 'npc_questlines',
        'New Ability Unlocked': 'ability_unlocks',
        'Backtracking Guide': 'backtracking_guide',
        'Map Completion': 'map_completion',
        'Sequence Breaking Options': 'sequence_breaking',
        'Upgrade Priority': 'upgrade_priority',
        'Region Guide': 'region_guide',
        'Activity Checklist': 'activity_checklist',
        'Collectible Hunting': 'collectible_hunting',
        'Dynamic World Events': 'world_events',
        'Exploration Route': 'exploration_route',
        'Fast Travel Optimization': 'fast_travel_optimization',
        'Progression Balance': 'progression_balance',
        'Resource Locations': 'resource_locations',
        'Base Building Guide': 'base_building',
        'Crafting Priority': 'crafting_priority',
        'Survival Tips': 'survival_tips',
        'Exploration Targets': 'exploration_targets',
        'Progression Roadmap': 'progression_roadmap',
        'Danger Warnings': 'danger_warnings',
        'Multiplayer Synergy': 'multiplayer_synergy',
        'Seasonal Preparation': 'seasonal_preparation'
      };

      // Build reverse mapping: key -> title (for matching AI's tabId to subtab title)
      const keyToTitleMap: Record<string, string> = {};
      for (const [title, key] of Object.entries(titleToKeyMap)) {
        keyToTitleMap[key] = title;
      }

      // Update the specific subtabs with linear progression (append, not overwrite)
      let updatedCount = 0;
      const updatedSubTabs = conversation.subtabs.map(tab => {
        // ✅ FIX: Match by multiple methods:
        // 1. Direct UUID match (if update.tabId is a UUID)
        // 2. Title match (if update.tabId matches tab.title)
        // 3. Key-to-title match (if update.tabId like "story_so_far" maps to "Story So Far")
        const update = updates.find(u => {
          // Method 1: Direct UUID match
          if (u.tabId === tab.id) {
            return true;
          }
          
          // Method 2: Title match (case-insensitive)
          if (u.tabId.toLowerCase() === tab.title.toLowerCase()) {
            return true;
          }
          if (u.title && u.title.toLowerCase() === tab.title.toLowerCase()) {
            return true;
          }
          
          // Method 3: Key-to-title map (AI sends "story_so_far", subtab has title "Story So Far")
          const expectedTitle = keyToTitleMap[u.tabId];
          if (expectedTitle && expectedTitle === tab.title) {
            return true;
          }
          
          // Method 4: Title-to-key map (subtab title -> key -> match update.tabId)
          const subtabKey = titleToKeyMap[tab.title];
          if (subtabKey && subtabKey === u.tabId) {
            return true;
          }
          
          return false;
        });
        
        if (update) {
          updatedCount++;
          console.error(`📝 [GameTabService] [${conversationId}] ✅ Matched subtab "${tab.title}" (${tab.id}) with update.tabId="${update.tabId}"`);
          
          // ✅ COLLAPSIBLE UPDATES: New updates are visible, old ones are collapsed
          const timestamp = new Date().toLocaleString();
          
          // Only append if there's existing content (not "Loading...")
          const shouldAppend = tab.content && 
                               tab.content.trim().length > 0 && 
                               tab.content !== 'Loading...' &&
                               tab.status === 'loaded';
          
          let newContent: string;
          
          if (shouldAppend) {
            // Parse existing content to extract previous updates
            const existingContent = tab.content;
            
            // Check if content already has our collapsible structure with LATEST_UPDATE marker
            const latestMarker = '<!-- LATEST_UPDATE -->';
            const hasProgressiveStructure = existingContent.includes(latestMarker);
            
            if (hasProgressiveStructure) {
              // Structure: [collapsed history] + LATEST_UPDATE marker + [previous latest content]
              // We need to: collapse previous latest -> add to history -> append new content at bottom
              
              const markerIndex = existingContent.indexOf(latestMarker);
              const historySection = existingContent.substring(0, markerIndex).trim(); // Collapsed history at top
              const previousLatest = existingContent.substring(markerIndex + latestMarker.length).trim(); // Previous "latest" content
              
              // Collapse the previous latest content and add to history
              const newCollapsedEntry = `<details>\n<summary>📋 Update from ${timestamp}</summary>\n\n${previousLatest}\n\n</details>\n`;
              
              // Build new structure: history (including new collapsed) + marker + new content
              const updatedHistory = historySection 
                ? historySection + '\n\n' + newCollapsedEntry
                : newCollapsedEntry;
              
              newContent = updatedHistory + '\n\n' + latestMarker + '\n\n' + update.content;
            } else {
              // First time converting to progressive structure
              // Existing content becomes collapsed history, new update is the latest
              const collapsedExisting = `<details>\n<summary>📋 Previous Updates</summary>\n\n${existingContent}\n\n</details>\n`;
              
              newContent = collapsedExisting + '\n\n' + latestMarker + '\n\n' + update.content;
            }
          } else {
            // First update or loading state - just set the content with the marker
            newContent = '<!-- LATEST_UPDATE -->\n\n' + update.content;
          }
          
          // ✅ CONTENT LIMIT CHECK: Prevent indefinite growth
          if (newContent.length > MAX_SUBTAB_CONTENT_LENGTH) {
            console.error(`📝 [GameTabService] [${conversationId}] Subtab ${tab.id} exceeds ${MAX_SUBTAB_CONTENT_LENGTH} chars, trimming old collapsed sections`);
            
            // Remove oldest collapsed sections to stay under limit
            // With new structure, oldest collapsed sections are at the TOP (first in order)
            const collapsedPattern = /<details>\s*<summary>.*?<\/summary>[\s\S]*?<\/details>/g;
            const detailsBlocks = newContent.match(collapsedPattern) || [];
            
            if (detailsBlocks.length > 2) {
              let trimmedContent = newContent;
              
              // Remove oldest blocks (FIRST ones in array since history is at top, oldest first)
              const blocksToRemove = detailsBlocks.slice(0, detailsBlocks.length - 2);
              blocksToRemove.forEach(block => {
                trimmedContent = trimmedContent.replace(block, '');
              });
              
              // Add a note about removed history at the top
              const latestMarker = '<!-- LATEST_UPDATE -->';
              if (!trimmedContent.includes('Earlier history removed') && trimmedContent.includes(latestMarker)) {
                const historyNote = `<details>\n<summary>ℹ️ Earlier history removed to save space</summary>\n\nOlder updates have been automatically removed. Recent updates are preserved.\n\n</details>\n\n`;
                trimmedContent = historyNote + trimmedContent;
              }
              
              newContent = trimmedContent;
            }
            
            console.error(`📝 [GameTabService] [${conversationId}] Subtab ${tab.id} content trimmed to ${newContent.length} chars`);
          }
          
          return {
            ...tab,
            title: update.title || tab.title, // Update title if provided
            content: newContent,  // ✅ Collapsible history
            isNew: true, // Mark as new to show indicator
            status: 'loaded' as const
          };
        }
        return tab;
      });

      // Only update if something changed
      if (updatedCount === 0) {
        console.error(`📝 [GameTabService] [${conversationId}] ⚠️ No subtabs matched for update`);
        // Log what updates we tried to apply for debugging
        updates.forEach(u => {
          console.error(`📝 [GameTabService] [${conversationId}] ⚠️ Unmatched update: tabId="${u.tabId}", title="${u.title}"`);
        });
        return;
      }

      // Log any unmatched updates for debugging
      const matchedTabIds = new Set<string>();
      conversation.subtabs.forEach(tab => {
        const matched = updates.find(u => {
          if (u.tabId === tab.id) {
            return true;
          }
          if (u.tabId.toLowerCase() === tab.title.toLowerCase()) {
            return true;
          }
          if (u.title && u.title.toLowerCase() === tab.title.toLowerCase()) {
            return true;
          }
          const expectedTitle = keyToTitleMap[u.tabId];
          if (expectedTitle && expectedTitle === tab.title) {
            return true;
          }
          const subtabKey = titleToKeyMap[tab.title];
          if (subtabKey && subtabKey === u.tabId) {
            return true;
          }
          return false;
        });
        if (matched) {
          matchedTabIds.add(matched.tabId);
        }
      });
      
      updates.forEach(u => {
        if (!matchedTabIds.has(u.tabId)) {
          console.error(`📝 [GameTabService] [${conversationId}] ⚠️ Update not matched to any subtab: tabId="${u.tabId}", title="${u.title}"`);
        }
      });

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
        
        // Generate initial subtabs
        const subTabs = this.generateInitialSubTabs(conv.genre || 'Default', playerProfile, {});
        
        // Update conversation with subtabs
        await ConversationService.updateConversation(conv.id, {
          subtabs: subTabs,
          subtabsOrder: subTabs.map(tab => tab.id),
          updatedAt: Date.now()
        });

        // Save subtabs to database
        await subtabsService.setSubtabs(conv.id, subTabs);

        // Generate insights - this updates subtabs with actual content
        await this.generateInitialInsights(
          { ...conv, subtabs: subTabs },
          playerProfile
        );

        console.log(`✅ [GameTabService] Successfully generated subtabs for "${conv.gameTitle}"`);
        
        // ✅ CRITICAL FIX: Report progress AFTER insights are generated
        // This ensures the UI refresh picks up the loaded subtab content
        onProgress?.(i, gameTabs.length, conv.gameTitle || conv.title);

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

