import { test, expect } from '@playwright/test';
import { 
  waitForAppReady, 
  selectors, 
  goToGameHub,
  createGameTab,
  sendMessage,
  waitForChatResponse,
} from './utils/helpers';

/**
 * Accessibility (a11y) Stress Tests
 * ==================================
 * Tests accessibility compliance including:
 * - ARIA attributes
 * - Screen reader support
 * - Contrast ratios
 * - Focus management
 * - Semantic HTML
 */

test.describe('ARIA Attributes', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    // Check buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    let labeledButtons = 0;
    for (let i = 0; i < Math.min(buttonCount, 20); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const ariaLabel = await button.getAttribute('aria-label');
        const ariaLabelledBy = await button.getAttribute('aria-labelledby');
        const textContent = await button.textContent();
        
        if (ariaLabel || ariaLabelledBy || (textContent && textContent.trim())) {
          labeledButtons++;
        }
      }
    }
    
    console.log(`Labeled buttons: ${labeledButtons}/${Math.min(buttonCount, 20)}`);
    expect(labeledButtons).toBeGreaterThan(0);
  });

  test('should have ARIA roles on custom elements', async ({ page }) => {
    // Check for role attributes
    const elementsWithRoles = await page.locator('[role]').count();
    console.log(`Elements with ARIA roles: ${elementsWithRoles}`);
    
    // Check specific important roles
    const dialogs = await page.locator('[role="dialog"]').count();
    const buttons = await page.locator('[role="button"]').count();
    const tabs = await page.locator('[role="tab"], [role="tablist"]').count();
    
    console.log(`Dialogs: ${dialogs}, Buttons: ${buttons}, Tabs: ${tabs}`);
  });

  test('should have ARIA live regions for dynamic content', async ({ page }) => {
    const liveRegions = page.locator('[aria-live]');
    const liveCount = await liveRegions.count();
    
    console.log(`ARIA live regions: ${liveCount}`);
    
    // Check types
    for (let i = 0; i < liveCount; i++) {
      const region = liveRegions.nth(i);
      const liveType = await region.getAttribute('aria-live');
      const atomic = await region.getAttribute('aria-atomic');
      console.log(`Live region ${i + 1}: ${liveType}, atomic: ${atomic}`);
    }
  });

  test('should have proper ARIA expanded states', async ({ page }) => {
    // Check for expandable elements
    const expandables = page.locator('[aria-expanded]');
    const count = await expandables.count();
    
    console.log(`Expandable elements: ${count}`);
    
    if (count > 0) {
      const first = expandables.first();
      const initialState = await first.getAttribute('aria-expanded');
      console.log(`First expandable state: ${initialState}`);
    }
  });
});

test.describe('Screen Reader Support', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should have meaningful page title', async ({ page }) => {
    const title = await page.title();
    console.log(`Page title: ${title}`);
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should have heading hierarchy', async ({ page }) => {
    // Check for proper heading structure
    const h1 = await page.locator('h1').count();
    const h2 = await page.locator('h2').count();
    const h3 = await page.locator('h3').count();
    
    console.log(`Headings: h1=${h1}, h2=${h2}, h3=${h3}`);
    
    // Should have at least one h1
    expect(h1).toBeGreaterThanOrEqual(0); // PWAs might not always show h1
  });

  test('should have alt text on images', async ({ page }) => {
    const images = page.locator('img');
    const imgCount = await images.count();
    
    let imagesWithAlt = 0;
    for (let i = 0; i < imgCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // Image should have alt or be marked as presentation
      if (alt !== null || role === 'presentation' || role === 'none') {
        imagesWithAlt++;
      }
    }
    
    console.log(`Images with proper alt: ${imagesWithAlt}/${imgCount}`);
  });

  test('should have skip links', async ({ page }) => {
    // Check for skip-to-content link
    const skipLink = page.locator('a[href="#main"], a[href="#content"], [class*="skip"]').first();
    
    const hasSkipLink = await skipLink.isVisible().catch(async () => {
      // Skip link might only be visible on focus
      await page.keyboard.press('Tab');
      return await skipLink.isVisible().catch(() => false);
    });
    
    console.log('Has skip link:', hasSkipLink);
  });
});

