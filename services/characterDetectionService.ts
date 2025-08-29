import { ChatMessage, Conversation } from './types';
import { supabaseDataService } from './supabaseDataService';

export interface CharacterInfo {
  id: string;
  name: string;
  gameId: string;
  source: 'user_input' | 'game_detection' | 'context_analysis' | 'game_story_context' | 'image_analysis';
  confidence: number;
  metadata: Record<string, any>;
  detectedAt: number;
  context?: string; // Add context property back
}

export interface GameLanguageProfile {
  gameId: string;
  gameName: string;
  genre: string;
  languageStyle: 'formal' | 'casual' | 'fantasy' | 'sci-fi' | 'medieval' | 'modern' | 'noir' | 'whimsical';
  tone: 'serious' | 'lighthearted' | 'mysterious' | 'epic' | 'gritty' | 'magical';
  characterAddressStyle: 'title' | 'name' | 'nickname' | 'role' | 'formal';
  immersionLevel: 'high' | 'medium' | 'low';
  lastUpdated: number;
}

class CharacterDetectionService {
  private static instance: CharacterDetectionService;
  private characterCache: Map<string, CharacterInfo> = new Map();
  private gameLanguageProfiles: Map<string, GameLanguageProfile> = new Map();
  private readonly CHARACTER_CACHE_KEY = 'otakon_character_cache';
  private readonly GAME_LANGUAGE_KEY = 'otakon_game_language_profiles';

