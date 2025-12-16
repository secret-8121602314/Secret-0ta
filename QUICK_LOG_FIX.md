# Quick Log Cleanup - Message Send Flow Only
# These are the CRITICAL logs that fire on EVERY message send

## To implement: Comment out or delete these exact lines

### conversationService.ts - addMessage function (lines 627-690)
Delete these 10 log lines:
```
Line 627: console.error('📝 [ConversationService] addMessage called:', {...});
Line 636: console.error('📝 [ConversationService] Current conversations:', Object.keys(conversations));
Line 641: console.error('📝 [ConversationService] Found conversation:', {...});  
Line 650: console.error('⚠️ [ConversationService] Message already exists:', message.id);
Line 657: console.error('💾 [ConversationService] Saving message to database...');
Line 671: console.error('✅ [ConversationService] Message saved to database:', savedMessage.id);
Line 683: console.error('✅ [ConversationService] Message added to conversation, new count:', conversation.messages.length);
Line 684: console.error('✅ [ConversationService] Updated messages:', conversation.messages.map(...));
Line 688: console.error('✅ [ConversationService] Conversations saved to storage');
Line 690: console.error('❌ [ConversationService] Failed to save message:', error); // KEEP THIS ONE - it's an actual error
```

### aiService.ts - sendMessage function
Delete these logs:
```
Line 108: console.log(`📡 [AIService] Edge Function Call #${...}`);
Line 153: console.log(`✅ [AIService] Edge Function Call #${...} SUCCESS`);
Line 437: console.log(`📡 [GEMINI CALL #4] 💬 Main Chat Response | ...`);
Line 543-550: All the tag parsing logs (8 lines total)
Line 583: console.log('🎯 [AIService] Final suggestions for AIResponse:', suggestions);
```

### MainApp.tsx - handleSendMessage
Delete these logs:
```
Line 2743: console.warn('🔒 [MainApp] Processing lock active...');
Line 2755: console.warn(`⏱️ [MainApp] Rate limit: ...`);
Line 2831: console.warn('📸 [MainApp] handleSendMessage blocked:', {...});  
Line 2849: console.log('📸 [MainApp] Sending message with image:', {...});
```

## Quick Fix - Comment Them Out

The fastest way is to just add // before each console line.

Example in conversationService.ts around line 627:
```typescript
// Before:
console.error('📝 [ConversationService] addMessage called:', {
  conversationId,
  messageId: message.id,
  role: message.role,
  hasImage: !!message.imageUrl,
  contentLength: message.content?.length
});

// After:
// console.error('📝 [ConversationService] addMessage called:', {
//   conversationId,
//   messageId: message.id,
//   role: message.role,
//   hasImage: !!message.imageUrl,
//   contentLength: message.content?.length
// });
```

## Impact
- Before: ~50+ logs per message
- After: ~5 logs (only actual errors)
- 90% reduction in console noise

## Keep These (Actual Errors):
- `console.error('Error checking text query limit:', error);` ← Real error
- `console.error('❌ [ConversationService] Failed to save message:', error);` ← Real error
- `console.error("AI Service Error:", error);` ← Real error
- `console.error('[MainApp] Failed to load library from Supabase:', err);` ← Real error

Only remove SUCCESS confirmations and INFO logs, NOT error handlers!
