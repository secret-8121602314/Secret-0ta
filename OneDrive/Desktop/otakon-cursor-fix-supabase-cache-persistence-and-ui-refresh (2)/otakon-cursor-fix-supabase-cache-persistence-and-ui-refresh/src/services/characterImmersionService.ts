export interface GameTone {
  adjectives: string[];
  personality: string;
  speechPattern: string;
  loreStyle: string;
}

export interface ImmersionContext {
  gameTitle: string;
  genre: string;
  currentLocation?: string;
  recentEvents?: string[];
  playerProgress?: number;
}

class CharacterImmersionService {
  private gameTones: Record<string, GameTone> = {
    'Action RPG': {
      adjectives: ['epic', 'heroic', 'legendary', 'mystical', 'ancient'],
      personality: 'wise and experienced adventurer',
      speechPattern: 'speaks with the wisdom of ages and the thrill of adventure',
      loreStyle: 'rich with mythology and ancient secrets'
    },
    'FPS': {
      adjectives: ['intense', 'tactical', 'precise', 'combat-ready', 'strategic'],
      personality: 'battle-hardened soldier',
      speechPattern: 'communicates with military precision and combat experience',
      loreStyle: 'focused on warfare, technology, and military history'
    },
    'Horror': {
      adjectives: ['ominous', 'chilling', 'mysterious', 'haunting', 'eerie'],
      personality: 'knowledgeable survivor',
      speechPattern: 'speaks with caution and awareness of lurking dangers',
      loreStyle: 'dark and atmospheric, filled with supernatural elements'
    },
    'Puzzle': {
      adjectives: ['logical', 'methodical', 'analytical', 'clever', 'systematic'],
      personality: 'brilliant problem-solver',
      speechPattern: 'explains with clear logic and step-by-step reasoning',
      loreStyle: 'intellectual and mysterious, focused on patterns and solutions'
    },
    'RPG': {
      adjectives: ['immersive', 'narrative-driven', 'character-focused', 'epic', 'emotional'],
      personality: 'storyteller and guide',
      speechPattern: 'speaks like a narrator, weaving tales and character development',
      loreStyle: 'deep character development and rich storytelling'
    },
    'Strategy': {
      adjectives: ['tactical', 'strategic', 'calculated', 'methodical', 'commanding'],
      personality: 'master tactician',
      speechPattern: 'speaks with authority and strategic insight',
      loreStyle: 'focused on warfare, politics, and grand strategy'
    },
    'Adventure': {
      adjectives: ['exploratory', 'curious', 'adventurous', 'discoverer', 'wanderer'],
      personality: 'intrepid explorer',
      speechPattern: 'speaks with wonder and excitement about discovery',
      loreStyle: 'filled with exploration, discovery, and world-building'
    },
    'Default': {
      adjectives: ['helpful', 'knowledgeable', 'friendly', 'supportive', 'engaging'],
      personality: 'helpful gaming companion',
      speechPattern: 'speaks clearly and helpfully',
      loreStyle: 'focused on gameplay and helpful information'
    }
  };

  /**
   * Get the appropriate tone for a game based on its genre
   */
  getGameTone(genre: string): GameTone {
    return this.gameTones[genre] || this.gameTones['Default'];
  }

  /**
   * Generate immersive context for AI prompts
   */
  generateImmersionContext(context: ImmersionContext): string {
    const tone = this.getGameTone(context.genre);
    
    let immersionText = `**Immersion Context for ${context.gameTitle}:**\n`;
    immersionText += `You are speaking as a ${tone.personality} who ${tone.speechPattern}.\n`;
    immersionText += `The game's lore is ${tone.loreStyle}.\n`;
    
    if (context.currentLocation) {
      immersionText += `The player is currently in: ${context.currentLocation}\n`;
    }
    
    if (context.recentEvents && context.recentEvents.length > 0) {
      immersionText += `Recent events: ${context.recentEvents.join(', ')}\n`;
    }
    
    if (context.playerProgress !== undefined) {
      immersionText += `Player progress: ${context.playerProgress}%\n`;
    }
    
    immersionText += `\n**Response Guidelines:**\n`;
    immersionText += `- Use ${tone.adjectives.join(', ')} language\n`;
    immersionText += `- Maintain the ${tone.personality} personality\n`;
    immersionText += `- Focus on ${tone.loreStyle} elements\n`;
    immersionText += `- Keep responses immersive and in-character\n`;
    
    return immersionText;
  }