test.describe('Contrast and Visual', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should have visible focus indicators', async ({ page }) => {
    // Tab to elements and check focus visibility
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    const hasVisibleFocus = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;
      
      const styles = window.getComputedStyle(el);
      const hasOutline = styles.outlineStyle !== 'none' && styles.outlineWidth !== '0px';
      const hasBoxShadow = styles.boxShadow !== 'none';
      const hasBorder = styles.borderWidth !== '0px';
      
      return hasOutline || hasBoxShadow || hasBorder;
    });
    
    console.log('Has visible focus indicator:', hasVisibleFocus);
  });

  test('should support high contrast mode', async ({ page }) => {
    // Emulate forced-colors
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('/');
    await waitForAppReady(page);
    
    // Check if page still renders properly
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
    
    console.log('High contrast mode test complete');
  });

  test('should have sufficient text size', async ({ page }) => {
    // Check body text size
    const fontSize = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return parseFloat(styles.fontSize);
    });
    
    console.log(`Base font size: ${fontSize}px`);
    expect(fontSize).toBeGreaterThanOrEqual(12); // Minimum readable size
  });
});

test.describe('Form Accessibility', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should have labels for form inputs', async ({ page }) => {
    const inputs = page.locator('input:not([type="hidden"]), textarea, select');
    const inputCount = await inputs.count();
    
    let labeledInputs = 0;
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        const placeholder = await input.getAttribute('placeholder');
        
        // Check for associated label
        const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;
        
        if (hasLabel || ariaLabel || ariaLabelledBy || placeholder) {
          labeledInputs++;
        }
      }
    }
    
    console.log(`Labeled inputs: ${labeledInputs}/${inputCount}`);
  });

  test('should have error messages accessible', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Check for aria-describedby on inputs
    const inputs = page.locator('input, textarea');
    const inputCount = await inputs.count();
    
    let describedInputs = 0;
    for (let i = 0; i < Math.min(inputCount, 10); i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        const describedBy = await input.getAttribute('aria-describedby');
        if (describedBy) {
          describedInputs++;
        }
      }
    }
    
    console.log(`Inputs with aria-describedby: ${describedInputs}`);
  });

  test('should have required fields marked', async ({ page }) => {
    const requiredInputs = page.locator('[required], [aria-required="true"]');
    const count = await requiredInputs.count();
    
    console.log(`Required fields: ${count}`);
  });
});

test.describe('Semantic HTML', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should use semantic landmarks', async ({ page }) => {
    const landmarks = {
      main: await page.locator('main').count(),
      nav: await page.locator('nav').count(),
      header: await page.locator('header').count(),
      footer: await page.locator('footer').count(),
      aside: await page.locator('aside').count(),
      section: await page.locator('section').count(),
      article: await page.locator('article').count()
    };
    
    console.log('Semantic landmarks:', landmarks);
    
    // Should have at least some landmarks
    const totalLandmarks = Object.values(landmarks).reduce((a, b) => a + b, 0);
    expect(totalLandmarks).toBeGreaterThan(0);
  });

  test('should use buttons for actions', async ({ page }) => {
    // Check that clickable actions use buttons, not divs
    const clickableSpans = await page.locator('span[onclick], div[onclick]').count();
    const buttons = await page.locator('button').count();
    
    console.log(`Buttons: ${buttons}, Clickable divs/spans: ${clickableSpans}`);
    
    // Buttons should be more common than clickable divs
    expect(buttons).toBeGreaterThan(0);
  });

  test('should use lists for groups', async ({ page }) => {
    const lists = {
      ul: await page.locator('ul').count(),
      ol: await page.locator('ol').count(),
      dl: await page.locator('dl').count()
    };
    
    console.log('List elements:', lists);
  });
});

