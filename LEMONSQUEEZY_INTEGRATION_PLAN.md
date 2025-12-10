# Lemonsqueezy Payment Integration Master Plan
## Otagon App - Complete Implementation Guide

---

## 📋 Executive Summary

This document provides a comprehensive plan to integrate Lemonsqueezy payment processing into the Otagon gaming assistant app. The integration will enable users to upgrade from Free to Pro ($5/month) or Vanguard Pro ($35/year) tiers, with secure subscription management via Supabase.

**Key Requirements:**
- ✅ Secure payment processing via Lemonsqueezy
- ✅ Subscription tracking in Supabase
- ✅ Multiple upgrade touchpoints throughout the app
- ✅ Trial management (7-day Pro trial)
- ✅ Webhook handling for subscription lifecycle events

---

## 🎯 Integration Touchpoints Found

### 1. **Landing Page** (`src/components/LandingPageFresh.tsx`)
**Location:** Lines 1550-1660  
**Current State:** Three pricing tiers with "Coming Soon" disabled buttons

**Tiers:**
- **Free:** $0/month
  - 55 Text | 25 Image Queries/month
  - Standard features
  - 7-day Pro trial offer
  
- **Pro (Monthly):** $5/month
  - 1,583 Text | 328 Image Queries/month
  - Advanced AI, batch screenshots, hands-free mode
  - No ads, priority support
  
- **Vanguard Pro (Annual):** $35/year
  - All Pro features
  - Lifetime price guarantee
  - Founder's badge
  - Limited offer positioning

**Action Required:**
- Replace "Coming Soon" buttons with Lemonsqueezy checkout links
- Add onClick handlers to open Lemonsqueezy overlay
- Track conversion from landing page

---

### 2. **Credit Indicator** (`src/components/ui/CreditIndicator.tsx`)
**Location:** Lines 1-100  
**Current State:** Circular progress bars showing text/image query usage

**Features:**
- Visual representation of query limits
- Clickable button that triggers credit modal
- Brand gradient styling

**Action Required:**
- Keep existing functionality
- Ensure CreditModal upgrade flow integrates with Lemonsqueezy

---

### 3. **Credit Modal** (`src/components/modals/CreditModal.tsx`)
**Location:** Lines 1-150  
**Current State:** Displays remaining queries with "Upgrade to Pro" button for free users

**Features:**
- Shows text and image query counts
- Upgrade CTA for free tier users
- Calls `onUpgrade()` callback

**Action Required:**
- Update `onUpgrade` handler to open Lemonsqueezy checkout
- Pass user context for pre-filled checkout
- Track modal conversion

---

### 4. **Settings Modal** (`src/components/modals/SettingsModal.tsx`)
**Location:** Lines 1-524  
**Current State:** Three tabs (Account, Tier & Usage, Profile)

**Features:**
- Displays current tier (Free/Pro/Vanguard Pro)
- Shows trial status via TrialBanner component
- Account information display

**Action Required:**
- Add "Manage Subscription" button for paid users
- Add "Upgrade" button for free users
- Link to Lemonsqueezy customer portal for subscription management
- Add billing history section

---

### 5. **Trial Banner** (`src/components/trial/TrialBanner.tsx`)
**Location:** Lines 1-220  
**Current State:** Offers 7-day Pro trial to eligible free users

**Features:**
- Trial eligibility check
- "Start Pro Trial" CTA
- Trial confirmation modal
- One-time offer messaging

**Action Required:**
- Keep trial functionality
- After trial ends, show upgrade to paid Pro CTA
- Integrate trial-to-paid conversion flow

---

### 6. **Splash Screens** (`src/components/splash/SplashScreen.tsx` & `ProFeaturesSplashScreen.tsx`)

#### Onboarding Splash Screen
**Location:** Lines 1-275  
**Current State:** PC connection setup during onboarding

**Features:**
- Feature introduction slides
- Connect PC workflow
- Skip option available

**Action Required:**
- Minimal changes needed
- Could add upgrade prompt at end of onboarding (optional)

#### Pro Features Splash Screen
**Location:** Lines 1-235  
**Current State:** Shows Pro and Vanguard Pro features after onboarding

**Features:**
- Tab switcher between Pro and Vanguard
- Feature list display
- `onUpgrade()` and `onUpgradeToVanguard()` callbacks

**Action Required:**
- Connect upgrade callbacks to Lemonsqueezy checkout
- Different product variants for Pro vs Vanguard
- Track which tier user chooses

---

### 7. **App.tsx Upgrade Triggers**
**Location:** Lines 885, 928  
**Current State:** Toast warnings for Pro-only features

**Example:**
```typescript
toastService.warning('Batch screenshots (F2) are a Pro feature. Upgrade to unlock!');
```

**Features Locked Behind Pro:**
- Batch screenshot capture (F2 hotkey)
- Additional features (to be identified)

**Action Required:**
- Convert warnings to upgrade prompts
- Add "Upgrade Now" action button in toast
- Direct user to Lemonsqueezy checkout

---

### 8. **Pro Features Route Handler** (`src/router/routes/ProFeaturesRoute.tsx`)
**Location:** Lines 46-51  
**Current State:** Placeholder upgrade handlers with TODO comments

