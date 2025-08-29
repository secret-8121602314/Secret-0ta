import { supabase } from './supabase';
import { authService } from './supabase';
import { DiaryTask, DiaryFavorite } from './types';

export interface GameProgress {
  id: string;
  sessionDate: string;
  duration: number;
  objectivesCompleted: string[];
  discoveries: string[];
  notes: string;
  createdAt: string;
}

export interface GameProgressSummary {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  needHelpTasks: number;
  completionPercentage: number;
}

class OtakuDiarySupabaseService {
  private static instance: OtakuDiarySupabaseService;

  static getInstance(): OtakuDiarySupabaseService {
    if (!OtakuDiarySupabaseService.instance) {
      OtakuDiarySupabaseService.instance = new OtakuDiarySupabaseService();
    }
    return OtakuDiarySupabaseService.instance;
  }

  // ========================================
  // GAME MANAGEMENT
  // ========================================

  async createGame(title: string, genre?: string): Promise<string | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .from('games')
        .insert({
          user_id: userId,
          title,
          genre,
          progress: 0,
          playthrough_count: 1
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating game:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error creating game:', error);
      return null;
    }
  }

  async getGame(gameId: string): Promise<any | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error getting game:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting game:', error);
      return null;
    }
  }

  async updateGameProgress(gameId: string, progress: number): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const { error } = await supabase
        .from('games')
        .update({
          progress,
          last_session_date: new Date().toISOString()
        })
        .eq('id', gameId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating game progress:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating game progress:', error);
      return false;
    }
  }

  // ========================================
  // TASK MANAGEMENT
  // ========================================

  async createTask(task: Omit<DiaryTask, 'id' | 'createdAt'>): Promise<DiaryTask | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .from('diary_tasks')
        .insert({
          user_id: userId,
          game_id: task.gameId,
          title: task.title,
          description: task.description,
          type: task.type,
          status: task.status,
          category: task.category,
          priority: task.priority,
          source: task.source,
          source_message_id: task.sourceMessageId
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error creating task:', error);
        return null;
      }

      return this.mapDatabaseTaskToDiaryTask(data);
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    }
  }

  async updateTask(gameId: string, taskId: string, updates: Partial<DiaryTask>): Promise<DiaryTask | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      const updateData: any = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.status) updateData.status = updates.status;
      if (updates.category) updateData.category = updates.category;
      if (updates.priority) updateData.priority = updates.priority;
      if (updates.status === 'completed') updateData.completed_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('diary_tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating task:', error);
        return null;
      }

      return this.mapDatabaseTaskToDiaryTask(data);
    } catch (error) {
      console.error('Error updating task:', error);
      return null;
    }
  }

  async deleteTask(gameId: string, taskId: string): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const { error } = await supabase
        .from('diary_tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', userId)
        .eq('game_id', gameId);

      if (error) {
        console.error('Error deleting task:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  async getTasks(gameId: string): Promise<DiaryTask[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('diary_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting tasks:', error);
        return [];
      }

      return data.map(this.mapDatabaseTaskToDiaryTask);
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  }

  async getGameProgressSummary(gameId: string): Promise<GameProgressSummary | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .rpc('get_game_progress_summary', {
          p_user_id: userId,
          p_game_id: gameId
        });

      if (error) {
        console.error('Error getting progress summary:', error);
        return null;
      }

      if (data && data.length > 0) {
        const summary = data[0];
        return {
          totalTasks: summary.total_tasks || 0,
          completedTasks: summary.completed_tasks || 0,
          pendingTasks: summary.pending_tasks || 0,
          needHelpTasks: summary.need_help_tasks || 0,
          completionPercentage: summary.completion_percentage || 0
        };
      }

      return {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        needHelpTasks: 0,
        completionPercentage: 0
      };
    } catch (error) {
      console.error('Error getting progress summary:', error);
      return null;
    }
  }

  // ========================================
  // FAVORITES MANAGEMENT
  // ========================================

  async addFavorite(favorite: Omit<DiaryFavorite, 'id' | 'createdAt'>): Promise<DiaryFavorite | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .from('diary_favorites')
        .insert({
          user_id: userId,
          game_id: favorite.gameId,
          content: favorite.content,
          type: favorite.type,
          context: favorite.context,
          source_message_id: favorite.sourceMessageId,
          source_insight_id: favorite.sourceInsightId
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error adding favorite:', error);
        return null;
      }

      return this.mapDatabaseFavoriteToDiaryFavorite(data);
    } catch (error) {
      console.error('Error adding favorite:', error);
      return null;
    }
  }

  async removeFavorite(gameId: string, favoriteId: string): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const { error } = await supabase
        .from('diary_favorites')
        .delete()
        .eq('id', favoriteId)
        .eq('user_id', userId)
        .eq('game_id', gameId);

      if (error) {
        console.error('Error removing favorite:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  }

  async getFavorites(gameId: string): Promise<DiaryFavorite[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('diary_favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting favorites:', error);
        return [];
      }

      return data.map(this.mapDatabaseFavoriteToDiaryFavorite);
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  async isFavorited(gameId: string, sourceId: string, type: 'message' | 'insight'): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const field = type === 'message' ? 'source_message_id' : 'source_insight_id';
      
      const { data, error } = await supabase
        .from('diary_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .eq(field, sourceId)
        .limit(1);

      if (error) {
        console.error('Error checking favorite status:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  // ========================================
  // PROGRESS TRACKING
  // ========================================

  async addGameProgress(gameId: string, progress: GameProgress): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const { error } = await supabase
        .from('game_progress')
        .insert({
          user_id: userId,
          game_id: gameId,
          session_date: progress.sessionDate,
          duration: progress.duration,
          objectives_completed: progress.objectivesCompleted,
          discoveries: progress.discoveries,
          notes: progress.notes
        });

      if (error) {
        console.error('Error adding game progress:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error adding game progress:', error);
      return false;
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  private async getCurrentUserId(): Promise<string | null> {
    const userId = await authService.getCurrentUserId();
    return userId || null;
  }

  private mapDatabaseTaskToDiaryTask(dbTask: any): DiaryTask {
    return {
      id: dbTask.id,
      title: dbTask.title,
      description: dbTask.description,
      type: dbTask.type,
      status: dbTask.status,
      category: dbTask.category,
      priority: dbTask.priority,
      createdAt: new Date(dbTask.created_at).getTime(),
      completedAt: dbTask.completed_at ? new Date(dbTask.completed_at).getTime() : undefined,
      gameId: dbTask.game_id,
      source: dbTask.source,
      sourceMessageId: dbTask.source_message_id
    };
  }

  private mapDatabaseFavoriteToDiaryFavorite(dbFavorite: any): DiaryFavorite {
    return {
      id: dbFavorite.id,
      content: dbFavorite.content,
      type: dbFavorite.type,
      gameId: dbFavorite.game_id,
      createdAt: new Date(dbFavorite.created_at).getTime(),
      context: dbFavorite.context,
      sourceMessageId: dbFavorite.source_message_id,
      sourceInsightId: dbFavorite.source_insight_id
    };
  }

  // ========================================
  // MIGRATION HELPERS
  // ========================================

  async migrateFromLocalStorage(localData: any): Promise<boolean> {
    try {
      // This would handle migrating existing localStorage data to Supabase
      // Implementation depends on your specific data structure
      console.log('Migration not yet implemented');
      return true;
    } catch (error) {
      console.error('Error migrating data:', error);
      return false;
    }
  }
}

export const otakuDiarySupabaseService = OtakuDiarySupabaseService.getInstance();
