import { supabase } from '../lib/supabase';

/**
 * Game Hub Service
 * Manages the default "Game Hub" conversation for gaming news and general queries
 */
class GameHubService {
  private static instance: GameHubService;

  private constructor() {}

  static getInstance(): GameHubService {
    if (!GameHubService.instance) {
      GameHubService.instance = new GameHubService();
    }
    return GameHubService.instance;
  }

  /**
   * Get or create the Game Hub conversation for a user
   * This is called on app initialization to ensure every user has a Game Hub
   */
  async getOrCreateGameHub(userId: string): Promise<string> {
    try {
      console.log('🎮 [GameHubService] Getting or creating Game Hub for user:', userId);

      // Call the Supabase function to get or create game hub
      const { data, error } = await supabase.rpc('get_or_create_game_hub', {
        p_user_id: userId
      });

      if (error) {
        console.error('🎮 [GameHubService] Error getting/creating Game Hub:', error);
        throw error;
      }

      console.log('🎮 [GameHubService] Game Hub conversation ID:', data);
      return data as string;
    } catch (error) {
      console.error('🎮 [GameHubService] Failed to get/create Game Hub:', error);
      throw error;
    }
  }

  /**
   * Check if a conversation is the Game Hub
   */
  async isGameHub(conversationId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('is_game_hub')
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('🎮 [GameHubService] Error checking if Game Hub:', error);
        return false;
      }

      return data?.is_game_hub || false;
    } catch (error) {
      console.error('🎮 [GameHubService] Failed to check Game Hub status:', error);
      return false;
    }
  }

  /**
   * Get suggested prompts for Game Hub
   * These are gaming-related prompts that appear when no messages exist
   */
  getGameHubSuggestedPrompts(): string[] {
    return [
      "What are the latest gaming news?",
      "Tell me about upcoming game releases",
      "What's trending in gaming right now?",
      "Recommend me a game to play",
      "What are the best indie games this year?",
      "Show me recent game trailers"
    ];
  }

  /**
   * Detect if a user message is asking for help with a specific game
   * Returns the game name if detected, null otherwise
   */
  detectGameQuery(message: string): { isGameQuery: boolean; gameName?: string } {
    // Keywords that indicate game-specific help
    const helpKeywords = [
      'how do i', 'how to', 'stuck', 'help with', 'beat', 'defeat',
      'find', 'get to', 'unlock', 'tips for', 'guide', 'walkthrough',
      'boss', 'puzzle', 'quest', 'mission', 'level'
    ];

    const lowerMessage = message.toLowerCase();
    const containsHelpKeyword = helpKeywords.some(keyword => lowerMessage.includes(keyword));

    // Game name patterns (common formats)
    const gameNamePatterns = [
      /(?:in|for|about|playing)\s+([A-Z][a-zA-Z0-9:\s]+)/,  // "in Elden Ring", "for Cyberpunk 2077"
      /^([A-Z][a-zA-Z0-9:\s]+)\s+(?:help|tips|guide)/,      // "Elden Ring tips"
    ];

    if (containsHelpKeyword) {
      for (const pattern of gameNamePatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
          return {
            isGameQuery: true,
            gameName: match[1].trim()
          };
        }
      }
      return { isGameQuery: true }; // Help keyword found but no clear game name
    }

    return { isGameQuery: false };
  }

  /**
   * Get welcome message for Game Hub
   */
  getWelcomeMessage(): string {
    return `Welcome to your **Game Hub**! 🎮

This is your central space for all things gaming:
- Get the latest gaming news and updates
- Discover new games and trailers
- Ask general gaming questions
- Get recommendations

When you need help with a specific game, just ask! I'll automatically create a dedicated tab for that game and move the conversation there.

What can I help you with today?`;
  }

  /**
   * Fetch gaming news (placeholder - integrate with actual API)
   * This would integrate with RAWG, IGDB, or similar gaming APIs
   */
  async fetchGamingNews(limit: number = 5): Promise<any[]> {
    // TODO: Integrate with gaming news API
    // For now, return placeholder data
    console.log('🎮 [GameHubService] Fetching gaming news (placeholder)');
    
    return [
      {
        title: "Major Game Update Released",
        summary: "Popular title receives significant content update...",
        date: new Date().toISOString(),
        source: "Gaming News"
      }
    ];
  }

  /**
   * Fetch upcoming game releases (placeholder)
   */
  async fetchUpcomingReleases(limit: number = 5): Promise<any[]> {
    // TODO: Integrate with gaming database API
    console.log('🎮 [GameHubService] Fetching upcoming releases (placeholder)');
    
    return [
      {
        title: "Upcoming Title",
        releaseDate: "Coming Soon",
        platform: "Multi-platform"
      }
    ];
  }
}

export const gameHubService = GameHubService.getInstance();
