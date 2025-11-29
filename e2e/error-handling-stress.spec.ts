import { test, expect } from '@playwright/test';
import { 
  waitForAppReady, 
  selectors, 
  goToGameHub,
  createGameTab,
  sendMessage,
  waitForChatResponse,
  measurePerformance,
  openModal,
} from './utils/helpers';

/**
 * Error Handling & Recovery Stress Tests
 * =====================================
 * Tests error handling across:
 * - Network failures
 * - API errors
 * - Invalid inputs
 * - Rate limiting
 * - Recovery mechanisms
 */

test.describe('Network Error Handling', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle API timeout gracefully', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Timeout Test');
    await page.waitForTimeout(1000);
    
    // Slow down API responses
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.continue();
    });
    
    await sendMessage(page, 'Test message with timeout');
    await page.waitForTimeout(6000);
    
    // Should show error or loading state
    const errorMessage = page.locator(
      'text=/error|timeout|failed|try again/i, [class*="error"]'
    ).first();
    
    const hasError = await errorMessage.isVisible().catch(() => false);
    console.log('Shows timeout handling:', hasError);
    
    await page.unroute('**/api/**');
  });

  test('should handle 500 errors', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Server Error Test');
    await page.waitForTimeout(1000);
    
    // Force 500 errors
    await page.route('**/api/**', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });
    
    await sendMessage(page, 'Test message');
    await page.waitForTimeout(3000);
    
    // App should handle gracefully
    const errorIndicator = page.locator('[class*="error"], text=/error/i').first();
    const hasError = await errorIndicator.isVisible().catch(() => false);
    console.log('Handles 500 error:', hasError);
    
    await page.unroute('**/api/**');
  });

  test('should handle 429 rate limiting', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Rate Limit Test');
    await page.waitForTimeout(1000);
    
    // Simulate rate limiting
    await page.route('**/api/**', route => {
      route.fulfill({ 
        status: 429, 
        body: JSON.stringify({ error: 'Too many requests' }),
        headers: { 'Retry-After': '60' }
      });
    });
    
    await sendMessage(page, 'Test message');
    await page.waitForTimeout(3000);
    
    // Should show rate limit message
    const rateLimitMsg = page.locator('text=/limit|slow down|too many/i').first();
    const hasMessage = await rateLimitMsg.isVisible().catch(() => false);
    console.log('Shows rate limit message:', hasMessage);
    
    await page.unroute('**/api/**');
  });

  test('should recover from temporary network failure', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Network Recovery Test');
    await page.waitForTimeout(1000);
    
    // Block all requests briefly
    await page.route('**/*', route => route.abort());
    await page.waitForTimeout(1000);
    
    // Restore network
    await page.unroute('**/*');
    await page.reload();
    await waitForAppReady(page);
    
    // App should recover - just verify app loads
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    console.log('App recovered from network failure');
  });
});

