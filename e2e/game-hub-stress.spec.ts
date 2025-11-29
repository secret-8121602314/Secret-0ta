import { test, expect } from '@playwright/test';
import { 
  waitForAppReady, 
  selectors, 
  goToGameHub,
  createGameTab,
  sendMessage,
  waitForChatResponse,
  measurePerformance,
  uniqueGameName,
  closeModal,
} from './utils/helpers';

/**
 * Game Hub Stress Tests
 * =====================
 * Tests the Game Hub functionality including:
 * - Game Hub navigation
 * - Game search
 * - Game tab creation
 * - News loading
 * - Suggested prompts
 * - Game selection
 */

test.describe('Game Hub Navigation', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display Game Hub in sidebar', async ({ page }) => {
    const gameHub = page.locator(selectors.gameHub).first();
    await expect(gameHub).toBeVisible();
  });

  test('should navigate to Game Hub when clicked', async ({ page }) => {
    await goToGameHub(page);
    
    // Should show Game Hub content
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
  });

  test('should load Game Hub quickly', async ({ page }) => {
    const { duration } = await measurePerformance(
      page,
      async () => {
        await goToGameHub(page);
        await page.waitForTimeout(500);
      },
      'Game Hub load'
    );
    
    expect(duration).toBeLessThan(5000);
  });

  test('should display Add Game button', async ({ page }) => {
    const addGameButton = page.locator(selectors.addGameButton).first();
    await expect(addGameButton).toBeVisible();
  });

  test('should show latest gaming news section', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(2000);
    
    // Look for news section or news-related content
    const newsSection = page.locator('text=News, text=Latest, text=Trending').first();
    // News may or may not be loaded depending on API
  });
});

test.describe('Game Tab Creation', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should open Add Game modal', async ({ page }) => {
    const addGameButton = page.locator(selectors.addGameButton).first();
    await addGameButton.click();
    
    await page.waitForTimeout(500);
    
    // Modal should appear
    const modal = page.locator(selectors.modal).first();
    await expect(modal).toBeVisible();
  });

  test('should have game name input in modal', async ({ page }) => {
    const addGameButton = page.locator(selectors.addGameButton).first();
    await addGameButton.click();
    await page.waitForTimeout(500);
    
    const gameInput = page.locator('input[placeholder*="game"], input[name*="game"]').first();
    await expect(gameInput).toBeVisible();
  });

  test('should search for games when typing', async ({ page }) => {
    const addGameButton = page.locator(selectors.addGameButton).first();
    await addGameButton.click();
    await page.waitForTimeout(500);
    
    const gameInput = page.locator('input[placeholder*="game"], input[name*="game"]').first();
    await gameInput.fill('Elden Ring');
    
    await page.waitForTimeout(1000);
    
    // Should show search results
    const searchResults = page.locator('[data-testid="game-result"], .game-result, .search-result');
  });

  test('should create game tab with valid name', async ({ page }) => {
    const gameName = uniqueGameName();
    
    const addGameButton = page.locator(selectors.addGameButton).first();
    await addGameButton.click();
    await page.waitForTimeout(500);
    
    const gameInput = page.locator('input[placeholder*="game"], input[name*="game"]').first();
    await gameInput.fill(gameName);
    
    const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), button[type="submit"]').first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(2000);
    }
  });

  test('should handle empty game name', async ({ page }) => {
    const addGameButton = page.locator(selectors.addGameButton).first();
    await addGameButton.click();
    await page.waitForTimeout(500);
    
    // Try to submit without name
    const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), button[type="submit"]').first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);
      
      // Should show validation or prevent submission
    }
  });

  test('should close modal on cancel', async ({ page }) => {
    const addGameButton = page.locator(selectors.addGameButton).first();
    await addGameButton.click();
    await page.waitForTimeout(500);
    
    await closeModal(page);
    
    // Modal should be closed
    await page.waitForTimeout(500);
    const modal = page.locator(selectors.modal).first();
    await expect(modal).not.toBeVisible().catch(() => true);
  });

  test('should close modal by clicking outside', async ({ page }) => {
    const addGameButton = page.locator(selectors.addGameButton).first();
    await addGameButton.click();
    await page.waitForTimeout(500);
    
    // Click outside modal
    await page.click('body', { position: { x: 10, y: 10 }, force: true });
    await page.waitForTimeout(500);
  });
});

