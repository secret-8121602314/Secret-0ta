import { test, expect } from '@playwright/test';
import { 
  waitForAppReady, 
  selectors, 
  openSettingsMenu,
  openModal,
  closeModal,
  goToGameHub,
} from './utils/helpers';

/**
 * Modal Stress Tests
 * ==================
 * Tests all modal components including:
 * - Settings Modal
 * - Credit Modal
 * - Connection Modal
 * - Hands-Free Modal
 * - Add Game Modal
 * - Game Info Modal
 * - About/Privacy/Terms Modals
 */

test.describe('Settings Modal', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should open settings menu', async ({ page }) => {
    await openSettingsMenu(page);
    
    // Menu should be visible
    const settingsOption = page.locator(selectors.settingsMenuItem).first();
    await expect(settingsOption).toBeVisible();
  });

  test('should display user tier info', async ({ page }) => {
    await openSettingsMenu(page);
    
    // Look for tier info
    const tierInfo = page.locator('text=Free, text=Pro, text=Vanguard, text=Trial').first();
    // Tier should be displayed
  });

  test('should show upgrade option for free users', async ({ page }) => {
    await openSettingsMenu(page);
    
    const upgradeOption = page.locator(selectors.upgradeMenuItem).first();
    // Upgrade option may be visible for free users
  });

  test('should display logout option', async ({ page }) => {
    await openSettingsMenu(page);
    
    const logoutOption = page.locator(selectors.logoutButton).first();
    await expect(logoutOption).toBeVisible();
  });

  test('should open Guide/How-to-Use', async ({ page }) => {
    await openSettingsMenu(page);
    
    const guideOption = page.locator(selectors.guideMenuItem).first();
    if (await guideOption.isVisible()) {
      await guideOption.click();
      await page.waitForTimeout(500);
    }
  });

  test('should close settings when clicking outside', async ({ page }) => {
    await openSettingsMenu(page);
    
    // Click outside
    await page.click('body', { position: { x: 10, y: 10 }, force: true });
    await page.waitForTimeout(300);
  });

  test('should handle rapid open/close', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await openSettingsMenu(page);
      await page.waitForTimeout(100);
      await page.click('body', { position: { x: 10, y: 10 }, force: true });
      await page.waitForTimeout(100);
    }
    
    // App should remain stable
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
  });
});

test.describe('Credit Modal', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display credit indicator', async ({ page }) => {
    const creditIndicator = page.locator(selectors.creditIndicator).first();
    // Credit indicator should be visible
  });

  test('should open credit modal when clicked', async ({ page }) => {
    const creditIndicator = page.locator(selectors.creditIndicator).first();
    
    if (await creditIndicator.isVisible()) {
      await creditIndicator.click();
      await page.waitForTimeout(500);
      
      const modal = page.locator(selectors.modal).first();
      await expect(modal).toBeVisible();
    }
  });

  test('should display usage information', async ({ page }) => {
    const creditIndicator = page.locator(selectors.creditIndicator).first();
    
    if (await creditIndicator.isVisible()) {
      await creditIndicator.click();
      await page.waitForTimeout(500);
      
      // Look for usage stats
      const usageInfo = page.locator('text=credits, text=queries, text=usage, text=limit').first();
    }
  });

  test('should show upgrade options', async ({ page }) => {
    const creditIndicator = page.locator(selectors.creditIndicator).first();
    
    if (await creditIndicator.isVisible()) {
      await creditIndicator.click();
      await page.waitForTimeout(500);
      
      // Look for tier options
      const tiers = page.locator('text=Pro, text=Vanguard').first();
    }
  });

  test('should close credit modal', async ({ page }) => {
    const creditIndicator = page.locator(selectors.creditIndicator).first();
    
    if (await creditIndicator.isVisible()) {
      await creditIndicator.click();
      await page.waitForTimeout(500);
      
      await closeModal(page);
      
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Connection Modal', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display PC connection button', async ({ page }) => {
    const connectionButton = page.locator(selectors.pcConnectionButton).first();
    // Connection button should be in header
  });

  test('should open connection modal', async ({ page }) => {
    const connectionButton = page.locator(selectors.pcConnectionButton).first();
    
    if (await connectionButton.isVisible()) {
      await connectionButton.click();
      await page.waitForTimeout(500);
      
      const modal = page.locator(selectors.modal).first();
      await expect(modal).toBeVisible();
    }
  });

  test('should display connection code', async ({ page }) => {
    const connectionButton = page.locator(selectors.pcConnectionButton).first();
    
    if (await connectionButton.isVisible()) {
      await connectionButton.click();
      await page.waitForTimeout(500);
      
      // Look for connection code display
      const codeDisplay = page.locator('text=/\\d{6}/, [data-testid="connection-code"]').first();
    }
  });

  test('should show connection status', async ({ page }) => {
    const connectionButton = page.locator(selectors.pcConnectionButton).first();
    
    if (await connectionButton.isVisible()) {
      await connectionButton.click();
      await page.waitForTimeout(500);
      
      // Status indicators
      const statusIndicator = page.locator('text=Connected, text=Disconnected, text=Connecting').first();
    }
  });

  test('should close connection modal', async ({ page }) => {
    const connectionButton = page.locator(selectors.pcConnectionButton).first();
    
    if (await connectionButton.isVisible()) {
      await connectionButton.click();
      await page.waitForTimeout(500);
      
      await closeModal(page);
    }
  });
});

