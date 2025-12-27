# 🚨 SECURITY INCIDENT: API Key Exposure Cleanup

**Date:** December 27, 2025
**Severity:** CRITICAL
**Status:** Action Required

## Exposed Credentials

- **Gemini API Key:** `AIzaSyAQPghopyMINAl_sJFwF8HPB19WCrsEDHY`
- **Exposed in commit:** `8733d65` (September 29, 2025)
- **Files affected:** `.env.production`, `COMPREHENSIVE_REBUILD_BLUEPRINT.md`

## IMMEDIATE ACTIONS (Do these NOW)

### 1. Revoke the Exposed API Key
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find the key: `AIzaSyAQPghopyMINAl_sJFwF8HPB19WCrsEDHY`
3. Click "Delete" or "Revoke"
4. Confirm deletion

### 2. Generate New API Key
1. In Google Cloud Console, create a new API key
2. Add restrictions:
   - Application restrictions: HTTP referrers (websites)
   - Add your domain(s)
   - API restrictions: Limit to Generative Language API only

### 3. Store New Key Securely
```bash
# Add to Supabase Edge Function secrets (NEVER commit to git)
supabase secrets set GEMINI_KEY=your_new_key_here
```

### 4. Clean Git History

**⚠️ WARNING: This will rewrite git history. Coordinate with team members.**

```powershell
# Option A: Remove specific file from history (RECOMMENDED)
cd "c:\Users\mdamk\OneDrive\Desktop\Otagon App\Otagon Latest\Otagon"

# Install git-filter-repo if not already installed
# pip install git-filter-repo

# Remove .env.production from entire history
git filter-repo --path .env.production --invert-paths

# Remove COMPREHENSIVE_REBUILD_BLUEPRINT.md from history
git filter-repo --path COMPREHENSIVE_REBUILD_BLUEPRINT.md --invert-paths

# Force push to remote (if already pushed)
git push origin --force --all
```

```powershell
# Option B: Use BFG Repo-Cleaner (faster for large repos)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Create a file with the exposed key
echo "AIzaSyAQPghopyMINAl_sJFwF8HPB19WCrsEDHY" > sensitive-data.txt

# Run BFG to remove the key from all commits
java -jar bfg.jar --replace-text sensitive-data.txt

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
```

## Verification Steps

### 1. Verify key is removed from git history
```powershell
cd "c:\Users\mdamk\OneDrive\Desktop\Otagon App\Otagon Latest\Otagon"
git log -S "AIzaSyAQPghopyMINAl" --all --oneline
# Should return nothing
```

### 2. Verify .gitignore is correct
```
node_modules
.env
.env.local
.env.production
.env.secrets
.env.*.local

# LemonSqueezy secrets
*.secrets
*secret*

# Prevent accidental commits
*.key
*.pem
*-key.json
service-account*.json
```

### 3. Check no keys in current working directory
```powershell
Get-ChildItem -Recurse -Include *.env*,*.md,*.txt | Select-String -Pattern "AIza"
# Should return nothing
```

## Prevention Measures (Already Implemented ✅)

1. ✅ `.gitignore` updated to exclude all `.env*` files
2. ✅ Application uses Edge Function proxy (API keys server-side only)
3. ✅ `.env.example` shows commented-out example (no real keys)
4. ✅ Security architecture uses Supabase secrets

## Post-Incident

- [ ] API key revoked in Google Cloud Console
- [ ] New API key generated with restrictions
- [ ] New key stored in Supabase secrets
- [ ] Git history cleaned (if repository is public/shared)
- [ ] Team notified (if applicable)
- [ ] Monitoring enabled for API key usage

## Notes

- The application is already configured to use Edge Functions (server-side proxy)
- No client-side code references `VITE_GEMINI_API_KEY` directly
- The key was only in historical commits, not in current working files
- `.env.production` file no longer exists in working directory

## Additional Resources

- [Removing sensitive data from Git history](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [git-filter-repo](https://github.com/newren/git-filter-repo)
- [Google Cloud API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)
