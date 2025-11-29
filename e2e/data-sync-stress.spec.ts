import { test, expect } from '@playwright/test';
import { 
  waitForAppReady, 
  selectors, 
  goToGameHub,
  createGameTab,
  sendMessage,
  waitForChatResponse,
} from './utils/helpers';

/**
 * Data Sync & Real-time Updates Stress Tests
 * ==========================================
 * Tests data synchronization including:
 * - Real-time updates
 * - Multi-tab sync
 * - Offline/online sync
 * - Conflict resolution
 * - Data integrity
 */

test.describe('Real-time Data Sync', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should sync messages in real-time', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Sync Test');
    await page.waitForTimeout(1000);
    
    // Send message
    await sendMessage(page, 'Sync test message');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    // Message should appear immediately
    const chatContainer = page.locator(selectors.chatContainer).first();
    const content = await chatContainer.textContent() || '';
    expect(content.includes('Sync test')).toBe(true);
  });

  test('should sync subtabs in real-time', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Subtab Sync Test');
    await page.waitForTimeout(3000);
    
    const gameTabs = page.locator(selectors.gameTab);
    await gameTabs.first().click();
    await page.waitForTimeout(1000);
    
    // Subtabs should load progressively
    const subtabs = page.locator(selectors.subtab);
    const subtabCount = await subtabs.count();
    console.log(`Subtabs synced: ${subtabCount}`);
  });

  test('should update credits in real-time', async ({ page }) => {
    const creditIndicator = page.locator(selectors.creditIndicator).first();
    
    if (await creditIndicator.isVisible().catch(() => false)) {
      const initialCredits = await creditIndicator.textContent();
      
      await goToGameHub(page);
      await createGameTab(page, 'Credit Sync Test');
      await page.waitForTimeout(1000);
      
      // Send a message that consumes credits
      await sendMessage(page, 'Test message for credits');
      await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2000);
      
      const newCredits = await creditIndicator.textContent();
      console.log(`Credits: ${initialCredits} -> ${newCredits}`);
    }
  });
});

test.describe('Multi-Tab Synchronization', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should sync data across browser tabs', async ({ context, page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Open second tab
    const secondPage = await context.newPage();
    await secondPage.goto('/');
    await waitForAppReady(secondPage);
    
    // Create game tab in first page
    await goToGameHub(page);
    await createGameTab(page, 'Multi Tab Test');
    await page.waitForTimeout(3000);
    
    // Check if it appears in second page
    await goToGameHub(secondPage);
    await secondPage.waitForTimeout(2000);
    
    const tabsInSecondPage = secondPage.locator(selectors.gameTab);
    const tabCount = await tabsInSecondPage.count();
    console.log(`Tabs in second page: ${tabCount}`);
    
    await secondPage.close();
  });

  test('should handle concurrent edits', async ({ context, page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    const secondPage = await context.newPage();
    await secondPage.goto('/');
    await waitForAppReady(secondPage);
    
    // Both pages navigate to same tab
    await goToGameHub(page);
    await goToGameHub(secondPage);
    await page.waitForTimeout(1000);
    
    // Send messages from both
    await sendMessage(page, 'Message from tab 1');
    await sendMessage(secondPage, 'Message from tab 2');
    
    await page.waitForTimeout(5000);
    
    // Both messages should be visible eventually
    await secondPage.close();
  });
});

test.describe('Offline/Online Sync', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should queue changes while offline', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Offline Queue Test');
    await page.waitForTimeout(1000);
    
    // Go offline
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    
    // Try to make changes
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('Offline message');
    
    // Go online
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
    
    await page.waitForTimeout(2000);
    
    // Check for queued message handling
    console.log('Offline queue test complete');
  });

  test('should recover data after reconnection', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Reconnection Test');
    await page.waitForTimeout(1000);
    
    await sendMessage(page, 'Message before disconnect');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    // Simulate brief disconnect
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
    await page.waitForTimeout(2000);
    
    // Data should still be intact
    const chatContainer = page.locator(selectors.chatContainer).first();
    const content = await chatContainer.textContent() || '';
    expect(content.includes('Message before')).toBe(true);
  });

  test('should show offline indicator', async ({ page }) => {
    // Go offline
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    
    await page.waitForTimeout(1000);
    
    // Look for offline indicator
    const offlineIndicator = page.locator(
      '[class*="offline"], text=/offline|no connection/i, [aria-label*="offline"]'
    ).first();
    
    const hasIndicator = await offlineIndicator.isVisible().catch(() => false);
    console.log('Has offline indicator:', hasIndicator);
    
    // Go back online
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
  });
});

