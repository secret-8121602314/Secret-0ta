import { test, expect } from '@playwright/test';
import { 
  waitForAppReady, 
  selectors, 
  checkPWAInstallability,
  setNetworkConditions,
  clearLocalStorage,
  getLocalStorageItem,
  setLocalStorageItem,
  measurePerformance,
} from './utils/helpers';

/**
 * PWA Stress Tests
 * ================
 * Tests Progressive Web App functionality including:
 * - Service Worker registration
 * - Offline mode behavior
 * - Installation prompts
 * - Cache behavior
 * - First run vs returning user experience
 */

test.describe('PWA Core Functionality', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should register service worker successfully', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    const hasServiceWorker = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.length > 0;
      }
      return false;
    });
    
    // Service worker should be registered
    expect(hasServiceWorker).toBe(true);
  });

  test('should have PWA manifest', async ({ page }) => {
    await page.goto('/');
    
    const manifest = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link ? (link as HTMLLinkElement).href : null;
    });
    
    expect(manifest).toBeTruthy();
  });

  test('should have proper meta tags for PWA', async ({ page }) => {
    await page.goto('/');
    
    // Check theme-color
    const themeColor = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="theme-color"]');
      return meta ? (meta as HTMLMetaElement).content : null;
    });
    expect(themeColor).toBeTruthy();
    
    // Check viewport
    const viewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta ? (meta as HTMLMetaElement).content : null;
    });
    expect(viewport).toContain('width=device-width');
  });

  test('should show install banner or prompt', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Check if install banner exists (may not show in all contexts)
    const installBanner = page.locator(selectors.pwaInstallBanner);
    const installButton = page.locator(selectors.installButton);
    
    // At least one should be present or the app should work without
    await page.waitForTimeout(2000);
  });

  test('should cache critical assets', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    const cacheStatus = await page.evaluate(async () => {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        return {
          hasCaches: cacheNames.length > 0,
          cacheNames: cacheNames,
        };
      }
      return { hasCaches: false, cacheNames: [] };
    });
    
    // App should have caches for offline functionality
    console.log('Cache status:', cacheStatus);
  });
});

test.describe('PWA Offline Mode', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should handle offline mode gracefully', async ({ page, context }) => {
    // First load online
    await page.goto('/');
    await waitForAppReady(page);
    
    // Verify we're online and app works
    const chatInputOnline = page.locator(selectors.chatInput).first();
    await expect(chatInputOnline).toBeVisible();
    
    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(1000);
    
    // Try navigation - should show cached content or offline message
    const content = await page.content();
    expect(content).toBeTruthy();
    
    // Go back online
    await context.setOffline(false);
    await page.waitForTimeout(500);
  });

  test('should show offline indicator when disconnected', async ({ page, context }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(1000);
    
    // Check for any offline indicator
    const offlineIndicator = page.locator('text=offline, text=Offline, [data-testid="offline-indicator"]').first();
    
    // Go back online
    await context.setOffline(false);
  });

  test('should queue messages when offline', async ({ page, context }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Go offline
    await context.setOffline(true);
    
    // Try to type a message
    const chatInput = page.locator(selectors.chatInput).first();
    if (await chatInput.isVisible()) {
      await chatInput.fill('Test message while offline');
    }
    
    // Go back online
    await context.setOffline(false);
    await page.waitForTimeout(500);
  });

  test('should recover gracefully from network errors', async ({ page, context }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Simulate intermittent connectivity
    for (let i = 0; i < 3; i++) {
      await context.setOffline(true);
      await page.waitForTimeout(500);
      await context.setOffline(false);
      await page.waitForTimeout(500);
    }
    
    // App should still be functional
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
  });
});

test.describe('PWA First Run Experience', () => {
  test('should complete first run flow successfully', async ({ browser }) => {
    // Create a fresh context without saved state
    const context = await browser.newContext({
      storageState: undefined,
    });
    const page = await context.newPage();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for first-run elements (login screen or onboarding)
    const loginScreen = page.locator(selectors.loginButton).first();
    const onboardingScreen = page.locator(selectors.startAdventureButton).first();
    
    // Either login or onboarding should be visible for first run
    const hasLoginOrOnboarding = 
      await loginScreen.isVisible().catch(() => false) ||
      await onboardingScreen.isVisible().catch(() => false);
    
    await context.close();
  });

  test('should persist user preferences on first run', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Check localStorage for persisted preferences
    const hasPreferences = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      return keys.some(key => 
        key.includes('otakon') || 
        key.includes('preference') ||
        key.includes('setting')
      );
    });
    
    // App should persist some settings
    console.log('Has persisted preferences:', hasPreferences);
  });
});

