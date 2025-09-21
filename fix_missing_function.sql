-- ========================================
-- 🚨 URGENT FIX: Missing update_welcome_message_shown Function
-- ========================================
-- This script fixes the missing function error in the authentication flow

-- Drop existing function if it exists with wrong signature
DROP FUNCTION IF EXISTS public.update_welcome_message_shown CASCADE;

-- Create the correct function with proper signature
CREATE OR REPLACE FUNCTION public.update_welcome_message_shown(p_user_id UUID, p_message_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
BEGIN
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Update welcome message status
    UPDATE public.users 
    SET has_welcome_message = true, updated_at = NOW()
    WHERE id = internal_user_id;
    
    RETURN jsonb_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_welcome_message_shown(UUID, TEXT) TO authenticated;

-- Verify function was created
SELECT '✅ update_welcome_message_shown function created successfully!' as status;

-- Show function signature
SELECT 
    routine_name,
    parameter_name,
    data_type,
    parameter_mode
FROM information_schema.parameters 
WHERE specific_schema = 'public' 
AND routine_name = 'update_welcome_message_shown'
ORDER BY ordinal_position;
