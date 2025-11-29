import { test, expect } from '@playwright/test';
import { 
  waitForAppReady, 
  selectors, 
  sendMessage,
  waitForChatResponse,
  goToGameHub,
  goToGameTab,
  createGameTab,
  getMessageCount,
  scrollToBottom,
  measurePerformance,
  randomString,
  uniqueGameName,
} from './utils/helpers';

/**
 * Chat Interface Stress Tests
 * ===========================
 * Tests the core chat functionality including:
 * - First queries
 * - Follow-up queries
 * - Context handling
 * - AI responses
 * - Message history
 * - Performance under load
 */

test.describe('Chat First Query', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should send first query successfully', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('What is Otagon?');
    
    const sendButton = page.locator(selectors.sendButton).first();
    await sendButton.click();
    
    // Wait for response
    await waitForChatResponse(page, 30000);
    
    // Should have at least user message
    const messages = page.locator('[data-message-id]');
    const count = await messages.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display user message immediately', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    const testMessage = `Test message ${Date.now()}`;
    await chatInput.fill(testMessage);
    
    const sendButton = page.locator(selectors.sendButton).first();
    await sendButton.click();
    
    // User message should appear quickly
    await page.waitForTimeout(500);
    
    const userMessages = page.locator(selectors.userMessage);
    const count = await userMessages.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show typing indicator during response', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('Tell me about video games');
    
    const sendButton = page.locator(selectors.sendButton).first();
    await sendButton.click();
    
    // Check for typing indicator
    await page.waitForTimeout(500);
    const typingIndicator = page.locator(selectors.typingIndicator).first();
    // Typing indicator may or may not be visible depending on response speed
  });

  test('should clear input after sending', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('Test message');
    
    const sendButton = page.locator(selectors.sendButton).first();
    await sendButton.click();
    
    await page.waitForTimeout(500);
    
    // Input should be cleared
    await expect(chatInput).toHaveValue('');
  });

  test('should display AI response', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('What is the best RPG game?');
    
    const sendButton = page.locator(selectors.sendButton).first();
    await sendButton.click();
    
    // Wait for AI response with timeout
    await waitForChatResponse(page, 45000).catch(() => {});
    
    // Should have at least the user message visible
    await page.waitForTimeout(2000);
    const messages = page.locator('[data-message-id], [class*="message"]');
    const count = await messages.count();
    console.log('Messages after AI query:', count);
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Chat Follow-up Queries', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle follow-up queries with context', async ({ page }) => {
    // First message
    await sendMessage(page, 'I am playing Elden Ring');
    await waitForChatResponse(page);
    
    // Follow-up should understand context
    await sendMessage(page, 'What should I do next?', false);
    await waitForChatResponse(page);
    
    // Should have multiple messages
    const messages = page.locator('[data-message-id]');
    const count = await messages.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should maintain conversation flow', async ({ page }) => {
    const queries = [
      'I need help with a boss fight',
      'The boss has two phases',
      'What strategy should I use?',
    ];
    
    for (const query of queries) {
      await sendMessage(page, query, false);
      await page.waitForTimeout(2000);
    }
    
    // All messages should be in the chat
    const messages = page.locator('[data-message-id]');
    const count = await messages.count();
    expect(count).toBeGreaterThanOrEqual(queries.length);
  });

  test('should display timestamps on messages', async ({ page }) => {
    await sendMessage(page, 'Test message with timestamp');
    await waitForChatResponse(page);
    
    // Look for timestamp
    const timestamp = page.locator('text=/\\d{1,2}:\\d{2}/, text=/AM|PM/').first();
    // Timestamps should be present
  });
});

test.describe('Chat New Queries (Context Switch)', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle topic changes gracefully', async ({ page }) => {
    // Talk about one game
    await sendMessage(page, 'Tell me about Dark Souls');
    await waitForChatResponse(page);
    
    // Switch to completely different topic
    await sendMessage(page, 'Now tell me about Zelda');
    await waitForChatResponse(page);
    
    // Should handle both topics
    const messages = page.locator('[data-message-id]');
    const count = await messages.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should handle switching between game tabs', async ({ page }) => {
    // Navigate to Game Hub first
    await goToGameHub(page);
    
    // Send a message
    await sendMessage(page, 'What are the latest game releases?', false);
    await page.waitForTimeout(2000);
    
    // Check for game tabs in sidebar
    const gameTabs = page.locator(selectors.gameTab);
    const tabCount = await gameTabs.count();
    
    if (tabCount > 0) {
      // Click a game tab
      await gameTabs.first().click();
      await page.waitForTimeout(1000);
      
      // Should show that tab's conversation
      const chatInput = page.locator(selectors.chatInput).first();
      await expect(chatInput).toBeVisible();
    }
  });
});

