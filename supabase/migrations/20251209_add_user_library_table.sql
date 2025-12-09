-- ============================================================================
-- HQ LIBRARY TABLE
-- Purpose: Sync gaming library (own, wishlist, favorites, disliked) to Supabase
-- Migration: 20251209_add_user_library_table.sql
-- ============================================================================

-- ============================================================================
-- USER LIBRARY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Game identification
    igdb_game_id INTEGER NOT NULL,
    game_title TEXT NOT NULL,
    
    -- Library category
    category TEXT NOT NULL,
    
    -- Game metadata (from IGDB)
    igdb_data JSONB DEFAULT '{}'::jsonb,
    
    -- User metadata
    platform TEXT,
    personal_rating INTEGER CHECK (personal_rating >= 1 AND personal_rating <= 5),
    completion_status TEXT,
    hours_played DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    
    -- Timestamps
    date_added TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT library_category_check CHECK (category IN ('own', 'wishlist', 'favorite', 'disliked')),
    CONSTRAINT library_completion_status_check CHECK (
        completion_status IS NULL OR 
        completion_status IN ('not_started', 'playing', 'completed', 'abandoned')
    ),
    -- Unique constraint: user can only have one entry per game per category
    CONSTRAINT unique_user_game_category UNIQUE (auth_user_id, igdb_game_id, category)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_library_user ON public.user_library(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_library_game ON public.user_library(igdb_game_id);
CREATE INDEX IF NOT EXISTS idx_library_category ON public.user_library(category);
CREATE INDEX IF NOT EXISTS idx_library_user_category ON public.user_library(auth_user_id, category);
CREATE INDEX IF NOT EXISTS idx_library_updated_at ON public.user_library(updated_at DESC);

-- Comments
COMMENT ON TABLE public.user_library IS 'User game library (own, wishlist, favorites, disliked). Replaces localStorage for cross-device sync.';
COMMENT ON COLUMN public.user_library.category IS 'Library category: own, wishlist, favorite, or disliked';
COMMENT ON COLUMN public.user_library.completion_status IS 'Game completion status: not_started, playing, completed, or abandoned';
COMMENT ON COLUMN public.user_library.igdb_data IS 'Cached IGDB game data to reduce API calls';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;

-- Users can only see their own library
DROP POLICY IF EXISTS "Users can view own library" ON public.user_library;
CREATE POLICY "Users can view own library"
ON public.user_library FOR SELECT
TO authenticated
USING (auth_user_id = (SELECT auth.uid()));

-- Users can insert into their own library
DROP POLICY IF EXISTS "Users can insert own library" ON public.user_library;
CREATE POLICY "Users can insert own library"
ON public.user_library FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = (SELECT auth.uid()));

-- Users can update their own library
DROP POLICY IF EXISTS "Users can update own library" ON public.user_library;
CREATE POLICY "Users can update own library"
ON public.user_library FOR UPDATE
TO authenticated
USING (auth_user_id = (SELECT auth.uid()))
WITH CHECK (auth_user_id = (SELECT auth.uid()));

-- Users can delete from their own library
DROP POLICY IF EXISTS "Users can delete own library" ON public.user_library;
CREATE POLICY "Users can delete own library"
ON public.user_library FOR DELETE
TO authenticated
USING (auth_user_id = (SELECT auth.uid()));

-- ============================================================================
-- UPDATE EXISTING TABLES RLS
-- ============================================================================

-- User Screenshots: Only owner can access
ALTER TABLE public.user_screenshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own screenshots" ON public.user_screenshots;
CREATE POLICY "Users can view own screenshots"
ON public.user_screenshots FOR SELECT
TO authenticated
USING (auth_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own screenshots" ON public.user_screenshots;
CREATE POLICY "Users can insert own screenshots"
ON public.user_screenshots FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own screenshots" ON public.user_screenshots;
CREATE POLICY "Users can update own screenshots"
ON public.user_screenshots FOR UPDATE
TO authenticated
USING (auth_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own screenshots" ON public.user_screenshots;
CREATE POLICY "Users can delete own screenshots"
ON public.user_screenshots FOR DELETE
TO authenticated
USING (auth_user_id = (SELECT auth.uid()));

-- User Timeline: Only owner can access
ALTER TABLE public.user_timeline ENABLE ROW LEVEL SECURITY;

-- Drop old policies from previous migrations
DROP POLICY IF EXISTS "Users can insert own timeline events" ON public.user_timeline;
DROP POLICY IF EXISTS "Users can update own timeline events" ON public.user_timeline;
DROP POLICY IF EXISTS "Users can delete own timeline events" ON public.user_timeline;

DROP POLICY IF EXISTS "Users can view own timeline" ON public.user_timeline;
CREATE POLICY "Users can view own timeline"
ON public.user_timeline FOR SELECT
TO authenticated
USING (auth_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own timeline" ON public.user_timeline;
CREATE POLICY "Users can insert own timeline"
ON public.user_timeline FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own timeline" ON public.user_timeline;
CREATE POLICY "Users can update own timeline"
ON public.user_timeline FOR UPDATE
TO authenticated
USING (auth_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own timeline" ON public.user_timeline;
CREATE POLICY "Users can delete own timeline"
ON public.user_timeline FOR DELETE
TO authenticated
USING (auth_user_id = (SELECT auth.uid()));
