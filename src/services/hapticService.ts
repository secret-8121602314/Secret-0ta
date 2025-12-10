/**
 * Haptic Feedback Service
 * 
 * Provides native-like haptic feedback for PWA interactions.
 * Only triggers on PWA mode to avoid unexpected vibrations in browser.
 * 
 * Features:
 * - Light, medium, heavy vibration patterns
 * - Success/error/warning feedback
 * - PWA-only activation
 * - Android vibration support
 */

import { isPWAMode } from '../utils/pwaDetection';

// Type declarations for Vibration API
declare global {
  interface Navigator {
    vibrate?: (pattern: number | number[]) => boolean;
  }
}

// Vibration patterns (in milliseconds)
export const HapticPatterns = {
  // Simple taps
  light: 10,
  medium: 20,
  heavy: 40,
  
  // Complex patterns [vibrate, pause, vibrate, ...]
  success: [10, 50, 10],         // Double tap success
  error: [50, 100, 50],          // Longer error feedback
  warning: [20, 50, 20, 50, 20], // Triple tap warning
  
  // UI interactions
  buttonPress: 15,
  modalOpen: [10, 30, 10],
  modalClose: 10,
  tabSwitch: 12,
  messageSend: [10, 40, 15],
  swipe: 8,
  longPress: [0, 50, 30], // Delay then feedback
  
  // Notifications
  notification: [20, 100, 20, 100, 30],
} as const;

export type HapticPattern = keyof typeof HapticPatterns;

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  return typeof navigator !== 'undefined' && 
         'vibrate' in navigator && 
         typeof navigator.vibrate === 'function';
}

/**
 * Check if haptic feedback should be triggered
 * Only triggers in PWA mode with vibration support
 */
export function shouldTriggerHaptic(): boolean {
  return isPWAMode() && isHapticSupported();
}

/**
 * Trigger haptic feedback with a predefined pattern
 * @param pattern - The haptic pattern to use
 * @returns true if haptic was triggered, false otherwise
 */
export function triggerHaptic(pattern: HapticPattern): boolean {
  if (!shouldTriggerHaptic()) {
    return false;
  }
  
  try {
    const vibrationPattern = HapticPatterns[pattern];
    navigator.vibrate?.(vibrationPattern);
    return true;
  } catch (error) {
    console.warn('[Haptic] Failed to trigger haptic feedback:', error);
    return false;
  }
}

/**
 * Trigger custom vibration pattern
 * @param pattern - Custom vibration pattern (number or array of numbers)
 * @returns true if haptic was triggered, false otherwise
 */
export function triggerCustomHaptic(pattern: number | number[]): boolean {
  if (!shouldTriggerHaptic()) {
    return false;
  }
  
  try {
    navigator.vibrate?.(pattern);
    return true;
  } catch (error) {
    console.warn('[Haptic] Failed to trigger custom haptic:', error);
    return false;
  }
}

/**
 * Stop any ongoing vibration
 */
export function stopHaptic(): void {
  if (isHapticSupported()) {
    navigator.vibrate?.(0);
  }
}

// Convenience functions for common interactions
export const haptic = {
  /** Light tap feedback for minor interactions */
  light: () => triggerHaptic('light'),
  
  /** Medium tap feedback for standard button presses */
  medium: () => triggerHaptic('medium'),
  
  /** Heavy tap feedback for important actions */
  heavy: () => triggerHaptic('heavy'),
  
  /** Success feedback (double tap) */
  success: () => triggerHaptic('success'),
  
  /** Error feedback (longer buzz) */
  error: () => triggerHaptic('error'),
  
  /** Warning feedback (triple tap) */
  warning: () => triggerHaptic('warning'),
  
  /** Button press feedback */
  button: () => triggerHaptic('buttonPress'),
  
  /** Modal open feedback */
  modalOpen: () => triggerHaptic('modalOpen'),
  
  /** Modal close feedback */
  modalClose: () => triggerHaptic('modalClose'),
  
  /** Tab switch feedback */
  tabSwitch: () => triggerHaptic('tabSwitch'),
  
  /** Message send feedback */
  messageSend: () => triggerHaptic('messageSend'),
  
  /** Swipe gesture feedback */
  swipe: () => triggerHaptic('swipe'),
  
  /** Long press feedback (with delay) */
  longPress: () => triggerHaptic('longPress'),
  
  /** Notification received feedback */
  notification: () => triggerHaptic('notification'),
  
  /** Stop any ongoing vibration */
  stop: stopHaptic,
  
  /** Check if haptics are available */
  isAvailable: shouldTriggerHaptic,
};

export default haptic;
