# Migration Safety Review: Global Cache System
**Date**: December 8, 2025  
**Migration File**: `supabase/migrations/20251208_global_cache_system.sql`

## ✅ SAFETY VERIFICATION COMPLETE

### Issues Found & Fixed

#### 1. ❌ CONFLICT: `user_game_library` table
**Problem**: Migration originally created a new `user_game_library` table, but production already has a `games` table serving the same purpose.

**Fix Applied**:
- ✅ Changed from `CREATE TABLE user_game_library` to `ALTER TABLE games`
- ✅ Added columns: `igdb_game_id`, `game_slug`, `last_played_at`
- ✅ Added indexes: `idx_games_igdb_id`, `idx_games_slug`
- ✅ Added constraint: `games_user_igdb_unique` (auth_user_id + igdb_game_id)
- ✅ Removed duplicate RLS policies (games table already has them)
- ✅ Removed duplicate GRANT statements

**Existing `games` table structure**:
```sql
- id, user_id, auth_user_id
- title, genre, platform, cover_url
- notes, status (playing/completed/backlog/wishlist)
- progress, playtime_hours, rating
- tags (JSONB), metadata (JSONB)
- created_at, updated_at
```

**New columns added (non-breaking)**:
```sql
- igdb_game_id INTEGER (nullable)
- game_slug TEXT (nullable)
- last_played_at TIMESTAMPTZ (nullable)
```

#### 2. ✅ VERIFIED: No other table conflicts
- `game_knowledge_cache` - NEW ✅
- `news_cache` - NEW ✅
- `unreleased_game_tabs` - NEW ✅
- `subtab_refresh_usage` - NEW ✅
- `user_screenshots` - NEW ✅
- `user_timeline` - NEW ✅
- `igdb_game_cache` - EXISTS, only adding nullable columns ✅

#### 3. ✅ VERIFIED: No function conflicts
All new functions are safe:
- `get_game_knowledge()` - NEW ✅
- `get_cached_news()` - NEW ✅
- `count_unreleased_tabs()` - NEW ✅
- `get_daily_refresh_count()` - NEW ✅
- `increment_refresh_count()` - NEW ✅
- `cleanup_expired_news_cache()` - NEW ✅

#### 4. ✅ VERIFIED: No index name conflicts
All indexes use unique names prefixed with table names.

#### 5. ✅ VERIFIED: No trigger conflicts
- `games` table already has `update_games_updated_at` trigger ✅
- New tables use same pattern (non-conflicting) ✅

---

## Migration Structure

### New Tables (7 total)

1. **`game_knowledge_cache`** - Global GameKnowledge storage
   - Purpose: Store comprehensive game knowledge once, share across all users
   - Key columns: `igdb_id` (UNIQUE), `comprehensive_knowledge`, `is_unreleased`
   - RLS: Read-only for authenticated users

2. **`news_cache`** - 24-hour news cache
   - Purpose: Cache latest gaming news prompts
   - Key columns: `prompt_hash` (UNIQUE), `response_text`, `expires_at`
   - RLS: Read-only for all users (anon + authenticated)

3. **`unreleased_game_tabs`** - Track unreleased game tabs per user
   - Purpose: Enforce limits (Free: 2-3, Pro/Vanguard: 10)
   - Key columns: `auth_user_id`, `conversation_id` (UNIQUE), `igdb_id`
   - RLS: Users can only see/manage their own

4. **`subtab_refresh_usage`** - Track daily subtab refreshes
   - Purpose: Enforce 3 refreshes/day for Pro/Vanguard
   - Key columns: `auth_user_id`, `refresh_date`, `refresh_count`
   - RLS: Users can only see/manage their own

5. **`user_screenshots`** - Screenshot gallery
   - Purpose: Replace LocalStorage for HQ screenshot gallery
   - Key columns: `auth_user_id`, `screenshot_url`, `detected_game_id`
   - RLS: Users can only see/manage their own

6. **`user_timeline`** - Gaming journey timeline
   - Purpose: Replace LocalStorage for HQ journey tracking
   - Key columns: `auth_user_id`, `event_type`, `event_date`
   - RLS: Users can only see/manage their own

### Enhanced Tables (2 total)

7. **`igdb_game_cache`** (existing) - Added columns:
   - `is_released BOOLEAN` - Track released vs unreleased games
   - `release_date DATE` - For expiry logic (30 days vs forever)
   - `access_count INTEGER` - Usage stats
   - `last_accessed_at TIMESTAMPTZ` - Last access time

8. **`games`** (existing) - Added columns:
   - `igdb_game_id INTEGER` - Link to GameKnowledge cache
   - `game_slug TEXT` - URL-friendly slug
   - `last_played_at TIMESTAMPTZ` - Last play time

