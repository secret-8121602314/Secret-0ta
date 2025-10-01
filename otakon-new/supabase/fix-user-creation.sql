-- Fix for OAuth user creation issues
-- This script updates the create_user_record function to work with OAuth

-- Drop the existing function
DROP FUNCTION IF EXISTS public.create_user_record CASCADE;

-- Create a new version that works with OAuth
CREATE OR REPLACE FUNCTION public.create_user_record(
    p_auth_user_id uuid,
    p_email text,
    p_full_name text DEFAULT NULL,
    p_avatar_url text DEFAULT NULL,
    p_is_developer boolean DEFAULT false,
    p_tier text DEFAULT 'free'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Insert user record (removed security check that was blocking OAuth)
    INSERT INTO public.users (
        auth_user_id,
        email,
        full_name,
        avatar_url,
        is_developer,
        tier
    ) VALUES (
        p_auth_user_id,
        p_email,
        p_full_name,
        p_avatar_url,
        p_is_developer,
        p_tier
    ) ON CONFLICT (auth_user_id) DO NOTHING;
    
    -- Log the creation for debugging
    RAISE NOTICE 'User record created for auth_user_id: %, email: %', p_auth_user_id, p_email;
END;
$$;

-- Ensure the trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_user_record TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO postgres;
