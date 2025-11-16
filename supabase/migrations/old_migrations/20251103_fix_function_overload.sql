-- Fix function overloading error for get_user_id_from_auth_id
-- Error: PGRST203 - Could not choose the best candidate function
-- Solution: Drop all versions and recreate with explicit signature

-- Drop any existing versions of the function with different signatures
DROP FUNCTION IF EXISTS public.get_user_id_from_auth_id(text);
DROP FUNCTION IF EXISTS public.get_user_id_from_auth_id(uuid);
DROP FUNCTION IF EXISTS public.get_user_id_from_auth_id(p_auth_user_id text);
DROP FUNCTION IF EXISTS public.get_user_id_from_auth_id(p_auth_user_id uuid);

-- Recreate with explicit UUID type (auth.users.id is UUID)
CREATE OR REPLACE FUNCTION public.get_user_id_from_auth_id(p_auth_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM public.users
  WHERE auth_user_id = p_auth_user_id
  LIMIT 1;
  
  RETURN v_user_id;
END;
$$;

COMMENT ON FUNCTION public.get_user_id_from_auth_id(UUID) IS 
'Helper function to resolve auth_user_id (UUID from auth.users) to internal user.id. 
Eliminates N+1 query pattern in createConversation().
Security: DEFINER allows function to bypass RLS for lookup.
Performance: STABLE hint tells query planner result won't change within transaction.';
