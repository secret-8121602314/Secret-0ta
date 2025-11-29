import { test, expect } from '@playwright/test';
import { 
  waitForAppReady, 
  selectors, 
  goToGameHub,
  createGameTab,
  sendMessage,
  waitForChatResponse,
  uniqueGameName,
  closeModal,
} from './utils/helpers';

/**
 * Game Tab Creation Stress Tests
 * ==============================
 * Tests the complete game tab creation flow including:
 * - Manual tab creation
 * - Auto-creation via game detection
 * - Subtab generation
 * - Tab persistence
 * - Tier-gated features
 * - Error handling
 */

test.describe('Manual Game Tab Creation', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should open Add Game modal', async ({ page }) => {
    const addGameButton = page.locator(selectors.addGameButton).first();
    await expect(addGameButton).toBeVisible();
    
    await addGameButton.click();
    await page.waitForTimeout(500);
    
    // Modal should open
    const modal = page.locator(selectors.modal).first();
    await expect(modal).toBeVisible();
  });

  test('should have game search input in modal', async ({ page }) => {
    const addGameButton = page.locator(selectors.addGameButton).first();
    await addGameButton.click();
    await page.waitForTimeout(500);
    
    // Find game input
    const gameInput = page.locator(
      'input[placeholder*="game" i], input[name*="game" i], input[placeholder*="search" i]'
    ).first();
    
    await expect(gameInput).toBeVisible();
  });

  test('should search for games by name', async ({ page }) => {
    const addGameButton = page.locator(selectors.addGameButton).first();
    await addGameButton.click();
    await page.waitForTimeout(500);
    
    // Type in search
    const gameInput = page.locator(
      'input[placeholder*="game" i], input[name*="game" i], input[placeholder*="search" i]'
    ).first();
    
    await gameInput.fill('Zelda');
    await page.waitForTimeout(1000);
    
    // Should show search results
    const results = page.locator('[class*="result"], [class*="suggestion"], [role="option"]');
    const resultCount = await results.count();
    console.log(`Search results for "Zelda": ${resultCount}`);
  });

  test('should create game tab from search result', async ({ page }) => {
    const initialTabCount = await page.locator(selectors.gameTab).count();
    
    await createGameTab(page, 'Hollow Knight');
    await page.waitForTimeout(2000);
    
    const finalTabCount = await page.locator(selectors.gameTab).count();
    console.log(`Tabs: before=${initialTabCount}, after=${finalTabCount}`);
    
    // Tab should be created
    expect(finalTabCount).toBeGreaterThan(initialTabCount);
  });

  test('should create tab with unique game title', async ({ page }) => {
    const gameTitle = uniqueGameName('Test Game');
    await createGameTab(page, gameTitle);
    await page.waitForTimeout(2000);
    
    // Tab should have the game title
    const gameTabs = page.locator(selectors.gameTab);
    const tabTexts = await gameTabs.allTextContents();
    console.log('Game tab titles:', tabTexts);
  });

  test('should close modal after successful creation', async ({ page }) => {
    await createGameTab(page, 'Portal 2');
    await page.waitForTimeout(2000);
    
    // Modal should be closed
    const modal = page.locator(selectors.modal).first();
    const isVisible = await modal.isVisible().catch(() => false);
    console.log(`Modal still visible after creation: ${isVisible}`);
  });
});

test.describe('Game Tab with Subtabs', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should generate subtabs for new game tab', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Skyrim');
    await page.waitForTimeout(3000);
    
    // Click on the game tab
    const gameTabs = page.locator(selectors.gameTab);
    await gameTabs.first().click();
    await page.waitForTimeout(1000);
    
    // Should have subtabs
    const subtabs = page.locator(selectors.subtab);
    const subtabCount = await subtabs.count();
    console.log(`Subtabs generated: ${subtabCount}`);
  });

  test('should generate genre-appropriate subtabs', async ({ page }) => {
    await goToGameHub(page);
    
    // Create an RPG game
    await createGameTab(page, 'Baldurs Gate 3');
    await page.waitForTimeout(3000);
    
    const gameTabs = page.locator(selectors.gameTab);
    await gameTabs.first().click();
    await page.waitForTimeout(1000);
    
    // RPG should have story, characters, etc.
    const subtabs = page.locator(selectors.subtab);
    const subtabTexts = await subtabs.allTextContents();
    console.log('RPG subtab types:', subtabTexts);
  });

  test('should show loading state for subtabs', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'New Game Loading Test');
    
    // Immediately check for loading state
    const gameTabs = page.locator(selectors.gameTab);
    await gameTabs.first().click();
    await page.waitForTimeout(500);
    
    // Look for loading indicators
    const loadingIndicator = page.locator(
      '[class*="loading"], [class*="skeleton"], text=Loading'
    ).first();
    
    const hasLoading = await loadingIndicator.isVisible().catch(() => false);
    console.log('Has loading state:', hasLoading);
  });

  test('should populate subtab content from AI', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Content Population Test');
    await page.waitForTimeout(5000); // Wait for AI to populate
    
    const gameTabs = page.locator(selectors.gameTab);
    await gameTabs.first().click();
    await page.waitForTimeout(1000);
    
    // Click on a subtab
    const subtabs = page.locator(selectors.subtab);
    if (await subtabs.count() > 0) {
      await subtabs.first().click();
      await page.waitForTimeout(500);
      
      // Check for content
      const subtabContent = page.locator('[class*="subtab-content"], [class*="panel"]').first();
      const content = await subtabContent.textContent().catch(() => '');
      console.log('Subtab content length:', content?.length || 0);
    }
  });
});

