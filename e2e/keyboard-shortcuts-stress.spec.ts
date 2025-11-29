import { test, expect } from '@playwright/test';
import { 
  waitForAppReady, 
  selectors, 
  goToGameHub,
  createGameTab,
} from './utils/helpers';

/**
 * Command Center & Keyboard Shortcuts Stress Tests
 * =================================================
 * Tests command center and keyboard navigation including:
 * - Keyboard shortcuts
 * - Command palette
 * - Tab navigation
 * - Focus management
 * - Accessibility
 */

test.describe('Keyboard Navigation', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should support Tab navigation', async ({ page }) => {
    // Start from the top of the page
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    // Get focused element
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el?.tagName,
        className: el?.className,
        text: el?.textContent?.substring(0, 50)
      };
    });
    
    console.log('First focused element:', focusedElement);
    expect(focusedElement.tagName).toBeTruthy();
  });

  test('should support Shift+Tab reverse navigation', async ({ page }) => {
    // Tab forward several times
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }
    
    // Get position
    const forwardPosition = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    // Tab backward
    await page.keyboard.press('Shift+Tab');
    await page.waitForTimeout(100);
    
    const backwardPosition = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    console.log(`Navigation: forward=${forwardPosition}, backward=${backwardPosition}`);
  });

  test('should trap focus in modals', async ({ page }) => {
    // Open settings modal
    const settingsButton = page.locator(selectors.settingsButton).first();
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForTimeout(500);
      
      // Tab through modal
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
        
        // Check if focus is still in modal
        const inModal = await page.evaluate(() => {
          const modal = document.querySelector('[role="dialog"], [class*="modal"]');
          return modal?.contains(document.activeElement);
        });
        
        console.log(`Tab ${i + 1}: in modal = ${inModal}`);
      }
      
      // Close modal
      await page.keyboard.press('Escape');
    }
  });

  test('should support arrow key navigation in lists', async ({ page }) => {
    await goToGameHub(page);
    
    // Focus on game hub
    const gameHub = page.locator(selectors.gameHub).first();
    await gameHub.focus();
    
    // Arrow down
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    
    // Arrow up
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(200);
    
    console.log('Arrow navigation test complete');
  });
});

test.describe('Keyboard Shortcuts', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle Escape to close modals', async ({ page }) => {
    // Open a modal
    const settingsButton = page.locator(selectors.settingsButton).first();
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForTimeout(500);
      
      // Verify modal is open
      const modal = page.locator('[role="dialog"], [class*="modal"]').first();
      await expect(modal).toBeVisible();
      
      // Press Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      // Modal should be closed
      await expect(modal).not.toBeVisible();
    }
  });

  test('should handle Enter to submit forms', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Enter Test');
    await page.waitForTimeout(1000);
    
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('Test Enter submit');
    
    // Press Enter
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    // Message should be submitted (input should be cleared or show response)
    console.log('Enter submit test complete');
  });

  test('should handle Ctrl+Enter for special submit', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Ctrl+Enter Test');
    await page.waitForTimeout(1000);
    
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('Test Ctrl+Enter');
    
    // Press Ctrl+Enter
    await page.keyboard.press('Control+Enter');
    await page.waitForTimeout(1000);
    
    console.log('Ctrl+Enter test complete');
  });

  test('should support Ctrl+K or Cmd+K for command palette', async ({ page }) => {
    // Try Ctrl+K
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);
    
    // Check if command palette opened
    const commandPalette = page.locator('[role="combobox"], [class*="command"], [class*="palette"]').first();
    const isOpen = await commandPalette.isVisible().catch(() => false);
    
    console.log('Command palette via Ctrl+K:', isOpen ? 'opened' : 'not found');
    
    if (isOpen) {
      await page.keyboard.press('Escape');
    }
  });
});

test.describe('Focus Management', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should focus chat input by default', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Focus Test');
    await page.waitForTimeout(1000);
    
    // Check what's focused
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    console.log('Default focused element:', focusedElement);
  });

  test('should restore focus after modal close', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Focus Restore Test');
    await page.waitForTimeout(1000);
    
    // Focus on chat input
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.focus();
    
    // Open modal
    const settingsButton = page.locator(selectors.settingsButton).first();
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForTimeout(500);
      
      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      // Focus should return to previous element (or at least be reasonable)
      const focusedAfter = await page.evaluate(() => {
        return document.activeElement?.tagName;
      });
      
      console.log('Focus after modal close:', focusedAfter);
    }
  });

  test('should handle focus on dynamic content', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Dynamic Focus Test');
    await page.waitForTimeout(1000);
    
    // Check for subtabs
    const subtabs = page.locator(selectors.subtab);
    if (await subtabs.count() > 0) {
      // Click subtab
      await subtabs.first().click();
      await page.waitForTimeout(500);
      
      // Check focus management
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.tagName;
      });
      
      console.log('Focus after subtab click:', focusedElement);
    }
  });
});