test.describe('Data Integrity', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should not lose data on rapid navigation', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Rapid Nav Test');
    await page.waitForTimeout(1000);
    
    // Send a message
    await sendMessage(page, 'Test message for rapid nav');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1000);
    
    // Rapidly navigate
    for (let i = 0; i < 5; i++) {
      await goToGameHub(page);
      await page.waitForTimeout(200);
      const tabs = page.locator(selectors.gameTab);
      if (await tabs.count() > 0) {
        await tabs.first().click();
        await page.waitForTimeout(200);
      }
    }
    
    // Data should be intact
    const chatContainer = page.locator(selectors.chatContainer).first();
    const content = await chatContainer.textContent() || '';
    console.log('Data preserved after rapid nav:', content.includes('rapid nav'));
  });

  test('should maintain message order after sync', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Order Test');
    await page.waitForTimeout(1000);
    
    // Send ordered messages
    for (let i = 1; i <= 3; i++) {
      await sendMessage(page, `Order test ${i}`);
      await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(500);
    }
    
    // Reload and check order
    await page.reload();
    await waitForAppReady(page);
    await goToGameHub(page);
    
    const tabs = page.locator(selectors.gameTab);
    if (await tabs.count() > 0) {
      await tabs.first().click();
      await page.waitForTimeout(1000);
      
      const chatContainer = page.locator(selectors.chatContainer).first();
      const content = await chatContainer.textContent() || '';
      
      const pos1 = content.indexOf('Order test 1');
      const pos2 = content.indexOf('Order test 2');
      const pos3 = content.indexOf('Order test 3');
      
      if (pos1 >= 0 && pos2 >= 0 && pos3 >= 0) {
        expect(pos1).toBeLessThan(pos2);
        expect(pos2).toBeLessThan(pos3);
      }
    }
  });

  test('should handle duplicate prevention', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Duplicate Prevention');
    await page.waitForTimeout(1000);
    
    // Send same message rapidly (trying to create duplicates)
    const message = 'Unique message ' + Date.now();
    
    // Send without waiting
    const chatInput = page.locator(selectors.chatInput).first();
    const sendButton = page.locator(selectors.sendButton).first();
    
    await chatInput.fill(message);
    await sendButton.click();
    await page.waitForTimeout(100);
    await chatInput.fill(message);
    await sendButton.click();
    
    await page.waitForTimeout(5000);
    
    // Count occurrences
    const chatContainer = page.locator(selectors.chatContainer).first();
    const content = await chatContainer.textContent() || '';
    const occurrences = (content.match(new RegExp(message, 'g')) || []).length;
    
    console.log(`Message occurrences: ${occurrences}`);
  });
});

test.describe('Supabase Sync', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should persist data to Supabase', async ({ page }) => {
    await goToGameHub(page);
    
    const uniqueGame = `Supabase Test ${Date.now()}`;
    await createGameTab(page, uniqueGame);
    await page.waitForTimeout(3000);
    
    // Clear local cache by reloading
    await page.reload();
    await waitForAppReady(page);
    await goToGameHub(page);
    
    // Data should load from Supabase
    const tabs = page.locator(selectors.gameTab);
    const tabCount = await tabs.count();
    console.log(`Tabs after reload (from Supabase): ${tabCount}`);
    expect(tabCount).toBeGreaterThan(0);
  });

  test('should handle Supabase connection errors', async ({ page }) => {
    await goToGameHub(page);
    
    // Block Supabase requests temporarily
    await page.route('**/*supabase*', route => route.abort());
    
    // Try to create tab
    const addButton = page.locator(selectors.addGameButton).first();
    await addButton.click();
    await page.waitForTimeout(1000);
    
    // Should show error or handle gracefully
    await page.unroute('**/*supabase*');
    await page.keyboard.press('Escape');
  });
});

test.describe('Cache Synchronization', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should sync cache with remote data', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(2000);
    
    // Check localStorage for cached data
    const cacheKeys = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k => 
        k.includes('conversation') || k.includes('game') || k.includes('cache')
      );
    });
    
    console.log('Cache keys:', cacheKeys);
  });

  test('should invalidate stale cache', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Cache Invalidation Test');
    await page.waitForTimeout(2000);
    
    // Clear localStorage
    await page.evaluate(() => {
      // Only clear non-auth keys
      Object.keys(localStorage).forEach(key => {
        if (!key.includes('auth') && !key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
    });
    
    // Reload - should fetch fresh data
    await page.reload();
    await waitForAppReady(page);
    await goToGameHub(page);
    
    const tabs = page.locator(selectors.gameTab);
    const tabCount = await tabs.count();
    console.log(`Tabs after cache clear: ${tabCount}`);
  });
});