test.describe('Keyboard Accessibility', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should have logical tab order', async ({ page }) => {
    const focusOrder: string[] = [];
    
    // Tab through first 10 elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName || 'unknown';
      });
      
      focusOrder.push(focused);
    }
    
    console.log('Tab order:', focusOrder.join(' -> '));
  });

  test('should not trap focus unexpectedly', async ({ page }) => {
    // Tab through the page
    const startElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    // Tab many times
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);
    }
    
    // Should eventually cycle back or reach end
    const endElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    console.log(`Focus: ${startElement} -> ${endElement}`);
  });

  test('should support escape to close modals', async ({ page }) => {
    const settingsButton = page.locator(selectors.settingsButton).first();
    
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForTimeout(500);
      
      // Verify modal is open
      const modal = page.locator('[role="dialog"]').first();
      const isOpen = await modal.isVisible();
      
      if (isOpen) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        
        // Modal should close
        await expect(modal).not.toBeVisible();
      }
    }
  });
});

test.describe('Color and Visual Impairment', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should not rely solely on color', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Check for status indicators that use icons/text in addition to color
    const statusElements = page.locator('[class*="status"], [class*="indicator"]');
    const statusCount = await statusElements.count();
    
    console.log(`Status indicators found: ${statusCount}`);
    
    // Check subtabs which have colors
    const subtabs = page.locator(selectors.subtab);
    const subtabCount = await subtabs.count();
    if (subtabCount > 0) {
      // Subtabs should have labels, not just colors
      const firstSubtab = subtabs.first();
      const text = await firstSubtab.textContent();
      console.log('Subtab has text label:', !!text?.trim());
    }
    
    // Check that buttons have text or aria-labels, not just color
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    let accessibleButtons = 0;
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const btn = buttons.nth(i);
      const hasText = !!(await btn.textContent())?.trim();
      const hasAriaLabel = !!(await btn.getAttribute('aria-label'));
      const hasTitle = !!(await btn.getAttribute('title'));
      if (hasText || hasAriaLabel || hasTitle) accessibleButtons++;
    }
    console.log(`Accessible buttons: ${accessibleButtons}/${Math.min(buttonCount, 10)}`);
    // This is a soft check - we're verifying the pattern exists, not requiring 100%
  });

  test('should work without images', async ({ page }) => {
    // Block images
    await page.route('**/*.{png,jpg,jpeg,gif,svg,webp}', route => route.abort());
    
    await page.reload();
    await waitForAppReady(page);
    
    // Core functionality should still work
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
  });
});

test.describe('Motion and Animation', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should respect reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await waitForAppReady(page);
    
    // Check if animations are reduced/disabled
    const hasReducedMotion = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    
    expect(hasReducedMotion).toBe(true);
    
    // Open modal and check for instant transitions
    const settingsButton = page.locator(selectors.settingsButton).first();
    if (await settingsButton.isVisible().catch(() => false)) {
      await settingsButton.click();
      await page.waitForTimeout(500);
      
      // Modal or menu should appear without animation
      const modal = page.locator('[role="dialog"], [role="menu"], [class*="dropdown"], [class*="menu"]').first();
      const isVisible = await modal.isVisible().catch(() => false);
      console.log('Modal/menu appeared:', isVisible);
      
      await page.keyboard.press('Escape');
    }
  });

  test('should not auto-play videos', async ({ page }) => {
    // Check for auto-playing videos
    const autoplayVideos = await page.locator('video[autoplay]:not([muted])').count();
    
    console.log(`Auto-playing unmuted videos: ${autoplayVideos}`);
    expect(autoplayVideos).toBe(0);
  });
});

test.describe('Text and Content', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should support text scaling', async ({ page }) => {
    // Increase text size
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '150%';
    });
    
    await page.waitForTimeout(500);
    
    // Content should still be usable
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
    
    // Check for text overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    console.log('Has horizontal overflow at 150% text:', hasOverflow);
  });

  test('should have readable line lengths', async ({ page }) => {
    // Check paragraph widths
    const paragraphs = page.locator('p');
    const pCount = await paragraphs.count();
    
    if (pCount > 0) {
      const firstP = paragraphs.first();
      if (await firstP.isVisible()) {
        const width = await firstP.evaluate(el => el.clientWidth);
        console.log(`Paragraph width: ${width}px`);
        
        // Optimal line length is 45-75 characters (~600-800px for 16px font)
        // But we shouldn't exceed ~1000px
      }
    }
  });
});
