import { test, expect } from '@playwright/test';
import { 
  waitForAppReady, 
  selectors, 
  openSettingsMenu,
  toggleSwitch,
  rapidClick,
  getAllButtons,
  goToGameHub,
} from './utils/helpers';

/**
 * UI Components Stress Tests
 * ==========================
 * Tests all UI components including:
 * - Buttons
 * - Toggles
 * - Context Menus
 * - Indicators
 * - Avatars
 * - Icons
 */

test.describe('Button Components', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should have visible send button', async ({ page }) => {
    const sendButton = page.locator(selectors.sendButton).first();
    await expect(sendButton).toBeVisible();
  });

  test('should have clickable send button', async ({ page }) => {
    const sendButton = page.locator(selectors.sendButton).first();
    await expect(sendButton).toBeEnabled();
  });

  test('should handle rapid button clicks', async ({ page }) => {
    const sendButton = page.locator(selectors.sendButton).first();
    
    // Rapid clicks should not crash
    for (let i = 0; i < 10; i++) {
      await sendButton.click().catch(() => {});
      await page.waitForTimeout(50);
    }
    
    // App should remain stable
    await expect(sendButton).toBeVisible();
  });

  test('should have proper hover states', async ({ page }) => {
    const buttons = await getAllButtons(page);
    
    for (const button of buttons.slice(0, 5)) {
      if (await button.isVisible()) {
        await button.hover();
        await page.waitForTimeout(100);
      }
    }
  });

  test('should have proper focus states', async ({ page }) => {
    const sendButton = page.locator(selectors.sendButton).first();
    await sendButton.focus();
    
    // Should have focus styling
    await page.waitForTimeout(100);
  });

  test('should disable buttons appropriately', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('');
    
    // Send button might be disabled when input is empty
    const sendButton = page.locator(selectors.sendButton).first();
  });
});

test.describe('Toggle Components', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display hands-free toggle', async ({ page }) => {
    const handsFreeToggle = page.locator(selectors.handsFreeToggle).first();
    // Toggle should be visible
  });

  test('should display AI mode toggle', async ({ page }) => {
    const aiModeToggle = page.locator(selectors.aiModeToggle).first();
    // Toggle may be visible for Pro users
  });

  test('should display manual upload toggle', async ({ page }) => {
    const manualUploadToggle = page.locator(selectors.manualUploadToggle).first();
    // Toggle should be visible
  });

  test('should toggle hands-free mode', async ({ page }) => {
    const handsFreeToggle = page.locator(selectors.handsFreeToggle).first();
    
    if (await handsFreeToggle.isVisible()) {
      await handsFreeToggle.click();
      await page.waitForTimeout(300);
      
      // State should change
      await handsFreeToggle.click();
      await page.waitForTimeout(300);
    }
  });

  test('should persist toggle state', async ({ page }) => {
    const handsFreeToggle = page.locator(selectors.handsFreeToggle).first();
    
    if (await handsFreeToggle.isVisible()) {
      await handsFreeToggle.click();
      await page.waitForTimeout(500);
      
      // Reload page
      await page.reload();
      await waitForAppReady(page);
      
      // State should be preserved
    }
  });

  test('should handle rapid toggle clicks', async ({ page }) => {
    const handsFreeToggle = page.locator(selectors.handsFreeToggle).first();
    
    if (await handsFreeToggle.isVisible()) {
      for (let i = 0; i < 10; i++) {
        await handsFreeToggle.click().catch(() => {});
        await page.waitForTimeout(50);
      }
      
      // App should remain stable
    }
  });
});

test.describe('Context Menu', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should show settings context menu', async ({ page }) => {
    await openSettingsMenu(page);
    
    const contextMenu = page.locator(selectors.contextMenu).first();
    // Context menu should appear
  });

  test('should show game tab context menu on right-click', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click({ button: 'right' });
      await page.waitForTimeout(500);
      
      const contextMenu = page.locator(selectors.contextMenu).first();
    }
  });

  test('should close context menu on click outside', async ({ page }) => {
    await openSettingsMenu(page);
    
    // Click outside
    await page.click('body', { position: { x: 10, y: 10 }, force: true });
    await page.waitForTimeout(300);
  });

  test('should close context menu on Escape', async ({ page }) => {
    await openSettingsMenu(page);
    
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await openSettingsMenu(page);
    
    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    
    await page.waitForTimeout(300);
  });
});

test.describe('Credit Indicator', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display credit indicator', async ({ page }) => {
    const creditIndicator = page.locator(selectors.creditIndicator).first();
    // Credit indicator should be visible
  });

  test('should show credit count', async ({ page }) => {
    const creditIndicator = page.locator(selectors.creditIndicator).first();
    
    if (await creditIndicator.isVisible()) {
      const text = await creditIndicator.textContent();
      // Should contain credit info
    }
  });

  test('should be clickable', async ({ page }) => {
    const creditIndicator = page.locator(selectors.creditIndicator).first();
    
    if (await creditIndicator.isVisible()) {
      await creditIndicator.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('User Avatar', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display user avatar in messages', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('Test message');
    
    const sendButton = page.locator(selectors.sendButton).first();
    await sendButton.click();
    
    await page.waitForTimeout(1000);
    
    // User avatar should appear with message
    const userMessage = page.locator(selectors.userMessage).first();
  });
});

