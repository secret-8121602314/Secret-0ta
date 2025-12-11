-- Fix security warning: Add search_path to functions
-- This prevents SQL injection attacks via search_path manipulation

-- Update upsert_subscription function with secure search_path
CREATE OR REPLACE FUNCTION public.upsert_subscription(
  p_user_id UUID,
  p_lemon_subscription_id TEXT,
  p_lemon_customer_id TEXT,
  p_tier TEXT,
  p_status TEXT
)
RETURNS UUID AS $$
DECLARE
  v_subscription_id UUID;
BEGIN
  INSERT INTO public.subscriptions (
    user_id, lemon_subscription_id, lemon_customer_id, 
    lemon_product_id, lemon_variant_id, tier, status, 
    billing_interval, updated_at
  ) VALUES (
    p_user_id, p_lemon_subscription_id, p_lemon_customer_id,
    '724192', CASE WHEN p_tier = 'vanguard_pro' THEN '1139844' ELSE '1139861' END,
    p_tier, p_status,
    CASE WHEN p_tier = 'vanguard_pro' THEN 'year' ELSE 'month' END,
    NOW()
  )
  ON CONFLICT (lemon_subscription_id) DO UPDATE SET
    status = EXCLUDED.status,
    tier = EXCLUDED.tier,
    updated_at = NOW()
  RETURNING id INTO v_subscription_id;
  
  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update update_user_tier function with secure search_path
CREATE OR REPLACE FUNCTION public.update_user_tier(
  p_user_id UUID,
  p_tier TEXT,
  p_text_limit INTEGER,
  p_image_limit INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users SET
    tier = p_tier,
    trial_expires_at = NULL,
    text_limit = p_text_limit,
    image_limit = p_image_limit,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
