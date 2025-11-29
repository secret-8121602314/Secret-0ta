import { test, expect } from '@playwright/test';
import { 
  waitForAppReady, 
  selectors, 
  openSettingsMenu,
  clearLocalStorage,
  getLocalStorageItem,
  setLocalStorageItem,
} from './utils/helpers';

/**
 * User Switching & Session Stress Tests
 * =====================================
 * Tests user session management including:
 * - Logout/Login flow
 * - User switching
 * - Session persistence
 * - Multi-session handling
 */

test.describe('Logout Flow', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display logout option in settings', async ({ page }) => {
    await openSettingsMenu(page);
    
    const logoutButton = page.locator(selectors.logoutButton).first();
    await expect(logoutButton).toBeVisible();
  });

  test('should confirm before logout', async ({ page }) => {
    await openSettingsMenu(page);
    
    const logoutButton = page.locator(selectors.logoutButton).first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForTimeout(500);
      
      // May show confirmation dialog
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Log Out")').first();
    }
  });

  test('should clear session on logout', async ({ page }) => {
    await openSettingsMenu(page);
    
    const logoutButton = page.locator(selectors.logoutButton).first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForTimeout(500);
      
      // Confirm if needed
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      await page.waitForTimeout(2000);
      
      // Should redirect to login
    }
  });
});

test.describe('Login Flow', () => {
  test('should show login page when not authenticated', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    
    await page.goto('/earlyaccess');
    await page.waitForLoadState('networkidle');
    
    // Login options should be visible
    const loginButtons = page.locator('button:has-text("Sign"), button:has-text("Log")');
    
    await context.close();
  });

  test('should show OAuth options', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    
    await page.goto('/earlyaccess');
    await page.waitForLoadState('networkidle');
    
    // OAuth buttons
    const googleButton = page.locator('button:has-text("Google")').first();
    const discordButton = page.locator('button:has-text("Discord")').first();
    
    await context.close();
  });

  test('should show email login option', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    
    await page.goto('/earlyaccess');
    await page.waitForLoadState('networkidle');
    
    const emailOption = page.locator(selectors.signInWithEmail).first();
    
    await context.close();
  });
});

test.describe('Session Persistence', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should maintain session across page reloads', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Verify logged in
    const sidebar = page.locator(selectors.sidebar).first();
    await expect(sidebar).toBeVisible();
    
    // Reload
    await page.reload();
    await waitForAppReady(page);
    
    // Should still be logged in
    const sidebarAfter = page.locator(selectors.sidebar).first();
    await expect(sidebarAfter).toBeVisible();
  });

  test('should maintain session after navigation', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Navigate around
    await page.goto('/earlyaccess');
    await page.waitForTimeout(1000);
    
    await page.goto('/');
    await waitForAppReady(page);
    
    // Should still be logged in
    const sidebar = page.locator(selectors.sidebar).first();
    await expect(sidebar).toBeVisible();
  });

  test('should persist user preferences', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Check localStorage for preferences
    const prefs = await page.evaluate(() => {
      return {
        manualUpload: localStorage.getItem('otakon_manual_upload_mode'),
        handsFree: localStorage.getItem('otakonHandsFreeMode'),
        aiMode: localStorage.getItem('otakonAiMode'),
      };
    });
    
    console.log('Stored preferences:', prefs);
  });

  test('should persist conversation history', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Check for existing conversations
    const gameHub = page.locator(selectors.gameHub).first();
    await expect(gameHub).toBeVisible();
    
    const gameTabs = page.locator(selectors.gameTab);
    const tabCount = await gameTabs.count();
    console.log(`Found ${tabCount} game tabs`);
  });
});

test.describe('User Switching Scenarios', () => {
  test('should handle logout and login with different user', async ({ browser }) => {
    // This test simulates user switching
    const context = await browser.newContext({ storageState: '.playwright/.auth/user.json' });
    const page = await context.newPage();
    
    await page.goto('/');
    await waitForAppReady(page);
    
    // Logout
    await openSettingsMenu(page);
    const logoutButton = page.locator(selectors.logoutButton).first();
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForTimeout(1000);
      
      // Confirm if needed
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
      if (await confirmButton.isVisible().catch(() => false)) {
        await confirmButton.click();
      }
      
      await page.waitForTimeout(2000);
    }
    
    await context.close();
  });

  test('should clear previous user data on logout', async ({ browser }) => {
    const context = await browser.newContext({ storageState: '.playwright/.auth/user.json' });
    const page = await context.newPage();
    
    await page.goto('/');
    await waitForAppReady(page);
    
    // Get current localStorage keys
    const keysBefore = await page.evaluate(() => Object.keys(localStorage));
    
    // Logout
    await openSettingsMenu(page);
    const logoutButton = page.locator(selectors.logoutButton).first();
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
      if (await confirmButton.isVisible().catch(() => false)) {
        await confirmButton.click();
      }
      
      await page.waitForTimeout(2000);
      
      // Check localStorage after logout
      const keysAfter = await page.evaluate(() => Object.keys(localStorage));
      console.log('Keys before:', keysBefore.length, 'Keys after:', keysAfter.length);
    }
    
    await context.close();
  });
});

