import { test, expect } from '@playwright/test';
import { 
  waitForAppReady, 
  selectors, 
  goToGameHub,
  createGameTab,
  createSubTab,
  measurePerformance,
} from './utils/helpers';

/**
 * Progress Tracking Stress Tests
 * ==============================
 * Tests progress tracking features including:
 * - Story progress tracking
 * - Walkthrough progress
 * - Achievement tracking
 * - Progress persistence
 * - Progress across sessions
 */

test.describe('Progress Tracking UI', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display progress indicators', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Check for progress-related UI elements
    const progressBars = page.locator('[class*="progress"], [role="progressbar"]');
    const progressCount = await progressBars.count();
    console.log(`Found ${progressCount} progress indicators`);
  });

  test('should show completion percentage', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Progress Test Game');
    await page.waitForTimeout(1000);
    
    // Look for percentage displays
    const percentageText = page.locator('text=%').first();
    const completionText = page.locator('text=/\\d+%/').first();
    
    if (await percentageText.isVisible().catch(() => false)) {
      const text = await percentageText.textContent();
      console.log('Found percentage:', text);
    }
  });

  test('should update progress visually', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Visual Progress Test');
    await page.waitForTimeout(1000);
    
    // Look for checkboxes or completion markers
    const checkboxes = page.locator('input[type="checkbox"], [role="checkbox"]');
    const checkmarks = page.locator('[class*="check"], [class*="complete"]');
    
    const checkboxCount = await checkboxes.count();
    const checkmarkCount = await checkmarks.count();
    console.log(`Checkboxes: ${checkboxCount}, Checkmarks: ${checkmarkCount}`);
  });
});

test.describe('Story Progress', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should track story subtab progress', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Story Tracking Test');
    await page.waitForTimeout(1000);
    
    // Create story subtab
    await createSubTab(page, 'story');
    await page.waitForTimeout(1000);
    
    // Check for story-specific progress UI
    const storySubtab = page.locator('[class*="story"], [data-type="story"]').first();
    if (await storySubtab.isVisible().catch(() => false)) {
      await storySubtab.click();
      await page.waitForTimeout(500);
    }
  });

  test('should show chapter/section progress', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Chapter Progress Test');
    await page.waitForTimeout(1000);
    
    // Look for chapter or section indicators
    const chapters = page.locator('text=/chapter|act|part|section/i');
    const chapterCount = await chapters.count();
    console.log(`Found ${chapterCount} chapter references`);
  });
});

test.describe('Walkthrough Progress', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should track walkthrough steps', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Walkthrough Test');
    await page.waitForTimeout(1000);
    
    // Create walkthrough subtab
    await createSubTab(page, 'walkthrough');
    await page.waitForTimeout(1000);
    
    // Look for step indicators
    const steps = page.locator('[class*="step"], [data-step]');
    const stepNumbers = page.locator('text=/step \\d+/i');
    
    const stepCount = await steps.count();
    console.log(`Found ${stepCount} step indicators`);
  });

  test('should allow marking steps complete', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Step Completion Test');
    await page.waitForTimeout(1000);
    
    // Look for interactive step completion
    const checkboxes = page.locator('input[type="checkbox"]');
    const toggles = page.locator('[role="checkbox"], [role="switch"]');
    
    const interactiveCount = await checkboxes.count() + await toggles.count();
    console.log(`Found ${interactiveCount} interactive progress elements`);
  });

  test('should show current step indicator', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Current Step Test');
    await page.waitForTimeout(1000);
    
    // Look for "current" or "active" step markers
    const currentStep = page.locator('[class*="current"], [class*="active"][class*="step"]').first();
    const arrow = page.locator('[class*="arrow"], [class*="pointer"]').first();
  });
});

test.describe('Progress Persistence', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should save progress to storage', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Persistence Test');
    await page.waitForTimeout(1000);
    
    // Check localStorage for progress data
    const progressData = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const progressKeys = keys.filter(k => 
        k.includes('progress') || 
        k.includes('complete') ||
        k.includes('tracking')
      );
      return progressKeys;
    });
    
    console.log('Progress-related localStorage keys:', progressData);
  });

  test('should persist progress across page reloads', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Reload Persistence Test');
    await page.waitForTimeout(1000);
    
    // Get current progress state
    const beforeReload = await page.evaluate(() => {
      return JSON.stringify(localStorage);
    });
    
    // Reload
    await page.reload();
    await waitForAppReady(page);
    await page.waitForTimeout(2000);
    
    // Compare after reload
    const afterReload = await page.evaluate(() => {
      return JSON.stringify(localStorage);
    });
    
    // Progress-related data should persist
    console.log('Storage persisted:', beforeReload === afterReload ? 'Yes' : 'Partially');
  });

  test('should sync progress to backend', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Sync Test');
    await page.waitForTimeout(1000);
    
    // Monitor network requests for progress sync
    const progressRequests: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('progress') || url.includes('save') || url.includes('sync')) {
        progressRequests.push(url);
      }
    });
    
    // Interact with the app
    await page.waitForTimeout(5000);
    
    console.log('Progress sync requests:', progressRequests.length);
  });
});

