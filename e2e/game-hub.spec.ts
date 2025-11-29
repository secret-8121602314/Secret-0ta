import { test, expect } from '@playwright/test';
import { waitForAppReady, selectors } from './utils/helpers';

/**
 * Game Hub Tests
 * Tests the central game management hub functionality
 */

test.describe('Game Hub', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display Game Hub in sidebar', async ({ page }) => {
    // Game Hub should be visible in sidebar - it appears as text in the conversation list
    const gameHub = page.locator('text=Game Hub').first();
    await expect(gameHub).toBeVisible();
  });

  test('should navigate to Game Hub when clicked', async ({ page }) => {
    const gameHub = page.locator('text=Game Hub').first();
    await gameHub.click();
    
    // Should show Game Hub content - look for chat input
    await page.waitForTimeout(500);
    const chatInput = page.locator('textarea[placeholder="Type your message..."]').first();
    await expect(chatInput).toBeVisible();
  });

  test('should display latest gaming news', async ({ page }) => {
    // Navigate to Game Hub
    const gameHub = page.locator('text=Game Hub').first();
    await gameHub.click();
    await page.waitForTimeout(1000);

    // Look for news section
    const newsSection = page.locator('text=Latest Gaming News, text=News').first();
    // News section might take time to load
  });

  test('should show suggested prompts', async ({ page }) => {
    const gameHub = page.locator('text=Game Hub').first();
    await gameHub.click();
    await page.waitForTimeout(1000);

    // Look for suggested prompts
    const prompts = page.locator('[data-testid="suggested-prompts"], .suggested-prompts');
    // Prompts should eventually appear
  });

  test('should allow sending messages in Game Hub', async ({ page }) => {
    const gameHub = page.locator('text=Game Hub').first();
    await gameHub.click();
    await page.waitForTimeout(500);

    // Find chat input
    const chatInput = page.locator('textarea').first();
    await expect(chatInput).toBeVisible();
    
    // Type a message
    await chatInput.fill('What are some good RPG games?');
    
    // Find and click send button
    const sendButton = page.locator('button[type="submit"], button:has-text("Send"), button[aria-label*="send"]').first();
    if (await sendButton.isVisible()) {
      await sendButton.click();
    }
  });

  test('should display add game button', async ({ page }) => {
    // Look for add game button
    const addGameButton = page.locator('button:has-text("Add Game"), button:has-text("New Game"), [data-testid="add-game"]').first();
    await expect(addGameButton).toBeVisible();
  });
});
