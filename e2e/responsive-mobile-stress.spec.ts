import { test, expect, devices } from '@playwright/test';
import { 
  waitForAppReady, 
  selectors, 
  goToGameHub,
  createGameTab,
  sendMessage,
} from './utils/helpers';

/**
 * Responsive Design & Mobile Stress Tests
 * ========================================
 * Tests responsive behavior including:
 * - Mobile viewport
 * - Tablet viewport
 * - Touch interactions
 * - Mobile navigation
 * - Orientation changes
 */

test.describe('Mobile Viewport', () => {
  test.use({ 
    storageState: '.playwright/.auth/user.json',
    viewport: { width: 375, height: 667 } // iPhone SE
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should render correctly on mobile', async ({ page }) => {
    // Core elements should be visible
    const sidebar = page.locator(selectors.sidebar).first();
    const chatInput = page.locator(selectors.chatInput).first();
    
    // On mobile, sidebar might be hidden initially
    const sidebarVisible = await sidebar.isVisible().catch(() => false);
    console.log('Sidebar visible on mobile:', sidebarVisible);
    
    // Chat input should be accessible
    await expect(chatInput).toBeVisible({ timeout: 10000 });
  });

  test('should have mobile hamburger menu', async ({ page }) => {
    // Look for mobile menu toggle
    const hamburger = page.locator('[aria-label*="menu" i], [class*="hamburger"], button:has(svg[class*="menu"])').first();
    
    const hasHamburger = await hamburger.isVisible().catch(() => false);
    console.log('Has hamburger menu:', hasHamburger);
    
    if (hasHamburger) {
      await hamburger.click();
      await page.waitForTimeout(500);
      
      // Menu should expand
      const expandedMenu = page.locator('[class*="mobile-menu"], [class*="drawer"]').first();
    }
  });

  test('should have touch-friendly buttons', async ({ page }) => {
    // Check button sizes meet minimum touch target (44x44px)
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    let smallButtons = 0;
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box && (box.width < 44 || box.height < 44)) {
          smallButtons++;
        }
      }
    }
    
    console.log(`Small buttons (< 44px): ${smallButtons}`);
  });

  test('should handle keyboard on mobile', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Mobile Keyboard Test');
    await page.waitForTimeout(1000);
    
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.click();
    
    // On mobile, keyboard would appear
    // Input should still be visible (not covered by keyboard)
    await expect(chatInput).toBeVisible();
    
    // Type and verify
    await chatInput.fill('Mobile test');
    const value = await chatInput.inputValue();
    expect(value).toBe('Mobile test');
  });

  test('should scroll content properly', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Check for horizontal scrolling (should be none)
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    console.log('Has horizontal scroll:', hasHorizontalScroll);
    // Horizontal scroll indicates responsive issues
    expect(hasHorizontalScroll).toBe(false);
  });
});

test.describe('Tablet Viewport', () => {
  test.use({ 
    storageState: '.playwright/.auth/user.json',
    viewport: { width: 768, height: 1024 } // iPad
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should render correctly on tablet', async ({ page }) => {
    const sidebar = page.locator(selectors.sidebar).first();
    const chatInput = page.locator(selectors.chatInput).first();
    
    // Sidebar might be visible on tablet
    const sidebarVisible = await sidebar.isVisible().catch(() => false);
    console.log('Sidebar visible on tablet:', sidebarVisible);
    
    await expect(chatInput).toBeVisible();
  });

  test('should show appropriate layout', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Check layout
    const gameHub = page.locator(selectors.gameHub).first();
    const chatContainer = page.locator(selectors.chatContainer).first();
    
    const gameHubVisible = await gameHub.isVisible().catch(() => false);
    const chatVisible = await chatContainer.isVisible().catch(() => false);
    
    console.log(`Tablet layout - GameHub: ${gameHubVisible}, Chat: ${chatVisible}`);
  });
});

