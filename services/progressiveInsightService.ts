import { GoogleGenAI } from '@google/genai';
import { insightTabsConfig, InsightTab } from './types';
import { Conversation, ChatMessage } from './types';

interface ProgressiveUpdateContext {
  gameName: string;
  genre: string;
  progress: number;
  userQuery: string;
  aiResponse: string;
  conversationHistory: ChatMessage[];
  currentInsightTabs: Record<string, { title: string; content: string }>;
}

interface ProgressiveUpdateResult {
  updatedTabs: Record<string, { title: string; content: string }>;
  relevantTabIds: string[];
}

class ProgressiveInsightService {
  private static instance: ProgressiveInsightService;
  private ai: GoogleGenAI;

  static getInstance(): ProgressiveInsightService {
    if (!ProgressiveInsightService.instance) {
      ProgressiveInsightService.instance = new ProgressiveInsightService();
    }
    return ProgressiveInsightService.instance;
  }

  constructor() {
    // Don't initialize AI immediately to avoid API key errors during static import
    // AI will be initialized lazily when first needed
  }

  private ensureAIInitialized(): void {
    if (!this.ai) {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        console.warn('Gemini API Key not found. Progressive insights will be disabled.');
        return;
      }
      this.ai = new GoogleGenAI(apiKey);
    }
  }

  /**
   * Update insight tabs progressively based on user query and AI response
   * This runs in the background during Flash 2.5 responses
   */
  async updateInsightTabsProgressively(
    context: ProgressiveUpdateContext,
    signal?: AbortSignal
  ): Promise<ProgressiveUpdateResult> {
    try {
      // Ensure AI is initialized before use
      this.ensureAIInitialized();
      
      if (!this.ai) {
        console.warn('Progressive insights disabled: No AI instance available');
        return { updatedTabs: {}, relevantTabIds: [] };
      }

      // Determine which tabs are most relevant to the user's query
      const relevantTabIds = this.identifyRelevantTabs(
        context.userQuery,
        context.genre,
        context.currentInsightTabs
      );

      if (relevantTabIds.length === 0) {
        return { updatedTabs: {}, relevantTabIds: [] };
      }

      // Get the relevant tab configurations
      const tabsConfig = insightTabsConfig[context.genre] || insightTabsConfig.default;
      const relevantTabs = tabsConfig.filter(tab => relevantTabIds.includes(tab.id));

      // Generate progressive updates for relevant tabs
      const updatedTabs = await this.generateProgressiveUpdates(
        context,
        relevantTabs,
        signal
      );

      return { updatedTabs, relevantTabIds };
    } catch (error) {
      console.error('Failed to update insight tabs progressively:', error);
      return { updatedTabs: {}, relevantTabIds: [] };
    }
  }

  /**
   * Identify which insight tabs are most relevant to the user's query
   */
  private identifyRelevantTabs(
    userQuery: string,
    genre: string,
    currentTabs: Record<string, { title: string; content: string }>
  ): string[] {
    const query = userQuery.toLowerCase();
    const relevantTabIds: string[] = [];

    // Define keyword mappings for different tab types
    const keywordMappings: Record<string, string[]> = {
      'story_so_far': ['story', 'plot', 'narrative', 'what happened', 'recap', 'summary'],
      'missed_items': ['missed', 'hidden', 'secret', 'collectible', 'item', 'loot', 'find'],
      'game_lore': ['lore', 'world', 'history', 'background', 'universe', 'mythology'],
      'build_guide': ['build', 'character', 'stats', 'equipment', 'loadout', 'setup'],
      'next_session_plan': ['next', 'plan', 'objective', 'goal', 'what to do', 'session'],
      'quest_log': ['quest', 'mission', 'objective', 'task', 'side quest'],
      'build_optimization': ['optimize', 'improve', 'better', 'upgrade', 'enhance'],
      'boss_strategy': ['boss', 'fight', 'battle', 'strategy', 'tactics', 'defeat'],
      'hidden_paths': ['hidden', 'secret', 'path', 'route', 'explore', 'discover'],
      'loadout_analysis': ['loadout', 'weapon', 'gear', 'equipment', 'setup'],
      'map_strategies': ['map', 'location', 'area', 'position', 'strategy'],
      'enemy_intel': ['enemy', 'opponent', 'threat', 'intel', 'weakness'],
      'pro_tips': ['tip', 'trick', 'advice', 'help', 'how to', 'pro'],
      'team_management': ['team', 'player', 'roster', 'management', 'lineup'],
      'training_focus': ['training', 'practice', 'improve', 'skill', 'development'],
      'tactical_analysis': ['tactics', 'strategy', 'analysis', 'approach'],
      'season_progression': ['season', 'progression', 'championship', 'league'],
      'meta_analysis': ['meta', 'current', 'popular', 'trending', 'balance'],
      'team_coordination': ['team', 'coordination', 'communication', 'strategy'],
      'map_control': ['map', 'control', 'position', 'territory', 'dominance'],
      'skill_development': ['skill', 'improve', 'practice', 'training', 'development']
    };

    // Check for keyword matches
    for (const [tabId, keywords] of Object.entries(keywordMappings)) {
      if (keywords.some(keyword => query.includes(keyword))) {
        relevantTabIds.push(tabId);
      }
    }

    // If no specific matches, include story_so_far and next_session_plan as defaults
    if (relevantTabIds.length === 0) {
      relevantTabIds.push('story_so_far', 'next_session_plan');
    }

    // Limit to maximum 3 tabs to avoid overwhelming the AI
    return relevantTabIds.slice(0, 3);
  }

  /**
   * Generate progressive updates for relevant tabs
   */
  private async generateProgressiveUpdates(
    context: ProgressiveUpdateContext,
    relevantTabs: InsightTab[],
    signal?: AbortSignal
  ): Promise<Record<string, { title: string; content: string }>> {
    const updatedTabs: Record<string, { title: string; content: string }> = {};

    // Create a focused prompt for progressive updates
    const systemInstruction = `You are Otakon, a master game analyst. Your task is to update specific insight tabs based on a recent user query and AI response.

**CONTEXT:**
- Game: ${context.gameName}
- Genre: ${context.genre}
- Player Progress: ${context.progress}%
- User Query: "${context.userQuery}"
- AI Response: "${context.aiResponse}"

**TASK:**
Update the following insight tabs with new, relevant information based on the user's query and the AI's response. Build upon existing content and add new insights that are directly related to the conversation.

**RULES:**
1. **RELEVANCE:** Only add information that is directly relevant to the user's query and the AI's response
2. **PROGRESSIVE ENHANCEMENT:** Build upon existing tab content, don't replace it entirely
3. **SPOILER PROTECTION:** Only include information accessible at ${context.progress}% progress
4. **ACTIONABLE INSIGHTS:** Provide specific, actionable information that helps the player
5. **CONCISE UPDATES:** Keep updates focused and concise (100-200 words per tab)

**OUTPUT FORMAT:**
Return a JSON object with the tab ID as the key and an object with "title" and "content" as the value.
The content should be a brief update that adds to the existing tab content.`;

    const contentPrompt = `Update the following insight tabs based on the conversation:
${relevantTabs.map(tab => `- ${tab.title} (${tab.id}): ${tab.instruction}`).join('\n')}

Provide focused updates that enhance these tabs with information relevant to the user's query.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contentPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: relevantTabs.reduce((props, tab) => {
              props[tab.id] = {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  content: { type: 'string' }
                }
              };
              return props;
            }, {} as Record<string, any>),
            required: relevantTabs.map(tab => tab.id)
          }
        }
      });

      if (response.text) {
        const parsedResponse = JSON.parse(response.text);
        
        // Process each updated tab
        for (const [tabId, tabData] of Object.entries(parsedResponse)) {
          if (tabData && typeof tabData === 'object' && 'content' in tabData) {
            updatedTabs[tabId] = {
              title: (tabData as any).title || relevantTabs.find(t => t.id === tabId)?.title || tabId,
              content: (tabData as any).content || ''
            };
          }
        }
      }

      return updatedTabs;
    } catch (error) {
      console.error('Failed to generate progressive updates:', error);
      return {};
    }
  }

  /**
   * Merge progressive updates with existing tab content
   */
  mergeProgressiveUpdates(
    existingTabs: Record<string, { title: string; content: string }>,
    progressiveUpdates: Record<string, { title: string; content: string }>
  ): Record<string, { title: string; content: string }> {
    const mergedTabs = { ...existingTabs };

    for (const [tabId, update] of Object.entries(progressiveUpdates)) {
      if (mergedTabs[tabId]) {
        // Merge with existing content
        mergedTabs[tabId] = {
          title: update.title || mergedTabs[tabId].title,
          content: `${mergedTabs[tabId].content}\n\n## Recent Updates\n\n${update.content}`
        };
      } else {
        // Add new tab
        mergedTabs[tabId] = update;
      }
    }

    return mergedTabs;
  }
}

export const progressiveInsightService = ProgressiveInsightService.getInstance();
export type { ProgressiveUpdateContext, ProgressiveUpdateResult };