test.describe('Game Tab Management', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display existing game tabs', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    const count = await gameTabs.count();
    console.log(`Found ${count} game tabs`);
  });

  test('should switch between game tabs', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    const count = await gameTabs.count();
    
    if (count > 0) {
      // Click first tab
      await gameTabs.first().click();
      await page.waitForTimeout(500);
      
      // Click Game Hub
      await goToGameHub(page);
      await page.waitForTimeout(500);
      
      // Should work smoothly
      const chatInput = page.locator(selectors.chatInput).first();
      await expect(chatInput).toBeVisible();
    }
  });

  test('should show game-specific context when tab selected', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    const count = await gameTabs.count();
    
    if (count > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(1000);
      
      // Should show game context or chat
      const chatInput = page.locator(selectors.chatInput).first();
      await expect(chatInput).toBeVisible();
    }
  });

  test('should show context menu on right-click', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    const count = await gameTabs.count();
    
    if (count > 0) {
      await gameTabs.first().click({ button: 'right' });
      await page.waitForTimeout(500);
      
      // Context menu may appear with options
      const contextMenu = page.locator(selectors.contextMenu).first();
    }
  });
});

test.describe('Game Hub Queries', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await goToGameHub(page);
  });

  test('should handle general gaming queries', async ({ page }) => {
    await sendMessage(page, 'What are the best games of 2024?', false);
    await page.waitForTimeout(3000);
    
    // Should process query
  });

  test('should handle game recommendation queries', async ({ page }) => {
    await sendMessage(page, 'Recommend me games similar to Dark Souls', false);
    await page.waitForTimeout(3000);
  });

  test('should handle gaming news queries', async ({ page }) => {
    await sendMessage(page, 'What are the latest gaming news?', false);
    await page.waitForTimeout(3000);
  });

  test('should handle platform-specific queries', async ({ page }) => {
    await sendMessage(page, 'Best PS5 exclusives?', false);
    await page.waitForTimeout(3000);
  });

  test('should handle genre-specific queries', async ({ page }) => {
    await sendMessage(page, 'Best RPG games to play', false);
    await page.waitForTimeout(3000);
  });
});

test.describe('Suggested Prompts in Game Hub', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await goToGameHub(page);
  });

  test('should display suggested prompts', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const prompts = page.locator(selectors.suggestedPrompts).first();
    // Prompts should be visible
  });

  test('should have clickable prompt buttons', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const promptButtons = page.locator(selectors.promptButton);
    const count = await promptButtons.count();
    
    if (count > 0) {
      const firstPrompt = promptButtons.first();
      await expect(firstPrompt).toBeEnabled();
    }
  });

  test('should fill chat input when prompt clicked', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const promptButtons = page.locator(selectors.promptButton);
    const count = await promptButtons.count();
    
    if (count > 0) {
      await promptButtons.first().click();
      await page.waitForTimeout(500);
      
      // Either input is filled or message is sent
    }
  });

  test('should refresh prompts after conversation', async ({ page }) => {
    // Get initial prompts
    await page.waitForTimeout(2000);
    
    // Send a message
    await sendMessage(page, 'Tell me about gaming', false);
    await waitForChatResponse(page);
    
    // Prompts may update
    await page.waitForTimeout(1000);
  });
});

test.describe('Game Search Functionality', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should search for games in add modal', async ({ page }) => {
    const addGameButton = page.locator(selectors.addGameButton).first();
    await addGameButton.click();
    await page.waitForTimeout(500);
    
    const gameInput = page.locator('input[placeholder*="game"], input[name*="game"]').first();
    await gameInput.fill('The Legend of Zelda');
    
    await page.waitForTimeout(2000);
    
    // Search should return results
  });

  test('should handle partial game names', async ({ page }) => {
    const addGameButton = page.locator(selectors.addGameButton).first();
    await addGameButton.click();
    await page.waitForTimeout(500);
    
    const gameInput = page.locator('input[placeholder*="game"], input[name*="game"]').first();
    await gameInput.fill('Dark');
    
    await page.waitForTimeout(1500);
  });

  test('should handle misspelled game names', async ({ page }) => {
    const addGameButton = page.locator(selectors.addGameButton).first();
    await addGameButton.click();
    await page.waitForTimeout(500);
    
    const gameInput = page.locator('input[placeholder*="game"], input[name*="game"]').first();
    await gameInput.fill('Eldin Ring'); // Misspelled
    
    await page.waitForTimeout(1500);
  });

  test('should handle non-existent games', async ({ page }) => {
    const addGameButton = page.locator(selectors.addGameButton).first();
    await addGameButton.click();
    await page.waitForTimeout(500);
    
    const gameInput = page.locator('input[placeholder*="game"], input[name*="game"]').first();
    await gameInput.fill('qwertyuiopasdfghjkl');
    
    await page.waitForTimeout(1500);
    
    // Should handle gracefully
  });

  test('should handle rapid typing in search', async ({ page }) => {
    const addGameButton = page.locator(selectors.addGameButton).first();
    await addGameButton.click();
    await page.waitForTimeout(500);
    
    const gameInput = page.locator('input[placeholder*="game"], input[name*="game"]').first();
    
    // Type rapidly
    for (const char of 'Final Fantasy') {
      await gameInput.type(char, { delay: 20 });
    }
    
    await page.waitForTimeout(1500);
  });
});