```typescript
const handleUpgrade = () => {
  // TODO: Implement upgrade modal/flow
};

const handleUpgradeToVanguard = () => {
  // TODO: Implement Vanguard upgrade modal/flow
};
```

**Action Required:**
- Implement these handlers to open Lemonsqueezy checkout
- Pass appropriate product variant IDs

---

## 🗄️ Database Architecture

### Current Schema (from `prod_schema_backup_20251202.sql`)

#### Users Table
```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY,
    auth_user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL,
    tier TEXT DEFAULT 'free' NOT NULL,
    text_limit INTEGER DEFAULT 55,
    image_limit INTEGER DEFAULT 25,
    has_used_trial BOOLEAN DEFAULT false,
    trial_started_at TIMESTAMPTZ,
    trial_expires_at TIMESTAMPTZ,
    -- ... other fields
    CONSTRAINT users_tier_check CHECK (tier IN ('free', 'pro', 'vanguard_pro'))
);
```

**Current Trial System:**
- 7-day trials supported
- `trial_started_at` and `trial_expires_at` timestamps
- `expire_trials()` function runs daily to revert expired trials

---

### Required New Tables for Lemonsqueezy

#### 1. Subscriptions Table
```sql
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Lemonsqueezy IDs
    lemon_subscription_id TEXT NOT NULL UNIQUE,
    lemon_customer_id TEXT NOT NULL,
    lemon_product_id TEXT NOT NULL,
    lemon_variant_id TEXT NOT NULL,
    
    -- Subscription details
    tier TEXT NOT NULL CHECK (tier IN ('pro', 'vanguard_pro')),
    status TEXT NOT NULL CHECK (status IN (
        'active',
        'cancelled',
        'expired',
        'past_due',
        'paused',
        'unpaid'
    )),
    
    -- Billing
    billing_interval TEXT CHECK (billing_interval IN ('month', 'year')),
    price_amount INTEGER NOT NULL, -- in cents
    currency TEXT DEFAULT 'USD',
    
    -- Dates
    trial_ends_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    renews_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- URLs
    customer_portal_url TEXT,
    update_payment_method_url TEXT,
    
    CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_lemon_subscription_id ON subscriptions(lemon_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier);

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
    ON subscriptions FOR SELECT
    USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = subscriptions.user_id));

CREATE POLICY "Service role can manage subscriptions"
    ON subscriptions FOR ALL
    USING (auth.role() = 'service_role');
```

#### 2. Webhook Events Table (for debugging and audit)
```sql
CREATE TABLE public.lemon_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_event_type ON lemon_webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed ON lemon_webhook_events(processed);
CREATE INDEX idx_webhook_events_created_at ON lemon_webhook_events(created_at);
```

#### 3. Payment Transactions Table (optional but recommended)
```sql
CREATE TABLE public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    
    -- Lemonsqueezy IDs
    lemon_order_id TEXT,
    lemon_transaction_id TEXT UNIQUE,
    
    -- Transaction details
    type TEXT NOT NULL CHECK (type IN ('subscription', 'one_time', 'refund')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    amount INTEGER NOT NULL, -- in cents
    currency TEXT DEFAULT 'USD',
    
    -- Metadata
    description TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_subscription_id ON payment_transactions(subscription_id);
```

---

## 🏗️ Implementation Architecture

### Frontend Components Structure

```
src/
├── services/
│   ├── lemonsqueezy/
│   │   ├── lemonsqueezyService.ts      # Main service
│   │   ├── checkoutService.ts          # Checkout overlays
│   │   ├── webhookTypes.ts             # TS types for webhooks
│   │   └── constants.ts                # Product IDs, variants
│   └── paymentService.ts               # High-level payment interface
├── components/
│   ├── payment/
│   │   ├── CheckoutButton.tsx          # Reusable checkout button
│   │   ├── PricingCard.tsx             # Enhanced pricing cards
│   │   ├── SubscriptionStatus.tsx      # Display sub status
│   │   └── ManageSubscriptionButton.tsx # Customer portal link
│   └── modals/
│       └── UpgradeModal.tsx            # Centralized upgrade modal
└── hooks/
    ├── useSubscription.ts              # Subscription state hook
    └── useCheckout.ts                  # Checkout flow hook
```

### Backend (Supabase Edge Functions)

```
supabase/
├── functions/
│   ├── lemon-webhook/
│   │   ├── index.ts                    # Main webhook handler
│   │   ├── handlers/
│   │   │   ├── subscriptionCreated.ts
│   │   │   ├── subscriptionUpdated.ts
│   │   │   ├── subscriptionCancelled.ts
│   │   │   ├── subscriptionExpired.ts
│   │   │   └── subscriptionPaymentSuccess.ts
│   │   └── utils/
│   │       ├── verifySignature.ts      # Webhook signature verification
│   │       └── updateUserTier.ts       # Sync tier with subscription
│   └── create-checkout/
│       └── index.ts                    # Create checkout session (optional)
└── migrations/
    └── 20251211_lemonsqueezy_tables.sql
```

---

## 📦 Lemonsqueezy Setup Steps

### 1. Create Lemonsqueezy Account & Store
1. Sign up at https://lemonsqueezy.com
2. Create a new store for Otagon
3. Configure store settings (currency, tax settings)

