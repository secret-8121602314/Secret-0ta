import { SubTab, PlayerProfile } from '../types';

export interface GameContext {
  playthroughCount?: number;
  lastSessionDate?: number;
  totalPlayTime?: number;
  objectivesCompleted?: string[];
  secretsFound?: string[];
}

export interface ProfileSpecificTab extends Omit<SubTab, 'content' | 'isNew' | 'status'> {
  priority: 'high' | 'medium' | 'low';
  isProfileSpecific: boolean;
}

class ProfileAwareTabService {
  private static instance: ProfileAwareTabService;

  private constructor() {}

  static getInstance(): ProfileAwareTabService {
    if (!ProfileAwareTabService.instance) {
      ProfileAwareTabService.instance = new ProfileAwareTabService();
    }
    return ProfileAwareTabService.instance;
  }

  /**
   * Generate additional tabs based on player profile
   * These tabs are added to the base genre tabs
   */
  generateProfileSpecificTabs(
    profile: PlayerProfile,
    gameContext?: GameContext
  ): ProfileSpecificTab[] {
    const tabs: ProfileSpecificTab[] = [];

    // Add tabs based on player focus
    if (profile.playerFocus === 'Story-Driven') {
      tabs.push({
        id: 'narrative_themes',
        title: 'Narrative Themes',
        type: 'story',
        priority: 'high',
        isProfileSpecific: true,
        instruction: this.getNarrativeThemesInstruction(profile.hintStyle),
      });
    }

    if (profile.playerFocus === 'Completionist') {
      tabs.push({
        id: 'secret_hunting',
        title: 'Secret Hunting',
        type: 'tips',
        priority: 'high',
        isProfileSpecific: true,
        instruction: this.getSecretHuntingInstruction(profile.hintStyle),
      });
    }

    if (profile.playerFocus === 'Strategist') {
      tabs.push({
        id: 'optimization_guide',
        title: 'Optimization Guide',
        type: 'strategies',
        priority: 'high',
        isProfileSpecific: true,
        instruction: this.getOptimizationInstruction(profile.hintStyle),
      });
    }

    // Add playthrough-specific tabs for returning players
    if (gameContext?.playthroughCount && gameContext.playthroughCount > 1) {
      tabs.push({
        id: 'playthrough_comparison',
        title: 'Playthrough Comparison',
        type: 'tips',
        priority: 'medium',
        isProfileSpecific: true,
        instruction: this.getPlaythroughComparisonInstruction(profile),
      });
    }

    return tabs;
  }

  /**
   * Get custom instructions for Narrative Themes tab based on hint style
   */
  private getNarrativeThemesInstruction(hintStyle: string): string {
    const instructions: Record<string, string> = {
      Cryptic:
        'Provide subtle hints about story themes without revealing major plot points. Use metaphorical language and thematic connections.',
      Balanced:
        'Discuss narrative elements with moderate detail, balancing spoiler avoidance with meaningful insight into themes and character arcs.',
      Direct:
        'Explain story themes clearly while maintaining appropriate spoiler warnings. Provide direct analysis of narrative elements encountered so far.',
    };
    return instructions[hintStyle] || instructions['Balanced'];
  }

  /**
   * Get custom instructions for Secret Hunting tab based on hint style
   */
  private getSecretHuntingInstruction(hintStyle: string): string {
    const instructions: Record<string, string> = {
      Cryptic:
        'Give mysterious clues about hidden content locations. Use environmental riddles and subtle hints that require exploration.',
      Balanced:
        'Provide clear directions to secrets with some exploration challenge. Balance helpfulness with maintaining the joy of discovery.',
      Direct:
        'Give precise locations and requirements for finding secrets. Include step-by-step instructions and exact coordinates when helpful.',
    };
    return instructions[hintStyle] || instructions['Balanced'];
  }

  /**
   * Get custom instructions for Optimization Guide tab based on hint style
   */
  private getOptimizationInstruction(hintStyle: string): string {
    const instructions: Record<string, string> = {
      Cryptic:
        'Suggest optimization strategies through hints and examples. Let the player discover the optimal path with guidance.',
      Balanced:
        'Provide balanced optimization advice with clear explanations. Suggest effective approaches while leaving room for experimentation.',
      Direct:
        'Give specific optimization recommendations with detailed steps. Provide exact stat allocations, builds, and strategies for maximum efficiency.',
    };
    return instructions[hintStyle] || instructions['Direct'];
  }

