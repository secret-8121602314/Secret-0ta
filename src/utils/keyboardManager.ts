/**
 * Keyboard Manager for PWA
 * Handles smooth keyboard appearance, auto-scroll, dismiss on scroll, and proper input modes
 * Provides native app-like keyboard behavior
 */

import { isPWAMode } from './pwaDetection';

// ============================================
// KEYBOARD STATE MANAGEMENT
// ============================================

interface KeyboardState {
  isVisible: boolean;
  height: number;
  activeInput: HTMLElement | null;
}

const keyboardState: KeyboardState = {
  isVisible: false,
  height: 0,
  activeInput: null,
};

let originalViewportHeight = window.innerHeight;
let keyboardListeners: Array<(state: KeyboardState) => void> = [];

/**
 * Subscribe to keyboard state changes
 */
export function onKeyboardChange(callback: (state: KeyboardState) => void): () => void {
  keyboardListeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    keyboardListeners = keyboardListeners.filter(cb => cb !== callback);
  };
}

/**
 * Notify all listeners of keyboard state change
 */
function notifyKeyboardChange(): void {
  keyboardListeners.forEach(callback => {
    try {
      callback({ ...keyboardState });
    } catch (error) {
      console.error('[KeyboardManager] Listener error:', error);
    }
  });
}

// ============================================
// KEYBOARD DETECTION
// ============================================

/**
 * Detect keyboard visibility based on viewport height change
 */
function detectKeyboardVisibility(): void {
  const currentHeight = window.innerHeight;
  const heightDiff = originalViewportHeight - currentHeight;
  
  // Keyboard is considered visible if viewport shrinks by more than 150px
  const wasVisible = keyboardState.isVisible;
  keyboardState.isVisible = heightDiff > 150;
  keyboardState.height = keyboardState.isVisible ? heightDiff : 0;

  if (wasVisible !== keyboardState.isVisible) {
    console.log('[KeyboardManager] Keyboard visibility changed:', keyboardState.isVisible);
    notifyKeyboardChange();
  }
}

/**
 * Initialize keyboard detection
 */
function initKeyboardDetection(): void {
  // Update original height on orientation change
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      originalViewportHeight = window.innerHeight;
    }, 200);
  });

  // Detect keyboard via viewport resize
  window.visualViewport?.addEventListener('resize', detectKeyboardVisibility);
  window.addEventListener('resize', detectKeyboardVisibility);

  console.log('[KeyboardManager] Detection initialized');
}

// ============================================
// AUTO-SCROLL TO INPUT
// ============================================

/**
 * Scroll input into view when keyboard opens
 */
export function scrollToInput(input: HTMLElement, options?: {
  offset?: number;
  smooth?: boolean;
}): void {
  if (!isPWAMode()) {
    return;
  }

  const { offset = 20, smooth = true } = options || {};

  // Wait for keyboard animation
  setTimeout(() => {
    const rect = input.getBoundingClientRect();
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const inputBottom = rect.bottom + offset;

    // Check if input is hidden by keyboard
    if (inputBottom > viewportHeight) {
      const scrollAmount = inputBottom - viewportHeight;
      
      window.scrollBy({
        top: scrollAmount,
        behavior: smooth ? 'smooth' : 'auto',
      });

      console.log('[KeyboardManager] Scrolled to input:', scrollAmount);
    }
  }, 300); // Wait for keyboard animation
}

/**
 * Auto-scroll handler for input focus
 */
function handleInputFocus(event: FocusEvent): void {
  const target = event.target as HTMLElement;
  
  if (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.contentEditable === 'true'
  ) {
    keyboardState.activeInput = target;
    scrollToInput(target);
  }
}

/**
 * Initialize auto-scroll on input focus
 */
function initAutoScroll(): void {
  document.addEventListener('focusin', handleInputFocus, { passive: true });
  console.log('[KeyboardManager] Auto-scroll initialized');
}

// ============================================
// DISMISS KEYBOARD ON SCROLL
// ============================================

let scrollTimeout: number | null = null;
let lastScrollY = 0;

/**
 * Dismiss keyboard when user scrolls
 */
function handleScroll(): void {
  if (!keyboardState.isVisible || !keyboardState.activeInput) {
    return;
  }

  const currentScrollY = window.scrollY;
  const scrollDelta = Math.abs(currentScrollY - lastScrollY);

  // Only dismiss if significant scroll (more than 30px)
  if (scrollDelta > 30) {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    scrollTimeout = window.setTimeout(() => {
      if (keyboardState.activeInput) {
        (keyboardState.activeInput as HTMLInputElement).blur();
        console.log('[KeyboardManager] Keyboard dismissed on scroll');
      }
    }, 100);
  }

  lastScrollY = currentScrollY;
}

/**
 * Initialize dismiss on scroll
 */
function initDismissOnScroll(): void {
  window.addEventListener('scroll', handleScroll, { passive: true });
  console.log('[KeyboardManager] Dismiss on scroll initialized');
}

// ============================================
// PREVENT ZOOM ON INPUT FOCUS
// ============================================

/**
 * Prevent viewport zoom when focusing inputs (iOS issue)
 */
export function preventInputZoom(): void {
  if (!isPWAMode()) {
    return;
  }

  // Add font-size: 16px to all inputs to prevent iOS zoom
  const style = document.createElement('style');
  style.textContent = `
    input, textarea, select {
      font-size: 16px !important;
    }
  `;
  document.head.appendChild(style);

  console.log('[KeyboardManager] Input zoom prevention applied');
}

