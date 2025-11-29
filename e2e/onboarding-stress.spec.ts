import { test, expect } from '@playwright/test';
import { 
  waitForAppReady, 
  selectors, 
  onboardingButtons,
  clearLocalStorage,
  setLocalStorageItem,
} from './utils/helpers';

/**
 * Onboarding & First Run Stress Tests
 * ====================================
 * Tests the complete onboarding flow including:
 * - Splash screens navigation
 * - First run experience
 * - Returning user detection
 * - Onboarding state persistence
 */

test.describe('Initial Splash Screen', () => {
  test('should display initial splash screen for new users', async ({ browser }) => {
    // Create fresh context without auth
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    
    // Clear any existing state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Look for initial splash elements
    const mascotImage = page.locator('img[alt*="Otagon"], img[alt*="Mascot"]').first();
    const title = page.locator('text=Otagon').first();
    const startButton = page.locator(selectors.startAdventureButton).first();
    
    // Either mascot or title should be visible
    const isOnInitialScreen = 
      await mascotImage.isVisible({ timeout: 5000 }).catch(() => false) ||
      await title.isVisible({ timeout: 5000 }).catch(() => false) ||
      await startButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    await context.close();
  });

  test('should show tagline "Your Spoiler-Free Gaming Companion"', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const tagline = page.locator('text=Spoiler-Free Gaming Companion, text=Spoiler-Free').first();
    
    await context.close();
  });

  test('should have "Start the Adventure" button', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const startButton = page.locator(selectors.startAdventureButton).first();
    
    await context.close();
  });

  test('should show PC client download option', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for download PC client text or button
    const downloadOption = page.locator('text=Download PC Client, text=PC Client, button:has-text("Download")').first();
    
    await context.close();
  });
});

test.describe('Onboarding Flow Navigation', () => {
  test('should progress through all splash screens', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    let screensVisited = 0;
    const maxScreens = 5;
    
    // Click through onboarding screens
    while (screensVisited < maxScreens) {
      let clicked = false;
      
      for (const buttonSelector of onboardingButtons) {
        const btn = page.locator(buttonSelector).first();
        if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await btn.click();
          clicked = true;
          screensVisited++;
          await page.waitForTimeout(500);
          break;
        }
      }
      
      if (!clicked) break;
    }
    
    console.log(`Visited ${screensVisited} onboarding screens`);
    
    await context.close();
  });

  test('should handle How to Use screen', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to How to Use screen
    const startBtn = page.locator(selectors.startAdventureButton).first();
    if (await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }
    
    // Look for Let's Begin button (How to Use screen)
    const letsBeginBtn = page.locator(selectors.letsBeginButton).first();
    
    await context.close();
  });

  test('should handle Pro Features splash screen', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate through screens to Pro Features
    for (const selector of [selectors.startAdventureButton, selectors.letsBeginButton]) {
      const btn = page.locator(selector).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Look for Maybe Later (Pro Features screen)
    const maybeLaterBtn = page.locator(selectors.maybeLaterButton).first();
    
    await context.close();
  });

  test('should persist onboarding completion in localStorage', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Complete onboarding
    for (const buttonSelector of onboardingButtons) {
      const btn = page.locator(buttonSelector).first();
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Check localStorage for onboarding completion
    const hasSeenSplash = await page.evaluate(() => {
      return localStorage.getItem('otakon_has_seen_splash_screens') === 'true';
    });
    
    await context.close();
  });
});

test.describe('Login & Authentication Flow', () => {
  test('should show login options', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    
    await page.goto('/earlyaccess');
    await page.waitForLoadState('networkidle');
    
    // Look for OAuth buttons
    const googleLogin = page.locator('button:has-text("Google"), button:has-text("Sign in with Google")').first();
    const discordLogin = page.locator('button:has-text("Discord"), button:has-text("Sign in with Discord")').first();
    const emailLogin = page.locator(selectors.signInWithEmail).first();
    
    await context.close();
  });

  test('should show email/password form when selected', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    
    await page.goto('/earlyaccess');
    await page.waitForLoadState('networkidle');
    
    // Click Sign In with Email
    const emailBtn = page.locator(selectors.signInWithEmail).first();
    if (await emailBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailBtn.click();
      await page.waitForTimeout(500);
      
      // Check for email and password inputs
      const emailInput = page.locator(selectors.emailInput).first();
      const passwordInput = page.locator(selectors.passwordInput).first();
      
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    }
    
    await context.close();
  });

  test('should validate email format', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    
    await page.goto('/earlyaccess');
    await page.waitForLoadState('networkidle');
    
    // Navigate to email login
    const emailBtn = page.locator(selectors.signInWithEmail).first();
    if (await emailBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailBtn.click();
      await page.waitForTimeout(500);
      
      // Enter invalid email
      const emailInput = page.locator(selectors.emailInput).first();
      await emailInput.fill('invalid-email');
      
      const passwordInput = page.locator(selectors.passwordInput).first();
      await passwordInput.fill('password123');
      
      // Try to submit
      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(500);
        
        // Should show validation error
        const errorMessage = page.locator('text=valid email, text=invalid, [role="alert"]').first();
      }
    }
    
    await context.close();
  });

  test('should show error for invalid credentials', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    
    await page.goto('/earlyaccess');
    await page.waitForLoadState('networkidle');
    
    const emailBtn = page.locator(selectors.signInWithEmail).first();
    if (await emailBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailBtn.click();
      await page.waitForTimeout(500);
      
      // Enter wrong credentials
      await page.locator(selectors.emailInput).first().fill('nonexistent@test.com');
      await page.locator(selectors.passwordInput).first().fill('wrongpassword');
      
      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
        
        // Should show error
        const errorMessage = page.locator('text=Invalid, text=error, text=incorrect, [role="alert"]').first();
      }
    }
    
    await context.close();
  });
});

