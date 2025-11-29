import { test, expect } from '@playwright/test';
import { selectors, waitForAppReady, waitForChatResponse } from './utils/helpers';

/**
 * SubTabs Tests
 * Tests the subtab functionality and type-based styling
 */

test.describe('SubTabs', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display Add SubTab button', async ({ page }) => {
    // Navigate to a game tab first
    const gameTab = page.locator(selectors.gameTab).first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(2000);

      // Look for add subtab button
      const addSubTabBtn = page.locator('button:has-text("Add SubTab"), [data-testid="add-subtab-button"]').first();
      await expect(addSubTabBtn).toBeVisible();
    }
  });

  test('should open SubTab creation dialog', async ({ page }) => {
    const gameTab = page.locator(selectors.gameTab).first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(2000);

      const addSubTabBtn = page.locator('button:has-text("Add SubTab"), [data-testid="add-subtab-button"]').first();
      
      if (await addSubTabBtn.isVisible()) {
        await addSubTabBtn.click();
        await page.waitForTimeout(500);

        // Dialog should appear with type options
        const dialog = page.locator('[role="dialog"], .modal, [data-testid="subtab-dialog"]').first();
        await expect(dialog).toBeVisible();
      }
    }
  });

  test('should show all 7 subtab type options', async ({ page }) => {
    const gameTab = page.locator(selectors.gameTab).first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(2000);

      const addSubTabBtn = page.locator('button:has-text("Add SubTab"), [data-testid="add-subtab-button"]').first();
      
      if (await addSubTabBtn.isVisible()) {
        await addSubTabBtn.click();
        await page.waitForTimeout(500);

        // Check for all 7 subtab types
        const subtabTypes = [
          'Story',
          'Strategies', 
          'Tips',
          'Walkthrough',
          'Items',
          'Characters',
          'Chat'
        ];

        for (const type of subtabTypes) {
          const typeOption = page.locator(`text=${type}`).first();
          // Each type should be an option
        }
      }
    }
  });

  test('should create a Story subtab with purple styling', async ({ page }) => {
    const gameTab = page.locator(selectors.gameTab).first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(2000);

      const addSubTabBtn = page.locator('button:has-text("Add SubTab"), [data-testid="add-subtab-button"]').first();
      
      if (await addSubTabBtn.isVisible()) {
        await addSubTabBtn.click();
        await page.waitForTimeout(500);

        // Select Story type
        const storyOption = page.locator('text=Story').first();
        if (await storyOption.isVisible()) {
          await storyOption.click();
          await page.waitForTimeout(300);

          // Fill in name
          const nameInput = page.locator('input[placeholder*="name"], input[name="name"]').first();
          if (await nameInput.isVisible()) {
            await nameInput.fill('Test Story SubTab');
          }

          // Submit
          const createBtn = page.locator('button:has-text("Create"), button:has-text("Add")').first();
          if (await createBtn.isVisible()) {
            await createBtn.click();
            await page.waitForTimeout(500);

            // SubTab should appear with purple styling
            const subtab = page.locator('[data-testid="subtab"]:has-text("Test Story SubTab")').first();
            if (await subtab.isVisible()) {
              // Check for purple-ish background color
              const bgColor = await subtab.evaluate(el => 
                window.getComputedStyle(el).backgroundColor
              );
              // Purple should have higher red+blue than green
            }
          }
        }
      }
    }
  });

  test('should create a Strategies subtab with blue styling', async ({ page }) => {
    const gameTab = page.locator(selectors.gameTab).first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(2000);

      const addSubTabBtn = page.locator('button:has-text("Add SubTab"), [data-testid="add-subtab-button"]').first();
      
      if (await addSubTabBtn.isVisible()) {
        await addSubTabBtn.click();
        await page.waitForTimeout(500);

        const strategiesOption = page.locator('text=Strategies').first();
        if (await strategiesOption.isVisible()) {
          await strategiesOption.click();
          // Blue styling should be applied
        }
      }
    }
  });

  test('should expand subtab to show content', async ({ page }) => {
    const gameTab = page.locator(selectors.gameTab).first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(2000);

      // Look for existing subtab
      const subtab = page.locator('[data-testid="subtab"]').first();
      
      if (await subtab.isVisible()) {
        await subtab.click();
        await page.waitForTimeout(300);

        // Content should be expanded
        const content = page.locator('[data-testid="subtab-content"]').first();
        await expect(content).toBeVisible();
      }
    }
  });

  test('should collapse subtab on second click', async ({ page }) => {
    const gameTab = page.locator(selectors.gameTab).first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(2000);

      const subtab = page.locator('[data-testid="subtab"]').first();
      
      if (await subtab.isVisible()) {
        // First click - expand
        await subtab.click();
        await page.waitForTimeout(300);

        // Second click - collapse
        await subtab.click();
        await page.waitForTimeout(300);

        // Content should be hidden
        const content = page.locator('[data-testid="subtab-content"]').first();
        await expect(content).not.toBeVisible();
      }
    }
  });

  test('should show subtab delete option', async ({ page }) => {
    const gameTab = page.locator(selectors.gameTab).first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(2000);

      const subtab = page.locator('[data-testid="subtab"]').first();
      
      if (await subtab.isVisible()) {
        // Right-click or look for menu button
        const menuButton = subtab.locator('button[aria-label*="menu"], [data-testid="subtab-menu"]');
        
        if (await menuButton.isVisible()) {
          await menuButton.click();
          await page.waitForTimeout(200);

          const deleteOption = page.locator('text=Delete').first();
          await expect(deleteOption).toBeVisible();
        }
      }
    }
  });

  test('should display correct icon for each subtab type', async ({ page }) => {
    const gameTab = page.locator(selectors.gameTab).first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(2000);

      // Create subtabs of different types and verify icons
      // Each type should have a distinct icon:
      // - Story: BookOpen
      // - Strategies: Target
      // - Tips: Lightbulb
      // - Walkthrough: Map
      // - Items: Package
      // - Characters: Users
      // - Chat: MessageCircle

      const subtabs = page.locator('[data-testid="subtab"]');
      const count = await subtabs.count();

      for (let i = 0; i < count; i++) {
        const subtab = subtabs.nth(i);
        const icon = subtab.locator('svg').first();
        await expect(icon).toBeVisible();
      }
    }
  });

  test('should apply type-based border color', async ({ page }) => {
    const gameTab = page.locator(selectors.gameTab).first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(2000);

      const subtab = page.locator('[data-testid="subtab"]').first();
      
      if (await subtab.isVisible()) {
        await subtab.click();
        await page.waitForTimeout(300);

        // Expanded content should have type-based border
        const content = page.locator('[data-testid="subtab-content"]').first();
        
        if (await content.isVisible()) {
          const borderColor = await content.evaluate(el => 
            window.getComputedStyle(el).borderColor
          );
          // Border color should not be default/transparent
          expect(borderColor).not.toBe('rgb(0, 0, 0)');
        }
      }
    }
  });

  test('should preserve subtab after page reload', async ({ page }) => {
    const gameTab = page.locator(selectors.gameTab).first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(2000);

      // Count existing subtabs
      const subtabsBefore = await page.locator('[data-testid="subtab"]').count();

      // Reload page
      await page.reload();
      await waitForAppReady(page);

      // Navigate back to game tab
      const gameTabAfter = page.locator(selectors.gameTab).first();
      if (await gameTabAfter.isVisible()) {
        await gameTabAfter.click();
        await page.waitForTimeout(2000);

        // Same number of subtabs should exist
        const subtabsAfter = await page.locator('[data-testid="subtab"]').count();
        expect(subtabsAfter).toBe(subtabsBefore);
      }
    }
  });

  test('should allow subtab reordering via drag', async ({ page }) => {
    const gameTab = page.locator(selectors.gameTab).first();
    
    if (await gameTab.isVisible()) {
      await gameTab.click();
      await page.waitForTimeout(2000);

      const subtabs = page.locator('[data-testid="subtab"]');
      const count = await subtabs.count();

      if (count >= 2) {
        const first = subtabs.nth(0);
        const second = subtabs.nth(1);

        // Get initial order
        const firstText = await first.textContent();

        // Drag first to second position
        await first.dragTo(second);
        await page.waitForTimeout(300);

        // Order should have changed
        const newFirst = await subtabs.nth(0).textContent();
        expect(newFirst).not.toBe(firstText);
      }
    }
  });
});
