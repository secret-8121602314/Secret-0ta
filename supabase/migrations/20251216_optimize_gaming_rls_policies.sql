-- Optimize RLS Policies for Gaming Tables
-- Replace auth.uid() with (select auth.uid()) to prevent re-evaluation per row
-- This improves query performance at scale

-- ============================================================================
-- GAMING_PROFILES TABLE - Optimize RLS Policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own gaming profile" ON gaming_profiles;
DROP POLICY IF EXISTS "Users can insert their own gaming profile" ON gaming_profiles;
DROP POLICY IF EXISTS "Users can update their own gaming profile" ON gaming_profiles;
DROP POLICY IF EXISTS "Users can delete their own gaming profile" ON gaming_profiles;

-- Create optimized policies
CREATE POLICY "Users can view their own gaming profile"
    ON gaming_profiles FOR SELECT
    USING ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can insert their own gaming profile"
    ON gaming_profiles FOR INSERT
    WITH CHECK ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can update their own gaming profile"
    ON gaming_profiles FOR UPDATE
    USING ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can delete their own gaming profile"
    ON gaming_profiles FOR DELETE
    USING ((select auth.uid()) = auth_user_id);

-- ============================================================================
-- GAMING_SEARCH_HISTORY TABLE - Optimize RLS Policies
-- ============================================================================

-- Drop existing policies (both old and new naming conventions)
DROP POLICY IF EXISTS "Users can view their own search history" ON gaming_search_history;
DROP POLICY IF EXISTS "Users can insert their own search history" ON gaming_search_history;
DROP POLICY IF EXISTS "Users can insert to their own search history" ON gaming_search_history;
DROP POLICY IF EXISTS "Users can update their own search history" ON gaming_search_history;
DROP POLICY IF EXISTS "Users can delete their own search history" ON gaming_search_history;
DROP POLICY IF EXISTS "Users can delete from their own search history" ON gaming_search_history;

-- Create optimized policies
CREATE POLICY "Users can view their own search history"
    ON gaming_search_history FOR SELECT
    USING ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can insert their own search history"
    ON gaming_search_history FOR INSERT
    WITH CHECK ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can update their own search history"
    ON gaming_search_history FOR UPDATE
    USING ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can delete their own search history"
    ON gaming_search_history FOR DELETE
    USING ((select auth.uid()) = auth_user_id);

-- ============================================================================
-- GAMING_KNOWLEDGE TABLE - Optimize RLS Policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own gaming knowledge" ON gaming_knowledge;
DROP POLICY IF EXISTS "Users can insert their own gaming knowledge" ON gaming_knowledge;
DROP POLICY IF EXISTS "Users can update their own gaming knowledge" ON gaming_knowledge;
DROP POLICY IF EXISTS "Users can delete their own gaming knowledge" ON gaming_knowledge;

-- Create optimized policies
CREATE POLICY "Users can view their own gaming knowledge"
    ON gaming_knowledge FOR SELECT
    USING ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can insert their own gaming knowledge"
    ON gaming_knowledge FOR INSERT
    WITH CHECK ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can update their own gaming knowledge"
    ON gaming_knowledge FOR UPDATE
    USING ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can delete their own gaming knowledge"
    ON gaming_knowledge FOR DELETE
    USING ((select auth.uid()) = auth_user_id);

-- Comment for documentation
COMMENT ON TABLE gaming_profiles IS 'RLS policies optimized with (select auth.uid()) for better performance at scale';
COMMENT ON TABLE gaming_search_history IS 'RLS policies optimized with (select auth.uid()) for better performance at scale';
COMMENT ON TABLE gaming_knowledge IS 'RLS policies optimized with (select auth.uid()) for better performance at scale';
