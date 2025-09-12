import { describe, it, expect, beforeEach, vi } from 'vitest';
import { otakuDiaryService } from '../otakuDiaryService';
import { DiaryTask } from '../types';
import { taskCompletionPromptingService } from '../taskCompletionPromptingService';

// Mock the services that otakuDiaryService depends on
vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } })
    },
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })
    })
  }
}));

vi.mock('../longTermMemoryService', () => ({
  longTermMemoryService: {
    trackInteraction: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock('../progressTrackingService', () => ({
  progressTrackingService: {
    trackProgressEvent: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock('../playerProfileService', () => ({
  playerProfileService: {
    updateGameContext: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('ToDo List Completion Integration', () => {
  const mockTask: DiaryTask = {
    id: 'test-task-1',
    title: 'Defeat Fire Boss',
    description: 'Defeat the Fire Boss in the Volcano',
    type: 'user_created',
    status: 'pending',
    category: 'boss',
    createdAt: Date.now() - 1000,
    gameId: 'test-game'
  };

  beforeEach(() => {
    // Reset service state
    taskCompletionPromptingService.clearPendingCompletions('test-game');
    taskCompletionPromptingService.resetResponseCounter('test-game');
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('markTaskComplete integration', () => {
    it('should record completion in task completion prompting service when marking task complete', async () => {
      // Set up the task in the cache
      const tasksCache = (otakuDiaryService as any).tasksCache;
      tasksCache.set('test-game', [mockTask]);

      // Mock the localStorage update for development mode
      const updateTaskLocalStorage = vi.fn().mockReturnValue(true);
      (otakuDiaryService as any).updateTaskLocalStorage = updateTaskLocalStorage;

      // Set NODE_ENV to development to trigger the localStorage path
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      try {
        // Mark task as complete
        const result = await otakuDiaryService.markTaskComplete('test-game', 'test-task-1');

        // Verify the task was marked complete
        expect(result).toBe(true);

        // Verify completion was recorded in task completion prompting service
        const pendingCompletions = taskCompletionPromptingService.getPendingCompletions('test-game');
        expect(pendingCompletions).toHaveLength(1);
        expect(pendingCompletions[0]).toMatchObject({
          taskId: 'test-task-1',
          completed: true,
          conversationId: 'test-game'
        });
      } finally {
        // Restore original NODE_ENV
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should format completion context correctly for AI', async () => {
      // Set up the task in the cache
      const tasksCache = (otakuDiaryService as any).tasksCache;
      tasksCache.set('test-game', [mockTask]);

      // Mock the localStorage update for development mode
      const updateTaskLocalStorage = vi.fn().mockReturnValue(true);
      (otakuDiaryService as any).updateTaskLocalStorage = updateTaskLocalStorage;

      // Set NODE_ENV to development to trigger the localStorage path
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      try {
        // Mark task as complete
        await otakuDiaryService.markTaskComplete('test-game', 'test-task-1');

        // Get the formatted context
        const context = taskCompletionPromptingService.formatCompletionContext('test-game');
        
        expect(context).toContain('[TASK_COMPLETION_UPDATES]');
        expect(context).toContain('Task test-task-1: completed');
        expect(context).toContain('Use this information to update your understanding of the player\'s progress');
      } finally {
        // Restore original NODE_ENV
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should clear pending completions after formatting context', async () => {
      // Set up the task in the cache
      const tasksCache = (otakuDiaryService as any).tasksCache;
      tasksCache.set('test-game', [mockTask]);

      // Mock the localStorage update for development mode
      const updateTaskLocalStorage = vi.fn().mockReturnValue(true);
      (otakuDiaryService as any).updateTaskLocalStorage = updateTaskLocalStorage;

      // Set NODE_ENV to development to trigger the localStorage path
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      try {
        // Mark task as complete
        await otakuDiaryService.markTaskComplete('test-game', 'test-task-1');

        // Verify completion is recorded
        expect(taskCompletionPromptingService.getPendingCompletions('test-game')).toHaveLength(1);

        // Format context (this should clear the pending completions)
        const context = taskCompletionPromptingService.formatCompletionContext('test-game');
        expect(context).not.toBe('');

        // Clear pending completions (simulating what happens in useChat)
        taskCompletionPromptingService.clearPendingCompletions('test-game');

        // Verify completions are cleared
        expect(taskCompletionPromptingService.getPendingCompletions('test-game')).toHaveLength(0);
      } finally {
        // Restore original NODE_ENV
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should handle multiple task completions', async () => {
      const mockTask2: DiaryTask = {
        id: 'test-task-2',
        title: 'Find Hidden Chest',
        description: 'Locate the hidden chest in the forest',
        type: 'user_created',
        status: 'pending',
        category: 'exploration',
        createdAt: Date.now() - 2000,
        gameId: 'test-game'
      };

      // Set up tasks in the cache
      const tasksCache = (otakuDiaryService as any).tasksCache;
      tasksCache.set('test-game', [mockTask, mockTask2]);

      // Mock the localStorage update for development mode
      const updateTaskLocalStorage = vi.fn().mockReturnValue(true);
      (otakuDiaryService as any).updateTaskLocalStorage = updateTaskLocalStorage;

      // Set NODE_ENV to development to trigger the localStorage path
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      try {
        // Mark both tasks as complete
        await otakuDiaryService.markTaskComplete('test-game', 'test-task-1');
        await otakuDiaryService.markTaskComplete('test-game', 'test-task-2');

        // Verify both completions are recorded
        const pendingCompletions = taskCompletionPromptingService.getPendingCompletions('test-game');
        expect(pendingCompletions).toHaveLength(2);
        
        const task1Completion = pendingCompletions.find(c => c.taskId === 'test-task-1');
        const task2Completion = pendingCompletions.find(c => c.taskId === 'test-task-2');
        
        expect(task1Completion).toMatchObject({
          taskId: 'test-task-1',
          completed: true,
          conversationId: 'test-game'
        });
        
        expect(task2Completion).toMatchObject({
          taskId: 'test-task-2',
          completed: true,
          conversationId: 'test-game'
        });
      } finally {
        // Restore original NODE_ENV
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('integration with AI context', () => {
    it('should provide context that AI can use to avoid suggesting completed tasks', async () => {
      // Set up the task in the cache
      const tasksCache = (otakuDiaryService as any).tasksCache;
      tasksCache.set('test-game', [mockTask]);

      // Mock the localStorage update for development mode
      const updateTaskLocalStorage = vi.fn().mockReturnValue(true);
      (otakuDiaryService as any).updateTaskLocalStorage = updateTaskLocalStorage;

      // Set NODE_ENV to development to trigger the localStorage path
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      try {
        // Mark task as complete
        await otakuDiaryService.markTaskComplete('test-game', 'test-task-1');

        // Get the formatted context
        const context = taskCompletionPromptingService.formatCompletionContext('test-game');
        
        // The context should inform the AI about completed tasks
        expect(context).toContain('TASK_COMPLETION_UPDATES');
        expect(context).toContain('test-task-1: completed');
        expect(context).toContain('avoid suggesting already completed tasks');
      } finally {
        // Restore original NODE_ENV
        process.env.NODE_ENV = originalEnv;
      }
    });
  });
});