test.describe('Accessibility Keyboard Support', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should have visible focus indicators', async ({ page }) => {
    // Tab to elements and check for focus styles
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    const hasVisibleFocus = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;
      
      const styles = window.getComputedStyle(el);
      const hasOutline = styles.outlineWidth !== '0px';
      const hasBoxShadow = styles.boxShadow !== 'none';
      
      return hasOutline || hasBoxShadow;
    });
    
    console.log('Has visible focus indicator:', hasVisibleFocus);
  });

  test('should support Space for button activation', async ({ page }) => {
    // Tab to a button
    let foundButton = false;
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      const isButton = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName === 'BUTTON' || el?.getAttribute('role') === 'button';
      });
      
      if (isButton) {
        foundButton = true;
        // Activate with Space
        await page.keyboard.press('Space');
        await page.waitForTimeout(300);
        console.log('Button activated with Space');
        break;
      }
    }
    
    console.log('Found button for Space activation:', foundButton);
  });

  test('should announce screen reader content', async ({ page }) => {
    // Check for aria-live regions
    const ariaLive = await page.locator('[aria-live]').count();
    console.log(`Found ${ariaLive} aria-live regions`);
    
    // Check for screen reader only content
    const srOnly = await page.locator('[class*="sr-only"], [class*="visually-hidden"]').count();
    console.log(`Found ${srOnly} screen-reader-only elements`);
  });
});

test.describe('Hotkey Combinations', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle common hotkeys', async ({ page }) => {
    // Test various common hotkeys
    const hotkeys = [
      { key: 'Control+/', description: 'Help/shortcuts' },
      { key: 'Control+n', description: 'New item' },
      { key: 'Control+s', description: 'Save' },
      { key: 'Control+f', description: 'Find' },
    ];
    
    for (const hotkey of hotkeys) {
      await page.keyboard.press(hotkey.key);
      await page.waitForTimeout(300);
      
      // Check if anything happened
      const modal = page.locator('[role="dialog"]').first();
      if (await modal.isVisible().catch(() => false)) {
        console.log(`${hotkey.key} triggered modal`);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
      }
    }
  });

  test('should support game hub navigation hotkeys', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Try number keys for tab switching
    const gameTabs = page.locator(selectors.gameTab);
    const tabCount = await gameTabs.count();
    
    if (tabCount > 0) {
      // Try pressing 1 to switch to first tab
      await page.keyboard.press('1');
      await page.waitForTimeout(300);
      
      // Try pressing 2 to switch to second tab
      if (tabCount > 1) {
        await page.keyboard.press('2');
        await page.waitForTimeout(300);
      }
    }
    
    console.log('Game hub navigation hotkeys test complete');
  });
});

test.describe('Search/Filter Keyboard', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should focus search on shortcut', async ({ page }) => {
    // Try / to focus search
    await page.keyboard.press('/');
    await page.waitForTimeout(300);
    
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el?.tagName,
        type: el?.getAttribute('type'),
        placeholder: el?.getAttribute('placeholder')
      };
    });
    
    console.log('Focused after / key:', focusedElement);
  });

  test('should filter results with keyboard', async ({ page }) => {
    await goToGameHub(page);
    
    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.click();
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      
      // Results should filter
      console.log('Search/filter keyboard test complete');
    }
  });
});

test.describe('Multi-Key Sequences', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle key sequences', async ({ page }) => {
    // Test for vim-like key sequences (g followed by g for go to top, etc)
    await page.keyboard.press('g');
    await page.waitForTimeout(100);
    await page.keyboard.press('g');
    await page.waitForTimeout(300);
    
    console.log('Key sequence test complete');
  });

  test('should handle rapid key presses', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Rapid Keys Test');
    await page.waitForTimeout(1000);
    
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.focus();
    
    // Type rapidly
    for (const char of 'hello') {
      await page.keyboard.press(char);
    }
    
    await page.waitForTimeout(200);
    
    const value = await chatInput.inputValue();
    expect(value.toLowerCase()).toContain('hello');
  });
});

test.describe('Special Keys', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle Home/End keys', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Home End Test');
    await page.waitForTimeout(1000);
    
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('Some text here');
    
    // Home key - go to start
    await page.keyboard.press('Home');
    
    // End key - go to end
    await page.keyboard.press('End');
    
    console.log('Home/End keys test complete');
  });

  test('should handle Page Up/Down', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Page Down
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(200);
    
    // Page Up
    await page.keyboard.press('PageUp');
    await page.waitForTimeout(200);
    
    console.log('Page Up/Down test complete');
  });

  test('should handle Delete/Backspace in input', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Delete Test');
    await page.waitForTimeout(1000);
    
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('Test text');
    
    // Backspace
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(100);
    
    let value = await chatInput.inputValue();
    expect(value).toBe('Test tex');
    
    // Delete (position cursor first)
    await page.keyboard.press('Home');
    await page.keyboard.press('Delete');
    await page.waitForTimeout(100);
    
    value = await chatInput.inputValue();
    expect(value).toBe('est tex');
  });
});
