// ========================================
// IMAGE DATA URL VALIDATION UTILITY
// ========================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Maximum image size: 10MB for base64 encoded data
// Base64 encoding increases size by ~37%, so 10MB base64 ≈ 7.3MB actual image
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024 * 1.37;

// Minimum reasonable base64 image data (1x1 pixel PNG is ~100 chars)
const MIN_BASE64_LENGTH = 100;

/**
 * Validates a screenshot data URL before processing or sending to AI
 * 
 * Checks performed:
 * 1. Type validation (must be string)
 * 2. Format validation (must start with data:image/)
 * 3. Size validation (max 10MB encoded)
 * 4. Base64 marker presence
 * 5. Base64 data exists and is non-empty
 * 6. Base64 format validation (rough check)
 * 
 * @param dataUrl - The data URL to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateScreenshotDataUrl(dataUrl: unknown): ValidationResult {
  // 1. Check if it's a string
  if (typeof dataUrl !== 'string') {
    return { valid: false, error: 'Screenshot data must be a string' };
  }

  // 2. Check if it starts with data:image/
  if (!dataUrl.startsWith('data:image/')) {
    return { valid: false, error: 'Invalid image format - must be a data URL (data:image/...)' };
  }

  // 3. Check size (prevent memory exhaustion from huge images)
  if (dataUrl.length > MAX_IMAGE_SIZE_BYTES) {
    const sizeMB = (dataUrl.length / (1024 * 1024)).toFixed(2);
    return { valid: false, error: `Image too large (${sizeMB}MB). Maximum size is 10MB.` };
  }

  // 4. Check if base64 section exists
  const base64Marker = ';base64,';
  if (!dataUrl.includes(base64Marker)) {
    return { valid: false, error: 'Missing base64 encoding in data URL' };
  }

  // 5. Extract and validate base64 data exists
  const parts = dataUrl.split(base64Marker);
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed data URL - invalid base64 marker' };
  }

  const base64Data = parts[1];
  if (!base64Data || base64Data.length < MIN_BASE64_LENGTH) {
    return { valid: false, error: 'Invalid or empty base64 image data' };
  }

  // 6. Check if base64 string contains only valid base64 characters
  // Valid base64: A-Z, a-z, 0-9, +, /, and = for padding (max 2 at end)
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64Data)) {
    return { valid: false, error: 'Malformed base64 data - contains invalid characters' };
  }

  return { valid: true };
}

/**
 * Safely normalizes a data URL by ensuring it has the proper prefix
 * Only adds prefix if validation passes
 * 
 * @param dataUrl - The data URL to normalize
 * @returns Normalized data URL or null if validation fails
 */
export function normalizeDataUrl(dataUrl: string): string | null {
  // If it already has the prefix, validate and return
  if (dataUrl.startsWith('data:image/')) {
    const result = validateScreenshotDataUrl(dataUrl);
    return result.valid ? dataUrl : null;
  }

  // Try adding the data:image/png;base64, prefix
  const normalized = `data:image/png;base64,${dataUrl}`;
  const result = validateScreenshotDataUrl(normalized);
  
  return result.valid ? normalized : null;
}

/**
 * Gets the approximate size of a data URL in megabytes
 * 
 * @param dataUrl - The data URL to measure
 * @returns Size in MB rounded to 2 decimal places
 */
export function getDataUrlSizeMB(dataUrl: string): number {
  return parseFloat((dataUrl.length / (1024 * 1024)).toFixed(2));
}

/**
 * Extracts the MIME type from a data URL
 * 
 * @param dataUrl - The data URL
 * @returns MIME type (e.g., 'image/png') or null if invalid
 */
export function extractMimeType(dataUrl: string): string | null {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match ? match[1] : null;
}
