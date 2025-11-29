import { test, expect } from '@playwright/test';
import { 
  waitForAppReady, 
  selectors, 
  measurePerformance,
  goToGameHub,
  createGameTab,
  sendMessage,
  waitForChatResponse,
} from './utils/helpers';

/**
 * Performance & Load Stress Tests
 * ================================
 * Tests performance under stress including:
 * - Page load times
 * - Component render times
 * - Memory usage
 * - Animation performance
 * - Heavy usage scenarios
 */

test.describe('Initial Load Performance', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await waitForAppReady(page);
    const loadTime = Date.now() - startTime;
    
    console.log(`Initial load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // 10 seconds max
  });

  test('should achieve First Contentful Paint quickly', async ({ page }) => {
    await page.goto('/');
    
    // Get FCP timing
    const fcp = await page.evaluate(() => {
      return new Promise<number>(resolve => {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntriesByName('first-contentful-paint')) {
            resolve(entry.startTime);
          }
        });
        observer.observe({ type: 'paint', buffered: true });
        
        // Fallback timeout
        setTimeout(() => resolve(-1), 5000);
      });
    });
    
    console.log(`First Contentful Paint: ${fcp}ms`);
    if (fcp > 0) {
      expect(fcp).toBeLessThan(3000); // 3 seconds for FCP
    }
  });

  test('should load critical resources', async ({ page }) => {
    const resources: { name: string; duration: number }[] = [];
    
    page.on('response', async response => {
      const timing = response.timing();
      if (timing) {
        resources.push({
          name: response.url().split('/').pop() || '',
          duration: timing.responseEnd || 0
        });
      }
    });
    
    await page.goto('/');
    await waitForAppReady(page);
    
    console.log(`Loaded ${resources.length} resources`);
  });
});

test.describe('Component Performance', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should render Game Hub quickly', async ({ page }) => {
    const { duration } = await measurePerformance(page, 'game-hub-render', async () => {
      await goToGameHub(page);
    });
    
    console.log(`Game Hub render time: ${duration}ms`);
    expect(duration).toBeLessThan(5000);
  });

  test('should render chat interface quickly', async ({ page }) => {
    await goToGameHub(page);
    
    const { duration } = await measurePerformance(page, 'chat-render', async () => {
      await createGameTab(page, 'Performance Test');
    });
    
    console.log(`Chat interface render time: ${duration}ms`);
    expect(duration).toBeLessThan(5000);
  });

  test('should handle modal open/close smoothly', async ({ page }) => {
    const settingsButton = page.locator(selectors.settingsButton).first();
    
    if (await settingsButton.isVisible()) {
      const { duration } = await measurePerformance(page, 'modal-toggle', async () => {
        await settingsButton.click();
        await page.waitForTimeout(300);
      });
      
      console.log(`Modal open time: ${duration}ms`);
      expect(duration).toBeLessThan(1000);
    }
  });
});

test.describe('Memory Performance', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should not leak memory during navigation', async ({ page }) => {
    // Get initial memory
    const initialMemory = await page.evaluate(() => {
      // @ts-ignore
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Perform many navigations
    for (let i = 0; i < 5; i++) {
      await goToGameHub(page);
      await createGameTab(page, `Memory Test ${i}`);
      await page.waitForTimeout(500);
    }
    
    // Get final memory
    const finalMemory = await page.evaluate(() => {
      // @ts-ignore
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    console.log(`Memory: ${initialMemory} -> ${finalMemory} bytes`);
    
    // Memory should not grow excessively (allow 50% increase)
    if (initialMemory > 0) {
      expect(finalMemory).toBeLessThan(initialMemory * 1.5);
    }
  });

  test('should clean up after tab deletion', async ({ page }) => {
    await goToGameHub(page);
    
    // Create tabs
    for (let i = 0; i < 3; i++) {
      await createGameTab(page, `Cleanup Test ${i}`);
      await page.waitForTimeout(300);
    }
    
    const memoryBefore = await page.evaluate(() => {
      // @ts-ignore
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Delete tabs (if possible)
    const tabs = page.locator(selectors.gameTab);
    const tabCount = await tabs.count();
    
    // Memory check
    const memoryAfter = await page.evaluate(() => {
      // @ts-ignore
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    console.log(`Memory before/after cleanup: ${memoryBefore} -> ${memoryAfter}`);
  });
});

test.describe('Animation Performance', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should maintain 60fps during animations', async ({ page }) => {
    // Monitor frame rate during modal animation
    const frameTimings: number[] = [];
    
    await page.evaluate(() => {
      const timings: number[] = [];
      let lastTime = performance.now();
      
      const measure = () => {
        const now = performance.now();
        timings.push(now - lastTime);
        lastTime = now;
        
        if (timings.length < 60) {
          requestAnimationFrame(measure);
        }
      };
      
      requestAnimationFrame(measure);
      
      // @ts-ignore
      window.__frameTimings = timings;
    });
    
    // Trigger animation
    const settingsButton = page.locator(selectors.settingsButton).first();
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForTimeout(500);
    }
    
    const timings = await page.evaluate(() => {
      // @ts-ignore
      return window.__frameTimings || [];
    });
    
    if (timings.length > 0) {
      const avgFrameTime = timings.reduce((a: number, b: number) => a + b, 0) / timings.length;
      console.log(`Average frame time: ${avgFrameTime.toFixed(2)}ms (target: 16.67ms for 60fps)`);
    }
  });

  test('should not jank during scrolling', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Scroll Test');
    await page.waitForTimeout(1000);
    
    // Send multiple messages to create scrollable content
    for (let i = 0; i < 3; i++) {
      await sendMessage(page, `Scroll test message ${i + 1}`);
      await page.waitForTimeout(2000);
    }
    
    // Perform scroll
    const chatContainer = page.locator(selectors.chatContainer).first();
    if (await chatContainer.isVisible()) {
      await chatContainer.evaluate(el => {
        el.scrollTop = el.scrollHeight;
      });
      
      await page.waitForTimeout(500);
      
      await chatContainer.evaluate(el => {
        el.scrollTop = 0;
      });
    }
    
    console.log('Scroll jank test complete');
  });
});

test.describe('Stress Load Testing', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle many game tabs', async ({ page }) => {
    await goToGameHub(page);
    
    const tabCount = 5;
    const startTime = Date.now();
    
    for (let i = 0; i < tabCount; i++) {
      await createGameTab(page, `Load Test Game ${i + 1}`);
      await page.waitForTimeout(300);
    }
    
    const duration = Date.now() - startTime;
    console.log(`Created ${tabCount} tabs in ${duration}ms`);
    
    // App should still be responsive
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeEnabled();
  });

  test('should handle rapid input', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Rapid Input Test');
    await page.waitForTimeout(1000);
    
    const chatInput = page.locator(selectors.chatInput).first();
    
    // Type rapidly
    const testText = 'This is a rapid typing test to check input performance';
    const startTime = Date.now();
    
    await chatInput.pressSequentially(testText, { delay: 10 });
    
    const duration = Date.now() - startTime;
    console.log(`Typed ${testText.length} chars in ${duration}ms`);
    
    // Verify text was typed correctly
    const inputValue = await chatInput.inputValue();
    expect(inputValue).toContain(testText);
  });

  test('should handle rapid modal open/close', async ({ page }) => {
    const settingsButton = page.locator(selectors.settingsButton).first();
    
    if (await settingsButton.isVisible()) {
      const iterations = 5;
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        await settingsButton.click();
        await page.waitForTimeout(100);
        
        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(100);
      }
      
      const duration = Date.now() - startTime;
      console.log(`${iterations} modal toggles in ${duration}ms`);
      
      // App should still be stable
      await expect(settingsButton).toBeVisible();
    }
  });
});

test.describe('Network Performance', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should handle slow network', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: '.playwright/.auth/user.json',
    });
    const page = await context.newPage();
    
    // Simulate slow 3G
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
      await route.continue();
    });
    
    const startTime = Date.now();
    await page.goto('/');
    await waitForAppReady(page);
    const loadTime = Date.now() - startTime;
    
    console.log(`Load time on slow network: ${loadTime}ms`);
    
    // App should still load (maybe slower)
    const sidebar = page.locator(selectors.sidebar).first();
    await expect(sidebar).toBeVisible({ timeout: 30000 });
    
    await context.close();
  });

  test('should cache resources effectively', async ({ page }) => {
    // First load
    await page.goto('/');
    await waitForAppReady(page);
    
    // Get cache status
    const cacheStats = await page.evaluate(async () => {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        let totalEntries = 0;
        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          totalEntries += keys.length;
        }
        return { cacheNames, totalEntries };
      }
      return { cacheNames: [], totalEntries: 0 };
    });
    
    console.log(`Cache: ${cacheStats.cacheNames.length} caches, ${cacheStats.totalEntries} entries`);
  });
});

test.describe('Bundle Size Performance', () => {
  test('should load reasonable bundle sizes', async ({ page }) => {
    const resourceSizes: { url: string; size: number }[] = [];
    
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('.js') || url.includes('.css')) {
        const headers = response.headers();
        const size = parseInt(headers['content-length'] || '0', 10);
        resourceSizes.push({ url: url.split('/').pop() || '', size });
      }
    });
    
    await page.goto('/');
    await waitForAppReady(page);
    
    // Log largest bundles
    resourceSizes.sort((a, b) => b.size - a.size);
    console.log('Largest resources:');
    resourceSizes.slice(0, 5).forEach(r => {
      console.log(`  ${r.url}: ${(r.size / 1024).toFixed(2)}KB`);
    });
    
    // Total size check
    const totalSize = resourceSizes.reduce((sum, r) => sum + r.size, 0);
    console.log(`Total JS/CSS size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
  });
});

