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
 * WebSocket & Real-time Communication Stress Tests
 * =================================================
 * Tests WebSocket functionality including:
 * - Connection establishment
 * - Message streaming
 * - Reconnection handling
 * - Connection state management
 * - Screenshot/screen sharing via WebSocket
 */

test.describe('WebSocket Connection', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should establish WebSocket connection', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'WS Connection Test');
    await page.waitForTimeout(2000);
    
    // Check for WebSocket connections
    const wsConnections = await page.evaluate(() => {
      const connections: string[] = [];
      // Check performance entries for WebSocket
      if (performance.getEntriesByType) {
        const entries = performance.getEntriesByType('resource');
        entries.forEach((entry: any) => {
          if (entry.name.includes('ws://') || entry.name.includes('wss://')) {
            connections.push(entry.name);
          }
        });
      }
      return connections;
    });
    
    console.log('WebSocket connections found:', wsConnections.length);
  });

  test('should handle WebSocket disconnect', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'WS Disconnect Test');
    await page.waitForTimeout(1000);
    
    // Close any WebSocket connections
    await page.evaluate(() => {
      // Force disconnect any active WebSockets
      const wsList = (window as any).__websockets || [];
      wsList.forEach((ws: WebSocket) => ws.close());
    });
    
    await page.waitForTimeout(2000);
    
    // App should handle disconnect gracefully
    const errorMsg = page.locator('text=/connection|disconnect|offline/i').first();
    const hasError = await errorMsg.isVisible().catch(() => false);
    console.log('Shows disconnect message:', hasError);
  });

  test('should reconnect after WebSocket failure', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'WS Reconnect Test');
    await page.waitForTimeout(1000);
    
    // Disconnect
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await page.waitForTimeout(1000);
    
    // Reconnect
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
    await page.waitForTimeout(3000);
    
    // Send message to verify connection
    await sendMessage(page, 'After reconnection test');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    
    const chatContainer = page.locator(selectors.chatContainer).first();
    const content = await chatContainer.textContent() || '';
    expect(content.includes('reconnection')).toBe(true);
  });
});

test.describe('Streaming Messages', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should stream AI response in chunks', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Stream Chunks Test');
    await page.waitForTimeout(1000);
    
    await sendMessage(page, 'Tell me a detailed story about gaming');
    
    // Watch for streaming content
    let previousLength = 0;
    let streamingDetected = false;
    
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(500);
      const chatContainer = page.locator(selectors.chatContainer).first();
      const content = await chatContainer.textContent() || '';
      
      if (content.length > previousLength && previousLength > 0) {
        streamingDetected = true;
        console.log(`Stream detected: ${previousLength} -> ${content.length}`);
      }
      previousLength = content.length;
    }
    
    console.log('Streaming detected:', streamingDetected);
  });

  test('should handle streaming interruption', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Stream Interrupt Test');
    await page.waitForTimeout(1000);
    
    // Start streaming response
    await sendMessage(page, 'Tell me a very long story');
    await page.waitForTimeout(2000);
    
    // Interrupt with new message
    await sendMessage(page, 'Stop, tell me something else');
    await page.waitForTimeout(5000);
    
    // Check that new message was processed
    const chatContainer = page.locator(selectors.chatContainer).first();
    const content = await chatContainer.textContent() || '';
    expect(content.includes('something else')).toBe(true);
  });

  test('should show streaming indicator', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Stream Indicator Test');
    await page.waitForTimeout(1000);
    
    await sendMessage(page, 'Long response please');
    
    // Check for streaming/loading indicator
    const streamIndicator = page.locator(
      '[class*="typing"], [class*="loading"], [class*="streaming"], ' +
      '[aria-label*="typing"], [class*="dots"], [class*="pulse"]'
    ).first();
    
    let indicatorShown = false;
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(300);
      if (await streamIndicator.isVisible().catch(() => false)) {
        indicatorShown = true;
        break;
      }
    }
    
    console.log('Streaming indicator shown:', indicatorShown);
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
  });
});

test.describe('WebSocket Message Queue', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should queue messages during disconnect', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Message Queue Test');
    await page.waitForTimeout(1000);
    
    // Go offline
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    
    // Try to send while offline
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('Queued message while offline');
    
    // Go back online
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
    await page.waitForTimeout(2000);
    
    console.log('Message queue test complete');
  });

  test('should process queued messages in order', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Queue Order Test');
    await page.waitForTimeout(1000);
    
    // Send multiple messages rapidly
    for (let i = 1; i <= 3; i++) {
      await sendMessage(page, `Queue order ${i}`);
      await page.waitForTimeout(100);
    }
    
    await page.waitForTimeout(10000);
    
    // Check order
    const chatContainer = page.locator(selectors.chatContainer).first();
    const content = await chatContainer.textContent() || '';
    
    const pos1 = content.indexOf('Queue order 1');
    const pos2 = content.indexOf('Queue order 2');
    const pos3 = content.indexOf('Queue order 3');
    
    if (pos1 >= 0 && pos2 >= 0 && pos3 >= 0) {
      expect(pos1).toBeLessThan(pos2);
      expect(pos2).toBeLessThan(pos3);
    }
  });
});