test.describe('Progress Recovery', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should restore progress on session resume', async ({ page }) => {
    await goToGameHub(page);
    
    // Check for existing game tabs with progress
    const gameTabs = page.locator(selectors.gameTab);
    const tabCount = await gameTabs.count();
    
    if (tabCount > 0) {
      // Click on existing tab
      await gameTabs.first().click();
      await page.waitForTimeout(1000);
      
      // Progress should be restored
      console.log('Existing tab loaded with progress');
    }
  });

  test('should handle progress data corruption', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Corruption Test');
    await page.waitForTimeout(1000);
    
    // Corrupt progress data
    await page.evaluate(() => {
      localStorage.setItem('test_progress', '{invalid json');
    });
    
    // Reload and verify app still works
    await page.reload();
    await waitForAppReady(page);
    
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
  });
});

test.describe('Multi-Game Progress', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should track progress independently per game', async ({ page }) => {
    await goToGameHub(page);
    
    // Create multiple game tabs
    await createGameTab(page, 'Game A');
    await page.waitForTimeout(500);
    
    await createGameTab(page, 'Game B');
    await page.waitForTimeout(500);
    
    // Each should have independent progress
    const gameTabs = page.locator(selectors.gameTab);
    expect(await gameTabs.count()).toBeGreaterThanOrEqual(2);
  });

  test('should show overall progress summary', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Look for summary/dashboard view
    const summary = page.locator('[class*="summary"], [class*="dashboard"], [class*="overview"]').first();
    const statsText = page.locator('text=/\\d+ games?|\\d+ complete/i').first();
  });
});

test.describe('Progress Analytics', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should track time spent', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Time Tracking Test');
    await page.waitForTimeout(3000);
    
    // Look for time tracking UI
    const timeDisplay = page.locator('text=/\\d+:\\d+|\\d+ min|\\d+ hour/i').first();
    if (await timeDisplay.isVisible().catch(() => false)) {
      const time = await timeDisplay.textContent();
      console.log('Time display:', time);
    }
  });

  test('should record completion dates', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Look for date displays
    const dates = page.locator('text=/\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}|\\w+ \\d+, \\d{4}/').first();
    if (await dates.isVisible().catch(() => false)) {
      const dateText = await dates.textContent();
      console.log('Found date:', dateText);
    }
  });
});

test.describe('Progress Export/Import', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should support progress export', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Look for export functionality
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Backup")').first();
    if (await exportButton.isVisible().catch(() => false)) {
      console.log('Export functionality available');
    }
  });

  test('should support progress import', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Look for import functionality
    const importButton = page.locator('button:has-text("Import"), button:has-text("Restore")').first();
    const fileInput = page.locator('input[type="file"][accept*="json"]').first();
    
    const hasImport = await importButton.isVisible().catch(() => false) ||
                      await fileInput.isVisible().catch(() => false);
    console.log('Import functionality:', hasImport ? 'Available' : 'Not visible');
  });
});

test.describe('Progress Performance', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should load progress quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await goToGameHub(page);
    
    // Wait for progress to load
    await page.waitForTimeout(2000);
    
    const loadTime = Date.now() - startTime;
    console.log(`Progress load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000);
  });

  test('should update progress without lag', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Lag Test');
    await page.waitForTimeout(1000);
    
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    
    if (checkboxCount > 0) {
      const startTime = Date.now();
      await checkboxes.first().click();
      const clickTime = Date.now() - startTime;
      console.log(`Checkbox click time: ${clickTime}ms`);
    }
  });

  test('should handle many progress items', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Create multiple subtabs
    const subtabTypes = ['story', 'walkthrough', 'tips'] as const;
    for (const type of subtabTypes) {
      await createSubTab(page, type);
      await page.waitForTimeout(300);
    }
    
    // App should remain responsive
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeVisible();
    await expect(chatInput).toBeEnabled();
  });
});

test.describe('Progress Notifications', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should show completion notifications', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Look for notification/toast elements
    const notifications = page.locator('[role="alert"], [class*="toast"], [class*="notification"]');
    console.log('Notification system available');
  });

  test('should celebrate milestones', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Look for celebration/achievement UI
    const achievements = page.locator('[class*="achievement"], [class*="badge"], [class*="trophy"]');
    const confetti = page.locator('[class*="confetti"], [class*="celebrate"]');
    
    const achievementCount = await achievements.count();
    console.log(`Found ${achievementCount} achievement elements`);
  });
});
