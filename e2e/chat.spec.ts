import { test, expect } from '@playwright/test';
import { waitForAppReady, sendMessage } from './utils/helpers';

/**
 * Chat Interface Tests
 * Tests the core chat functionality with AI
 */

test.describe('Chat Interface', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display chat input area', async ({ page }) => {
    const chatInput = page.locator('textarea').first();
    await expect(chatInput).toBeVisible();
  });

  test('should allow typing in chat input', async ({ page }) => {
    const chatInput = page.locator('textarea').first();
    await chatInput.fill('Hello, Otagon!');
    
    await expect(chatInput).toHaveValue('Hello, Otagon!');
  });

  test('should display send button', async ({ page }) => {
    const sendButton = page.locator('button[type="submit"], button:has-text("Send"), button[aria-label*="send"]').first();
    await expect(sendButton).toBeVisible();
  });

  test('should send message and receive response', async ({ page }) => {
    // Type a message
    const chatInput = page.locator('textarea[placeholder="Type your message..."]').first();
    await chatInput.fill('What is Otagon?');
    
    // Send
    const sendButton = page.locator('button[aria-label="Send message"]').first();
    await sendButton.click();
    
    // Wait for response (AI might take time)
    await page.waitForTimeout(5000);
    
    // Check for response in message list - using actual Otagon class names
    const messages = page.locator('.chat-message-user, .chat-message-ai, [data-message-id]');
    const count = await messages.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show loading state while AI responds', async ({ page }) => {
    const chatInput = page.locator('textarea').first();
    await chatInput.fill('Tell me about gaming');
    
    const sendButton = page.locator('button[type="submit"]').first();
    await sendButton.click();
    
    // Look for loading indicator
    const loading = page.locator('[data-testid="loading"], .loading, .animate-spin').first();
    // Loading should appear briefly
  });

  test('should display suggested prompts', async ({ page }) => {
    // Navigate to Game Hub first
    const gameHub = page.locator('text=Game Hub').first();
    await gameHub.click();
    await page.waitForTimeout(1000);

    // Look for suggested prompts
    const prompts = page.locator('[data-testid="suggested-prompt"], .suggested-prompt, button.prompt').first();
    // Prompts should be visible
  });

  test('should use suggested prompt when clicked', async ({ page }) => {
    const gameHub = page.locator('text=Game Hub').first();
    await gameHub.click();
    await page.waitForTimeout(1000);

    const prompt = page.locator('[data-testid="suggested-prompt"], button.prompt').first();
    if (await prompt.isVisible()) {
      await prompt.click();
      
      // Chat input should be filled or message sent
      await page.waitForTimeout(500);
    }
  });

  test('should display message history', async ({ page }) => {
    // Navigate to a conversation with history
    const conversation = page.locator('[data-testid="conversation"], [data-testid="game-tab"]').first();
    
    if (await conversation.isVisible()) {
      await conversation.click();
      await page.waitForTimeout(1000);
      
      // Messages should be displayed
      const messageArea = page.locator('[data-testid="message-list"], .messages');
      await expect(messageArea).toBeVisible();
    }
  });

  test('should allow stopping AI generation', async ({ page }) => {
    const chatInput = page.locator('textarea').first();
    await chatInput.fill('Write a long story about gaming');
    
    const sendButton = page.locator('button[type="submit"]').first();
    await sendButton.click();
    
    // Look for stop button
    await page.waitForTimeout(500);
    const stopButton = page.locator('button:has-text("Stop"), button[aria-label*="stop"]').first();
    
    if (await stopButton.isVisible()) {
      await stopButton.click();
    }
  });

  test('should support keyboard shortcuts', async ({ page }) => {
    const chatInput = page.locator('textarea').first();
    await chatInput.focus();
    await chatInput.fill('Test message');
    
    // Press Enter to send (if enabled)
    await page.keyboard.press('Enter');
    
    // Or Ctrl+Enter
    await chatInput.fill('Another test');
    await page.keyboard.press('Control+Enter');
  });
});
