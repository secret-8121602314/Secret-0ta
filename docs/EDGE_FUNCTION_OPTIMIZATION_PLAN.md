# 🚀 Edge Function Optimization & Monitoring Plan

**Created:** December 13, 2025  
**Status:** Planning Phase  
**Priority:** Low (Security Complete - These are Enhancements)

---

## Overview

This document outlines the implementation plan for optimizing and enhancing the Edge Function infrastructure after completing critical security fixes. All items are **non-urgent improvements** for code quality, maintainability, and monitoring.

---

## Phase 1: Code Cleanup & Deduplication

### 1.1 Remove ai-proxy (Unused Legacy Code)

**Priority:** 🟡 Medium  
**Effort:** 1 hour  
**Risk:** Low

**Current State:**
- `ai-proxy` exists in `supabase/functions/ai-proxy/`
- Has comprehensive credit validation (was the original implementation)
- NOT called by any client code (confirmed via grep search)
- All traffic routes to specialized functions (ai-chat, ai-subtabs, ai-background, ai-summarization)

**Verification Steps:**
1. ✅ Already confirmed: No imports of ai-proxy in `src/services/**/*.ts`
2. Search database for any references to ai-proxy endpoint
3. Check Edge Function logs for ai-proxy invocations (last 30 days)
4. Review git history to confirm when it was replaced

**Implementation Steps:**
```bash
# 1. Backup function code for reference
cp -r supabase/functions/ai-proxy supabase/functions/.archived/ai-proxy-backup

# 2. Delete from Supabase
supabase functions delete ai-proxy

# 3. Remove local directory
rm -rf supabase/functions/ai-proxy

# 4. Update documentation
# Remove ai-proxy from SECURITY_AUDIT_CREDITS_AND_AI_CALLS.md table
```

**Rollback Plan:**
- Restore from `.archived/` folder
- Redeploy with: `supabase functions deploy ai-proxy`

**Benefits:**
- Reduces attack surface
- Cleaner codebase
- Less confusion about which functions are active

---

### 1.2 Create Unified Validation Library

**Priority:** 🟢 Low  
**Effort:** 4-6 hours  
**Risk:** Medium (requires changes to all functions)

**Problem:**
- Credit validation code duplicated in 4 Edge Functions
- Grounding validation code duplicated in 3 Edge Functions
- Any bug fix requires updating multiple files
- Inconsistent error messages

**Solution:**
Create shared validation module that all Edge Functions import.

**Architecture:**
```
supabase/functions/
  _shared/
    validation.ts       # Main validation exports
    types.ts           # Shared TypeScript interfaces
    constants.ts       # GROUNDING_LIMITS, error messages
    utils.ts           # Helper functions
```

**Implementation:**