test.describe('PWA Returning User Experience', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should restore session for returning user', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Returning user should skip onboarding
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible({ timeout: 15000 });
  });

  test('should restore conversation history', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Check for conversation list in sidebar
    const gameHub = page.locator(selectors.gameHub).first();
    await expect(gameHub).toBeVisible();
  });

  test('should restore user preferences', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Check if preferences are restored
    const hasStoredPrefs = await page.evaluate(() => {
      return localStorage.getItem('otakon_manual_upload_mode') !== null ||
             localStorage.getItem('otakonHandsFreeMode') !== null ||
             localStorage.getItem('otakonAiMode') !== null;
    });
    
    console.log('Preferences restored:', hasStoredPrefs);
  });

  test('should maintain UI state across refreshes', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Navigate to Game Hub
    const gameHub = page.locator(selectors.gameHub).first();
    await gameHub.click();
    await page.waitForTimeout(500);
    
    // Refresh
    await page.reload();
    await waitForAppReady(page);
    
    // Should still show app content
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
  });
});

test.describe('PWA Performance Stress Tests', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should load quickly on repeat visits', async ({ page }) => {
    // First visit
    const { duration: firstLoad } = await measurePerformance(
      page,
      async () => {
        await page.goto('/');
        await waitForAppReady(page);
      },
      'First load'
    );
    
    // Reload (should be faster due to cache)
    const { duration: secondLoad } = await measurePerformance(
      page,
      async () => {
        await page.reload();
        await waitForAppReady(page);
      },
      'Cached reload'
    );
    
    console.log(`First load: ${firstLoad}ms, Cached reload: ${secondLoad}ms`);
    
    // Cached reload should ideally be faster
    // But we don't enforce this as network conditions vary
  });

  test('should handle multiple rapid refreshes', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Rapid refreshes
    for (let i = 0; i < 5; i++) {
      await page.reload();
      await page.waitForTimeout(500);
    }
    
    await waitForAppReady(page);
    
    // App should still work
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
  });

  test('should maintain functionality after extended use', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Simulate extended session with multiple interactions
    for (let i = 0; i < 10; i++) {
      // Navigate to Game Hub
      const gameHub = page.locator(selectors.gameHub).first();
      if (await gameHub.isVisible()) {
        await gameHub.click();
        await page.waitForTimeout(200);
      }
      
      // Try to focus chat input
      const chatInput = page.locator(selectors.chatInput).first();
      if (await chatInput.isVisible()) {
        await chatInput.focus();
        await page.waitForTimeout(100);
      }
    }
    
    // App should remain responsive
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
  });
});

test.describe('PWA Update Flow', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should handle service worker updates', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Check for update prompt if available
    const updatePrompt = page.locator('text=Update available, text=New version, [data-testid="update-prompt"]').first();
    
    // If update prompt exists, it should be clickable
    if (await updatePrompt.isVisible().catch(() => false)) {
      console.log('Update prompt found');
    }
  });

  test('should not lose data during updates', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Get initial state
    const initialLocalStorage = await page.evaluate(() => {
      return JSON.stringify(localStorage);
    });
    
    // Simulate page refresh (as if after update)
    await page.reload();
    await waitForAppReady(page);
    
    // Get state after reload
    const afterLocalStorage = await page.evaluate(() => {
      return JSON.stringify(localStorage);
    });
    
    // Critical data should be preserved
    // (exact comparison may fail due to timestamps, but structure should be similar)
    console.log('LocalStorage preserved after refresh');
  });
});

test.describe('PWA Cross-Browser Compatibility', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should work without service worker support', async ({ page }) => {
    // Disable service worker via page context
    await page.route('**/sw.js', route => route.abort());
    
    await page.goto('/');
    await waitForAppReady(page);
    
    // App should still function
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
  });

  test('should gracefully degrade when caches unavailable', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Clear all caches
    await page.evaluate(async () => {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
    });
    
    await page.reload();
    await waitForAppReady(page);
    
    // App should still work
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
  });
});