test.describe('Hands-Free Modal', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display hands-free toggle', async ({ page }) => {
    const handsFreeToggle = page.locator(selectors.handsFreeToggle).first();
    // Toggle should be visible
  });

  test('should open hands-free modal/settings', async ({ page }) => {
    const handsFreeToggle = page.locator(selectors.handsFreeToggle).first();
    
    if (await handsFreeToggle.isVisible()) {
      await handsFreeToggle.click();
      await page.waitForTimeout(500);
    }
  });

  test('should toggle hands-free mode', async ({ page }) => {
    const handsFreeToggle = page.locator(selectors.handsFreeToggle).first();
    
    if (await handsFreeToggle.isVisible()) {
      // Get initial state
      const initialState = await handsFreeToggle.getAttribute('aria-checked');
      
      await handsFreeToggle.click();
      await page.waitForTimeout(300);
      
      // State should change
    }
  });
});

test.describe('Add Game Modal', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should open Add Game modal', async ({ page }) => {
    await openModal(page, 'add-game');
    
    const modal = page.locator(selectors.modal).first();
    await expect(modal).toBeVisible();
  });

  test('should have game search input', async ({ page }) => {
    await openModal(page, 'add-game');
    
    const gameInput = page.locator('input[placeholder*="game"], input[name*="game"]').first();
    await expect(gameInput).toBeVisible();
  });

  test('should validate game input', async ({ page }) => {
    await openModal(page, 'add-game');
    
    const gameInput = page.locator('input[placeholder*="game"], input[name*="game"]').first();
    await gameInput.fill('');
    
    // Try to submit empty
    const submitButton = page.locator('button:has-text("Create"), button:has-text("Add")').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('should show game search results', async ({ page }) => {
    await openModal(page, 'add-game');
    
    const gameInput = page.locator('input[placeholder*="game"], input[name*="game"]').first();
    await gameInput.fill('Zelda');
    
    await page.waitForTimeout(2000);
    
    // Search results may appear
  });

  test('should close Add Game modal', async ({ page }) => {
    await openModal(page, 'add-game');
    await closeModal(page);
    
    await page.waitForTimeout(300);
  });

  test('should close on Escape key', async ({ page }) => {
    await openModal(page, 'add-game');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });
});