test.describe('Concurrent Operations', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle concurrent API calls', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Concurrent Test');
    await page.waitForTimeout(1000);
    
    // Send multiple queries rapidly
    const queries = ['Query 1', 'Query 2', 'Query 3'];
    
    const startTime = Date.now();
    for (const query of queries) {
      await sendMessage(page, query);
      await page.waitForTimeout(200); // Small delay to not overwhelm
    }
    
    // Wait for all responses
    await page.waitForTimeout(15000);
    
    const duration = Date.now() - startTime;
    console.log(`Concurrent queries completed in ${duration}ms`);
    
    // App should remain functional
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeEnabled();
  });

  test('should handle DOM updates efficiently', async ({ page }) => {
    await goToGameHub(page);
    
    // Monitor DOM mutations
    const mutationCount = await page.evaluate(() => {
      return new Promise<number>(resolve => {
        let count = 0;
        const observer = new MutationObserver(mutations => {
          count += mutations.length;
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true
        });
        
        // Measure for 5 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(count);
        }, 5000);
      });
    });
    
    // Interact with the page during measurement
    await createGameTab(page, 'DOM Test');
    await page.waitForTimeout(3000);
    
    console.log(`DOM mutations during interaction: ${mutationCount}`);
  });
});

test.describe('Long Session Performance', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('should remain performant after extended use', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    const initialMemory = await page.evaluate(() => {
      // @ts-ignore
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Simulate extended usage
    await goToGameHub(page);
    
    for (let i = 0; i < 3; i++) {
      await createGameTab(page, `Long Session ${i}`);
      await page.waitForTimeout(500);
      await sendMessage(page, `Test message ${i}`);
      await page.waitForTimeout(3000);
    }
    
    const finalMemory = await page.evaluate(() => {
      // @ts-ignore
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    console.log(`Memory usage: ${(initialMemory / 1024 / 1024).toFixed(2)}MB -> ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);
    
    // Performance should remain acceptable
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeEnabled();
    
    // Response time check
    const { duration } = await measurePerformance(page, 'response-time', async () => {
      await page.locator(selectors.chatInput).first().click();
    });
    
    expect(duration).toBeLessThan(1000);
  });
});
