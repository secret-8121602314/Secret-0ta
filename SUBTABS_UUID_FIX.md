# Subtabs UUID Fix - Complete

## Problem
Subtabs were not rendering after game tab creation. The error in the logs showed:
```
Error inserting subtabs: {code: '22P02', message: 'invalid input syntax for type uuid: "story_so_far"'}
```

## Root Cause
The `gameTabService.ts` was creating subtabs with string IDs like `"story_so_far"`, `"quest_log"`, etc., but the database `subtabs` table expects UUID format for the `id` column.

## Solution
Added a `generateUUID()` utility function and updated all subtab creation points to use proper UUIDs:

### Changes Made

1. **Added UUID Generator** (line 10):
```typescript
function generateUUID(): string {
  return globalThis.crypto?.randomUUID() || 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}
```

2. **Updated 4 subtab creation locations**:
   - gamePillData.wikiContent mapping (line 80)
   - progressiveInsightUpdates mapping (line 94)
   - generateInitialSubTabs template creation (line 213)
   - extractInsightsFromAIResponse dynamic creation (line 253)

All now use `generateUUID()` instead of string IDs.

## Expected Behavior
After this fix:
- ✅ Subtabs will insert successfully into the database
- ✅ The UI will render subtabs after game tab creation
- ✅ Background AI insight generation will populate subtab content
- ✅ Polling will detect subtab updates and refresh the UI

## Testing
1. Upload a game screenshot
2. Wait for game detection and tab creation
3. Verify subtabs appear with "Loading..." status
4. Wait for background AI to generate insights
5. Subtabs should update with actual content

## Date
November 3, 2025
