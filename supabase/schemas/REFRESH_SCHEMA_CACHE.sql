-- Refresh the schema cache for the users table
-- This fixes the PGRST204 error when the PostgREST schema cache is out of sync

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';

-- Alternative: If the above doesn't work, you can also force a schema cache refresh
-- by making a minor schema change (like adding and removing a comment)
COMMENT ON TABLE public.users IS 'Core user table with auth_user_id referencing auth.users(id) - Updated to refresh cache';