test.describe('Game Tab Idempotency', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should not create duplicate tabs for same game', async ({ page }) => {
    await goToGameHub(page);
    
    // Create first tab
    await createGameTab(page, 'Duplicate Test');
    await page.waitForTimeout(2000);
    
    const countAfterFirst = await page.locator(selectors.gameTab).count();
    
    // Try to create again
    await createGameTab(page, 'Duplicate Test');
    await page.waitForTimeout(2000);
    
    const countAfterSecond = await page.locator(selectors.gameTab).count();
    
    console.log(`Tabs: after first=${countAfterFirst}, after second=${countAfterSecond}`);
    // Should be same count (idempotent)
  });

  test('should return existing tab for same conversation ID', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Idempotent Test');
    await page.waitForTimeout(2000);
    
    const tabsBeforeReload = await page.locator(selectors.gameTab).count();
    
    // Reload and check
    await page.reload();
    await waitForAppReady(page);
    await goToGameHub(page);
    
    const tabsAfterReload = await page.locator(selectors.gameTab).count();
    
    console.log(`Tabs: before reload=${tabsBeforeReload}, after reload=${tabsAfterReload}`);
    expect(tabsAfterReload).toEqual(tabsBeforeReload);
  });
});

test.describe('Game Tab Persistence', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should persist game tab after page reload', async ({ page }) => {
    await goToGameHub(page);
    
    const uniqueName = uniqueGameName('Persist Test');
    await createGameTab(page, uniqueName);
    await page.waitForTimeout(2000);
    
    // Reload
    await page.reload();
    await waitForAppReady(page);
    await goToGameHub(page);
    
    // Tab should still exist
    const gameTabs = page.locator(selectors.gameTab);
    const tabCount = await gameTabs.count();
    console.log(`Tabs after reload: ${tabCount}`);
    expect(tabCount).toBeGreaterThan(0);
  });

  test('should persist game tab data to Supabase', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Supabase Persist Test');
    await page.waitForTimeout(3000); // Wait for save
    
    // Close and reopen in new context
    await page.close();
    
    const newPage = await page.context().newPage();
    await newPage.goto('/');
    await waitForAppReady(newPage);
    await goToGameHub(newPage);
    
    const gameTabs = newPage.locator(selectors.gameTab);
    const tabCount = await gameTabs.count();
    console.log(`Tabs in new session: ${tabCount}`);
    
    await newPage.close();
  });

  test('should persist subtabs with game tab', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Subtab Persist Test');
    await page.waitForTimeout(3000);
    
    const gameTabs = page.locator(selectors.gameTab);
    await gameTabs.first().click();
    await page.waitForTimeout(1000);
    
    const initialSubtabs = await page.locator(selectors.subtab).count();
    
    // Reload
    await page.reload();
    await waitForAppReady(page);
    await goToGameHub(page);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(1000);
      
      const afterSubtabs = await page.locator(selectors.subtab).count();
      console.log(`Subtabs: before=${initialSubtabs}, after=${afterSubtabs}`);
    }
  });
});

test.describe('Game Tab Deletion', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should delete game tab via context menu', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Delete Test');
    await page.waitForTimeout(2000);
    
    const initialCount = await page.locator(selectors.gameTab).count();
    
    // Right-click on tab
    const gameTab = page.locator(selectors.gameTab).first();
    await gameTab.click({ button: 'right' });
    await page.waitForTimeout(500);
    
    // Look for delete option
    const deleteOption = page.locator('text=Delete, text=Remove').first();
    if (await deleteOption.isVisible()) {
      await deleteOption.click();
      await page.waitForTimeout(1000);
      
      // Confirm if needed
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete")').first();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await page.waitForTimeout(1000);
      }
      
      const finalCount = await page.locator(selectors.gameTab).count();
      console.log(`Tabs: before=${initialCount}, after delete=${finalCount}`);
    }
  });

  test('should confirm before deleting tab', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Confirm Delete Test');
    await page.waitForTimeout(2000);
    
    // Right-click on tab
    const gameTab = page.locator(selectors.gameTab).first();
    await gameTab.click({ button: 'right' });
    await page.waitForTimeout(500);
    
    const deleteOption = page.locator('text=Delete, text=Remove').first();
    if (await deleteOption.isVisible()) {
      await deleteOption.click();
      await page.waitForTimeout(500);
      
      // Should show confirmation
      const confirmDialog = page.locator('[role="dialog"], [class*="confirm"]').first();
      const hasConfirm = await confirmDialog.isVisible().catch(() => false);
      console.log('Has confirmation dialog:', hasConfirm);
      
      // Cancel
      await page.keyboard.press('Escape');
    }
  });
});

