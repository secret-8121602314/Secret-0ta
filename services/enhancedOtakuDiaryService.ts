import { supabaseDataService } from './supabaseDataService';
import { aiOutputParsingService, AITask } from './aiOutputParsingService';
import { igdbService } from './igdbService';

export interface EnhancedOtakuTask {
  id: string;
  title: string;
  description: string;
  category: 'story' | 'exploration' | 'combat' | 'achievement' | 'collection' | 'custom';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  game_name?: string;
  igdb_id?: number;
  platform?: string;
  estimated_time?: number; // in minutes
  prerequisites?: string[];
  rewards?: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
  user_notes?: string;
  ai_generated: boolean;
  source_conversation?: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  priority: number;
}

export class EnhancedOtakuDiaryService {
  private static instance: EnhancedOtakuDiaryService;

  private readonly TASK_CATEGORIES: TaskCategory[] = [
    {
      id: 'story',
      name: 'Story & Lore',
      description: 'Main quests, side stories, and narrative progression',
      icon: '🎯',
      color: '#3B82F6',
      priority: 1
    },
    {
      id: 'exploration',
      name: 'Exploration',
      description: 'Discovering new areas, secrets, and hidden content',
      icon: '🗺️',
      color: '#10B981',
      priority: 2
    },
    {
      id: 'combat',
      name: 'Combat & Skills',
      description: 'Mastering combat mechanics and improving skills',
      icon: '⚔️',
      color: '#EF4444',
      priority: 3
    },
    {
      id: 'achievement',
      name: 'Achievements',
      description: 'Unlocking achievements and completing challenges',
      icon: '🏆',
      color: '#F59E0B',
      priority: 4
    },
    {
      id: 'collection',
      name: 'Collection',
      description: 'Finding and collecting items, weapons, and collectibles',
      icon: '💎',
      color: '#8B5CF6',
      priority: 5
    },
    {
      id: 'custom',
      name: 'Custom',
      description: 'User-created and personalized tasks',
      icon: '✏️',
      color: '#6B7280',
      priority: 6
    }
  ];

  private constructor() {}

  public static getInstance(): EnhancedOtakuDiaryService {
    if (!EnhancedOtakuDiaryService.instance) {
      EnhancedOtakuDiaryService.instance = new EnhancedOtakuDiaryService();
    }
    return EnhancedOtakuDiaryService.instance;
  }

