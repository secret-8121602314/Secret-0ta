/**
 * Haptic Feedback Utility for PWA
 * Provides native-like tactile responses using Vibration API
 * Only works in PWA mode on supported devices
 */

import { isPWAMode } from './pwaDetection';

// Vibration patterns (in milliseconds)
const HAPTIC_PATTERNS = {
  light: [10],           // Quick tap - for button presses
  medium: [20],          // Normal feedback - for tab switches
  heavy: [30],           // Strong feedback - for important actions
  success: [10, 50, 10], // Double tap - for successful operations
  error: [50, 100, 50],  // Strong-weak-strong - for errors
  warning: [20, 100, 20],// Medium pattern - for warnings
  longPress: [50],       // Long vibration - for long-press activation
  swipe: [5],            // Very light - for gesture feedback
  selection: [15],       // Moderate - for selecting items
  notification: [20, 100, 20, 100, 20], // Multi-pulse - for notifications
  messageSent: [10, 30, 10], // Quick success pattern
  messageReceived: [15, 50, 15], // Softer pattern
} as const;

type HapticPattern = keyof typeof HAPTIC_PATTERNS;

/**
 * Check if vibration API is supported
 */
export function isHapticSupported(): boolean {
  return 'vibrate' in navigator;
}

/**
 * Check if haptics are enabled for PWA
 * (only allow in PWA mode to keep browser experience standard)
 */
export function isHapticEnabled(): boolean {
  return isHapticSupported() && isPWAMode();
}

/**
 * Trigger haptic feedback with specified pattern
 */
export function triggerHaptic(pattern: HapticPattern): void {
  if (!isHapticEnabled()) {
    return;
  }

  try {
    const vibrationPattern = HAPTIC_PATTERNS[pattern];
    navigator.vibrate(vibrationPattern);
  } catch (error) {
    console.warn('[Haptic] Vibration failed:', error);
  }
}

/**
 * Trigger custom haptic pattern (advanced)
 */
export function triggerCustomHaptic(pattern: number | number[]): void {
  if (!isHapticEnabled()) {
    return;
  }

  try {
    navigator.vibrate(pattern);
  } catch (error) {
    console.warn('[Haptic] Custom vibration failed:', error);
  }
}

/**
 * Stop any ongoing vibration
 */
export function stopHaptic(): void {
  if (!isHapticSupported()) {
    return;
  }
  
  try {
    navigator.vibrate(0);
  } catch (error) {
    console.warn('[Haptic] Stop vibration failed:', error);
  }
}

// ============================================
// CONVENIENCE FUNCTIONS FOR COMMON USE CASES
// ============================================

/**
 * Button press feedback (light tap)
 */
export function hapticButton(): void {
  triggerHaptic('light');
}

/**
 * Tab switch feedback (medium)
 */
export function hapticTabSwitch(): void {
  triggerHaptic('medium');
}

/**
 * Modal open/close feedback (medium)
 */
export function hapticModal(): void {
  triggerHaptic('medium');
}

/**
 * Success operation feedback (double tap)
 */
export function hapticSuccess(): void {
  triggerHaptic('success');
}

/**
 * Error feedback (strong pattern)
 */
export function hapticError(): void {
  triggerHaptic('error');
}

/**
 * Warning feedback
 */
export function hapticWarning(): void {
  triggerHaptic('warning');
}

/**
 * Long-press activation feedback
 */
export function hapticLongPress(): void {
  triggerHaptic('longPress');
}

/**
 * Swipe gesture feedback (very light)
 */
export function hapticSwipe(): void {
  triggerHaptic('swipe');
}

/**
 * Item selection feedback
 */
export function hapticSelection(): void {
  triggerHaptic('selection');
}

/**
 * Message sent feedback
 */
export function hapticMessageSent(): void {
  triggerHaptic('messageSent');
}

/**
 * Message received feedback
 */
export function hapticMessageReceived(): void {
  triggerHaptic('messageReceived');
}

/**
 * Notification feedback
 */
export function hapticNotification(): void {
  triggerHaptic('notification');
}

// ============================================
// REACT HOOK FOR HAPTIC FEEDBACK
// ============================================

/**
 * React hook for haptic feedback
 * Usage: const haptic = useHaptic();
 *        haptic.button();
 */
export function useHaptic() {
  return {
    isSupported: isHapticSupported(),
    isEnabled: isHapticEnabled(),
    button: hapticButton,
    tabSwitch: hapticTabSwitch,
    modal: hapticModal,
    success: hapticSuccess,
    error: hapticError,
    warning: hapticWarning,
    longPress: hapticLongPress,
    swipe: hapticSwipe,
    selection: hapticSelection,
    messageSent: hapticMessageSent,
    messageReceived: hapticMessageReceived,
    notification: hapticNotification,
    custom: triggerCustomHaptic,
    stop: stopHaptic,
  };
}

// ============================================
// HIGHER-ORDER FUNCTIONS FOR EVENT HANDLERS
// ============================================

/**
 * Wrap onClick handler with haptic feedback
 * Usage: onClick={withHaptic(() => handleClick(), 'button')}
 */
export function withHaptic<T extends (...args: unknown[]) => unknown>(
  handler: T,
  pattern: HapticPattern = 'light'
): T {
  return ((...args: unknown[]) => {
    triggerHaptic(pattern);
    return handler(...args);
  }) as T;
}

/**
 * Create a haptic-enabled button component wrapper
 */
export function createHapticHandler(
  handler: () => void,
  pattern: HapticPattern = 'light'
) {
  return () => {
    triggerHaptic(pattern);
    handler();
  };
}

// Log haptic system status on load (only in PWA)
if (isPWAMode()) {
  console.log('[Haptic] System status:', {
    supported: isHapticSupported(),
    enabled: isHapticEnabled(),
    pwaMode: true,
  });
}