  static getInstance(): CharacterDetectionService {
    if (!CharacterDetectionService.instance) {
      CharacterDetectionService.instance = new CharacterDetectionService();
    }
    return CharacterDetectionService.instance;
  }

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultGameProfiles();
  }

  private loadFromStorage(): void {
    try {
      // Load character cache
      const characterData = localStorage.getItem(this.CHARACTER_CACHE_KEY);
      if (characterData) {
        const parsed = JSON.parse(characterData);
        this.characterCache = new Map(Object.entries(parsed));
      }

      // Load game language profiles
      const gameData = localStorage.getItem(this.GAME_LANGUAGE_KEY);
      if (gameData) {
        const parsed = JSON.parse(gameData);
        this.gameLanguageProfiles = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Failed to load character detection data:', error);
    }
  }

  private saveToStorage(): void {
    try {
      // Save character cache
      const characterData = Object.fromEntries(this.characterCache);
      localStorage.setItem(this.CHARACTER_CACHE_KEY, JSON.stringify(characterData));

      // Save game language profiles
      const gameData = Object.fromEntries(this.gameLanguageProfiles);
      localStorage.setItem(this.GAME_LANGUAGE_KEY, JSON.stringify(gameData));
    } catch (error) {
      console.warn('Failed to save character detection data:', error);
    }
  }

  private initializeDefaultGameProfiles(): void {
    const defaultProfiles: GameLanguageProfile[] = [
      {
        gameId: 'elden-ring',
        gameName: 'Elden Ring',
        genre: 'action-rpg',
        languageStyle: 'medieval',
        tone: 'mysterious',
        characterAddressStyle: 'title',
        immersionLevel: 'high',
        lastUpdated: Date.now()
      },
      {
        gameId: 'baldurs-gate-3',
        gameName: 'Baldur\'s Gate 3',
        genre: 'rpg',
        languageStyle: 'fantasy',
        tone: 'epic',
        characterAddressStyle: 'name',
        immersionLevel: 'high',
        lastUpdated: Date.now()
      },
      {
        gameId: 'cyberpunk-2077',
        gameName: 'Cyberpunk 2077',
        genre: 'rpg',
        languageStyle: 'sci-fi',
        tone: 'gritty',
        characterAddressStyle: 'nickname',
        immersionLevel: 'high',
        lastUpdated: Date.now()
      },
      {
        gameId: 'zelda-tears-kingdom',
        gameName: 'The Legend of Zelda: Tears of the Kingdom',
        genre: 'adventure',
        languageStyle: 'fantasy',
        tone: 'lighthearted',
        characterAddressStyle: 'name',
        immersionLevel: 'high',
        lastUpdated: Date.now()
      },
      {
        gameId: 'god-of-war-ragnarok',
        gameName: 'God of War Ragnarök',
        genre: 'action-adventure',
        languageStyle: 'fantasy',
        tone: 'epic',
        characterAddressStyle: 'name',
        immersionLevel: 'high',
        lastUpdated: Date.now()
      }
    ];

    defaultProfiles.forEach(profile => {
      if (!this.gameLanguageProfiles.has(profile.gameId)) {
        this.gameLanguageProfiles.set(profile.gameId, profile);
      }
    });
  }

  // Detect character name from user messages
  detectCharacterFromMessages(messages: ChatMessage[], gameId?: string): CharacterInfo | null {
    // Check cache first
    if (gameId) {
      const cached = this.characterCache.get(gameId);
      if (cached && Date.now() - cached.detectedAt < 24 * 60 * 60 * 1000) { // 24 hours
        return cached;
      }
    }

    // Try to detect from recent messages
    const characterName = this.extractCharacterNameFromMessages(messages);
    if (characterName) {
      if (!gameId) return null;
      
      const characterInfo: CharacterInfo = {
        id: Date.now().toString(), // Simple unique ID
        name: characterName,
        gameId,
        source: 'game_story_context',
        confidence: 1.0, // High confidence for game story context
        metadata: {},
        detectedAt: Date.now(),
        context: this.getCharacterContext(characterName, gameId)
      };
      
      if (gameId) {
        this.characterCache.set(gameId, characterInfo);
        this.saveToStorage();
      }
      
      return characterInfo;
    }

    return null;
  }

  // Extract character name from message text - focus on game story context
  private extractCharacterNameFromMessages(messages: ChatMessage[]): string | null {
    const recentMessages = messages.slice(-5); // Last 5 messages
    
    for (const message of recentMessages) {
      if (message.role === 'user') {
        const text = message.text.toLowerCase();
        
        // Look for character names mentioned in game story context
        // Pattern 1: "I'm fighting [Character]" or "I need to defeat [Character]"
        const bossPatterns = [
          /(?:fighting|battling|fighting against|need to defeat|stuck on|can't beat)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
          /(?:boss|enemy|opponent)\s+(?:named\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
          /(?:how\s+to\s+beat|how\s+do\s+I\s+defeat|tips\s+for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
        ];

        for (const pattern of bossPatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }

        // Pattern 2: "I'm helping [Character]" or "I need to find [Character]"
        const npcPatterns = [
          /(?:helping|looking for|need to find|searching for|talking to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
          /(?:npc|character|person)\s+(?:named\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
          /(?:quest\s+from|mission\s+for|task\s+given\s+by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
        ];

        for (const pattern of npcPatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }

        // Pattern 3: "I'm playing as [Character]" or "My character is [Character]"
        const playerCharacterPatterns = [
          /(?:playing as|my character is|I am|I'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
          /(?:character|hero|protagonist)\s+(?:named\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
        ];

        for (const pattern of playerCharacterPatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }

        // Pattern 4: "I'm in [Location] with [Character]" or "I met [Character] in [Location]"
        const locationCharacterPatterns = [
          /(?:in|at|near)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:with|and|meeting)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
          /(?:met|found|encountered|saw)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:in|at|near)/i
        ];

        for (const pattern of locationCharacterPatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }

        // Pattern 5: "I need help with [Character]'s quest" or "[Character] gave me a task"
        const questPatterns = [
          /(?:help with|stuck on|can't complete)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'s\s+(?:quest|mission|task)/i,
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:gave me|assigned me|asked me to)\s+(?:a quest|a task|a mission)/i
        ];

        for (const pattern of questPatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }

        // Pattern 6: "I'm trying to save [Character]" or "I need to rescue [Character]"
        const rescuePatterns = [
          /(?:trying to|need to|must)\s+(?:save|rescue|help|protect)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
          /(?:save|rescue|help|protect)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:from|in|at)/i
        ];

        for (const pattern of rescuePatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }

        // Pattern 7: "I'm learning about [Character]'s backstory" or "[Character]'s history"
        const lorePatterns = [
          /(?:learning about|reading about|interested in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'s\s+(?:backstory|history|lore)/i,
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'s\s+(?:backstory|history|lore|story)/i
        ];

        for (const pattern of lorePatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
      }
    }

    return null;
  }

  // Enhanced character detection from image context (for screenshot analysis)
  detectCharacterFromImageContext(imageDescription: string, gameId?: string): CharacterInfo | null {
    if (!imageDescription) return null;

    const text = imageDescription.toLowerCase();
    
    // Look for character mentions in image descriptions
    const imageCharacterPatterns = [
      // Boss/enemy characters visible in image
      /(?:boss|enemy|opponent|adversary)\s+(?:named\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /(?:fighting|battling|facing)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      
      // NPCs or friendly characters
      /(?:npc|character|person|ally|companion)\s+(?:named\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /(?:talking to|interacting with|meeting)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      
      // Player character references
      /(?:my character|player character|hero|protagonist)\s+(?:named\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      
      // Quest-related characters
      /(?:quest giver|mission provider|task master)\s+(?:named\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      
      // Location-based character mentions
      /(?:in|at|near)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:with|and)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
    ];

    for (const pattern of imageCharacterPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const characterName = match[1].trim();
        if (!gameId) return null;
        
        const characterInfo: CharacterInfo = {
          id: Date.now().toString(), // Simple unique ID
          name: characterName,
          gameId,
          source: 'image_analysis',
          confidence: 0.8, // Image context might be less reliable
          metadata: {},
          detectedAt: Date.now(),
          context: this.getCharacterContext(characterName, gameId)
        };
        
        if (gameId) {
          this.characterCache.set(gameId, characterInfo);
          this.saveToStorage();
        }
        
        return characterInfo;
      }
    }

    return null;
  }

  // Get character context based on game and name
  private getCharacterContext(characterName: string, gameId?: string): string {
    if (!gameId) return 'unknown_game';
    
    const profile = this.gameLanguageProfiles.get(gameId);
    if (!profile) return 'standard_character';
    
    // Generate context based on game genre and style
    switch (profile.genre) {
      case 'action-rpg':
        return 'warrior_character';
      case 'rpg':
        return 'adventurer_character';
      case 'adventure':
        return 'hero_character';
      case 'strategy':
        return 'commander_character';
      default:
        return 'player_character';
    }
  }

  // Get or create game language profile
  getGameLanguageProfile(gameId: string, gameName?: string, genre?: string): GameLanguageProfile {
    let profile = this.gameLanguageProfiles.get(gameId);
    
    if (!profile) {
      // Create new profile based on detected game
      profile = this.createGameLanguageProfile(gameId, gameName, genre);
      this.gameLanguageProfiles.set(gameId, profile);
      this.saveToStorage();
    }
    
    return profile;
  }

  // Create a new game language profile
  private createGameLanguageProfile(gameId: string, gameName?: string, genre?: string): GameLanguageProfile {
    // Analyze game name and genre to determine language style
    const detectedStyle = this.detectLanguageStyle(gameName, genre);
    
    return {
      gameId,
      gameName: gameName || 'Unknown Game',
      genre: genre || 'unknown',
      languageStyle: detectedStyle.languageStyle,
      tone: detectedStyle.tone,
      characterAddressStyle: detectedStyle.characterAddressStyle,
      immersionLevel: 'high', // Default to high immersion
      lastUpdated: Date.now()
    };
  }

  // Detect language style from game name and genre
  private detectLanguageStyle(gameName?: string, genre?: string): {
    languageStyle: GameLanguageProfile['languageStyle'];
    tone: GameLanguageProfile['tone'];
    characterAddressStyle: GameLanguageProfile['characterAddressStyle'];
  } {
    const name = (gameName || '').toLowerCase();
    const gameGenre = (genre || '').toLowerCase();
    
    // Detect from game name patterns
    if (name.includes('fantasy') || name.includes('magic') || name.includes('dragon') || name.includes('sword')) {
      return { languageStyle: 'fantasy', tone: 'epic', characterAddressStyle: 'title' };
    }
    
    if (name.includes('cyber') || name.includes('punk') || name.includes('future') || name.includes('space')) {
      return { languageStyle: 'sci-fi', tone: 'gritty', characterAddressStyle: 'nickname' };
    }
    
    if (name.includes('medieval') || name.includes('kingdom') || name.includes('castle') || name.includes('knight')) {
      return { languageStyle: 'medieval', tone: 'serious', characterAddressStyle: 'title' };
    }
    
    if (name.includes('noir') || name.includes('detective') || name.includes('mystery')) {
      return { languageStyle: 'noir', tone: 'mysterious', characterAddressStyle: 'name' };
    }
    
    // Detect from genre
    switch (gameGenre) {
      case 'rpg':
        return { languageStyle: 'fantasy', tone: 'epic', characterAddressStyle: 'name' };
      case 'action':
        return { languageStyle: 'modern', tone: 'serious', characterAddressStyle: 'name' };
      case 'adventure':
        return { languageStyle: 'fantasy', tone: 'lighthearted', characterAddressStyle: 'name' };
      case 'strategy':
        return { languageStyle: 'formal', tone: 'serious', characterAddressStyle: 'title' };
      case 'simulation':
        return { languageStyle: 'modern', tone: 'serious', characterAddressStyle: 'name' };
      default:
        return { languageStyle: 'modern', tone: 'lighthearted', characterAddressStyle: 'name' };
    }
  }

  // Get character address format for a specific game
  getCharacterAddressFormat(gameId: string, characterName: string): string {
    const profile = this.gameLanguageProfiles.get(gameId);
    if (!profile) return characterName;
    
    switch (profile.characterAddressStyle) {
      case 'title':
        return this.generateTitle(characterName, profile);
      case 'nickname':
        return this.generateNickname(characterName, profile);
      case 'role':
        return this.generateRole(characterName, profile);
      case 'formal':
        return this.generateFormalAddress(characterName, profile);
      default:
        return characterName;
    }
  }

  // Generate title-based address
  private generateTitle(characterName: string, profile: GameLanguageProfile): string {
    const titles = {
      fantasy: ['Brave', 'Valiant', 'Noble', 'Wise', 'Mighty'],
      medieval: ['Honorable', 'Respected', 'Esteemed', 'Venerable'],
      sci_fi: ['Agent', 'Commander', 'Specialist', 'Operator'],
      modern: ['Esteemed', 'Respected', 'Honorable']
    };
    
    const titleList = titles[profile.languageStyle as keyof typeof titles] || titles.modern;
    const title = titleList[Math.floor(Math.random() * titleList.length)];
    return `${title} ${characterName}`;
  }

  // Generate nickname-based address
  private generateNickname(characterName: string, profile: GameLanguageProfile): string {
    const nicknames = {
      sci_fi: ['Choom', 'Runner', 'Netrunner', 'Street Kid'],
      modern: ['Buddy', 'Pal', 'Friend', 'Champ'],
      fantasy: ['Traveler', 'Wanderer', 'Seeker', 'Adventurer']
    };
    
    const nicknameList = nicknames[profile.languageStyle as keyof typeof nicknames] || nicknames.modern;
    const nickname = nicknameList[Math.floor(Math.random() * nicknameList.length)];
    return `${nickname} ${characterName}`;
  }

  // Generate role-based address
  private generateRole(characterName: string, profile: GameLanguageProfile): string {
    const roles = {
      rpg: ['Adventurer', 'Hero', 'Champion', 'Protector'],
      strategy: ['Commander', 'General', 'Strategist', 'Leader'],
      action: ['Warrior', 'Fighter', 'Guardian', 'Defender']
    };
    
    const roleList = roles[profile.genre as keyof typeof roles] || roles.rpg;
    const role = roleList[Math.floor(Math.random() * roleList.length)];
    return `${role} ${characterName}`;
  }

  // Generate formal address
  private generateFormalAddress(characterName: string, profile: GameLanguageProfile): string {
    return `Mr./Ms. ${characterName}`;
  }

  // Get immersive language patterns for a game
  getImmersiveLanguagePatterns(gameId: string): {
    greetings: string[];
    encouragements: string[];
    hints: string[];
    confirmations: string[];
  } {
    const profile = this.gameLanguageProfiles.get(gameId);
    if (!profile) return this.getDefaultLanguagePatterns();
    
    const patterns = {
      fantasy: {
        greetings: ['Greetings, brave one', 'Welcome, traveler', 'Ah, a new challenger approaches'],
        encouragements: ['Your determination shines bright', 'The path ahead is challenging, but you are ready', 'Your courage will guide you'],
        hints: ['The ancient texts speak of...', 'Legends tell of a hidden...', 'The wise ones say to look for...'],
        confirmations: ['I have noted your progress', 'Your journey is recorded', 'The chronicles shall remember this']
      },
      sci_fi: {
        greetings: ['Greetings, operator', 'Welcome to the system', 'Identity confirmed, agent'],
        encouragements: ['Your skills are exceptional', 'The mission requires your expertise', 'You are the key to success'],
        hints: ['Scanning reveals...', 'The data suggests...', 'Analysis indicates...'],
        confirmations: ['Data logged successfully', 'Mission parameters updated', 'Progress recorded in database']
      },
      medieval: {
        greetings: ['Hail, noble one', 'Welcome, honored guest', 'Greetings, worthy warrior'],
        encouragements: ['Your valor is unmatched', 'The kingdom needs your strength', 'Your honor guides you'],
        hints: ['The ancient scrolls mention...', 'The wise council speaks of...', 'The old tales tell of...'],
        confirmations: ['Your deeds are recorded', 'The chronicles shall remember', 'Your honor is preserved']
      },
      noir: {
        greetings: ['Evening, detective', 'Welcome to the shadows', 'Ah, a new case'],
        encouragements: ['Your instincts are sharp', 'The truth is out there', 'You have what it takes'],
        hints: ['The evidence suggests...', 'My sources tell me...', 'The pattern indicates...'],
        confirmations: ['Case notes updated', 'Evidence logged', 'Progress documented']
      }
    };
    
    return patterns[profile.languageStyle as keyof typeof patterns] || this.getDefaultLanguagePatterns();
  }

  // Get default language patterns
  private getDefaultLanguagePatterns(): {
    greetings: string[];
    encouragements: string[];
    hints: string[];
    confirmations: string[];
  } {
    return {
      greetings: ['Hello there', 'Welcome back', 'Good to see you'],
      encouragements: ['You\'re doing great', 'Keep it up', 'You\'ve got this'],
      hints: ['I noticed that...', 'You might want to check...', 'Consider looking at...'],
      confirmations: ['Got it', 'Noted', 'Understood']
    };
  }

  // Update game language profile
  updateGameLanguageProfile(gameId: string, updates: Partial<GameLanguageProfile>): void {
    const existing = this.gameLanguageProfiles.get(gameId);
    if (existing) {
      const updated = { ...existing, ...updates, lastUpdated: Date.now() };
      this.gameLanguageProfiles.set(gameId, updated);
      this.saveToStorage();
    }
  }

  // Clear character cache for a specific game
  clearCharacterCache(gameId: string): void {
    this.characterCache.delete(gameId);
    this.saveToStorage();
  }

  // Get all cached characters
  getCachedCharacters(): CharacterInfo[] {
    return Array.from(this.characterCache.values());
  }

  // Get all game language profiles
  getGameLanguageProfiles(): GameLanguageProfile[] {
    return Array.from(this.gameLanguageProfiles.values());
  }


}

export const characterDetectionService = CharacterDetectionService.getInstance();