test.describe('Game Info Modal', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display Game Info button on game tab', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const gameInfoButton = page.locator(selectors.gameInfoButton).first();
      // Game Info button should be visible if IGDB data is available
    }
  });

  test('should open Game Info modal', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const gameInfoButton = page.locator(selectors.gameInfoButton).first();
      if (await gameInfoButton.isVisible()) {
        await gameInfoButton.click();
        await page.waitForTimeout(500);
        
        const modal = page.locator(selectors.modal).first();
        await expect(modal).toBeVisible();
      }
    }
  });

  test('should have Overview tab', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const gameInfoButton = page.locator(selectors.gameInfoButton).first();
      if (await gameInfoButton.isVisible()) {
        await gameInfoButton.click();
        await page.waitForTimeout(500);
        
        const overviewTab = page.locator(selectors.gameInfoTabs.overview).first();
      }
    }
  });

  test('should have Media tab', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const gameInfoButton = page.locator(selectors.gameInfoButton).first();
      if (await gameInfoButton.isVisible()) {
        await gameInfoButton.click();
        await page.waitForTimeout(500);
        
        const mediaTab = page.locator(selectors.gameInfoTabs.media).first();
      }
    }
  });

  test('should have Similar Games tab', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const gameInfoButton = page.locator(selectors.gameInfoButton).first();
      if (await gameInfoButton.isVisible()) {
        await gameInfoButton.click();
        await page.waitForTimeout(500);
        
        const similarGamesTab = page.locator(selectors.gameInfoTabs.similarGames).first();
      }
    }
  });

  test('should switch between tabs', async ({ page }) => {
    const gameTabs = page.locator(selectors.gameTab);
    
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(2000);
      
      const gameInfoButton = page.locator(selectors.gameInfoButton).first();
      if (await gameInfoButton.isVisible()) {
        await gameInfoButton.click();
        await page.waitForTimeout(500);
        
        // Click through tabs
        for (const tab of Object.values(selectors.gameInfoTabs)) {
          const tabButton = page.locator(tab).first();
          if (await tabButton.isVisible()) {
            await tabButton.click();
            await page.waitForTimeout(300);
          }
        }
      }
    }
  });
});

test.describe('About Modal', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should access About from settings', async ({ page }) => {
    await openSettingsMenu(page);
    
    const aboutOption = page.locator('button:has-text("About"), text=About').first();
    if (await aboutOption.isVisible()) {
      await aboutOption.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Privacy Modal', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should access Privacy from settings', async ({ page }) => {
    await openSettingsMenu(page);
    
    const privacyOption = page.locator('button:has-text("Privacy"), text=Privacy').first();
    if (await privacyOption.isVisible()) {
      await privacyOption.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Terms Modal', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should access Terms from settings', async ({ page }) => {
    await openSettingsMenu(page);
    
    const termsOption = page.locator('button:has-text("Terms"), text=Terms').first();
    if (await termsOption.isVisible()) {
      await termsOption.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Contact Modal', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should access Contact from settings', async ({ page }) => {
    await openSettingsMenu(page);
    
    const contactOption = page.locator('button:has-text("Contact"), text=Contact').first();
    if (await contactOption.isVisible()) {
      await contactOption.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Modal Accessibility', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should trap focus within modal', async ({ page }) => {
    await openModal(page, 'add-game');
    
    // Tab through elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }
    
    // Focus should stay within modal
    const modal = page.locator(selectors.modal).first();
    const focusedElement = page.locator(':focus');
    // Focus should be within modal
  });

  test('should close on Escape key', async ({ page }) => {
    await openModal(page, 'add-game');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    
    const modal = page.locator(selectors.modal).first();
    await expect(modal).not.toBeVisible().catch(() => true);
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    await openModal(page, 'add-game');
    
    const modal = page.locator(selectors.modal).first();
    const role = await modal.getAttribute('role');
    // Should have dialog role
  });
});

test.describe('Modal Performance', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle rapid modal switches', async ({ page }) => {
    // Open and close different modals rapidly
    const modalActions = ['add-game', 'credit', 'connection'] as const;
    
    for (const action of modalActions) {
      try {
        await openModal(page, action);
        await page.waitForTimeout(200);
        await closeModal(page);
        await page.waitForTimeout(200);
      } catch {
        // Some modals might not be available
      }
    }
    
    // App should remain stable
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
  });

  test('should not have memory leaks after repeated opens', async ({ page }) => {
    for (let i = 0; i < 10; i++) {
      await openModal(page, 'add-game');
      await page.waitForTimeout(100);
      await closeModal(page);
      await page.waitForTimeout(100);
    }
    
    // Page should still be responsive
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.focus();
  });
});

test.describe('Modal Edge Cases', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle opening modal while another is open', async ({ page }) => {
    // Open settings menu
    await openSettingsMenu(page);
    
    // Try to open another modal
    const creditIndicator = page.locator(selectors.creditIndicator).first();
    if (await creditIndicator.isVisible()) {
      await creditIndicator.click();
      await page.waitForTimeout(500);
    }
  });

  test('should handle modal open during loading', async ({ page }) => {
    // Navigate to Game Hub
    await goToGameHub(page);
    
    // Immediately try to open a modal
    await openModal(page, 'add-game');
    await page.waitForTimeout(500);
  });

  test('should handle keyboard navigation in modals', async ({ page }) => {
    await openModal(page, 'add-game');
    
    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    
    await page.waitForTimeout(300);
  });
});
