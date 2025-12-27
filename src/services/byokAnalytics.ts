/**
 * BYOK (Bring Your Own Key) Analytics Service
 * Tracks custom API key events to the user_analytics table
 */

import { supabase } from '../lib/supabase';
import type { User } from '../types';
import { Json } from '../types/database';

export class BYOKAnalytics {
  /**
   * Track when user adds their API key
   */
  static async trackKeyAdded(
    user: User,
    provider: 'google',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await supabase.from('user_analytics').insert({
        user_id: user.id,
        auth_user_id: user.authUserId,
        event_type: 'byok_key_added',
        event_data: {
          provider,
          tier: user.tier,
          ...metadata,
          timestamp: new Date().toISOString()
        } as Json
      });
    } catch (error) {
      console.error('[BYOKAnalytics] Error tracking key_added:', error);
      // Don't throw - analytics failures shouldn't break functionality
    }
  }

  /**
   * Track when user removes their API key
   */
  static async trackKeyRemoved(
    user: User,
    provider: 'google',
    reason: 'user_action' | 'tier_change' | 'invalid_key' | 'expired'
  ): Promise<void> {
    try {
      await supabase.from('user_analytics').insert({
        user_id: user.id,
        auth_user_id: user.authUserId,
        event_type: 'byok_key_removed',
        event_data: {
          provider,
          reason,
          timestamp: new Date().toISOString()
        } as Json
      });
    } catch (error) {
      console.error('[BYOKAnalytics] Error tracking key_removed:', error);
    }
  }

  /**
   * Track key verification success/failure
   */
  static async trackKeyVerification(
    user: User,
    provider: 'google',
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      await supabase.from('user_analytics').insert({
        user_id: user.id,
        auth_user_id: user.authUserId,
        event_type: 'byok_key_verified',
        event_data: {
          provider,
          success,
          error,
          timestamp: new Date().toISOString()
        } as Json
      });
    } catch (error) {
      console.error('[BYOKAnalytics] Error tracking key_verified:', error);
    }
  }

  /**
   * Track each BYOK request (called from Edge Functions)
   * This is tracked server-side for accuracy
   */
  static async trackBYOKRequest(
    userId: string,
    authUserId: string,
    provider: 'google',
    model: string,
    tokensUsed: number,
    requestType: 'chat' | 'image_analysis' | 'subtabs' | 'background' | 'summarization'
  ): Promise<void> {
    try {
      await supabase.from('user_analytics').insert({
        user_id: userId,
        auth_user_id: authUserId,
        event_type: 'byok_request_made',
        event_data: {
          provider,
          model,
          tokensUsed,
          requestType,
          timestamp: new Date().toISOString()
        } as Json
      });
    } catch (error) {
      console.error('[BYOKAnalytics] Error tracking byok_request:', error);
    }
  }

  /**
   * Get BYOK usage statistics for a user
   */
  static async getBYOKStats(userId: string): Promise<{
    totalRequests: number;
    totalTokens: number;
    providers: string[];
    lastUsed: string | null;
  }> {
    try {
      const { data } = await supabase
        .from('user_analytics')
        .select('event_data, created_at')
        .eq('user_id', userId)
        .eq('event_type', 'byok_request_made')
        .order('created_at', { ascending: false });

      const totalRequests = data?.length || 0;
      const totalTokens = data?.reduce((sum, record) => {
        const eventData = record.event_data as Record<string, unknown>;
        return sum + ((eventData.tokensUsed as number) || 0);
      }, 0) || 0;
      
      const providers = [...new Set(
        data?.map(r => (r.event_data as Record<string, unknown>).provider) || []
      )];

      const lastUsed = data && data.length > 0 ? data[0].created_at : null;

      return { totalRequests, totalTokens, providers, lastUsed };
    } catch (error) {
      console.error('[BYOKAnalytics] Error getting BYOK stats:', error);
      return { totalRequests: 0, totalTokens: 0, providers: [], lastUsed: null };
    }
  }
}
