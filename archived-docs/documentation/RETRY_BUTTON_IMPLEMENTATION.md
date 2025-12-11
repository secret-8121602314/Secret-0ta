# Retry Button Implementation

## Overview
Added manual retry buttons for both AI chat messages and subtab responses, allowing users to retry failed operations without automatic retries.

## What Was Changed

### 1. ChatInterface.tsx
**Added retry button UI:**
- Created `onRetryMessage` prop in `ChatMessageComponentProps`
- Added retry button next to thumbs down (only shows for latest AI message)
- Button style: Icon-only (w-7 h-7) matching thumbs up/down exactly
- Added `onRetryLastMessage` and `onRetrySubtab` props to `ChatInterfaceProps`
- Wired up retry props through component tree

**Visual Design:**
```tsx
<button className="flex items-center justify-center w-7 h-7 rounded-full 
  transition-colors text-[#666] active:text-[#FF4D4D] active:bg-[#FF4D4D]/10 
  sm:hover:text-[#FF4D4D] sm:hover:bg-[#FF4D4D]/10">
  <svg className="w-4 h-4"><!-- refresh icon --></svg>
</button>
```

### 2. SubTabs.tsx
**Added retry button for subtabs:**
- Created `onRetrySubtab` prop in `SubTabsProps`
- Added retry button next to feedback buttons (thumbs up/down)
- Same icon-only style as chat messages (w-4 h-4 in p-1.5 container)
- Appears in "Was this helpful?" section

**Subtab Retry Button:**
```tsx
<button className="p-1.5 rounded-lg text-[#A3A3A3] 
  hover:text-[#FF4D4D] hover:bg-[#FF4D4D]/10">
  <svg className="w-4 h-4"><!-- refresh icon --></svg>
</button>
```

### 2. MainApp.tsx
**Added retry handlers:**

**Chat Message Retry:**
- Created `handleRetryLastMessage()` function
- Finds last user message in conversation
- Removes failed AI response if present
- Resends user message with same content/image
- Uses `handleSendMessageRef` to avoid dependency issues

**Subtab Retry:**
- Created `handleRetrySubtab(tabId)` function  
- Deletes the failed subtab from database and state
- Generates retry prompt: `"Generate a new "{title}" tab with {type} insights"`
- Sends prompt to AI to regenerate the tab

**Key Logic:**
```typescript
// Chat retry
const handleRetryLastMessage = useCallback(() => {
  // 1. Find last user message
  const lastUserMessage = [...activeConversation.messages]
    .reverse()
    .find(m => m.role === 'user');
  
  // 2. Remove failed AI response
  if (lastMessage.role === 'assistant') {
    const updatedMessages = activeConversation.messages.slice(0, -1);
    // Update state...
  }
  
  // 3. Resend with same content/image
  setTimeout(() => {
    handleSendMessageRef.current?.(lastUserMessage.content, imageUrl);
  }, 0);
}, [activeConversation, setConversations, setActiveConversation]);

// Subtab retry
const handleRetrySubtab = useCallback(async (tabId: string) => {
  // 1. Delete failed subtab
  await subtabsService.deleteSubtab(activeConversation.id, tabId);
  
  // 2. Generate retry prompt
  const retryPrompt = `Generate a new "${subtab.title}" tab with ${subtab.type} insights.`;
  
  // 3. Send prompt to AI
  setTimeout(() => {
    handleSendMessageRef.current?.(retryPrompt);
  }, 100);
}, [activeConversation, setConversations, setActiveConversation]);
```

### 3. Prop Wiring

**Chat Messages:**
```
MainApp.handleRetryLastMessage 
  → ChatInterface.onRetryLastMessage 
  → ChatMessageComponent.onRetryMessage 
  → Retry Button onClick
```

**Subtabs:**
```
MainApp.handleRetrySubtab
  → ChatInterface.onRetrySubtab
  → SubTabs.onRetrySubtab
  → Retry Button onClick
```

## User Experience

### Chat Messages

**Before:**
- User sends message
- AI fails with 429 error
- System auto-retries 3-4 times (user sees multiple errors)
- Error message says "click retry button" but no button exists

**After:**
- User sends message
- AI fails with 429 error
- No auto-retry (stops immediately)
- Retry button (🔄 icon only) appears next to 👍👎
- User clicks retry button manually
- Message resent with same content

### Subtabs

**Before:**
- Subtab generation fails
- No way to regenerate without manual prompt

**After:**
- Subtab generation fails or produces poor results
- Retry button (🔄 icon only) appears in "Was this helpful?" section
- User clicks retry to regenerate that specific subtab
- AI generates new version of the tab

## Button Placement & Style

### Chat Messages:
- **Location:** Below message bubble, aligned with avatar (ml-11 sm:ml-12)
- **Position:** After 👍 and 👎 buttons
- **Visibility:** Only latest AI message
- **Size:** w-7 h-7 (same as thumbs)
- **Icon:** w-4 h-4 refresh/reload icon
- **Color:** Gray → Red on hover

### Subtabs:
- **Location:** In "Was this helpful?" feedback section
- **Position:** After 👍 and 👎 buttons  
- **Visibility:** All subtabs
- **Size:** p-1.5 container with w-4 h-4 icon
- **Icon:** w-4 h-4 refresh/reload icon
- **Color:** Gray → Red on hover

## When Retry Buttons Show:

### Chat Messages:
- ✅ Only on the latest AI message
- ✅ For any AI response (success or error)
- ✅ Positioned next to feedback buttons
- ❌ Not shown on older messages
- ❌ Not shown on user messages

### Subtabs:
- ✅ On all subtabs
- ✅ In feedback section with thumbs up/down
- ✅ Available anytime for regeneration
- ❌ Not shown when subtabs are loading

## Technical Details

**State Management:**
- Uses `handleSendMessageRef` to avoid circular dependencies
- Updates both `conversations` dict and `activeConversation`
- Removes last AI message before retry
- Preserves image URL if present

**Error Prevention:**
- Guards against empty conversations
- Checks for user messages before retry
- Uses setTimeout to avoid same-render calls
- Type-safe with proper Conversation typing

## Related Files
- `src/components/features/ChatInterface.tsx` - Chat UI & subtab retry wiring
- `src/components/features/SubTabs.tsx` - Subtab retry button
- `src/components/MainApp.tsx` - Retry logic for both chat & subtabs
- `RETRY_LOGIC_FIXES.md` - Background retry documentation
- `src/services/aiService.ts` - Removed auto-retry logic

## Testing Checklist

### Chat Messages:
- [ ] Retry button appears on latest AI message
- [ ] Button hidden on older messages
- [ ] Button is icon-only (w-7 h-7, matches thumbs)
- [ ] Clicking retry resends user message
- [ ] Failed AI response removed before retry
- [ ] Image URL preserved when retrying with image
- [ ] Works after 429 rate limit errors
- [ ] Works after other API errors
- [ ] Hover state shows red color

### Subtabs:
- [ ] Retry button appears in feedback section
- [ ] Button is icon-only (w-4 h-4)
- [ ] Clicking retry deletes failed subtab
- [ ] New subtab generation triggered
- [ ] Works for all subtab types
- [ ] Hover state shows red color
- [ ] Button matches thumbs up/down style
