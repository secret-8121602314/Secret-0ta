# 🔄 DIARY SERVICE CONSOLIDATION PLAN

## Current Issues:
- Uses `diary_tasks` table (doesn't exist)
- Uses `diary_favorites` table (doesn't exist)  
- Uses `game_progress` table (doesn't exist)

## Solution: Use Consolidated Schema

### Diary Tasks → `users.app_state.diaryTasks`
- Store user's diary tasks in JSONB field
- More efficient than separate table
- Easier to query and update

### Diary Favorites → `users.app_state.diaryFavorites`
- Store user's favorite diary entries in JSONB field
- Consolidates user preferences

### Game Progress → `games.session_data`
- Store game progress in existing games table
- Use `session_data` JSONB field
- More logical data organization

## Benefits:
- ✅ Uses existing tables only
- ✅ Better performance (no joins)
- ✅ Easier maintenance
- ✅ Consistent with consolidated schema
- ✅ All functionality preserved

## Next Steps:
1. Update diary service methods
2. Test functionality
3. Update other services using missing tables
