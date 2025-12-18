# IGDB Integration Troubleshooting Guide

## Issue: No IGDB data showing in Gaming Explorer

### Symptoms
- "Loading..." messages that never complete
- "No data found" for all sections
- Empty game categories

### Quick Diagnosis Checklist

#### 1. Check Browser Console
Open DevTools (F12) → Console tab and look for:

```javascript
// Check for errors
localStorage.getItem('otagon_igdb_home_cache')

// Check service logs
// Look for: [IGDBService] or [GamingExplorerHome] messages

// Check for 503 errors
// Look for: "IGDB service not configured"
```

#### 2. Check Network Tab
Open DevTools (F12) → Network tab:

- Look for requests to `igdb-proxy`
- Check if they return 200 or error codes (503, 400)
- Look at response bodies for error messages

#### 3. Test Edge Function Directly

Run this in browser console:
```javascript
// Replace YOUR_SUPABASE_URL with your actual URL
fetch('YOUR_SUPABASE_URL/functions/v1/igdb-proxy', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'apikey': 'YOUR_ANON_KEY'  // Get from Supabase dashboard
  },
  body: JSON.stringify({ queryType: 'popular', limit: 5 })
})
.then(r => r.json())
.then(data => {
  console.log('Edge function response:', data);
  if (!data.success) {
    console.error('Error:', data.error || data.message);
  }
})
.catch(err => console.error('Request failed:', err));
```

### Common Issues & Fixes

#### Issue 1: Edge Function Not Deployed
**Symptoms:** 404 errors on igdb-proxy requests

**Fix:**
```bash
# PowerShell
.\deploy-igdb-function.ps1

# Or manually
supabase functions deploy igdb-proxy --no-verify-jwt
```

#### Issue 2: IGDB Credentials Not Set
**Symptoms:** 503 errors with "IGDB_NOT_CONFIGURED"

**Fix:**
1. Go to Supabase Dashboard → Edge Functions → Secrets
2. Add these secrets:
   - `IGDB_CLIENT_ID` = Your Twitch Client ID
   - `IGDB_CLIENT_SECRET` = Your Twitch Client Secret

**How to get IGDB credentials:**
1. Go to https://dev.twitch.tv/console
2. Register your application
3. Get Client ID and Client Secret
4. Add them to Supabase secrets

#### Issue 3: Cache Stuck with Old Data
**Symptoms:** Old data showing, or loading stuck

**Fix:**
```javascript
// Run in browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

**Or clear specific cache:**
```javascript
localStorage.removeItem('otagon_igdb_cache');
localStorage.removeItem('otagon_igdb_home_cache');
sessionStorage.clear();
location.reload();
```

#### Issue 4: Supabase Connection Issues
**Symptoms:** Network errors, CORS errors

**Fix:**
1. Check if Supabase project is active
2. Verify SUPABASE_URL and SUPABASE_ANON_KEY in `.env` file
3. Check Edge Function logs in Supabase dashboard

#### Issue 5: Rate Limiting
**Symptoms:** Some requests work, then stop

**Fix:**
- IGDB allows 500 requests per 15 minutes
- Wait 15 minutes or implement rate limiting
- Check Edge Function logs for rate limit errors

### Debugging Tools

#### Clear All IGDB Caches
```javascript
// Run in browser console
function clearIGDBCaches() {
  localStorage.removeItem('otagon_igdb_cache');
  localStorage.removeItem('otagon_igdb_home_cache');
  localStorage.removeItem('otagon_cover_urls');
  sessionStorage.clear();
  console.log('✅ All IGDB caches cleared');
  console.log('Reload the page to fetch fresh data');
}

clearIGDBCaches();
```

#### Test IGDB Service
```javascript
// Run in browser console
async function testIGDBService() {
  const { queryIGDBGamesByCriteria } = await import('./src/services/igdbService');
  
  console.log('Testing popular games query...');
  const games = await queryIGDBGamesByCriteria('popular', 5);
  
  if (games && games.length > 0) {
    console.log('✅ IGDB service working!');
    console.log('Games found:', games.length);
    console.log('Sample game:', games[0].name);
  } else {
    console.error('❌ No games returned');
  }
  
  return games;
}

testIGDBService();
```

#### Check Edge Function Logs
1. Go to Supabase Dashboard
2. Edge Functions → igdb-proxy → Logs
3. Look for errors in recent requests

### Step-by-Step Fix

If nothing works, follow these steps in order:

1. **Deploy Edge Function**
   ```bash
   .\deploy-igdb-function.ps1
   ```

2. **Verify Credentials**
   - Supabase Dashboard → Edge Functions → Secrets
   - Ensure IGDB_CLIENT_ID and IGDB_CLIENT_SECRET are set

3. **Clear All Caches**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

4. **Test Edge Function**
   - Use the test script above in browser console
   - Check for success: true in response

5. **Reload App**
   ```javascript
   location.reload();
   ```

6. **Check Console**
   - Look for "[GamingExplorerHome] Fetching fresh IGDB data"
   - Watch for success messages

### Still Not Working?

Check these:

1. **Supabase Project Status**
   - Is your project paused?
   - Any billing issues?

2. **Edge Function Limits**
   - Free tier: Limited invocations
   - Check usage in dashboard

3. **IGDB API Status**
   - Visit https://api-docs.igdb.com
   - Check for service outages

4. **Network Issues**
   - Try disabling VPN
   - Check firewall settings
   - Try different browser

### Contact Support

If all else fails, collect this info:

1. Browser console errors (screenshot)
2. Network tab showing igdb-proxy requests
3. Edge function logs from Supabase dashboard
4. Response from test script above

Then create an issue with this information.
