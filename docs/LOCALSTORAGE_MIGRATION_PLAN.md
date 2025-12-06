# LocalStorage to Supabase Migration Plan

## Overview

This document outlines all localStorage keys used in the Otagon app and the strategy for migrating Gaming Explorer data to Supabase.

---

## 🗂️ Complete LocalStorage Key Inventory

### 1. Gaming Explorer Keys (TO BE MIGRATED TO SUPABASE)

| Key | Description | Migration Status |
|-----|-------------|------------------|
| `otagon_gaming_library` | Game library (own, wishlist, favorites, disliked) | ✅ Ready - `gaming_library` table |
| `otagon_gaming_timeline` | Timeline events (consoles, PC builds, games, albums) | ✅ Ready - `gaming_timeline` table |
| `otagon_timeline_albums` | Photo albums for timeline | ✅ Ready - Part of `gaming_timeline` |
| `otagon_timeline_photos` | Photos in albums | ✅ Ready - Part of `gaming_timeline.photos` |
| `otagon_gaming_news_cache` | Cached gaming news from AI | ✅ Ready - `gaming_news_cache` table |
| `otagon_news_generation_log` | Rate limiting for news generation | ✅ Ready - Tracked in `gaming_news_cache` |
| `otagon_game_knowledge` | AI-extracted game guides and tips | ✅ Ready - `gaming_knowledge` table |
| `otagon_user_gaming_profile` | User gaming profile (start year, stats) | ✅ Ready - `gaming_profiles` table |
| `otagon_gameplay_sessions` | Grouped gameplay screenshots | ⚠️ Optional - Can use Gallery instead |
| `otagon_igdb_home_cache` | IGDB home tab cache (24hr TTL) | ✅ Ready - `igdb_home_cache` table |
| `otagon_game_search_history` | Recently searched games | ✅ Ready - `gaming_search_history` table |

### 2. IGDB/API Cache Keys (KEEP IN LOCALSTORAGE - Short TTL)

| Key | Description | TTL | Migration |
|-----|-------------|-----|-----------|
| `igdb_game_cache` | IGDB game data cache | 4 hours | ❌ No - Short-lived cache |
| `igdb_cover_cache` | IGDB cover art URLs | 4 hours | ❌ No - Short-lived cache |

### 3. User Session/Auth Keys (KEEP IN LOCALSTORAGE)

| Key | Description | Migration |
|-----|-------------|-----------|
| `otakon_user` | Cached user data | ❌ No - Session data |
| `otakon_remember_me` | Remember me preference | ❌ No - Local preference |
| `otakon_remembered_email` | Remembered email | ❌ No - Local preference |
| `otakon_session_refreshed` | Session refresh timestamp | ❌ No - Session tracking |
| `otakon_last_session_check` | Last session check time | ❌ No - Session tracking |
| `sb-*` | Supabase auth tokens | ❌ No - Managed by Supabase |

### 4. Connection/Desktop App Keys (KEEP IN LOCALSTORAGE)

| Key | Description | Migration |
|-----|-------------|-----------|
| `otakon_connection_code` | 6-digit connection code | ❌ No - Device-specific |
| `otakon_last_connection` | Last connection timestamp | ❌ No - Device-specific |
| `otakonHasConnectedBefore` | First connection flag | ❌ No - Device-specific |

### 5. UI Preferences Keys (KEEP IN LOCALSTORAGE)

| Key | Description | Migration |
|-----|-------------|-----------|
| `otakonAiMode` | Planning/Playing mode | ❌ No - Local UI state |
| `otakonHandsFreeMode` | Hands-free mode toggle | ❌ No - Local UI state |
| `otakon_manual_upload_mode` | Manual upload mode | ❌ No - Local UI state |
| `otakon_screenshot_mode` | Screenshot mode (single/multi) | ❌ No - Local UI state |
| `otakon_screenshot_hint_seen` | Screenshot hint dismissed | ❌ No - Local UI state |
| `otakonPreferredVoiceURI` | TTS voice preference | ❌ No - Device-specific |
| `otakon_speech_rate` | TTS speech rate | ❌ No - Device-specific |

### 6. App State/Onboarding Keys (KEEP IN LOCALSTORAGE)

| Key | Description | Migration |
|-----|-------------|-----------|
| `otakon_welcome_shown` | Welcome screen version | ❌ No - Device-specific |
| `otakon_has_used_app` | First use completed | ❌ No - Device-specific |
| `otakon_has_seen_splash_screens` | Splash screens shown | ❌ No - Device-specific |
| `otakon_pwa_installed` | PWA installation flag | ❌ No - Device-specific |
| `otakon_shown_upgrade_splash_*` | Upgrade splash shown | ❌ No - Device-specific |
| `otakon_discord_auth_attempt` | Discord auth timestamp | ❌ No - Session data |

### 7. Multi-Tab/Session Management Keys (KEEP IN LOCALSTORAGE)

| Key | Description | Migration |
|-----|-------------|-----------|
| `otagon_active_instances` | Active browser instances | ❌ No - Multi-tab management |
| `otakon_pending_messages` | Offline message queue | ❌ No - Synced to Supabase on reconnect |
| `otakon_sync_metadata` | Sync state tracking | ❌ No - Local sync state |

