# Fix TypeScript/ESLint errors in authService.ts

$filePath = "src\services\authService.ts"
$content = Get-Content $filePath -Raw

# Comment out all console.log statements (preserve them for debugging but disable linter errors)
$content = $content -replace '(\s+)(console\.log\()', '$1// $2'

# Fix any type annotations - replace `: any` with `: unknown` for better type safety
$content = $content -replace ':\s*any\b', ': unknown'

# Fix catch block error types - change `catch (error: any)` to `catch (error: unknown)`
$content = $content -replace 'catch\s*\(\s*error:\s*unknown\s*\)', 'catch (error: unknown)'

# Save the fixed content
Set-Content $filePath $content -NoNewline

Write-Host "✅ Fixed lint errors in authService.ts" -ForegroundColor Green
Write-Host "   - Commented out console.log statements" -ForegroundColor Cyan
Write-Host "   - Replaced 'any' types with 'unknown'" -ForegroundColor Cyan