  /**
   * Parse AI-suggested tasks from Gemini responses
   */
  async parseAISuggestedTasks(flashResponse: string): Promise<AITask | null> {
    try {
      const parsedOutput = aiOutputParsingService.parseAIOutput(flashResponse);
      
      if (parsedOutput.aiTasks && parsedOutput.aiTasks.length > 0) {
        console.log('📝 AI tasks parsed successfully:', parsedOutput.aiTasks);
        return parsedOutput.aiTasks;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to parse AI suggested tasks:', error);
      return null;
    }
  }

  /**
   * Add AI-suggested tasks to user's diary
   */
  async addAISuggestedTasks(
    flashResponse: string, 
    gameContext?: { gameName?: string; igdb_id?: number; platform?: string }
  ): Promise<EnhancedOtakuTask[]> {
    try {
      const aiTasks = await this.parseAISuggestedTasks(flashResponse);
      
      if (!aiTasks || aiTasks.length === 0) {
        console.log('No AI tasks found in response');
        return [];
      }

      const enhancedTasks: EnhancedOtakuTask[] = [];
      
      for (const taskText of aiTasks) {
        const enhancedTask = await this.createEnhancedTaskFromAI(taskText, gameContext);
        if (enhancedTask) {
          enhancedTasks.push(enhancedTask);
        }
      }

      // Save tasks to database
      if (enhancedTasks.length > 0) {
        await this.saveTasksToDatabase(enhancedTasks);
        console.log(`✅ Added ${enhancedTasks.length} AI-generated tasks to diary`);
      }

      return enhancedTasks;
    } catch (error) {
      console.error('Failed to add AI suggested tasks:', error);
      return [];
    }
  }

  /**
   * Create enhanced task from AI text
   */
  private async createEnhancedTaskFromAI(
    taskText: string, 
    gameContext?: { gameName?: string; igdb_id?: number; platform?: string }
  ): Promise<EnhancedOtakuTask | null> {
    try {
      const category = this.categorizeTask(taskText);
      const difficulty = this.assessTaskDifficulty(taskText);
      const estimatedTime = this.estimateTaskTime(taskText, difficulty);
      
      const task: EnhancedOtakuTask = {
        id: this.generateTaskId(),
        title: this.extractTaskTitle(taskText),
        description: taskText,
        category,
        difficulty,
        game_name: gameContext?.gameName,
        igdb_id: gameContext?.igdb_id,
        platform: gameContext?.platform,
        estimated_time: estimatedTime,
        prerequisites: this.extractPrerequisites(taskText),
        rewards: this.extractRewards(taskText),
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
        ai_generated: true,
        user_notes: ''
      };

      return task;
    } catch (error) {
      console.error('Failed to create enhanced task from AI:', error);
      return null;
    }
  }

  /**
   * Categorize task based on content
   */
  private categorizeTask(taskText: string): EnhancedOtakuTask['category'] {
    const text = taskText.toLowerCase();
    
    if (text.includes('quest') || text.includes('story') || text.includes('lore') || text.includes('ending')) {
      return 'story';
    } else if (text.includes('discover') || text.includes('explore') || text.includes('area') || text.includes('hidden')) {
      return 'exploration';
    } else if (text.includes('combat') || text.includes('defeat') || text.includes('master') || text.includes('skill')) {
      return 'combat';
    } else if (text.includes('achievement') || text.includes('unlock') || text.includes('challenge')) {
      return 'achievement';
    } else if (text.includes('collect') || text.includes('find') || text.includes('item')) {
      return 'collection';
    } else {
      return 'custom';
    }
  }

  /**
   * Assess task difficulty
   */
  private assessTaskDifficulty(taskText: string): EnhancedOtakuTask['difficulty'] {
    const text = taskText.toLowerCase();
    
    if (text.includes('easy') || text.includes('simple') || text.includes('basic')) {
      return 'easy';
    } else if (text.includes('hard') || text.includes('difficult') || text.includes('challenging') || text.includes('expert')) {
      return 'hard';
    } else if (text.includes('master') || text.includes('complete') || text.includes('all')) {
      return 'expert';
    } else {
      return 'medium';
    }
  }

  /**
   * Estimate task completion time
   */
  private estimateTaskTime(taskText: string, difficulty: EnhancedOtakuTask['difficulty']): number {
    const baseTime = {
      easy: 15,
      medium: 45,
      hard: 90,
      expert: 180
    };

    let multiplier = 1;
    
    // Adjust based on task content
    if (taskText.toLowerCase().includes('all') || taskText.toLowerCase().includes('complete')) {
      multiplier = 2;
    } else if (taskText.toLowerCase().includes('discover') || taskText.toLowerCase().includes('explore')) {
      multiplier = 1.5;
    }

    return Math.round(baseTime[difficulty] * multiplier);
  }

  /**
   * Extract task title from full text
   */
  private extractTaskTitle(taskText: string): string {
    // Remove category prefixes and emojis
    const cleanText = taskText
      .replace(/^[🎯🗺️⚔️🏆💎✏️]\s*\[[^\]]*\]\s*/, '')
      .trim();
    
    // Take first sentence or first 50 characters
    const firstSentence = cleanText.split('.')[0];
    if (firstSentence.length <= 50) {
      return firstSentence;
    }
    
    return cleanText.substring(0, 50).trim() + '...';
  }

  /**
   * Extract prerequisites from task text
   */
  private extractPrerequisites(taskText: string): string[] {
    const prerequisites: string[] = [];
    const text = taskText.toLowerCase();
    
    if (text.includes('after') || text.includes('complete') || text.includes('finish')) {
      // Look for prerequisite patterns
      const afterMatch = text.match(/after\s+([^.]+)/);
      if (afterMatch) {
        prerequisites.push(afterMatch[1].trim());
      }
    }
    
    return prerequisites;
  }

