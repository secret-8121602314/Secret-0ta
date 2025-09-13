/**
 * Shared utility functions
 * 
 * This file contains commonly used utility functions across the application
 * to reduce code duplication and improve maintainability.
 */

import { STORAGE_KEYS, TIMING } from './constants';

// ============================================================================
// STORAGE HELPERS
// ============================================================================

/**
 * Safely get an item from localStorage with fallback
 */
export const getStorageItem = (key: string, fallback: string | null = null): string | null => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch (error) {
    console.warn(`Failed to get localStorage item ${key}:`, error);
    return fallback;
  }
};

/**
 * Safely set an item in localStorage
 */
export const setStorageItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Failed to set localStorage item ${key}:`, error);
    return false;
  }
};

/**
 * Safely remove an item from localStorage
 */
export const removeStorageItem = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove localStorage item ${key}:`, error);
    return false;
  }
};

/**
 * Clear multiple localStorage items
 */
export const clearStorageItems = (keys: string[]): void => {
  keys.forEach(key => removeStorageItem(key));
};

/**
 * Clear all onboarding-related localStorage items
 */
export const clearOnboardingCache = (): void => {
  const keysToClear = [
    STORAGE_KEYS.ONBOARDING_COMPLETE,
    STORAGE_KEYS.PROFILE_SETUP_COMPLETED,
    STORAGE_KEYS.FIRST_RUN_COMPLETED,
    STORAGE_KEYS.WELCOME_MESSAGE_SHOWN,
    STORAGE_KEYS.FIRST_WELCOME_SHOWN,
    STORAGE_KEYS.HAS_CONVERSATIONS,
    STORAGE_KEYS.HAS_INTERACTED_WITH_CHAT,
    STORAGE_KEYS.LAST_WELCOME_TIME,
    STORAGE_KEYS.APP_CLOSED_TIME,
    STORAGE_KEYS.TUTORIAL_COMPLETED,
  ];
  
  clearStorageItems(keysToClear);
};

// ============================================================================
// TIME & DATE HELPERS
// ============================================================================

/**
 * Get current timestamp
 */
export const getCurrentTimestamp = (): number => Date.now();

/**
 * Get time greeting based on current hour
 */
export const getTimeGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return 'Good morning! ';
  } else if (hour < 17) {
    return 'Good afternoon! ';
  } else {
    return 'Good evening! ';
  }
};

/**
 * Check if enough time has passed since last action
 */
export const hasTimePassed = (lastTime: number, cooldownMs: number): boolean => {
  return Date.now() - lastTime >= cooldownMs;
};

/**
 * Format date for display
 */
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString();
};

/**
 * Format time for display
 */
export const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString();
};

// ============================================================================
// STRING HELPERS
// ============================================================================

/**
 * Extract first name from full name
 */
export const extractFirstName = (fullName: string | null): string | null => {
  if (!fullName) return null;
  
  const first = fullName.trim().split(' ')[0];
  return first || null;
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Capitalize first letter of string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Convert string to kebab-case
 */
export const toKebabCase = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if email is valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if string is not empty
 */
export const isNotEmpty = (str: string | null | undefined): boolean => {
  return str !== null && str !== undefined && str.trim().length > 0;
};

/**
 * Check if value is a valid number
 */
export const isValidNumber = (value: any): boolean => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

// ============================================================================
// ARRAY HELPERS
// ============================================================================

/**
 * Remove duplicates from array
 */
export const removeDuplicates = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

/**
 * Group array items by key
 */
export const groupBy = <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

/**
 * Shuffle array
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ============================================================================
// OBJECT HELPERS
// ============================================================================

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  if (typeof obj === 'object') {
    const cloned = {} as any;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  return obj;
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj: any): boolean => {
  if (obj === null || obj === undefined) return true;
  if (typeof obj === 'string' || Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

/**
 * Merge objects deeply
 */
export const deepMerge = <T extends Record<string, any>>(target: T, source: Partial<T>): T => {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (typeof sourceValue === 'object' && sourceValue !== null && !Array.isArray(sourceValue) &&
          typeof targetValue === 'object' && targetValue !== null && !Array.isArray(targetValue)) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        result[key] = sourceValue!;
      }
    }
  }
  
  return result;
};

// ============================================================================
// ASYNC HELPERS
// ============================================================================

/**
 * Delay execution by specified milliseconds
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry async operation with exponential backoff
 */
export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = TIMING.MAX_RETRY_ATTEMPTS,
  baseDelay: number = TIMING.RETRY_DELAY_BASE
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt < maxRetries) {
        const delayMs = baseDelay * Math.pow(2, attempt - 1);
        await delay(delayMs);
      }
    }
  }
  
  throw lastError!;
};

/**
 * Timeout wrapper for async operations
 */
export const withTimeout = <T>(
  operation: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> => {
  return Promise.race([
    operation,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    )
  ]);
};

// ============================================================================
// ERROR HELPERS
// ============================================================================

/**
 * Create standardized error object
 */
export const createError = (message: string, code?: string, context?: any): Error => {
  const error = new Error(message);
  if (code) (error as any).code = code;
  if (context) (error as any).context = context;
  return error;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: any): boolean => {
  return error?.name === 'NetworkError' || 
         error?.message?.includes('network') ||
         error?.message?.includes('fetch');
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: any): boolean => {
  return error?.message?.includes('authentication') ||
         error?.message?.includes('unauthorized') ||
         error?.status === 401;
};

// ============================================================================
// URL HELPERS
// ============================================================================

/**
 * Parse URL parameters
 */
export const parseUrlParams = (url: string): Record<string, string> => {
  const params: Record<string, string> = {};
  const urlObj = new URL(url);
  
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
};

/**
 * Parse URL hash parameters
 */
export const parseHashParams = (hash: string): Record<string, string> => {
  const params: Record<string, string> = {};
  
  if (hash.startsWith('#')) {
    hash = hash.substring(1);
  }
  
  const pairs = hash.split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  }
  
  return params;
};