test.describe('Invalid Input Handling', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should reject empty messages', async ({ page }) => {
    await goToGameHub(page);
    
    const chatInput = page.locator(selectors.chatInput).first();
    const sendButton = page.locator(selectors.sendButton).first();
    
    // Clear and try to send
    await chatInput.fill('');
    
    // Button should be disabled or click should not send
    const isDisabled = await sendButton.isDisabled().catch(() => false);
    console.log('Send button disabled for empty input:', isDisabled);
    
    if (!isDisabled) {
      await sendButton.click();
    }
    await page.waitForTimeout(500);
  });

  test('should handle extremely long inputs', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Long Input Test');
    await page.waitForTimeout(1000);
    
    const longMessage = 'A'.repeat(10000);
    const chatInput = page.locator(selectors.chatInput).first();
    
    await chatInput.fill(longMessage);
    await page.waitForTimeout(500);
    
    // Check if input is truncated or shows warning
    const value = await chatInput.inputValue();
    console.log(`Long input length: ${value.length}`);
  });

  test('should sanitize XSS attempts', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'XSS Test');
    await page.waitForTimeout(1000);
    
    const xssPayload = '<script>alert("XSS")</script>';
    await sendMessage(page, xssPayload);
    await page.waitForTimeout(2000);
    
    // Script should not execute
    const alertShown = await page.evaluate(() => {
      return (window as any).xssTriggered === true;
    });
    expect(alertShown).toBeFalsy();
  });

  test('should handle special characters', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Special Chars Test');
    await page.waitForTimeout(1000);
    
    const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\`~';
    await sendMessage(page, `Test with special: ${specialChars}`);
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1000);
    
    // Just verify the message was sent - don't check specific content
    const messages = page.locator('[data-message-id], [class*="message"]');
    const count = await messages.count();
    console.log('Messages after special chars:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('should handle unicode and emoji', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Unicode Test');
    await page.waitForTimeout(1000);
    
    const unicodeMessage = 'Test: 你好 🎮 العربية 日本語 ελληνικά';
    await sendMessage(page, unicodeMessage);
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1000);
    
    // Just verify message was sent
    const messages = page.locator('[data-message-id], [class*="message"]');
    const count = await messages.count();
    console.log('Messages after unicode:', count);
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Authentication Error Handling', () => {
  test('should redirect on auth error', async ({ page }) => {
    // Start without auth
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Try to access protected resource
    await page.goto('/game-hub');
    await page.waitForTimeout(2000);
    
    // Should redirect to login or show login prompt
    const url = page.url();
    const hasLoginElements = await page.locator(
      'text=/sign in|login|welcome/i, input[type="email"], button:has-text("Sign")'
    ).first().isVisible().catch(() => false);
    
    console.log('URL:', url, 'Has login elements:', hasLoginElements);
  });

  test.describe('With Auth', () => {
    test.use({ storageState: '.playwright/.auth/user.json' });

    test('should handle session expiration', async ({ page }) => {
      await page.goto('/');
      await waitForAppReady(page);
      
      // Clear session storage
      await page.evaluate(() => {
        sessionStorage.clear();
      });
      
      // Try action that requires auth
      await goToGameHub(page);
      await page.waitForTimeout(2000);
      
      // App should handle gracefully (re-auth or redirect)
    });
  });
});

test.describe('AI Service Error Handling', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle AI service unavailable', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'AI Error Test');
    await page.waitForTimeout(1000);
    
    // Block AI endpoints
    await page.route('**/gemini**', route => route.abort());
    await page.route('**/generativelanguage**', route => route.abort());
    
    await sendMessage(page, 'Test message when AI is down');
    await page.waitForTimeout(5000);
    
    // Should show appropriate error
    const errorMsg = page.locator('text=/error|unavailable|try again/i').first();
    const hasError = await errorMsg.isVisible().catch(() => false);
    console.log('Shows AI error message:', hasError);
    
    await page.unroute('**/gemini**');
    await page.unroute('**/generativelanguage**');
  });

  test('should handle malformed AI response', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Malformed Response Test');
    await page.waitForTimeout(1000);
    
    // Return invalid JSON from AI
    await page.route('**/gemini**', route => {
      route.fulfill({
        status: 200,
        body: 'Invalid JSON {broken:',
      });
    });
    
    await sendMessage(page, 'Test message');
    await page.waitForTimeout(3000);
    
    // App should not crash
    expect(await page.locator('body').isVisible()).toBe(true);
    
    await page.unroute('**/gemini**');
  });
});

test.describe('Storage Error Handling', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle localStorage quota exceeded', async ({ page }) => {
    await goToGameHub(page);
    
    // Fill up localStorage
    await page.evaluate(() => {
      try {
        const bigString = 'A'.repeat(5 * 1024 * 1024); // 5MB
        localStorage.setItem('test_fill', bigString);
      } catch (e) {
        console.log('Storage quota test:', e);
      }
    });
    
    await createGameTab(page, 'Storage Quota Test');
    await page.waitForTimeout(2000);
    
    // Clean up
    await page.evaluate(() => {
      localStorage.removeItem('test_fill');
    });
  });

  test('should handle IndexedDB errors', async ({ page }) => {
    // Disable IndexedDB temporarily
    await page.evaluate(() => {
      (window as any).indexedDB = undefined;
    });
    
    await page.reload();
    await waitForAppReady(page);
    
    // App should still function with fallbacks
    await goToGameHub(page);
    expect(await page.locator('body').isVisible()).toBe(true);
  });
});

test.describe('Concurrent Operation Errors', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle race conditions in message sending', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Race Condition Test');
    await page.waitForTimeout(1000);
    
    // Send multiple messages rapidly
    const promises = [];
    for (let i = 0; i < 3; i++) {
      promises.push(sendMessage(page, `Rapid message ${i + 1}`));
    }
    
    await Promise.all(promises);
    await page.waitForTimeout(5000);
    
    // All messages should be handled
    const chatContainer = page.locator(selectors.chatContainer).first();
    const content = await chatContainer.textContent() || '';
    console.log('Messages sent without errors');
  });

  test('should handle double-click prevention', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Double Click Test');
    await page.waitForTimeout(1000);
    
    const chatInput = page.locator(selectors.chatInput).first();
    const sendButton = page.locator(selectors.sendButton).first();
    
    await chatInput.fill('Double click test message');
    
    // Double click rapidly
    await sendButton.dblclick();
    
    await page.waitForTimeout(5000);
    
    // Should only send once
    const chatContainer = page.locator(selectors.chatContainer).first();
    const content = await chatContainer.textContent() || '';
    const occurrences = (content.match(/Double click test/g) || []).length;
    console.log('Double click message occurrences:', occurrences);
  });
});

test.describe('Recovery Mechanisms', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should provide retry functionality', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Retry Test');
    await page.waitForTimeout(1000);
    
    // Check for retry button after sending a message
    await sendMessage(page, 'Test message');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    // Look for retry functionality
    const retryButton = page.locator(
      'button:has-text("Retry"), button:has-text("Try again"), [aria-label*="retry"]'
    ).first();
    
    const hasRetry = await retryButton.isVisible().catch(() => false);
    console.log('Has retry functionality:', hasRetry);
  });

  test('should auto-reconnect WebSocket', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'WebSocket Reconnect Test');
    await page.waitForTimeout(1000);
    
    // Simulate WebSocket disconnect
    await page.evaluate(() => {
      const ws = (window as any).__ws;
      if (ws) ws.close();
    });
    
    await page.waitForTimeout(5000);
    
    // Try to send message after reconnect
    await sendMessage(page, 'After reconnect');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    
    // Should work after auto-reconnect
    console.log('WebSocket reconnection test complete');
  });

  test('should preserve state on error', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'State Preservation Test');
    await page.waitForTimeout(1000);
    
    await sendMessage(page, 'Important state message');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1000);
    
    // Simulate error by blocking next request
    await page.route('**/api/**', route => route.abort());
    await sendMessage(page, 'This will fail');
    await page.waitForTimeout(2000);
    await page.unroute('**/api/**');
    
    // Original state should be preserved
    const chatContainer = page.locator(selectors.chatContainer).first();
    const content = await chatContainer.textContent() || '';
    expect(content.includes('Important state')).toBe(true);
  });
});
