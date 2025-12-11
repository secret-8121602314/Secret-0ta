-- ========================================
-- LEMONSQUEEZY PAYMENT INTEGRATION
-- Migration: Subscriptions & Payment Tracking
-- Date: 2025-12-11
-- ========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. CREATE SUBSCRIPTIONS TABLE
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
    price_amount INTEGER, -- in cents
    currency TEXT DEFAULT 'USD',
    
    -- Important Dates
    trial_ends_at TIMESTAMPTZ,
    renews_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ, -- for cancelled subscriptions
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.subscriptions IS 'Tracks user subscriptions from LemonSqueezy';
COMMENT ON COLUMN public.subscriptions.lemon_subscription_id IS 'LemonSqueezy subscription ID (unique identifier)';
COMMENT ON COLUMN public.subscriptions.tier IS 'Subscription tier: pro ($5/month) or vanguard_pro ($35/year)';
COMMENT ON COLUMN public.subscriptions.status IS 'Current subscription status';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_lemon_id ON public.subscriptions(lemon_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON public.subscriptions(lemon_customer_id);

-- ========================================
-- 2. CREATE PAYMENT EVENTS LOG TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Event Details
    event_type TEXT NOT NULL, -- subscription_created, subscription_updated, etc.
    event_name TEXT NOT NULL,
    lemon_event_id TEXT UNIQUE,
    
    -- Raw webhook payload (for debugging)
    payload JSONB NOT NULL,
    
    -- Processing status
    processed BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.payment_events IS 'Logs all webhook events from LemonSqueezy for debugging and audit trail';
COMMENT ON COLUMN public.payment_events.payload IS 'Full webhook payload as JSON';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_events_subscription ON public.payment_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_user ON public.payment_events(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_type ON public.payment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_events_created ON public.payment_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_events_processed ON public.payment_events(processed);

-- ========================================
-- 3. UPDATE USERS TABLE
-- ========================================

-- Add subscription reference columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS active_subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS lemon_customer_id TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_active_subscription ON public.users(active_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_lemon_customer ON public.users(lemon_customer_id);

-- Add comments
COMMENT ON COLUMN public.users.active_subscription_id IS 'Reference to current active subscription';
COMMENT ON COLUMN public.users.lemon_customer_id IS 'LemonSqueezy customer ID for this user';

-- ========================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
    ON public.subscriptions FOR SELECT
    TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = (SELECT auth.uid())
        )
    );

-- Policy: Service role can do everything (for webhooks)
CREATE POLICY "Service role has full access to subscriptions"
    ON public.subscriptions
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Enable RLS on payment_events table
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own payment events
CREATE POLICY "Users can view own payment events"
    ON public.payment_events FOR SELECT
    TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = (SELECT auth.uid())
        )
    );

-- Policy: Service role can do everything (for webhooks)
CREATE POLICY "Service role has full access to payment events"
    ON public.payment_events
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ========================================
-- 5. HELPER FUNCTIONS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-update updated_at on subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get user's active subscription
CREATE OR REPLACE FUNCTION public.get_user_active_subscription(p_auth_user_id UUID)
RETURNS TABLE (
    subscription_id UUID,
    tier TEXT,
    status TEXT,
    renews_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as subscription_id,
        s.tier,
        s.status,
        s.renews_at,
        s.ends_at
    FROM public.subscriptions s
    INNER JOIN public.users u ON s.user_id = u.id
    WHERE u.auth_user_id = p_auth_user_id
        AND s.status IN ('active', 'on_trial')
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.user_has_active_subscription(p_auth_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_subscription BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.subscriptions s
        INNER JOIN public.users u ON s.user_id = u.id
        WHERE u.auth_user_id = p_auth_user_id
            AND s.status IN ('active', 'on_trial')
    ) INTO has_subscription;
    
    RETURN has_subscription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ========================================
-- 6. GRANTS (Security)
-- ========================================

-- Grant necessary permissions
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.payment_events TO authenticated;

-- Service role needs full access for webhooks
GRANT ALL ON public.subscriptions TO service_role;
GRANT ALL ON public.payment_events TO service_role;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

-- Verify tables were created
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Created tables: subscriptions, payment_events';
    RAISE NOTICE 'Updated table: users (added subscription references)';
    RAISE NOTICE 'Created RLS policies for security';
    RAISE NOTICE 'Created helper functions: get_user_active_subscription, user_has_active_subscription';
END $$;
