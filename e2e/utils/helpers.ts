import { Page, Locator } from '@playwright/test';

/**
 * Comprehensive Test Utilities and Helpers for Otagon E2E Stress Tests
 * =====================================================================
 * This file contains all selectors, helpers, and utilities for testing
 * the Otagon app's core features, modals, buttons, toggles, and services.
 */

// ============================================================================
// COMMON SELECTORS
// ============================================================================

export const selectors = {
  // Layout Components
  sidebar: '[data-testid="sidebar"], .sidebar, [class*="Sidebar"]',
  mainContent: '[data-testid="main-content"], .main-content',
  chatInterface: '[data-testid="chat-interface"], .chat-interface',
  chatContainer: '[data-testid="chat-container"], [data-testid="chat-interface"], .chat-interface, .chat-container',
  header: 'header',
  
  // Navigation
  gameHub: 'text=Game Hub',
  gameTab: '[data-testid="game-tab"]',
  conversationList: '[data-testid="conversation-list"]',
  addGameButton: 'button:has-text("Add Game"), button:has-text("New Game"), [data-testid="add-game"]',
  
  // Chat Interface
  chatInput: 'textarea[placeholder="Type your message..."]',
  sendButton: 'button[aria-label="Send message"], button[type="submit"]',
  messageList: '[data-testid="message-list"], .messages',
  userMessage: '.chat-message-user, [data-message-role="user"]',
  aiMessage: '.chat-message-ai, [data-message-role="assistant"]',
  typingIndicator: '[data-testid="typing-indicator"], .typing-indicator, .animate-pulse',
  stopButton: 'button:has-text("Stop"), button[aria-label*="stop"]',
  
  // SubTabs
  subtabsPanel: '[data-testid="subtabs"], .subtabs-panel',
  subtabButton: '[data-testid="subtab-button"]',
  addSubTabButton: 'button:has-text("Add SubTab"), [data-testid="add-subtab-button"]',
  subtabTypeOptions: {
    story: 'text=Story',
    strategies: 'text=Strategies',
    tips: 'text=Tips',
    walkthrough: 'text=Walkthrough',
    items: 'text=Items',
    characters: 'text=Characters',
    chat: 'text=Chat',
  },
  
  // Progress
  progressBar: '[data-testid="progress-bar"], .progress-bar',
  sessionToggle: '[data-testid="session-toggle"], .session-toggle',
  
  // Modals
  modal: '[role="dialog"], [data-testid="modal"], .modal, [class*="modal"], .fixed.inset-0.z-50',
  modalClose: '[data-testid="modal-close"], button[aria-label="Close"], button:has-text("Close")',
  settingsModal: '[data-testid="settings-modal"]',
  creditModal: '[data-testid="credit-modal"]',
  connectionModal: '[data-testid="connection-modal"]',
  handsFreeModal: '[data-testid="hands-free-modal"]',
  addGameModal: '[data-testid="add-game-modal"]',
  gameInfoModal: '[data-testid="game-info-modal"]',
  aboutModal: '[data-testid="about-modal"]',
  privacyModal: '[data-testid="privacy-modal"]',
  
  // Buttons & Controls
  settingsButton: 'header button:last-child',
  pcConnectionButton: 'button:has-text("Connect PC"), [data-testid="pc-connection"]',
  handsFreeToggle: '[data-testid="hands-free-toggle"]',
  ttsToggle: '[data-testid="tts-toggle"], [data-testid="hands-free-toggle"], button[aria-label*="voice"], button[aria-label*="TTS"]',
  aiModeToggle: '[data-testid="ai-mode-toggle"]',
  manualUploadToggle: '[data-testid="manual-upload-toggle"]',
  screenshotButton: '[data-testid="screenshot-button"]',
  creditIndicator: '[data-testid="credit-indicator"], button:has-text("Credits"), button[aria-label*="credit"]',
  addSubtab: 'button:has-text("Add SubTab"), [data-testid="add-subtab-button"], button:has-text("+"), button[aria-label*="add subtab"]',
  subtab: '[data-testid="subtab"], [data-testid="subtab-button"], .subtab-button, [role="tab"]',
  
  // Context Menu
  contextMenu: '[role="menu"], .context-menu, [data-testid="context-menu"]',
  settingsContextMenu: '[data-testid="settings-context-menu"]',
  
  // Auth
  loginButton: 'button:has-text("Sign In"), button:has-text("Log In")',
  logoutButton: 'button:has-text("Log Out"), button:has-text("Sign Out"), text=Logout',
  signInWithEmail: 'button:has-text("Sign In with Email")',
  emailInput: 'input[type="email"], input#email-input',
  passwordInput: 'input[type="password"]',
  
  // Onboarding & Splash Screens
  startAdventureButton: 'button:has-text("Start the Adventure")',
  letsBeginButton: 'button:has-text("Let\'s Begin")',
  maybeLaterButton: 'button:has-text("Maybe Later")',
  skipButton: 'button:has-text("Skip")',
  nextButton: 'button:has-text("Next")',
  continueButton: 'button:has-text("Continue")',
  getStartedButton: 'button:has-text("Get Started")',
  doneButton: 'button:has-text("Done")',
  
  // Game Info Modal
  gameInfoButton: 'button:has-text("Game Info")',
  gameInfoTabs: {
    overview: 'button:has-text("Overview")',
    media: 'button:has-text("Media")',
    similarGames: 'button:has-text("Similar Games")',
  },
  
  // Settings Menu Items
  settingsMenuItem: 'button:has-text("Settings")',
  guideMenuItem: 'button:has-text("Guide")',
  upgradeMenuItem: 'button:has-text("Upgrade")',
  
  // Trial & Subscription
  trialBanner: '[data-testid="trial-banner"]',
  startTrialButton: 'button:has-text("Start Trial"), button:has-text("Try Free")',
  tierInfo: 'text=Free, text=Pro, text=Vanguard',
  
  // Suggested Prompts
  suggestedPrompts: '[data-testid="suggested-prompts"], .suggested-prompts',
  promptButton: '[data-testid="suggested-prompt"], button.prompt',
  
  // Loading States
  loadingSpinner: '.loading, .animate-spin, [data-testid="loading"]',
  skeleton: '.skeleton, [data-testid="skeleton"]',
  
  // Mobile
  mobileMenuButton: 'header button:first-child',
  hamburgerIcon: '[data-testid="hamburger-icon"]',
  
  // PWA
  pwaInstallBanner: '[data-testid="pwa-install-banner"]',
  installButton: 'button:has-text("Install")',
  
  // TTS Controls
  ttsControls: '[data-testid="tts-controls"]',
  speakButton: 'button[aria-label*="speak"], button:has-text("Speak")',
};

