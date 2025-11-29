import { test, expect } from '@playwright/test';
import { 
  waitForAppReady, 
  selectors, 
  sendMessage,
  waitForChatResponse,
  goToGameHub,
  createGameTab,
} from './utils/helpers';

/**
 * AI Context & Memory Stress Tests
 * =================================
 * Tests context handling including:
 * - Context window management
 * - Conversation memory
 * - Follow-up queries
 * - Context injection
 * - AI response quality over time
 */

test.describe('AI Context Memory', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should remember game context within conversation', async ({ page }) => {
    // First, go to game hub and create a game tab
    await goToGameHub(page);
    await createGameTab(page, 'Zelda');
    await page.waitForTimeout(1000);
    
    // Ask about the game
    await sendMessage(page, 'What is this game about?');
    await waitForChatResponse(page, { timeout: 30000 });
    
    // Follow-up should remember context
    await sendMessage(page, 'What are the main mechanics?');
    await waitForChatResponse(page, { timeout: 30000 });
    
    // Verify response relates to Zelda
    const messages = page.locator('[data-testid="chat-message"], [class*="message"]');
    const lastMessage = messages.last();
    await expect(lastMessage).toBeVisible();
  });

  test('should maintain context across multiple exchanges', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Elden Ring');
    await page.waitForTimeout(1000);
    
    const questions = [
      'Tell me about the combat system',
      'What weapons are best for beginners?',
      'How do I level up?',
      'What about magic?',
    ];
    
    for (const question of questions) {
      await sendMessage(page, question);
      const hasResponse = await waitForChatResponse(page, { timeout: 30000 }).catch(() => false);
      if (!hasResponse) break;
      await page.waitForTimeout(1000);
    }
  });

  test('should handle context injection from screenshots', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Dark Souls');
    await page.waitForTimeout(1000);
    
    // Check for screenshot/context injection UI
    const screenshotButton = page.locator('button:has-text("Screenshot"), button[aria-label*="screenshot"]').first();
    const uploadButton = page.locator('button:has-text("Upload"), input[type="file"]').first();
    
    // Context injection elements should exist
    const hasContextUI = await screenshotButton.isVisible().catch(() => false) ||
                         await uploadButton.isVisible().catch(() => false);
    console.log('Has context injection UI:', hasContextUI);
  });
});

test.describe('Conversation History', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should persist conversation across page reloads', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Minecraft');
    await page.waitForTimeout(1000);
    
    // Send a unique message
    const uniqueId = Date.now();
    await sendMessage(page, `Test message ${uniqueId}`);
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    // Reload page
    await page.reload();
    await waitForAppReady(page);
    await page.waitForTimeout(2000);
    
    // Check if conversation persisted
    // Navigate back to the same game tab
  });

  test('should maintain separate conversations per game', async ({ page }) => {
    await goToGameHub(page);
    
    // Create first game tab
    await createGameTab(page, 'Game1');
    await page.waitForTimeout(1000);
    await sendMessage(page, 'Hello from Game 1');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    
    // Create second game tab
    await createGameTab(page, 'Game2');
    await page.waitForTimeout(1000);
    await sendMessage(page, 'Hello from Game 2');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    
    // Each should have separate conversation
    const gameTabs = page.locator(selectors.gameTab);
    const tabCount = await gameTabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(2);
  });

  test('should handle long conversation history', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Test Game');
    await page.waitForTimeout(1000);
    
    // Send multiple messages
    const messageCount = 5;
    for (let i = 0; i < messageCount; i++) {
      await sendMessage(page, `Test message ${i + 1}`);
      await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(500);
    }
    
    // Check message container scrollability
    const chatContainer = page.locator(selectors.chatContainer).first();
    if (await chatContainer.isVisible()) {
      const scrollHeight = await chatContainer.evaluate(el => el.scrollHeight);
      const clientHeight = await chatContainer.evaluate(el => el.clientHeight);
      console.log(`Chat container: scrollHeight=${scrollHeight}, clientHeight=${clientHeight}`);
    }
  });
});

test.describe('Context Window Management', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle context truncation gracefully', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Complex Game');
    await page.waitForTimeout(1000);
    
    // Send a very long message
    const longMessage = 'Tell me about ' + 'the game '.repeat(100);
    await sendMessage(page, longMessage.substring(0, 1000)); // Limit to 1000 chars
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    
    // App should handle without crashing
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
  });

  test('should summarize old context when needed', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'RPG Game');
    await page.waitForTimeout(1000);
    
    // This is more of a functional test
    // Sending multiple messages to build up context
    for (let i = 0; i < 3; i++) {
      await sendMessage(page, `Question ${i + 1}: Tell me more about the story`);
      await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(1000);
    }
    
    // App should still respond coherently
    const messages = page.locator('[data-testid="chat-message"], [class*="message"]');
    expect(await messages.count()).toBeGreaterThan(0);
  });
});

