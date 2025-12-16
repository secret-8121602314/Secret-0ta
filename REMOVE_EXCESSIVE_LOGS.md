# Excessive Logging Cleanup Guide

## Overview
The application has excessive console logging that clutters the console during normal operation. This document tracks which logs to remove while keeping critical error logging.

## Strategy
- **KEEP**: Critical errors that indicate data loss or security issues
- **REMOVE**: Info/debug logs during normal operation
- **REMOVE**: Success confirmations ("✅ Saved", "🔍 Loaded", etc.)
- **REMOVE**: Verbose state tracking logs

## Files to Clean

### 1. conversationService.ts
**Remove these non-critical logs:**
- Line 167: Cache cleared log (use .error for this - change to silent)
- Line 187: Background cache refresh complete
- Line 231: Clearing caches log
- Line 247: Caches cleared confirmation
- Line 257: Returning cached conversations
- Line 262-270: Game Hub from cache debug
- Line 289: Cache hit log
- Line 292: Cache approaching expiry
- Line 309: Loaded conversations from Supabase
- Line 330: Attached cover URLs
- Line 337-345: Game Hub BEFORE cache
- Line 355-363: Game Hub AFTER cache
- Line 627-690: All addMessage debug logs (keep only errors)
- Line 707, 719, 721: catch warnings for async operations
- Line 814, 824: Delete messages logs
- Line 892: ensureGameHubExists log

### 2. aiService.ts
**Remove these non-critical logs:**
- Line 108: Edge Function Call log (every request!)
- Line 153: Edge Function SUCCESS log
- Line 294: shouldUseCache debug
- Line 326: Skipping cache check
- Line 413: Injecting knowledge
- Line 417: No cached knowledge
- Line 437: GEMINI CALL #4 log
- Line 493: Google Search grounding
- Line 543-550: Tag parsing logs (6 logs!)
- Line 583: Final suggestions
- Line 659-660: Stored topics
- Line 693: Retry context
- Line 987-1002: Grounding eligibility logs
- Line 1048-1096: All structured response parsing logs (huge section!)
- Line 1110-1111: Stored topics
- Line 1126: Google Search grounding
- Line 1171-1172: Stored topics
- Line 1181: ENTERING JSON SCHEMA MODE
- Line 1246-1262: JSON parsing debug (17 logs!)
- Line 1272: Extracted fallback progress
- Line 1338, 1419: Last 200 chars debug
- Line 1459-1460: Stored topics
- Line 1511-1512: Stored topics
- Line 1677: GEMINI CALL #3
- Line 1716-1784: All JSON parsing/fixing logs

### 3. MainApp.tsx
**Remove these non-critical logs:**
- Line 123: USER STATE CHANGED (fires constantly!)
- Line 134: suggestedPrompts STATE CHANGED
- Line 314, 320, 326-327, 332, 340: All quota logging
- Line 354, 377, 381, 395: Suggestions logging
- Line 404-620: All WebSocket/screenshot logs (huge section)
- Line 651-730: All logout/auth state logs
- Line 749-810: All loadData logs
- Line 2743: Processing lock log
- Line 2755: Rate limit log
- Line 2761: Offline log
- Line 2813: Message queued log
- Line 2831: handleSendMessage blocked log
- Line 2849: Sending message with image

## Implementation

Run the PowerShell script below to remove all these logs:

```powershell
# This would be done manually with careful multi_replace operations
```

## Testing Checklist
After cleanup:
- [ ] No logs during normal message sending
- [ ] No logs during conversation loading
- [ ] No logs during AI responses
- [ ] Critical errors still logged (DB failures, auth errors)
- [ ] User-facing errors still shown in UI (toasts)

## Estimated Impact
- **Before**: ~100+ console logs per message send
- **After**: 0-5 logs (only errors)
- **Console noise reduction**: ~95%
