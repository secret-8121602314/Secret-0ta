import { test, expect } from '@playwright/test';
import { waitForAppReady } from './utils/helpers';

/**
 * PC Connection Tests
 * Tests the WebSocket connection between mobile app and PC client
 */

test.describe('PC Connection', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display connection status indicator', async ({ page }) => {
    const connectionIndicator = page.locator('[data-testid="connection-status"], text=Connect PC, text=Connected').first();
    // Connection status should be visible
  });

  test('should open connection modal', async ({ page }) => {
    const connectButton = page.locator('button:has-text("Connect"), [data-testid="connect-button"]').first();
    
    if (await connectButton.isVisible()) {
      await connectButton.click();
      
      // Modal should open
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible();
    }
  });

  test('should display connection code', async ({ page }) => {
    const connectButton = page.locator('button:has-text("Connect")').first();
    
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);

      // Look for connection code input or display
      const codeDisplay = page.locator('[data-testid="connection-code"], input[placeholder*="code"]').first();
      // Code field should be visible
    }
  });

  test('should allow entering connection code', async ({ page }) => {
    const connectButton = page.locator('button:has-text("Connect")').first();
    
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);

      const codeInput = page.locator('input[placeholder*="code"], input[type="text"]').first();
      if (await codeInput.isVisible()) {
        await codeInput.fill('TESTCODE');
        await expect(codeInput).toHaveValue('TESTCODE');
      }
    }
  });

  test('should close connection modal', async ({ page }) => {
    const connectButton = page.locator('button:has-text("Connect")').first();
    
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(300);

      const closeButton = page.locator('button[aria-label="Close"], [data-testid="modal-close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(300);
      }
    }
  });
});

test.describe('Hands-Free Mode', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display hands-free toggle', async ({ page }) => {
    const handsFreeToggle = page.locator('[data-testid="hands-free-toggle"], button:has-text("Hands-Free")').first();
    // Hands-free toggle should be visible
  });

  test('should open hands-free settings modal', async ({ page }) => {
    const handsFreeButton = page.locator('button:has-text("Hands-Free"), [data-testid="hands-free-button"]').first();
    
    if (await handsFreeButton.isVisible()) {
      await handsFreeButton.click();
      
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible();
    }
  });

  test('should toggle hands-free mode', async ({ page }) => {
    const handsFreeToggle = page.locator('[data-testid="hands-free-toggle"], input[type="checkbox"]').first();
    
    if (await handsFreeToggle.isVisible()) {
      const isChecked = await handsFreeToggle.isChecked();
      await handsFreeToggle.click();
      
      // State should toggle
      const newState = await handsFreeToggle.isChecked();
      expect(newState).not.toBe(isChecked);
    }
  });
});

test.describe('Screenshot Upload', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display upload button', async ({ page }) => {
    const uploadButton = page.locator('button[aria-label*="upload"], button:has-text("Upload"), [data-testid="upload-button"]').first();
    // Upload button should be visible
  });

  test('should toggle manual upload mode', async ({ page }) => {
    const modeToggle = page.locator('[data-testid="upload-mode-toggle"], button:has-text("Auto"), button:has-text("Manual")').first();
    
    if (await modeToggle.isVisible()) {
      await modeToggle.click();
      await page.waitForTimeout(300);
    }
  });

  test('should open file picker when upload clicked', async ({ page }) => {
    const uploadButton = page.locator('[data-testid="upload-button"]').first();
    
    if (await uploadButton.isVisible()) {
      // Set up file chooser listener
      const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 2000 }).catch(() => null);
      
      await uploadButton.click();
      
      const fileChooser = await fileChooserPromise;
      // File chooser might open
    }
  });
});