### 8. AI/Prompt Related Keys (KEEP IN LOCALSTORAGE)

| Key | Description | Migration |
|-----|-------------|-----------|
| `otakon_used_suggested_prompts` | Used suggested prompts | ❌ No - Local tracking |
| `otakon_suggested_prompts_reset` | Prompt reset timestamp | ❌ No - Local tracking |
| `otakon_correction_rate_limit` | AI correction rate limit | ❌ No - Rate limiting |
| `dailyNewsCache_lastGrounding` | News grounding timestamp | ❌ No - Rate limiting |

---

## 📦 Migration Strategy

### Phase 1: Background Sync (Implemented)

The `gamingExplorerSupabaseService.ts` provides:

1. **`migrateAllToSupabase(authUserId)`** - Full migration of all Gaming Explorer data
2. **`checkMigrationNeeded(authUserId)`** - Check if migration is needed
3. **Individual sync services** for each data type:
   - `supabaseLibraryService.syncToSupabase()`
   - `supabaseTimelineService.syncToSupabase()`
   - `supabaseProfileService.syncToSupabase()`
   - `supabaseSearchHistoryService.syncToSupabase()`
   - `supabaseKnowledgeService.syncToSupabase()`

### Phase 2: Hybrid Storage (Recommended Approach)

**Strategy: Offline-first with background sync**

```
┌─────────────────┐     ┌─────────────────┐
│   localStorage  │────►│    Supabase     │
│  (Primary Read) │     │  (Cloud Backup) │
└────────┬────────┘     └────────▲────────┘
         │                       │
         │   Write to both       │
         └───────────────────────┘
```

1. **Reads**: Always from localStorage (instant)
2. **Writes**: Write to localStorage first, then async sync to Supabase
3. **Startup**: Fetch from Supabase, merge with localStorage (newest wins)
4. **Offline**: Works fully from localStorage

### Phase 3: Integration Points

Add migration trigger in `GamingExplorerModal.tsx`:

```typescript
useEffect(() => {
  const migrateIfNeeded = async () => {
    if (!user.authUserId) return;
    
    const needsMigration = await gamingExplorerMigrationService.checkMigrationNeeded(user.authUserId);
    if (needsMigration) {
      await gamingExplorerMigrationService.migrateAllToSupabase(user.authUserId);
    }
  };
  
  if (isOpen) {
    migrateIfNeeded();
  }
}, [isOpen, user.authUserId]);
```

---

## 🗄️ Database Tables Created

### `gaming_library`
- Stores user's game library with categories (own, wishlist, favorite, disliked)
- Includes IGDB data cache for offline access
- Auto-updates profile stats via trigger

### `gaming_timeline`
- Stores timeline events (consoles, PC builds, games, albums)
- Supports photos array for gaming memories

### `gaming_knowledge`
- Stores AI-extracted game guides
- Includes walkthroughs, tips, boss strategies, etc.

### `gaming_profiles`
- User gaming profile with stats
- Auto-updated by library trigger

### `gaming_search_history`
- Recently searched games (max 12 per user)
- Auto-cleanup via trigger

### `gaming_news_cache`
- Global news cache (shared across users)
- 24-hour expiration

### `igdb_home_cache`
- Global IGDB data cache
- Reduces API calls

---

## ⚠️ Keys NOT to Migrate

The following should remain in localStorage only:

1. **Device-specific preferences** - Voice settings, screenshot modes
2. **Session data** - Auth tokens, connection codes
3. **Short-lived caches** - IGDB API responses (4hr TTL)
4. **Multi-tab state** - Instance tracking
5. **Rate limiting** - Correction rate limits, grounding timestamps

---

## 🔄 Sync Implementation

### Automatic Sync Points

1. **On library change**: Sync individual game to Supabase
2. **On timeline add**: Sync event to Supabase
3. **On search**: Add to Supabase search history
4. **On profile update**: Sync profile to Supabase
5. **On app close**: Full sync (if changes pending)

### Manual Sync

Users can trigger a full sync from Settings (future feature).

---

## 📊 Storage Size Estimates

| Data Type | Avg Size per User | Notes |
|-----------|-------------------|-------|
| Library | ~50KB | 100 games with IGDB data |
| Timeline | ~20KB | 50 events with photos |
| Knowledge | ~200KB | Deep game guides |
| Profile | ~1KB | Stats only |
| Search History | ~10KB | 12 games with data |
| **Total** | **~280KB** | Well within Supabase limits |

---

## 🚀 Rollout Plan

1. **Week 1**: Deploy database migrations
2. **Week 2**: Enable background sync for new data
3. **Week 3**: Add migration prompt for existing users
4. **Week 4**: Full rollout with sync status indicator

---

## 🔐 Security Considerations

1. **RLS Policies**: All tables have row-level security
2. **User Isolation**: Users can only access their own data
3. **No PII in caches**: Global caches contain only game data
4. **Secure Triggers**: SECURITY DEFINER for stat updates only
