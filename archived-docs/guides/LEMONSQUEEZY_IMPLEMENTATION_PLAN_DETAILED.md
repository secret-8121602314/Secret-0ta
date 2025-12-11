# 🍋 LemonSqueezy Payment Integration Plan - Detailed Implementation Guide
## Otagon App - Post-Login Payment Flow

---

## 📋 Executive Summary

**Your Store Details:**
- Product ID: `724192`
- Variant ID (Vanguard Pro): `1139844` 
- Variant ID (Pro): `1139861`

**Core Requirement:** Payment integration ONLY after user login (not on landing page)

**Implementation Phases:**
1. Database setup (subscriptions tracking)
2. Environment configuration
3. Backend webhook handler (Supabase Edge Function)
4. Frontend payment components (post-login only)
5. User dashboard & subscription management
6. Testing & deployment

---

## 🎯 Integration Points (Post-Login Only)

### ❌ NO Payment on Landing Page
- Landing page CTAs will ONLY redirect to login/signup
- "Coming Soon" buttons will become "Get Started" → redirect to auth
- Pricing display remains informational only

### ✅ Payment Touchpoints (After Login)

1. **Settings Modal - Tier & Usage Tab**
   - Primary upgrade location
   - Shows current tier status
   - "Upgrade to Pro" or "Upgrade to Vanguard Pro" buttons
   - Manage subscription for paid users

2. **Credit Modal**
   - When user runs out of queries
   - "Upgrade Now" button → Payment modal

3. **Trial Banner**
   - Offer 7-day Pro trial
   - After trial expires → Upgrade CTA

4. **In-App Prompts**
   - Pro feature gates (batch screenshots, hands-free mode)
   - "Unlock this feature" → Payment modal

---

## 🗄️ Phase 1: Database Schema Setup

### Create Subscriptions Table

```sql
-- ========================================
-- LEMONSQUEEZY SUBSCRIPTIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
    -- Primary Keys
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- LemonSqueezy IDs
    lemon_subscription_id TEXT NOT NULL UNIQUE,
    lemon_customer_id TEXT NOT NULL,
    lemon_order_id TEXT,
    lemon_product_id TEXT NOT NULL DEFAULT '724192',
    lemon_variant_id TEXT NOT NULL,
    
    -- Subscription Details
    tier TEXT NOT NULL CHECK (tier IN ('pro', 'vanguard_pro')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
        'active',
        'cancelled',
        'expired',
        'past_due',
        'paused',
        'unpaid',
        'on_trial'
    )),
    
    -- Billing Information
    billing_interval TEXT CHECK (billing_interval IN ('month', 'year')),
    price_amount INTEGER NOT NULL, -- in cents
    currency TEXT DEFAULT 'USD',
    
    -- Important Dates
    trial_ends_at TIMESTAMPTZ,
    renews_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ, -- for cancelled subscriptions
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT unique_user_active_subscription UNIQUE NULLS NOT DISTINCT (user_id, status)
);

-- Index for faster lookups
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_lemon_id ON public.subscriptions(lemon_subscription_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() IN (
        SELECT auth_user_id FROM public.users WHERE id = subscriptions.user_id
    ));

-- Update timestamp trigger
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
```

### Create Payment Events Log Table (Optional but Recommended)

```sql
-- ========================================
-- PAYMENT EVENTS LOG
-- ========================================

CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Event Details
    event_type TEXT NOT NULL, -- subscription_created, subscription_updated, subscription_cancelled, etc.
    event_name TEXT NOT NULL,
    lemon_event_id TEXT UNIQUE,
    
    -- Raw webhook payload
    payload JSONB NOT NULL,
    
    -- Processing status
    processed BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_events_subscription ON public.payment_events(subscription_id);
CREATE INDEX idx_payment_events_user ON public.payment_events(user_id);
CREATE INDEX idx_payment_events_type ON public.payment_events(event_type);

-- Enable RLS
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment events"
    ON public.payment_events FOR SELECT
    USING (auth.uid() IN (
        SELECT auth_user_id FROM public.users WHERE id = payment_events.user_id
    ));
```

