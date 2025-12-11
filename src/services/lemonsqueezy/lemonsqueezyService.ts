/**
 * LemonSqueezy Service
 * 
 * Fetches subscription data from Supabase for the authenticated user
 */

import { supabase } from '../../lib/supabase';

export interface SubscriptionData {
  id: string;
  lemon_subscription_id: string;
  user_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'paused' | 'past_due' | 'unpaid';
  tier: 'pro' | 'vanguard_pro';
  lemon_variant_id: string;
  lemon_product_id: string;
  lemon_customer_id: string;
  lemon_order_id: string;
  renews_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

// Use any to bypass TypeScript type checking since 'subscriptions' table
// is not in the generated Supabase types yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAny = supabase as any;

/**
 * Get user's active subscription from Supabase
 */
export async function getUserSubscription(userId: string): Promise<SubscriptionData | null> {
  try {
    const { data, error } = await supabaseAny
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }

    return data as SubscriptionData;
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }
}

/**
 * Get all subscriptions for a user (including cancelled/expired)
 */
export async function getUserSubscriptions(userId: string): Promise<SubscriptionData[]> {
  try {
    const { data, error } = await supabaseAny
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []) as SubscriptionData[];
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    return [];
  }
}

/**
 * Check if user has an active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  return subscription !== null && subscription.status === 'active';
}
