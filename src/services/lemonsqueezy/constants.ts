/**
 * LemonSqueezy Configuration Constants
 * 
 * Centralized store IDs, variant IDs, and pricing information
 */

export const LEMONSQUEEZY_CONFIG = {
  storeId: import.meta.env.VITE_LEMONSQUEEZY_STORE_ID || '',
  productId: import.meta.env.VITE_LEMONSQUEEZY_PRODUCT_ID || '',
  variants: {
    pro: import.meta.env.VITE_LEMONSQUEEZY_VARIANT_PRO || '',
    vanguard_pro: import.meta.env.VITE_LEMONSQUEEZY_VARIANT_VANGUARD || '',
  },
  storeUrl: 'https://otagon.lemonsqueezy.com',
} as const;

export const PRICING_PLANS = {
  pro: {
    name: 'Pro',
    price: 5,
    currency: 'USD',
    interval: 'month' as const,
    variantId: LEMONSQUEEZY_CONFIG.variants.pro,
    features: [
      '350 text queries / month',
      '150 image queries / month',
      'Advanced AI capabilities',
      'Batch screenshot analysis',
      'Hands-free voice mode',
      'Priority support',
      'No advertisements',
    ],
    limits: {
      text: 350,
      image: 150,
    },
  },
  vanguard_pro: {
    name: 'Vanguard Pro',
    price: 35,
    currency: 'USD',
    interval: 'year' as const,
    variantId: LEMONSQUEEZY_CONFIG.variants.vanguard_pro,
    features: [
      'Everything in Pro',
      'Save 42% vs monthly',
      'Lifetime price guarantee',
      'Exclusive Founder\'s Badge',
      'Early access to new features',
      'VIP Discord role',
    ],
    limits: {
      text: 350,
      image: 150,
    },
  },
} as const;

export type TierKey = keyof typeof PRICING_PLANS;
