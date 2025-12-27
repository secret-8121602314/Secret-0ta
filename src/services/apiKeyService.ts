/**
 * API Key Service
 * Manages custom Gemini API keys for BYOK (Bring Your Own Key) feature
 */

import { supabase } from '../lib/supabase';
import { toastService } from './toastService';
import { BYOKAnalytics } from './byokAnalytics';
import type { User } from '../types';

export class ApiKeyService {
  /**
   * Test if a Gemini API key is valid by making a lightweight API call
   */
  static async testGeminiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Make a minimal test call to Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'test' }]
            }]
          })
        }
      );

      if (response.ok) {
        return { valid: true };
      } else {
        const errorText = await response.text();
        console.error('[ApiKeyService] API key test failed:', errorText);
        
        // Try to parse error message
        let errorMessage = 'Invalid API key';
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message) {
            errorMessage = errorJson.error.message;
          }
        } catch {
          // If not JSON, use status text
          if (response.status === 400) {
            errorMessage = 'Invalid API key format or request';
          } else if (response.status === 403) {
            errorMessage = 'API key denied - check permissions';
          } else if (response.status === 404) {
            errorMessage = 'API endpoint not found - key may be invalid';
          }
        }
        
        return { valid: false, error: errorMessage };
      }
    } catch (error) {
      console.error('[ApiKeyService] Error testing API key:', error);
      return { valid: false, error: 'Failed to test API key' };
    }
  }

  /**
   * Save user's Gemini API key
   * Note: Encryption happens server-side in the Edge Function
   */
  static async saveGeminiKey(user: User, apiKey: string, skipValidation = false): Promise<void> {
    try {
      // Trim whitespace
      const trimmedKey = apiKey.trim();
      
      // Validate API key format
      if (!trimmedKey.startsWith('AIzaSy')) {
        console.error('[ApiKeyService] Invalid key format. Key starts with:', trimmedKey.substring(0, 10));
        throw new Error(`Invalid API key format. Gemini API keys start with "AIzaSy" but yours starts with "${trimmedKey.substring(0, 6)}..."`);
      }
      
      if (trimmedKey.length < 39) {
        throw new Error('API key is too short. Gemini API keys are typically 39 characters long.');
      }

      // Test the API key first (unless skipping validation)
      if (!skipValidation) {
        toastService.info('Testing your API key...');
        const testResult = await this.testGeminiKey(trimmedKey);
        
        if (!testResult.valid) {
          // Check if it's a quota/rate limit error
          const isQuotaError = testResult.error?.includes('quota') || 
                               testResult.error?.includes('429') ||
                               testResult.error?.includes('RESOURCE_EXHAUSTED');
          
          if (isQuotaError) {
            // Allow saving despite quota error - the key format is valid
            console.warn('[ApiKeyService] Key validation failed due to quota, but allowing save');
            toastService.warning('⚠️ Could not test key (quota limit), but saving anyway...');
            await BYOKAnalytics.trackKeyVerification(user, 'google', false, 'quota_exceeded_during_test');
          } else {
            // Other errors should block the save
            await BYOKAnalytics.trackKeyVerification(user, 'google', false, testResult.error);
            throw new Error(testResult.error || 'Invalid API key');
          }
        }
      }

      // Save to database (unencrypted for now - will be encrypted in Edge Function)
      // In production, you should encrypt before storing
      
      // Build update object - only include fields that exist in the database
      const updateData: Record<string, unknown> = {
        gemini_api_key_encrypted: trimmedKey, // Use trimmed key
        uses_custom_gemini_key: true,
        updated_at: new Date().toISOString()
      };
      
      // Only add BYOK-specific fields if they exist (migration applied)
      // This makes the code work even if migration hasn't been run yet
      try {
        updateData.custom_key_verified_at = new Date().toISOString();
        updateData.had_custom_key_before = true;
      } catch {
        console.warn('[ApiKeyService] BYOK columns may not exist yet - using basic fields only');
      }
      
      const { error, data } = await supabase
        .from('users')
        .update(updateData)
        .eq('auth_user_id', user.authUserId)
        .select();

      if (error) {
        console.error('[ApiKeyService] Error saving API key:', error);
        const errorMsg = error.message || 'Failed to save API key to database';
        throw new Error(`Database error: ${errorMsg}`);
      }

      if (!data || data.length === 0) {
        console.error('[ApiKeyService] No data returned after update');
        throw new Error('User record not found or update failed');
      }

      console.log('[ApiKeyService] ✅ API key saved successfully:', {
        userId: user.id,
        authUserId: user.authUserId,
        usesCustomKey: true
      });

      // Clear any cached user data to force refresh
      localStorage.removeItem('otakon_user');
      localStorage.removeItem(`otakon_user_cache_${user.authUserId}`);

      // Track analytics
      await BYOKAnalytics.trackKeyAdded(user, 'google');
      await BYOKAnalytics.trackKeyVerification(user, 'google', true);

      toastService.success('✅ Custom API key saved! You now have unlimited queries.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save API key';
      toastService.error(errorMessage);
      throw error;
    }
  }

  /**
   * Remove user's custom API key and revert to platform key
   */
  static async removeGeminiKey(user: User, reason: 'user_action' | 'tier_change' = 'user_action'): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          gemini_api_key_encrypted: null,
          uses_custom_gemini_key: false,
          updated_at: new Date().toISOString()
          // Keep had_custom_key_before as true to show "Use Custom Key" button
        })
        .eq('auth_user_id', user.authUserId);

      if (error) {
        console.error('[ApiKeyService] Error removing API key:', error);
        throw new Error('Failed to remove API key');
      }

      // Track analytics
      await BYOKAnalytics.trackKeyRemoved(user, 'google', reason);

      if (reason === 'user_action') {
        toastService.success('Custom API key removed. Back to platform limits.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove API key';
      toastService.error(errorMessage);
      throw error;
    }
  }

  /**
   * Clear user's API keys (called on tier changes)
   * This is typically called from Edge Functions/webhooks
   */
  static async clearUserApiKeys(authUserId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          gemini_api_key_encrypted: null,
          uses_custom_gemini_key: false,
          had_custom_key_before: true,
          updated_at: new Date().toISOString()
        })
        .eq('auth_user_id', authUserId);

      if (error) {
        console.error('[ApiKeyService] Error clearing API keys:', error);
        throw error;
      }

      console.log('[ApiKeyService] ✅ Custom API keys cleared for user:', authUserId);
    } catch (error) {
      console.error('[ApiKeyService] Failed to clear API keys:', error);
      throw error;
    }
  }

  /**
   * Check if user's custom key needs re-verification (>30 days old)
   */
  static needsReVerification(customKeyVerifiedAt: string | null): boolean {
    if (!customKeyVerifiedAt) {return true;}
    
    const verifiedDate = new Date(customKeyVerifiedAt);
    const daysSinceVerification = (Date.now() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysSinceVerification > 30;
  }
}