**Step 1: Create `_shared/validation.ts`**
```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface CreditCheckResult {
  allowed: boolean;
  error?: string;
  userData?: {
    text_count: number;
    image_count: number;
    text_limit: number;
    image_limit: number;
    tier: string;
  };
}

export interface GroundingCheckResult {
  allowed: boolean;
  reason?: string;
  remaining?: number;
}

/**
 * Validates user's text/image credit quota
 * @returns CreditCheckResult with allowed status and user data
 */
export async function validateCredits(
  supabase: SupabaseClient,
  userId: string,
  requestType: 'text' | 'image'
): Promise<CreditCheckResult> {
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('text_count, image_count, text_limit, image_limit, tier')
    .eq('auth_user_id', userId)
    .single();

  if (userError || !userData) {
    return {
      allowed: false,
      error: 'User not found'
    };
  }

  // Check limits
  if (requestType === 'text' && userData.text_count >= userData.text_limit) {
    return {
      allowed: false,
      error: 'Text query limit reached. Upgrade to continue.',
      userData
    };
  }

  if (requestType === 'image' && userData.image_count >= userData.image_limit) {
    return {
      allowed: false,
      error: 'Image query limit reached. Upgrade to continue.',
      userData
    };
  }

  return { allowed: true, userData };
}

/**
 * Increments user's credit usage after successful AI call
 */
export async function incrementCredits(
  supabase: SupabaseClient,
  userId: string,
  requestType: 'text' | 'image'
): Promise<void> {
  const { error } = await supabase.rpc('increment_user_usage', {
    p_auth_user_id: userId,
    p_query_type: requestType,
    p_increment: 1
  });

  if (error) {
    console.error('[validation] Failed to increment credit usage:', error);
    throw error;
  }
}

/**
 * Validates user's grounding quota
 */
export async function validateGroundingQuota(
  supabase: SupabaseClient,
  userId: string,
  usageType: 'game_knowledge' | 'ai_message'
): Promise<GroundingCheckResult> {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tier')
    .eq('auth_user_id', userId)
    .single();
  
  if (profileError || !profile) {
    return { allowed: false, reason: 'Unable to verify subscription' };
  }
  
  const tier = profile.tier || 'free';
  const limits = {
    free: { game_knowledge: 0, ai_message: 0 },
    pro: { game_knowledge: 20, ai_message: 30 },
    vanguard_pro: { game_knowledge: 20, ai_message: 30 }
  };
  
  const limit = limits[tier as keyof typeof limits]?.[usageType] || 0;
  
  if (limit === 0) {
    return { allowed: false, reason: 'Grounding requires Pro or Vanguard subscription', remaining: 0 };
  }
  
  const { data: usage } = await supabase
    .from('user_grounding_usage')
    .select('game_knowledge_count, ai_message_count')
    .eq('auth_user_id', userId)
    .eq('month_year', monthKey)
    .single();
  
  const currentUsage = usage?.[`${usageType}_count`] || 0;
  const remaining = Math.max(0, limit - currentUsage);
  
  if (currentUsage >= limit) {
    return { allowed: false, reason: 'Monthly grounding quota exceeded', remaining: 0 };
  }
  
  return { allowed: true, remaining };
}

/**
 * Increments grounding usage after successful grounded call
 */
export async function incrementGroundingUsage(
  supabase: SupabaseClient,
  userId: string,
  usageType: 'game_knowledge' | 'ai_message'
): Promise<void> {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const { error } = await supabase.rpc('increment_grounding_usage', {
    p_auth_user_id: userId,
    p_month_year: monthKey,
    p_usage_type: usageType
  });
  
  if (error) {
    console.error('[validation] Failed to increment grounding usage:', error);
    throw error;
  }
}
```

**Step 2: Update Edge Functions to Use Shared Library**

Example for `ai-chat/index.ts`:
```typescript
import { validateCredits, incrementCredits, validateGroundingQuota, incrementGroundingUsage } from '../_shared/validation.ts';

serve(async (req) => {
  // ... auth code ...
  
  // Credit validation (replaces 50 lines)
  const body = await req.json();
  const requestType = body.image ? 'image' : 'text';
  
  const creditCheck = await validateCredits(supabase, userId, requestType);
  if (!creditCheck.allowed) {
    return new Response(JSON.stringify({ 
      error: creditCheck.error,
      success: false 
    }), { status: 403 });
  }
  
  // ... grounding validation ...
  const groundingCheck = await validateGroundingQuota(supabase, userId, 'ai_message');
  if (!groundingCheck.allowed) {
    tools = []; // Strip tools
  }
  
  // ... Gemini call ...
  
  // Increment usage
  await incrementCredits(supabase, userId, requestType);
  if (usedGrounding) {
    await incrementGroundingUsage(supabase, userId, 'ai_message');
  }
});
```

**Testing:**
1. Deploy updated functions to staging
2. Test all validation scenarios (free tier, pro tier, quota exceeded)
3. Verify error messages are consistent
4. Monitor logs for any issues

**Benefits:**
- Single source of truth for validation logic
- Bug fixes update all functions at once
- Consistent error messages
- Easier to add new validation rules
- ~200 lines of code reduction per function

---

## Phase 2: Infrastructure Enhancements

### 2.1 Centralized Rate Limiting

**Priority:** 🟢 Low  
**Effort:** 8-12 hours  
**Risk:** Medium-High (production performance impact)

**Problem:**
- Rate limiting uses in-memory Map per Edge Function instance
- No coordination between multiple function instances
- User could bypass limits by hitting different regions/instances
- Rate limit state lost on function cold start