### Update Users Table

```sql
-- Add subscription reference to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS active_subscription_id UUID REFERENCES public.subscriptions(id);

-- Add LemonSqueezy customer ID
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS lemon_customer_id TEXT;

CREATE INDEX idx_users_active_subscription ON public.users(active_subscription_id);
CREATE INDEX idx_users_lemon_customer ON public.users(lemon_customer_id);
```

---

## 🔑 Phase 2: Environment Configuration

### Update `.env.local`

```env
# Existing Supabase Configuration
VITE_SUPABASE_URL=https://qajcxgkqloumogioomiz.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_GoW6G_umt1lFF-KPbbm-Ow_D2PYxPLw
VITE_USE_ROUTER=true

# LemonSqueezy Configuration
VITE_LEMONSQUEEZY_STORE_ID=your_store_id_here
VITE_LEMONSQUEEZY_PRODUCT_ID=724192

# Variant IDs
VITE_LEMONSQUEEZY_VARIANT_PRO=1139861
VITE_LEMONSQUEEZY_VARIANT_VANGUARD=1139844

# Public API key (for checkout only - safe to expose)
VITE_LEMONSQUEEZY_PUBLIC_KEY=your_public_key_here
```

### Server-Side Environment (Supabase Edge Function)

```env
# In Supabase Dashboard → Edge Functions → Secrets
LEMONSQUEEZY_API_KEY=your_secret_api_key_here
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_signing_secret
LEMONSQUEEZY_STORE_ID=your_store_id_here
```

---

## ⚙️ Phase 3: Backend - Supabase Edge Function

### Create Edge Function: `handle-lemonsqueezy-webhook`

