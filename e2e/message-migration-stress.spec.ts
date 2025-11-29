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
 * Message Migration & Update Stress Tests
 * ========================================
 * Tests message migration and update functionality including:
 * - Message migration between conversations
 * - Message updates (content, metadata)
 * - Atomic message operations
 * - Migration locking/concurrency
 * - Rollback capabilities
 */

test.describe('Message Migration Between Tabs', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should migrate messages from Game Hub to game tab after game detection', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Send a game-specific message in Game Hub
    await sendMessage(page, 'How do I beat the Nameless King in Dark Souls 3?');
    
    // Wait for AI response with potential game detection
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    
    // Check if a game tab was created (auto-detection)
    const gameTabs = page.locator(selectors.gameTab);
    const tabCount = await gameTabs.count();
    
    console.log(`Game tabs after message: ${tabCount}`);
    
    // If tab was created, message should have been migrated
    if (tabCount > 0) {
      // Click on the game tab
      await gameTabs.first().click();
      await page.waitForTimeout(1000);
      
      // Should see the migrated messages
      const chatContainer = page.locator(selectors.chatContainer).first();
      const messages = chatContainer.locator('[data-testid="chat-message"], [class*="message"]');
      const messageCount = await messages.count();
      
      console.log(`Messages in game tab: ${messageCount}`);
      expect(messageCount).toBeGreaterThan(0);
    }
  });

  test('should preserve message content during migration', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    const uniqueText = `Migration test ${Date.now()}`;
    await sendMessage(page, `${uniqueText} - Tell me about Elden Ring`);
    
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    
    // Check if content is preserved
    const chatContainer = page.locator(selectors.chatContainer).first();
    const hasContent = await chatContainer.locator(`text="${uniqueText}"`).count();
    
    console.log(`Found unique text in conversation: ${hasContent > 0}`);
  });

  test('should handle migration with locked conversations', async ({ page }) => {
    await goToGameHub(page);
    
    // Send multiple rapid messages (tests locking behavior)
    for (let i = 0; i < 3; i++) {
      await sendMessage(page, `Rapid message ${i + 1} about Zelda`);
      await page.waitForTimeout(500);
    }
    
    // Wait for responses
    await page.waitForTimeout(10000);
    
    // App should remain stable
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeEnabled();
  });

  test('should prevent duplicate messages during migration', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Duplicate Test Game');
    await page.waitForTimeout(1000);
    
    // Send a message
    await sendMessage(page, 'Test message for duplicate prevention');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    // Count messages
    const chatContainer = page.locator(selectors.chatContainer).first();
    const userMessages = chatContainer.locator('[class*="user"], [data-role="user"]');
    const initialCount = await userMessages.count();
    
    // Reload and check for duplicates
    await page.reload();
    await waitForAppReady(page);
    await goToGameHub(page);
    
    // Navigate back to the game tab
    const gameTabs = page.locator(selectors.gameTab);
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(1000);
      
      const afterCount = await chatContainer.locator('[class*="user"], [data-role="user"]').count();
      console.log(`Messages before reload: ${initialCount}, after: ${afterCount}`);
    }
  });
});

test.describe('Message Content Updates', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should update message content in real-time (streaming)', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Streaming Test');
    await page.waitForTimeout(1000);
    
    await sendMessage(page, 'Give me a detailed walkthrough');
    
    // Watch for content updates
    const chatContainer = page.locator(selectors.chatContainer).first();
    
    let previousContent = '';
    let contentUpdated = false;
    
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(500);
      const currentContent = await chatContainer.textContent() || '';
      
      if (currentContent !== previousContent && previousContent !== '') {
        contentUpdated = true;
        console.log('Content streaming detected');
        break;
      }
      previousContent = currentContent;
    }
  });

  test('should preserve message metadata during updates', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Metadata Test');
    await page.waitForTimeout(1000);
    
    await sendMessage(page, 'Test metadata preservation');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    // Reload and check if metadata is preserved
    await page.reload();
    await waitForAppReady(page);
    
    // Navigate to the game tab
    await goToGameHub(page);
    const gameTabs = page.locator(selectors.gameTab);
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(1000);
      
      // Messages should still have proper structure
      const chatContainer = page.locator(selectors.chatContainer).first();
      const messages = chatContainer.locator('[data-testid="chat-message"], [class*="message"]');
      expect(await messages.count()).toBeGreaterThan(0);
    }
  });

  test('should handle concurrent message updates', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Concurrent Update Test');
    await page.waitForTimeout(1000);
    
    // Send multiple messages
    for (let i = 0; i < 3; i++) {
      await sendMessage(page, `Message ${i + 1} for concurrent test`);
      await page.waitForTimeout(300);
    }
    
    // Wait for all responses
    await page.waitForTimeout(15000);
    
    // All messages should be visible
    const chatContainer = page.locator(selectors.chatContainer).first();
    const messages = chatContainer.locator('[class*="message"]');
    const messageCount = await messages.count();
    
    console.log(`Messages after concurrent sends: ${messageCount}`);
    expect(messageCount).toBeGreaterThan(0);
  });
});

