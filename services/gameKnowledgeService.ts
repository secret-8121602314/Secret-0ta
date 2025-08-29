import { supabase } from './supabase';
import { authService } from './supabase';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface Game {
  id: string;
  title: string;
  genre?: string;
  platform?: string[];
  release_date?: string;
  developer?: string;
  publisher?: string;
  description?: string;
  difficulty_level?: 'easy' | 'medium' | 'hard' | 'expert';
  estimated_completion_time?: number;
  total_achievements?: number;
  total_objectives?: number;
  knowledge_confidence_score?: number;
  last_updated?: string;
  created_at?: string;
  // New consolidated structure
  game_data?: {
    objectives?: GameObjective[];
    solutions?: GameSolution[];
    knowledge_patterns?: KnowledgePattern[];
    metadata?: Record<string, any>;
  };
  session_data?: {
    progress?: PlayerProgress;
    user_context?: any;
    game_state?: any;
  };
}

export interface GameObjective {
  id: string;
  game_id: string;
  objective_name: string;
  objective_type: 'main_quest' | 'side_quest' | 'achievement' | 'collectible' | 'challenge' | 'boss_fight' | 'puzzle' | 'exploration';
  description?: string;
  difficulty_rating?: number;
  estimated_time?: number;
  prerequisites?: string[];
  rewards?: string[];
  location_hint?: string;
  solution_hint?: string;
  spoiler_level: 'none' | 'hint' | 'partial' | 'full';
  completion_rate?: number;
  average_completion_time?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PlayerProgress {
  id: string;
  user_id: string;
  game_id: string;
  current_objective_id?: string;
  progress_percentage: number;
  total_playtime: number;
  current_session_start?: string;
  last_save_time?: string;
  inventory?: string[];
  achievements?: string[];
  completed_objectives?: string[];
  current_location?: string;
  game_state?: any;
  created_at?: string;
  updated_at?: string;
}

export interface GameSolution {
  id: string;
  game_id: string;
  objective_id?: string;
  solution_type: 'hint' | 'strategy' | 'walkthrough' | 'trick' | 'glitch' | 'speedrun';
  title: string;
  content: string;
  spoiler_level: 'none' | 'hint' | 'partial' | 'full';
  difficulty_rating?: number;
  success_rate?: number;
  upvotes?: number;
  downvotes?: number;
  author_id?: string;
  is_verified?: boolean;
  verification_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface KnowledgePattern {
  id: string;
  game_id: string;
  pattern_type: 'common_issue' | 'frequent_question' | 'popular_strategy' | 'bug_report' | 'performance_tip';
  pattern_key: string;
  pattern_description: string;
  common_solutions?: string[];
  frequency_score?: number;
  last_occurrence?: string;
  occurrence_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface QueryKnowledgeMap {
  id: string;
  query_pattern: string;
  query_intent: 'help' | 'hint' | 'solution' | 'strategy' | 'bug_fix' | 'performance' | 'general';
  game_id?: string;
  objective_id?: string;
  solution_id?: string;
  knowledge_pattern_id?: string;
  confidence_score: number;
  response_type: 'direct_answer' | 'hint' | 'solution' | 'redirect_to_ai';
  response_content?: string;
  usage_count?: number;
  success_rate?: number;
  last_used?: string;
  created_at?: string;
}

export interface KnowledgeMatch {
  match_type: string;
  confidence_score: number;
  response_content?: string;
  response_type: string;
  game_id?: string;
  objective_id?: string;
  solution_id?: string;
}

export interface GameKnowledgeSummary {
  game_id: string;
  title: string;
  total_objectives: number;
  total_solutions: number;
  knowledge_confidence: number;
  average_completion_rate: number;
  total_players: number;
  last_updated: string;
}

export interface PlayerProgressSummary {
  game_title: string;
  progress_percentage: number;
  current_objective?: string;
  total_playtime: number;
  achievements_count: number;
  last_played: string;
}

// ============================================================================
// GAME KNOWLEDGE SERVICE
// ============================================================================

export class GameKnowledgeService {
  private static instance: GameKnowledgeService;

  private constructor() {}

  public static getInstance(): GameKnowledgeService {
    if (!GameKnowledgeService.instance) {
      GameKnowledgeService.instance = new GameKnowledgeService();
    }
    return GameKnowledgeService.instance;
  }

  // ============================================================================
  // GAME MANAGEMENT
  // ============================================================================

  /**
   * Register a new game in the system
   */
  async registerGame(gameData: Partial<Game>): Promise<Game> {
    try {
      const { data, error } = await supabase
        .from('games_new')
        .insert([gameData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error registering game:', error);
      throw error;
    }
  }

  /**
   * Get game by title or ID
   */
  async getGame(identifier: string): Promise<Game | null> {
    try {
      const { data, error } = await supabase
        .from('games_new')
        .select('*')
        .or(`id.eq.${identifier},title.ilike.%${identifier}%`)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error getting game:', error);
      return null;
    }
  }

  /**
   * Update game information
   */
  async updateGame(gameId: string, updates: Partial<Game>): Promise<Game> {
    try {
      const { data, error } = await supabase
        .from('games_new')
        .update(updates)
        .eq('id', gameId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating game:', error);
      throw error;
    }
  }

  /**
   * Get all games with optional filtering
   */
  async getGames(filters?: {
    genre?: string;
    platform?: string;
    difficulty?: string;
    minKnowledgeScore?: number;
  }): Promise<Game[]> {
    try {
      let query = supabase.from('games_new').select('*');

      if (filters?.genre) {
        query = query.eq('genre', filters.genre);
      }
      if (filters?.platform) {
        query = query.contains('platform', [filters.platform]);
      }
      if (filters?.difficulty) {
        query = query.eq('difficulty_level', filters.difficulty);
      }
      if (filters?.minKnowledgeScore !== undefined) {
        query = query.gte('knowledge_confidence_score', filters.minKnowledgeScore);
      }

      const { data, error } = await query.order('knowledge_confidence_score', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting games:', error);
      return [];
    }
  }

  // ============================================================================
  // OBJECTIVE MANAGEMENT
  // ============================================================================

  /**
   * Add a new objective to a game
   */
  async addObjective(objectiveData: Partial<GameObjective>): Promise<GameObjective> {
    try {
      // Store objectives in the game's game_data JSONB column
      const game = await this.getGame(objectiveData.game_id!);
      if (!game) throw new Error('Game not found');

      const objectives = game.game_data?.objectives || [];
      const newObjective: GameObjective = {
        id: crypto.randomUUID(),
        game_id: objectiveData.game_id!,
        objective_name: objectiveData.objective_name || 'New Objective',
        objective_type: objectiveData.objective_type || 'main_quest',
        spoiler_level: objectiveData.spoiler_level || 'none',
        ...objectiveData,
        created_at: new Date().toISOString()
      };
      objectives.push(newObjective);

      const { data, error } = await supabase
        .from('games_new')
        .update({
          game_data: { ...game.game_data, objectives }
        })
        .eq('id', objectiveData.game_id!)
        .select()
        .single();

      if (error) throw error;
      return newObjective as GameObjective;
    } catch (error) {
      console.error('Error adding objective:', error);
      throw error;
    }
  }

  /**
   * Get objectives for a specific game
   */
  async getGameObjectives(gameId: string, type?: string): Promise<GameObjective[]> {
    try {
      const game = await this.getGame(gameId);
      if (!game) return [];

      const objectives = game.game_data?.objectives || [];
      
      if (type) {
        return objectives.filter(obj => obj.objective_type === type);
      }
      
      return objectives;
    } catch (error) {
      console.error('Error getting game objectives:', error);
      return [];
    }
  }

  /**
   * Update objective information
   */
  async updateObjective(objectiveId: string, updates: Partial<GameObjective>): Promise<GameObjective> {
    try {
      // Find the game containing this objective
      const games = await this.getGames();
      for (const game of games) {
        const objectives = game.game_data?.objectives || [];
        const objectiveIndex = objectives.findIndex(obj => obj.id === objectiveId);
        
        if (objectiveIndex !== -1) {
          // Update the objective
          objectives[objectiveIndex] = { ...objectives[objectiveIndex], ...updates };
          
          const { data, error } = await supabase
            .from('games_new')
            .update({
              game_data: { ...game.game_data, objectives }
            })
            .eq('id', game.id)
            .select()
            .single();

          if (error) throw error;
          return objectives[objectiveIndex] as GameObjective;
        }
      }
      
      throw new Error('Objective not found');
    } catch (error) {
      console.error('Error updating objective:', error);
      throw error;
    }
  }

  // ============================================================================
  // PLAYER PROGRESS TRACKING
  // ============================================================================

  /**
   * Track player progress in a game
   */
  async trackProgress(progressData: Partial<PlayerProgress>): Promise<PlayerProgress> {
    try {
      const userId = await authService.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      // Store progress in the game's session_data JSONB column
      const game = await this.getGame(progressData.game_id!);
      if (!game) throw new Error('Game not found');

      const progress = game.session_data?.progress || {};
      const updatedProgress = {
        ...progress,
        ...progressData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('games_new')
        .update({
          session_data: { ...game.session_data, progress: updatedProgress }
        })
        .eq('id', progressData.game_id!)
        .select()
        .single();

      if (error) throw error;
      return updatedProgress as PlayerProgress;
    } catch (error) {
      console.error('Error tracking progress:', error);
      throw error;
    }
  }

  /**
   * Get player progress for a specific game
   */
  async getPlayerProgress(userId: string, gameId: string): Promise<PlayerProgress | null> {
    try {
      const { data, error } = await supabase
        .from('player_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error getting player progress:', error);
      return null;
    }
  }

  /**
   * Get all progress for a user
   */
  async getUserProgress(userId: string): Promise<PlayerProgress[]> {
    try {
      const { data, error } = await supabase
        .from('player_progress')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user progress:', error);
      return [];
    }
  }

  /**
   * Update player progress
   */
  async updateProgress(progressId: string, updates: Partial<PlayerProgress>): Promise<PlayerProgress> {
    try {
      const { data, error } = await supabase
        .from('player_progress')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', progressId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }

  // ============================================================================
  // SOLUTION MANAGEMENT
  // ============================================================================

  /**
   * Add a new solution for a game objective
   */
  async addSolution(solutionData: Partial<GameSolution>): Promise<GameSolution> {
    try {
      const userId = await authService.getAuthState();
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('game_solutions')
        .insert([{
          ...solutionData,
          author_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding solution:', error);
      throw error;
    }
  }

  /**
   * Get solutions for a game or objective
   */
  async getSolutions(filters: {
    gameId?: string;
    objectiveId?: string;
    solutionType?: string;
    spoilerLevel?: string;
  }): Promise<GameSolution[]> {
    try {
      let query = supabase.from('game_solutions').select('*');

      if (filters.gameId) {
        query = query.eq('game_id', filters.gameId);
      }
      if (filters.objectiveId) {
        query = query.eq('objective_id', filters.objectiveId);
      }
      if (filters.solutionType) {
        query = query.eq('solution_type', filters.solutionType);
      }
      if (filters.spoilerLevel) {
        query = query.eq('spoiler_level', filters.spoilerLevel);
      }

      const { data, error } = await query
        .order('success_rate', { ascending: false })
        .order('upvotes', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting solutions:', error);
      return [];
    }
  }

  /**
   * Vote on a solution
   */
  async voteOnSolution(solutionId: string, isUpvote: boolean): Promise<void> {
    try {
      // Get current counts first
      const currentUpvotes = await this.getSolutionUpvotes(solutionId);
      const currentDownvotes = await this.getSolutionDownvotes(solutionId);
      
      const { error } = await supabase
        .from('game_solutions')
        .update({
          upvotes: currentUpvotes + (isUpvote ? 1 : 0),
          downvotes: currentDownvotes + (isUpvote ? 0 : 1),
        })
        .eq('id', solutionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error voting on solution:', error);
      throw error;
    }
  }

  private async getSolutionUpvotes(solutionId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('game_solutions')
        .select('upvotes')
        .eq('id', solutionId)
        .single();
      
      if (error) return 0;
      return data?.upvotes || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getSolutionDownvotes(solutionId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('game_solutions')
        .select('downvotes')
        .eq('id', solutionId)
        .single();
      
      if (error) return 0;
      return data?.downvotes || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getQueryMappingUsageCount(mappingId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('query_knowledge_map')
        .select('usage_count')
        .eq('id', mappingId)
        .single();
      
      if (error) return 0;
      return data?.usage_count || 0;
    } catch (error) {
      return 0;
    }
  }

  private async calculateNewSuccessRate(mappingId: string, wasSuccessful: boolean): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('query_knowledge_map')
        .select('usage_count, success_rate')
        .eq('id', mappingId)
        .single();
      
      if (error) return 0;
      const currentUsage = data?.usage_count || 0;
      const currentRate = data?.success_rate || 0;
      
      if (currentUsage === 0) {
        return wasSuccessful ? 1 : 0;
      }
      
      return (currentRate * currentUsage + (wasSuccessful ? 1 : 0)) / (currentUsage + 1);
    } catch (error) {
      return 0;
    }
  }

  // ============================================================================
  // KNOWLEDGE PATTERN MANAGEMENT
  // ============================================================================

  /**
   * Add or update a knowledge pattern
   */
  async addKnowledgePattern(patternData: Partial<KnowledgePattern>): Promise<KnowledgePattern> {
    try {
      // Check if pattern already exists
      const existingPattern = await this.getKnowledgePattern(
        patternData.game_id!,
        patternData.pattern_key!
      );

      if (existingPattern) {
        // Update existing pattern
        const { data, error } = await supabase
          .from('knowledge_patterns')
          .update({
            ...patternData,
            occurrence_count: (existingPattern.occurrence_count || 0) + 1,
            last_occurrence: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPattern.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new pattern
        const { data, error } = await supabase
          .from('knowledge_patterns')
          .insert([{
            ...patternData,
            occurrence_count: 1,
            last_occurrence: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error adding knowledge pattern:', error);
      throw error;
    }
  }

  /**
   * Get knowledge pattern by game and key
   */
  async getKnowledgePattern(gameId: string, patternKey: string): Promise<KnowledgePattern | null> {
    try {
      const { data, error } = await supabase
        .from('knowledge_patterns')
        .select('*')
        .eq('game_id', gameId)
        .eq('pattern_key', patternKey)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error getting knowledge pattern:', error);
      return null;
    }
  }

  // ============================================================================
  // QUERY KNOWLEDGE MAPPING
  // ============================================================================

  /**
   * Add a new query-to-knowledge mapping
   */
  async addQueryMapping(mappingData: Partial<QueryKnowledgeMap>): Promise<QueryKnowledgeMap> {
    try {
      const { data, error } = await supabase
        .from('query_knowledge_map')
        .insert([{
          ...mappingData,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding query mapping:', error);
      throw error;
    }
  }

  /**
   * Find knowledge matches for a user query
   */
  async findKnowledgeMatch(query: string, gameTitle?: string): Promise<KnowledgeMatch[]> {
    try {
      // Use the database function for better performance
      const { data, error } = await supabase
        .rpc('get_knowledge_match_score', {
          query_text: query,
          game_title: gameTitle || null,
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error finding knowledge match:', error);
      return [];
    }
  }

  /**
   * Update query mapping usage statistics
   */
  async updateQueryMappingUsage(mappingId: string, wasSuccessful: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('query_knowledge_map')
        .update({
          usage_count: (await this.getQueryMappingUsageCount(mappingId)) + 1,
          success_rate: await this.calculateNewSuccessRate(mappingId, wasSuccessful),
          last_used: new Date().toISOString(),
        })
        .eq('id', mappingId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating query mapping usage:', error);
      throw error;
    }
  }

  // ============================================================================
  // ANALYTICS AND REPORTING
  // ============================================================================

  /**
   * Get game knowledge summary
   */
  async getGameKnowledgeSummary(gameTitle: string): Promise<GameKnowledgeSummary | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_game_knowledge_summary', { game_title: gameTitle });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error getting game knowledge summary:', error);
      return null;
    }
  }

  /**
   * Get player progress summary
   */
  async getPlayerProgressSummary(userId: string): Promise<PlayerProgressSummary[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_player_progress_summary', { user_uuid: userId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting player progress summary:', error);
      return [];
    }
  }

  /**
   * Get knowledge confidence scores for all games
   */
  async getKnowledgeConfidenceScores(): Promise<{ gameId: string; title: string; score: number }[]> {
    try {
      const { data, error } = await supabase
        .from('games_new')
        .select('id, title, knowledge_confidence_score')
        .order('knowledge_confidence_score', { ascending: false });

      if (error) throw error;
      return (data || []).map(game => ({
        gameId: game.id,
        title: game.title,
        score: game.knowledge_confidence_score || 0,
      }));
    } catch (error) {
      console.error('Error getting knowledge confidence scores:', error);
      return [];
    }
  }

  // ============================================================================
  // SMART RESPONSE SYSTEM
  // ============================================================================

  /**
   * Get smart response for user query (reduces API calls)
   */
  async getSmartResponse(query: string, gameTitle?: string): Promise<{
    response: string;
    source: 'knowledge_base' | 'ai_generated';
    confidence: number;
    metadata?: any;
  }> {
    try {
      // First, try to find a knowledge match
      const knowledgeMatches = await this.findKnowledgeMatch(query, gameTitle);
      
      if (knowledgeMatches.length > 0 && knowledgeMatches[0].confidence_score >= 0.8) {
        const bestMatch = knowledgeMatches[0];
        
        // Update usage statistics
        if (bestMatch.response_type !== 'redirect_to_ai') {
          await this.updateQueryMappingUsage(bestMatch.solution_id!, true);
        }

        return {
          response: bestMatch.response_content || 'I found a helpful solution in our knowledge base!',
          source: 'knowledge_base',
          confidence: bestMatch.confidence_score,
          metadata: {
            gameId: bestMatch.game_id,
            objectiveId: bestMatch.objective_id,
            solutionId: bestMatch.solution_id,
            responseType: bestMatch.response_type,
          },
        };
      }

      // If no good knowledge match, return null to trigger AI generation
      return {
        response: '',
        source: 'ai_generated',
        confidence: 0,
      };
    } catch (error) {
      console.error('Error getting smart response:', error);
      return {
        response: '',
        source: 'ai_generated',
        confidence: 0,
      };
    }
  }

  /**
   * Learn from AI responses to improve knowledge base
   */
  async learnFromAIResponse(
    query: string,
    aiResponse: string,
    gameTitle?: string,
    wasHelpful: boolean = true
  ): Promise<void> {
    try {
      // Extract game information if available
      let gameId: string | undefined;
      if (gameTitle) {
        const game = await this.getGame(gameTitle);
        gameId = game?.id;
      }

      // Create or update knowledge pattern
      if (gameId) {
        const patternKey = this.generatePatternKey(query);
        await this.addKnowledgePattern({
          game_id: gameId,
          pattern_type: 'frequent_question',
          pattern_key: patternKey,
          pattern_description: query,
          common_solutions: [aiResponse],
        });
      }

      // Create query mapping for future use
      await this.addQueryMapping({
        query_pattern: query,
        query_intent: 'help',
        game_id: gameId,
        confidence_score: wasHelpful ? 0.8 : 0.3,
        response_type: wasHelpful ? 'direct_answer' : 'redirect_to_ai',
        response_content: wasHelpful ? aiResponse : undefined,
        usage_count: 1,
        success_rate: wasHelpful ? 1.0 : 0.0,
      });
    } catch (error) {
      console.error('Error learning from AI response:', error);
    }
  }

  /**
   * Generate a pattern key from a query
   */
  private generatePatternKey(query: string): string {
    // Simple pattern key generation - in production, use more sophisticated NLP
    return query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  }

  // ============================================================================
  // MAINTENANCE AND OPTIMIZATION
  // ============================================================================

  /**
   * Clean up old or low-quality knowledge entries
   */
  async cleanupKnowledgeBase(): Promise<void> {
    try {
      // Remove old patterns with low frequency
      await supabase
        .from('knowledge_patterns')
        .delete()
        .lt('frequency_score', 0.1)
        .lt('last_occurrence', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Remove low-confidence query mappings
      await supabase
        .from('query_knowledge_map')
        .delete()
        .lt('confidence_score', 0.3)
        .lt('usage_count', 5);

      console.log('Knowledge base cleanup completed');
    } catch (error) {
      console.error('Error during knowledge base cleanup:', error);
    }
  }

  /**
   * Update knowledge confidence scores
   */
  async updateKnowledgeConfidence(): Promise<void> {
    try {
      await supabase.rpc('update_knowledge_confidence');
      console.log('Knowledge confidence scores updated');
    } catch (error) {
      console.error('Error updating knowledge confidence:', error);
    }
  }
}

// Export singleton instance
export const gameKnowledgeService = GameKnowledgeService.getInstance();
