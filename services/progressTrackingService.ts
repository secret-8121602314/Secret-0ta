import { supabase } from './supabase';

export interface GameProgress {
  current_progress_level: number;
  game_version: string;
  completed_events: string[];
  progress_metadata: any;
  last_progress_update: string;
  progress_confidence: number;
}

export interface GameEvent {
  id: string;
  game_id: string;
  game_version: string;
  event_id: string;
  event_type: string;
  description: string;
  unlocks_progress_level: number;
  lore_context?: string;
  difficulty_rating: number;
}

export interface ProgressHistory {
  id: string;
  user_id: string;
  game_id: string;
  game_version: string;
  event_id: string;
  old_level: number;
  new_level: number;
  ai_confidence: number;
  ai_reasoning: string;
  ai_evidence: string[];
  user_feedback: string;
  created_at: string;
}

export interface ProgressUpdateResult {
  success: boolean;
  data?: any;
  message?: string;
  isDuplicate?: boolean;
  existingEventId?: string;
}

export class ProgressTrackingService {
  
  // Get user's current game progress with versioning
  async getUserGameProgress(
    userId: string, 
    gameId: string, 
    gameVersion: string = 'base_game'
  ): Promise<GameProgress> {
    const { data } = await supabase
      .from('games_new')
      .select(`
        current_progress_level,
        game_version,
        completed_events,
        progress_metadata,
        last_progress_update,
        progress_confidence
      `)
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .eq('game_version', gameVersion)
      .single();
    
    return data || {
      current_progress_level: 1,
      game_version: gameVersion,
      completed_events: [],
      progress_metadata: {},
      last_progress_update: new Date().toISOString(),
      progress_confidence: 1.0
    };
  }

  // Update progress based on AI-detected event with versioning
  async updateProgressFromEvent(
    userId: string,
    gameId: string,
    eventId: string,
    gameVersion: string = 'base_game',
    aiConfidence: number,
    aiReasoning: string,
    aiEvidence: string[]
  ): Promise<ProgressUpdateResult> {
    
    try {
      const response = await fetch('/api/progress/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          gameId,
          eventId,
          gameVersion,
          aiConfidence,
          aiReasoning,
          aiEvidence
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update progress');
      }

      const result = await response.json();
      
      // Check if this was a duplicate event
      if (result.existingEvent) {
        return {
          ...result,
          isDuplicate: true,
          existingEventId: result.existingEvent.id
        };
      }

      return result;

    } catch (error) {
      console.error('Progress update failed:', error);
      throw error;
    }
  }

  // Get available events for a game with versioning
  async getAvailableEvents(
    gameId: string, 
    currentLevel: number, 
    gameVersion: string = 'base_game'
  ): Promise<GameEvent[]> {
    const { data } = await supabase
      .from('game_progress_events')
      .select('*')
      .eq('game_id', gameId)
      .eq('game_version', gameVersion)
      .lte('unlocks_progress_level', currentLevel + 2) // Show next 2 levels
      .order('unlocks_progress_level', { ascending: true });
    
    return data || [];
  }

  // Get progress history with versioning
  async getProgressHistory(
    userId: string, 
    gameId: string, 
    gameVersion: string = 'base_game'
  ): Promise<ProgressHistory[]> {
    const { data } = await supabase
      .from('progress_history')
      .select(`
        *,
        game_progress_events!inner(description, event_type, lore_context)
      `)
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .eq('game_version', gameVersion)
      .order('created_at', { ascending: false });
    
    return data || [];
  }

  // Get or create progress event for any game
  async getOrCreateProgressEvent(
    gameId: string,
    eventType: string,
    description: string,
    progressLevel: number,
    gameVersion: string = 'base_game'
  ): Promise<string> {
    
    // First, try to find an existing event
    const { data: existingEvent } = await supabase
      .from('game_progress_events')
      .select('event_id')
      .eq('game_id', gameId)
      .eq('game_version', gameVersion)
      .eq('event_type', eventType)
      .eq('unlocks_progress_level', progressLevel)
      .single();
    
    if (existingEvent) {
      return existingEvent.event_id;
    }
    
    // If no existing event, try to find a universal event
    const { data: universalEvent } = await supabase
      .from('game_progress_events')
      .select('event_id')
      .eq('game_id', '*')
      .eq('event_type', eventType)
      .eq('unlocks_progress_level', progressLevel)
      .single();
    
    if (universalEvent) {
      // Use universal event as template, create game-specific version
      const { data: newEvent } = await supabase.rpc('create_dynamic_game_event', {
        p_game_id: gameId,
        p_event_type: eventType,
        p_description: description,
        p_progress_level: progressLevel,
        p_game_version: gameVersion,
        p_lore_context: `Game-specific ${eventType} event`,
        p_difficulty: 3
      });
      
      return newEvent?.event_id || universalEvent.event_id;
    }
    
    // If no universal event, create a completely new one
    const { data: newEvent } = await supabase.rpc('create_dynamic_game_event', {
      p_game_id: gameId,
      p_event_type: eventType,
      p_description: description,
      p_progress_level: progressLevel,
      p_game_version: gameVersion,
      p_lore_context: `Custom ${eventType} event for ${gameId}`,
      p_difficulty: 3
    });
    
    return newEvent?.event_id || 'unknown_event';
  }

  // Update progress for any game (with dynamic event creation)
  async updateProgressForAnyGame(
    userId: string,
    gameId: string,
    eventType: string,
    description: string,
    progressLevel: number,
    gameVersion: string = 'base_game',
    aiConfidence: number = 0.8,
    aiReasoning: string = 'User input analysis',
    aiEvidence: string[] = []
  ): Promise<ProgressUpdateResult> {
    
    console.log('🎮 Progress Tracking: Starting progress update', {
      userId,
      gameId,
      eventType,
      description,
      progressLevel,
      gameVersion,
      aiConfidence,
      aiReasoning,
      aiEvidence
    });
    
    try {
      // Get or create the appropriate event
      const eventId = await this.getOrCreateProgressEvent(
        gameId, eventType, description, progressLevel, gameVersion
      );
      
      console.log('🎮 Progress Tracking: Event ID resolved', { eventId });
      
      // Update progress using the existing function
      const result = await this.updateProgressFromEvent(
        userId, gameId, eventId, gameVersion, aiConfidence, aiReasoning, aiEvidence
      );
      
      console.log('🎮 Progress Tracking: Progress update completed', { result });
      return result;
      
    } catch (error) {
      console.error('🎮 Progress Tracking: Progress update failed', error);
      throw error;
    }
  }

  private async getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  }
}

export const progressTrackingService = new ProgressTrackingService();
