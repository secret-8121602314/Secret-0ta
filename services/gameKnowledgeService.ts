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
        .from('games')
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
        .from('games')
        .select('*')
        .or(`game_id.eq.${identifier},title.ilike.%${identifier}%`)
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
        .from('games')
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
      let query = supabase.from('games').select('*');

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
        .from('games')
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
            .from('games')
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
      const userId = authService.getCurrentUserId();
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
        .from('games')
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
        .from('games')
        .select('session_data')
        .eq('user_id', userId)
        .eq('id', gameId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Extract player progress from session_data
      const sessionData = data?.session_data || {};
      const playerProgress = sessionData.playerProgress;
      
      return playerProgress || null;
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
        .from('games')
        .select('session_data')
        .eq('user_id', userId);

      if (error) throw error;
      
      // Extract player progress from all games' session_data
      const allProgress: PlayerProgress[] = [];
      data?.forEach(game => {
        const sessionData = game.session_data || {};
        if (sessionData.playerProgress) {
          allProgress.push(sessionData.playerProgress);
        }
      });
      
      return allProgress;
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
      // Find the game that contains this progress
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('id, session_data')
        .not('session_data', 'is', null);

      if (gamesError) throw gamesError;

      let targetGameId: string | null = null;
      let currentProgress: PlayerProgress | null = null;

      // Find the game containing this progress
      for (const game of games || []) {
        const sessionData = game.session_data || {};
        if (sessionData.playerProgress && sessionData.playerProgress.id === progressId) {
          targetGameId = game.id;
          currentProgress = sessionData.playerProgress;
          break;
        }
      }

      if (!targetGameId || !currentProgress) {
        throw new Error('Progress not found');
      }

      // Update the progress
      const updatedProgress = {
        ...currentProgress,
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Update the game's session_data
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('session_data')
        .eq('id', targetGameId)
        .single();

      if (gameError) throw gameError;

      const updatedSessionData = {
        ...gameData.session_data,
        playerProgress: updatedProgress
      };

      const { error: updateError } = await supabase
        .from('games')
        .update({ session_data: updatedSessionData })
        .eq('id', targetGameId);

      if (updateError) throw updateError;

      return updatedProgress;
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
      const authState = authService.getCurrentState();
      const userId = authState.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const solution: GameSolution = {
        ...solutionData,
        id: `solution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        author_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as GameSolution;

      // Get current game data
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('game_data')
        .eq('id', solutionData.game_id)
        .eq('user_id', userId)
        .single();

      if (gameError) throw gameError;

      // Update game_data with new solution
      const currentGameData = gameData.game_data || {};
      const currentSolutions = currentGameData.solutions || [];
      
      const updatedSolutions = [...currentSolutions, solution];
      const updatedGameData = {
        ...currentGameData,
        solutions: updatedSolutions
      };

      // Update game's game_data
      const { error } = await supabase
        .from('games')
        .update({ game_data: updatedGameData })
        .eq('id', solutionData.game_id)
        .eq('user_id', userId);

      if (error) throw error;

      return solution;
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
      if (!filters.gameId) return [];

      // Get game data
      const { data: gameData, error } = await supabase
        .from('games')
        .select('game_data')
        .eq('id', filters.gameId)
        .single();

      if (error) throw error;

      // Extract solutions from game_data
      const currentGameData = gameData.game_data || {};
      const allSolutions = currentGameData.solutions || [];
      
      // Apply filters
      let filteredSolutions = allSolutions;
      
      if (filters.objectiveId) {
        filteredSolutions = filteredSolutions.filter((solution: GameSolution) => 
          solution.objective_id === filters.objectiveId
        );
      }
      
      if (filters.solutionType) {
        filteredSolutions = filteredSolutions.filter((solution: GameSolution) => 
          solution.solution_type === filters.solutionType
        );
      }
      
      if (filters.spoilerLevel) {
        filteredSolutions = filteredSolutions.filter((solution: GameSolution) => 
          solution.spoiler_level === filters.spoilerLevel
        );
      }

      // Sort by success rate and upvotes
      filteredSolutions.sort((a: GameSolution, b: GameSolution) => {
        if (a.success_rate !== b.success_rate) {
          return (b.success_rate || 0) - (a.success_rate || 0);
        }
        return (b.upvotes || 0) - (a.upvotes || 0);
      });

      return filteredSolutions;
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
      // Find the game that contains this solution
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('id, game_data')
        .not('game_data', 'is', null);

      if (gamesError) throw gamesError;

      let targetGameId: string | null = null;
      let currentSolution: GameSolution | null = null;

      // Find the game containing this solution
      for (const game of games || []) {
        const gameData = game.game_data || {};
        const solutions = gameData.solutions || [];
        const solution = solutions.find((s: GameSolution) => s.id === solutionId);
        if (solution) {
          targetGameId = game.id;
          currentSolution = solution;
          break;
        }
      }

      if (!targetGameId || !currentSolution) {
        throw new Error('Solution not found');
      }

      // Update the solution votes
      const updatedSolution = {
        ...currentSolution,
        upvotes: (currentSolution.upvotes || 0) + (isUpvote ? 1 : 0),
        downvotes: (currentSolution.downvotes || 0) + (isUpvote ? 0 : 1),
        updated_at: new Date().toISOString()
      };

      // Get current game data
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('game_data')
        .eq('id', targetGameId)
        .single();

      if (gameError) throw gameError;

      // Update the solutions array
      const currentGameData = gameData.game_data || {};
      const currentSolutions = currentGameData.solutions || [];
      const solutionIndex = currentSolutions.findIndex((s: GameSolution) => s.id === solutionId);
      
      if (solutionIndex === -1) {
        throw new Error('Solution not found in game data');
      }

      const updatedSolutions = [...currentSolutions];
      updatedSolutions[solutionIndex] = updatedSolution;

      const updatedGameData = {
        ...currentGameData,
        solutions: updatedSolutions
      };

      // Update the game's game_data
      const { error } = await supabase
        .from('games')
        .update({ game_data: updatedGameData })
        .eq('id', targetGameId);

      if (error) throw error;
    } catch (error) {
      console.error('Error voting on solution:', error);
      throw error;
    }
  }

  private async getSolutionUpvotes(solutionId: string): Promise<number> {
    try {
      // Find the game that contains this solution
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('game_data')
        .not('game_data', 'is', null);

      if (gamesError) throw gamesError;

      // Find the solution and return its upvotes
      for (const game of games || []) {
        const gameData = game.game_data || {};
        const solutions = gameData.solutions || [];
        const solution = solutions.find((s: GameSolution) => s.id === solutionId);
        if (solution) {
          return solution.upvotes || 0;
        }
      }

      return 0;
    } catch (error) {
      return 0;
    }
  }

  private async getSolutionDownvotes(solutionId: string): Promise<number> {
    try {
      // Find the game that contains this solution
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('game_data')
        .not('game_data', 'is', null);

      if (gamesError) throw gamesError;

      // Find the solution and return its downvotes
      for (const game of games || []) {
        const gameData = game.game_data || {};
        const solutions = gameData.solutions || [];
        const solution = solutions.find((s: GameSolution) => s.id === solutionId);
        if (solution) {
          return solution.downvotes || 0;
        }
      }

      return 0;
    } catch (error) {
      return 0;
    }
  }

  private async getQueryMappingUsageCount(mappingId: string): Promise<number> {
    try {
      // Find the game that contains this query mapping
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('game_data')
        .not('game_data', 'is', null);

      if (gamesError) throw gamesError;

      // Find the query mapping and return its usage count
      for (const game of games || []) {
        const gameData = game.game_data || {};
        const queryKnowledgeMap = gameData.queryKnowledgeMap || [];
        const mapping = queryKnowledgeMap.find((m: any) => m.id === mappingId);
        if (mapping) {
          return mapping.usage_count || 0;
        }
      }

      return 0;
    } catch (error) {
      return 0;
    }
  }

  private async calculateNewSuccessRate(mappingId: string, wasSuccessful: boolean): Promise<number> {
    try {
      // Find the game that contains this query mapping
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('game_data')
        .not('game_data', 'is', null);

      if (gamesError) throw gamesError;

      // Find the query mapping and calculate new success rate
      for (const game of games || []) {
        const gameData = game.game_data || {};
        const queryKnowledgeMap = gameData.queryKnowledgeMap || [];
        const mapping = queryKnowledgeMap.find((m: any) => m.id === mappingId);
        if (mapping) {
          const currentUsage = mapping.usage_count || 0;
          const currentRate = mapping.success_rate || 0;
          
          if (currentUsage === 0) {
            return wasSuccessful ? 1 : 0;
          }
          
          return (currentRate * currentUsage + (wasSuccessful ? 1 : 0)) / (currentUsage + 1);
        }
      }

      return wasSuccessful ? 1 : 0;
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
      if (!patternData.game_id) throw new Error('Game ID is required');

      // Get current game data
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('game_data')
        .eq('id', patternData.game_id)
        .single();

      if (gameError) throw gameError;

      // Update game_data with new knowledge pattern
      const currentGameData = gameData.game_data || {};
      const currentKnowledgePatterns = currentGameData.knowledgePatterns || [];
      
      // Check if pattern already exists
      const existingPatternIndex = currentKnowledgePatterns.findIndex((p: KnowledgePattern) => 
        p.pattern_key === patternData.pattern_key
      );

      let updatedPattern: KnowledgePattern;

      if (existingPatternIndex !== -1) {
        // Update existing pattern
        const existingPattern = currentKnowledgePatterns[existingPatternIndex];
        updatedPattern = {
          ...existingPattern,
          ...patternData,
          occurrence_count: (existingPattern.occurrence_count || 0) + 1,
          last_occurrence: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as KnowledgePattern;
      } else {
        // Create new pattern
        updatedPattern = {
          ...patternData,
          id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          occurrence_count: 1,
          first_occurrence: new Date().toISOString(),
          last_occurrence: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as KnowledgePattern;
      }

      // Update the patterns array
      const updatedKnowledgePatterns = [...currentKnowledgePatterns];
      if (existingPatternIndex !== -1) {
        updatedKnowledgePatterns[existingPatternIndex] = updatedPattern;
      } else {
        updatedKnowledgePatterns.push(updatedPattern);
      }

      const updatedGameData = {
        ...currentGameData,
        knowledgePatterns: updatedKnowledgePatterns
      };

      // Update game's game_data
      const { error } = await supabase
        .from('games')
        .update({ game_data: updatedGameData })
        .eq('id', patternData.game_id);

      if (error) throw error;

      return updatedPattern;
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
      // Get game data
      const { data: gameData, error } = await supabase
        .from('games')
        .select('game_data')
        .eq('id', gameId)
        .single();

      if (error) throw error;

      // Extract knowledge patterns from game_data
      const currentGameData = gameData.game_data || {};
      const knowledgePatterns = currentGameData.knowledgePatterns || [];
      
      // Find the specific pattern
      const pattern = knowledgePatterns.find((p: KnowledgePattern) => 
        p.pattern_key === patternKey
      );

      return pattern || null;
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
      if (!mappingData.game_id) throw new Error('Game ID is required');

      // Get current game data
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('game_data')
        .eq('id', mappingData.game_id)
        .single();

      if (gameError) throw gameError;

      // Update game_data with new query mapping
      const currentGameData = gameData.game_data || {};
      const currentQueryKnowledgeMap = currentGameData.queryKnowledgeMap || [];
      
      const newMapping: QueryKnowledgeMap = {
        ...mappingData,
        id: `mapping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        usage_count: 0,
        success_rate: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as QueryKnowledgeMap;

      const updatedQueryKnowledgeMap = [...currentQueryKnowledgeMap, newMapping];
      const updatedGameData = {
        ...currentGameData,
        queryKnowledgeMap: updatedQueryKnowledgeMap
      };

      // Update game's game_data
      const { error } = await supabase
        .from('games')
        .update({ game_data: updatedGameData })
        .eq('id', mappingData.game_id);

      if (error) throw error;

      return newMapping;
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
      // Find the game that contains this query mapping
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('id, game_data')
        .not('game_data', 'is', null);

      if (gamesError) throw gamesError;

      let targetGameId: string | null = null;
      let currentMapping: any = null;

      // Find the game containing this mapping
      for (const game of games || []) {
        const gameData = game.game_data || {};
        const queryKnowledgeMap = gameData.queryKnowledgeMap || [];
        const mapping = queryKnowledgeMap.find((m: any) => m.id === mappingId);
        if (mapping) {
          targetGameId = game.id;
          currentMapping = mapping;
          break;
        }
      }

      if (!targetGameId || !currentMapping) {
        throw new Error('Query mapping not found');
      }

      // Update the mapping
      const updatedMapping = {
        ...currentMapping,
        usage_count: (currentMapping.usage_count || 0) + 1,
        success_rate: await this.calculateNewSuccessRate(mappingId, wasSuccessful),
        last_used: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Get current game data
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('game_data')
        .eq('id', targetGameId)
        .single();

      if (gameError) throw gameError;

      // Update the query knowledge map array
      const currentGameData = gameData.game_data || {};
      const currentQueryKnowledgeMap = currentGameData.queryKnowledgeMap || [];
      const mappingIndex = currentQueryKnowledgeMap.findIndex((m: any) => m.id === mappingId);
      
      if (mappingIndex === -1) {
        throw new Error('Query mapping not found in game data');
      }

      const updatedQueryKnowledgeMap = [...currentQueryKnowledgeMap];
      updatedQueryKnowledgeMap[mappingIndex] = updatedMapping;

      const updatedGameData = {
        ...currentGameData,
        queryKnowledgeMap: updatedQueryKnowledgeMap
      };

      // Update the game's game_data
      const { error } = await supabase
        .from('games')
        .update({ game_data: updatedGameData })
        .eq('id', targetGameId);

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
        .from('games')
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
        gameId = game?.game_id; // Use game_id (string) instead of id (UUID)
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
      // Get all games with knowledge data
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('id, game_data')
        .not('game_data', 'is', null);

      if (gamesError) throw gamesError;

      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Clean up each game's knowledge data
      for (const game of games || []) {
        const gameData = game.game_data || {};
        let needsUpdate = false;
        let updatedGameData = { ...gameData };

        // Clean up knowledge patterns
        if (gameData.knowledgePatterns) {
          const originalPatterns = gameData.knowledgePatterns || [];
          const cleanedPatterns = originalPatterns.filter((pattern: any) => {
            const hasLowFrequency = (pattern.frequency_score || 0) < 0.1;
            const isOld = pattern.last_occurrence && pattern.last_occurrence < cutoffDate;
            return !(hasLowFrequency && isOld);
          });

          if (cleanedPatterns.length !== originalPatterns.length) {
            updatedGameData.knowledgePatterns = cleanedPatterns;
            needsUpdate = true;
          }
        }

        // Clean up query knowledge mappings
        if (gameData.queryKnowledgeMap) {
          const originalMappings = gameData.queryKnowledgeMap || [];
          const cleanedMappings = originalMappings.filter((mapping: any) => {
            const hasLowConfidence = (mapping.confidence_score || 0) < 0.3;
            const hasLowUsage = (mapping.usage_count || 0) < 5;
            return !(hasLowConfidence && hasLowUsage);
          });

          if (cleanedMappings.length !== originalMappings.length) {
            updatedGameData.queryKnowledgeMap = cleanedMappings;
            needsUpdate = true;
          }
        }

        // Update the game if changes were made
        if (needsUpdate) {
          await supabase
            .from('games')
            .update({ game_data: updatedGameData })
            .eq('id', game.id);
        }
      }

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