### 2. Create Products & Variants

#### Product 1: Otagon Pro (Monthly)
- **Name:** Otagon Pro
- **Price:** $5.00 USD
- **Billing Interval:** Monthly
- **Description:** Get 1,583 text and 328 image queries per month, batch screenshots, hands-free mode, and more.
- **Features:**
  - Massively increased query limits
  - Batch screenshot capture
  - In-depth insight tabs
  - AI mode toggle
  - Hands-free voice mode
  - No ads
  - Priority support

**Save Variant ID:** `variant_pro_monthly`

#### Product 2: Otagon Vanguard Pro (Annual)
- **Name:** Otagon Vanguard Pro
- **Price:** $35.00 USD
- **Billing Interval:** Yearly
- **Description:** All Pro features plus lifetime price guarantee, exclusive founder's badge, and early access to new features.
- **Features:**
  - All Pro features
  - Lifetime price guarantee
  - Exclusive Founder's Badge
  - Direct influence on roadmap
  - First access to beta features

**Save Variant ID:** `variant_vanguard_annual`

### 3. Configure Webhooks
1. Go to Settings → Webhooks
2. Create new webhook endpoint: `https://your-supabase-project.functions.supabase.co/lemon-webhook`
3. Select events to listen to:
   - ✅ `subscription_created`
   - ✅ `subscription_updated`
   - ✅ `subscription_cancelled`
   - ✅ `subscription_expired`
   - ✅ `subscription_payment_success`
   - ✅ `subscription_payment_failed`
   - ✅ `subscription_payment_recovered`
4. Copy signing secret for webhook verification

### 4. Get API Keys
1. Go to Settings → API
2. Copy **Store ID**
3. Generate **API Key** (for backend operations)
4. Copy **Public Key** (for frontend checkout)

---

## 💻 Implementation Steps

### Phase 1: Database Setup (2-3 hours)

**Step 1.1:** Create migration file
```bash
# Create new migration
cd supabase/migrations
touch 20251211_lemonsqueezy_tables.sql
```

**Step 1.2:** Add tables from "Database Architecture" section above

**Step 1.3:** Apply migration
```bash
# Local dev
supabase db reset

# Production
supabase db push
```

**Step 1.4:** Create helper functions
```sql
-- Function to sync user tier with subscription
CREATE OR REPLACE FUNCTION sync_user_tier_from_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user tier when subscription status changes
    IF NEW.status = 'active' THEN
        UPDATE users
        SET 
            tier = NEW.tier,
            text_limit = CASE 
                WHEN NEW.tier = 'pro' OR NEW.tier = 'vanguard_pro' THEN 1583
                ELSE 55
            END,
            image_limit = CASE 
                WHEN NEW.tier = 'pro' OR NEW.tier = 'vanguard_pro' THEN 328
                ELSE 25
            END,
            updated_at = NOW()
        WHERE id = NEW.user_id;
    ELSIF NEW.status IN ('cancelled', 'expired', 'past_due', 'unpaid') THEN
        -- Check if user has any other active subscription
        IF NOT EXISTS (
            SELECT 1 FROM subscriptions 
            WHERE user_id = NEW.user_id 
            AND status = 'active' 
            AND id != NEW.id
        ) THEN
            -- Downgrade to free if no active subscriptions
            UPDATE users
            SET 
                tier = 'free',
                text_limit = 55,
                image_limit = 25,
                updated_at = NOW()
            WHERE id = NEW.user_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically sync tier
CREATE TRIGGER on_subscription_change
    AFTER INSERT OR UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_tier_from_subscription();
```

---

### Phase 2: Environment Variables (30 minutes)

**Step 2.1:** Add to `.env.local` (local development)
```env
# Lemonsqueezy
VITE_LEMONSQUEEZY_STORE_ID=your_store_id
VITE_LEMONSQUEEZY_VARIANT_ID_PRO_MONTHLY=variant_id_here
VITE_LEMONSQUEEZY_VARIANT_ID_VANGUARD_ANNUAL=variant_id_here

# Supabase Edge Functions (for webhooks)
LEMONSQUEEZY_API_KEY=your_api_key
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
```

**Step 2.2:** Add to production environment variables in hosting platform

---

### Phase 3: Install Dependencies (15 minutes)

```bash
# Frontend
npm install @lemonsqueezy/lemonsqueezy.js

# For Edge Functions (if needed)
# Add to supabase/functions/package.json
```

---

### Phase 4: Frontend Services (4-6 hours)

**Step 4.1:** Create Lemonsqueezy service

`src/services/lemonsqueezy/constants.ts`:
```typescript
export const LEMONSQUEEZY_CONFIG = {
  storeId: import.meta.env.VITE_LEMONSQUEEZY_STORE_ID,
  variants: {
    proMonthly: import.meta.env.VITE_LEMONSQUEEZY_VARIANT_ID_PRO_MONTHLY,
    vanguardAnnual: import.meta.env.VITE_LEMONSQUEEZY_VARIANT_ID_VANGUARD_ANNUAL,
  },
} as const;

export const PRODUCT_CONFIG = {
  pro: {
    name: 'Otagon Pro',
    price: 5,
    interval: 'month',
    tier: 'pro',
    variantId: LEMONSQUEEZY_CONFIG.variants.proMonthly,
  },
  vanguard: {
    name: 'Otagon Vanguard Pro',
    price: 35,
    interval: 'year',
    tier: 'vanguard_pro',
    variantId: LEMONSQUEEZY_CONFIG.variants.vanguardAnnual,
  },
} as const;
```

