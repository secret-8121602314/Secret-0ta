import { supabase } from './supabase';
import { authService } from './supabase';
import { supabaseDataService } from './supabaseDataService';
import { unifiedDataService, STORAGE_KEYS } from './unifiedDataService';
import { DetectedTask, DiaryTask } from './types';
import { playerProfileService } from './playerProfileService';
import { longTermMemoryService } from './longTermMemoryService';
import { progressTrackingService } from './progressTrackingService';
import { taskCompletionPromptingService } from './taskCompletionPromptingService';
import { ServiceFactory, BaseService } from './ServiceFactory';

// Diary task interface (moved to types.ts to break circular dependency)
// export interface DiaryTask {
//   id: string;
//   title: string;
//   description: string;
//   type: 'user_created' | 'ai_suggested';
//   status: 'pending' | 'completed' | 'need_help';
//   category: 'quest' | 'boss' | 'exploration' | 'item' | 'character' | 'custom';
//   createdAt: number;
//   completedAt?: number;
//   gameId: string;
//   source?: string; // AI response or user input
//   priority?: 'low' | 'medium' | 'high';
//   sourceMessageId?: string; // Link to original message/insight
// }

export interface DiaryFavorite {
  id: string;
  content: string;
  type: 'ai_response' | 'insight' | 'lore';
  gameId: string;
  createdAt: number;
  context?: string;
  sourceMessageId?: string;
  sourceInsightId?: string;
}

class OtakuDiaryService extends BaseService {
  private tasksCache: Map<string, DiaryTask[]> = new Map();
  private favoritesCache: Map<string, DiaryFavorite[]> = new Map();

  // Removed singleton pattern - using ServiceFactory instead

  constructor() {
    super();
    this.loadFromSupabase();
    
    // In development mode, also try to load from localStorage if available
    if (process.env.NODE_ENV === 'development') {
      this.loadFromLocalStorage();
    }
  }

  // Load data from Supabase
  private async loadFromSupabase(): Promise<void> {
    try {
      // Use unified data service for consistent pattern
      const result = await unifiedDataService.getUserAppState();
      const otakuDiary = result.data.otakuDiary || {};
      
      // Load tasks from Supabase
      Object.keys(otakuDiary).forEach(key => {
        if (key.startsWith('tasks_')) {
          const gameId = key.replace('tasks_', '');
          const tasks = otakuDiary[key];
          if (Array.isArray(tasks) && tasks.length > 0) {
            this.tasksCache.set(gameId, tasks);
            // Only log in development mode with reduced verbosity
            if (process.env.NODE_ENV === 'development' && tasks.length > 0) {
              console.log(`🔧 Loaded ${tasks.length} tasks for ${gameId}`);
            }
          }
        }
      });
      
      // Load favorites from Supabase
      Object.keys(otakuDiary).forEach(key => {
        if (key.startsWith('favorites_')) {
          const gameId = key.replace('favorites_', '');
          const favorites = otakuDiary[key];
          if (Array.isArray(favorites) && favorites.length > 0) {
            this.favoritesCache.set(gameId, favorites);
            // Only log in development mode with reduced verbosity
            if (process.env.NODE_ENV === 'development' && favorites.length > 0) {
              console.log(`🔧 Loaded ${favorites.length} favorites for ${gameId}`);
            }
          }
        }
      });
    } catch (error) {
      console.warn('Failed to load Otaku Diary data from Supabase:', error);
    }
  }

  // Load data from localStorage in development mode
  private async loadFromLocalStorage(): Promise<void> {
    try {
      // Reduced logging for development mode
      
      // Try to load from Supabase first
      await this.loadFromSupabase();
      
      // Fallback to localStorage if Supabase data is incomplete
      const taskKeys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_KEYS.TASKS_PREFIX));
      taskKeys.forEach(key => {
        const gameId = key.replace(STORAGE_KEYS.TASKS_PREFIX, '');
        const tasks = JSON.parse(localStorage.getItem(key) || '[]');
        if (tasks.length > 0) {
          this.tasksCache.set(gameId, tasks);
          console.log(`🔧 Loaded ${tasks.length} tasks for game ${gameId} from localStorage`);
        }
      });
      
