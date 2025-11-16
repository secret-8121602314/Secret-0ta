/**
 * Input validation utilities
 * Centralized validation for consistent data integrity across the app
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'Email is required' };
  }
  
  if (trimmed.length > 254) {
    return { isValid: false, error: 'Email is too long' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  return { isValid: true };
}

/**
 * Validate conversation/game title
 */
export function validateTitle(title: string, maxLength = 100): ValidationResult {
  const trimmed = title.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'Title is required' };
  }
  
  if (trimmed.length > maxLength) {
    return { isValid: false, error: `Title must be ${maxLength} characters or less` };
  }
  
  // Check for potentially malicious content
  if (/<script|javascript:|onerror=/i.test(trimmed)) {
    return { isValid: false, error: 'Invalid characters in title' };
  }
  
  return { isValid: true };
}

/**
 * Validate message content
 */
export function validateMessage(message: string, maxLength = 10000): ValidationResult {
  const trimmed = message.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (trimmed.length > maxLength) {
    return { isValid: false, error: `Message must be ${maxLength} characters or less` };
  }
  
  return { isValid: true };
}

/**
 * Validate connection code (6 digits)
 */
export function validateConnectionCode(code: string): ValidationResult {
  const trimmed = code.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'Connection code is required' };
  }
  
  if (!/^\d{6}$/.test(trimmed)) {
    return { isValid: false, error: 'Connection code must be exactly 6 digits' };
  }
  
  return { isValid: true };
}

/**
 * Validate genre/category
 */
export function validateGenre(genre: string): ValidationResult {
  const trimmed = genre.trim();
  
  if (trimmed.length > 50) {
    return { isValid: false, error: 'Genre must be 50 characters or less' };
  }
  
  return { isValid: true };
}

/**
 * Sanitize string input by removing potentially dangerous content
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onerror=/gi, '')
    .replace(/onclick=/gi, '');
}

/**
 * Validate user profile data
 */
export function validateProfileData(data: Record<string, unknown>): ValidationResult {
  // Check for reasonable data size (prevent DoS)
  const jsonString = JSON.stringify(data);
  if (jsonString.length > 50000) {
    return { isValid: false, error: 'Profile data is too large' };
  }
  
  return { isValid: true };
}

/**
 * Rate limit check helper
 */
export class RateLimiter {
  private attempts = new Map<string, number[]>();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  check(key: string): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      const oldestAttempt = Math.min(...recentAttempts);
      const resetIn = this.windowMs - (now - oldestAttempt);
      return { allowed: false, remaining: 0, resetIn };
    }
    
    // Record this attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return {
      allowed: true,
      remaining: this.maxAttempts - recentAttempts.length,
      resetIn: this.windowMs
    };
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Validate data URL (for screenshots)
 */
export function validateDataUrl(dataUrl: string): ValidationResult {
  if (!dataUrl) {
    return { isValid: false, error: 'Data URL is required' };
  }
  
  // Check if it's a valid data URL format
  if (!dataUrl.startsWith('data:image/')) {
    return { isValid: false, error: 'Invalid image data URL' };
  }
  
  // Check size (max 10MB base64)
  const sizeEstimate = dataUrl.length * 0.75; // Base64 is ~33% larger
  if (sizeEstimate > 10 * 1024 * 1024) {
    return { isValid: false, error: 'Image is too large (max 10MB)' };
  }
  
  return { isValid: true };
}