**File:** `supabase/functions/handle-lemonsqueezy-webhook/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
};

interface WebhookPayload {
  meta: {
    event_name: string;
    custom_data?: {
      user_id?: string;
      auth_user_id?: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: {
      store_id: number;
      customer_id: number;
      order_id: number;
      product_id: number;
      variant_id: number;
      status: string;
      trial_ends_at: string | null;
      renews_at: string;
      ends_at: string | null;
      billing_anchor: number;
      first_subscription_item: {
        id: number;
        subscription_id: number;
        price_id: number;
        quantity: number;
        is_usage_based: boolean;
      };
    };
  };
}

// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  const digest = hmac.digest('hex');
  return digest === signature;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify webhook signature
    const signature = req.headers.get('x-signature');
    const rawBody = await req.text();
    const webhookSecret = Deno.env.get('LEMONSQUEEZY_WEBHOOK_SECRET') ?? '';

    if (!signature || !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: WebhookPayload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;
    const subscriptionData = payload.data.attributes;

    console.log('Webhook received:', eventName);

    // Extract user ID from custom data
    const authUserId = payload.meta.custom_data?.auth_user_id;
    if (!authUserId) {
      console.error('No user ID in webhook payload');
      return new Response(
        JSON.stringify({ error: 'No user ID provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from database
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('id, tier')
      .eq('auth_user_id', authUserId)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine tier from variant ID
    const variantId = subscriptionData.variant_id.toString();
    let tier: 'pro' | 'vanguard_pro';
    
    if (variantId === '1139861') {
      tier = 'pro';
    } else if (variantId === '1139844') {
      tier = 'vanguard_pro';
    } else {
      console.error('Unknown variant ID:', variantId);
      tier = 'pro'; // default
    }

    // Handle different webhook events
    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated':
        await handleSubscriptionCreatedOrUpdated(
          supabaseClient,
          user.id,
          payload.data.id,
          subscriptionData,
          tier
        );
        break;

      case 'subscription_cancelled':
      case 'subscription_expired':
        await handleSubscriptionCancelledOrExpired(
          supabaseClient,
          user.id,
          payload.data.id
        );
        break;

      case 'subscription_resumed':
        await handleSubscriptionResumed(
          supabaseClient,
          user.id,
          payload.data.id,
          subscriptionData
        );
        break;

      case 'subscription_paused':
      case 'subscription_unpaused':
        await handleSubscriptionPauseChange(
          supabaseClient,
          payload.data.id,
          subscriptionData.status
        );
        break;

      default:
        console.log('Unhandled event:', eventName);
    }

    // Log event
    await supabaseClient.from('payment_events').insert({
      user_id: user.id,
      event_type: eventName,
      event_name: eventName,
      lemon_event_id: payload.data.id,
      payload: payload,
      processed: true,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleSubscriptionCreatedOrUpdated(
  supabase: any,
  userId: string,
  lemonSubscriptionId: string,
  subscriptionData: any,
  tier: 'pro' | 'vanguard_pro'
) {
  // Upsert subscription
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      lemon_subscription_id: lemonSubscriptionId,
      lemon_customer_id: subscriptionData.customer_id.toString(),
      lemon_order_id: subscriptionData.order_id?.toString(),
      lemon_product_id: subscriptionData.product_id.toString(),
      lemon_variant_id: subscriptionData.variant_id.toString(),
      tier: tier,
      status: subscriptionData.status,
      billing_interval: tier === 'vanguard_pro' ? 'year' : 'month',
      trial_ends_at: subscriptionData.trial_ends_at,
      renews_at: subscriptionData.renews_at,
      ends_at: subscriptionData.ends_at,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'lemon_subscription_id',
    })
    .select()
    .single();

  if (subError) {
    console.error('Error upserting subscription:', subError);
    throw subError;
  }

  // Update user tier and subscription reference
  const { error: userError } = await supabase
    .from('users')
    .update({
      tier: tier,
      active_subscription_id: subscription.id,
      lemon_customer_id: subscriptionData.customer_id.toString(),
      // Update limits based on tier
      text_limit: tier === 'vanguard_pro' ? 1583 : (tier === 'pro' ? 1583 : 55),
      image_limit: tier === 'vanguard_pro' ? 328 : (tier === 'pro' ? 328 : 25),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (userError) {
    console.error('Error updating user:', userError);
    throw userError;
  }

  console.log('Subscription created/updated successfully');
}

async function handleSubscriptionCancelledOrExpired(
  supabase: any,
  userId: string,
  lemonSubscriptionId: string
) {
  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      ends_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('lemon_subscription_id', lemonSubscriptionId);

  // Downgrade user to free tier
  await supabase
    .from('users')
    .update({
      tier: 'free',
      active_subscription_id: null,
      text_limit: 55,
      image_limit: 25,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  console.log('Subscription cancelled/expired');
}

async function handleSubscriptionResumed(
  supabase: any,
  userId: string,
  lemonSubscriptionId: string,
  subscriptionData: any
) {
  // Determine tier from variant ID
  const variantId = subscriptionData.variant_id.toString();
  const tier = variantId === '1139844' ? 'vanguard_pro' : 'pro';

  // Update subscription status
  const { data: subscription } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      renews_at: subscriptionData.renews_at,
      ends_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('lemon_subscription_id', lemonSubscriptionId)
    .select()
    .single();

  // Restore user tier
  await supabase
    .from('users')
    .update({
      tier: tier,
      active_subscription_id: subscription.id,
      text_limit: tier === 'vanguard_pro' ? 1583 : 1583,
      image_limit: tier === 'vanguard_pro' ? 328 : 328,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  console.log('Subscription resumed');
}

async function handleSubscriptionPauseChange(
  supabase: any,
  lemonSubscriptionId: string,
  status: string
) {
  await supabase
    .from('subscriptions')
    .update({
      status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('lemon_subscription_id', lemonSubscriptionId);

  console.log('Subscription pause status updated');
}
```

---

## 🎨 Phase 4: Frontend Payment Components

### 4.1 Create LemonSqueezy Service

**File:** `src/services/lemonSqueezyService.ts`