  /**
   * Enhance AI response with game-specific immersion
   */
  enhanceResponse(response: string, context: ImmersionContext): string {
    
    // Add immersive opening based on game genre
    let enhancedResponse = response;
    
    if (context.genre === 'Horror') {
      enhancedResponse = `*The shadows seem to whisper as you approach...*\n\n${response}`;
    } else if (context.genre === 'Action RPG') {
      enhancedResponse = `*The ancient knowledge flows through your mind...*\n\n${response}`;
    } else if (context.genre === 'FPS') {
      enhancedResponse = `*Mission briefing updated...*\n\n${response}`;
    } else if (context.genre === 'Puzzle') {
      enhancedResponse = `*The solution becomes clearer...*\n\n${response}`;
    }
    
    return enhancedResponse;
  }

  /**
   * Get genre-specific suggestions for follow-up questions
   */
  getGenreSuggestions(genre: string, _context: ImmersionContext): string[] {
    
    const baseSuggestions = [
      "Tell me more about this area",
      "What should I do next?",
      "Any tips for this situation?"
    ];
    
    const genreSpecificSuggestions: Record<string, string[]> = {
      'Action RPG': [
        "What's the lore behind this location?",
        "How do I improve my character?",
        "What quests are available here?",
        "Tell me about the local NPCs"
      ],
      'FPS': [
        "What's the best tactical approach?",
        "What weapons work best here?",
        "How do I flank the enemy?",
        "What's the mission objective?"
      ],
      'Horror': [
        "What's the history of this place?",
        "How do I survive this area?",
        "What should I be careful of?",
        "Tell me about the local legends"
      ],
      'Puzzle': [
        "What's the pattern here?",
        "How do I solve this step by step?",
        "What clues am I missing?",
        "What's the logical approach?"
      ],
      'RPG': [
        "Tell me about the story so far",
        "What choices should I make?",
        "How do I develop my character?",
        "What's the significance of this moment?"
      ],
      'Strategy': [
        "What's the best strategy here?",
        "How do I manage my resources?",
        "What's the optimal build order?",
        "How do I counter this threat?"
      ]
    };
    
    return genreSpecificSuggestions[genre] || baseSuggestions;
  }

  /**
   * Create immersive sub-tab content based on genre
   */
  createImmersiveSubTabContent(tabType: string, gameTitle: string, genre: string): string {
    
    const contentTemplates: Record<string, Record<string, string>> = {
      'walkthrough': {
        'Action RPG': `# ${gameTitle} - Walkthrough\n\n*The path of the hero unfolds before you...*\n\n## Current Objective\n*Your quest awaits...*\n\n## Next Steps\n*The adventure continues...*`,
        'FPS': `# ${gameTitle} - Mission Briefing\n\n*Mission parameters updated...*\n\n## Objective\n*Target acquired...*\n\n## Tactical Approach\n*Weapons ready...*`,
        'Horror': `# ${gameTitle} - Survival Guide\n\n*The darkness holds many secrets...*\n\n## Current Situation\n*Something stirs in the shadows...*\n\n## Survival Tips\n*Stay alert...*`,
        'Default': `# ${gameTitle} - Walkthrough\n\n## Current Objective\n*Continue your journey...*\n\n## Next Steps\n*Progress forward...*`
      },
      'tips': {
        'Action RPG': `# ${gameTitle} - Wisdom of the Ages\n\n*Ancient knowledge flows through these tips...*\n\n## Combat Mastery\n*Master the blade and magic...*\n\n## Exploration Secrets\n*Hidden treasures await...*`,
        'FPS': `# ${gameTitle} - Tactical Intelligence\n\n*Mission-critical information...*\n\n## Weapon Mastery\n*Know your arsenal...*\n\n## Tactical Positioning\n*Control the battlefield...*`,
        'Horror': `# ${gameTitle} - Survival Knowledge\n\n*The darkness teaches harsh lessons...*\n\n## Survival Tactics\n*Stay alive...*\n\n## Environmental Awareness\n*Trust your instincts...*`,
        'Default': `# ${gameTitle} - Tips & Tricks\n\n## General Tips\n*Improve your gameplay...*\n\n## Advanced Techniques\n*Master the game...*`
      }
    };
    
    return contentTemplates[tabType]?.[genre] || contentTemplates[tabType]?.['Default'] || `# ${gameTitle} - ${tabType}\n\n*Content loading...*`;
  }
}

export const characterImmersionService = new CharacterImmersionService();