      // Load favorites from localStorage
      const favoriteKeys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_KEYS.FAVORITES_PREFIX));
      favoriteKeys.forEach(key => {
        const gameId = key.replace(STORAGE_KEYS.FAVORITES_PREFIX, '');
        const favorites = JSON.parse(localStorage.getItem(key) || '[]');
        if (favorites.length > 0) {
          this.favoritesCache.set(gameId, favorites);
          console.log(`🔧 Loaded ${favorites.length} favorites for game ${gameId} from localStorage`);
        }
      });
      
      console.log('🔧 Development mode: localStorage loading complete');
    } catch (error) {
      console.warn('Failed to load Otaku Diary data from localStorage:', error);
    }
  }

  private mapSupabaseTaskToDiaryTask(supabaseTask: any): DiaryTask {
    return {
      id: supabaseTask.id,
      title: supabaseTask.title,
      description: supabaseTask.description || '',
      type: supabaseTask.metadata?.type || 'user_created',
      status: supabaseTask.status,
      category: supabaseTask.category || 'custom',
      createdAt: new Date(supabaseTask.created_at).getTime(),
      completedAt: supabaseTask.completed_at ? new Date(supabaseTask.completed_at).getTime() : undefined,
      gameId: supabaseTask.game_id,
      source: supabaseTask.metadata?.source,
      priority: supabaseTask.priority,
      sourceMessageId: supabaseTask.metadata?.source_message_id
    };
  }

  private mapSupabaseInsightToDiaryFavorite(supabaseInsight: any): DiaryFavorite {
    return {
      id: supabaseInsight.id,
      content: supabaseInsight.content,
      type: supabaseInsight.type as 'ai_response' | 'insight' | 'lore',
      gameId: supabaseInsight.game_id,
      createdAt: new Date(supabaseInsight.created_at).getTime(),
      context: supabaseInsight.metadata?.context,
      sourceMessageId: supabaseInsight.metadata?.source_message_id,
      sourceInsightId: supabaseInsight.id
    };
  }

  // Development mode localStorage fallback methods
  private async createTaskLocalStorage(task: Omit<DiaryTask, 'id' | 'createdAt'>): Promise<DiaryTask> {
    const newTask: DiaryTask = {
      ...task,
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now()
    };
    
    // Store in Supabase with localStorage fallback
    try {
      await this.updateOtakuDiaryInSupabase('tasks', task.gameId, newTask);
    } catch (error) {
      console.warn('Failed to update task in Supabase, using localStorage only:', error);
      
      // Fallback to localStorage only
      const storageKey = `otakon_tasks_${task.gameId}`;
      const existingTasks = JSON.parse(localStorage.getItem(storageKey) || '[]');
      existingTasks.push(newTask);
      localStorage.setItem(storageKey, JSON.stringify(existingTasks));
    }
    
    // Update local cache
    const gameTasks = this.tasksCache.get(task.gameId) || [];
    gameTasks.push(newTask);
    this.tasksCache.set(task.gameId, gameTasks);
    
    // Reduced logging for development mode
    return newTask;
  }

  private async updateOtakuDiaryInSupabase(type: 'tasks' | 'favorites', gameId: string, data: any): Promise<void> {
    try {
      const appState = await supabaseDataService.getUserAppState();
      const otakuDiary = appState.otakuDiary || {};
      
      if (type === 'tasks') {
        const gameTasks = this.tasksCache.get(gameId) || [];
        otakuDiary[`tasks_${gameId}`] = gameTasks;
      } else {
        const gameFavorites = this.favoritesCache.get(gameId) || [];
        otakuDiary[`favorites_${gameId}`] = gameFavorites;
      }
      
      await supabaseDataService.updateUserAppState('otakuDiary', otakuDiary);
    } catch (error) {
      console.warn('Failed to update Otaku Diary in Supabase:', error);
      throw error;
    }
  }

  private updateTaskLocalStorage(gameId: string, taskId: string, updates: Partial<DiaryTask>): DiaryTask | null {
    const storageKey = `otakon_tasks_${gameId}`;
    const existingTasks = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const taskIndex = existingTasks.findIndex((t: DiaryTask) => t.id === taskId);
    
    if (taskIndex === -1) return null;
    
    const updatedTask = { ...existingTasks[taskIndex], ...updates };
    existingTasks[taskIndex] = updatedTask;
    localStorage.setItem(storageKey, JSON.stringify(existingTasks));
    
    // Update cache
    this.updateTaskInCache(updatedTask);
    
    console.log('🔧 Development mode: Task updated in localStorage:', updatedTask);
    return updatedTask;
  }

  private deleteTaskLocalStorage(gameId: string, taskId: string): boolean {
    const storageKey = `otakon_tasks_${gameId}`;
    const existingTasks = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const filteredTasks = existingTasks.filter((t: DiaryTask) => t.id !== taskId);
    
    if (filteredTasks.length === existingTasks.length) return false;
    
    localStorage.setItem(storageKey, JSON.stringify(filteredTasks));
    
    // Remove from cache
    this.removeTaskFromCache(gameId, taskId);
    
    console.log('🔧 Development mode: Task deleted from localStorage:', taskId);
    return true;
  }

  private getTasksLocalStorage(gameId: string): DiaryTask[] {
    const storageKey = `otakon_tasks_${gameId}`;
    const tasks = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Update cache
    this.tasksCache.set(gameId, tasks);
    
    console.log('🔧 Development mode: Tasks loaded from localStorage:', tasks);
    return tasks;
  }

  // Development mode localStorage fallback methods for favorites
  private addFavoriteLocalStorage(favorite: Omit<DiaryFavorite, 'id' | 'createdAt'>): DiaryFavorite {
    const newFavorite: DiaryFavorite = {
      ...favorite,
      id: `local_fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now()
    };
    
    // Store in localStorage
    const storageKey = `otakon_favorites_${favorite.gameId}`;
    const existingFavorites = JSON.parse(localStorage.getItem(storageKey) || '[]');
    existingFavorites.push(newFavorite);
    localStorage.setItem(storageKey, JSON.stringify(existingFavorites));
    
    // Update local cache
    const gameFavorites = this.favoritesCache.get(favorite.gameId) || [];
    gameFavorites.push(newFavorite);
    this.favoritesCache.set(favorite.gameId, gameFavorites);
    
    console.log('🔧 Development mode: Favorite added to localStorage:', newFavorite);
    return newFavorite;
  }

  private removeFavoriteLocalStorage(gameId: string, favoriteId: string): boolean {
    const storageKey = `otakon_favorites_${gameId}`;
    const existingFavorites = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const filteredFavorites = existingFavorites.filter((f: DiaryFavorite) => f.id !== favoriteId);
    
    if (filteredFavorites.length === existingFavorites.length) return false;
    
    localStorage.setItem(storageKey, JSON.stringify(filteredFavorites));
    
    // Remove from cache
    const gameFavorites = this.favoritesCache.get(gameId) || [];
    const filteredCacheFavorites = gameFavorites.filter(fav => fav.id !== favoriteId);
    this.favoritesCache.set(gameId, filteredCacheFavorites);
    
    console.log('🔧 Development mode: Favorite removed from localStorage:', favoriteId);
    return true;
  }

  private getFavoritesLocalStorage(gameId: string): DiaryFavorite[] {
    const storageKey = `otakon_favorites_${gameId}`;
    const favorites = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Update cache
    this.favoritesCache.set(gameId, favorites);
    
    console.log('🔧 Development mode: Favorites loaded from localStorage:', favorites);
    return favorites.sort((a: DiaryFavorite, b: DiaryFavorite) => b.createdAt - a.createdAt);
  }

  // Task Management
  async createTask(task: Omit<DiaryTask, 'id' | 'createdAt'>): Promise<DiaryTask> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Development mode fallback: use localStorage if not authenticated
      if (!user && process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Using localStorage fallback for task creation');
        return this.createTaskLocalStorage(task);
      }
      
      if (!user) throw new Error('User not authenticated');

      // Create task in existing tasks table
      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          game_id: task.gameId,
          title: task.title,
          description: task.description,
          status: task.status,
          category: task.category,
          priority: task.priority,
          metadata: {
            type: task.type,
            source: task.source,
            source_message_id: task.sourceMessageId
          }
        })
        .select()
        .single();

      if (error) throw error;

      const diaryTask = this.mapSupabaseTaskToDiaryTask(newTask);
      
      // Update local cache
      const gameTasks = this.tasksCache.get(task.gameId) || [];
      gameTasks.push(diaryTask);
      this.tasksCache.set(task.gameId, gameTasks);

      return diaryTask;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }

  // Update task with gameId and taskId parameters
  async updateTask(gameId: string, taskId: string, updates: Partial<DiaryTask>): Promise<DiaryTask | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Development mode fallback: use localStorage if not authenticated
      if (!user && process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Using localStorage fallback for task update');
        return this.updateTaskLocalStorage(gameId, taskId, updates);
      }
      
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('game_id', gameId)
        .select()
        .single();

      if (error) {
        console.error('Error updating task:', error);
        return null;
      }

      // Update cache
      this.updateTaskInCache(this.mapSupabaseTaskToDiaryTask(data));
      return this.mapSupabaseTaskToDiaryTask(data);
    } catch (error) {
      console.error('Error in updateTask:', error);
      return null;
    }
  }

  // Delete task with gameId and taskId parameters
  async deleteTask(gameId: string, taskId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Development mode fallback: use localStorage if not authenticated
      if (!user && process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Using localStorage fallback for task deletion');
        return this.deleteTaskLocalStorage(gameId, taskId);
      }
      
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('game_id', gameId);

      if (error) {
        console.error('Error deleting task:', error);
        return false;
      }

      // Remove from cache
      this.removeTaskFromCache(gameId, taskId);
      return true;
    } catch (error) {
      console.error('Error in deleteTask:', error);
      return false;
    }
  }

  async getTasks(gameId: string): Promise<DiaryTask[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Development mode fallback: use localStorage if not authenticated
      if (!user && process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Using localStorage fallback for getting tasks');
        return this.getTasksLocalStorage(gameId);
      }
      
      if (!user) return [];

      // Get tasks from new consolidated tasks table
      const { data: tasksData, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_id', gameId);

      if (error) throw error;

      // Update local cache
      const diaryTasks = tasksData.map(task => this.mapSupabaseTaskToDiaryTask(task));
      this.tasksCache.set(gameId, diaryTasks);

      return diaryTasks;
    } catch (error) {
      console.error('Failed to get tasks:', error);
      // Fallback to local cache
      return this.tasksCache.get(gameId) || [];
    }
  }

  // NEW: Get central tasks (user-created + AI-generated tasks they added)
  async getCentralTasks(gameId: string): Promise<DiaryTask[]> {
    try {
      const allTasks = await this.getTasks(gameId);
      // Central tasks are user-created tasks and AI-generated tasks that user has moved to central
      return allTasks.filter(task => 
        task.type === 'user_created' || 
        (task.type === 'ai_suggested' && task.status !== 'pending')
      );
    } catch (error) {
      console.error('Failed to get central tasks:', error);
      return [];
    }
  }

  // NEW: Get AI-generated tasks (for completion prompting)
  async getAISuggestedTasks(gameId: string): Promise<DiaryTask[]> {
    try {
      const allTasks = await this.getTasks(gameId);
      // AI-generated tasks are those that are still pending (not moved to central)
      return allTasks.filter(task => 
        task.type === 'ai_suggested' && task.status === 'pending'
      );
    } catch (error) {
      console.error('Failed to get AI suggested tasks:', error);
      return [];
    }
  }

  // Favorite Management
  async addFavorite(favorite: Omit<DiaryFavorite, 'id' | 'createdAt'>): Promise<DiaryFavorite> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Development mode fallback: use localStorage if not authenticated
      if (!user && process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Using localStorage fallback for adding favorite');
        return this.addFavoriteLocalStorage(favorite);
      }
      
      if (!user) throw new Error('User not authenticated');

      // Add favorite by updating user's app_state
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('app_state')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) throw userError;

      const currentAppState = userData.app_state || {};
      const currentFavorites = currentAppState.diaryFavorites || [];
      
      const diaryFavorite: DiaryFavorite = {
        id: `favorite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        gameId: favorite.gameId,
        content: favorite.content,
        type: favorite.type,
        sourceInsightId: favorite.sourceInsightId || favorite.sourceMessageId,
        sourceMessageId: favorite.sourceMessageId,
        createdAt: Date.now()
      };

      const updatedFavorites = [...currentFavorites, diaryFavorite];
      const updatedAppState = {
        ...currentAppState,
        diaryFavorites: updatedFavorites
      };

      const { error } = await supabase
        .from('users')
        .update({ app_state: updatedAppState })
        .eq('auth_user_id', user.id);

      if (error) throw error;
      
      // Update local cache
      const gameFavorites = this.favoritesCache.get(favorite.gameId) || [];
      gameFavorites.push(diaryFavorite);
      this.favoritesCache.set(favorite.gameId, gameFavorites);

      return diaryFavorite;
    } catch (error) {
      console.error('Failed to add favorite:', error);
      throw error;
    }
  }

  async removeFavorite(gameId: string, favoriteId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Development mode fallback: use localStorage if not authenticated
      if (!user && process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Using localStorage fallback for removing favorite');
        return this.removeFavoriteLocalStorage(gameId, favoriteId);
      }
      
      if (!user) throw new Error('User not authenticated');

      // Remove favorite by updating user's app_state
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('app_state')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) throw userError;

      const currentAppState = userData.app_state || {};
      const currentFavorites = currentAppState.diaryFavorites || [];
      
      const updatedFavorites = currentFavorites.filter(fav => fav.id !== favoriteId);
      const updatedAppState = {
        ...currentAppState,
        diaryFavorites: updatedFavorites
      };

      const { error } = await supabase
        .from('users')
        .update({ app_state: updatedAppState })
        .eq('auth_user_id', user.id);

      if (error) throw error;

      // Remove from local cache
      const gameFavorites = this.favoritesCache.get(gameId) || [];
      const filteredFavorites = gameFavorites.filter(fav => fav.id !== favoriteId);
      this.favoritesCache.set(gameId, filteredFavorites);

      return true;
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      return false;
    }
  }

  async getFavorites(gameId: string): Promise<DiaryFavorite[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Development mode fallback: use localStorage if not authenticated
      if (!user && process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Using localStorage fallback for getting favorites');
        return this.getFavoritesLocalStorage(gameId);
      }
      
      if (!user) return [];

      // Get favorites from user's app_state
      const { data: userData, error } = await supabase
        .from('users')
        .select('app_state')
        .eq('auth_user_id', user.id)
        .single();

      if (error) throw error;

      const currentAppState = userData.app_state || {};
      const allFavorites = currentAppState.diaryFavorites || [];
      
      // Filter by gameId
      const gameFavorites = allFavorites.filter(fav => fav.gameId === gameId);
      
      // Update local cache
      this.favoritesCache.set(gameId, gameFavorites);

      // Return in chronological order (newest first)
      return gameFavorites.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Failed to get favorites:', error);
      // Fallback to local cache
      const gameFavorites = this.favoritesCache.get(gameId) || [];
      return gameFavorites.sort((a, b) => b.createdAt - a.createdAt);
    }
  }

  async isFavorited(gameId: string, sourceId: string, type: 'message' | 'insight'): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Development mode fallback: use localStorage if not authenticated
      if (!user && process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Using localStorage fallback for checking favorite status');
        const gameFavorites = this.getFavoritesLocalStorage(gameId);
        const field = type === 'message' ? 'sourceMessageId' : 'sourceInsightId';
        return gameFavorites.some(fav => fav[field] === sourceId);
      }
      
      if (!user) return false;

      // Check if insight is favorited in user's app_state
      const { data: userData, error } = await supabase
        .from('users')
        .select('app_state')
        .eq('auth_user_id', user.id)
        .single();

      if (error) return false;

      const currentAppState = userData.app_state || {};
      const allFavorites = currentAppState.diaryFavorites || [];
      
      // Check if sourceId exists in favorites
      const isFavorited = allFavorites.some(fav => 
        fav.sourceInsightId === sourceId || fav.sourceMessageId === sourceId
      );

      return isFavorited;
    } catch (error) {
      console.error('Failed to check favorite status:', error);
      // Fallback to local cache
      const gameFavorites = this.favoritesCache.get(gameId) || [];
      const field = type === 'message' ? 'sourceMessageId' : 'sourceInsightId';
      return gameFavorites.some(fav => fav[field] === sourceId);
    }
  }

  // Progress Tracking
  async getGameProgress(gameId: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    needHelpTasks: number;
    completionPercentage: number;
  }> {
    const allTasks = await this.getTasks(gameId);
    const completedTasks = allTasks.filter(task => task.status === 'completed');
    const pendingTasks = allTasks.filter(task => task.status === 'pending');
    const needHelpTasks = allTasks.filter(task => task.status === 'need_help');

    return {
      totalTasks: allTasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: pendingTasks.length,
      needHelpTasks: needHelpTasks.length,
      completionPercentage: allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0
    };
  }

  // Mark task as complete
  async markTaskComplete(gameId: string, taskId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get the task before updating to track completion
      const tasks = this.tasksCache.get(gameId) || [];
      const task = tasks.find(t => t.id === taskId);
      
      // Development mode fallback: use localStorage if not authenticated
      if (!user && process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Using localStorage fallback for marking task complete');
        const result = this.updateTaskLocalStorage(gameId, taskId, { 
          status: 'completed', 
          completedAt: Date.now() 
        }) !== null;
        
        // NEW: Track task completion in AI context
        if (result && task) {
          await this.trackTaskCompletion(gameId, task);
        }
        
        return result;
      }
      
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('game_id', gameId);

      if (error) {
        console.error('Error marking task complete:', error);
        return false;
      }

      // Update cache by finding and updating the task
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], status: 'completed', completedAt: Date.now() };
        this.tasksCache.set(gameId, tasks);
        
        // NEW: Track task completion in AI context
        if (task) {
          await this.trackTaskCompletion(gameId, task);
        }
      }
      return true;
    } catch (error) {
      console.error('Error in markTaskComplete:', error);
      return false;
    }
  }

  // Mark task as needing help
  async markTaskNeedHelp(gameId: string, taskId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Development mode fallback: use localStorage if not authenticated
      if (!user && process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Using localStorage fallback for marking task as needing help');
        return this.updateTaskLocalStorage(gameId, taskId, { status: 'need_help' }) !== null;
      }
      
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .update({ status: 'need_help' })
        .eq('id', taskId)
        .eq('game_id', gameId);

      if (error) {
        console.error('Error marking task as needing help:', error);
        return false;
      }

      // Update cache by finding and updating the task
      const tasks = this.tasksCache.get(gameId) || [];
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], status: 'need_help' };
        this.tasksCache.set(gameId, tasks);
      }
      return true;
    } catch (error) {
      console.error('Error in markTaskNeedHelp:', error);
      return false;
    }
  }

  // Move task to user created
  async moveTaskToUserCreated(gameId: string, taskId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Development mode fallback: use localStorage if not authenticated
      if (!user && process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Using localStorage fallback for moving task to user created');
        return this.updateTaskLocalStorage(gameId, taskId, { type: 'user_created' }) !== null;
      }
      
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .update({ 
          type: 'user_created',
          metadata: { type: 'user_created' }
        })
        .eq('id', taskId)
        .eq('game_id', gameId);

      if (error) {
        console.error('Error moving task to user created:', error);
        return false;
      }

      // Update cache by finding and updating the task
      const tasks = this.tasksCache.get(gameId) || [];
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], type: 'user_created' };
        this.tasksCache.set(gameId, tasks);
      }
      return true;
    } catch (error) {
      console.error('Error in moveTaskToUserCreated:', error);
      return false;
    }
  }

  // Cache Management
  private updateTaskInCache(updatedTask: DiaryTask): void {
    const gameTasks = this.tasksCache.get(updatedTask.gameId) || [];
    const taskIndex = gameTasks.findIndex(task => task.id === updatedTask.id);
    if (taskIndex !== -1) {
      gameTasks[taskIndex] = updatedTask;
      this.tasksCache.set(updatedTask.gameId, gameTasks);
    }
  }

  private removeTaskFromCache(gameId: string, taskId: string): void {
    const gameTasks = this.tasksCache.get(gameId) || [];
    const filteredTasks = gameTasks.filter(task => task.id !== taskId);
    if (filteredTasks.length !== gameTasks.length) {
      this.tasksCache.set(gameId, filteredTasks);
    }
  }

  // Utility Methods
  async clearGameData(gameId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Clear tasks for this game
      await supabase
        .from('tasks')
        .delete()
        .eq('user_id', user.id)
        .eq('game_id', gameId);

      // Clear favorites for this game from user's app_state
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('app_state')
        .eq('auth_user_id', user.id)
        .single();

      if (!userError) {
        const currentAppState = userData.app_state || {};
        const currentFavorites = currentAppState.diaryFavorites || [];
        
        // Filter out favorites for this game
        const updatedFavorites = currentFavorites.filter(fav => fav.gameId !== gameId);
        const updatedAppState = {
          ...currentAppState,
          diaryFavorites: updatedFavorites
        };

        await supabase
          .from('users')
          .update({ app_state: updatedAppState })
          .eq('auth_user_id', user.id);
      }

      // Clear local cache
      this.tasksCache.delete(gameId);
      this.favoritesCache.delete(gameId);
    } catch (error) {
      console.error('Failed to clear game data:', error);
    }
  }

  async getAllGameIds(): Promise<string[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get unique game IDs from tasks table
      const { data: tasksData, error } = await supabase
        .from('tasks')
        .select('game_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const gameIds = [...new Set(tasksData.map(task => task.game_id).filter((id): id is string => typeof id === 'string'))];
      return gameIds;
    } catch (error) {
      console.error('Failed to get game IDs:', error);
      // Fallback to local cache
      return Array.from(this.tasksCache.keys());
    }
  }

  // Save tasks to both Supabase and localStorage
  async saveTasks(gameId: string, tasks: DiaryTask[]): Promise<void> {
    try {
      // Use unified data service for consistent pattern
      await unifiedDataService.setOtakuDiaryData(gameId, { tasks });
      
      // Update local cache
      this.tasksCache.set(gameId, tasks);
      
      console.log(`✅ Saved ${tasks.length} tasks for game ${gameId}`);
    } catch (error) {
      console.error('Failed to save tasks:', error);
      throw error;
    }
  }

  // Save favorites to both Supabase and localStorage
  async saveFavorites(gameId: string, favorites: DiaryFavorite[]): Promise<void> {
    try {
      // Use unified data service for consistent pattern
      await unifiedDataService.setOtakuDiaryData(gameId, { favorites });
      
      // Update local cache
      this.favoritesCache.set(gameId, favorites);
      
      console.log(`✅ Saved ${favorites.length} favorites for game ${gameId}`);
    } catch (error) {
      console.error('Failed to save favorites:', error);
      throw error;
    }
  }

  // NEW: Refresh AI suggested tasks based on context
  async refreshAISuggestedTasks(
    gameId: string,
    userQuery: string,
    aiResponse: string,
    context: {
      longTermContext: string;
      screenshotTimelineContext: string;
      insightTabContext: string;
    }
  ): Promise<void> {
    try {
      // Get current AI suggested tasks
      const currentTasks = await this.getTasks(gameId);
      
      // Generate new tasks based on context (this would be called from unifiedAIService)
      // For now, we'll create a placeholder that can be enhanced
      const newTasks = await this.generateContextAwareTasks(
        gameId,
        userQuery,
        aiResponse,
        context
      );
      
      // Remove outdated tasks and add new ones
      await this.updateAISuggestedTasks(gameId, currentTasks, newTasks);
      
      console.log(`🔄 Refreshed AI suggested tasks for ${gameId}: ${newTasks.length} new tasks`);
    } catch (error) {
      console.error('Failed to refresh AI suggested tasks:', error);
    }
  }

  // NEW: Generate context-aware tasks (placeholder for now)
  private async generateContextAwareTasks(
    gameId: string,
    userQuery: string,
    aiResponse: string,
    context: {
      longTermContext: string;
      screenshotTimelineContext: string;
      insightTabContext: string;
    }
  ): Promise<DetectedTask[]> {
    // This would typically call the unifiedAIService to generate tasks
    // For now, return empty array as tasks are generated in unifiedAIService
    return [];
  }

  // NEW: Update AI suggested tasks intelligently
  private async updateAISuggestedTasks(
    gameId: string,
    currentTasks: DiaryTask[],
    newTasks: DetectedTask[]
  ): Promise<void> {
    // Remove tasks that are no longer relevant
    const relevantTasks = currentTasks.filter(task => 
      this.isTaskStillRelevant(task, newTasks)
    );
    
    // Add new tasks that don't duplicate existing ones
    const uniqueNewTasks = newTasks.filter(newTask =>
      !this.taskExists(relevantTasks, newTask)
    );
    
    // Convert to DiaryTask format and save
    const tasksToAdd = uniqueNewTasks.map(task => ({
      id: this.generateId(),
      title: task.title,
      description: task.description,
      type: 'ai_suggested' as const,
      status: 'pending' as const,
      category: task.category,
      priority: 'medium' as const,
      gameId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      source: task.source
    }));
    
    // Save updated tasks
    await this.saveTasks(gameId, [...relevantTasks, ...tasksToAdd]);
  }

  // NEW: Check if task is still relevant
  private isTaskStillRelevant(task: DiaryTask, newTasks: DetectedTask[]): boolean {
    // Simple relevance check - can be enhanced
    const taskAge = Date.now() - task.createdAt;
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    // Keep tasks that are recent or completed
    if (taskAge < maxAge || task.status === 'completed') {
      return true;
    }
    
    // Check if task is similar to new tasks
    return !newTasks.some(newTask => 
      this.tasksAreSimilar(task, newTask)
    );
  }

  // NEW: Check if tasks are similar
  private tasksAreSimilar(task: DiaryTask, newTask: DetectedTask): boolean {
    const taskTitle = task.title.toLowerCase();
    const newTaskTitle = newTask.title.toLowerCase();
    
    // Simple similarity check - can be enhanced with better algorithms
    return taskTitle.includes(newTaskTitle) || newTaskTitle.includes(taskTitle);
  }

  // NEW: Check if task already exists
  private taskExists(tasks: DiaryTask[], newTask: DetectedTask): boolean {
    return tasks.some(task => 
      task.title.toLowerCase() === newTask.title.toLowerCase() ||
      this.tasksAreSimilar(task, newTask)
    );
  }

  // NEW: Generate unique ID
  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // NEW: Add AI suggested tasks from unifiedAIService
  async addAISuggestedTasks(gameId: string, tasks: DetectedTask[]): Promise<void> {
    try {
      const currentTasks = await this.getTasks(gameId);
      const newTasks = tasks.map(task => ({
        id: this.generateId(),
        title: task.title,
        description: task.description,
        type: 'ai_suggested' as const,
        status: 'pending' as const,
        category: task.category,
        priority: 'medium' as const,
        gameId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: task.source
      }));
      
      // Filter out duplicates
      const uniqueNewTasks = newTasks.filter(newTask => {
        const detectedTask: DetectedTask = {
          title: newTask.title,
          description: newTask.description,
          category: newTask.category,
          confidence: 0.8, // Default confidence for AI suggested tasks
          source: newTask.source
        };
        return !this.taskExists(currentTasks, detectedTask);
      });
      
      if (uniqueNewTasks.length > 0) {
        await this.saveTasks(gameId, [...currentTasks, ...uniqueNewTasks]);
        console.log(`✅ Added ${uniqueNewTasks.length} AI suggested tasks for ${gameId}`);
      }
    } catch (error) {
      console.error('Failed to add AI suggested tasks:', error);
    }
  }

  // NEW: Track task completion and update AI context
  private async trackTaskCompletion(gameId: string, task: DiaryTask): Promise<void> {
    try {
      // Using static imports instead of dynamic imports for Firebase hosting compatibility
      
      // Create completion event data
      const completionEvent = {
        taskId: task.id,
        title: task.title,
        description: task.description,
        category: task.category,
        completedAt: Date.now(),
        type: 'task_completion'
      };
      
      // Track in long-term memory
      await longTermMemoryService.trackInteraction(gameId, 'progress', completionEvent);
      
      // Track in progress tracking service
      // await progressTrackingService.trackProgressEvent(gameId, {
      //   type: 'task_completion',
      //   data: completionEvent,
      //   timestamp: Date.now()
      // });
      
      // NEW: Record completion in task completion prompting service for next query context
      taskCompletionPromptingService.recordCompletionResponse(gameId, task.id, true);
      
      // Update player profile with completion
      await this.updatePlayerProfileWithCompletion(gameId, task);
      
      console.log(`🎯 Tracked task completion: ${task.title} for ${gameId}`);
    } catch (error) {
      console.warn('Failed to track task completion:', error);
    }
  }

  // NEW: Update player profile with task completion
  private async updatePlayerProfileWithCompletion(gameId: string, task: DiaryTask): Promise<void> {
    try {
      // Create profile update based on task category
      const profileUpdate = this.createProfileUpdateFromTask(task);
      
      if (profileUpdate) {
        await playerProfileService.updateGameContext(gameId, profileUpdate);
        console.log(`📊 Updated player profile with task completion: ${task.category}`);
      }
    } catch (error) {
      console.warn('Failed to update player profile with task completion:', error);
    }
  }

  // NEW: Create profile update from completed task
  private createProfileUpdateFromTask(task: DiaryTask): any {
    const baseUpdate = {
      lastTaskCompletion: {
        taskId: task.id,
        title: task.title,
        category: task.category,
        completedAt: Date.now()
      }
    };

    // Add category-specific updates
    switch (task.category) {
      case 'boss':
        return {
          ...baseUpdate,
          bossDefeated: true,
          lastBossDefeated: task.title,
          combatProgress: 'advanced'
        };
      
      case 'exploration':
        return {
          ...baseUpdate,
          explorationProgress: 'advanced',
          lastAreaExplored: task.title,
          discoveryCount: 1
        };
      
      case 'item':
        return {
          ...baseUpdate,
          itemAcquired: true,
          lastItemFound: task.title,
          collectionProgress: 'advanced'
        };
      
      case 'quest':
        return {
          ...baseUpdate,
          questCompleted: true,
          lastQuestCompleted: task.title,
          storyProgress: 'advanced'
        };
      
      case 'character':
        return {
          ...baseUpdate,
          characterInteraction: true,
          lastCharacterMet: task.title,
          socialProgress: 'advanced'
        };
      
      default:
        return baseUpdate;
    }
  }
}

// Export singleton instance using ServiceFactory
let _otakuDiaryService: OtakuDiaryService | null = null;
export const otakuDiaryService = (() => {
  if (!_otakuDiaryService) {
    _otakuDiaryService = ServiceFactory.create(OtakuDiaryService);
  }
  return _otakuDiaryService;
})();
