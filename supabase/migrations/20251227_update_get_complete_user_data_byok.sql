-- Update get_complete_user_data to include BYOK columns
-- Issue: BYOK columns added but RPC function doesn't return them
-- This causes the app to not load custom API key status

-- Drop the function first (required when changing return type)
DROP FUNCTION IF EXISTS public.get_complete_user_data(uuid);

-- Recreate with BYOK columns added
CREATE FUNCTION public.get_complete_user_data(p_auth_user_id uuid)
RETURNS TABLE(
  id uuid,
  auth_user_id uuid,
  email text,
  full_name text,
  avatar_url text,
  tier text,
  is_developer boolean,
  has_profile_setup boolean,
  has_seen_splash_screens boolean,
  has_seen_how_to_use boolean,
  has_seen_features_connected boolean,
  has_seen_pro_features boolean,
  has_seen_welcome_guide boolean,
  pc_connected boolean,
  pc_connection_skipped boolean,
  onboarding_completed boolean,
  has_welcome_message boolean,
  is_new_user boolean,
  has_used_trial boolean,
  text_count integer,
  image_count integer,
  text_limit integer,
  image_limit integer,
  total_requests integer,
  last_reset timestamp with time zone,
  -- ✅ BYOK (Bring Your Own Key) columns
  uses_custom_gemini_key boolean,
  gemini_api_key_encrypted text,
  custom_key_verified_at timestamp with time zone,
  had_custom_key_before boolean,
  -- Connection columns
  connection_code text,
  connection_code_created_at timestamp with time zone,
  connection_active boolean,
  connection_device_info jsonb,
  last_connection_at timestamp with time zone,
  -- Trial columns
  trial_started_at timestamp with time zone,
  trial_expires_at timestamp with time zone,
  -- JSON columns
  preferences jsonb,
  usage_data jsonb,
  app_state jsonb,
  profile_data jsonb,
  onboarding_data jsonb,
  behavior_data jsonb,
  feedback_data jsonb,
  -- Timestamps
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  last_login timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.auth_user_id,
    u.email,
    u.full_name,
    u.avatar_url,
    u.tier,
    u.is_developer,
    u.has_profile_setup,
    u.has_seen_splash_screens,
    u.has_seen_how_to_use,
    u.has_seen_features_connected,
    u.has_seen_pro_features,
    u.has_seen_welcome_guide,
    u.pc_connected,
    u.pc_connection_skipped,
    u.onboarding_completed,
    u.has_welcome_message,
    u.is_new_user,
    u.has_used_trial,
    u.text_count,
    u.image_count,
    u.text_limit,
    u.image_limit,
    u.total_requests,
    u.last_reset,
    -- ✅ BYOK columns
    u.uses_custom_gemini_key,
    u.gemini_api_key_encrypted,
    u.custom_key_verified_at,
    u.had_custom_key_before,
    -- Connection columns
    u.connection_code,
    u.connection_code_created_at,
    u.connection_active,
    u.connection_device_info,
    u.last_connection_at,
    -- Trial columns
    u.trial_started_at,
    u.trial_expires_at,
    -- JSON columns
    u.preferences,
    u.usage_data,
    u.app_state,
    u.profile_data,
    u.onboarding_data,
    u.behavior_data,
    u.feedback_data,
    -- Timestamps
    u.created_at,
    u.updated_at,
    u.last_login
  FROM public.users u
  WHERE u.auth_user_id = p_auth_user_id;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.get_complete_user_data(uuid) IS 
'Returns complete user data including BYOK (Bring Your Own Key) columns. Updated 2025-12-27 for custom API key support.';
