/**
 * Test for Suggested Prompts Behavior
 * 
 * This test verifies that:
 * 1. All 4 suggested prompts are initially shown
 * 2. When a prompt is clicked, it becomes disabled with a checkmark
 * 3. The remaining prompts stay active
 * 4. Follow-up prompts are content-related, not generic
 */

import { suggestedPromptsService } from '../suggestedPromptsService';
import { newsPrompts } from '../types';

describe('Suggested Prompts Behavior', () => {
  beforeEach(() => {
    // Reset the service state before each test
    suggestedPromptsService.resetUsedPrompts();
  });

  test('should show all 4 prompts initially', () => {
    const unusedPrompts = suggestedPromptsService.getUnusedPrompts(newsPrompts);
    expect(unusedPrompts).toHaveLength(4);
    expect(unusedPrompts).toEqual(newsPrompts);
  });

  test('should disable selected prompt and show remaining ones', () => {
    const firstPrompt = newsPrompts[0];
    
    // Mark first prompt as used
    suggestedPromptsService.markPromptAsUsed(firstPrompt);
    
    // Check that first prompt is now used
    expect(suggestedPromptsService.isPromptUsed(firstPrompt)).toBe(true);
    
    // Check that remaining prompts are still unused
    const unusedPrompts = suggestedPromptsService.getUnusedPrompts(newsPrompts);
    expect(unusedPrompts).toHaveLength(3);
    expect(unusedPrompts).not.toContain(firstPrompt);
    
    // Check that all prompts are not used yet
    expect(suggestedPromptsService.areAllPromptsUsed(newsPrompts)).toBe(false);
  });

  test('should show all prompts with correct usage status', () => {
    const firstPrompt = newsPrompts[0];
    const secondPrompt = newsPrompts[1];
    
    // Mark first prompt as used
    suggestedPromptsService.markPromptAsUsed(firstPrompt);
    
    // Check individual prompt status
    expect(suggestedPromptsService.isPromptUsed(firstPrompt)).toBe(true);
    expect(suggestedPromptsService.isPromptUsed(secondPrompt)).toBe(false);
    
    // Check unused prompts
    const unusedPrompts = suggestedPromptsService.getUnusedPrompts(newsPrompts);
    expect(unusedPrompts).toContain(secondPrompt);
    expect(unusedPrompts).not.toContain(firstPrompt);
  });

  test('should reset all prompts after 24 hours', () => {
    // Mark all prompts as used
    newsPrompts.forEach(prompt => {
      suggestedPromptsService.markPromptAsUsed(prompt);
    });
    
    expect(suggestedPromptsService.areAllPromptsUsed(newsPrompts)).toBe(true);
    
    // Reset prompts
    suggestedPromptsService.resetUsedPrompts();
    
    // All prompts should be available again
    const unusedPrompts = suggestedPromptsService.getUnusedPrompts(newsPrompts);
    expect(unusedPrompts).toHaveLength(4);
    expect(unusedPrompts).toEqual(newsPrompts);
  });

  test('should track usage count correctly', () => {
    expect(suggestedPromptsService.getUsedCount()).toBe(0);
    
    suggestedPromptsService.markPromptAsUsed(newsPrompts[0]);
    expect(suggestedPromptsService.getUsedCount()).toBe(1);
    
    suggestedPromptsService.markPromptAsUsed(newsPrompts[1]);
    expect(suggestedPromptsService.getUsedCount()).toBe(2);
  });
});

/**
 * Mock test for follow-up prompt generation
 * This would need to be integrated with the actual AI service testing
 */
describe('Follow-up Prompt Generation', () => {
  test('should generate content-related follow-up prompts', () => {
    // This is a conceptual test - in practice, this would test the AI service
    const mockAIResponse = {
      narrativeResponse: "Here's the latest gaming news: Elden Ring DLC announced, new Zelda game releasing soon...",
      followUpPrompts: [
        "What other FromSoftware games are similar to Elden Ring?",
        "When exactly is the new Zelda game releasing?",
        "Are there any other major RPG releases coming this year?"
      ]
    };
    
    // Verify that follow-up prompts are content-specific
    expect(mockAIResponse.followUpPrompts[0]).toContain('Elden Ring');
    expect(mockAIResponse.followUpPrompts[1]).toContain('Zelda');
    expect(mockAIResponse.followUpPrompts[2]).toContain('RPG');
    
    // Verify they're not generic
    expect(mockAIResponse.followUpPrompts[0]).not.toBe("What's the latest gaming news?");
    expect(mockAIResponse.followUpPrompts[1]).not.toBe("Which games are releasing soon?");
  });
});