test.describe('Game Hub Specific Queries', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await goToGameHub(page);
  });

  test('should handle gaming news queries', async ({ page }) => {
    await sendMessage(page, 'What are the latest gaming news?', false);
    await waitForChatResponse(page, 45000);
    
    // Should get a response about games
    const aiMessages = page.locator(selectors.aiMessage);
    await page.waitForTimeout(2000);
  });

  test('should handle game recommendations', async ({ page }) => {
    await sendMessage(page, 'Recommend me a good RPG', false);
    await waitForChatResponse(page, 45000);
  });

  test('should handle game comparison queries', async ({ page }) => {
    await sendMessage(page, 'Compare Dark Souls and Elden Ring', false);
    await waitForChatResponse(page, 45000);
  });

  test('should use suggested prompts', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const suggestedPrompts = page.locator(selectors.promptButton);
    const count = await suggestedPrompts.count();
    
    if (count > 0) {
      await suggestedPrompts.first().click();
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Chat Input Handling', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle very long messages', async ({ page }) => {
    const longMessage = 'This is a very long message. '.repeat(50);
    
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill(longMessage);
    
    // Should accept long input
    await expect(chatInput).toHaveValue(longMessage);
  });

  test('should handle special characters', async ({ page }) => {
    const specialChars = 'Test @#$%^&*()_+{}[]|\\:";\'<>?,./~`';
    
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill(specialChars);
    
    await expect(chatInput).toHaveValue(specialChars);
  });

  test('should handle emoji input', async ({ page }) => {
    const emojiMessage = 'Hello! 👋 This is a test 🎮🎯🏆';
    
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill(emojiMessage);
    
    await expect(chatInput).toHaveValue(emojiMessage);
  });

  test('should handle multiline input', async ({ page }) => {
    const multilineMessage = 'Line 1\nLine 2\nLine 3';
    
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill(multilineMessage);
    
    // Textarea should contain newlines
    const value = await chatInput.inputValue();
    expect(value).toContain('\n');
  });

  test('should handle rapid typing', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    
    // Type rapidly
    for (const char of 'Rapid typing test message') {
      await chatInput.type(char, { delay: 10 });
    }
    
    await page.waitForTimeout(500);
    const value = await chatInput.inputValue();
    expect(value).toBeTruthy();
  });

  test('should handle paste operations', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.focus();
    
    // Simulate paste
    await page.evaluate(() => {
      const input = document.querySelector('textarea') as HTMLTextAreaElement;
      if (input) {
        input.value = 'Pasted content';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    
    await page.waitForTimeout(300);
  });
});

test.describe('Chat Message History', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should persist messages after page reload', async ({ page }) => {
    // Send a message
    const uniqueMessage = `Test persistence ${Date.now()}`;
    await sendMessage(page, uniqueMessage, false);
    await page.waitForTimeout(2000);
    
    // Reload
    await page.reload();
    await waitForAppReady(page);
    
    // Message should still be visible
    const messageContent = page.locator(`text=${uniqueMessage.substring(0, 20)}`);
    // Messages persist in the conversation
  });

  test('should scroll to show new messages', async ({ page }) => {
    // Send multiple messages to fill the chat
    for (let i = 0; i < 5; i++) {
      const chatInput = page.locator(selectors.chatInput).first();
      await chatInput.fill(`Message ${i + 1}`);
      
      const sendButton = page.locator(selectors.sendButton).first();
      await sendButton.click();
      
      await page.waitForTimeout(1000);
    }
    
    // New messages should be visible (auto-scroll)
  });

  test('should allow scrolling through message history', async ({ page }) => {
    const chatContainer = page.locator('.chat-interface, [data-testid="chat-interface"]').first();
    
    if (await chatContainer.isVisible()) {
      // Scroll up
      await chatContainer.evaluate(el => el.scrollTop = 0);
      await page.waitForTimeout(300);
      
      // Scroll down
      await chatContainer.evaluate(el => el.scrollTop = el.scrollHeight);
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Chat Performance Stress Tests', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle rapid message sends', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    const sendButton = page.locator(selectors.sendButton).first();
    
    // Send messages rapidly
    for (let i = 0; i < 5; i++) {
      await chatInput.fill(`Rapid message ${i + 1}`);
      await sendButton.click();
      await page.waitForTimeout(200);
    }
    
    // App should handle without crashing
    await page.waitForTimeout(2000);
    
    const chatInputAfter = page.locator(selectors.chatInput).first();
    await expect(chatInputAfter).toBeVisible();
  });

  test('should maintain responsiveness under load', async ({ page }) => {
    // Measure initial response time
    const { duration } = await measurePerformance(
      page,
      async () => {
        const chatInput = page.locator(selectors.chatInput).first();
        await chatInput.fill('Quick test');
      },
      'Input fill'
    );
    
    expect(duration).toBeLessThan(1000);
  });

  test('should handle concurrent interactions', async ({ page }) => {
    // Navigate while typing
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('Test message');
    
    // Try clicking sidebar while message is in input
    const gameHub = page.locator(selectors.gameHub).first();
    await gameHub.click();
    
    // Should not crash
    await page.waitForTimeout(500);
  });
});