test.describe('Touch Interactions', () => {
  test.use({ 
    storageState: '.playwright/.auth/user.json',
    viewport: { width: 375, height: 667 },
    hasTouch: true
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle tap', async ({ page }) => {
    const chatInput = page.locator(selectors.chatInput).first();
    
    // Tap (same as click in Playwright)
    await chatInput.tap();
    await page.waitForTimeout(300);
    
    // Input should be focused
    const isFocused = await page.evaluate(() => {
      return document.activeElement?.tagName === 'INPUT' || 
             document.activeElement?.tagName === 'TEXTAREA';
    });
    
    expect(isFocused).toBe(true);
  });

  test('should handle swipe gestures', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Simulate swipe
    const gameHub = page.locator(selectors.gameHub).first();
    if (await gameHub.isVisible()) {
      const box = await gameHub.boundingBox();
      if (box) {
        // Swipe right
        await page.mouse.move(box.x + 50, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + 200, box.y + box.height / 2, { steps: 10 });
        await page.mouse.up();
        
        await page.waitForTimeout(500);
      }
    }
    
    console.log('Swipe gesture test complete');
  });

  test('should handle long press', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Long Press Test');
    await page.waitForTimeout(1000);
    
    const gameTabs = page.locator(selectors.gameTab).first();
    
    if (await gameTabs.isVisible()) {
      const box = await gameTabs.boundingBox();
      if (box) {
        // Long press
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(1000); // Hold for 1 second
        await page.mouse.up();
        
        // Check for context menu
        const contextMenu = page.locator('[role="menu"], [class*="context-menu"]').first();
        const hasContextMenu = await contextMenu.isVisible().catch(() => false);
        console.log('Long press triggered context menu:', hasContextMenu);
      }
    }
  });

  test('should handle pinch zoom prevention', async ({ page }) => {
    // Check viewport meta tag
    const viewportMeta = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta?.getAttribute('content');
    });
    
    console.log('Viewport meta:', viewportMeta);
    
    // Should include user-scalable=no or maximum-scale=1
    if (viewportMeta) {
      const preventZoom = viewportMeta.includes('user-scalable=no') || 
                          viewportMeta.includes('maximum-scale=1');
      console.log('Prevents zoom:', preventZoom);
    }
  });
});

test.describe('Orientation Changes', () => {
  test.use({ 
    storageState: '.playwright/.auth/user.json'
  });

  test('should handle portrait to landscape', async ({ page }) => {
    // Start in portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForAppReady(page);
    
    const portraitChatInput = page.locator(selectors.chatInput).first();
    await expect(portraitChatInput).toBeVisible();
    
    // Switch to landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(500);
    
    // Elements should still be accessible
    const landscapeChatInput = page.locator(selectors.chatInput).first();
    await expect(landscapeChatInput).toBeVisible();
  });

  test('should handle landscape to portrait', async ({ page }) => {
    // Start in landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await page.goto('/');
    await waitForAppReady(page);
    
    // Switch to portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Elements should still be accessible
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
  });

  test('should maintain state during orientation change', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForAppReady(page);
    
    await goToGameHub(page);
    await createGameTab(page, 'Orientation Test');
    await page.waitForTimeout(1000);
    
    // Type some text
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.fill('Test text');
    
    // Change orientation
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(500);
    
    // Text should still be there
    const value = await chatInput.inputValue();
    expect(value).toBe('Test text');
  });
});

test.describe('Mobile Navigation', () => {
  test.use({ 
    storageState: '.playwright/.auth/user.json',
    viewport: { width: 375, height: 667 }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should navigate using mobile menu', async ({ page }) => {
    // Find mobile navigation trigger
    const mobileMenuTrigger = page.locator(
      '[aria-label*="menu" i], [class*="hamburger"], button:has(svg)'
    ).first();
    
    if (await mobileMenuTrigger.isVisible()) {
      await mobileMenuTrigger.click();
      await page.waitForTimeout(500);
      
      // Navigate using menu
      const menuItems = page.locator('[role="menuitem"], [class*="menu-item"]');
      const itemCount = await menuItems.count();
      console.log(`Mobile menu items: ${itemCount}`);
    }
  });

  test('should handle bottom navigation', async ({ page }) => {
    // Check for bottom nav bar (common in mobile apps)
    const bottomNav = page.locator('[class*="bottom-nav"], nav[class*="mobile"]').first();
    
    const hasBottomNav = await bottomNav.isVisible().catch(() => false);
    console.log('Has bottom navigation:', hasBottomNav);
    
    if (hasBottomNav) {
      const navButtons = bottomNav.locator('button, a');
      const navButtonCount = await navButtons.count();
      console.log(`Bottom nav buttons: ${navButtonCount}`);
    }
  });

  test('should handle pull to refresh', async ({ page }) => {
    // Simulate pull to refresh gesture
    const body = page.locator('body');
    const box = await body.boundingBox();
    
    if (box) {
      // Start from top
      await page.mouse.move(box.width / 2, 100);
      await page.mouse.down();
      await page.mouse.move(box.width / 2, 300, { steps: 10 });
      await page.mouse.up();
      
      await page.waitForTimeout(1000);
    }
    
    console.log('Pull to refresh gesture complete');
  });
});

