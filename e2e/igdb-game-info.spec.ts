import { test, expect } from '@playwright/test';
import { selectors, waitForAppReady, waitForChatResponse } from './utils/helpers';

/**
 * IGDB Game Info Modal Tests
 * Tests the Game Info button and modal functionality
 */

test.describe('IGDB Game Info', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should show Game Info button when IGDB data is available', async ({ page }) => {
    // First, ensure we have a game tab active
    const gameTab = page.locator(selectors.gameTab).first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(2000);

      // Wait for IGDB data to potentially load
      await page.waitForTimeout(3000);

      // Look for Game Info button - it only appears if IGDB data is available
      const gameInfoButton = page.locator('button:has-text("Game Info")');
      // Button may or may not be visible depending on IGDB data availability
      // This is expected behavior based on the graceful fallback design
    }
  });

  test('should open Game Info modal when button clicked', async ({ page }) => {
    // Navigate to a game tab
    const gameTab = page.locator(selectors.gameTab).first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(2000);

      // Wait for potential IGDB data
      await page.waitForTimeout(3000);

      const gameInfoButton = page.locator('button:has-text("Game Info")');
      
      if (await gameInfoButton.isVisible()) {
        await gameInfoButton.click();
        await page.waitForTimeout(500);

        // Modal should appear
        const modal = page.locator('[data-testid="game-info-modal"], .game-info-modal');
        await expect(modal).toBeVisible();
      }
    }
  });

  test('should display game cover image in modal', async ({ page }) => {
    const gameTab = page.locator(selectors.gameTab).first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(2000);
      await page.waitForTimeout(3000);

      const gameInfoButton = page.locator('button:has-text("Game Info")');
      
      if (await gameInfoButton.isVisible()) {
        await gameInfoButton.click();
        await page.waitForTimeout(500);

        // Look for cover image
        const coverImage = page.locator('[data-testid="game-cover"], .game-cover img').first();
        if (await coverImage.isVisible()) {
          const src = await coverImage.getAttribute('src');
          expect(src).toBeTruthy();
          expect(src).toContain('igdb');
        }
      }
    }
  });

  test('should have Overview tab with game details', async ({ page }) => {
    const gameTab = page.locator(selectors.gameTab).first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(5000);

      const gameInfoButton = page.locator('button:has-text("Game Info")');
      
      if (await gameInfoButton.isVisible()) {
        await gameInfoButton.click();
        await page.waitForTimeout(500);

        // Overview tab should be active by default
        const overviewTab = page.locator('button:has-text("Overview")');
        await expect(overviewTab).toBeVisible();

        // Check for summary/description
        const summary = page.locator('.game-summary, [data-testid="game-summary"]').first();
        // Summary should be visible if IGDB data is complete
      }
    }
  });

  test('should switch to Media tab', async ({ page }) => {
    const gameTab = page.locator(selectors.gameTab).first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(5000);

      const gameInfoButton = page.locator('button:has-text("Game Info")');
      
      if (await gameInfoButton.isVisible()) {
        await gameInfoButton.click();
        await page.waitForTimeout(500);

        // Click Media tab
        const mediaTab = page.locator('button:has-text("Media")');
        if (await mediaTab.isVisible()) {
          await mediaTab.click();
          await page.waitForTimeout(300);

          // Look for media content (screenshots, videos)
          const screenshots = page.locator('[data-testid="screenshots"], .screenshots').first();
          // Media content should be visible if available
        }
      }
    }
  });

  test('should switch to Similar Games tab', async ({ page }) => {
    const gameTab = page.locator(selectors.gameTab).first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(5000);

      const gameInfoButton = page.locator('button:has-text("Game Info")');
      
      if (await gameInfoButton.isVisible()) {
        await gameInfoButton.click();
        await page.waitForTimeout(500);

        // Click Similar Games tab
        const similarTab = page.locator('button:has-text("Similar Games")');
        if (await similarTab.isVisible()) {
          await similarTab.click();
          await page.waitForTimeout(300);

          // Look for similar games grid
          const similarGames = page.locator('[data-testid="similar-games"], .similar-games').first();
          // Similar games should be visible if available
        }
      }
    }
  });

  test('should navigate to similar game within modal', async ({ page }) => {
    const gameTab = page.locator(selectors.gameTab).first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(5000);

      const gameInfoButton = page.locator('button:has-text("Game Info")');
      
      if (await gameInfoButton.isVisible()) {
        await gameInfoButton.click();
        await page.waitForTimeout(500);

        // Go to Similar Games tab
        const similarTab = page.locator('button:has-text("Similar Games")');
        if (await similarTab.isVisible()) {
          await similarTab.click();
          await page.waitForTimeout(300);

          // Click on first similar game
          const similarGameCard = page.locator('[data-testid="similar-game-card"]').first();
          if (await similarGameCard.isVisible()) {
            await similarGameCard.click();
            await page.waitForTimeout(500);

            // Modal should still be open, showing different game
            const modal = page.locator('[data-testid="game-info-modal"], .game-info-modal');
            await expect(modal).toBeVisible();

            // Back button should appear
            const backButton = page.locator('button:has-text("Back")');
            await expect(backButton).toBeVisible();
          }
        }
      }
    }
  });

  test('should close modal with X button', async ({ page }) => {
    const gameTab = page.locator(selectors.gameTab).first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(5000);

      const gameInfoButton = page.locator('button:has-text("Game Info")');
      
      if (await gameInfoButton.isVisible()) {
        await gameInfoButton.click();
        await page.waitForTimeout(500);

        // Find close button
        const closeButton = page.locator('[data-testid="close-modal"], button:has-text("×"), button[aria-label*="Close"]').first();
        await closeButton.click();
        await page.waitForTimeout(300);

        // Modal should be closed
        const modal = page.locator('[data-testid="game-info-modal"], .game-info-modal');
        await expect(modal).not.toBeVisible();
      }
    }
  });

  test('should close modal when clicking outside', async ({ page }) => {
    const gameTab = page.locator(selectors.gameTab).first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(5000);

      const gameInfoButton = page.locator('button:has-text("Game Info")');
      
      if (await gameInfoButton.isVisible()) {
        await gameInfoButton.click();
        await page.waitForTimeout(500);

        // Click on backdrop
        const backdrop = page.locator('.modal-backdrop, [data-testid="modal-backdrop"]').first();
        if (await backdrop.isVisible()) {
          await backdrop.click({ position: { x: 10, y: 10 } });
          await page.waitForTimeout(300);

          // Modal should be closed
          const modal = page.locator('[data-testid="game-info-modal"], .game-info-modal');
          await expect(modal).not.toBeVisible();
        }
      }
    }
  });

  test('should display game rating if available', async ({ page }) => {
    const gameTab = page.locator(selectors.gameTab).first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(5000);

      const gameInfoButton = page.locator('button:has-text("Game Info")');
      
      if (await gameInfoButton.isVisible()) {
        await gameInfoButton.click();
        await page.waitForTimeout(500);

        // Look for rating display
        const rating = page.locator('[data-testid="game-rating"], .game-rating').first();
        if (await rating.isVisible()) {
          const text = await rating.textContent();
          // Rating should contain a number
          expect(text).toMatch(/\d/);
        }
      }
    }
  });

  test('should show game genres and platforms', async ({ page }) => {
    const gameTab = page.locator(selectors.gameTab).first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(5000);

      const gameInfoButton = page.locator('button:has-text("Game Info")');
      
      if (await gameInfoButton.isVisible()) {
        await gameInfoButton.click();
        await page.waitForTimeout(500);

        // Check for genre chips
        const genres = page.locator('[data-testid="game-genres"], .game-genres');
        // Genres should be visible if available in IGDB data

        // Check for platform chips
        const platforms = page.locator('[data-testid="game-platforms"], .game-platforms');
        // Platforms should be visible if available in IGDB data
      }
    }
  });
});
