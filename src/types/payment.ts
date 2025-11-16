/**
 * Payment and Subscription Types
 * 
 * This file defines types for payment integration and subscription management.
 * Currently prepared for future implementation with Stripe or other payment providers.
 */

export type PaymentProvider = 'stripe' | 'paypal' | 'other';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'refunded';

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'unpaid'
  | 'incomplete'
  | 'trialing';

export type BillingInterval = 'month' | 'year';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'paypal';
  last4?: string;
  brand?: string; // 'visa', 'mastercard', etc.
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  tier: 'free' | 'pro' | 'vanguard_pro';
  price: number;
  currency: string;
  interval: BillingInterval;
  features: string[];
  stripePriceId?: string; // For future Stripe integration
  isPopular?: boolean;
  discount?: {
    percentage: number;
    validUntil?: number;
  };
}

export interface Subscription {
  id: string;
  userId: string;
  tier: 'free' | 'pro' | 'vanguard_pro';
  status: SubscriptionStatus;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  trialEnd?: number;
  stripeSubscriptionId?: string; // For future Stripe integration
  stripeCustomerId?: string;
  paymentMethodId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PaymentIntent {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  tier: 'pro' | 'vanguard_pro';
  interval: BillingInterval;
  stripePaymentIntentId?: string;
  createdAt: number;
  completedAt?: number;
}

export interface Invoice {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  invoiceUrl?: string;
  pdfUrl?: string;
  createdAt: number;
  paidAt?: number;
}

export interface PaymentConfig {
  provider: PaymentProvider;
  publicKey: string;
  isTestMode: boolean;
  supportedCurrencies: string[];
  supportedPaymentMethods: ('card' | 'bank_account' | 'paypal')[];
}

/**
 * Payment service interface for future implementation
 */
export interface IPaymentService {
  // Initialization
  initialize(config: PaymentConfig): Promise<void>;
  
  // Subscription management
  createSubscription(userId: string, tier: 'pro' | 'vanguard_pro', interval: BillingInterval): Promise<Subscription>;
  updateSubscription(subscriptionId: string, tier: 'pro' | 'vanguard_pro'): Promise<Subscription>;
  cancelSubscription(subscriptionId: string, immediate?: boolean): Promise<void>;
  reactivateSubscription(subscriptionId: string): Promise<Subscription>;
  
  // Payment methods
  addPaymentMethod(userId: string, paymentMethodData: unknown): Promise<PaymentMethod>;
  removePaymentMethod(paymentMethodId: string): Promise<void>;
  setDefaultPaymentMethod(paymentMethodId: string): Promise<void>;
  getPaymentMethods(userId: string): Promise<PaymentMethod[]>;
  
  // Invoices
  getInvoices(userId: string, limit?: number): Promise<Invoice[]>;
  downloadInvoice(invoiceId: string): Promise<Blob>;
  
  // Webhooks
  handleWebhook(event: unknown): Promise<void>;
}