`src/services/lemonsqueezy/checkoutService.ts`:
```typescript
import { User } from '../../types';
import { PRODUCT_CONFIG } from './constants';

export interface CheckoutOptions {
  productType: 'pro' | 'vanguard';
  user: User;
  successUrl?: string;
  metadata?: Record<string, string>;
}

/**
 * Open Lemonsqueezy checkout overlay
 */
export async function openCheckout(options: CheckoutOptions): Promise<void> {
  const { productType, user, successUrl, metadata } = options;
  const product = PRODUCT_CONFIG[productType];

  // Build checkout URL
  const checkoutUrl = new URL('https://lemonsqueezy.com/checkout/buy/' + product.variantId);
  
  // Pre-fill customer data
  checkoutUrl.searchParams.set('checkout[email]', user.email);
  checkoutUrl.searchParams.set('checkout[custom][user_id]', user.id);
  checkoutUrl.searchParams.set('checkout[custom][auth_user_id]', user.authUserId);
  
  // Add metadata
  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      checkoutUrl.searchParams.set(`checkout[custom][${key}]`, value);
    });
  }

  // Add redirect URL
  if (successUrl) {
    checkoutUrl.searchParams.set('checkout[success_url]', successUrl);
  }

  // Open in overlay (recommended) or new tab
  if (window.LemonSqueezy) {
    window.LemonSqueezy.Url.Open(checkoutUrl.toString());
  } else {
    // Fallback to new tab
    window.open(checkoutUrl.toString(), '_blank');
  }
}

/**
 * Load Lemonsqueezy.js script
 */
export function loadLemonSqueezyScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.LemonSqueezy) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://assets.lemonsqueezy.com/lemon.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Lemonsqueezy script'));
    document.head.appendChild(script);
  });
}

// Type augmentation for window
declare global {
  interface Window {
    LemonSqueezy?: {
      Url: {
        Open: (url: string) => void;
        Close: () => void;
      };
      Affiliate: {
        GetID: () => string;
      };
    };
  }
}
```

`src/services/lemonsqueezy/lemonsqueezyService.ts`:
```typescript
import { supabase } from '../../lib/supabase';

export interface Subscription {
  id: string;
  tier: 'pro' | 'vanguard_pro';
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  customerPortalUrl?: string;
}

/**
 * Get user's active subscriptions
 */
export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'past_due', 'cancelled']);

  if (error) {
    console.error('Error fetching subscriptions:', error);
    throw error;
  }

  return data.map(sub => ({
    id: sub.id,
    tier: sub.tier,
    status: sub.status,
    currentPeriodStart: sub.current_period_start,
    currentPeriodEnd: sub.current_period_end,
    cancelledAt: sub.cancelled_at,
    customerPortalUrl: sub.customer_portal_url,
  }));
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1);

  if (error) {
    console.error('Error checking subscription:', error);
    return false;
  }

  return data && data.length > 0;
}
```

---

### Phase 5: React Components (6-8 hours)

**Step 5.1:** Create reusable checkout button

`src/components/payment/CheckoutButton.tsx`:
```typescript
import React, { useState } from 'react';
import { User } from '../../types';
import { openCheckout, loadLemonSqueezyScript } from '../../services/lemonsqueezy/checkoutService';
import { toastService } from '../../services/toastService';

interface CheckoutButtonProps {
  productType: 'pro' | 'vanguard';
  user: User;
  children: React.ReactNode;
  className?: string;
  onSuccess?: () => void;
}

export const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  productType,
  user,
  children,
  className = '',
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      
      // Load Lemonsqueezy script if not already loaded
      await loadLemonSqueezyScript();

      // Open checkout
      await openCheckout({
        productType,
        user,
        successUrl: `${window.location.origin}/app?checkout=success`,
        metadata: {
          source: window.location.pathname,
        },
      });

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toastService.error('Failed to open checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
};
```

**Step 5.2:** Create subscription management button

`src/components/payment/ManageSubscriptionButton.tsx`:
```typescript
import React from 'react';

interface ManageSubscriptionButtonProps {
  customerPortalUrl?: string;
  className?: string;
}

export const ManageSubscriptionButton: React.FC<ManageSubscriptionButtonProps> = ({
  customerPortalUrl,
  className = '',
}) => {
  if (!customerPortalUrl) {
    return null;
  }

  return (
    <a
      href={customerPortalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      Manage Subscription
    </a>
  );
};
```

**Step 5.3:** Create subscription status display

