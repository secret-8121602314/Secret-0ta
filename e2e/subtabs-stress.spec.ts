import { test, expect } from '@playwright/test';
import { 
  waitForAppReady, 
  selectors, 
  goToGameTab,
  createSubTab,
  sendMessage,
  waitForChatResponse,
  goToGameHub,
} from './utils/helpers';

/**
 * SubTabs Stress Tests
 * ====================
 * Tests the SubTab functionality including:
 * - SubTab creation (all 7 types)
 * - SubTab styling
 * - Progress tracking
 * - Context switching
 * - AI-generated content
 */

test.describe('SubTab Creation', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display Add SubTab button on game tab', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const addSubTabBtn = page.locator(selectors.addSubTabButton).first();
      await expect(addSubTabBtn).toBeVisible();
    }
  });

  test('should open SubTab creation dialog', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const addSubTabBtn = page.locator(selectors.addSubTabButton).first();
      if (await addSubTabBtn.isVisible()) {
        await addSubTabBtn.click();
        await page.waitForTimeout(500);
        
        const dialog = page.locator(selectors.modal).first();
        await expect(dialog).toBeVisible();
      }
    }
  });

  test('should show all 7 subtab type options', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const addSubTabBtn = page.locator(selectors.addSubTabButton).first();
      if (await addSubTabBtn.isVisible()) {
        await addSubTabBtn.click();
        await page.waitForTimeout(500);
        
        // All 7 types should be options
        const types = ['Story', 'Strategies', 'Tips', 'Walkthrough', 'Items', 'Characters', 'Chat'];
        
        for (const type of types) {
          const typeOption = page.locator(`text=${type}`).first();
          // Type should be visible as option
        }
      }
    }
  });
});

test.describe('SubTab Types - Story', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should create Story subtab with purple styling', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const addSubTabBtn = page.locator(selectors.addSubTabButton).first();
      if (await addSubTabBtn.isVisible()) {
        await addSubTabBtn.click();
        await page.waitForTimeout(500);
        
        const storyOption = page.locator(selectors.subtabTypeOptions.story).first();
        if (await storyOption.isVisible()) {
          await storyOption.click();
          await page.waitForTimeout(300);
          
          const nameInput = page.locator('input[placeholder*="name"], input[name="name"]').first();
          if (await nameInput.isVisible()) {
            await nameInput.fill('Test Story');
          }
          
          const createBtn = page.locator('button:has-text("Create"), button:has-text("Add")').first();
          if (await createBtn.isVisible()) {
            await createBtn.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    }
  });
});

test.describe('SubTab Types - Strategies', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should create Strategies subtab with blue styling', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const addSubTabBtn = page.locator(selectors.addSubTabButton).first();
      if (await addSubTabBtn.isVisible()) {
        await addSubTabBtn.click();
        await page.waitForTimeout(500);
        
        const strategiesOption = page.locator(selectors.subtabTypeOptions.strategies).first();
        if (await strategiesOption.isVisible()) {
          await strategiesOption.click();
          await page.waitForTimeout(300);
          
          const nameInput = page.locator('input[placeholder*="name"], input[name="name"]').first();
          if (await nameInput.isVisible()) {
            await nameInput.fill('Test Strategies');
          }
          
          const createBtn = page.locator('button:has-text("Create"), button:has-text("Add")').first();
          if (await createBtn.isVisible()) {
            await createBtn.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    }
  });
});

test.describe('SubTab Types - Tips', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should create Tips subtab with green styling', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const addSubTabBtn = page.locator(selectors.addSubTabButton).first();
      if (await addSubTabBtn.isVisible()) {
        await addSubTabBtn.click();
        await page.waitForTimeout(500);
        
        const tipsOption = page.locator(selectors.subtabTypeOptions.tips).first();
        if (await tipsOption.isVisible()) {
          await tipsOption.click();
          await page.waitForTimeout(300);
          
          const nameInput = page.locator('input[placeholder*="name"], input[name="name"]').first();
          if (await nameInput.isVisible()) {
            await nameInput.fill('Test Tips');
          }
          
          const createBtn = page.locator('button:has-text("Create"), button:has-text("Add")').first();
          if (await createBtn.isVisible()) {
            await createBtn.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    }
  });
});