  /**
   * Get custom instructions for Playthrough Comparison tab
   */
  private getPlaythroughComparisonInstruction(profile: PlayerProfile): string {
    return `Compare different playthrough approaches based on ${profile.playerFocus} style and ${profile.hintStyle} preferences. Highlight what's different this time and suggest new strategies to explore.`;
  }

  /**
   * Prioritize tabs based on player profile
   * Profile-specific tabs get higher priority, then by assigned priority level
   */
  prioritizeTabsForProfile(
    tabs: ProfileSpecificTab[],
    _profile: PlayerProfile
  ): ProfileSpecificTab[] {
    return tabs.sort((a, b) => {
      // Profile-specific tabs get highest priority
      if (a.isProfileSpecific && !b.isProfileSpecific) return -1;
      if (!a.isProfileSpecific && b.isProfileSpecific) return 1;

      // Then by priority level
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get hint style modifier for AI prompts
   * This modifies how AI generates content based on user preference
   */
  getHintStyleModifier(hintStyle: string): string {
    const modifiers: Record<string, string> = {
      Cryptic:
        'Use subtle, metaphorical hints. Avoid direct answers. Make the player think and discover.',
      Balanced:
        'Provide clear guidance while leaving room for exploration. Balance helpfulness with discovery.',
      Direct:
        'Give explicit, step-by-step instructions. Be precise and comprehensive in explanations.',
    };
    return modifiers[hintStyle] || modifiers['Balanced'];
  }

  /**
   * Get player focus modifier for AI prompts
   * This adjusts content emphasis based on what the player cares about
   */
  getPlayerFocusModifier(playerFocus: string): string {
    const modifiers: Record<string, string> = {
      'Story-Driven':
        'Emphasize narrative elements, character development, and story context. Prioritize lore and thematic content.',
      Completionist:
        'Focus on collectibles, hidden items, side quests, and 100% completion strategies. Highlight missable content.',
      Strategist:
        'Prioritize optimal strategies, build optimization, and efficient progression. Focus on mechanics and systems.',
    };
    return modifiers[playerFocus] || modifiers['Strategist'];
  }

  /**
   * Get spoiler tolerance modifier for AI prompts
   * Controls how much future content can be hinted at
   */
  getSpoilerToleranceModifier(spoilerTolerance: string): string {
    const modifiers: Record<string, string> = {
      Strict:
        'NEVER mention future events, characters, or plot points. Only discuss content up to current progress.',
      Moderate:
        'You may hint at upcoming content in vague terms, but avoid specific spoilers.',
      Relaxed:
        'You can discuss future content more freely, but still mark major spoilers clearly.',
    };
    return modifiers[spoilerTolerance] || modifiers['Strict'];
  }

  /**
   * Get tone modifier for AI prompts
   * Adjusts the conversational style of responses
   */
  getToneModifier(preferredTone: string): string {
    const modifiers: Record<string, string> = {
      Encouraging:
        'Use an enthusiastic, supportive tone. Celebrate achievements and provide positive reinforcement.',
      Professional:
        'Maintain a knowledgeable, respectful tone. Provide expertise without excessive casualness.',
      Casual:
        'Use a friendly, conversational tone. Feel free to use gaming terminology and be relaxed.',
    };
    return modifiers[preferredTone] || modifiers['Professional'];
  }

  /**
   * Build complete profile context for AI prompts
   * Combines all profile modifiers into a single instruction block
   */
  buildProfileContext(profile: PlayerProfile): string {
    const parts = [
      `Hint Style: ${this.getHintStyleModifier(profile.hintStyle)}`,
      `Player Focus: ${this.getPlayerFocusModifier(profile.playerFocus)}`,
      `Spoiler Tolerance: ${this.getSpoilerToleranceModifier(profile.spoilerTolerance)}`,
      `Tone: ${this.getToneModifier(profile.preferredTone)}`,
    ];

    return parts.join('\n');
  }

  /**
   * Get default profile for users who skipped profile setup
   */
  getDefaultProfile(): PlayerProfile {
    return {
      hintStyle: 'Balanced',
      playerFocus: 'Strategist',
      preferredTone: 'Professional',
      spoilerTolerance: 'Strict',
    };
  }
}

export const profileAwareTabService = ProfileAwareTabService.getInstance();