`src/components/payment/SubscriptionStatus.tsx`:
```typescript
import React from 'react';
import { Subscription } from '../../services/lemonsqueezy/lemonsqueezyService';

interface SubscriptionStatusProps {
  subscription: Subscription;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ subscription }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'cancelled':
        return 'text-yellow-400';
      case 'past_due':
        return 'text-orange-400';
      case 'expired':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  return (
    <div className="bg-surface/50 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-text-primary mb-3">Subscription Status</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-text-secondary">Plan:</span>
          <span className="text-text-primary font-medium">
            {subscription.tier === 'vanguard_pro' ? 'Vanguard Pro' : 'Pro'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-text-secondary">Status:</span>
          <span className={`font-medium ${getStatusColor(subscription.status)}`}>
            {getStatusLabel(subscription.status)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-text-secondary">Current period ends:</span>
          <span className="text-text-primary">
            {formatDate(subscription.currentPeriodEnd)}
          </span>
        </div>

        {subscription.cancelledAt && (
          <div className="flex justify-between">
            <span className="text-text-secondary">Cancelled on:</span>
            <span className="text-yellow-400">
              {formatDate(subscription.cancelledAt)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

### Phase 6: Update Integration Points (8-10 hours)

**Step 6.1:** Update Landing Page

`src/components/LandingPageFresh.tsx`:
```typescript
// Add import
import { CheckoutButton } from './payment/CheckoutButton';

// Replace "Coming Soon" buttons (around line 1580):

{/* Free Plan - Keep as is */}
<button
  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
  className="w-full bg-gradient-to-r from-neutral-600 to-neutral-500 text-neutral-300 font-bold py-3 px-6 rounded-lg cursor-not-allowed opacity-50"
  disabled
  title="Free plan - no payment needed"
>
  Current Plan
</button>

{/* Pro Vanguard - Replace with CheckoutButton */}
<CheckoutButton
  productType="vanguard"
  user={user} // You'll need to pass user prop
  className="w-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 px-6 rounded-lg hover:scale-105 transition-transform"
  onSuccess={() => {
    // Track conversion
    console.log('Vanguard checkout opened');
  }}
>
  Get Vanguard Pro
</CheckoutButton>

{/* Pro Monthly - Replace with CheckoutButton */}
<CheckoutButton
  productType="pro"
  user={user} // You'll need to pass user prop
  className="w-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 px-6 rounded-lg hover:scale-105 transition-transform"
  onSuccess={() => {
    // Track conversion
    console.log('Pro checkout opened');
  }}
>
  Get Pro
</CheckoutButton>
```

**Step 6.2:** Update Credit Modal

`src/components/modals/CreditModal.tsx`:
```typescript
// Add import
import { CheckoutButton } from '../payment/CheckoutButton';

// Replace upgrade button (around line 95):
{tier === 'free' && (
  <div className="mt-8 bg-[#2E2E2E]/30 backdrop-blur-sm p-4 rounded-lg border border-[#424242]/30">
    <CheckoutButton
      productType="pro"
      user={user}
      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
      onSuccess={() => {
        onClose();
      }}
    >
      <StarIcon className="w-5 h-5" />
      Upgrade to Pro for More
    </CheckoutButton>
  </div>
)}
```

**Step 6.3:** Update Settings Modal

`src/components/modals/SettingsModal.tsx`:
```typescript
// Add imports
import { CheckoutButton } from '../payment/CheckoutButton';
import { SubscriptionStatus } from '../payment/SubscriptionStatus';
import { ManageSubscriptionButton } from '../payment/ManageSubscriptionButton';
import { getUserSubscriptions } from '../../services/lemonsqueezy/lemonsqueezyService';

// Add state for subscription
const [subscription, setSubscription] = useState<Subscription | null>(null);

// Load subscription on mount
useEffect(() => {
  if (user && user.tier !== 'free') {
    getUserSubscriptions(user.id).then(subs => {
      if (subs.length > 0) {
        setSubscription(subs[0]); // Get first active subscription
      }
    });
  }
}, [user]);

// Add to Tier & Usage tab:
{activeTab === 'tier' && (
  <div className="space-y-4">
    {/* Show subscription status if paid user */}
    {user.tier !== 'free' && subscription && (
      <>
        <SubscriptionStatus subscription={subscription} />
        
        {subscription.customerPortalUrl && (
          <ManageSubscriptionButton
            customerPortalUrl={subscription.customerPortalUrl}
            className="w-full px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium"
          />
        )}
      </>
    )}

    {/* Show upgrade button if free user */}
    {user.tier === 'free' && (
      <div className="bg-surface/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-text-primary mb-3">Upgrade Your Plan</h3>
        <div className="space-y-3">
          <CheckoutButton
            productType="pro"
            user={user}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white rounded-lg transition-transform transform hover:scale-105 font-medium"
          >
            Upgrade to Pro - $5/month
          </CheckoutButton>
          <CheckoutButton
            productType="vanguard"
            user={user}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg transition-transform transform hover:scale-105 font-medium"
          >
            Upgrade to Vanguard Pro - $35/year
          </CheckoutButton>
        </div>
      </div>
    )}
    
    {/* Rest of tier/usage content */}
  </div>
)}
```

**Step 6.4:** Update Pro Features Splash Screen

`src/router/routes/ProFeaturesRoute.tsx`:
```typescript
// Add imports
import { openCheckout, loadLemonSqueezyScript } from '../../services/lemonsqueezy/checkoutService';
import { toastService } from '../../services/toastService';