**Solution:**
Implement Redis-based rate limiting with Upstash (Supabase-compatible).

**Architecture:**
```
Client → Edge Function → Upstash Redis → Check Rate Limit
                                        ↓
                                   Allow/Deny
```

**Implementation:**

**Step 1: Set up Upstash Redis**
```bash
# 1. Create Upstash Redis database at upstash.com
# 2. Get connection URL and token
# 3. Add to Supabase secrets
supabase secrets set UPSTASH_REDIS_URL="https://..."
supabase secrets set UPSTASH_REDIS_TOKEN="..."
```

**Step 2: Create `_shared/rateLimit.ts`**
```typescript
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier: string; // Usually userId
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Check rate limit using Redis
 */
export async function checkRateLimit(
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const REDIS_URL = Deno.env.get('UPSTASH_REDIS_URL');
  const REDIS_TOKEN = Deno.env.get('UPSTASH_REDIS_TOKEN');
  
  const key = `ratelimit:${config.identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  // Use Redis sorted set for sliding window
  const commands = [
    // Remove old entries
    ['ZREMRANGEBYSCORE', key, 0, windowStart],
    // Count current entries
    ['ZCARD', key],
    // Add current request
    ['ZADD', key, now, `${now}-${Math.random()}`],
    // Set expiry
    ['EXPIRE', key, Math.ceil(config.windowMs / 1000)]
  ];
  
  const response = await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commands)
  });
  
  const results = await response.json();
  const currentCount = results[1].result + 1; // +1 for current request
  
  const allowed = currentCount <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - currentCount);
  const resetTime = now + config.windowMs;
  
  return { allowed, remaining, resetTime };
}
```

**Step 3: Update Edge Functions**
```typescript
import { checkRateLimit } from '../_shared/rateLimit.ts';

serve(async (req) => {
  // ... auth ...
  
  const rateLimit = await checkRateLimit({
    maxRequests: 30, // ai-chat specific
    windowMs: 60000, // 1 minute
    identifier: userId
  });
  
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
      remaining: rateLimit.remaining
    }), { 
      status: 429,
      headers: {
        'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
      }
    });
  }
  
  // ... rest of function ...
});
```

**Testing:**
1. Load test with multiple concurrent requests
2. Verify limits work across different regions
3. Test edge cases (cold starts, Redis downtime)
4. Monitor performance impact

**Fallback Strategy:**
```typescript
// If Redis fails, fall back to in-memory rate limiting
try {
  const rateLimit = await checkRateLimit(config);
  // ...
} catch (error) {
  console.error('Redis rate limit failed, using in-memory fallback');
  // Use existing Map-based rate limiting
}
```

**Benefits:**
- Accurate rate limiting across all instances
- Persistent rate limit state
- Better protection against abuse
- Can implement more sophisticated algorithms (token bucket, etc.)

**Costs:**
- Upstash Redis free tier: 10,000 commands/day
- Paid plans: $0.20 per 100k commands
- Estimated cost: ~$5-10/month

---

## Phase 3: Monitoring & Observability

### 3.1 Audit Logging

**Priority:** 🟡 Medium  
**Effort:** 6-8 hours  
**Risk:** Low

**Purpose:**
- Track all quota checks (approved and denied)
- Detect abuse patterns
- Debugging and support
- Compliance and reporting

**Implementation:**

**Step 1: Create `audit_logs` table**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL, -- 'credit_check', 'grounding_check', 'rate_limit'
  action TEXT NOT NULL, -- 'allowed', 'denied'
  resource TEXT, -- 'text_credit', 'image_credit', 'ai_message', 'game_knowledge'
  metadata JSONB, -- Additional context
  ip_address TEXT,
  user_agent TEXT,
  function_name TEXT
);

-- Indexes for common queries
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);

-- RLS policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can write
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Users can read their own logs
CREATE POLICY "Users can read own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);
```