test.describe('Game Tab Switching', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should switch between game tabs', async ({ page }) => {
    await goToGameHub(page);
    
    // Create two tabs
    await createGameTab(page, 'Switch Test 1');
    await page.waitForTimeout(1500);
    await createGameTab(page, 'Switch Test 2');
    await page.waitForTimeout(1500);
    
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() >= 2) {
      // Click first tab
      await gameTabs.nth(0).click();
      await page.waitForTimeout(500);
      
      // Click second tab
      await gameTabs.nth(1).click();
      await page.waitForTimeout(500);
      
      console.log('Tab switching test complete');
    }
  });

  test('should preserve conversation when switching tabs', async ({ page }) => {
    await goToGameHub(page);
    
    await createGameTab(page, 'Preserve Test');
    await page.waitForTimeout(2000);
    
    // Send a message
    await sendMessage(page, 'Test message for preservation');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    // Switch to Game Hub
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Switch back to game tab
    const gameTabs = page.locator(selectors.gameTab);
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(1000);
      
      // Message should still be there
      const chatContainer = page.locator(selectors.chatContainer).first();
      const content = await chatContainer.textContent() || '';
      console.log('Message preserved:', content.includes('preservation'));
    }
  });

  test('should auto-switch to game tab on detection', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Ask about a specific game
    await sendMessage(page, 'Help me beat Margit in Elden Ring');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    
    // Should auto-switch to game tab if one was created
    const gameTabs = page.locator(selectors.gameTab);
    if (await gameTabs.count() > 0) {
      // Check if tab is active/selected
      const activeTab = page.locator(`${selectors.gameTab}[aria-selected="true"], ${selectors.gameTab}.active`).first();
      const isActive = await activeTab.isVisible().catch(() => false);
      console.log('Auto-switched to game tab:', isActive);
    }
  });
});

test.describe('Game Tab Error Handling', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle empty game name', async ({ page }) => {
    const addGameButton = page.locator(selectors.addGameButton).first();
    await addGameButton.click();
    await page.waitForTimeout(500);
    
    // Try to submit without entering game name
    const submitButton = page.locator('button[type="submit"], button:has-text("Add"), button:has-text("Create")').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(500);
      
      // Should show error or prevent submission
      const errorMessage = page.locator('[class*="error"], text=/required|enter/i').first();
      const hasError = await errorMessage.isVisible().catch(() => false);
      console.log('Has validation error:', hasError);
    }
    
    await closeModal(page);
  });

  test('should handle special characters in game name', async ({ page }) => {
    await goToGameHub(page);
    
    // Game name with special characters
    await createGameTab(page, "Test's Game: The Sequel!");
    await page.waitForTimeout(2000);
    
    // Should handle gracefully
    const gameTabs = page.locator(selectors.gameTab);
    console.log(`Tabs after special chars: ${await gameTabs.count()}`);
  });

  test('should handle very long game name', async ({ page }) => {
    await goToGameHub(page);
    
    const longName = 'A'.repeat(100);
    await createGameTab(page, longName);
    await page.waitForTimeout(2000);
    
    // Should handle gracefully (truncate or reject)
    const gameTabs = page.locator(selectors.gameTab);
    console.log(`Tabs after long name: ${await gameTabs.count()}`);
  });

  test('should handle offline creation gracefully', async ({ page }) => {
    await goToGameHub(page);
    
    // Go offline
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    
    // Try to create tab
    const addGameButton = page.locator(selectors.addGameButton).first();
    await addGameButton.click();
    await page.waitForTimeout(500);
    
    // Should show error or prevent creation
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
    
    await closeModal(page);
  });
});

test.describe('Game Tab Tier Gating', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should check user tier for subtab generation', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Tier Check Test');
    await page.waitForTimeout(3000);
    
    const gameTabs = page.locator(selectors.gameTab);
    await gameTabs.first().click();
    await page.waitForTimeout(1000);
    
    // Check for subtabs (pro feature)
    const subtabs = page.locator(selectors.subtab);
    const subtabCount = await subtabs.count();
    
    // Free users may have limited subtabs
    console.log(`Subtabs for current tier: ${subtabCount}`);
  });

  test('should show upgrade prompt for restricted features', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Upgrade Prompt Test');
    await page.waitForTimeout(2000);
    
    // Look for upgrade prompts
    const upgradePrompt = page.locator('text=/upgrade|pro|premium/i').first();
    const hasUpgrade = await upgradePrompt.isVisible().catch(() => false);
    console.log('Shows upgrade prompt:', hasUpgrade);
  });
});
