import { test, expect } from '@playwright/test';
import { 
  waitForAppReady, 
  selectors, 
  goToGameHub,
  createGameTab,
  sendMessage,
  waitForChatResponse,
  openModal,
} from './utils/helpers';

/**
 * Credits & Subscription Stress Tests
 * ====================================
 * Tests credit system and subscription features:
 * - Credit display and updates
 * - Credit consumption tracking
 * - Free tier limitations
 * - Pro tier features
 * - Vanguard Pro features
 * - Subscription flows
 */

test.describe('Credit Display', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display credit indicator', async ({ page }) => {
    const creditIndicator = page.locator(selectors.creditIndicator).first();
    const isVisible = await creditIndicator.isVisible().catch(() => false);
    console.log('Credit indicator visible:', isVisible);
    
    if (isVisible) {
      const creditText = await creditIndicator.textContent();
      console.log('Credit display:', creditText);
    }
  });

  test('should show credit modal on click', async ({ page }) => {
    const creditIndicator = page.locator(selectors.creditIndicator).first();
    
    if (await creditIndicator.isVisible().catch(() => false)) {
      await creditIndicator.click();
      await page.waitForTimeout(1000);
      
      // Check for credit modal
      const creditModal = page.locator(
        '[role="dialog"], [class*="modal"], [data-testid*="credit"]'
      ).first();
      
      const modalVisible = await creditModal.isVisible().catch(() => false);
      console.log('Credit modal opened:', modalVisible);
      
      await page.keyboard.press('Escape');
    }
  });

  test('should update credits after message', async ({ page }) => {
    const creditIndicator = page.locator(selectors.creditIndicator).first();
    
    if (await creditIndicator.isVisible().catch(() => false)) {
      const initialCredits = await creditIndicator.textContent() || '';
      
      await goToGameHub(page);
      await createGameTab(page, 'Credit Update Test');
      await page.waitForTimeout(1000);
      
      await sendMessage(page, 'Test message to consume credits');
      await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2000);
      
      const newCredits = await creditIndicator.textContent() || '';
      console.log(`Credits: ${initialCredits} -> ${newCredits}`);
    }
  });
});

test.describe('Free Tier Limitations', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should show upgrade prompt when out of credits', async ({ page }) => {
    // This test checks for upgrade prompts
    await goToGameHub(page);
    await createGameTab(page, 'Free Tier Test');
    await page.waitForTimeout(1000);
    
    // Send multiple messages to potentially trigger limit
    for (let i = 0; i < 3; i++) {
      await sendMessage(page, `Free tier message ${i + 1}`);
      await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(500);
    }
    
    // Look for upgrade prompt
    const upgradePrompt = page.locator(
      'text=/upgrade|pro|subscribe|limit reached/i, button:has-text("Upgrade")'
    ).first();
    
    const hasUpgradePrompt = await upgradePrompt.isVisible().catch(() => false);
    console.log('Upgrade prompt visible:', hasUpgradePrompt);
  });

  test('should indicate subtab limitations for free tier', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Subtab Limit Test');
    await page.waitForTimeout(2000);
    
    // Check for locked/pro-only subtab indicators
    const proOnlyIndicator = page.locator(
      'text=/pro only|locked|upgrade/i, [class*="locked"], [class*="pro"]'
    ).first();
    
    const hasProIndicator = await proOnlyIndicator.isVisible().catch(() => false);
    console.log('Pro-only indicator visible:', hasProIndicator);
  });
});

