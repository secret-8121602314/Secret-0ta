-- New functions for 12-hour welcome message logic and app state persistence
-- Run these functions only - your existing schema is already set up

-- Update welcome message shown (enhanced with timestamp)
CREATE OR REPLACE FUNCTION public.update_welcome_message_shown(p_user_id UUID, p_message_type TEXT DEFAULT 'standard')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.users
    SET onboarding_data = COALESCE(onboarding_data, '{}'::jsonb) || 
        jsonb_build_object(
            'welcome_message_shown', true,
            'welcome_message_type', p_message_type,
            'last_welcome_time', NOW()
        ),
        updated_at = NOW()
    WHERE auth_user_id = p_user_id;
END;
$$;

-- Should show welcome message (enhanced with 12-hour logic)
CREATE OR REPLACE FUNCTION public.should_show_welcome_message(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_onboarding_data JSONB;
    last_welcome_time TIMESTAMPTZ;
    time_since_last_welcome INTERVAL;
BEGIN
    SELECT onboarding_data INTO user_onboarding_data
    FROM public.users
    WHERE auth_user_id = p_user_id;
    
    -- If no onboarding data, show welcome message
    IF user_onboarding_data IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- If welcome message was never shown, show it
    IF NOT COALESCE(user_onboarding_data->>'welcome_message_shown', 'false')::BOOLEAN THEN
        RETURN TRUE;
    END IF;
    
    -- Check if it's been 12+ hours since last welcome message
    last_welcome_time := (user_onboarding_data->>'last_welcome_time')::TIMESTAMPTZ;
    
    IF last_welcome_time IS NULL THEN
        RETURN TRUE;
    END IF;
    
    time_since_last_welcome := NOW() - last_welcome_time;
    
    -- Show welcome message if it's been 12+ hours
    RETURN time_since_last_welcome >= INTERVAL '12 hours';
END;
$$;

-- Save app state
CREATE OR REPLACE FUNCTION public.save_app_state(p_user_id UUID, p_app_state JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.users
    SET app_state = p_app_state,
        updated_at = NOW()
    WHERE auth_user_id = p_user_id;
END;
$$;

-- Get app state
CREATE OR REPLACE FUNCTION public.get_app_state(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT app_state INTO result
    FROM public.users
    WHERE auth_user_id = p_user_id;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Reset welcome message tracking
CREATE OR REPLACE FUNCTION public.reset_welcome_message_tracking(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.users
    SET onboarding_data = COALESCE(onboarding_data, '{}'::jsonb) || 
        jsonb_build_object(
            'welcome_message_shown', false,
            'last_welcome_time', NULL
        ),
        updated_at = NOW()
    WHERE auth_user_id = p_user_id;
END;
$$;

-- Mark first run completed
CREATE OR REPLACE FUNCTION public.mark_first_run_completed(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.users
    SET onboarding_data = COALESCE(onboarding_data, '{}'::jsonb) || 
        jsonb_build_object(
            'first_run_completed', true,
            'first_run_completed_at', NOW()
        ),
        updated_at = NOW()
    WHERE auth_user_id = p_user_id;
END;
$$;