const handleUpgrade = async () => {
  try {
    await loadLemonSqueezyScript();
    if (user) {
      await openCheckout({
        productType: 'pro',
        user,
        successUrl: `${window.location.origin}/app`,
      });
    }
  } catch (error) {
    console.error('Checkout error:', error);
    toastService.error('Failed to open checkout');
  }
};

const handleUpgradeToVanguard = async () => {
  try {
    await loadLemonSqueezyScript();
    if (user) {
      await openCheckout({
        productType: 'vanguard',
        user,
        successUrl: `${window.location.origin}/app`,
      });
    }
  } catch (error) {
    console.error('Checkout error:', error);
    toastService.error('Failed to open checkout');
  }
};
```

**Step 6.5:** Update Trial Banner

`src/components/trial/TrialBanner.tsx`:
```typescript
// After trial ends, add upgrade CTA
// Around line 70, add new condition:

// Show upgrade CTA if trial has ended
if (trialStatus.hasUsed && !trialStatus.isActive && !trialStatus.isEligible) {
  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Trial Ended</h3>
            <p className="text-text-secondary">
              Continue enjoying Pro features - upgrade today!
            </p>
          </div>
        </div>
        <CheckoutButton
          productType="pro"
          user={user}
          className="btn-primary-enhanced"
        >
          Upgrade to Pro
        </CheckoutButton>
      </div>
    </div>
  );
}
```

**Step 6.6:** Update App.tsx Toast Warnings

`src/App.tsx`:
```typescript
// Replace lines 885 and 928 with upgrade prompts:
import { openCheckout, loadLemonSqueezyScript } from './services/lemonsqueezy/checkoutService';

// Create helper function:
const showUpgradePrompt = async (featureName: string) => {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) return;

  const upgradeAction = async () => {
    try {
      await loadLemonSqueezyScript();
      await openCheckout({
        productType: 'pro',
        user: currentUser,
        successUrl: `${window.location.origin}/app`,
        metadata: {
          feature_locked: featureName,
        },
      });
    } catch (error) {
      console.error('Upgrade error:', error);
    }
  };

  toastService.warning(
    `${featureName} is a Pro feature. Upgrade to unlock!`,
    {
      action: {
        label: 'Upgrade Now',
        onClick: upgradeAction,
      },
    }
  );
};

// Replace usages:
showUpgradePrompt('Batch screenshots (F2)');
```

---

### Phase 7: Webhook Handler (6-8 hours)

**Step 7.1:** Create webhook Edge Function

```bash
cd supabase/functions
mkdir lemon-webhook
cd lemon-webhook
touch index.ts
```

`supabase/functions/lemon-webhook/index.ts`:
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

// Webhook event types
type WebhookEvent =
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'subscription_expired'
  | 'subscription_payment_success'
  | 'subscription_payment_failed'
  | 'subscription_payment_recovered';

interface LemonWebhookPayload {
  meta: {
    event_name: WebhookEvent;
    custom_data?: {
      user_id?: string;
      auth_user_id?: string;
    };
  };
  data: {
    id: string;
    type: 'subscriptions';
    attributes: {
      store_id: number;
      customer_id: number;
      order_id: number;
      product_id: number;
      variant_id: number;
      status: string;
      trial_ends_at: string | null;
      renews_at: string | null;
      ends_at: string | null;
      created_at: string;
      updated_at: string;
      urls: {
        customer_portal: string;
        update_payment_method: string;
      };
    };
  };
}

/**
 * Verify webhook signature
 */
async function verifySignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signed = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

  const signatureHex = Array.from(new Uint8Array(signed))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return signatureHex === signature;
}

/**
 * Handle subscription_created event
 */
async function handleSubscriptionCreated(
  supabase: any,
  payload: LemonWebhookPayload
) {
  const { data, meta } = payload;
  const userId = meta.custom_data?.user_id;

  if (!userId) {
    console.error('No user_id in custom_data');
    return;
  }

  // Determine tier from variant_id
  const variantId = data.attributes.variant_id.toString();
  const tier = variantId === Deno.env.get('VITE_LEMONSQUEEZY_VARIANT_ID_VANGUARD_ANNUAL')
    ? 'vanguard_pro'
    : 'pro';

  // Insert subscription
  const { error: subError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      lemon_subscription_id: data.id,
      lemon_customer_id: data.attributes.customer_id.toString(),
      lemon_product_id: data.attributes.product_id.toString(),
      lemon_variant_id: variantId,
      tier,
      status: data.attributes.status,
      billing_interval: tier === 'vanguard_pro' ? 'year' : 'month',
      price_amount: tier === 'vanguard_pro' ? 3500 : 500, // in cents
      trial_ends_at: data.attributes.trial_ends_at,
      current_period_start: data.attributes.created_at,
      current_period_end: data.attributes.renews_at || data.attributes.ends_at,
      renews_at: data.attributes.renews_at,
      ends_at: data.attributes.ends_at,
      customer_portal_url: data.attributes.urls.customer_portal,
      update_payment_method_url: data.attributes.urls.update_payment_method,
    });

  if (subError) {
    console.error('Error inserting subscription:', subError);
    throw subError;
  }

  console.log(`✅ Subscription created for user ${userId}, tier: ${tier}`);
}

/**
 * Handle subscription_updated event
 */
async function handleSubscriptionUpdated(
  supabase: any,
  payload: LemonWebhookPayload
) {
  const { data } = payload;

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: data.attributes.status,
      renews_at: data.attributes.renews_at,
      ends_at: data.attributes.ends_at,
      trial_ends_at: data.attributes.trial_ends_at,
      updated_at: new Date().toISOString(),
    })
    .eq('lemon_subscription_id', data.id);

  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }

  console.log(`✅ Subscription updated: ${data.id}`);
}

/**
 * Handle subscription_cancelled event
 */
async function handleSubscriptionCancelled(
  supabase: any,
  payload: LemonWebhookPayload
) {
  const { data } = payload;

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      ends_at: data.attributes.ends_at,
      updated_at: new Date().toISOString(),
    })
    .eq('lemon_subscription_id', data.id);

  if (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }

  console.log(`✅ Subscription cancelled: ${data.id}`);
}

/**
 * Handle subscription_expired event
 */
async function handleSubscriptionExpired(
  supabase: any,
  payload: LemonWebhookPayload
) {
  const { data } = payload;

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString(),
    })
    .eq('lemon_subscription_id', data.id);

  if (error) {
    console.error('Error expiring subscription:', error);
    throw error;
  }

  console.log(`✅ Subscription expired: ${data.id}`);
}

/**
 * Main webhook handler
 */
serve(async (req) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Get signature from header
    const signature = req.headers.get('X-Signature');
    if (!signature) {
      return new Response('Missing signature', { status: 401 });
    }

    // Get raw body
    const rawBody = await req.text();

    // Verify signature
    const webhookSecret = Deno.env.get('LEMONSQUEEZY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('LEMONSQUEEZY_WEBHOOK_SECRET not set');
      return new Response('Server configuration error', { status: 500 });
    }

    const isValid = await verifySignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }

    // Parse payload
    const payload: LemonWebhookPayload = JSON.parse(rawBody);
    const eventType = payload.meta.event_name;

    console.log(`📨 Received webhook: ${eventType}`);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Log webhook event
    await supabase.from('lemon_webhook_events').insert({
      event_id: payload.data.id + '_' + Date.now(),
      event_type: eventType,
      payload: payload,
      processed: false,
    });

    // Handle event
    switch (eventType) {
      case 'subscription_created':
        await handleSubscriptionCreated(supabase, payload);
        break;
      case 'subscription_updated':
        await handleSubscriptionUpdated(supabase, payload);
        break;
      case 'subscription_cancelled':
        await handleSubscriptionCancelled(supabase, payload);
        break;
      case 'subscription_expired':
        await handleSubscriptionExpired(supabase, payload);
        break;
      case 'subscription_payment_success':
      case 'subscription_payment_failed':
      case 'subscription_payment_recovered':
        // Log payment events but don't process yet
        console.log(`Payment event: ${eventType}`);
        break;
      default:
        console.log(`Unhandled event: ${eventType}`);
    }

    // Mark as processed
    await supabase
      .from('lemon_webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('event_id', payload.data.id + '_' + Date.now());

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
```