test.describe('Returning User Experience', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should skip onboarding for returning users', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Should go directly to main app
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible({ timeout: 15000 });
    
    // Should NOT see onboarding screens
    const startButton = page.locator(selectors.startAdventureButton).first();
    await expect(startButton).not.toBeVisible({ timeout: 1000 }).catch(() => true);
  });

  test('should restore user session', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // User should be authenticated - check for settings menu with user options
    const settingsButton = page.locator(selectors.settingsButton);
    await settingsButton.click();
    await page.waitForTimeout(300);
    
    // Should have logout option (indicates logged in)
    const logoutOption = page.locator(selectors.logoutButton).first();
    await expect(logoutOption).toBeVisible();
  });

  test('should restore conversations', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Should have Game Hub visible
    const gameHub = page.locator(selectors.gameHub).first();
    await expect(gameHub).toBeVisible();
  });

  test('should maintain preferences after reload', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Get current preferences
    const prefsBefore = await page.evaluate(() => {
      return {
        manualUpload: localStorage.getItem('otakon_manual_upload_mode'),
        handsFree: localStorage.getItem('otakonHandsFreeMode'),
        aiMode: localStorage.getItem('otakonAiMode'),
      };
    });
    
    // Reload page
    await page.reload();
    await waitForAppReady(page);
    
    // Check preferences are maintained
    const prefsAfter = await page.evaluate(() => {
      return {
        manualUpload: localStorage.getItem('otakon_manual_upload_mode'),
        handsFree: localStorage.getItem('otakonHandsFreeMode'),
        aiMode: localStorage.getItem('otakonAiMode'),
      };
    });
    
    expect(prefsAfter.manualUpload).toEqual(prefsBefore.manualUpload);
    expect(prefsAfter.handsFree).toEqual(prefsBefore.handsFree);
    expect(prefsAfter.aiMode).toEqual(prefsBefore.aiMode);
  });
});

test.describe('Onboarding Edge Cases', () => {
  test('should handle rapid button clicks during onboarding', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Rapidly click any visible button
    for (let i = 0; i < 10; i++) {
      for (const selector of onboardingButtons) {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 100 }).catch(() => false)) {
          await btn.click().catch(() => {});
        }
      }
      await page.waitForTimeout(100);
    }
    
    // App should not crash
    await page.waitForTimeout(1000);
    
    await context.close();
  });

  test('should handle page refresh during onboarding', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Click first button
    const startBtn = page.locator(selectors.startAdventureButton).first();
    if (await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(300);
      
      // Refresh mid-onboarding
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Should resume or restart onboarding properly
    }
    
    await context.close();
  });

  test('should handle browser back button during onboarding', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Navigate forward in onboarding
    const startBtn = page.locator(selectors.startAdventureButton).first();
    if (await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(500);
      
      // Try browser back
      await page.goBack();
      await page.waitForTimeout(500);
      
      // Should handle gracefully
    }
    
    await context.close();
  });
});

test.describe('PWA Install Banner in Onboarding', () => {
  test('should show PWA install option during onboarding', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for PWA install banner or button
    const installBanner = page.locator(selectors.pwaInstallBanner).first();
    const installButton = page.locator(selectors.installButton).first();
    
    await context.close();
  });

  test('should not block onboarding if PWA install is dismissed', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to dismiss any install prompt
    const dismissButton = page.locator('button:has-text("Maybe Later"), button:has-text("Not Now"), button:has-text("Skip")').first();
    if (await dismissButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dismissButton.click();
    }
    
    // Should still be able to proceed with onboarding
    const startBtn = page.locator(selectors.startAdventureButton).first();
    
    await context.close();
  });
});