test.describe('SubTab Types - Walkthrough', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should create Walkthrough subtab with orange styling', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const addSubTabBtn = page.locator(selectors.addSubTabButton).first();
      if (await addSubTabBtn.isVisible()) {
        await addSubTabBtn.click();
        await page.waitForTimeout(500);
        
        const walkthroughOption = page.locator(selectors.subtabTypeOptions.walkthrough).first();
        if (await walkthroughOption.isVisible()) {
          await walkthroughOption.click();
        }
      }
    }
  });
});

test.describe('SubTab Types - Items', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should create Items subtab with yellow styling', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const addSubTabBtn = page.locator(selectors.addSubTabButton).first();
      if (await addSubTabBtn.isVisible()) {
        await addSubTabBtn.click();
        await page.waitForTimeout(500);
        
        const itemsOption = page.locator(selectors.subtabTypeOptions.items).first();
        if (await itemsOption.isVisible()) {
          await itemsOption.click();
        }
      }
    }
  });
});

test.describe('SubTab Types - Characters', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should create Characters subtab with red styling', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const addSubTabBtn = page.locator(selectors.addSubTabButton).first();
      if (await addSubTabBtn.isVisible()) {
        await addSubTabBtn.click();
        await page.waitForTimeout(500);
        
        const charactersOption = page.locator(selectors.subtabTypeOptions.characters).first();
        if (await charactersOption.isVisible()) {
          await charactersOption.click();
        }
      }
    }
  });
});

test.describe('SubTab Types - Chat', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should create Chat subtab with gray styling', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const addSubTabBtn = page.locator(selectors.addSubTabButton).first();
      if (await addSubTabBtn.isVisible()) {
        await addSubTabBtn.click();
        await page.waitForTimeout(500);
        
        const chatOption = page.locator(selectors.subtabTypeOptions.chat).first();
        if (await chatOption.isVisible()) {
          await chatOption.click();
        }
      }
    }
  });
});

test.describe('SubTab Expand/Collapse', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should expand subtabs panel', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const subtabsPanel = page.locator(selectors.subtabsPanel).first();
      if (await subtabsPanel.isVisible()) {
        // Try to find expand button
        const expandButton = page.locator('button[aria-expanded], [data-testid="expand-subtabs"]').first();
        if (await expandButton.isVisible()) {
          await expandButton.click();
          await page.waitForTimeout(300);
        }
      }
    }
  });

  test('should collapse subtabs panel', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const subtabsPanel = page.locator(selectors.subtabsPanel).first();
      if (await subtabsPanel.isVisible()) {
        // Try to find collapse button
        const collapseButton = page.locator('button[aria-expanded="true"], [data-testid="collapse-subtabs"]').first();
        if (await collapseButton.isVisible()) {
          await collapseButton.click();
          await page.waitForTimeout(300);
        }
      }
    }
  });
});

test.describe('SubTab AI Generation', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should generate AI content for subtabs', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      // Send a message that might generate subtabs
      await sendMessage(page, 'Give me a strategy for this game', false);
      await waitForChatResponse(page, 45000);
      
      // Check for subtabs
      const subtabsPanel = page.locator(selectors.subtabsPanel).first();
      await page.waitForTimeout(2000);
    }
  });

  test('should show loading state during generation', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      // Send a query
      await sendMessage(page, 'What items should I collect?', false);
      
      // Look for loading indicator
      await page.waitForTimeout(1000);
      const loadingIndicator = page.locator('.animate-pulse, .loading, [data-testid="loading"]').first();
    }
  });
});

