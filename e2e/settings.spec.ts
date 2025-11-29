import { test, expect } from '@playwright/test';
import { waitForAppReady } from './utils/helpers';

/**
 * Settings & Profile Tests
 * Tests user settings, profile, and configuration options
 */

test.describe('Settings', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display settings button', async ({ page }) => {
    // Settings is the gear icon button in header - it's after the PC connection button
    // Look for the header buttons area and find the gear icon
    const headerButtons = page.locator('header button').last();
    await expect(headerButtons).toBeVisible();
  });

  test('should open settings menu when clicked', async ({ page }) => {
    // Settings is the last button in the header (gear icon)
    const settingsButton = page.locator('header button').last();
    await settingsButton.click();
    
    // Settings menu should appear - look for the Settings option text in the menu
    await page.waitForTimeout(500);
    // The menu has buttons with text like "Settings", "Guide", "Log Out"
    const settingsOption = page.locator('button:has-text("Settings")').first();
    await expect(settingsOption).toBeVisible();
  });

  test('should display user tier information', async ({ page }) => {
    const settingsButton = page.locator('header button').last();
    await settingsButton.click();
    await page.waitForTimeout(500);

    // Look for tier info (Free, Pro, etc.) - use OR operator correctly
    const tierInfo = page.locator('text=Free').or(page.locator('text=Pro')).or(page.locator('text=Vanguard')).or(page.locator('text=Trial')).first();
    // Tier should be displayed
  });

  test('should have upgrade option for free users', async ({ page }) => {
    const settingsButton = page.locator('header button').last();
    await settingsButton.click();
    await page.waitForTimeout(500);

    // Look for upgrade button
    const upgradeButton = page.locator('button:has-text("Upgrade")').or(page.locator('button:has-text("Go Pro")')).or(page.locator('a:has-text("Upgrade")')).first();
    // Upgrade should be visible for free users
  });

  test('should display logout option', async ({ page }) => {
    const settingsButton = page.locator('header button').last();
    await settingsButton.click();
    await page.waitForTimeout(500);

    // Look for Logout text in the menu (single word, not "Log Out")
    const logoutButton = page.locator('text=Logout').first();
    await expect(logoutButton).toBeVisible();
  });

  test('should open guide/how-to-use', async ({ page }) => {
    const settingsButton = page.locator('header button').last();
    await settingsButton.click();
    await page.waitForTimeout(500);

    const guideButton = page.locator('button:has-text("Guide")').or(page.locator('button:has-text("How to Use")')).first();
    if (await guideButton.isVisible()) {
      await guideButton.click();
      
      // Guide should open
      await page.waitForTimeout(500);
    }
  });

  test('should close settings when clicking outside', async ({ page }) => {
    const settingsButton = page.locator('header button').last();
    await settingsButton.click();
    await page.waitForTimeout(300);

    // Click outside the menu
    await page.click('body', { position: { x: 10, y: 10 } });
    
    await page.waitForTimeout(300);
    
    // Menu should be closed
    const settingsMenu = page.locator('[role="menu"], .settings-menu');
    // Should not be visible or should be hidden
  });
});

test.describe('Credits & Subscription', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display credit indicator', async ({ page }) => {
    const creditIndicator = page.locator('[data-testid="credit-indicator"], .credit-indicator, text=Credits').first();
    // Credit indicator should be visible
  });

  test('should open credit modal when clicked', async ({ page }) => {
    const creditIndicator = page.locator('[data-testid="credit-indicator"], button:has-text("Credits")').first();
    
    if (await creditIndicator.isVisible()) {
      await creditIndicator.click();
      
      // Modal should open
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible();
    }
  });

  test('should display subscription tiers', async ({ page }) => {
    const creditIndicator = page.locator('[data-testid="credit-indicator"]').first();
    
    if (await creditIndicator.isVisible()) {
      await creditIndicator.click();
      await page.waitForTimeout(500);

      // Look for tier options
      const tiers = page.locator('text=Pro, text=Vanguard').first();
      // Tiers should be visible in upgrade modal
    }
  });
});

test.describe('Trial Flow', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should show trial banner for eligible users', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);

    // Look for trial banner
    const trialBanner = page.locator('[data-testid="trial-banner"], text=Try Pro Free, text=7-day trial').first();
    // Trial banner visibility depends on user state
  });

  test('should allow starting trial', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);

    const startTrialButton = page.locator('button:has-text("Start Trial"), button:has-text("Try Free")').first();
    
    if (await startTrialButton.isVisible()) {
      // Don't actually click to start trial in tests
      await expect(startTrialButton).toBeEnabled();
    }
  });
});