  /**
   * Extract rewards from task text
   */
  private extractRewards(taskText: string): string[] {
    const rewards: string[] = [];
    const text = taskText.toLowerCase();
    
    if (text.includes('unlock') || text.includes('get') || text.includes('earn')) {
      // Look for reward patterns
      const unlockMatch = text.match(/unlock\s+([^.]+)/);
      if (unlockMatch) {
        rewards.push(unlockMatch[1].trim());
      }
    }
    
    return rewards;
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save tasks to database
   */
  private async saveTasksToDatabase(tasks: EnhancedOtakuTask[]): Promise<void> {
    try {
      // Save to Supabase
      for (const task of tasks) {
        await supabaseDataService.addOtakuDiaryTask(task);
      }
      
      // Also save to localStorage as backup
      this.saveTasksToLocalStorage(tasks);
      
    } catch (error) {
      console.error('Failed to save tasks to database:', error);
      // Fallback to localStorage only
      this.saveTasksToLocalStorage(tasks);
    }
  }

  /**
   * Save tasks to localStorage as backup
   */
  private saveTasksToLocalStorage(tasks: EnhancedOtakuTask[]): void {
    try {
      const existingTasks = this.getTasksFromLocalStorage();
      const allTasks = [...existingTasks, ...tasks];
      localStorage.setItem('otakuDiaryTasks', JSON.stringify(allTasks));
    } catch (error) {
      console.error('Failed to save tasks to localStorage:', error);
    }
  }

  /**
   * Get tasks from localStorage
   */
  private getTasksFromLocalStorage(): EnhancedOtakuTask[] {
    try {
      const stored = localStorage.getItem('otakuDiaryTasks');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get tasks from localStorage:', error);
      return [];
    }
  }

  /**
   * Get all user tasks
   */
  async getUserTasks(): Promise<EnhancedOtakuTask[]> {
    try {
      // Try to get from Supabase first
      const tasks = await supabaseDataService.getOtakuDiaryTasks();
      if (tasks && tasks.length > 0) {
        return tasks;
      }
      
      // Fallback to localStorage
      return this.getTasksFromLocalStorage();
    } catch (error) {
      console.error('Failed to get user tasks:', error);
      return this.getTasksFromLocalStorage();
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: EnhancedOtakuTask['status']): Promise<boolean> {
    try {
      // Update in Supabase
      await supabaseDataService.updateOtakuDiaryTask(taskId, { status });
      
      // Update in localStorage
      this.updateTaskInLocalStorage(taskId, { status });
      
      return true;
    } catch (error) {
      console.error('Failed to update task status:', error);
      // Fallback to localStorage only
      this.updateTaskInLocalStorage(taskId, { status });
      return false;
    }
  }

  /**
   * Update task in localStorage
   */
  private updateTaskInLocalStorage(taskId: string, updates: Partial<EnhancedOtakuTask>): void {
    try {
      const tasks = this.getTasksFromLocalStorage();
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      
      if (taskIndex !== -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], ...updates, updated_at: new Date() };
        localStorage.setItem('otakuDiaryTasks', JSON.stringify(tasks));
      }
    } catch (error) {
      console.error('Failed to update task in localStorage:', error);
    }
  }

  /**
   * Get task categories
   */
  getTaskCategories(): TaskCategory[] {
    return [...this.TASK_CATEGORIES];
  }

  /**
   * Get tasks by category
   */
  async getTasksByCategory(category: EnhancedOtakuTask['category']): Promise<EnhancedOtakuTask[]> {
    const allTasks = await this.getUserTasks();
    return allTasks.filter(task => task.category === category);
  }

  /**
   * Get tasks by game
   */
  async getTasksByGame(gameName: string): Promise<EnhancedOtakuTask[]> {
    const allTasks = await this.getUserTasks();
    return allTasks.filter(task => task.game_name === gameName);
  }

  /**
   * Get pending tasks
   */
  async getPendingTasks(): Promise<EnhancedOtakuTask[]> {
    const allTasks = await this.getUserTasks();
    return allTasks.filter(task => task.status === 'pending');
  }

  /**
   * Get completed tasks
   */
  async getCompletedTasks(): Promise<EnhancedOtakuTask[]> {
    const allTasks = await this.getUserTasks();
    return allTasks.filter(task => task.status === 'completed');
  }

  /**
   * Health check for enhanced diary service
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      const tasks = await this.getUserTasks();
      return {
        healthy: true,
        message: `Enhanced Otaku Diary service is healthy with ${tasks.length} tasks`
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Enhanced Otaku Diary service health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const enhancedOtakuDiaryService = EnhancedOtakuDiaryService.getInstance();
