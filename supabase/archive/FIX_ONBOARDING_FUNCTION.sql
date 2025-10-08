-- Fix for update_user_onboarding_status function
-- This fixes the null user_id constraint violation

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