**Step 2: Create `_shared/auditLog.ts`**
```typescript
export interface AuditLogEntry {
  userId: string;
  eventType: 'credit_check' | 'grounding_check' | 'rate_limit';
  action: 'allowed' | 'denied';
  resource?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  functionName: string;
}

export async function logAuditEvent(
  supabase: SupabaseClient,
  entry: AuditLogEntry
): Promise<void> {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: entry.userId,
        event_type: entry.eventType,
        action: entry.action,
        resource: entry.resource,
        metadata: entry.metadata,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        function_name: entry.functionName
      });
    
    if (error) {
      console.error('[audit] Failed to log event:', error);
      // Don't throw - logging failures shouldn't break the app
    }
  } catch (err) {
    console.error('[audit] Audit logging error:', err);
  }
}
```

**Step 3: Integrate into Validation Functions**
```typescript
// In _shared/validation.ts
export async function validateCredits(
  supabase: SupabaseClient,
  userId: string,
  requestType: 'text' | 'image',
  req: Request // For IP/user agent
): Promise<CreditCheckResult> {
  const result = /* ... validation logic ... */;
  
  // Log the check
  await logAuditEvent(supabase, {
    userId,
    eventType: 'credit_check',
    action: result.allowed ? 'allowed' : 'denied',
    resource: requestType === 'text' ? 'text_credit' : 'image_credit',
    metadata: {
      current_usage: result.userData?.text_count || result.userData?.image_count,
      limit: result.userData?.text_limit || result.userData?.image_limit,
      tier: result.userData?.tier
    },
    ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
    userAgent: req.headers.get('user-agent'),
    functionName: 'validateCredits'
  });
  
  return result;
}
```

**Analytics Queries:**
```sql
-- Most denied users (potential abuse)
SELECT 
  user_id,
  COUNT(*) as denied_count,
  COUNT(DISTINCT event_type) as violation_types
FROM audit_logs
WHERE action = 'denied'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id
ORDER BY denied_count DESC
LIMIT 10;

-- Quota exhaustion by tier
SELECT 
  metadata->>'tier' as tier,
  COUNT(*) as quota_exceeded_count
FROM audit_logs
WHERE action = 'denied'
  AND event_type = 'credit_check'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY tier;

-- Rate limit violations
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as rate_limit_hits
FROM audit_logs
WHERE event_type = 'rate_limit'
  AND action = 'denied'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;
```

**Benefits:**
- Full audit trail for compliance
- Detect abuse patterns early
- Debug user issues quickly
- Generate usage reports
- Support tier optimization decisions

