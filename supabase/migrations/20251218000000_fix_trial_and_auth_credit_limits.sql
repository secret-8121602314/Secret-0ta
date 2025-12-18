-- Fix remaining hardcoded credit limits in expire_trials and handle_new_user functions
-- Free: 20 text, 15 image (was 55/25)

-- Fix expire_trials function to use correct free tier limits
CREATE OR REPLACE FUNCTION public.expire_trials()
RETURNS TABLE(expired_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  -- Update users whose trial has expired
  UPDATE users
  SET 
    tier = 'free',
    text_limit = 20,
    image_limit = 15,
    updated_at = NOW()
  WHERE 
    trial_expires_at < NOW()
    AND tier = 'pro'
    AND has_used_trial = true
    AND trial_started_at IS NOT NULL;
  
  -- Get count of affected rows
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  -- Log the expiration
  RAISE NOTICE 'Expired % trial(s) at %', affected_rows, NOW();
  
  -- Return the count
  RETURN QUERY SELECT affected_rows;
END;
$$;

-- Fix handle_new_user trigger function to use correct free tier limits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.users (auth_user_id, email, full_name, avatar_url, tier, text_limit, image_limit)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url',
        'free',
        20,
        15
    ) ON CONFLICT (auth_user_id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the auth flow
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$;
