-- Create missing database functions

-- Function to get user onboarding status
CREATE OR REPLACE FUNCTION public.get_user_onboarding_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    user_record public.users%ROWTYPE;
    result jsonb;
BEGIN
    SELECT * INTO user_record 
    FROM public.users 
    WHERE auth_user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN '{"error": "User not found"}'::jsonb;
    END IF;
    
    -- Build the result object
    result := jsonb_build_object(
        'user_id', user_record.id,
        'auth_user_id', user_record.auth_user_id,
        'email', user_record.email,
        'tier', user_record.tier,
        'is_developer', user_record.is_developer,
        'has_profile_setup', user_record.has_profile_setup,
        'has_seen_splash_screens', user_record.has_seen_splash_screens,
        'has_welcome_message', user_record.has_welcome_message,
        'onboarding_completed', user_record.onboarding_completed,
        'created_at', user_record.created_at,
        'updated_at', user_record.updated_at
    );
    
    RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_onboarding_status TO authenticated;

-- Also create the update function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_user_onboarding_status(
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
    
    -- Update user onboarding data
    UPDATE public.users 
    SET 
        onboarding_data = onboarding_data || jsonb_build_object(p_status, p_data),
        updated_at = now()
    WHERE auth_user_id = p_user_id;
    
    -- Insert progress record
    INSERT INTO public.onboarding_progress (user_id, step, data)
    VALUES (v_user_id, p_status, p_data);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_user_onboarding_status TO authenticated;
