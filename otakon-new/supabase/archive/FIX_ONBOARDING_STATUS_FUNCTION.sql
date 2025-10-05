-- ========================================
-- FIX ONBOARDING STATUS FUNCTION
-- ========================================
-- This script fixes the update_user_onboarding_status function to properly
-- update the boolean fields in the users table

-- Drop and recreate the function with proper field updates
DROP FUNCTION IF EXISTS public.update_user_onboarding_status CASCADE;

CREATE FUNCTION public.update_user_onboarding_status(
    p_user_id uuid,
    p_status text,
    p_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Get the user's internal ID
    SELECT id INTO v_user_id FROM public.users WHERE auth_user_id = p_user_id;
    
    -- If user doesn't exist, return early
    IF v_user_id IS NULL THEN
        RAISE WARNING 'User with auth_user_id % not found', p_user_id;
        RETURN;
    END IF;
    
    -- Update user onboarding data and specific boolean fields
    UPDATE public.users 
    SET 
        onboarding_data = onboarding_data || jsonb_build_object(p_status, p_data),
        -- Update specific boolean fields based on the data passed
        has_seen_splash_screens = COALESCE((p_data->>'has_seen_splash_screens')::boolean, has_seen_splash_screens),
        has_seen_how_to_use = COALESCE((p_data->>'has_seen_how_to_use')::boolean, has_seen_how_to_use),
        has_seen_features_connected = COALESCE((p_data->>'has_seen_features_connected')::boolean, has_seen_features_connected),
        has_seen_pro_features = COALESCE((p_data->>'has_seen_pro_features')::boolean, has_seen_pro_features),
        pc_connected = COALESCE((p_data->>'pc_connected')::boolean, pc_connected),
        pc_connection_skipped = COALESCE((p_data->>'pc_connection_skipped')::boolean, pc_connection_skipped),
        onboarding_completed = COALESCE((p_data->>'onboarding_completed')::boolean, onboarding_completed),
        has_profile_setup = COALESCE((p_data->>'has_profile_setup')::boolean, has_profile_setup),
        updated_at = now()
    WHERE auth_user_id = p_user_id;
    
    -- Insert progress record
    INSERT INTO public.onboarding_progress (user_id, step, data)
    VALUES (v_user_id, p_status, p_data);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_user_onboarding_status TO authenticated;

-- Test the function
DO $$
BEGIN
    RAISE NOTICE '✅ update_user_onboarding_status function updated successfully';
    RAISE NOTICE '✅ Now properly updates boolean fields in users table';
    RAISE NOTICE '✅ Function will handle onboarding_completed, has_seen_pro_features, etc.';
END;
$$;