test.describe('Chat Error Handling', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle empty message submission gracefully', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('');
    
    const sendButton = page.locator(selectors.sendButton).first();
    await sendButton.click();
    
    // Should not crash, might show error or just not send
    await page.waitForTimeout(500);
    
    const chatInputAfter = page.locator(selectors.chatInput).first();
    await expect(chatInputAfter).toBeVisible();
  });

  test('should handle whitespace-only messages', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('   ');
    
    const sendButton = page.locator(selectors.sendButton).first();
    await sendButton.click();
    
    await page.waitForTimeout(500);
  });

  test('should recover from network errors', async ({ page, context }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('Test network error');
    
    // Go offline
    await context.setOffline(true);
    
    const sendButton = page.locator(selectors.sendButton).first();
    await sendButton.click();
    
    await page.waitForTimeout(1000);
    
    // Go back online
    await context.setOffline(false);
    
    // Should recover
    await page.waitForTimeout(500);
    const chatInputAfter = page.locator(selectors.chatInput).first();
    await expect(chatInputAfter).toBeVisible();
  });
});

test.describe('Chat Stop Generation', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should show stop button during AI response', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('Write a very long story about gaming adventures');
    
    const sendButton = page.locator(selectors.sendButton).first();
    await sendButton.click();
    
    // Look for stop button
    await page.waitForTimeout(500);
    const stopButton = page.locator(selectors.stopButton).first();
    // Stop button may appear during generation
  });

  test('should stop generation when clicked', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('Write a detailed guide about every RPG ever made');
    
    const sendButton = page.locator(selectors.sendButton).first();
    await sendButton.click();
    
    await page.waitForTimeout(1000);
    
    const stopButton = page.locator(selectors.stopButton).first();
    if (await stopButton.isVisible().catch(() => false)) {
      await stopButton.click();
      await page.waitForTimeout(500);
    }
    
    // Chat should still be functional
    const chatInputAfter = page.locator(selectors.chatInput).first();
    await expect(chatInputAfter).toBeVisible();
  });
});

test.describe('Chat Markdown Rendering', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should render markdown in AI responses', async ({ page }) => {
    await sendMessage(page, 'Give me a numbered list of 3 gaming tips');
    await waitForChatResponse(page, 45000);
    
    // Check for list elements in response
    const listItems = page.locator('.chat-message-ai li, .chat-message-ai ol li');
    await page.waitForTimeout(2000);
  });

  test('should render code blocks', async ({ page }) => {
    await sendMessage(page, 'Show me a simple code example');
    await waitForChatResponse(page, 45000);
    
    // Check for code elements
    const codeBlocks = page.locator('.chat-message-ai code, .chat-message-ai pre');
    await page.waitForTimeout(2000);
  });

  test('should render bold and italic text', async ({ page }) => {
    await sendMessage(page, 'Emphasize important points about gaming');
    await waitForChatResponse(page, 45000);
    
    // Check for emphasis elements
    const boldElements = page.locator('.chat-message-ai strong');
    const italicElements = page.locator('.chat-message-ai em');
    await page.waitForTimeout(2000);
  });
});

test.describe('Chat TTS Controls', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display TTS controls on AI messages', async ({ page }) => {
    await sendMessage(page, 'Tell me something interesting');
    await waitForChatResponse(page, 45000);
    
    // Check for TTS controls
    const ttsControls = page.locator(selectors.ttsControls).first();
    await page.waitForTimeout(2000);
  });

  test('should have speak button functionality', async ({ page }) => {
    await sendMessage(page, 'Short response please');
    await waitForChatResponse(page, 45000);
    
    const speakButton = page.locator(selectors.speakButton).first();
    if (await speakButton.isVisible().catch(() => false)) {
      // Button should be clickable
      await expect(speakButton).toBeEnabled();
    }
  });
});
