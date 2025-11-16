# Follow-Up Prompts Issue - Root Cause Analysis

## Problem
User reports not seeing follow-up prompt suggestions after AI responses.

## Flow Analysis

### 1. AI Service (aiService.ts)
**✅ Schema Definition (Lines 787-824)**
- Gemini schema correctly defines `followUpPrompts` as ARRAY of strings
- Description: "3-4 contextual follow-up questions"
- Schema marked as optional (not in required array)

**✅ Response Construction (Lines 930-950)**
```typescript
const aiResponse: AIResponse = {
  content: cleanContent,
  suggestions: structuredData.followUpPrompts || [],  // Line 933
  followUpPrompts: structuredData.followUpPrompts,     // Line 944
  // ...
};
```

Both `suggestions` and `followUpPrompts` fields are set from `structuredData.followUpPrompts`.

### 2. MainApp Component (MainApp.tsx)
**Line 1582: Source Selection**
```typescript
const suggestionsToUse = response.followUpPrompts || response.suggestions;
```

This correctly prioritizes `followUpPrompts`, falls back to `suggestions`.

**Line 1582: Processing**
```typescript
const processedSuggestions = suggestedPromptsService.processAISuggestions(suggestionsToUse);
```

### 3. ChatInterface (ChatInterface.tsx)
**Line 539: Rendering**
```typescript
suggestedPrompts={msg.role === 'assistant' ? suggestedPrompts : []}
```

### 4. SuggestedPrompts Component
**Line 14: Import**
```typescript
import SuggestedPrompts from './SuggestedPrompts';
```

**Lines 162-166: Rendering Condition**
```typescript
{message.role === 'assistant' && suggestedPrompts.length > 0 && onSuggestedPromptClick && !isLoading && (
  <SuggestedPrompts
    prompts={suggestedPrompts}
    onPromptClick={onSuggestedPromptClick}
  />
)}
```

## Root Cause: 2 Possible Issues

### Issue #1: Gemini Not Returning followUpPrompts
**Likelihood: HIGH**

The `followUpPrompts` field is NOT in the `required` array in the schema (line 809).
This means Gemini can omit it from the response if:
- AI decides they're not needed
- AI doesn't understand the instruction
- Response gets truncated mid-generation

**Evidence:**
- Debug logs would show `response.suggestions` as empty array
- User would see NO follow-up buttons

### Issue #2: processAISuggestions Filtering Them Out
**Likelihood: MEDIUM**

The `suggestedPromptsService.processAISuggestions()` might be filtering out suggestions that:
- Are too similar to previous prompts
- Don't match expected format
- Are too short/long
- Don't contain keywords

**Evidence:**
- Debug logs would show raw suggestions exist, but processed ones are empty
- Some responses would have prompts, others wouldn't

### Issue #3: Field Mismatch in Structured Data
**Likelihood: LOW**

The Gemini response might return suggestions in a different field name:
- `suggestions` (lowercase)
- `suggestedPrompts` (camelCase)
- `followUpQuestions`
- `nextQuestions`

**Evidence:**
- Consistent pattern of missing prompts across all responses

## Debug Strategy

To identify which issue, we need:

1. **Add logging to aiService.ts (line 826)**
   ```typescript
   console.log('🧹 [AIService] Structured data keys:', Object.keys(structuredData));
   console.log('🧹 [AIService] followUpPrompts exists?:', !!structuredData.followUpPrompts);
   console.log('🧹 [AIService] followUpPrompts value:', structuredData.followUpPrompts);
   ```

2. **Add logging to MainApp.tsx (line 1582)**
   ```typescript
   console.log('🔍 [MainApp] response.followUpPrompts:', response.followUpPrompts);
   console.log('🔍 [MainApp] response.suggestions:', response.suggestions);
   console.log('🔍 [MainApp] suggestionsToUse:', suggestionsToUse);
   console.log('🔍 [MainApp] processedSuggestions:', processedSuggestions);
   ```

3. **Check suggestedPromptsService**
   - Find `processAISuggestions()` function
   - See what filtering/processing happens
   - Check if empty array returns prematurely

## Most Likely Culprit
**Gemini not returning followUpPrompts** because:
1. Field is optional (not required)
2. Gemini models sometimes skip optional fields
3. JSON mode sometimes doesn't honor all schema fields perfectly

## Fix Options

### Option A (Recommended): Make followUpPrompts Required
Edit aiService.ts line 809-811:
```typescript
required: ["content", "followUpPrompts"]  // Add followUpPrompts to required
```

This forces Gemini to always return the field, even if empty array `[]`.

### Option B: Fallback Prompts in All Cases
Edit MainApp.tsx after line 1582:
```typescript
if (!suggestionsToUse || suggestionsToUse.length === 0) {
  const fallback = suggestedPromptsService.getFallbackSuggestions(activeConversation.id, activeConversation.isGameHub);
  setSuggestedPrompts(fallback);
} else {
  setSuggestedPrompts(processedSuggestions);
}
```

### Option C: Verify Gemini Response Format
Check what actual JSON Gemini returns vs schema expectations.

## Recommendation
Start with Option A + debug logging to confirm Gemini issue, then implement Option B as safety net.