// ============================================
// PROPER INPUTMODE ATTRIBUTES
// ============================================

interface InputModeConfig {
  selector: string;
  inputMode: string;
  enterKeyHint?: string;
}

const INPUT_MODE_CONFIGS: InputModeConfig[] = [
  // Email inputs
  { selector: 'input[type="email"]', inputMode: 'email', enterKeyHint: 'next' },
  
  // Phone inputs
  { selector: 'input[type="tel"]', inputMode: 'tel', enterKeyHint: 'next' },
  
  // Number inputs
  { selector: 'input[type="number"]', inputMode: 'numeric', enterKeyHint: 'done' },
  
  // URL inputs
  { selector: 'input[type="url"]', inputMode: 'url', enterKeyHint: 'go' },
  
  // Search inputs
  { selector: 'input[type="search"]', inputMode: 'search', enterKeyHint: 'search' },
  
  // Chat/message inputs (common class names)
  { selector: 'input.message-input, textarea.message-input', inputMode: 'text', enterKeyHint: 'send' },
  { selector: '[data-input-type="message"]', inputMode: 'text', enterKeyHint: 'send' },
];

/**
 * Apply proper inputmode attributes to inputs
 */
export function applyInputModes(): void {
  if (!isPWAMode()) {
    return;
  }

  INPUT_MODE_CONFIGS.forEach(config => {
    const inputs = document.querySelectorAll(config.selector);
    inputs.forEach(input => {
      input.setAttribute('inputmode', config.inputMode);
      if (config.enterKeyHint) {
        input.setAttribute('enterkeyhint', config.enterKeyHint);
      }
    });
  });

  console.log('[KeyboardManager] Input modes applied to', 
    INPUT_MODE_CONFIGS.map(c => document.querySelectorAll(c.selector).length).reduce((a, b) => a + b, 0),
    'inputs'
  );
}

/**
 * Auto-apply inputmode to dynamically added inputs
 */
function observeInputs(): void {
  const observer = new MutationObserver(mutations => {
    let shouldApply = false;
    
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) { // Element node
          const element = node as Element;
          if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            shouldApply = true;
          }
        }
      });
    });

    if (shouldApply) {
      applyInputModes();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log('[KeyboardManager] Input observer started');
}

// ============================================
// SMOOTH KEYBOARD APPEARANCE
// ============================================

/**
 * Add CSS for smooth keyboard transitions
 */
function applySmoothKeyboardCSS(): void {
  const style = document.createElement('style');
  style.textContent = `
    /* Smooth keyboard appearance */
    body {
      transition: padding-bottom 0.3s ease-out;
    }

    /* Prevent content jump on keyboard open */
    body.keyboard-visible {
      padding-bottom: env(keyboard-inset-height, 0px);
    }

    /* Smooth scroll behavior */
    html {
      scroll-behavior: smooth;
    }

    /* Prevent content from being cut off by keyboard */
    .keyboard-spacer {
      height: var(--keyboard-height, 0px);
      transition: height 0.3s ease-out;
    }
  `;
  document.head.appendChild(style);

  console.log('[KeyboardManager] Smooth keyboard CSS applied');
}

/**
 * Update body class and CSS variables based on keyboard state
 */
function updateKeyboardState(): void {
  if (keyboardState.isVisible) {
    document.body.classList.add('keyboard-visible');
    document.documentElement.style.setProperty('--keyboard-height', `${keyboardState.height}px`);
  } else {
    document.body.classList.remove('keyboard-visible');
    document.documentElement.style.setProperty('--keyboard-height', '0px');
  }
}

// Subscribe to keyboard changes
onKeyboardChange(updateKeyboardState);

// ============================================
// PUBLIC API
// ============================================

/**
 * Get current keyboard state
 */
export function getKeyboardState(): Readonly<KeyboardState> {
  return { ...keyboardState };
}

/**
 * Manually dismiss keyboard
 */
export function dismissKeyboard(): void {
  if (keyboardState.activeInput) {
    (keyboardState.activeInput as HTMLInputElement).blur();
    keyboardState.activeInput = null;
  }
}

/**
 * Check if keyboard is visible
 */
export function isKeyboardVisible(): boolean {
  return keyboardState.isVisible;
}

/**
 * Get keyboard height
 */
export function getKeyboardHeight(): number {
  return keyboardState.height;
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize keyboard manager
 */
export function initKeyboardManager(): void {
  if (!isPWAMode()) {
    console.log('[KeyboardManager] Not in PWA mode, skipping initialization');
    return;
  }

  console.log('[KeyboardManager] Initializing...');

  initKeyboardDetection();
  initAutoScroll();
  initDismissOnScroll();
  preventInputZoom();
  applySmoothKeyboardCSS();
  applyInputModes();
  observeInputs();

  console.log('[KeyboardManager] Initialized successfully');
}

/**
 * Cleanup keyboard manager
 */
export function cleanupKeyboardManager(): void {
  keyboardListeners = [];
  console.log('[KeyboardManager] Cleaned up');
}

// Auto-initialize if in PWA mode
if (isPWAMode() && document.readyState === 'complete') {
  initKeyboardManager();
} else if (isPWAMode()) {
  window.addEventListener('load', initKeyboardManager);
}

// ============================================
// REACT HOOK
// ============================================

// Note: useKeyboard hook requires React to be imported in the consuming component
// It cannot be used standalone - import React in your component file