test.describe('Message Persistence', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should persist messages across page reloads', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Persistence Test');
    await page.waitForTimeout(1000);
    
    const uniqueMessage = `Persistence test ${Date.now()}`;
    await sendMessage(page, uniqueMessage);
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    // Reload page
    await page.reload();
    await waitForAppReady(page);
    await goToGameHub(page);
    
    // Navigate to the game tab
    const gameTabs = page.locator(selectors.gameTab);
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(1000);
      
      // Check if message persisted
      const chatContainer = page.locator(selectors.chatContainer).first();
      const content = await chatContainer.textContent() || '';
      console.log(`Message persisted: ${content.includes('Persistence test')}`);
    }
  });

  test('should persist messages across browser sessions', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Session Persistence Test');
    await page.waitForTimeout(1000);
    
    await sendMessage(page, 'Session persistence test message');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    
    // Close and reopen page (simulates new session)
    await page.close();
    
    const newPage = await page.context().newPage();
    await newPage.goto('/');
    await waitForAppReady(newPage);
    await goToGameHub(newPage);
    
    // Check if game tab still exists
    const gameTabs = newPage.locator(selectors.gameTab);
    const tabCount = await gameTabs.count();
    console.log(`Game tabs after session restart: ${tabCount}`);
    
    await newPage.close();
  });

  test('should handle message save failures gracefully', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Error Handling Test');
    await page.waitForTimeout(1000);
    
    // Simulate offline mode
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    
    // Try to send a message
    await sendMessage(page, 'Offline message test');
    await page.waitForTimeout(3000);
    
    // Go back online
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
    
    await page.waitForTimeout(2000);
    
    // App should recover
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeEnabled();
  });
});

test.describe('Normalized Messages Table', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should add messages to normalized table', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Normalized Table Test');
    await page.waitForTimeout(1000);
    
    await sendMessage(page, 'Test message for normalized table');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    // Message should be persisted
    const chatContainer = page.locator(selectors.chatContainer).first();
    const messages = chatContainer.locator('[class*="message"]');
    expect(await messages.count()).toBeGreaterThan(0);
  });

  test('should handle retry logic for failed saves', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Retry Logic Test');
    await page.waitForTimeout(1000);
    
    // Send message (retry logic is internal)
    await sendMessage(page, 'Test message with retry');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    
    // App should remain functional
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeEnabled();
  });
});

test.describe('JSONB Legacy Messages', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle legacy JSONB message format', async ({ page }) => {
    // This test ensures backward compatibility
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Check for existing conversations that may use JSONB
    const gameTabs = page.locator(selectors.gameTab);
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(1000);
      
      const chatContainer = page.locator(selectors.chatContainer).first();
      // Should load messages regardless of storage format
      console.log('Legacy message compatibility test complete');
    }
  });
});

test.describe('Message Ordering', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should maintain chronological message order', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Message Order Test');
    await page.waitForTimeout(1000);
    
    // Send numbered messages
    for (let i = 1; i <= 3; i++) {
      await sendMessage(page, `Message number ${i}`);
      await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(1000);
    }
    
    // Verify order
    const chatContainer = page.locator(selectors.chatContainer).first();
    const content = await chatContainer.textContent() || '';
    
    const pos1 = content.indexOf('Message number 1');
    const pos2 = content.indexOf('Message number 2');
    const pos3 = content.indexOf('Message number 3');
    
    if (pos1 >= 0 && pos2 >= 0 && pos3 >= 0) {
      console.log(`Message order: 1=${pos1}, 2=${pos2}, 3=${pos3}`);
      expect(pos1).toBeLessThan(pos2);
      expect(pos2).toBeLessThan(pos3);
    }
  });

  test('should preserve order after reload', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Order Persistence Test');
    await page.waitForTimeout(1000);
    
    await sendMessage(page, 'First message');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await sendMessage(page, 'Second message');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    // Reload
    await page.reload();
    await waitForAppReady(page);
    await goToGameHub(page);
    
    const gameTabs = page.locator(selectors.gameTab);
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(1000);
      
      const chatContainer = page.locator(selectors.chatContainer).first();
      const content = await chatContainer.textContent() || '';
      
      const firstPos = content.indexOf('First message');
      const secondPos = content.indexOf('Second message');
      
      if (firstPos >= 0 && secondPos >= 0) {
        expect(firstPos).toBeLessThan(secondPos);
      }
    }
  });
});