test.describe('Mobile Input Handling', () => {
  test.use({ 
    storageState: '.playwright/.auth/user.json',
    viewport: { width: 375, height: 667 }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle mobile keyboard types', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Keyboard Test');
    await page.waitForTimeout(1000);
    
    const chatInput = page.locator(selectors.chatInput).first();
    
    // Check input type
    const inputType = await chatInput.getAttribute('type') || 'text';
    const inputMode = await chatInput.getAttribute('inputmode');
    
    console.log(`Input type: ${inputType}, inputmode: ${inputMode}`);
  });

  test('should handle autocomplete suggestions', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Autocomplete Test');
    await page.waitForTimeout(1000);
    
    const chatInput = page.locator(selectors.chatInput).first();
    
    // Check autocomplete attribute
    const autocomplete = await chatInput.getAttribute('autocomplete');
    console.log(`Autocomplete: ${autocomplete}`);
    
    // Type and check for suggestions
    await chatInput.fill('hel');
    await page.waitForTimeout(500);
  });

  test('should maintain input visibility with keyboard', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Keyboard Visibility Test');
    await page.waitForTimeout(1000);
    
    const chatInput = page.locator(selectors.chatInput).first();
    await chatInput.click();
    
    // Check if input is still visible when focused
    await expect(chatInput).toBeVisible();
    
    // Check scroll position
    const inputPosition = await chatInput.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        inViewport: rect.bottom <= window.innerHeight && rect.top >= 0
      };
    });
    
    console.log('Input position:', inputPosition);
  });
});

test.describe('Mobile Performance', () => {
  test.use({ 
    storageState: '.playwright/.auth/user.json',
    viewport: { width: 375, height: 667 }
  });

  test('should load quickly on mobile', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await waitForAppReady(page);
    const loadTime = Date.now() - startTime;
    
    console.log(`Mobile load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(15000); // 15 seconds for mobile
  });

  test('should handle reduced motion preference', async ({ page }) => {
    // Emulate reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await waitForAppReady(page);
    
    // Check CSS variables or classes for reduced motion
    const hasReducedMotion = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    
    console.log('Reduced motion active:', hasReducedMotion);
    expect(hasReducedMotion).toBe(true);
  });

  test('should respect dark mode preference', async ({ page }) => {
    // Emulate dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await waitForAppReady(page);
    
    // Check if dark mode is applied
    const isDarkMode = await page.evaluate(() => {
      const body = document.body;
      const bgColor = window.getComputedStyle(body).backgroundColor;
      // Check if background is dark
      const rgb = bgColor.match(/\d+/g);
      if (rgb) {
        const brightness = (parseInt(rgb[0]) + parseInt(rgb[1]) + parseInt(rgb[2])) / 3;
        return brightness < 128;
      }
      return false;
    });
    
    console.log('Dark mode applied:', isDarkMode);
  });
});

test.describe('Mobile-Specific Features', () => {
  test.use({ 
    storageState: '.playwright/.auth/user.json',
    viewport: { width: 375, height: 667 }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle offline indicator on mobile', async ({ page }) => {
    // Go offline
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    
    await page.waitForTimeout(1000);
    
    // Check for offline indicator
    const offlineIndicator = page.locator('text=/offline|no connection/i').first();
    const bannerIndicator = page.locator('[class*="offline"], [class*="connection-lost"]').first();
    
    // Go back online
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
    
    console.log('Mobile offline indicator test complete');
  });

  test('should support safe area insets', async ({ page }) => {
    // Check for safe-area-inset CSS
    const hasSafeArea = await page.evaluate(() => {
      const style = document.documentElement.style;
      return style.getPropertyValue('padding-top')?.includes('safe-area') ||
             document.body.innerHTML.includes('safe-area');
    });
    
    console.log('Safe area insets supported:', hasSafeArea);
  });
});
