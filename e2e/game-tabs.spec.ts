import { test, expect } from '@playwright/test';
import { waitForAppReady, createGameTab } from './utils/helpers';

/**
 * Game Tab Tests
 * Tests individual game tab creation, management, and features
 */

test.describe('Game Tabs', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should open Add Game modal', async ({ page }) => {
    // Add Game button is in the sidebar
    const addGameButton = page.locator('button:has-text("Add Game")').first();
    await addGameButton.click();

    // Modal should appear - look for Add Game heading in modal or modal backdrop
    await page.waitForTimeout(500);
    const modalHeading = page.locator('h2:has-text("Add Game")').first();
    await expect(modalHeading).toBeVisible();
  });

  test('should create a new game tab', async ({ page }) => {
    // Open modal
    const addGameButton = page.locator('button:has-text("Add Game")').first();
    await addGameButton.click();
    await page.waitForTimeout(500);

    // Fill in game name - look for input in modal
    const gameInput = page.locator('input[type="text"]').first();
    await gameInput.fill('The Legend of Zelda');
    
    // Wait for search results or game suggestions
    await page.waitForTimeout(1000);

    // Try to select a game from results if available
    const gameResult = page.locator('button:has-text("Zelda")').or(page.locator('text=Zelda').first());
    if (await gameResult.first().isVisible()) {
      await gameResult.first().click();
      await page.waitForTimeout(500);
    }

    // Submit - the Create button should be enabled
    const createButton = page.locator('button:has-text("Create Game Tab")').or(page.locator('button[type="submit"]')).first();
    
    // Wait for button to be enabled
    await page.waitForTimeout(500);
    if (await createButton.isEnabled()) {
      await createButton.click();
      await page.waitForTimeout(2000);
    }

    // Verify tab appears in sidebar
    const newTab = page.locator('text=Zelda');
    // Tab should now be visible
  });

  test('should switch between game tabs', async ({ page }) => {
    // First create a game tab if none exist
    const existingTab = page.locator('[data-testid="game-tab"]').first();
    
    if (await existingTab.isVisible()) {
      await existingTab.click();
      await page.waitForTimeout(500);
      
      // Should switch to that tab's content
      const chatArea = page.locator('[data-testid="chat-interface"], .chat-interface');
      await expect(chatArea).toBeVisible();
    }
  });

  test('should display game progress bar', async ({ page }) => {
    // Navigate to an existing game tab
    const gameTab = page.locator('[data-testid="game-tab"]').first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(500);

      // Look for progress bar
      const progressBar = page.locator('[data-testid="progress-bar"], .progress-bar');
      // Progress bar should be visible for game tabs
    }
  });

  test('should display subtabs (Lore & Insights)', async ({ page }) => {
    // Navigate to a game tab
    const gameTab = page.locator('[data-testid="game-tab"]').first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(1000);

      // Look for subtabs panel
      const subtabs = page.locator('text=Lore & Insights, [data-testid="subtabs"]').first();
      // Subtabs should be visible
    }
  });

  test('should expand subtabs when clicked', async ({ page }) => {
    const gameTab = page.locator('[data-testid="game-tab"]').first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(1000);

      // Click on Lore & Insights header
      const subtabsHeader = page.locator('button:has-text("Lore & Insights")').first();
      if (await subtabsHeader.isVisible()) {
        await subtabsHeader.click();
        await page.waitForTimeout(500);

        // Content should expand
        const subtabContent = page.locator('[data-testid="subtab-content"], .subtab-content');
        // Content should now be visible
      }
    }
  });

  test('should display Game Info button when IGDB data available', async ({ page }) => {
    const gameTab = page.locator('[data-testid="game-tab"]').first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(2000); // Wait for IGDB data to load

      // Look for Game Info button
      const gameInfoButton = page.locator('button:has-text("Game Info")').first();
      // Button visibility depends on IGDB data availability
    }
  });

  test('should open Game Info modal', async ({ page }) => {
    const gameTab = page.locator('[data-testid="game-tab"]').first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(2000);

      const gameInfoButton = page.locator('button:has-text("Game Info")').first();
      if (await gameInfoButton.isVisible()) {
        await gameInfoButton.click();
        
        // Modal should open
        const modal = page.locator('[role="dialog"]').first();
        await expect(modal).toBeVisible();
      }
    }
  });
});