**Performance Considerations:**
- Use async logging (don't block requests)
- Partition table by month for performance
- Archive old logs to cold storage
- Consider batching logs for high traffic

---

### 3.2 Usage Pattern Alerts

**Priority:** 🟢 Low  
**Effort:** 8-10 hours  
**Risk:** Low

**Purpose:**
- Alert on unusual usage patterns (potential abuse)
- Notify when users approach quota limits
- Monitor system health
- Cost management

**Implementation:**

**Step 1: Create Scheduled Edge Function `monitor-usage`**
```typescript
// supabase/functions/monitor-usage/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface Alert {
  type: 'abuse' | 'quota_warning' | 'cost_spike' | 'error_rate';
  severity: 'low' | 'medium' | 'high';
  message: string;
  userId?: string;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const alerts: Alert[] = [];
  
  // Check 1: Users hitting rate limits repeatedly
  const { data: rateLimitAbuse } = await supabase.rpc('detect_rate_limit_abuse', {
    threshold: 10, // More than 10 rate limit hits in 1 hour
    hours: 1
  });
  
  if (rateLimitAbuse && rateLimitAbuse.length > 0) {
    alerts.push({
      type: 'abuse',
      severity: 'high',
      message: `${rateLimitAbuse.length} users hitting rate limits excessively`,
      metadata: { users: rateLimitAbuse }
    });
  }
  
  // Check 2: Users at 90% of quota
  const { data: quotaWarnings } = await supabase
    .from('users')
    .select('auth_user_id, email, text_count, text_limit, tier')
    .gte('text_count', supabase.rpc('calculate_warning_threshold', { column: 'text_limit', percentage: 0.9 }));
  
  if (quotaWarnings && quotaWarnings.length > 0) {
    alerts.push({
      type: 'quota_warning',
      severity: 'medium',
      message: `${quotaWarnings.length} users approaching quota limits`,
      metadata: { count: quotaWarnings.length }
    });
  }
  
  // Check 3: Unusual spike in API calls
  const { data: apiCallStats } = await supabase.rpc('get_hourly_api_stats', {
    hours: 24
  });
  
  const avgCalls = apiCallStats.reduce((sum: number, h: any) => sum + h.count, 0) / 24;
  const currentHour = apiCallStats[apiCallStats.length - 1];
  
  if (currentHour.count > avgCalls * 2) {
    alerts.push({
      type: 'cost_spike',
      severity: 'high',
      message: `API call spike detected: ${currentHour.count} calls (avg: ${avgCalls})`,
      metadata: { current: currentHour.count, average: avgCalls }
    });
  }
  
  // Check 4: High error rate
  const { data: errorStats } = await supabase
    .from('audit_logs')
    .select('event_type', { count: 'exact' })
    .eq('action', 'denied')
    .gte('created_at', new Date(Date.now() - 3600000).toISOString());
  
  const errorRate = (errorStats || []).length;
  if (errorRate > 100) {
    alerts.push({
      type: 'error_rate',
      severity: 'high',
      message: `High error rate: ${errorRate} denied requests in last hour`,
      metadata: { count: errorRate }
    });
  }
  
  // Send alerts if any found
  if (alerts.length > 0) {
    await sendAlerts(supabase, alerts);
  }
  
  return new Response(JSON.stringify({
    success: true,
    alerts: alerts.length,
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

async function sendAlerts(supabase: any, alerts: Alert[]) {
  // Option 1: Email via Resend
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  
  for (const alert of alerts) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'alerts@otagon.app',
        to: 'admin@otagon.app',
        subject: `[${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`,
        html: `
          <h2>Alert: ${alert.type}</h2>
          <p><strong>Severity:</strong> ${alert.severity}</p>
          <p><strong>Message:</strong> ${alert.message}</p>
          <pre>${JSON.stringify(alert.metadata, null, 2)}</pre>
          <p><em>Timestamp: ${new Date().toISOString()}</em></p>
        `
      })
    });
  }
  
  // Option 2: Store in database for dashboard
  await supabase.from('system_alerts').insert(
    alerts.map(a => ({
      type: a.type,
      severity: a.severity,
      message: a.message,
      user_id: a.userId,
      metadata: a.metadata
    }))
  );
}
```

**Step 2: Create Database Functions**
```sql
-- Detect rate limit abuse
CREATE OR REPLACE FUNCTION detect_rate_limit_abuse(
  threshold INT,
  hours INT
)
RETURNS TABLE(user_id UUID, hit_count BIGINT, tier TEXT) AS $$
  SELECT 
    user_id,
    COUNT(*) as hit_count,
    (SELECT tier FROM users WHERE auth_user_id = audit_logs.user_id) as tier
  FROM audit_logs
  WHERE event_type = 'rate_limit'
    AND action = 'denied'
    AND created_at > NOW() - (hours || ' hours')::INTERVAL
  GROUP BY user_id
  HAVING COUNT(*) > threshold
  ORDER BY hit_count DESC;
$$ LANGUAGE sql;

-- Get hourly API stats
CREATE OR REPLACE FUNCTION get_hourly_api_stats(hours INT)
RETURNS TABLE(hour TIMESTAMPTZ, count BIGINT) AS $$
  SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as count
  FROM audit_logs
  WHERE created_at > NOW() - (hours || ' hours')::INTERVAL
  GROUP BY hour
  ORDER BY hour;
$$ LANGUAGE sql;
```

**Step 3: Schedule the Monitor**
```bash
# Use Supabase cron (pg_cron extension)
# Or use external scheduler like GitHub Actions, Vercel Cron, etc.

# Via Supabase cron:
SELECT cron.schedule(
  'usage-monitoring',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/monitor-usage',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

**Step 4: Create Alert Dashboard (Optional)**
```sql
-- System alerts table
CREATE TABLE system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID
);

CREATE INDEX idx_alerts_created ON system_alerts(created_at DESC);
CREATE INDEX idx_alerts_severity ON system_alerts(severity) WHERE NOT acknowledged;
```

**Benefits:**
- Proactive abuse detection
- Early warning for quota exhaustion
- Cost control and optimization
- System health monitoring
- Better user experience (warn before limits hit)

**Alert Types:**
1. **Abuse Detection:**
   - Repeated rate limit violations
   - Unusual request patterns
   - Quota manipulation attempts

2. **Quota Warnings:**
   - User at 90% of monthly quota
   - Tier approaching aggregate limits
   - Predicted quota exhaustion

3. **Cost Spikes:**
   - API calls above baseline
   - Gemini API costs trending up
   - Database query volume spike

4. **System Health:**
   - Error rate above threshold
   - Function cold start frequency
   - Database connection issues

---

## Implementation Timeline

### Immediate (Week 1)
- ✅ Phase 1.1: Remove ai-proxy (1 hour)

### Short-term (Weeks 2-4)
- Phase 1.2: Unified validation library (6 hours)
- Phase 3.1: Basic audit logging (6 hours)

### Medium-term (Months 2-3)
- Phase 2.1: Centralized rate limiting (12 hours)
- Phase 3.2: Usage pattern alerts (10 hours)

---

## Success Metrics

**Code Quality:**
- ✅ Reduce duplicated validation code by 80%
- ✅ Edge Function code size reduced by 30%
- ✅ Consistent error messages across all functions

**Security:**
- ✅ Accurate rate limiting across all instances
- ✅ Comprehensive audit trail for all quota checks
- ✅ Detect abuse within 15 minutes of occurrence

**Operations:**
- ✅ Automated alerts for unusual patterns
- ✅ Reduced support tickets related to quotas
- ✅ Faster debugging with audit logs

**Cost:**
- ✅ Identify cost optimization opportunities
- ✅ Prevent cost spikes with proactive alerts
- ✅ Estimated savings: 10-20% API costs through abuse prevention

---

## Risks & Mitigation

### Risk 1: Shared Library Breaking Change
**Mitigation:**
- Comprehensive testing before deployment
- Deploy to staging first
- Deploy functions one at a time
- Keep rollback scripts ready

### Risk 2: Redis Downtime
**Mitigation:**
- Fallback to in-memory rate limiting
- Monitor Redis health
- Set up alerts for Redis errors
- Use Upstash's high availability

### Risk 3: Audit Logging Performance
**Mitigation:**
- Async logging (don't block requests)
- Batch inserts where possible
- Table partitioning by month
- Monitor database load

### Risk 4: Alert Fatigue
**Mitigation:**
- Tune thresholds carefully
- Aggregate similar alerts
- Implement acknowledgment system
- Weekly summary instead of instant alerts for low-severity

---

## Cost Analysis

| Item | Monthly Cost | Notes |
|------|-------------|-------|
| Upstash Redis | $5-10 | Rate limiting storage |
| Audit Log Storage | $2-5 | Database growth, archiving needed |
| Alert Monitoring | $0 | Using Supabase functions |
| Email Alerts (Resend) | $0 | Free tier sufficient |
| **Total** | **$7-15/month** | Scales with usage |

**ROI:**
- Prevent abuse: Saves $50-100/month in API costs
- Faster debugging: Saves 2-4 hours/month support time
- Proactive monitoring: Prevents 1-2 incidents/month
- **Net benefit: $100-200/month**

---

## Next Steps

1. **Review and Approve Plan**
   - Stakeholder review
   - Prioritize phases
   - Allocate development time

2. **Phase 1.1: Remove ai-proxy**
   - ✅ Can start immediately
   - Low risk, quick win

3. **Set Up Monitoring First**
   - Baseline current metrics
   - Understand usage patterns
   - Inform optimization decisions

4. **Iterative Implementation**
   - Don't try to do everything at once
   - Validate each phase before moving to next
   - Gather feedback and adjust

---

**Document Owner:** GitHub Copilot  
**Last Updated:** December 13, 2025  
**Status:** Awaiting Approval