```typescript
import { User } from '../types';

const LEMONSQUEEZY_CHECKOUT_URL = 'https://otagon.lemonsqueezy.com/checkout/buy';

export interface CheckoutOptions {
  variantId: string;
  user: User;
  redirectUrl?: string;
}

export const lemonSqueezyService = {
  /**
   * Open LemonSqueezy checkout overlay
   */
  openCheckout: (options: CheckoutOptions) => {
    const { variantId, user, redirectUrl } = options;

    // Construct checkout URL with custom data
    const checkoutUrl = new URL(`${LEMONSQUEEZY_CHECKOUT_URL}/${variantId}`);
    
    // Add custom data (will be passed to webhook)
    checkoutUrl.searchParams.set('checkout[custom][user_id]', user.userId);
    checkoutUrl.searchParams.set('checkout[custom][auth_user_id]', user.authUserId);
    
    // Pre-fill customer information
    checkoutUrl.searchParams.set('checkout[email]', user.email);
    if (user.fullName) {
      checkoutUrl.searchParams.set('checkout[name]', user.fullName);
    }

    // Set redirect URL
    if (redirectUrl) {
      checkoutUrl.searchParams.set('checkout[success_url]', redirectUrl);
    }

    // Open in new window or overlay
    if (window.LemonSqueezy) {
      // Use LemonSqueezy.js overlay if available
      window.LemonSqueezy.Url.Open(checkoutUrl.toString());
    } else {
      // Fallback to new window
      window.open(checkoutUrl.toString(), '_blank', 'width=800,height=900');
    }
  },

  /**
   * Get variant ID for tier
   */
  getVariantId: (tier: 'pro' | 'vanguard_pro'): string => {
    return tier === 'vanguard_pro' 
      ? import.meta.env.VITE_LEMONSQUEEZY_VARIANT_VANGUARD
      : import.meta.env.VITE_LEMONSQUEEZY_VARIANT_PRO;
  },

  /**
   * Get customer portal URL (for managing subscriptions)
   */
  getCustomerPortalUrl: () => {
    return 'https://otagon.lemonsqueezy.com/billing';
  },

  /**
   * Format price for display
   */
  formatPrice: (tier: 'pro' | 'vanguard_pro'): string => {
    return tier === 'vanguard_pro' ? '$35/year' : '$5/month';
  },
};

// Add TypeScript declaration for LemonSqueezy global
declare global {
  interface Window {
    LemonSqueezy?: {
      Url: {
        Open: (url: string) => void;
        Close: () => void;
      };
      Loader: {
        Show: () => void;
        Hide: () => void;
      };
    };
  }
}
```

### 4.2 Add LemonSqueezy Script to Index.html

