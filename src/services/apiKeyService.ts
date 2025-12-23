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
  static async saveGeminiKey(user: User, apiKey: string): Promise<void> {
    try {
      // Validate API key format
      if (!apiKey.startsWith('AIzaSy')) {
        throw new Error('Invalid API key format. Gemini API keys start with "AIzaSy"');
      }

      // Test the API key first
      toastService.info('Testing your API key...');
      const testResult = await this.testGeminiKey(apiKey);
      
      if (!testResult.valid) {
        await BYOKAnalytics.trackKeyVerification(user, 'google', false, testResult.error);
        throw new Error(testResult.error || 'Invalid API key');
      }

      // Save to database (unencrypted for now - will be encrypted in Edge Function)
      // In production, you should encrypt before storing
      const { error } = await supabase
        .from('users')
        .update({
          gemini_api_key_encrypted: apiKey, // TODO: Encrypt client-side before storing
          uses_custom_gemini_key: true,
          custom_key_verified_at: new Date().toISOString(),
          had_custom_key_before: true,
          updated_at: new Date().toISOString()
        })
        .eq('auth_user_id', user.authUserId);

      if (error) {
        console.error('[ApiKeyService] Error saving API key:', error);
        throw new Error('Failed to save API key');
      }

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
          had_custom_key_before: supabase.raw('CASE WHEN uses_custom_gemini_key = true THEN true ELSE had_custom_key_before END'),
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
    if (!customKeyVerifiedAt) return true;
    
    const verifiedDate = new Date(customKeyVerifiedAt);
    const daysSinceVerification = (Date.now() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysSinceVerification > 30;
  }
}