// ============================================================================
// ONBOARDING BUTTON SEQUENCE
// ============================================================================

export const onboardingButtons = [
  'button:has-text("Start the Adventure")',
  'button:has-text("Let\'s Begin")',
  'button:has-text("Maybe Later")',
  'button:has-text("Skip")',
  'button:has-text("Next")',
  'button:has-text("Continue")',
  'button:has-text("Get Started")',
  'button:has-text("Let\'s Go")',
  'button:has-text("Done")',
  'button:has-text("Finish")',
  'button:has-text("Got it")',
  'button:has-text("OK")',
  'button:has-text("Close")',
  'button:has-text("Dismiss")',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Wait for the app to be fully loaded
 * Handles both main app and onboarding screens
 */
export async function waitForAppReady(page: Page, options: { skipOnboarding?: boolean } = {}) {
  const { skipOnboarding = true } = options;
  
  await page.waitForLoadState('networkidle');
  
  if (skipOnboarding) {
    let attempts = 0;
    const maxAttempts = 25;
    
    while (attempts < maxAttempts) {
      // Check if we've reached the main app
      const hasChatInput = await page.locator(selectors.chatInput).first().isVisible({ timeout: 500 }).catch(() => false);
      const hasMainApp = await page.locator(selectors.sidebar).first().isVisible({ timeout: 500 }).catch(() => false);
      
      if (hasChatInput || hasMainApp) {
        await page.waitForTimeout(500);
        return;
      }
      
      // Click through onboarding
      let clicked = false;
      for (const selector of onboardingButtons) {
        const btn = page.locator(selector).first();
        const isVisible = await btn.isVisible({ timeout: 200 }).catch(() => false);
        if (isVisible) {
          await btn.click().catch(() => {});
          clicked = true;
          await page.waitForTimeout(500);
          break;
        }
      }
      
      if (!clicked) {
        await page.waitForTimeout(300);
      }
      
      attempts++;
    }
  }
  
  // Final check
  await page.waitForFunction(() => {
    return document.querySelector('[data-testid="app-ready"]') !== null || 
           document.querySelector('.chat-interface') !== null ||
           document.querySelector('[data-testid="sidebar"]') !== null ||
           document.querySelector('textarea[placeholder="Type your message..."]') !== null;
  }, { timeout: 10000 }).catch(() => {});
}

/**
 * Wait for chat response from AI
 */
export async function waitForChatResponse(page: Page, options: number | { timeout?: number } = 30000) {
  const timeout = typeof options === 'number' ? options : (options.timeout ?? 30000);
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const typingIndicator = page.locator(selectors.typingIndicator);
    const isTyping = await typingIndicator.isVisible().catch(() => false);
    
    if (!isTyping) {
      await page.waitForTimeout(500);
      return true;
    }
    
    await page.waitForTimeout(500);
  }
  
  return false;
}