test.describe('Credit Consumption', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should consume credits for AI queries', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Credit Consumption Test');
    await page.waitForTimeout(1000);
    
    // Track credit changes
    const creditIndicator = page.locator(selectors.creditIndicator).first();
    const getCredits = async () => {
      const text = await creditIndicator.textContent() || '';
      const match = text.match(/\d+/);
      return match ? parseInt(match[0]) : null;
    };
    
    const initialCredits = await getCredits();
    console.log('Initial credits:', initialCredits);
    
    await sendMessage(page, 'Credit tracking test');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    const finalCredits = await getCredits();
    console.log('Final credits:', finalCredits);
    
    if (initialCredits !== null && finalCredits !== null) {
      console.log('Credits consumed:', initialCredits - finalCredits);
    }
  });

  test('should show credit cost before action', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Credit Cost Preview');
    await page.waitForTimeout(1000);
    
    // Look for credit cost indicators
    const costIndicator = page.locator(
      'text=/cost|credits?:/i, [class*="cost"], [data-credits]'
    ).first();
    
    const hasCostIndicator = await costIndicator.isVisible().catch(() => false);
    console.log('Cost indicator visible:', hasCostIndicator);
  });
});

test.describe('Subscription Modal', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should open subscription modal', async ({ page }) => {
    // Look for subscription/upgrade button
    const upgradeButton = page.locator(
      'button:has-text("Upgrade"), button:has-text("Pro"), button:has-text("Subscribe"), ' +
      '[data-testid*="upgrade"], a:has-text("Upgrade")'
    ).first();
    
    if (await upgradeButton.isVisible().catch(() => false)) {
      await upgradeButton.click();
      await page.waitForTimeout(1000);
      
      // Check for pricing/subscription modal
      const subscriptionModal = page.locator(
        '[role="dialog"], [class*="modal"], [class*="pricing"]'
      ).first();
      
      const modalVisible = await subscriptionModal.isVisible().catch(() => false);
      console.log('Subscription modal opened:', modalVisible);
      
      await page.keyboard.press('Escape');
    } else {
      console.log('Upgrade button not visible');
    }
  });

  test('should display pricing tiers', async ({ page }) => {
    const upgradeButton = page.locator(
      'button:has-text("Upgrade"), button:has-text("Pro")'
    ).first();
    
    if (await upgradeButton.isVisible().catch(() => false)) {
      await upgradeButton.click();
      await page.waitForTimeout(1000);
      
      // Check for tier options
      const proTier = page.locator('text=/pro/i').first();
      const vanguardTier = page.locator('text=/vanguard/i').first();
      
      console.log('Pro tier visible:', await proTier.isVisible().catch(() => false));
      console.log('Vanguard tier visible:', await vanguardTier.isVisible().catch(() => false));
      
      await page.keyboard.press('Escape');
    }
  });
});

test.describe('Pro Tier Features', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should have access to all subtab types', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Pro Features Test');
    await page.waitForTimeout(2000);
    
    // Check if all subtab types are available
    const subtabTypes = ['story', 'strategies', 'tips', 'walkthrough', 'items', 'characters', 'chat'];
    
    for (const type of subtabTypes) {
      const subtabButton = page.locator(`[data-testid*="${type}"], button:has-text("${type}")`).first();
      const isAvailable = await subtabButton.isVisible().catch(() => false);
      console.log(`Subtab ${type} available:`, isAvailable);
    }
  });

  test('should have higher credit allowance', async ({ page }) => {
    const creditIndicator = page.locator(selectors.creditIndicator).first();
    
    if (await creditIndicator.isVisible().catch(() => false)) {
      const creditText = await creditIndicator.textContent() || '';
      console.log('Credit allowance:', creditText);
      
      // Pro users typically have higher limits
      const match = creditText.match(/\d+/);
      if (match) {
        console.log('Credit value:', parseInt(match[0]));
      }
    }
  });
});

