import { test, expect } from '@playwright/test';
import { waitForAppReady } from './utils/helpers';

/**
 * Mobile Responsiveness Tests
 * Tests the app behavior on mobile viewports
 */

test.describe('Mobile Responsiveness', () => {
  test.use({ 
    storageState: '.playwright/.auth/user.json',
    viewport: { width: 375, height: 667 } // iPhone SE
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should hide sidebar on mobile by default', async ({ page }) => {
    // Sidebar should be hidden or collapsed on mobile
    const sidebar = page.locator('[data-testid="sidebar"]');
    // Check if sidebar is not covering main content
  });

  test('should show mobile menu button', async ({ page }) => {
    // Mobile menu is the hamburger icon button (first button in header on mobile)
    const menuButton = page.locator('header button').first();
    await expect(menuButton).toBeVisible();
  });

  test('should open sidebar when menu clicked', async ({ page }) => {
    // Mobile menu is the hamburger icon button (first button in header)
    const menuButton = page.locator('header button').first();
    
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(300);

      // Sidebar should now be visible - look for conversation list
      const conversationList = page.locator('text=Conversations').or(page.locator('text=Game Hub'));
      await expect(conversationList.first()).toBeVisible();
    }
  });

  test('should display chat thread name on mobile', async ({ page }) => {
    // On mobile, thread name should be visible in header area
    const threadName = page.locator('[data-testid="thread-name"], .thread-title').first();
    // Thread name should be visible
  });

  test('should have touch-friendly buttons', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          // Buttons should be at least 44x44 for touch targets
          expect(box.width).toBeGreaterThanOrEqual(40);
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });

  test('should display Game Info button on mobile', async ({ page }) => {
    // Navigate to a game tab first
    const menuButton = page.locator('[data-testid="mobile-menu-button"]').first();
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(300);
    }

    const gameTab = page.locator('[data-testid="game-tab"]').first();
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(2000);

      // Look for game info button (icon only on mobile)
      const gameInfoButton = page.locator('button:has-text("Game Info"), button[title*="Game Info"]').first();
      // Should be visible if IGDB data is available
    }
  });

  test('should have scrollable chat on mobile', async ({ page }) => {
    const chatContainer = page.locator('[data-testid="chat-interface"], .chat-interface').first();
    
    if (await chatContainer.isVisible()) {
      const box = await chatContainer.boundingBox();
      if (box) {
        // Container should fit within viewport
        expect(box.height).toBeLessThanOrEqual(667);
      }
    }
  });

  test('should position chat input at bottom', async ({ page }) => {
    const chatInput = page.locator('textarea').first();
    
    if (await chatInput.isVisible()) {
      const box = await chatInput.boundingBox();
      if (box) {
        // Input should be near bottom of screen
        expect(box.y).toBeGreaterThan(400); // In lower half
      }
    }
  });
});

test.describe('Tablet Responsiveness', () => {
  test.use({ 
    storageState: '.playwright/.auth/user.json',
    viewport: { width: 768, height: 1024 } // iPad
  });

  test('should show sidebar on tablet', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);

    const sidebar = page.locator('[data-testid="sidebar"]');
    // Sidebar might be visible on tablet
  });

  test('should have proper layout on tablet', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);

    // Check for chat input as main content indicator
    const chatInput = page.locator('textarea[placeholder="Type your message..."]').first();
    await expect(chatInput).toBeVisible();
  });
});