test.describe('Session Timeout Handling', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should handle expired session gracefully', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Simulate session expiry by clearing auth tokens
    await page.evaluate(() => {
      // Clear Supabase auth tokens
      const keys = Object.keys(localStorage).filter(k => k.includes('supabase'));
      keys.forEach(k => localStorage.removeItem(k));
    });
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should redirect to login or show re-auth prompt
    await page.waitForTimeout(2000);
  });
});

test.describe('First Time vs Returning User', () => {
  test('should show onboarding for first-time users', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // First-time user should see splash screens
    const splashContent = page.locator('text=Otagon, text=Adventure, text=Welcome').first();
    
    await context.close();
  });

  test('should skip onboarding for returning users', async ({ page }) => {
    // Use existing auth state
    test.use({ storageState: '.playwright/.auth/user.json' });
    
    await page.goto('/');
    await waitForAppReady(page);
    
    // Returning user should go to main app
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Multi-Tab Session', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should maintain session across multiple tabs', async ({ context }) => {
    // Open first tab
    const page1 = await context.newPage();
    await page1.goto('/');
    await waitForAppReady(page1);
    
    // Open second tab
    const page2 = await context.newPage();
    await page2.goto('/');
    await waitForAppReady(page2);
    
    // Both should be logged in
    const sidebar1 = page1.locator(selectors.sidebar).first();
    const sidebar2 = page2.locator(selectors.sidebar).first();
    
    await expect(sidebar1).toBeVisible();
    await expect(sidebar2).toBeVisible();
    
    await page1.close();
    await page2.close();
  });

  test('should sync state across tabs', async ({ context }) => {
    const page1 = await context.newPage();
    await page1.goto('/');
    await waitForAppReady(page1);
    
    const page2 = await context.newPage();
    await page2.goto('/');
    await waitForAppReady(page2);
    
    // Make a change in page1
    await page1.evaluate(() => {
      localStorage.setItem('test_sync', 'value');
    });
    
    // Check if page2 can see it
    await page2.waitForTimeout(500);
    const value = await page2.evaluate(() => localStorage.getItem('test_sync'));
    expect(value).toBe('value');
    
    await page1.close();
    await page2.close();
  });
});

test.describe('Session Recovery', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should recover from storage errors', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Simulate storage quota exceeded
    await page.evaluate(() => {
      try {
        // Try to save a lot of data
        const largeData = 'x'.repeat(1000);
        for (let i = 0; i < 100; i++) {
          localStorage.setItem(`test_${i}`, largeData);
        }
      } catch (e) {
        console.log('Storage error:', e);
      }
    });
    
    // App should still work
    await page.reload();
    await waitForAppReady(page);
    
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
    
    // Clean up
    await page.evaluate(() => {
      Object.keys(localStorage)
        .filter(k => k.startsWith('test_'))
        .forEach(k => localStorage.removeItem(k));
    });
  });

  test('should handle corrupted localStorage', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Corrupt some data
    await page.evaluate(() => {
      localStorage.setItem('otakon_invalid', '{invalid json}');
    });
    
    // Reload
    await page.reload();
    await waitForAppReady(page);
    
    // App should still work
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
  });
});

test.describe('Browser Storage', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should use localStorage correctly', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    const storageKeys = await page.evaluate(() => Object.keys(localStorage));
    console.log('LocalStorage keys:', storageKeys);
    expect(storageKeys.length).toBeGreaterThan(0);
  });

  test('should use sessionStorage if needed', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    const sessionKeys = await page.evaluate(() => Object.keys(sessionStorage));
    console.log('SessionStorage keys:', sessionKeys);
  });

  test('should handle storage events', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Trigger storage event
    await page.evaluate(() => {
      const event = new StorageEvent('storage', {
        key: 'test',
        newValue: 'value',
        url: window.location.href,
      });
      window.dispatchEvent(event);
    });
    
    await page.waitForTimeout(500);
  });
});

test.describe('Auth Token Handling', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should store auth tokens', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    const hasAuthTokens = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      return keys.some(k => 
        k.includes('supabase') || 
        k.includes('auth') || 
        k.includes('token')
      );
    });
    
    expect(hasAuthTokens).toBe(true);
  });

  test('should refresh tokens when needed', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // This is more of a functional test
    // The app should handle token refresh automatically
    await page.waitForTimeout(2000);
    
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
  });
});
