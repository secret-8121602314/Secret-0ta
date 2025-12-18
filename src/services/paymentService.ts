/**
 * Payment Service - LemonSqueezy Integration Bridge
 * 
 * This service bridges the payment API to LemonSqueezy services,
 * allowing the rest of the app to use a consistent payment interface
 * regardless of the underlying payment provider.
 */

import type { 
  PaymentConfig, 
  Subscription, 
  PaymentMethod, 
  Invoice,
  IPaymentService,
  BillingInterval 
} from '../types/payment';
import { 
  openCheckout,
  getUserSubscription,
  getUserSubscriptions,
  getCustomerPortalUrl,
  PRICING_PLANS,
  type TierKey,
} from './lemonsqueezy';
import type { User } from '../types';

class PaymentService implements IPaymentService {
  private isInitialized = false;
  private config: PaymentConfig | null = null;

  /**
   * Get current configuration
   */
  getConfig(): PaymentConfig | null {
    return this.config;
  }

  /**
   * Initialize payment service with configuration
   */
  async initialize(config: PaymentConfig): Promise<void> {
    this.config = config;
    this.isInitialized = true;
  }

  /**
   * Create a new subscription (opens LemonSqueezy checkout)
   */
  async createSubscription(
    userId: string, 
    tier: 'pro' | 'vanguard_pro', 
    _interval: BillingInterval,
    user?: User
  ): Promise<Subscription> {
    if (!user) {
      throw new Error('User object required for checkout');
    }

    // Open LemonSqueezy checkout
    await openCheckout({
      tier: tier as TierKey,
      user,
      redirectUrl: `${window.location.origin}/payment-success`,
    });

    // Return a pending subscription object
    // The actual subscription will be created via webhook
    return {
      id: 'pending',
      userId,
      tier,
      status: 'pending',
      interval: _interval,
      startDate: new Date().toISOString(),
      endDate: null,
      cancelAtPeriodEnd: false,
    } as Subscription;
  }

  /**
   * Update an existing subscription
   */
  async updateSubscription(subscriptionId: string, tier: 'pro' | 'vanguard_pro'): Promise<Subscription> {
    // LemonSqueezy handles subscription updates via customer portal
    console.warn('Subscription updates should be done via customer portal:', getCustomerPortalUrl());
    throw new Error('Please use the customer portal to update your subscription');
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, immediate = false): Promise<void> {
    // LemonSqueezy handles cancellations via customer portal
    console.warn('Subscription cancellations should be done via customer portal:', getCustomerPortalUrl());
    throw new Error('Please use the customer portal to cancel your subscription');
  }

  /**
   * Reactivate a canceled subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<Subscription> {
    console.warn('Subscription reactivation should be done via customer portal:', getCustomerPortalUrl());
    throw new Error('Please use the customer portal to reactivate your subscription');
  }

  /**
   * Get user's subscriptions from Supabase
   */
  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    const subscriptions = await getUserSubscriptions(userId);
    
    // Map to Payment type format
    return subscriptions.map(sub => ({
      id: sub.lemon_subscription_id,
      userId: sub.user_id,
      tier: sub.tier,
      status: sub.status === 'active' ? 'active' : 'cancelled',
      interval: sub.tier === 'vanguard_pro' ? 'year' : 'month',
      startDate: sub.created_at,
      endDate: sub.ends_at,
      cancelAtPeriodEnd: sub.status === 'cancelled' && sub.ends_at !== null,
    })) as Subscription[];
  }

  /**
   * Get user's active subscription
   */
  async getActiveSubscription(userId: string): Promise<Subscription | null> {
    const subscription = await getUserSubscription(userId);
    
    if (!subscription) {
      return null;
    }

    return {
      id: subscription.lemon_subscription_id,
      userId: subscription.user_id,
      tier: subscription.tier,
      status: subscription.status === 'active' ? 'active' : 'cancelled',
      interval: subscription.tier === 'vanguard_pro' ? 'year' : 'month',
      startDate: subscription.created_at,
      endDate: subscription.ends_at,
      cancelAtPeriodEnd: subscription.status === 'cancelled' && subscription.ends_at !== null,
    } as Subscription;
  }

  /**
   * Payment methods are managed via LemonSqueezy customer portal
   */
  async addPaymentMethod(_userId: string, _paymentMethodData: unknown): Promise<PaymentMethod> {
    console.warn('Payment methods should be managed via customer portal:', getCustomerPortalUrl());
    throw new Error('Please use the customer portal to manage payment methods');
  }

  async removePaymentMethod(_paymentMethodId: string): Promise<void> {
    throw new Error('Please use the customer portal to manage payment methods');
  }

  async setDefaultPaymentMethod(_paymentMethodId: string): Promise<void> {
    throw new Error('Please use the customer portal to manage payment methods');
  }

  async getPaymentMethods(_userId: string): Promise<PaymentMethod[]> {
    // LemonSqueezy doesn't expose payment methods via API
    return [];
  }

  /**
   * Invoices are managed via LemonSqueezy customer portal
   */
  async getInvoices(_userId: string, _limit = 10): Promise<Invoice[]> {
    console.warn('Invoices should be accessed via customer portal:', getCustomerPortalUrl());
    return [];
  }

  async downloadInvoice(_invoiceId: string): Promise<Blob> {
    throw new Error('Please use the customer portal to download invoices');
  }

  /**
   * Webhooks are handled by Supabase Edge Function
   */
  async handleWebhook(_event: unknown): Promise<void> {
    console.warn('Webhooks are handled by Supabase Edge Function');
    throw new Error('Webhooks are handled server-side');
  }

  /**
   * Get pricing plans from LemonSqueezy constants
   */
  getPricingPlans() {
    return [
      {
        id: 'free',
        name: 'Free',
        tier: 'free' as const,
        price: 0,
        currency: 'USD',
        interval: 'month' as const,
        features: [
          '20 text queries/month',
          '15 image queries/month',
          'Basic conversation features',
          'Standard response quality'
        ]
      },
      {
        id: 'pro-monthly',
        name: PRICING_PLANS.pro.name,
        tier: 'pro' as const,
        price: PRICING_PLANS.pro.price,
        currency: PRICING_PLANS.pro.currency,
        interval: PRICING_PLANS.pro.interval,
        features: PRICING_PLANS.pro.features,
        isPopular: true
      },
      {
        id: 'vanguard-yearly',
        name: PRICING_PLANS.vanguard_pro.name,
        tier: 'vanguard_pro' as const,
        price: PRICING_PLANS.vanguard_pro.price,
        currency: PRICING_PLANS.vanguard_pro.currency,
        interval: PRICING_PLANS.vanguard_pro.interval,
        features: PRICING_PLANS.vanguard_pro.features,
      }
    ];
  }

  /**
   * Get customer portal URL
   */
  getCustomerPortalUrl(): string {
    return getCustomerPortalUrl();
  }
}

export const paymentService = new PaymentService();

