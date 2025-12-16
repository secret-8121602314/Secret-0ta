-- Update credit limits for new tier structure
-- Free: 20 text, 15 image
-- Pro/Vanguard: 350 text, 150 image

-- Update the create_user_record function
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
  -- Set limits based on tier
  CASE p_tier
    WHEN 'pro' THEN
      v_text_limit := 350;
      v_image_limit := 150;
    WHEN 'vanguard_pro' THEN
      v_text_limit := 350;
      v_image_limit := 150;
    ELSE
      v_text_limit := 20;
      v_image_limit := 15;
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

-- Update existing users' limits to new values
UPDATE public.users
SET 
  text_limit = CASE tier
    WHEN 'pro' THEN 350
    WHEN 'vanguard_pro' THEN 350
    ELSE 20
  END,
  image_limit = CASE tier
    WHEN 'pro' THEN 150
    WHEN 'vanguard_pro' THEN 150
    ELSE 15
  END,
  updated_at = NOW()
WHERE 
  (tier = 'free' AND (text_limit != 20 OR image_limit != 15))
  OR (tier IN ('pro', 'vanguard_pro') AND (text_limit != 350 OR image_limit != 150));

-- Update default values in users table
ALTER TABLE public.users 
  ALTER COLUMN text_limit SET DEFAULT 20,
  ALTER COLUMN image_limit SET DEFAULT 15;