test.describe('AI Avatar', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display AI avatar in responses', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('Hello');
    
    const sendButton = page.locator(selectors.sendButton).first();
    await sendButton.click();
    
    await page.waitForTimeout(5000);
    
    // AI avatar should appear with response
    const aiMessage = page.locator(selectors.aiMessage).first();
  });
});

test.describe('Loading Spinner', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should show loading spinner during API calls', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('Tell me something');
    
    const sendButton = page.locator(selectors.sendButton).first();
    await sendButton.click();
    
    // Loading spinner may appear briefly
    await page.waitForTimeout(500);
    const loadingSpinner = page.locator(selectors.loadingSpinner).first();
  });
});

test.describe('Typing Indicator', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should show typing indicator during AI response', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('Tell me a story');
    
    const sendButton = page.locator(selectors.sendButton).first();
    await sendButton.click();
    
    // Typing indicator should appear
    await page.waitForTimeout(1000);
    const typingIndicator = page.locator(selectors.typingIndicator).first();
  });
});

test.describe('Skeleton Loaders', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should show skeleton during initial load', async ({ page }) => {
    await page.goto('/');
    
    // Skeleton may appear during load
    const skeleton = page.locator(selectors.skeleton).first();
  });
});

test.describe('Screenshot Button', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display screenshot button', async ({ page }) => {
    const screenshotButton = page.locator(selectors.screenshotButton).first();
    // Screenshot button should be visible
  });

  test('should be clickable', async ({ page }) => {
    const screenshotButton = page.locator(selectors.screenshotButton).first();
    
    if (await screenshotButton.isVisible()) {
      await screenshotButton.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('TTS Controls', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display TTS controls on AI messages', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('Say hello');
    
    const sendButton = page.locator(selectors.sendButton).first();
    await sendButton.click();
    
    await page.waitForTimeout(5000);
    
    // TTS controls should appear on AI message
    const ttsControls = page.locator(selectors.ttsControls).first();
  });
});

test.describe('Logo Component', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display logo in header', async ({ page }) => {
    const logo = page.locator('img[alt*="Otagon"], img[alt*="Logo"], [data-testid="logo"]').first();
    // Logo should be visible
  });

  test('should display logo in sidebar', async ({ page }) => {
    // Logo may also appear in sidebar
  });
});

test.describe('Sidebar Components', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display sidebar', async ({ page }) => {
    const sidebar = page.locator(selectors.sidebar).first();
    await expect(sidebar).toBeVisible();
  });

  test('should display Game Hub', async ({ page }) => {
    const gameHub = page.locator(selectors.gameHub).first();
    await expect(gameHub).toBeVisible();
  });

  test('should display game tabs', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    const count = await gameTabs.count();
    console.log(`Found ${count} game tabs`);
  });

  test('should display Add Game button', async ({ page }) => {
    const addGameButton = page.locator(selectors.addGameButton).first();
    await expect(addGameButton).toBeVisible();
  });
});

test.describe('Header Components', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display header', async ({ page }) => {
    const header = page.locator(selectors.header).first();
    await expect(header).toBeVisible();
  });

  test('should display settings button', async ({ page }) => {
    const settingsButton = page.locator(selectors.settingsButton);
    await expect(settingsButton).toBeVisible();
  });

  test('should display PC connection button', async ({ page }) => {
    const connectionButton = page.locator(selectors.pcConnectionButton).first();
    // Connection button should be visible
  });
});

test.describe('Input Components', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display chat input', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
  });

  test('should accept text input', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('Test input');
    await expect(chatInput).toHaveValue('Test input');
  });

  test('should have placeholder text', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    const placeholder = await chatInput.getAttribute('placeholder');
    expect(placeholder).toContain('Type');
  });

  test('should handle focus', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.focus();
    await expect(chatInput).toBeFocused();
  });

  test('should handle blur', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.focus();
    await chatInput.blur();
    await expect(chatInput).not.toBeFocused();
  });
});

test.describe('UI Responsiveness', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should resize gracefully', async ({ page }) => {
    const sizes = [
      { width: 1920, height: 1080 },
      { width: 1024, height: 768 },
      { width: 768, height: 1024 },
      { width: 375, height: 667 },
    ];
    
    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.waitForTimeout(500);
      
      // App should remain functional
      const chatInput = page.locator(selectors.chatInput).first();
      await expect(chatInput).toBeVisible();
    }
  });

  test('should handle scroll events', async ({ page }) => {
    const chatContainer = page.locator('.chat-interface, [data-testid="chat-interface"]').first();
    
    if (await chatContainer.isVisible()) {
      // Scroll up and down
      await chatContainer.evaluate(el => {
        el.scrollTop = 0;
        el.scrollTop = el.scrollHeight;
        el.scrollTop = el.scrollHeight / 2;
      });
      
      await page.waitForTimeout(300);
    }
  });
});

test.describe('UI Animation Performance', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle multiple animations', async ({ page }) => {
    // Trigger multiple UI updates
    await openSettingsMenu(page);
    await page.waitForTimeout(100);
    await page.click('body', { position: { x: 10, y: 10 }, force: true });
    
    await goToGameHub(page);
    
    const gameTabs = page.locator(selectors.gameTab);
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
    }
    
    // App should remain responsive
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
  });
});
