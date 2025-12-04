-- Fix missing tables and RLS policies for ai_shown_prompts and igdb_game_cache
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Create ai_shown_prompts if it doesn't exist
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_shown_prompts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL,
  conversation_id text,
  prompt_text text NOT NULL,
  prompt_type text NOT NULL CHECK (prompt_type = ANY (ARRAY['inline'::text, 'news'::text, 'suggested'::text, 'exploration'::text, 'help'::text, 'followup'::text])),
  game_title text,
  shown_at timestamp with time zone DEFAULT now(),
  clicked boolean DEFAULT false,
  clicked_at timestamp with time zone,
  CONSTRAINT ai_shown_prompts_pkey PRIMARY KEY (id),
  CONSTRAINT ai_shown_prompts_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================
-- 2. Create igdb_game_cache if it doesn't exist
-- ============================================
CREATE TABLE IF NOT EXISTS public.igdb_game_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  game_name_key text NOT NULL UNIQUE,
  igdb_id integer,
  game_data jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  CONSTRAINT igdb_game_cache_pkey PRIMARY KEY (id)
);

-- ============================================
-- 3. Enable RLS on both tables
-- ============================================
ALTER TABLE public.ai_shown_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.igdb_game_cache ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS Policies for ai_shown_prompts
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own shown prompts" ON public.ai_shown_prompts;
DROP POLICY IF EXISTS "Users can insert their own shown prompts" ON public.ai_shown_prompts;
DROP POLICY IF EXISTS "Users can update their own shown prompts" ON public.ai_shown_prompts;

-- Create new policies
CREATE POLICY "Users can view their own shown prompts"
  ON public.ai_shown_prompts FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own shown prompts"
  ON public.ai_shown_prompts FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own shown prompts"
  ON public.ai_shown_prompts FOR UPDATE
  USING (auth.uid() = auth_user_id);

-- ============================================
-- 5. RLS Policies for igdb_game_cache (public read, no insert for users)
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read game cache" ON public.igdb_game_cache;
DROP POLICY IF EXISTS "Authenticated users can read game cache" ON public.igdb_game_cache;
DROP POLICY IF EXISTS "Service role can manage game cache" ON public.igdb_game_cache;

-- Allow authenticated users to read the cache
CREATE POLICY "Authenticated users can read game cache"
  ON public.igdb_game_cache FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert (for caching game data)
CREATE POLICY "Authenticated users can insert game cache"
  ON public.igdb_game_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- 6. Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ai_shown_prompts_auth_user_id ON public.ai_shown_prompts(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_ai_shown_prompts_shown_at ON public.ai_shown_prompts(shown_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_shown_prompts_prompt_type ON public.ai_shown_prompts(prompt_type);
CREATE INDEX IF NOT EXISTS idx_igdb_game_cache_game_name_key ON public.igdb_game_cache(game_name_key);
CREATE INDEX IF NOT EXISTS idx_igdb_game_cache_expires_at ON public.igdb_game_cache(expires_at);

-- ============================================
-- 7. Refresh the schema cache
-- ============================================
NOTIFY pgrst, 'reload schema';

-- Verify tables exist
SELECT 'ai_shown_prompts exists: ' || EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'ai_shown_prompts'
) as ai_shown_prompts_check;

SELECT 'igdb_game_cache exists: ' || EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'igdb_game_cache'
) as igdb_game_cache_check;