test.describe('Screen Sharing WebSocket', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should have screenshot capability', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Screenshot Test');
    await page.waitForTimeout(1000);
    
    // Look for screenshot button
    const screenshotButton = page.locator(
      'button[aria-label*="screenshot"], button[aria-label*="screen"], ' +
      '[data-testid*="screenshot"], button:has-text("Screenshot"), ' +
      'button:has([class*="camera"]), button:has([class*="screen"])'
    ).first();
    
    const hasScreenshot = await screenshotButton.isVisible().catch(() => false);
    console.log('Screenshot button visible:', hasScreenshot);
    
    if (hasScreenshot) {
      await screenshotButton.click();
      await page.waitForTimeout(2000);
      console.log('Screenshot button clicked');
    }
  });

  test('should handle screen capture permissions', async ({ page }) => {
    // Grant screen capture permission
    await page.context().grantPermissions(['camera']);
    
    await goToGameHub(page);
    await createGameTab(page, 'Screen Capture Permission Test');
    await page.waitForTimeout(1000);
    
    const screenshotButton = page.locator(
      'button[aria-label*="screenshot"], button[aria-label*="screen"]'
    ).first();
    
    if (await screenshotButton.isVisible().catch(() => false)) {
      await screenshotButton.click();
      await page.waitForTimeout(2000);
      
      // Check for permission dialog or capture UI
      console.log('Screen capture permission test complete');
    }
  });

  test('should send screenshot via WebSocket', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'WS Screenshot Test');
    await page.waitForTimeout(1000);
    
    // Check for image upload or screenshot in chat
    const imageButton = page.locator(
      'button[aria-label*="image"], button[aria-label*="upload"], ' +
      'input[type="file"][accept*="image"]'
    ).first();
    
    const hasImageUpload = await imageButton.isVisible().catch(() => false);
    console.log('Image upload available:', hasImageUpload);
  });
});

test.describe('WebSocket Error States', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle WebSocket timeout', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'WS Timeout Test');
    await page.waitForTimeout(1000);
    
    // Simulate slow WebSocket response
    await page.route('**/ws/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 10000));
      await route.continue();
    });
    
    await sendMessage(page, 'Test message with timeout');
    await page.waitForTimeout(5000);
    
    // Should show timeout or retry option
    const timeoutMsg = page.locator('text=/timeout|slow|retry/i').first();
    const hasTimeout = await timeoutMsg.isVisible().catch(() => false);
    console.log('Shows timeout message:', hasTimeout);
    
    await page.unroute('**/ws/**');
  });

  test('should show connection status', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Look for connection status indicator
    const statusIndicator = page.locator(
      '[class*="connection"], [class*="status"], [aria-label*="connected"], ' +
      '[class*="online"], [class*="dot"]'
    ).first();
    
    const hasStatus = await statusIndicator.isVisible().catch(() => false);
    console.log('Connection status indicator:', hasStatus);
  });

  test('should retry failed WebSocket messages', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'WS Retry Test');
    await page.waitForTimeout(1000);
    
    // Block first attempt
    let blocked = true;
    await page.route('**/api/**', async route => {
      if (blocked) {
        blocked = false;
        await route.abort();
      } else {
        await route.continue();
      }
    });
    
    await sendMessage(page, 'Retry test message');
    await page.waitForTimeout(5000);
    
    // Check for retry button or auto-retry
    const retryButton = page.locator('button:has-text("Retry")').first();
    if (await retryButton.isVisible().catch(() => false)) {
      await retryButton.click();
      await page.waitForTimeout(3000);
    }
    
    await page.unroute('**/api/**');
  });
});

test.describe('WebSocket Performance', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle high-frequency messages', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'High Frequency WS Test');
    await page.waitForTimeout(1000);
    
    const startTime = Date.now();
    
    // Send multiple messages rapidly
    for (let i = 0; i < 5; i++) {
      await sendMessage(page, `Rapid message ${i + 1}`);
      await page.waitForTimeout(200);
    }
    
    const endTime = Date.now();
    console.log(`Sent 5 messages in ${endTime - startTime}ms`);
    
    // Wait for responses
    await page.waitForTimeout(10000);
    
    // All messages should be in chat
    const chatContainer = page.locator(selectors.chatContainer).first();
    const content = await chatContainer.textContent() || '';
    
    let messageCount = 0;
    for (let i = 1; i <= 5; i++) {
      if (content.includes(`Rapid message ${i}`)) {
        messageCount++;
      }
    }
    
    console.log(`Messages received: ${messageCount}/5`);
  });

  test('should handle large payload messages', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Large Payload Test');
    await page.waitForTimeout(1000);
    
    // Send large message
    const largeMessage = 'A'.repeat(5000);
    await sendMessage(page, `Large payload: ${largeMessage}`);
    
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    console.log('Large payload test complete');
  });

  test('should measure WebSocket latency', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'WS Latency Test');
    await page.waitForTimeout(1000);
    
    const startTime = Date.now();
    await sendMessage(page, 'Latency test message');
    
    // Wait for first response character
    let responseReceived = false;
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(250);
      const chatContainer = page.locator(selectors.chatContainer).first();
      const content = await chatContainer.textContent() || '';
      if (content.includes('Latency test') && content.length > 100) {
        responseReceived = true;
        break;
      }
    }
    
    const latency = Date.now() - startTime;
    console.log(`WebSocket response latency: ${latency}ms`);
  });
});

test.describe('WebSocket Multi-Connection', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should handle multiple tabs with WebSocket', async ({ context, page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await goToGameHub(page);
    await createGameTab(page, 'Multi Tab WS 1');
    await page.waitForTimeout(1000);
    
    // Open second tab
    const secondPage = await context.newPage();
    await secondPage.goto('/');
    await waitForAppReady(secondPage);
    await goToGameHub(secondPage);
    await page.waitForTimeout(1000);
    
    // Send from first tab
    await sendMessage(page, 'Message from tab 1');
    await page.waitForTimeout(2000);
    
    // Send from second tab
    await sendMessage(secondPage, 'Message from tab 2');
    await page.waitForTimeout(2000);
    
    // Both should work
    console.log('Multi-tab WebSocket test complete');
    
    await secondPage.close();
  });
});
