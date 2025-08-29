import { supabase } from './supabase';
import { authService } from './supabase';
import { supabaseDataService } from './supabaseDataService';

export interface DiaryTask {
  id: string;
  title: string;
  description: string;
  type: 'user_created' | 'ai_suggested';
  status: 'pending' | 'completed' | 'need_help';
  category: 'quest' | 'boss' | 'exploration' | 'item' | 'character' | 'custom';
  createdAt: number;
  completedAt?: number;
  gameId: string;
  source?: string; // AI response or user input
  priority?: 'low' | 'medium' | 'high';
  sourceMessageId?: string; // Link to original message/insight
}

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

class OtakuDiaryService {
  private static instance: OtakuDiaryService;
  private tasksCache: Map<string, DiaryTask[]> = new Map();
  private favoritesCache: Map<string, DiaryFavorite[]> = new Map();

  static getInstance(): OtakuDiaryService {
    if (!OtakuDiaryService.instance) {
      OtakuDiaryService.instance = new OtakuDiaryService();
    }
    return OtakuDiaryService.instance;
  }

  constructor() {
    this.loadFromSupabase();
    
    // In development mode, also try to load from localStorage if available
    if (process.env.NODE_ENV === 'development') {
      this.loadFromLocalStorage();
    }
  }

  // Load data from Supabase
  private async loadFromSupabase(): Promise<void> {
    try {
      const appState = await supabaseDataService.getUserAppState();
      const otakuDiary = appState.otakuDiary || {};
      
      // Load tasks from Supabase
      Object.keys(otakuDiary).forEach(key => {
        if (key.startsWith('tasks_')) {
          const gameId = key.replace('tasks_', '');
          const tasks = otakuDiary[key];
          if (Array.isArray(tasks) && tasks.length > 0) {
            this.tasksCache.set(gameId, tasks);
            console.log(`🔧 Loaded ${tasks.length} tasks for game ${gameId} from Supabase`);
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
            console.log(`🔧 Loaded ${favorites.length} favorites for game ${gameId} from Supabase`);
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
      console.log('🔧 Development mode: Loading Otaku Diary data from localStorage');
      
      // Try to load from Supabase first
      await this.loadFromSupabase();
      
      // Fallback to localStorage if Supabase data is incomplete
      const taskKeys = Object.keys(localStorage).filter(key => key.startsWith('otakon_tasks_'));
      taskKeys.forEach(key => {
        const gameId = key.replace('otakon_tasks_', '');
        const tasks = JSON.parse(localStorage.getItem(key) || '[]');
        if (tasks.length > 0) {
          this.tasksCache.set(gameId, tasks);
          console.log(`🔧 Loaded ${tasks.length} tasks for game ${gameId} from localStorage`);
        }
      });
      
      // Load favorites from localStorage
      const favoriteKeys = Object.keys(localStorage).filter(key => key.startsWith('otakon_favorites_'));
      favoriteKeys.forEach(key => {
        const gameId = key.replace('otakon_favorites_', '');
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
    
    console.log('🔧 Development mode: Task created:', newTask);
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

      // Create task in new consolidated tasks table
      const { data: newTask, error } = await supabase
        .from('tasks_new')
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
        .from('tasks_new')
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
        .from('tasks_new')
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
        .from('tasks_new')
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

      // Add favorite by updating the insight's is_favorite flag
      const { data: updatedInsight, error } = await supabase
        .from('insights_new')
        .update({ is_favorite: true })
        .eq('id', favorite.sourceInsightId || favorite.sourceMessageId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const diaryFavorite = this.mapSupabaseInsightToDiaryFavorite(updatedInsight);
      
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

      // Remove favorite by updating the insight's is_favorite flag
      const { error } = await supabase
        .from('insights_new')
        .update({ is_favorite: false })
        .eq('id', favoriteId)
        .eq('user_id', user.id);

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

      // Get favorites from new consolidated insights table
      const { data: favoritesData, error } = await supabase
        .from('insights_new')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_id', gameId)
        .eq('is_favorite', true);

      if (error) throw error;

      // Update local cache
      const diaryFavorites = favoritesData.map(insight => this.mapSupabaseInsightToDiaryFavorite(insight));
      this.favoritesCache.set(gameId, diaryFavorites);

      // Return in chronological order (newest first)
      return diaryFavorites.sort((a, b) => b.createdAt - a.createdAt);
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

      // Check if insight is favorited in new consolidated insights table
      const { data: insight, error } = await supabase
        .from('insights_new')
        .select('is_favorite')
        .eq('id', sourceId)
        .eq('user_id', user.id)
        .single();

      if (error) return false;
      return insight?.is_favorite || false;
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
      
      // Development mode fallback: use localStorage if not authenticated
      if (!user && process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Using localStorage fallback for marking task complete');
        return this.updateTaskLocalStorage(gameId, taskId, { 
          status: 'completed', 
          completedAt: Date.now() 
        }) !== null;
      }
      
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks_new')
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
      const tasks = this.tasksCache.get(gameId) || [];
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], status: 'completed', completedAt: Date.now() };
        this.tasksCache.set(gameId, tasks);
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
        .from('tasks_new')
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
        .from('tasks_new')
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
        .from('tasks_new')
        .delete()
        .eq('user_id', user.id)
        .eq('game_id', gameId);

      // Clear favorites for this game (set is_favorite = false)
      await supabase
        .from('insights_new')
        .update({ is_favorite: false })
        .eq('user_id', user.id)
        .eq('game_id', gameId);

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
        .from('tasks_new')
        .select('game_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const gameIds = [...new Set(tasksData.map(task => task.game_id))];
      return gameIds;
    } catch (error) {
      console.error('Failed to get game IDs:', error);
      // Fallback to local cache
      return Array.from(this.tasksCache.keys());
    }
  }
}

export const otakuDiaryService = OtakuDiaryService.getInstance();
