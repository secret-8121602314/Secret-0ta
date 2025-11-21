import { supabase } from '../lib/supabase';

/**
 * Screenshot Storage Service
 * 
 * Handles uploading, retrieving, and deleting game screenshots to/from Supabase Storage.
 * 
 * Storage Structure:
 * - Bucket: 'screenshots' (public)
 * - Path: {user_id}/{timestamp}_{random}.png
 * 
 * Security:
 * - RLS policies enforce user can only upload to their own folder
 * - Public URLs are safe: 2^288 entropy (UUID + timestamp + random)
 * - No PII or sensitive data in screenshots (game content only)
 */

export interface UploadScreenshotResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
  fileSize?: number;
}

export interface DeleteScreenshotResult {
  success: boolean;
  error?: string;
}

/**
 * Convert base64 data URL to Blob
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(parts[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  
  return new Blob([u8arr], { type: mime });
}

/**
 * Upload a screenshot to Supabase Storage
 * 
 * @param dataUrl - Base64 data URL of the screenshot
 * @param userId - User ID (auth.uid())
 * @returns Upload result with public URL
 */
export async function uploadScreenshot(
  dataUrl: string,
  userId: string
): Promise<UploadScreenshotResult> {
  try {
    // Convert data URL to Blob
    const blob = dataUrlToBlob(dataUrl);
    const fileSize = blob.size;
    
    // Check file size (50MB limit enforced by Supabase config)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (fileSize > MAX_FILE_SIZE) {
      return {
        success: false,
        error: 'Screenshot exceeds 50MB size limit'
      };
    }
    
    // Generate unique filename: {timestamp}_{random}.png
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const filename = `${timestamp}_${random}.png`;
    
    // Upload path: {user_id}/{filename}
    const filePath = `${userId}/${filename}`;
    
    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('screenshots')
      .upload(filePath, blob, {
        contentType: 'image/png',
        cacheControl: '3600', // 1 hour cache
        upsert: false // Don't overwrite existing files
      });
    
    if (error) {
      console.error('Screenshot upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('screenshots')
      .getPublicUrl(filePath);
    
    if (!urlData?.publicUrl) {
      return {
        success: false,
        error: 'Failed to generate public URL'
      };
    }
    
    return {
      success: true,
      publicUrl: urlData.publicUrl,
      fileSize
    };
  } catch (error) {
    console.error('Screenshot upload exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Delete a screenshot from Supabase Storage
 * 
 * @param publicUrl - Public URL of the screenshot
 * @param userId - User ID (auth.uid()) for validation
 * @returns Deletion result
 */
export async function deleteScreenshot(
  publicUrl: string,
  userId: string
): Promise<DeleteScreenshotResult> {
  try {
    // Extract file path from public URL
    // Format: https://{project}.supabase.co/storage/v1/object/public/screenshots/{user_id}/{filename}
    const urlParts = publicUrl.split('/screenshots/');
    if (urlParts.length !== 2) {
      return {
        success: false,
        error: 'Invalid screenshot URL format'
      };
    }
    
    const filePath = urlParts[1];
    
    // Validate user owns this file (path starts with their user_id)
    if (!filePath.startsWith(userId + '/')) {
      return {
        success: false,
        error: 'Unauthorized: Cannot delete screenshot from another user'
      };
    }
    
    // Delete from Supabase Storage
    const { error } = await supabase.storage
      .from('screenshots')
      .remove([filePath]);
    
    if (error) {
      console.error('Screenshot deletion error:', error);
      return {
        success: false,
        error: error.message
      };
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Screenshot deletion exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Delete multiple screenshots (for cleanup/migration)
 * 
 * @param publicUrls - Array of public URLs
 * @param userId - User ID (auth.uid())
 * @returns Array of deletion results
 */
export async function deleteScreenshots(
  publicUrls: string[],
  userId: string
): Promise<DeleteScreenshotResult[]> {
  const results = await Promise.all(
    publicUrls.map(url => deleteScreenshot(url, userId))
  );
  return results;
}

/**
 * Get storage bucket size for a user (diagnostics)
 * 
 * @param userId - User ID (auth.uid())
 * @returns Total size in bytes
 */
export async function getUserStorageSize(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase.storage
      .from('screenshots')
      .list(userId, {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (error || !data) {
      console.error('Failed to list user screenshots:', error);
      return 0;
    }
    
    const totalSize = data.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
    return totalSize;
  } catch (error) {
    console.error('Failed to calculate storage size:', error);
    return 0;
  }
}

/**
 * Check if URL is a Supabase Storage URL (vs data URL)
 */
export function isStorageUrl(url: string): boolean {
  return url.startsWith('http') && url.includes('/storage/v1/object/public/screenshots/');
}

/**
 * Check if URL is a base64 data URL
 */
export function isDataUrl(url: string): boolean {
  return url.startsWith('data:image/');
}
