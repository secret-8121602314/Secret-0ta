import { describe, it, expect, beforeEach, vi } from 'vitest';
import { taskCompletionPromptingService } from '../taskCompletionPromptingService';
import { TaskCompletionPrompt } from '../types';
import { DiaryTask } from '../types';

describe('TaskCompletionPromptingService', () => {
  const mockCentralTasks: DiaryTask[] = [
    {
      id: 'task1',
      title: 'Defeat Fire Boss',
      description: 'Defeat the Fire Boss in the Volcano',
      type: 'user_created',
      status: 'pending',
      category: 'boss',
      createdAt: Date.now() - 1000,
      gameId: 'test-game'
    },
    {
      id: 'task2',
      title: 'Find Hidden Chest',
      description: 'Locate the hidden chest in the forest',
      type: 'ai_suggested',
      status: 'pending',
      category: 'exploration',
      createdAt: Date.now() - 2000,
      gameId: 'test-game'
    }
  ];

  const mockAIGeneratedTasks: DiaryTask[] = [
    {
      id: 'task3',
      title: 'Collect Magic Crystals',
      description: 'Gather 5 magic crystals from the cave',
      type: 'ai_suggested',
      status: 'pending',
      category: 'item',
      createdAt: Date.now() - 500,
      gameId: 'test-game'
    }
  ];

  beforeEach(() => {
    // Reset service state
    taskCompletionPromptingService.resetResponseCounter('test-conversation');
    taskCompletionPromptingService.clearPendingCompletions('test-conversation');
  });

  describe('shouldShowCompletionPrompt', () => {
    it('should return false for free users with no central tasks', () => {
      const result = taskCompletionPromptingService.shouldShowCompletionPrompt(
        'test-conversation',
        'free',
        [],
        mockAIGeneratedTasks
      );
      expect(result).toBe(false);
    });

    it('should return true for free users with central tasks every 3rd response', () => {
      // Simulate 3 responses
      taskCompletionPromptingService.shouldShowCompletionPrompt('test-conversation', 'free', mockCentralTasks, []);
      taskCompletionPromptingService.shouldShowCompletionPrompt('test-conversation', 'free', mockCentralTasks, []);
      const result = taskCompletionPromptingService.shouldShowCompletionPrompt('test-conversation', 'free', mockCentralTasks, []);
      
      expect(result).toBe(true);
    });

    it('should return true for pro users with central tasks every 3rd response', () => {
      // Simulate 3 responses
      taskCompletionPromptingService.shouldShowCompletionPrompt('test-conversation', 'pro', mockCentralTasks, []);
      taskCompletionPromptingService.shouldShowCompletionPrompt('test-conversation', 'pro', mockCentralTasks, []);
      const result = taskCompletionPromptingService.shouldShowCompletionPrompt('test-conversation', 'pro', mockCentralTasks, []);
      
      expect(result).toBe(true);
    });

    it('should return true for pro users with no central tasks every 6th response', () => {
      // Simulate 6 responses
      for (let i = 0; i < 5; i++) {
        taskCompletionPromptingService.shouldShowCompletionPrompt('test-conversation', 'pro', [], mockAIGeneratedTasks);
      }
      const result = taskCompletionPromptingService.shouldShowCompletionPrompt('test-conversation', 'pro', [], mockAIGeneratedTasks);
      
      expect(result).toBe(true);
    });
  });

  describe('generateCompletionPrompt', () => {
    it('should return null for free users with no central tasks', () => {
      const result = taskCompletionPromptingService.generateCompletionPrompt(
        'test-conversation',
        'free',
        [],
        mockAIGeneratedTasks
      );
      expect(result).toBe(null);
    });

    it('should generate prompt for free users with central tasks', () => {
      // Manually set response count to 2 so the next call will be the 3rd response
      taskCompletionPromptingService.shouldShowCompletionPrompt('test-conversation', 'free', mockCentralTasks, []);
      taskCompletionPromptingService.shouldShowCompletionPrompt('test-conversation', 'free', mockCentralTasks, []);

      const result = taskCompletionPromptingService.generateCompletionPrompt(
        'test-conversation',
        'free',
        mockCentralTasks,
        []
      );

      expect(result).not.toBe(null);
      expect(result?.tasks.length).toBeLessThanOrEqual(2);
      expect(result?.promptText).toBe('Have you completed any of these tasks?');
      expect(result?.userTier).toBe('free');
    });

    it('should generate prompt for pro users with central tasks', () => {
      // Manually set response count to 2 so the next call will be the 3rd response
      taskCompletionPromptingService.shouldShowCompletionPrompt('test-conversation', 'pro', mockCentralTasks, []);
      taskCompletionPromptingService.shouldShowCompletionPrompt('test-conversation', 'pro', mockCentralTasks, []);

      const result = taskCompletionPromptingService.generateCompletionPrompt(
        'test-conversation',
        'pro',
        mockCentralTasks,
        []
      );

      expect(result).not.toBe(null);
      expect(result?.tasks.length).toBeLessThanOrEqual(2);
      expect(result?.promptText).toBe('Have you completed any of these tasks?');
      expect(result?.userTier).toBe('pro');
    });

    it('should generate prompt for pro users with no central tasks', () => {
      // Manually set response count to 5 so the next call will be the 6th response
      for (let i = 0; i < 5; i++) {
        taskCompletionPromptingService.shouldShowCompletionPrompt('test-conversation', 'pro', [], mockAIGeneratedTasks);
      }

      const result = taskCompletionPromptingService.generateCompletionPrompt(
        'test-conversation',
        'pro',
        [],
        mockAIGeneratedTasks
      );

      expect(result).not.toBe(null);
      expect(result?.tasks.length).toBeLessThanOrEqual(2);
      expect(result?.promptText).toBe('Have you completed any of these recent objectives?');
      expect(result?.userTier).toBe('pro');
    });
  });

  describe('recordCompletionResponse', () => {
    it('should record task completion responses', () => {
      taskCompletionPromptingService.recordCompletionResponse('test-conversation', 'task1', true);
      taskCompletionPromptingService.recordCompletionResponse('test-conversation', 'task2', false);

      const completions = taskCompletionPromptingService.getPendingCompletions('test-conversation');
      expect(completions).toHaveLength(2);
      expect(completions[0]).toMatchObject({
        taskId: 'task1',
        completed: true,
        conversationId: 'test-conversation'
      });
      expect(completions[1]).toMatchObject({
        taskId: 'task2',
        completed: false,
        conversationId: 'test-conversation'
      });
    });
  });

  describe('formatCompletionContext', () => {
    it('should format completion context for AI', () => {
      taskCompletionPromptingService.recordCompletionResponse('test-conversation', 'task1', true);
      taskCompletionPromptingService.recordCompletionResponse('test-conversation', 'task2', false);

      const context = taskCompletionPromptingService.formatCompletionContext('test-conversation');
      expect(context).toContain('[TASK_COMPLETION_UPDATES]');
      expect(context).toContain('Task task1: completed');
      expect(context).toContain('Task task2: not completed');
    });

    it('should return empty string when no completions', () => {
      const context = taskCompletionPromptingService.formatCompletionContext('test-conversation');
      expect(context).toBe('');
    });
  });

  describe('clearPendingCompletions', () => {
    it('should clear pending completions', () => {
      taskCompletionPromptingService.recordCompletionResponse('test-conversation', 'task1', true);
      expect(taskCompletionPromptingService.getPendingCompletions('test-conversation')).toHaveLength(1);

      taskCompletionPromptingService.clearPendingCompletions('test-conversation');
      expect(taskCompletionPromptingService.getPendingCompletions('test-conversation')).toHaveLength(0);
    });
  });

  describe('response counter management', () => {
    it('should track response count correctly', () => {
      expect(taskCompletionPromptingService.getResponseCount('test-conversation')).toBe(0);
      
      taskCompletionPromptingService.shouldShowCompletionPrompt('test-conversation', 'free', mockCentralTasks, []);
      expect(taskCompletionPromptingService.getResponseCount('test-conversation')).toBe(1);
      
      taskCompletionPromptingService.shouldShowCompletionPrompt('test-conversation', 'free', mockCentralTasks, []);
      expect(taskCompletionPromptingService.getResponseCount('test-conversation')).toBe(2);
    });

    it('should reset response counter', () => {
      taskCompletionPromptingService.shouldShowCompletionPrompt('test-conversation', 'free', mockCentralTasks, []);
      expect(taskCompletionPromptingService.getResponseCount('test-conversation')).toBe(1);
      
      taskCompletionPromptingService.resetResponseCounter('test-conversation');
      expect(taskCompletionPromptingService.getResponseCount('test-conversation')).toBe(0);
    });
  });
});
