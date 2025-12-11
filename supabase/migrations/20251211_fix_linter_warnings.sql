-- ========================================
-- CLEANUP & FIX LEMONSQUEEZY MIGRATION
-- Run this to fix linter warnings
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role has full access to subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view own payment events" ON public.payment_events;
DROP POLICY IF EXISTS "Service role has full access to payment events" ON public.payment_events;

-- Recreate policies with fixes

-- Policy: Users can view their own subscriptions (FIXED: optimized for performance)
CREATE POLICY "Users can view own subscriptions"
    ON public.subscriptions FOR SELECT
    TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = (SELECT auth.uid())
        )
    );

-- Policy: Service role can do everything (FIXED: targets only service_role)
CREATE POLICY "Service role has full access to subscriptions"
    ON public.subscriptions
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy: Users can view their own payment events (FIXED: optimized for performance)
CREATE POLICY "Users can view own payment events"
    ON public.payment_events FOR SELECT
    TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = (SELECT auth.uid())
        )
    );

-- Policy: Service role can do everything (FIXED: targets only service_role)
CREATE POLICY "Service role has full access to payment events"
    ON public.payment_events
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Recreate functions with fixed search_path

-- Function to update updated_at timestamp (FIXED)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get user's active subscription (FIXED)
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

-- Function to check if user has active subscription (FIXED)
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

-- Done!
DO $$
BEGIN
    RAISE NOTICE '✅ All linter warnings fixed!';
    RAISE NOTICE 'Re-run the linter to verify - all warnings should be gone.';
END $$;