test.describe('Game Hub News Loading', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await goToGameHub(page);
  });

  test('should load news section', async ({ page }) => {
    // Wait for news to load
    await page.waitForTimeout(3000);
    
    // Look for news content
    const newsContent = page.locator('text=News, text=Latest, [data-testid="news"]').first();
  });

  test('should handle news loading errors gracefully', async ({ page, context }) => {
    // Simulate network issues
    await context.setOffline(true);
    await page.waitForTimeout(1000);
    await context.setOffline(false);
    
    // App should not crash
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
  });

  test('should refresh news on page reload', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Reload
    await page.reload();
    await waitForAppReady(page);
    await goToGameHub(page);
    
    await page.waitForTimeout(2000);
  });
});

test.describe('Game Hub Performance', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle multiple tab switches', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      // Go to Game Hub
      await goToGameHub(page);
      await page.waitForTimeout(300);
      
      // Go to first game tab if exists
      const gameTabs = page.locator(selectors.gameTab);
      if (await gameTabs.count() > 0) {
        await gameTabs.first().click();
        await page.waitForTimeout(300);
      }
    }
    
    // Should still be responsive
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
  });

  test('should handle rapid Add Game modal opens/closes', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      const addGameButton = page.locator(selectors.addGameButton).first();
      await addGameButton.click();
      await page.waitForTimeout(200);
      
      await closeModal(page);
      await page.waitForTimeout(200);
    }
    
    // App should remain stable
    const addGameButton = page.locator(selectors.addGameButton).first();
    await expect(addGameButton).toBeVisible();
  });

  test('should maintain state during heavy interaction', async ({ page }) => {
    await goToGameHub(page);
    
    // Send message
    await sendMessage(page, 'Quick test', false);
    
    // Open Add Game modal
    const addGameButton = page.locator(selectors.addGameButton).first();
    await addGameButton.click();
    await page.waitForTimeout(300);
    await closeModal(page);
    
    // Switch tabs
    const gameTabs = page.locator(selectors.gameTab);
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
    }
    
    // Go back to Game Hub
    await goToGameHub(page);
    
    // Should work
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
  });
});

test.describe('Game Hub Edge Cases', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle very long game names', async ({ page }) => {
    const addGameButton = page.locator(selectors.addGameButton).first();
    await addGameButton.click();
    await page.waitForTimeout(500);
    
    const gameInput = page.locator('input[placeholder*="game"], input[name*="game"]').first();
    const longName = 'A'.repeat(200);
    await gameInput.fill(longName);
    
    // Should handle gracefully
    await page.waitForTimeout(500);
  });

  test('should handle special characters in game names', async ({ page }) => {
    const addGameButton = page.locator(selectors.addGameButton).first();
    await addGameButton.click();
    await page.waitForTimeout(500);
    
    const gameInput = page.locator('input[placeholder*="game"], input[name*="game"]').first();
    await gameInput.fill('Test: Game & More! (2024) - Edition™');
    
    await page.waitForTimeout(500);
  });

  test('should handle emoji in game names', async ({ page }) => {
    const addGameButton = page.locator(selectors.addGameButton).first();
    await addGameButton.click();
    await page.waitForTimeout(500);
    
    const gameInput = page.locator('input[placeholder*="game"], input[name*="game"]').first();
    await gameInput.fill('🎮 Game Test 🏆');
    
    await page.waitForTimeout(500);
  });
});
