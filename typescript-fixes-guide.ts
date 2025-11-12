// TypeScript Build Error Fixes Summary
// Apply these fixes to complete the build

/**
 * REMAINING FILES TO FIX:
 * 
 * 1. supabaseService.ts (21 errors) - Add jsonToRecord, safeParseDate, safeBoolean, safeString, toJson
 * 2. messageService.ts (9 errors) - Add toJson, safeString, safeParseDate
 * 3. subtabsService.ts (7 errors) - Add safeString, remove @ts-expect-error
 * 4. onboardingService.ts (2 errors) - Add type casting for event_data
 * 
 * KEY IMPORTS NEEDED:
 * import { jsonToRecord, safeParseDate, safeBoolean, safeString, toJson } from '../utils/typeHelpers';
 */

// Pattern 1: Fix Json to Record<string, any>
// OLD: preferences: dbUser.preferences || {}
// NEW: preferences: jsonToRecord(dbUser.preferences)

// Pattern 2: Fix nullable dates
// OLD: createdAt: new Date(data.created_at).getTime()
// NEW: createdAt: safeParseDate(data.created_at)

// Pattern 3: Fix nullable strings
// OLD: imageUrl: message.image_url
// NEW: imageUrl: safeString(message.image_url, undefined)

// Pattern 4: Fix nullable booleans
// OLD: hasUsed: data.has_used_trial
// NEW: hasUsed: safeBoolean(data.has_used_trial)

// Pattern 5: Fix nullable numbers
// OLD: textLimit: data.text_limit
// NEW: textLimit: safeNumber(data.text_limit)

// Pattern 6: Convert ChatMessage[] to Json
// OLD: messages: updates.messages
// NEW: messages: updates.messages ? toJson(updates.messages) : undefined

export const fixPatterns = {
  supabaseService: {
    imports: "import { jsonToRecord, safeParseDate, safeBoolean, safeString, safeNumber, toJson } from '../utils/typeHelpers';",
    fixes: [
      "preferences: jsonToRecord(userData.preferences)",
      "appState: jsonToRecord(userData.app_state)",
      "profileData: jsonToRecord(userData.profile_data)",
      "messages: data.messages ? toJson(data.messages) : []",
      "subtabs: updates.subtabs ? toJson(updates.subtabs) : undefined",
      "createdAt: safeParseDate(conv.created_at)",
      "updatedAt: safeParseDate(conv.updated_at)",
      "hasUsed: safeBoolean(data.has_used_trial)",
      "description: safeString(game.description, undefined)",
      "imageUrl: safeString(game.image_url, undefined)",
      "textCount < textLimit (add null checks with safeNumber)",
    ]
  },
  messageService: {
    imports: "import { toJson, safeString, safeParseDate } from '../utils/typeHelpers';",
    fixes: [
      "p_image_url: safeString(message.imageUrl, undefined)",
      "timestamp: safeParseDate(newMessage.created_at)",
      "imageUrl: safeString(newMessage.image_url, undefined)",
      "metadata: jsonToRecord(newMessage.metadata)",
      "messages: toJson(currentMessages)",
      "messages: toJson(updatedMessages)",
    ]
  },
  subtabsService: {
    imports: "import { safeString, jsonToRecord } from '../utils/typeHelpers';",
    fixes: [
      "Remove @ts-expect-error comments (line 159, 302)",
      "content: safeString(data.content)",
      "isNew: data.metadata?.isNew || false (cast metadata)",
      "Add game_id to insert operation"
    ]
  },
  onboardingService: {
    imports: "import { jsonToRecord } from '../utils/typeHelpers';",
    fixes: [
      "Cast record.event_data to proper type before accessing .step",
      "Add completed_at field or adjust type expectations"
    ]
  }
};
