-- ============================================================================
-- Add RPC function to resolve user_id from auth_user_id
-- ============================================================================
-- This function is used by the client to get the internal user_id from auth.users.id
-- Execute this in Supabase SQL Editor
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_user_id_from_auth_id(uuid);

-- Create the function
CREATE OR REPLACE FUNCTION public.get_user_id_from_auth_id(auth_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  internal_user_id uuid;
BEGIN
  -- Look up the internal user_id from the users table
  SELECT id INTO internal_user_id
  FROM public.users
  WHERE auth_user_id = auth_id;
  
  -- Return the internal user_id (will be NULL if not found)
  RETURN internal_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_id_from_auth_id(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_user_id_from_auth_id IS 'Resolves internal user_id from auth.users.id';
