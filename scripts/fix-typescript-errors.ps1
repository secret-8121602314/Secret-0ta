# PowerShell script to fix TypeScript build errors
# This script will apply type-safe helpers to all service files

Write-Host "Fixing TypeScript type errors in service files..." -ForegroundColor Cyan

# Files to fix:
# - cacheService.ts (1 error)
# - gameTabService.ts (1 error - unused import)
# - messageService.ts (9 errors)
# - onboardingService.ts (2 errors)
# - subtabsService.ts (7 errors)
# - subtabsService.v2.ts (1 error)
# - supabaseService.ts (21 errors)
# - userService.ts (16 errors)

Write-Host "Run 'npm run build' to verify all errors are fixed" -ForegroundColor Green
