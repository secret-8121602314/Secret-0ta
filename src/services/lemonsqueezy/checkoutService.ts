/**
 * LemonSqueezy Checkout Service
 * 
 * Handles opening LemonSqueezy checkout overlay using the official SDK
 * Uses the Checkouts API for reliable checkout URL generation
 */

import { LEMONSQUEEZY_CONFIG, PRICING_PLANS, type TierKey } from './constants';
import type { User } from '../../types';

export interface CheckoutOptions {
  tier: TierKey;
  user: User;
  redirectUrl?: string;
}

/**
 * Create checkout URL via LemonSqueezy API
 * This is more reliable than constructing URLs from variant IDs
 */
async function createCheckoutUrl(variantId: string, user: User, redirectUrl?: string): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_LEMONSQUEEZY_API_KEY;
    const storeId = LEMONSQUEEZY_CONFIG.storeId;

    console.log('🔄 Creating checkout via API...');
    console.log('   API Key present:', !!apiKey);
    console.log('   Store ID:', storeId);
    console.log('   Variant ID:', variantId);
    console.log('   User Email:', user.email);

    if (!apiKey) {
      throw new Error('VITE_LEMONSQUEEZY_API_KEY is not configured in .env');
    }

    if (!storeId) {
      throw new Error('VITE_LEMONSQUEEZY_STORE_ID is not configured in .env');
    }

    if (!variantId) {
      throw new Error('Variant ID is missing');
    }

    const payload = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: user.email,
            custom: {
              // CRITICAL: Webhook expects 'auth_user_id', not 'user_id'
              auth_user_id: user.authUserId,
              user_id: user.id, // Keep for backwards compatibility
            },
          },
          checkout_options: {
            embed: true,
            button_color: '#6366f1',
          },
          product_options: {
            redirect_url: redirectUrl || `${window.location.origin}/payment-success`,
          },
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: String(storeId), // Ensure it's a string
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: String(variantId), // Ensure it's a string
            },
          },
        },
      },
    };

    console.log('📤 API Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('📥 API Response Status:', response.status);

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const error = await response.json();
        console.error('❌ Checkouts API Error Response:', error);
        errorMessage = error.errors?.[0]?.detail || error.message || response.statusText;
      } catch (e) {
        console.error('❌ Failed to parse error response:', e);
      }
      throw new Error(`Failed to create checkout: ${errorMessage} (Status: ${response.status})`);
    }

    const data = await response.json();
    console.log('📥 API Response Data:', data);

    const checkoutUrl = data.data.attributes.url;
    
    if (!checkoutUrl) {
      throw new Error('No checkout URL in response');
    }

    console.log('✅ Checkout URL created:', checkoutUrl);
    return checkoutUrl;
  } catch (error) {
    console.error('❌ Error creating checkout URL:', error);
    throw error;
  }
}

export interface CheckoutCallbacks {
  onClose?: () => void;
  onSuccess?: () => void;
}

// Store callbacks globally so they persist across the checkout lifecycle
let currentCallbacks: CheckoutCallbacks | undefined;

// Flag to ensure Setup is only called once
let isSetupInitialized = false;

/**
 * Initialize LemonSqueezy SDK and setup event listener (only once)
 */
function initializeLemonSqueezy(): void {
  if (isSetupInitialized) {
    return;
  }

  // First, call createLemonSqueezy if it exists (required by LemonSqueezy SDK)
  if (typeof window.createLemonSqueezy === 'function') {
    console.log('🍋 Calling createLemonSqueezy()');
    window.createLemonSqueezy();
  }

  if (!window.LemonSqueezy) {
    console.warn('LemonSqueezy SDK not available after initialization');
    return;
  }

  console.log('🍋 Setting up LemonSqueezy event handler');
  
  window.LemonSqueezy.Setup({
    eventHandler: (event: { event: string }) => {
      console.log('🍋 LemonSqueezy Event:', event.event, event);
      
      if (event.event === 'Checkout.Success') {
        console.log('✅ Checkout completed successfully - calling onSuccess callback');
        if (currentCallbacks?.onSuccess) {
          currentCallbacks.onSuccess();
        }
        currentCallbacks = undefined; // Clear callbacks after use
      } else if (event.event === 'Checkout.Close') {
        console.log('❌ Checkout closed - calling onClose callback');
        if (currentCallbacks?.onClose) {
          currentCallbacks.onClose();
        }
        currentCallbacks = undefined; // Clear callbacks after use
      }
    },
  });
  
  isSetupInitialized = true;
  console.log('🍋 LemonSqueezy initialized successfully');
}

/**
 * Open LemonSqueezy checkout overlay for a specific tier
 */
export async function openCheckout(
  options: CheckoutOptions,
  callbacks?: CheckoutCallbacks
): Promise<void> {
  const { tier, user, redirectUrl } = options;
  
  const plan = PRICING_PLANS[tier];
  const variantId = plan.variantId;

  if (!variantId) {
    throw new Error(`No variant ID configured for tier: ${tier}`);
  }

  if (!window.LemonSqueezy) {
    console.error('LemonSqueezy SDK not loaded. Make sure lemon.js script is included in your HTML.');
    throw new Error('LemonSqueezy SDK not available');
  }

  try {
    console.log('🔄 Creating checkout URL via API...');
    console.log('   Variant ID:', variantId);
    console.log('   Tier:', tier);
    console.log('   User:', user.email);

    // Initialize LemonSqueezy Setup once
    initializeLemonSqueezy();
    
    // Store callbacks for this checkout
    currentCallbacks = callbacks;

    // Create checkout URL via API (recommended approach)
    const checkoutUrl = await createCheckoutUrl(variantId, user, redirectUrl);
    
    console.log('✅ Checkout URL created:', checkoutUrl);
    console.log('🔗 Opening LemonSqueezy checkout overlay...');
    
    window.LemonSqueezy.Url.Open(checkoutUrl);
  } catch (error) {
    console.error('❌ Error opening LemonSqueezy checkout:', error);
    throw error;
  }
}

/**
 * Get customer portal URL for subscription management
 */
export function getCustomerPortalUrl(): string {
  return `${LEMONSQUEEZY_CONFIG.storeUrl}/billing`;
}

/**
 * Format price for display
 */
export function formatPrice(tier: TierKey): string {
  const plan = PRICING_PLANS[tier];
  return `$${plan.price}/${plan.interval}`;
}

/**
 * Get variant ID for a specific tier
 */
export function getVariantId(tier: TierKey): string {
  const plan = PRICING_PLANS[tier];
  if (!plan.variantId) {
    throw new Error(`No variant ID configured for tier: ${tier}`);
  }
  return plan.variantId;
}

/**
 * TypeScript declaration for LemonSqueezy global
 */
declare global {
  interface Window {
    LemonSqueezy: {
      Setup: (config: { eventHandler: (event: { event: string }) => void }) => void;
      Url: {
        Open: (url: string) => void;
        Close: () => void;
      };
      Affiliate: {
        GetID: () => string;
        Build: (config: unknown) => void;
      };
    };
    createLemonSqueezy: () => void;
  }
}