**File:** `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Otagon - Your Gaming Assistant</title>
    
    <!-- LemonSqueezy Checkout Script -->
    <script src="https://app.lemonsqueezy.com/js/lemon.js" defer></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 4.3 Create Payment Modal Component

**File:** `src/components/modals/PaymentModal.tsx`

```typescript
import React from 'react';
import Modal from '../ui/Modal';
import { User } from '../../types';
import { lemonSqueezyService } from '../../services/lemonSqueezyService';
import { CheckCircle, Zap, Shield, Star } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  defaultTier?: 'pro' | 'vanguard_pro';
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  user,
  defaultTier = 'pro'
}) => {
  const [selectedTier, setSelectedTier] = React.useState<'pro' | 'vanguard_pro'>(defaultTier);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleUpgrade = () => {
    setIsProcessing(true);
    
    try {
      const variantId = lemonSqueezyService.getVariantId(selectedTier);
      const redirectUrl = `${window.location.origin}/payment-success`;
      
      lemonSqueezyService.openCheckout({
        variantId,
        user,
        redirectUrl,
      });
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setIsProcessing(false);
      }, 500);
    } catch (error) {
      console.error('Error opening checkout:', error);
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upgrade to Premium"
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Tier Selection */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Pro Tier */}
          <div
            onClick={() => setSelectedTier('pro')}
            className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
              selectedTier === 'pro'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-surface-light hover:border-blue-500/50'
            }`}
          >
            {selectedTier === 'pro' && (
              <div className="absolute top-3 right-3">
                <CheckCircle className="w-6 h-6 text-blue-500" />
              </div>
            )}
            
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-8 h-8 text-blue-500" />
              <div>
                <h3 className="text-xl font-bold text-text-primary">Pro</h3>
                <p className="text-2xl font-bold text-blue-500">$5<span className="text-sm text-text-muted">/month</span></p>
              </div>
            </div>

            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <CheckCircle className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>1,583 text queries / month</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <CheckCircle className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>328 image queries / month</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <CheckCircle className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>Advanced AI capabilities</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <CheckCircle className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>Batch screenshot analysis</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <CheckCircle className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>Hands-free voice mode</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <CheckCircle className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>Priority support</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <CheckCircle className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>No advertisements</span>
              </li>
            </ul>

            <p className="text-xs text-text-muted">Cancel anytime</p>
          </div>

          {/* Vanguard Pro Tier */}
          <div
            onClick={() => setSelectedTier('vanguard_pro')}
            className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
              selectedTier === 'vanguard_pro'
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-surface-light hover:border-purple-500/50'
            }`}
          >
            {/* Best Value Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full">
                BEST VALUE
              </span>
            </div>

            {selectedTier === 'vanguard_pro' && (
              <div className="absolute top-3 right-3">
                <CheckCircle className="w-6 h-6 text-purple-500" />
              </div>
            )}
            
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-8 h-8 text-purple-500" />
              <div>
                <h3 className="text-xl font-bold text-text-primary">Vanguard Pro</h3>
                <p className="text-2xl font-bold text-purple-500">$35<span className="text-sm text-text-muted">/year</span></p>
              </div>
            </div>

            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Star className="w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0" />
                <span className="font-semibold">Everything in Pro</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <CheckCircle className="w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0" />
                <span><strong>Save 42%</strong> vs monthly</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <CheckCircle className="w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0" />
                <span>Lifetime price guarantee</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <CheckCircle className="w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0" />
                <span>Exclusive Founder's Badge</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <CheckCircle className="w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0" />
                <span>Early access to new features</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <CheckCircle className="w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0" />
                <span>VIP Discord role</span>
              </li>
            </ul>

            <p className="text-xs text-purple-400 font-medium">Limited founding member pricing</p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-3 p-4 bg-surface/50 rounded-lg">
          <Shield className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-text-secondary">
            <p className="font-medium text-text-primary mb-1">Secure Payment via LemonSqueezy</p>
            <p>Your payment information is processed securely. We never store your card details.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-surface-light text-text-secondary rounded-lg hover:bg-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpgrade}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
          >
            {isProcessing ? 'Opening Checkout...' : `Upgrade to ${selectedTier === 'pro' ? 'Pro' : 'Vanguard Pro'}`}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;
```

### 4.4 Update Settings Modal

**File:** `src/components/modals/SettingsModal.tsx` (Update Tier & Usage Tab)

Add after line 100 (in the tier section):

```typescript
import PaymentModal from './PaymentModal';

// Add state for payment modal
const [showPaymentModal, setShowPaymentModal] = useState(false);

// In the Tier & Usage tab render:
{activeTab === 'tier' && (
  <div className="space-y-6">
    {/* Current Tier Display */}
    <div>
      <h3 className="text-sm font-medium text-text-secondary mb-3">Current Plan</h3>
      <div className="flex items-center justify-between p-4 bg-surface/50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            user.tier === 'vanguard_pro' ? 'bg-purple-500' :
            user.tier === 'pro' ? 'bg-blue-500' :
            'bg-gray-500'
          }`} />
          <div>
            <p className="font-medium text-text-primary">{getTierDisplayName(user.tier)}</p>
            <p className="text-sm text-text-muted">
              {user.tier === 'free' ? 'Free plan' : 
               user.tier === 'pro' ? '$5/month' : 
               '$35/year'}
            </p>
          </div>
        </div>
        
        {/* Upgrade Button for Free Users */}
        {user.tier === 'free' && (
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Upgrade Now
          </button>
        )}
        
        {/* Manage Subscription for Paid Users */}
        {(user.tier === 'pro' || user.tier === 'vanguard_pro') && (
          <button
            onClick={() => {
              window.open(lemonSqueezyService.getCustomerPortalUrl(), '_blank');
            }}
            className="px-4 py-2 bg-surface-light text-text-primary rounded-lg hover:bg-surface transition-colors"
          >
            Manage Subscription
          </button>
        )}
      </div>
    </div>

    {/* Usage Display (existing code) */}
    {/* ... */}
  </div>
)}

{/* Payment Modal */}
<PaymentModal
  isOpen={showPaymentModal}
  onClose={() => setShowPaymentModal(false)}
  user={user}
/>
```

