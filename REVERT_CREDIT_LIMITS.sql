-- Revert credit limits back to original values
-- Free: 55 text, 25 image
-- Pro/Vanguard: 1583 text, 328 image

-- Revert the create_user_record function to original limits
CREATE OR REPLACE FUNCTION public.create_user_record(
  p_auth_user_id uuid,
  p_email text,
  p_full_name text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_is_developer boolean DEFAULT false,
  p_tier text DEFAULT 'free'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_user_id UUID;
  v_text_limit INTEGER;
  v_image_limit INTEGER;
BEGIN
  -- Set limits based on tier (ORIGINAL VALUES)
  CASE p_tier
    WHEN 'pro' THEN
      v_text_limit := 1583;
      v_image_limit := 328;
    WHEN 'vanguard_pro' THEN
      v_text_limit := 1583;
      v_image_limit := 328;
    ELSE
      v_text_limit := 55;
      v_image_limit := 25;
  END CASE;

  INSERT INTO public.users (
    auth_user_id,
    email,
    full_name,
    avatar_url,
    is_developer,
    tier,
    text_limit,
    image_limit,
    created_at,
    updated_at
  ) VALUES (
    p_auth_user_id,
    p_email,
    p_full_name,
    p_avatar_url,
    p_is_developer,
    p_tier,
    v_text_limit,
    v_image_limit,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$;

-- Revert existing users' limits back to original values
UPDATE public.users
SET 
  text_limit = CASE tier
    WHEN 'pro' THEN 1583
    WHEN 'vanguard_pro' THEN 1583
    ELSE 55
  END,
  image_limit = CASE tier
    WHEN 'pro' THEN 328
    WHEN 'vanguard_pro' THEN 328
    ELSE 25
  END,
  updated_at = NOW()
WHERE 
  (tier = 'free' AND (text_limit != 55 OR image_limit != 25))
  OR (tier IN ('pro', 'vanguard_pro') AND (text_limit != 1583 OR image_limit != 328));

-- Revert default values in users table to original
ALTER TABLE public.users 
  ALTER COLUMN text_limit SET DEFAULT 55,
  ALTER COLUMN image_limit SET DEFAULT 25;
