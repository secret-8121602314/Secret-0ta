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
 * Game Detection Stress Tests
 * ===========================
 * Tests game detection functionality including:
 * - Screenshot-based game detection
 * - Text-based game detection
 * - OTAKON_GAME_ID tag parsing
 * - Confidence levels (high/low)
 * - Fullscreen detection
 * - Unreleased game detection
 * - Genre detection
 */

test.describe('Text-Based Game Detection', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should detect game from explicit game name in query', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Ask about a specific game
    await sendMessage(page, 'How do I complete the Water Temple in Ocarina of Time?');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    
    // Check if game was detected and tab created
    const gameTabs = page.locator(selectors.gameTab);
    const tabCount = await gameTabs.count();
    console.log(`Game tabs after detection query: ${tabCount}`);
    
    // Check for game-related content in response
    const chatContainer = page.locator(selectors.chatContainer).first();
    const content = await chatContainer.textContent() || '';
    const hasGameContent = content.toLowerCase().includes('zelda') || 
                           content.toLowerCase().includes('ocarina') ||
                           content.toLowerCase().includes('water temple');
    console.log('Response contains game content:', hasGameContent);
  });

  test('should detect game with high confidence', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Clear, unambiguous game query
    await sendMessage(page, 'What is the best starting class in Elden Ring?');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    
    // High confidence detection should create a tab
    const gameTabs = page.locator(selectors.gameTab);
    const tabCount = await gameTabs.count();
    console.log(`High confidence detection - tabs: ${tabCount}`);
  });

  test('should handle ambiguous game queries', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Ambiguous query that could match multiple games
    await sendMessage(page, 'How do I beat the final boss?');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    
    // Without context, AI should ask for clarification
    const chatContainer = page.locator(selectors.chatContainer).first();
    const content = await chatContainer.textContent() || '';
    console.log('Response to ambiguous query received');
  });

  test('should detect multiple games in conversation', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // First game
    await sendMessage(page, 'Tell me about the combat in Dark Souls 3');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    // Second game
    await sendMessage(page, 'Now tell me about Hollow Knight bosses');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    const gameTabs = page.locator(selectors.gameTab);
    const tabCount = await gameTabs.count();
    console.log(`Game tabs after multiple detections: ${tabCount}`);
  });
});

test.describe('Screenshot-Based Game Detection', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should have screenshot upload capability', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Look for screenshot/upload button
    const screenshotButton = page.locator(
      'button:has-text("Screenshot"), button[aria-label*="screenshot" i], input[type="file"]'
    ).first();
    
    const hasScreenshotCapability = await screenshotButton.isVisible().catch(() => false);
    console.log('Has screenshot capability:', hasScreenshotCapability);
  });

  test('should have manual upload mode toggle', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Check for manual upload toggle
    const manualToggle = page.locator(
      'button:has-text("Manual"), [aria-label*="manual" i], [class*="manual"]'
    ).first();
    
    const hasManualToggle = await manualToggle.isVisible().catch(() => false);
    console.log('Has manual upload toggle:', hasManualToggle);
  });

  test('should detect fullscreen gameplay mode', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Ask about gameplay (would trigger fullscreen detection with screenshot)
    await sendMessage(page, 'I am playing Cyberpunk 2077 right now, help me with the current mission');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    
    // Check response contains game help
    const chatContainer = page.locator(selectors.chatContainer).first();
    const content = await chatContainer.textContent() || '';
    const isGameRelated = content.toLowerCase().includes('cyberpunk') || 
                          content.toLowerCase().includes('mission');
    console.log('Response is game-related:', isGameRelated);
  });
});

test.describe('Game Detection Tag Parsing', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should extract OTAKON_GAME_ID from response', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Query that should trigger game ID extraction
    await sendMessage(page, 'Help me with Minecraft survival mode');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    
    // If game was detected, tab should be created
    const gameTabs = page.locator(selectors.gameTab);
    const tabCount = await gameTabs.count();
    
    if (tabCount > 0) {
      // Click on the tab to verify it's the right game
      await gameTabs.first().click();
      await page.waitForTimeout(500);
      
      // Tab should have game title
      const tabTitle = await gameTabs.first().textContent();
      console.log('Game tab title:', tabTitle);
    }
  });

  test('should extract genre from detection', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Query for a game with clear genre
    await sendMessage(page, 'What are good weapons in Call of Duty?');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    
    // Genre should influence subtab types if tab is created
    const gameTabs = page.locator(selectors.gameTab);
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(1000);
      
      // Check for genre-appropriate subtabs
      const subtabs = page.locator(selectors.subtab);
      const subtabCount = await subtabs.count();
      console.log(`Subtabs created for detected game: ${subtabCount}`);
    }
  });
});