### 4.5 Update Credit Modal

**File:** `src/components/modals/CreditModal.tsx`

```typescript
import PaymentModal from './PaymentModal';

// Add state
const [showPaymentModal, setShowPaymentModal] = useState(false);

// Update the "Upgrade to Pro" button:
{user.tier === 'free' && (
  <button
    onClick={() => setShowPaymentModal(true)}
    className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
  >
    Upgrade to Pro
  </button>
)}

{/* Add Payment Modal */}
<PaymentModal
  isOpen={showPaymentModal}
  onClose={() => setShowPaymentModal(false)}
  user={user}
/>
```

---

## 🚀 Phase 5: User Experience Enhancements

### 5.1 Payment Success Page

**File:** `src/components/PaymentSuccess.tsx`

```typescript
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { authService } from '../services/authService';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Refresh user data to get updated subscription
    const refreshUserData = async () => {
      await authService.refreshUser();
      
      // Redirect to main app after 3 seconds
      setTimeout(() => {
        navigate('/app');
      }, 3000);
    };

    refreshUserData();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Payment Successful!
          </h1>
          <p className="text-text-secondary">
            Your subscription has been activated. Welcome to the premium experience!
          </p>
        </div>

        <div className="p-6 bg-surface/50 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Status</span>
            <span className="text-green-500 font-medium">Active</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Redirecting in</span>
            <span className="text-text-primary font-medium">3 seconds...</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/app')}
          className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
```

### 5.2 Add Payment Success Route

**File:** `src/router/index.tsx` (or wherever routes are defined)

```typescript
{
  path: '/payment-success',
  element: <PaymentSuccess />,
}
```

---

## 📝 Phase 6: Testing Checklist

### Database Testing
- [ ] Run migration to create subscriptions table
- [ ] Test subscription insert/update operations
- [ ] Verify RLS policies work correctly
- [ ] Test user tier updates

### Edge Function Testing
- [ ] Deploy edge function to Supabase
- [ ] Test webhook signature verification
- [ ] Test subscription_created event
- [ ] Test subscription_updated event
- [ ] Test subscription_cancelled event
- [ ] Verify user tier changes in database

### Frontend Testing
- [ ] Test payment modal opens correctly
- [ ] Test tier selection (Pro vs Vanguard)
- [ ] Test checkout overlay opens with correct data
- [ ] Test payment success redirect
- [ ] Test subscription management link
- [ ] Test credit modal upgrade button
- [ ] Test settings modal upgrade button

### End-to-End Flow
- [ ] User signs up → sees free tier
- [ ] User clicks upgrade → payment modal opens
- [ ] User completes payment → webhook fires
- [ ] User tier updated in database
- [ ] User redirected to success page
- [ ] User sees updated tier in settings
- [ ] User can manage subscription

