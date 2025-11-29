import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load .env.test file
config({ path: '.env.test' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authDir = path.join(__dirname, '../.playwright/.auth');
const authFile = path.join(authDir, 'user.json');

// Ensure auth directory exists
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

/**
 * Authentication Setup
 * This runs before all tests to authenticate and save the session
 */
setup('authenticate', async ({ page }) => {
  console.log('🔐 Setting up authentication...');

  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    console.log('⚠️  No test credentials found in .env.test');
    console.log('   Skipping authentication - tests will run as guest.');
    await page.context().storageState({ path: authFile });
    return;
  }

  console.log(`📧 Will authenticate as: ${email}`);

  // Go directly to the early access/login page
  await page.goto('/earlyaccess');
  
  // Wait for the app to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Extra wait for React to render
  
  // Check if we're already logged in (look for sidebar or other authenticated UI)
  const isLoggedIn = await page.locator('[data-testid="sidebar"], .sidebar, [class*="Sidebar"]').first().isVisible({ timeout: 2000 }).catch(() => false);
  
  if (isLoggedIn) {
    console.log('✅ Already logged in! Saving session...');
    await page.context().storageState({ path: authFile });
    return;
  }

  // Look for "Sign In with Email" button (Otagon shows OAuth buttons first)
  const signInWithEmailBtn = page.locator('button:has-text("Sign In with Email")').first();
  const hasEmailOption = await signInWithEmailBtn.isVisible({ timeout: 3000 }).catch(() => false);

  if (hasEmailOption) {
    console.log('🔘 Found email sign-in button, clicking...');
    await signInWithEmailBtn.click();
    await page.waitForTimeout(500); // Wait for form transition
  }

  // Now look for the password field
  const passwordInput = page.locator('input[type="password"]').first();
  const hasPasswordLogin = await passwordInput.isVisible({ timeout: 3000 }).catch(() => false);

  if (hasPasswordLogin) {
    console.log(`📧 Logging in with email: ${email}`);
    
    const emailInput = page.locator('input[type="email"], input#email-input').first();
    await emailInput.fill(email);
    await passwordInput.fill(password);
    
    // Click sign in button
    const signInBtn = page.locator('button[type="submit"]').first();
    await signInBtn.click();
    
    // Wait for navigation/auth to complete
    await page.waitForLoadState('networkidle');
    console.log('✅ Login submitted!');
    
    // Handle onboarding splash screens for first-time users
    // Keep clicking "Next", "Continue", "Skip", or "Get Started" buttons until we reach the main app
    let onboardingAttempts = 0;
    const maxAttempts = 10;
    
    while (onboardingAttempts < maxAttempts) {
      // Check if we've reached the main app (sidebar visible)
      const reachedMainApp = await page.locator('[data-testid="sidebar"], .sidebar, [class*="Sidebar"]').first().isVisible({ timeout: 1000 }).catch(() => false);
      
      if (reachedMainApp) {
        console.log('✅ Reached main app!');
        break;
      }
      
      // Look for onboarding navigation buttons
      const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Skip"), button:has-text("Get Started"), button:has-text("Let\'s Go"), button:has-text("Done")').first();
      const hasNextBtn = await nextBtn.isVisible({ timeout: 1000 }).catch(() => false);
      
      if (hasNextBtn) {
        const btnText = await nextBtn.textContent();
        console.log(`🔘 Clicking onboarding button: "${btnText?.trim()}"...`);
        await nextBtn.click();
        await page.waitForTimeout(500);
        onboardingAttempts++;
      } else {
        // No button found, wait a bit and check again
        await page.waitForTimeout(500);
        onboardingAttempts++;
      }
    }
    
    if (onboardingAttempts >= maxAttempts) {
      console.log('⚠️  Max onboarding attempts reached');
    }
  } else {
    console.log('ℹ️  No email/password login form found.');
  }
  
  // Save the auth state
  await page.context().storageState({ path: authFile });
  console.log('💾 Auth state saved to .playwright/.auth/user.json');
});