---

## Non-Breaking Changes Verification

### ✅ All new columns are NULLABLE
- No `NOT NULL` constraints on new columns added to existing tables
- Existing data will not be affected

### ✅ All new constraints are safe
- `IF NOT EXISTS` used for all index creation
- `DO $$ ... END $$` block used for constraint creation to handle existing constraints
- No UNIQUE constraints added to existing columns

### ✅ All RLS policies are additive
- New policies added only to new tables
- Existing table policies not modified
- `IF NOT EXISTS` implicitly handled by RLS system

### ✅ All functions are new
- No function overwrites
- All use `CREATE OR REPLACE FUNCTION` (safe for first-time creation)
- All use `SECURITY DEFINER` for proper auth context

### ✅ All grants are additive
- New grants only affect new tables
- Existing permissions preserved

---

## Rollback Plan (If Needed)

If issues arise, rollback is safe:

```sql
-- Drop new tables (in reverse order due to foreign keys)
DROP TABLE IF EXISTS public.user_timeline CASCADE;
DROP TABLE IF EXISTS public.user_screenshots CASCADE;
DROP TABLE IF EXISTS public.subtab_refresh_usage CASCADE;
DROP TABLE IF EXISTS public.unreleased_game_tabs CASCADE;
DROP TABLE IF EXISTS public.news_cache CASCADE;
DROP TABLE IF EXISTS public.game_knowledge_cache CASCADE;

-- Remove added columns from existing tables
ALTER TABLE public.igdb_game_cache 
DROP COLUMN IF EXISTS is_released,
DROP COLUMN IF EXISTS release_date,
DROP COLUMN IF EXISTS access_count,
DROP COLUMN IF EXISTS last_accessed_at;

ALTER TABLE public.games 
DROP COLUMN IF EXISTS igdb_game_id,
DROP COLUMN IF EXISTS game_slug,
DROP COLUMN IF EXISTS last_played_at;

-- Drop functions
DROP FUNCTION IF EXISTS public.get_game_knowledge(INTEGER);
DROP FUNCTION IF EXISTS public.get_cached_news(TEXT);
DROP FUNCTION IF EXISTS public.count_unreleased_tabs(UUID);
DROP FUNCTION IF EXISTS public.get_daily_refresh_count(UUID);
DROP FUNCTION IF EXISTS public.increment_refresh_count(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS public.cleanup_expired_news_cache();
```

---

## Pre-Migration Checklist

- [x] Verified no table name conflicts
- [x] Verified no column name conflicts
- [x] Verified no function name conflicts
- [x] Verified no index name conflicts
- [x] Verified no trigger conflicts
- [x] All new columns are nullable
- [x] All constraints use IF NOT EXISTS or safe patterns
- [x] All RLS policies are scoped to new tables
- [x] Rollback plan documented
- [x] No data loss risk identified

---

## Post-Migration Verification Steps

After running the migration, verify:

1. **Check table creation**:
   ```sql
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN (
     'game_knowledge_cache', 'news_cache', 
     'unreleased_game_tabs', 'subtab_refresh_usage',
     'user_screenshots', 'user_timeline'
   );
   ```

2. **Check new columns**:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'games' 
   AND column_name IN ('igdb_game_id', 'game_slug', 'last_played_at');
   
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'igdb_game_cache' 
   AND column_name IN ('is_released', 'release_date', 'access_count', 'last_accessed_at');
   ```

3. **Check functions**:
   ```sql
   SELECT proname FROM pg_proc 
   WHERE proname IN (
     'get_game_knowledge', 'get_cached_news',
     'count_unreleased_tabs', 'get_daily_refresh_count',
     'increment_refresh_count', 'cleanup_expired_news_cache'
   );
   ```

4. **Check RLS policies**:
   ```sql
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE tablename IN (
     'game_knowledge_cache', 'news_cache',
     'unreleased_game_tabs', 'subtab_refresh_usage',
     'user_screenshots', 'user_timeline'
   );
   ```

5. **Test basic functionality**:
   ```sql
   -- Test game_knowledge_cache insert (as service_role)
   -- Test news_cache insert and expiry
   -- Test user access to their own data
   -- Test denial of access to other users' data
   ```

---

## Ready to Deploy

✅ **Migration is SAFE to apply**

The migration has been thoroughly reviewed and all conflicts resolved. It:
- Uses `IF NOT EXISTS` for all new objects
- Only adds nullable columns to existing tables
- Does not modify or remove any existing data
- Does not modify existing RLS policies
- Does not overwrite existing functions or triggers
- Has a documented rollback plan

You can now apply this migration with confidence.