### Edge Cases
- [ ] Test failed payment handling
- [ ] Test subscription cancellation
- [ ] Test subscription reactivation
- [ ] Test multiple subscriptions (shouldn't happen)
- [ ] Test webhook retries

---

## 🎯 Phase 7: Deployment Steps

### Step 1: Database Migration
```bash
# Run migration in Supabase SQL Editor
# Copy and paste the subscriptions table SQL from Phase 1
```

### Step 2: Environment Variables
```bash
# Add to Supabase Dashboard → Edge Functions → Secrets
LEMONSQUEEZY_API_KEY=your_secret_key
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
LEMONSQUEEZY_STORE_ID=your_store_id
```

### Step 3: Deploy Edge Function
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Deploy edge function
supabase functions deploy handle-lemonsqueezy-webhook
```

### Step 4: Configure LemonSqueezy Webhook
1. Go to LemonSqueezy Dashboard → Settings → Webhooks
2. Add new webhook URL: `https://[your-supabase-project].supabase.co/functions/v1/handle-lemonsqueezy-webhook`
3. Select events:
   - subscription_created
   - subscription_updated
   - subscription_cancelled
   - subscription_expired
   - subscription_resumed
   - subscription_paused
   - subscription_unpaused
4. Copy webhook signing secret → add to Supabase secrets

### Step 5: Update Frontend Environment
```bash
# Update .env.local with LemonSqueezy IDs
VITE_LEMONSQUEEZY_STORE_ID=your_store_id
VITE_LEMONSQUEEZY_PRODUCT_ID=724192
VITE_LEMONSQUEEZY_VARIANT_PRO=1139861
VITE_LEMONSQUEEZY_VARIANT_VANGUARD=1139844
```

### Step 6: Build & Deploy
```bash
npm run build
# Deploy to your hosting platform (Vercel, Netlify, etc.)
```

---

## 📊 Phase 8: Analytics & Monitoring

### Key Metrics to Track
- Conversion rate (free → paid)
- Average time to upgrade
- Most popular tier (Pro vs Vanguard)
- Churn rate
- Failed payment rate
- Webhook success rate

### Monitoring Setup
```typescript
// Add analytics events
analytics.track('Payment Modal Opened', { tier: selectedTier });
analytics.track('Upgrade Initiated', { tier: selectedTier, userId: user.id });
analytics.track('Payment Completed', { tier: selectedTier, amount: price });
analytics.track('Subscription Cancelled', { tier: previousTier, reason: cancelReason });
```

---

## 🔒 Security Best Practices

1. **Never expose LemonSqueezy API key in frontend**
   - Only use in Edge Functions
   - Only public key in frontend (if needed)

2. **Always verify webhook signatures**
   - Prevents malicious webhook calls
   - Ensures data integrity

3. **Use RLS policies**
   - Users can only view their own subscriptions
   - Prevents unauthorized access

4. **Validate user data**
   - Check user exists before processing webhook
   - Verify tier changes are valid

5. **Log all payment events**
   - Helps with debugging
   - Audit trail for compliance

---

## 🎉 Summary

### Implementation Order:
1. ✅ **Phase 1**: Database schema (30 mins)
2. ✅ **Phase 2**: Environment setup (15 mins)
3. ✅ **Phase 3**: Edge function webhook handler (2 hours)
4. ✅ **Phase 4**: Frontend components (3 hours)
5. ✅ **Phase 5**: UX enhancements (1 hour)
6. ✅ **Phase 6**: Testing (2-3 hours)
7. ✅ **Phase 7**: Deployment (1 hour)
8. ✅ **Phase 8**: Analytics & monitoring (ongoing)

### Total Estimated Time: 10-12 hours

### What We Built:
- ✅ Secure subscription database
- ✅ Automated webhook processing
- ✅ Beautiful payment UI (post-login only)
- ✅ Subscription management
- ✅ Payment success flow
- ✅ Multiple upgrade touchpoints
- ✅ Security best practices

### Next Steps:
1. Review and approve this plan
2. Start with Phase 1 (database setup)
3. Test each phase before moving to next
4. Deploy to production
5. Monitor and iterate

---

**Ready to start implementation? Let me know which phase you'd like to begin with!** 🚀