/**
 * Navigate to Game Hub
 */
export async function goToGameHub(page: Page) {
  const gameHubButton = page.locator(selectors.gameHub).first();
  if (await gameHubButton.isVisible()) {
    await gameHubButton.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Navigate to a specific game tab
 */
export async function goToGameTab(page: Page, gameName: string) {
  const gameTab = page.locator(`[data-testid="game-tab"]:has-text("${gameName}")`).first();
  if (await gameTab.isVisible()) {
    await gameTab.click();
    await page.waitForTimeout(1000);
    return true;
  }
  return false;
}

/**
 * Create a new game tab
 */
export async function createGameTab(page: Page, gameName: string, query = 'Tell me about this game') {
  const addGameButton = page.locator(selectors.addGameButton).first();
  await addGameButton.click();
  await page.waitForTimeout(1000);
  
  // Wait for modal to appear
  const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first();
  await modal.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  
  // Fill in the Game Name field - look for the specific input in the modal
  const gameNameInput = page.locator('input[placeholder*="Witcher"], input[placeholder*="Elden Ring"]').first();
  if (await gameNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await gameNameInput.fill(gameName);
  } else {
    // Fallback: find any text input in the modal
    const anyInput = page.locator('[role="dialog"] input[type="text"], [role="dialog"] input:not([type])').first();
    if (await anyInput.isVisible()) {
      await anyInput.fill(gameName);
    }
  }
  
  await page.waitForTimeout(500);
  
  // Fill in the Question/Query field (required) - it's a textarea
  const queryTextarea = page.locator('textarea[placeholder*="What would you like"]').first();
  if (await queryTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
    await queryTextarea.fill(query);
  } else {
    // Fallback: find any textarea in the modal
    const anyTextarea = page.locator('[role="dialog"] textarea').first();
    if (await anyTextarea.isVisible()) {
      await anyTextarea.fill(query);
    }
  }
  
  await page.waitForTimeout(500);
  
  // Click Create Game Tab button - use force to bypass overlay
  const submitButton = page.locator('button:has-text("Create Game Tab")').first();
  
  // Wait for button to be enabled
  await page.waitForTimeout(500);
  
  // Check if button is now enabled and click it
  const isEnabled = await submitButton.isEnabled().catch(() => false);
  if (isEnabled) {
    await submitButton.click({ force: true });
  } else {
    // Try clicking anyway with force
    await submitButton.click({ force: true }).catch(() => {});
  }
  
  await page.waitForTimeout(3000);
}

/**
 * Send a chat message
 * Note: By default does NOT wait for AI response - set waitForResponse=true if needed
 */
export async function sendMessage(page: Page, message: string, waitForResponse = false) {
  const chatInput = page.locator(selectors.chatInput).first();
  await chatInput.fill(message);
  
  const sendButton = page.locator(selectors.sendButton).first();
  await sendButton.click();
  
  if (waitForResponse) {
    await waitForChatResponse(page);
  }
  
  await page.waitForTimeout(500);
}

/**
 * Open settings menu
 */
export async function openSettingsMenu(page: Page) {
  const settingsButton = page.locator(selectors.settingsButton);
  await settingsButton.click();
  await page.waitForTimeout(300);
}

/**
 * Close any open modal
 */
export async function closeModal(page: Page) {
  const closeButton = page.locator(selectors.modalClose).first();
  if (await closeButton.isVisible()) {
    await closeButton.click();
    await page.waitForTimeout(300);
  }
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const sidebar = page.locator(selectors.sidebar).first();
  return await sidebar.isVisible().catch(() => false);
}

/**
 * Open a specific modal
 */
export async function openModal(page: Page, modalType: 'settings' | 'credit' | 'connection' | 'hands-free' | 'add-game' | 'game-info') {
  switch (modalType) {
    case 'settings':
      await openSettingsMenu(page);
      await page.locator(selectors.settingsMenuItem).click();
      break;
    case 'credit':
      const creditBtn = page.locator(selectors.creditIndicator).first();
      if (await creditBtn.isVisible()) {
        await creditBtn.click();
      }
      break;
    case 'connection':
      const connectBtn = page.locator(selectors.pcConnectionButton).first();
      if (await connectBtn.isVisible()) {
        await connectBtn.click();
      }
      break;
    case 'add-game':
      const addGameBtn = page.locator(selectors.addGameButton).first();
      if (await addGameBtn.isVisible()) {
        await addGameBtn.click();
      }
      break;
    case 'game-info':
      const gameInfoBtn = page.locator(selectors.gameInfoButton).first();
      if (await gameInfoBtn.isVisible()) {
        await gameInfoBtn.click();
      }
      break;
  }
  await page.waitForTimeout(500);
}

/**
 * Create a subtab with specific type
 */
export async function createSubTab(page: Page, type: keyof typeof selectors.subtabTypeOptions, name: string) {
  const addSubTabBtn = page.locator(selectors.addSubTabButton).first();
  if (await addSubTabBtn.isVisible()) {
    await addSubTabBtn.click();
    await page.waitForTimeout(500);
    
    const typeOption = page.locator(selectors.subtabTypeOptions[type]).first();
    if (await typeOption.isVisible()) {
      await typeOption.click();
      await page.waitForTimeout(300);
      
      const nameInput = page.locator('input[placeholder*="name"], input[name="name"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill(name);
      }
      
      const createBtn = page.locator('button:has-text("Create"), button:has-text("Add")').first();
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.waitForTimeout(500);
      }
    }
  }
}

/**
 * Toggle a switch/toggle element
 */
export async function toggleSwitch(page: Page, selector: string) {
  const toggle = page.locator(selector).first();
  if (await toggle.isVisible()) {
    await toggle.click();
    await page.waitForTimeout(300);
  }
}

/**
 * Get current message count
 */
export async function getMessageCount(page: Page): Promise<number> {
  const messages = page.locator('[data-message-id]');
  return await messages.count();
}

/**
 * Scroll to bottom of chat
 */
export async function scrollToBottom(page: Page) {
  await page.evaluate(() => {
    const chatContainer = document.querySelector('.chat-interface, [data-testid="chat-interface"]');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  });
}

/**
 * Take a screenshot with descriptive name
 */
export async function screenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `./e2e/screenshots/${name}.png`,
    fullPage: true 
  });
}