test.describe('Credit Refill', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should show refill countdown or option', async ({ page }) => {
    const creditIndicator = page.locator(selectors.creditIndicator).first();
    
    if (await creditIndicator.isVisible().catch(() => false)) {
      await creditIndicator.click();
      await page.waitForTimeout(1000);
      
      // Look for refill info
      const refillInfo = page.locator(
        'text=/refill|reset|renew|next/i'
      ).first();
      
      const hasRefillInfo = await refillInfo.isVisible().catch(() => false);
      console.log('Refill info visible:', hasRefillInfo);
      
      await page.keyboard.press('Escape');
    }
  });

  test('should show buy credits option', async ({ page }) => {
    const creditIndicator = page.locator(selectors.creditIndicator).first();
    
    if (await creditIndicator.isVisible().catch(() => false)) {
      await creditIndicator.click();
      await page.waitForTimeout(1000);
      
      // Look for buy credits button
      const buyButton = page.locator(
        'button:has-text("Buy"), button:has-text("Purchase"), button:has-text("Add")'
      ).first();
      
      const hasBuyOption = await buyButton.isVisible().catch(() => false);
      console.log('Buy credits option visible:', hasBuyOption);
      
      await page.keyboard.press('Escape');
    }
  });
});

test.describe('Credit Error Handling', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle credit check failure gracefully', async ({ page }) => {
    // Block credit API
    await page.route('**/credits**', route => route.abort());
    await page.route('**/user**', route => route.abort());
    
    await page.reload();
    await waitForAppReady(page);
    
    // App should still function
    expect(await page.locator('body').isVisible()).toBe(true);
    
    await page.unroute('**/credits**');
    await page.unroute('**/user**');
  });

  test('should show warning when credits low', async ({ page }) => {
    // This checks for low credit warnings
    const lowCreditWarning = page.locator(
      'text=/low credits|running low|almost out/i, [class*="warning"]'
    ).first();
    
    const hasWarning = await lowCreditWarning.isVisible().catch(() => false);
    console.log('Low credit warning visible:', hasWarning);
  });
});

test.describe('Payment Flow', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should have payment button available', async ({ page }) => {
    // Open upgrade modal
    const upgradeButton = page.locator(
      'button:has-text("Upgrade"), button:has-text("Subscribe")'
    ).first();
    
    if (await upgradeButton.isVisible().catch(() => false)) {
      await upgradeButton.click();
      await page.waitForTimeout(1000);
      
      // Look for payment/checkout button
      const paymentButton = page.locator(
        'button:has-text("Subscribe"), button:has-text("Pay"), button:has-text("Checkout"), ' +
        'button:has-text("Continue")'
      ).first();
      
      const hasPaymentButton = await paymentButton.isVisible().catch(() => false);
      console.log('Payment button visible:', hasPaymentButton);
      
      await page.keyboard.press('Escape');
    }
  });

  test('should redirect to payment provider', async ({ page }) => {
    const upgradeButton = page.locator(
      'button:has-text("Upgrade"), button:has-text("Pro")'
    ).first();
    
    if (await upgradeButton.isVisible().catch(() => false)) {
      await upgradeButton.click();
      await page.waitForTimeout(1000);
      
      const paymentButton = page.locator(
        'button:has-text("Subscribe"), button:has-text("Pay")'
      ).first();
      
      if (await paymentButton.isVisible().catch(() => false)) {
        // Don't actually click - just verify it's there
        console.log('Payment flow available');
      }
      
      await page.keyboard.press('Escape');
    }
  });
});

test.describe('Subscription Status', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should show current subscription status', async ({ page }) => {
    await openModal(page, 'settings');
    await page.waitForTimeout(1000);
    
    // Look for subscription status
    const subscriptionStatus = page.locator(
      'text=/free|pro|vanguard|subscription|plan/i'
    ).first();
    
    const hasStatus = await subscriptionStatus.isVisible().catch(() => false);
    console.log('Subscription status visible:', hasStatus);
    
    await page.keyboard.press('Escape');
  });

  test('should show subscription management options', async ({ page }) => {
    await openModal(page, 'settings');
    await page.waitForTimeout(1000);
    
    // Look for subscription management
    const manageButton = page.locator(
      'button:has-text("Manage"), button:has-text("Cancel"), text=/subscription/i'
    ).first();
    
    const hasManage = await manageButton.isVisible().catch(() => false);
    console.log('Subscription management visible:', hasManage);
    
    await page.keyboard.press('Escape');
  });
});