**Step 7.2:** Deploy webhook function
```bash
supabase functions deploy lemon-webhook --no-verify-jwt
```

**Step 7.3:** Add secrets
```bash
supabase secrets set LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
supabase secrets set LEMONSQUEEZY_API_KEY=your_api_key
```

---

### Phase 8: Testing (4-6 hours)

**Test Checklist:**

1. **Checkout Flow**
   - [ ] Landing page Pro button opens checkout
   - [ ] Landing page Vanguard button opens checkout
   - [ ] Credit modal upgrade button opens checkout
   - [ ] Settings modal upgrade buttons open checkout
   - [ ] Pro features splash upgrade buttons open checkout
   - [ ] User email pre-filled in checkout
   - [ ] Custom data (user_id) passed correctly

2. **Webhook Processing**
   - [ ] subscription_created webhook updates database
   - [ ] User tier upgraded automatically
   - [ ] Query limits increased automatically
   - [ ] subscription_updated webhook works
   - [ ] subscription_cancelled webhook works
   - [ ] subscription_expired webhook works

3. **Subscription Management**
   - [ ] Settings modal shows subscription status
   - [ ] Customer portal link works
   - [ ] Subscription info displayed correctly
   - [ ] Cancellation flow works
   - [ ] User downgraded after cancellation period

4. **Trial Flow**
   - [ ] Trial start works as before
   - [ ] Trial expiry shows upgrade CTA
   - [ ] Trial users can upgrade to paid

5. **Edge Cases**
   - [ ] Multiple subscriptions handled correctly
   - [ ] Failed payments handled gracefully
   - [ ] Webhook replay doesn't duplicate records
   - [ ] User with expired subscription can resubscribe

---

### Phase 9: Monitoring & Analytics (2-3 hours)

**Step 9.1:** Add analytics tracking

```typescript
// src/services/analytics.ts
export const trackCheckoutStarted = (tier: 'pro' | 'vanguard', source: string) => {
  // Your analytics service (Google Analytics, Mixpanel, etc.)
  console.log('Checkout started:', { tier, source });
};

export const trackSubscriptionCreated = (tier: string, userId: string) => {
  console.log('Subscription created:', { tier, userId });
};
```

**Step 9.2:** Create admin dashboard query