/**
 * Wait for element to be visible
 */
export async function waitForElement(page: Page, selector: string, timeout = 10000): Promise<boolean> {
  try {
    await page.locator(selector).first().waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  return await page.locator(selector).first().isVisible().catch(() => false);
}

/**
 * Simulate rapid clicking (stress test)
 */
export async function rapidClick(page: Page, selector: string, times: number, delay = 50) {
  const element = page.locator(selector).first();
  for (let i = 0; i < times; i++) {
    await element.click().catch(() => {});
    await page.waitForTimeout(delay);
  }
}

/**
 * Simulate rapid typing (stress test)
 */
export async function rapidType(page: Page, selector: string, text: string, delay = 10) {
  const element = page.locator(selector).first();
  await element.fill('');
  for (const char of text) {
    await element.type(char, { delay });
  }
}

/**
 * Get all visible buttons
 */
export async function getAllButtons(page: Page): Promise<Locator[]> {
  const buttons = page.locator('button:visible');
  const count = await buttons.count();
  const result: Locator[] = [];
  for (let i = 0; i < count; i++) {
    result.push(buttons.nth(i));
  }
  return result;
}

/**
 * Check PWA installation availability
 */
export async function checkPWAInstallability(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return 'serviceWorker' in navigator;
  });
}

/**
 * Simulate network conditions
 */
export async function setNetworkConditions(page: Page, offline: boolean) {
  await page.context().setOffline(offline);
}

/**
 * Clear local storage
 */
export async function clearLocalStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
  });
}

/**
 * Get local storage item
 */
export async function getLocalStorageItem(page: Page, key: string): Promise<string | null> {
  return await page.evaluate((k) => localStorage.getItem(k), key);
}

/**
 * Set local storage item
 */
export async function setLocalStorageItem(page: Page, key: string, value: string) {
  await page.evaluate(({ k, v }) => localStorage.setItem(k, v), { k: key, v: value });
}

/**
 * Generate random string for test data
 */
export function randomString(length = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate unique test game name
 */
export function uniqueGameName(): string {
  return `Test Game ${Date.now()}`;
}

/**
 * Measure action performance
 */
export async function measurePerformance<T>(
  page: Page,
  action: () => Promise<T>,
  label: string
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await action();
  const duration = Date.now() - start;
  console.log(`[PERF] ${label}: ${duration}ms`);
  return { result, duration };
}
