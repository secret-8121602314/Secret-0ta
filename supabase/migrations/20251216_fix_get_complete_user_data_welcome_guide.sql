-- Fix get_complete_user_data to include has_seen_welcome_guide column
-- Issue: Column exists in users table but RPC function doesn't return it
-- This causes the app to always load has_seen_welcome_guide as false

-- Drop the function first (required when changing return type)
DROP FUNCTION IF EXISTS public.get_complete_user_data(uuid);

-- Recreate with has_seen_welcome_guide column added
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
  has_seen_welcome_guide boolean,  -- ✅ ADDED THIS LINE
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
  preferences jsonb,
  usage_data jsonb,
  app_state jsonb,
  profile_data jsonb,
  onboarding_data jsonb,
  behavior_data jsonb,
  feedback_data jsonb,
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
    u.has_seen_welcome_guide,  -- ✅ ADDED THIS LINE
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
    u.preferences,
    u.usage_data,
    u.app_state,
    u.profile_data,
    u.onboarding_data,
    u.behavior_data,
    u.feedback_data,
    u.created_at,
    u.updated_at,
    u.last_login
  FROM public.users u
  WHERE u.auth_user_id = p_auth_user_id;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.get_complete_user_data(uuid) IS 
'Returns complete user data including all onboarding flags. Updated 2025-12-16 to include has_seen_welcome_guide.';