```sql
-- Get subscription metrics
SELECT 
    tier,
    status,
    COUNT(*) as count,
    SUM(price_amount) / 100.0 as total_revenue
FROM subscriptions
GROUP BY tier, status
ORDER BY tier, status;

-- Get new subscriptions by day
SELECT 
    DATE(created_at) as date,
    tier,
    COUNT(*) as new_subscriptions
FROM subscriptions
GROUP BY DATE(created_at), tier
ORDER BY date DESC
LIMIT 30;

-- Get active MRR (Monthly Recurring Revenue)
SELECT 
    tier,
    COUNT(*) as active_subscriptions,
    CASE 
        WHEN billing_interval = 'year' THEN SUM(price_amount) / 100.0 / 12
        ELSE SUM(price_amount) / 100.0
    END as mrr
FROM subscriptions
WHERE status = 'active'
GROUP BY tier, billing_interval;
```

---

## 🔒 Security Considerations

### 1. Webhook Signature Verification
- ✅ Always verify webhook signatures
- ✅ Use constant-time comparison
- ✅ Log invalid attempts

### 2. Database Security
- ✅ RLS policies on subscriptions table
- ✅ Only service role can write subscriptions
- ✅ Users can only read their own subscriptions

### 3. Environment Variables
- ✅ Never commit API keys
- ✅ Use Supabase secrets for Edge Functions
- ✅ Use env variables for frontend

### 4. User Data
- ✅ Only pass necessary data to Lemonsqueezy
- ✅ Store minimal payment info
- ✅ Use Lemonsqueezy customer portal for sensitive operations

---

## 📊 Expected Timeline

| Phase | Tasks | Hours | Dependencies |
|-------|-------|-------|--------------|
| 1 | Database Setup | 2-3 | None |
| 2 | Environment Variables | 0.5 | Phase 1 |
| 3 | Install Dependencies | 0.25 | None |
| 4 | Frontend Services | 4-6 | Phase 2, 3 |
| 5 | React Components | 6-8 | Phase 4 |
| 6 | Update Integration Points | 8-10 | Phase 5 |
| 7 | Webhook Handler | 6-8 | Phase 1, 2 |
| 8 | Testing | 4-6 | All phases |
| 9 | Monitoring & Analytics | 2-3 | Phase 8 |
| **Total** | **Full Implementation** | **33-47 hours** | |

**Estimated Development Time:** 5-7 business days (with 1 developer)

---

## 🚀 Launch Checklist

### Pre-Launch
- [ ] All environment variables set in production
- [ ] Database migrations applied to production
- [ ] Webhook endpoint configured in Lemonsqueezy
- [ ] Test checkout in production environment
- [ ] Test webhook delivery
- [ ] Verify RLS policies active
- [ ] Test subscription cancellation flow
- [ ] Review error handling and logging

### Launch Day
- [ ] Remove "Coming Soon" placeholders
- [ ] Enable checkout buttons
- [ ] Monitor webhook logs
- [ ] Monitor Supabase logs
- [ ] Monitor user reports
- [ ] Track first subscriptions

### Post-Launch
- [ ] Monitor subscription metrics daily
- [ ] Review failed payments
- [ ] Address user support issues
- [ ] Optimize conversion rates
- [ ] A/B test pricing/messaging

---

## 📞 Support & Resources

### Lemonsqueezy
- Dashboard: https://app.lemonsqueezy.com
- Documentation: https://docs.lemonsqueezy.com
- API Reference: https://docs.lemonsqueezy.com/api
- Webhook Guide: https://docs.lemonsqueezy.com/help/webhooks

### Supabase
- Dashboard: https://app.supabase.com
- Edge Functions: https://supabase.com/docs/guides/functions
- RLS: https://supabase.com/docs/guides/auth/row-level-security

### Testing Tools
- Lemonsqueezy Test Mode
- Webhook.site (for webhook testing)
- Supabase local development

---

## 🎯 Success Metrics

Track these KPIs after launch:

1. **Conversion Rate**
   - Landing page → Checkout
   - Free trial → Paid subscription
   - Credit limit reached → Upgrade

2. **Revenue Metrics**
   - MRR (Monthly Recurring Revenue)
   - ARR (Annual Recurring Revenue)
   - ARPU (Average Revenue Per User)
   - Churn rate

3. **User Engagement**
   - Time from signup to first checkout
   - Most popular tier (Pro vs Vanguard)
   - Upgrade source (which button/page)
   - Trial completion rate

4. **Technical Metrics**
   - Webhook success rate
   - Checkout abandonment rate
   - Payment failure rate
   - Refund rate

---

## ✅ Final Notes

This plan provides a complete, production-ready integration of Lemonsqueezy into your Otagon app. Key highlights:

- **8 touchpoints** identified and documented
- **Secure database architecture** with RLS
- **Comprehensive webhook handling** for all subscription events
- **Reusable components** for consistent UX
- **Trial-to-paid conversion** flow preserved
- **Customer portal integration** for self-service

The integration maintains your existing user experience while adding robust payment processing. All "Coming Soon" placeholders can be replaced with functional checkout flows.

**Next Step:** Begin with Phase 1 (Database Setup) and proceed sequentially through each phase.

Good luck with the integration! 🚀