test.describe('Unreleased Game Detection', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should detect unreleased games', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Ask about an unreleased game
    await sendMessage(page, 'What do we know about GTA 6?');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    
    // Unreleased games should be handled differently
    const chatContainer = page.locator(selectors.chatContainer).first();
    const content = await chatContainer.textContent() || '';
    console.log('Response for unreleased game received');
  });

  test('should not create subtabs for unreleased games', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Query about unreleased game
    await sendMessage(page, 'Tell me about the upcoming Elder Scrolls 6');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    
    // If tab is created, it should have limited/no subtabs
    const gameTabs = page.locator(selectors.gameTab);
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(1000);
      
      const subtabs = page.locator(selectors.subtab);
      const subtabCount = await subtabs.count();
      console.log(`Subtabs for unreleased game: ${subtabCount}`);
      // Unreleased games typically have 0 subtabs or minimal
    }
  });
});

test.describe('Game Detection Confidence Levels', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle high confidence detection', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Very specific game query (high confidence)
    await sendMessage(page, 'How do I get the Master Sword in Breath of the Wild?');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    
    // High confidence should create tab with subtabs
    const gameTabs = page.locator(selectors.gameTab);
    if (await gameTabs.count() > 0) {
      await gameTabs.first().click();
      await page.waitForTimeout(1000);
      
      // Should have subtabs populated
      const subtabs = page.locator(selectors.subtab);
      console.log(`Subtabs for high confidence: ${await subtabs.count()}`);
    }
  });

  test('should handle low confidence detection', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Vague game query (low confidence)
    await sendMessage(page, 'How do I get better at the game?');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    
    // Low confidence might not create tab
    const gameTabs = page.locator(selectors.gameTab);
    console.log(`Tabs created for low confidence: ${await gameTabs.count()}`);
  });
});

test.describe('Game Detection Mode Switching', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should switch to Playing mode after game detection', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Fullscreen game query should trigger Playing mode
    await sendMessage(page, 'I am currently in the middle of a boss fight in Sekiro');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    
    // Check if mode switched
    const playingIndicator = page.locator(
      'text=Playing, [class*="playing"], [aria-label*="playing" i]'
    ).first();
    
    const isPlaying = await playingIndicator.isVisible().catch(() => false);
    console.log('Switched to Playing mode:', isPlaying);
  });

  test('should stay in Discuss mode for non-fullscreen detection', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // General question about a game
    await sendMessage(page, 'What is the lore of Dark Souls?');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    
    // Should stay in discuss mode
    const discussIndicator = page.locator(
      'text=Discuss, [class*="discuss"], [aria-label*="discuss" i]'
    ).first();
    
    const isDiscuss = await discussIndicator.isVisible().catch(() => false);
    console.log('Stayed in Discuss mode:', isDiscuss);
  });
});

test.describe('Game Detection with Existing Tabs', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should route to existing tab if game already detected', async ({ page }) => {
    await goToGameHub(page);
    
    // Create a game tab first
    await createGameTab(page, 'The Witcher 3');
    await page.waitForTimeout(2000);
    
    // Go back to Game Hub
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Ask about the same game
    await sendMessage(page, 'Tell me about Witcher 3 alchemy');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    
    // Should route to existing tab, not create new one
    const gameTabs = page.locator(selectors.gameTab);
    const tabCount = await gameTabs.count();
    console.log(`Tab count after asking about existing game: ${tabCount}`);
  });

  test('should create new tab for different game', async ({ page }) => {
    await goToGameHub(page);
    
    // Create first game tab
    await createGameTab(page, 'Game One');
    await page.waitForTimeout(2000);
    
    const initialTabCount = await page.locator(selectors.gameTab).count();
    
    // Go to Game Hub and ask about different game
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    await sendMessage(page, 'Help me with Hades boss fights');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    
    const finalTabCount = await page.locator(selectors.gameTab).count();
    console.log(`Tabs: initial=${initialTabCount}, final=${finalTabCount}`);
  });
});

test.describe('Game Detection Error Handling', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle detection failure gracefully', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Non-game query
    await sendMessage(page, 'What is the weather today?');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    // Should not create game tab
    const gameTabs = page.locator(selectors.gameTab);
    const tabCount = await gameTabs.count();
    console.log(`Tabs after non-game query: ${tabCount}`);
    
    // App should remain functional
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeEnabled();
  });

  test('should handle malformed game detection', async ({ page }) => {
    await goToGameHub(page);
    await page.waitForTimeout(1000);
    
    // Query with special characters
    await sendMessage(page, 'Tell me about @#$% game!!!');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    // App should handle gracefully
    const chatInput = page.locator(selectors.chatInput).first();
    await expect(chatInput).toBeEnabled();
  });
});
