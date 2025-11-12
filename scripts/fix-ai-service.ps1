# AI Service Comprehensive Fix Script
Write-Host 'Starting AI Service comprehensive security fix...' -ForegroundColor Cyan

# Read the file
$content = Get-Content 'src\services\aiService.ts' -Raw

# Count current generateContent calls
$beforeCount = ([regex]::Matches($content, 'generateContent')).Count
Write-Host "Found $beforeCount generateContent calls" -ForegroundColor Yellow

# Fix 1: Update line ~534 (image handling in getChatResponseWithStructure)
# This needs to use Edge Function for security

$pattern1 = @'
        // For images, use regular mode \(not JSON\) because images don't work well with JSON schema
        const result = await modelToUse\.generateContent\(content\);
'@

$replacement1 = @'
        // âœ SECURITY: Use Edge Function for image handling
        let result;
        
        if \(USE_EDGE_FUNCTION\) {
          const base64Data = imageData\.split\(','\)\[1\];
          const edgeResponse = await this\.callEdgeFunction\({
            prompt,
            image: base64Data,
            requestType: 'image',
            model: 'gemini-2\.5-flash-lite-preview-09-2025'
          }\);
          result = {
            response: {
              text: async \(\) => edgeResponse\.response
            }
          };
        } else {
          // Fallback: For images, use regular mode \(not JSON\) because images don't work well with JSON schema
          result = await modelToUse\.generateContent\(content\);
        }
'@

Write-Host 'Applying Fix 1: Image handling...' -ForegroundColor Green
$content = $content -replace $pattern1, $replacement1

Write-Host 'Fixes applied successfully!' -ForegroundColor Green
Write-Host 'Saving updated file...' -ForegroundColor Cyan

$content | Out-File 'src\services\aiService.ts' -Encoding UTF8 -NoNewline

Write-Host 'â Done!' -ForegroundColor Green