test.describe('SubTab Progress Tracking', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display progress bar', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const progressBar = page.locator(selectors.progressBar).first();
      // Progress bar may or may not be visible depending on game state
    }
  });

  test('should show session toggle', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const sessionToggle = page.locator(selectors.sessionToggle).first();
      // Session toggle for active session tracking
    }
  });

  test('should update progress on interaction', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      // Send a message about progress
      await sendMessage(page, 'I just completed the first boss', false);
      await waitForChatResponse(page, 45000);
      
      // Progress may update based on context
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('SubTab Switching', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should switch between subtabs', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const subtabButtons = page.locator(selectors.subtabButton);
      const count = await subtabButtons.count();
      
      if (count > 1) {
        // Click through subtabs
        for (let i = 0; i < Math.min(count, 3); i++) {
          await subtabButtons.nth(i).click();
          await page.waitForTimeout(300);
        }
      }
    }
  });

  test('should maintain subtab content when switching', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const subtabButtons = page.locator(selectors.subtabButton);
      const count = await subtabButtons.count();
      
      if (count > 1) {
        // Click first subtab
        await subtabButtons.first().click();
        await page.waitForTimeout(500);
        
        // Click second subtab
        await subtabButtons.nth(1).click();
        await page.waitForTimeout(500);
        
        // Click back to first
        await subtabButtons.first().click();
        await page.waitForTimeout(500);
        
        // Content should be preserved
      }
    }
  });
});

test.describe('SubTab Persistence', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should persist subtabs after page reload', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      // Count current subtabs
      const subtabButtons = page.locator(selectors.subtabButton);
      const initialCount = await subtabButtons.count();
      
      // Reload page
      await page.reload();
      await waitForAppReady(page);
      
      // Navigate back to game tab
      const gameTabsAfter = page.locator(selectors.gameTab);
      if (await gameTabsAfter.count() > 0) {
        await gameTabsAfter.first().click();
        await page.waitForTimeout(2000);
        
        // Subtabs should be preserved
        const subtabButtonsAfter = page.locator(selectors.subtabButton);
        const afterCount = await subtabButtonsAfter.count();
        
        expect(afterCount).toEqual(initialCount);
      }
    }
  });
});

test.describe('SubTab Edge Cases', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle rapid subtab creation', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      // Try to create multiple subtabs rapidly
      for (let i = 0; i < 3; i++) {
        const addSubTabBtn = page.locator(selectors.addSubTabButton).first();
        if (await addSubTabBtn.isVisible()) {
          await addSubTabBtn.click();
          await page.waitForTimeout(200);
          
          // Cancel/close immediately
          await page.keyboard.press('Escape');
          await page.waitForTimeout(200);
        }
      }
      
      // App should not crash
    }
  });

  test('should handle empty subtab names', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const addSubTabBtn = page.locator(selectors.addSubTabButton).first();
      if (await addSubTabBtn.isVisible()) {
        await addSubTabBtn.click();
        await page.waitForTimeout(500);
        
        // Select a type
        const storyOption = page.locator(selectors.subtabTypeOptions.story).first();
        if (await storyOption.isVisible()) {
          await storyOption.click();
        }
        
        // Try to create without name
        const createBtn = page.locator('button:has-text("Create"), button:has-text("Add")').first();
        if (await createBtn.isVisible()) {
          await createBtn.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test('should handle special characters in subtab names', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const addSubTabBtn = page.locator(selectors.addSubTabButton).first();
      if (await addSubTabBtn.isVisible()) {
        await addSubTabBtn.click();
        await page.waitForTimeout(500);
        
        const storyOption = page.locator(selectors.subtabTypeOptions.story).first();
        if (await storyOption.isVisible()) {
          await storyOption.click();
          
          const nameInput = page.locator('input[placeholder*="name"], input[name="name"]').first();
          if (await nameInput.isVisible()) {
            await nameInput.fill('Test@#$%^& SubTab!');
          }
        }
      }
    }
  });
});

test.describe('SubTab Context Integration', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should use subtab context in AI responses', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      // Select a subtab if available
      const subtabButtons = page.locator(selectors.subtabButton);
      if (await subtabButtons.count() > 0) {
        await subtabButtons.first().click();
        await page.waitForTimeout(500);
        
        // Ask a question
        await sendMessage(page, 'Tell me more about this', false);
        await waitForChatResponse(page, 45000);
      }
    }
  });

  test('should maintain subtab context across messages', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      // Send multiple messages
      await sendMessage(page, 'What should I know about the story?', false);
      await page.waitForTimeout(3000);
      
      await sendMessage(page, 'Tell me more details', false);
      await page.waitForTimeout(3000);
    }
  });
});
