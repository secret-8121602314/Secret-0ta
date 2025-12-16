# COMPREHENSIVE LOG CLEANUP SCRIPT
# Run this in PowerShell from the project root

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Cleaning Excessive Console Logs" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$conversationServiceFile = "src\services\conversationService.ts"
$aiServiceFile = "src\services\aiService.ts"
$mainAppFile = "src\components\MainApp.tsx"

# Patterns to COMPLETELY REMOVE (entire lines)
$removePatterns = @(
    # ConversationService - remove these info logs
    "    console.error\('🗑️ \[ConversationService\] Cache cleared",
    "      console.log\('🔍 \[ConversationService\] Background cache refresh complete'\);",
    "      console.error\('🔍 \[ConversationService\] Background cache refresh failed:",
    "    console.log\('🗑️ \[ConversationService\] Clearing all caches",
    "    console.log\('✅ \[ConversationService\] All caches cleared",
    "      console.log\('🔍 \[ConversationService\] Returning cached conversations",
    "        console.error\('🔍 \[ConversationService\] Game Hub from cache:",
    "      console.log\('🔍 \[ConversationService\] Cache hit for user",
    "        console.log\('🔍 \[ConversationService\] Cache approaching expiry",
    "        console.log\('🔍 \[ConversationService\] Loaded",
    "            console.log\('🔍 \[ConversationService\] Attached cover URLs",
    "          console.error\('🔍 \[ConversationService\] Game Hub BEFORE cache:",
    "          console.error\('🔍 \[ConversationService\] Game Hub AFTER cache:",
    "    console.error\('📝 \[ConversationService\] addMessage called:",
    "    console.error\('📝 \[ConversationService\] Current conversations:",
    "      console.error\('📝 \[ConversationService\] Found conversation:",
    "        console.error\('⚠️ \[ConversationService\] Message already exists:",
    "        console.error\('💾 \[ConversationService\] Saving message to database",
    "        console.error\('✅ \[ConversationService\] Message saved to database:",
    "        console.error\('✅ \[ConversationService\] Message added to conversation",
    "        console.error\('✅ \[ConversationService\] Updated messages:",
    "        console.error\('✅ \[ConversationService\] Conversations saved to storage",
    "        console.error\('🗑️ \[ConversationService\] Deleting",
    "        console.error\('✅ \[ConversationService\] Messages deleted from database",
    "      console.log\('🔍 \[ConversationService\] ensureGameHubExists called",
    
    # AIService - remove these info logs  
    "    console.log\(\`📡 \[AIService\] Edge Function Call #",
    "    console.log\(\`✅ \[AIService\] Edge Function Call #",
    "    console.log\(\`\?\? \[AIService\] shouldUseCache:",
    "      console.log\(\`\?\? \[AIService\] Skipping AI cache check",
    "            console.log\(\`🎮 \[AIService\] Injecting",
    "            console.log\(\`🎮 \[AIService\] No cached knowledge",
    "      console.log\(\`📡 \[GEMINI CALL #4\]",
    "          console.log\('\?\? \[AIService\] Using Google Search grounding",
    "      console.log\('🏷️ \[AIService\] Raw AI response length:",
    "      console.log\('🏷️ \[AIService\] Has OTAKON_SUGGESTIONS:",
    "      console.log\('🏷️ \[AIService\] Clean content length:",
    "      console.log\('🏷️ \[AIService\] Extracted tags:",
    "      console.log\('🏷️ \[AIService\] Suggestions extracted:",
    "      console.log\('🎯 \[AIService\] Final suggestions for AIResponse:",
    "              .then\(\(\) => console.log\('📚 \[AIService\] Stored",
    "      console.log\('🔄 \[AIService\] Retry context:",
    "          console.log\('🔒 \[AIService\] Grounding disabled",
    "        console.log\('🔍 \[AIService\] Grounding eligibility:",
    "      console.log\(\`📡 \[GEMINI CALL #5\]",
    "        console.log\('🤖 \[AIService\] Raw AI response",
    "        console.log\('🤖 \[AIService\] Checking for PROGRESS",
    "        console.log\('🏷️ \[AIService\] Extracted otakonTags:",
    "        console.log\('🎯 \[AIService\] Suggestions from parseOtakonTags:",
    "          console.log\('📊 \[AIService\] Added PROGRESS",
    "          console.log\('🎯 \[AIService\] Added OBJECTIVE",
    "        console.log\('📤 \[AIService\] Final aiResponse:",
    "        console.log\('🔍 \[AIService\] Using Google Search grounding for structured",
    "      console.log\('🚀 \[AIService\] ENTERING JSON SCHEMA MODE'\);",
    "        console.log\('🔍 \[AIService\] RAW RESPONSE LENGTH:",
    "        console.log\('🔍 \[AIService\] RAW RESPONSE PREVIEW:",
    "        console.log\('🔍 \[AIService\] PARSED SUCCESSFULLY'\);",
    "        console.log\('🤖 \[AIService\] Gemini response keys:",
    "        console.log\('🤖 \[AIService\] followUpPrompts:",
    "        console.log\('🤖 \[AIService\] followUpPrompts length:",
    "        console.log\('🤖 \[AIService\] followUpPrompts content:",
    "        console.log\('🤖 \[AIService\] followUpPrompts isArray:",
    "        console.log\('🤖 \[AIService\] followUpPrompts typeof:",
    "          console.log\('🤖 \[AIService\] followUpPrompts\[0\] typeof:",
    "          console.log\('🤖 \[AIService\] followUpPrompts\[0\] value:",
    "        console.log\('🤖 \[AIService\] stateUpdateTags:",
    "              console.log\(\`🤖 \[AIService\] Extracted fallback progress",
    "                console.log\('🤖 \[AIService\] Last 200 chars:",
    "                console.log\('\?\? \[AIService\] Last 200 chars after cleaning:",
    "      console.log\(\`📡 \[GEMINI CALL #3\]",
    "        console.error\(\"JSON parse failed, attempting to fix malformed JSON",
    "        console.error\(\"Raw response \(first 500 chars\):",
    "          console.error\(\"\?\? Detected truncated response",
    "          console.error\(\"\? Successfully fixed malformed JSON\"\);",
    "          console.error\(\"\? Recovered\", Object\.keys\(insights\)\.length",
    "            console.error\(\`\?\? AI only generated",
    "          console.error\(\"\? Could not fix JSON",
    "          console.error\(\"\? Raw response that failed",
    "          console.error\(\"\? This may be an AI generation issue",
    "        console.error\(\`🔧 \[generateInitialInsights\] Filling",
    
    # MainApp - remove these info logs
    "    console.log\('🔥🔥🔥 \[MainApp\] USER STATE CHANGED:",
    "    console.log\('🎯 \[MainApp\] suggestedPrompts STATE CHANGED:",
    "      console.log\('\[MainApp\] No user authUserId",
    "      console.log\('\[MainApp\] Fetching quota for user:",
    "      console.log\('\[MainApp\] Quota received:",
    "      console.log\('\[MainApp\] Setting aiMessagesQuota",
    "      console.log\('\[MainApp\] Using fallback quota:",
    "      console.log\('📌 \[MainApp\] Skipping useEffect",
    "        console.log\('📌 \[MainApp\] Loading saved suggestions",
    "        console.log\('⚠️ \[MainApp\] No AI prompts found",
    "    console.log\('📌 \[MainApp\] No saved suggestions",
    "    console.log\('📸 \[MainApp\] handleWebSocketMessage called",
    "      console.log\('📸 \[MainApp\] Connection confirmation received",
    "      console.log\('📸 \[MainApp\] screenshot-single received",
    "        console.log\('📸 \[MainApp\] Processing single screenshot",
    "          console.error\('📸 \[MainApp\] Screenshot validation failed:",
    "        console.log\('📸 \[MainApp\] Screenshot validated:",
    "        console.warn\('📸 \[MainApp\] screenshot-single received but no images",
    "      console.log\('📸 \[MainApp\] screenshot-multi received",
    "      console.log\('📸 \[MainApp\] Checking tier access",
    "        console.warn\('📸 \[MainApp\] screenshot-multi blocked",
    "        console.log\('📸 \[MainApp\] Showing upgrade toast",
    "        console.log\('📸 \[MainApp\] Processing', images\.length",
    "          console.log\('📸 \[MainApp\] Starting sequential screenshot",
    "              console.log\('📸 \[MainApp\] Processing screenshot",
    "                console.error\('📸 \[MainApp\] Screenshot', i \+ 1",
    "                  console.error\('📸 \[MainApp\] Error processing screenshot",
    "            console.log\('📸 \[MainApp\] Finished processing all screenshots",
    "        console.warn\('📸 \[MainApp\] screenshot-multi received but no images",
    "        console.error\('📸 \[MainApp\] Screenshot validation failed:",
    "      console.log\('📸 \[MainApp\] Processing screenshot:",
    "    console.log\('📸 \[MainApp\] queuedScreenshot state changed:",
    "      console.log\('📸 \[MainApp\] Connection is CONNECTED",
    "          console.log\('📸 \[MainApp\] WebSocket onOpen",
    "          console.error\('📸 \[MainApp\] WebSocket error:",
    "          console.log\('📸 \[MainApp\] WebSocket closed",
    "      console.log\('🔍 \[MainApp\] User logout detected",
    "      console.log\('🔍 \[MainApp\] State and refs reset",
    "      console.log\('🔍 \[MainApp\] Caches cleared event received",
    "      console.log\('🔍 \[MainApp\] Logout flag cleared",
    "        console.log\('🔍 \[MainApp\] Auth state change detected:",
    "            console.log\('🔍 \[MainApp\] New user detected while logout",
    "        console.log\('🔍 \[MainApp\] Skipping loadData",
    "        console.log\('🔍 \[MainApp\] New user detected, resetting",
    "        console.log\('🔍 \[MainApp\] Loading conversations \(attempt",
    "        console.log\('🔍 \[MainApp\] Game Hub from ensureGameHubExists:",
    "        console.log\('🔍 \[MainApp\] Conversations from getConversations:",
    "        console.log\('🔍 \[MainApp\] Conversation count:",
    "      console.warn\('🔒 \[MainApp\] Processing lock active",
    "      console.warn\(\`⏱️ \[MainApp\] Rate limit:",
    "      console.log\('📴 \[MainApp\] User is offline",
    "        console.log\('✅ \[MainApp\] Message queued for offline",
    "      console.warn\('📸 \[MainApp\] handleSendMessage blocked:",
    "    console.log\('📸 \[MainApp\] Sending message with image:"
)

Write-Host "Creating cleaned versions of files..." -ForegroundColor Yellow
Write-Host ""

Write-Host "IMPORTANT: This script creates a guide. Use the VS Code tool multi_replace_string_in_file instead." -ForegroundColor Red
Write-Host ""
Write-Host "The following logs should be removed:" -ForegroundColor Yellow
$removePatterns | ForEach-Object {
    Write-Host "  - $_" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Total patterns to remove: $($removePatterns.Count)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Use multi_replace_string_in_file tool to remove these systematically." -ForegroundColor Green