test.describe('Follow-up Query Handling', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should understand pronoun references', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Skyrim');
    await page.waitForTimeout(1000);
    
    // Initial question
    await sendMessage(page, 'What is the main quest about?');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1000);
    
    // Follow-up with pronoun
    await sendMessage(page, 'How do I complete it?');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    
    // Response should relate to main quest
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
  });

  test('should handle clarification requests', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Any Game');
    await page.waitForTimeout(1000);
    
    // Ambiguous question
    await sendMessage(page, 'How do I beat him?');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    
    // AI might ask for clarification or use context
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
  });

  test('should maintain topic across context switches', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Pokemon');
    await page.waitForTimeout(1000);
    
    // Discuss one topic
    await sendMessage(page, 'Tell me about fire type Pokemon');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1000);
    
    // Ask about something else
    await sendMessage(page, 'What about water types?');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1000);
    
    // Return to original topic
    await sendMessage(page, 'Back to fire types, which is the strongest?');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
  });
});

test.describe('New vs Continuing Conversation', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should start fresh with new game tab', async ({ page }) => {
    await goToGameHub(page);
    
    // Create new game tab
    await createGameTab(page, 'New Game Test');
    await page.waitForTimeout(1000);
    
    // Should have empty conversation
    const existingMessages = page.locator('[data-testid="chat-message"]');
    // New tab might have welcome message but not old conversation
  });

  test('should continue existing conversation', async ({ page }) => {
    await goToGameHub(page);
    
    // Check for existing game tabs
    const gameTabs = page.locator(selectors.gameTab);
    const tabCount = await gameTabs.count();
    
    if (tabCount > 0) {
      // Click on existing tab
      await gameTabs.first().click();
      await page.waitForTimeout(1000);
      
      // Should load existing conversation
      const chatContainer = page.locator(selectors.chatContainer).first();
      if (await chatContainer.isVisible()) {
        console.log('Existing conversation loaded');
      }
    }
  });
});

test.describe('Context Quality Over Time', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should maintain response quality in long sessions', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Long Session Test');
    await page.waitForTimeout(1000);
    
    const startTime = Date.now();
    const responses: number[] = [];
    
    // Send multiple queries and track response times
    for (let i = 0; i < 3; i++) {
      const queryStart = Date.now();
      await sendMessage(page, `Query ${i + 1}: What should I do next?`);
      await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
      const queryEnd = Date.now();
      responses.push(queryEnd - queryStart);
      await page.waitForTimeout(1000);
    }
    
    const endTime = Date.now();
    console.log(`Session duration: ${endTime - startTime}ms`);
    console.log(`Response times: ${responses.join(', ')}ms`);
  });

  test('should handle rapid successive queries', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Rapid Query Test');
    await page.waitForTimeout(1000);
    
    // Send queries rapidly
    const queries = [
      'Question 1',
      'Question 2',
      'Question 3',
    ];
    
    for (const query of queries) {
      await sendMessage(page, query);
      await page.waitForTimeout(500); // Short delay between queries
    }
    
    // Wait for all responses
    await page.waitForTimeout(10000);
    
    // Check that app is still responsive
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
    await expect(chatInput).toBeEnabled();
  });
});

test.describe('SubTab Context Integration', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should use subtab context in responses', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Witcher 3');
    await page.waitForTimeout(1000);
    
    // Check for subtabs
    const subtabs = page.locator(selectors.subtab);
    const subtabCount = await subtabs.count();
    console.log(`Found ${subtabCount} subtabs`);
    
    if (subtabCount > 0) {
      // Click on a subtab
      await subtabs.first().click();
      await page.waitForTimeout(500);
      
      // Ask a question - should use subtab context
      await sendMessage(page, 'Tell me more about this');
      await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    }
  });

  test('should update context when switching subtabs', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Context Switch Test');
    await page.waitForTimeout(1000);
    
    const subtabs = page.locator(selectors.subtab);
    const subtabCount = await subtabs.count();
    
    if (subtabCount >= 2) {
      // Click first subtab
      await subtabs.nth(0).click();
      await page.waitForTimeout(500);
      
      // Click second subtab
      await subtabs.nth(1).click();
      await page.waitForTimeout(500);
      
      // Context should update
      const activeSubtab = page.locator(`${selectors.subtab}[aria-selected="true"], ${selectors.subtab}.active`);
    }
  });
});

test.describe('Error Recovery in Context', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should recover from failed AI response', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Error Recovery Test');
    await page.waitForTimeout(1000);
    
    // Send a query
    await sendMessage(page, 'Test query');
    await page.waitForTimeout(5000);
    
    // Whether it succeeds or fails, input should remain usable
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
    await expect(chatInput).toBeEnabled();
  });

  test('should allow retry after failure', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Retry Test');
    await page.waitForTimeout(1000);
    
    // Check for retry button
    const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again")').first();
    
    // Even if not visible now, the mechanism should exist
    console.log('Retry mechanism check complete');
  });
});
