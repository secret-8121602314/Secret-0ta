# Remove Debug Logs Script
# This script removes console.log, console.debug, and console.warn statements
# while keeping console.error for production error tracking

$projectRoot = "c:\Users\mdamk\OneDrive\Desktop\Otagon App\Otagon Latest\Otagon"
$srcPath = Join-Path $projectRoot "src"

# Patterns to remove (keep console.error)
$patterns = @(
    "console\.log\([^)]*\);?\s*$",
    "console\.debug\([^)]*\);?\s*$",
    "console\.warn\([^)]*\);?\s*$"
)

# Get all TypeScript and TypeScript React files
$files = Get-ChildItem -Path $srcPath -Recurse -Include "*.ts","*.tsx" -File

$totalRemoved = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fileRemoved = 0
    
    foreach ($pattern in $patterns) {
        $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)
        $fileRemoved += $matches.Count
        $content = $content -replace $pattern, ""
    }
    
    # Also remove multi-line console statements
    $content = $content -replace "console\.log\([^)]*\);\s*\n", ""
    $content = $content -replace "console\.debug\([^)]*\);\s*\n", ""
    $content = $content -replace "console\.warn\([^)]*\);\s*\n", ""
    
    # Remove empty lines created by removal (max 2 consecutive empty lines)
    $content = $content -replace "(\r?\n){3,}", "`r`n`r`n"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Removed $fileRemoved log statements from: $($file.Name)" -ForegroundColor Green
        $totalRemoved += $fileRemoved
    }
}

Write-Host "`nTotal console statements removed: $totalRemoved" -ForegroundColor Cyan
Write-Host "Console.error statements preserved for production error tracking" -ForegroundColor Yellow
