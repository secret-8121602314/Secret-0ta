// AI Background Edge Function - Handles background tasks (summarization, knowledge fetch)
// Rate Limit: 15 requests per minute per user (lower priority, shouldn't block user actions)
//
// 🔒 SECURITY MODEL:
// - All grounding quota validation happens SERVER-SIDE
// - Client-side checks are for UX only and can be bypassed
// - This function validates tier & quota before allowing grounding tools
// - Usage is incremented server-side AFTER successful grounded calls
// - Never trust client request parameters for quota decisions
//
// Grounding Quota (Game Knowledge pool):
// - Free: 0 grounding calls (but 3 unreleased game tabs)
// - Pro/Vanguard: 20 grounding calls per month
// - Separate from ai_message pool (30/month)
// - Used for fetching info about unreleased games (post Jan 2025)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_KEY_GAME_KNOWLEDGE");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_KEY_GAME_KNOWLEDGE not set in Supabase secrets");
}

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 15; // 15 requests per minute for background tasks

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// 🔒 SECURITY: Server-side grounding quota validation
// Client cannot be trusted - validate quota here before allowing grounded calls
interface GroundingQuotaCheck {
  allowed: boolean;
  reason?: string;
  remaining?: number;
}

const GROUNDING_LIMITS = {
  free: { game_knowledge: 0, ai_message: 4 },  // Free: 4 searches/month for user queries only
  pro: { game_knowledge: 20, ai_message: 30 },
  vanguard_pro: { game_knowledge: 20, ai_message: 30 }
};

async function validateGroundingQuota(
  supabase: any,
  userId: string,
  usageType: 'game_knowledge' | 'ai_message'
): Promise<GroundingQuotaCheck> {
  try {
    // Get current month key
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Get user tier
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tier')
      .eq('auth_user_id', userId)
      .single();
    
    if (profileError || !profile) {
      console.warn('[ai-background] Failed to get user tier:', profileError);
      return { allowed: false, reason: 'Unable to verify subscription' };
    }
    
    const tier = profile.tier || 'free';
    const limit = GROUNDING_LIMITS[tier as keyof typeof GROUNDING_LIMITS]?.[usageType] || 0;
    
    // Free tier has no grounding quota
    if (limit === 0) {
      return { allowed: false, reason: 'Grounding requires Pro or Vanguard subscription', remaining: 0 };
    }
    
    // Get current usage
    const { data: usage, error: usageError } = await supabase
      .from('user_grounding_usage')
      .select('game_knowledge_count, ai_message_count')
      .eq('auth_user_id', userId)
      .eq('month_year', monthKey)
      .single();
    
    const currentUsage = usage?.[`${usageType}_count`] || 0;
    const remaining = Math.max(0, limit - currentUsage);
    
    if (currentUsage >= limit) {
      console.log(`[ai-background] 🚫 Quota exceeded for ${userId}: ${currentUsage}/${limit} (${usageType})`);
      return { allowed: false, reason: 'Monthly grounding quota exceeded', remaining: 0 };
    }
    
    console.log(`[ai-background] ✅ Quota check passed for ${userId}: ${currentUsage}/${limit} (${usageType}, remaining: ${remaining})`);
    return { allowed: true, remaining };
    
  } catch (error) {
    console.error('[ai-background] Error validating grounding quota:', error);
    return { allowed: false, reason: 'Error checking quota' };
  }
}

serve(async (req) => {
  console.log('[ai-background] 🎮 Received request:', req.method);
  
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    console.log('[ai-background] 🔐 Checking authorization...');
    // Get user ID from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log('[ai-background] ❌ Missing authorization header');
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('[ai-background] ❌ Unauthorized:', authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    console.log('[ai-background] ✅ User authenticated:', userId);

    // Rate limiting check
    const now = Date.now();
    const userLimit = rateLimitMap.get(userId);

    if (userLimit) {
      if (now < userLimit.resetTime) {
        if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
          return new Response(
            JSON.stringify({ 
              error: "Rate limit exceeded for background tasks. Please wait a moment.",
              retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
            }),
            {
              status: 429,
              headers: { 
                "Content-Type": "application/json",
                "Retry-After": Math.ceil((userLimit.resetTime - now) / 1000).toString()
              },
            }
          );
        }
        userLimit.count++;
      } else {
        // Reset window
        rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      }
    } else {
      // First request from this user
      rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }

    // Parse request body - handle both custom format and Gemini format
    const body = await req.json();
    console.log('[ai-background] 📦 Request body received:', {
      hasPrompt: !!body.prompt,
      hasContents: !!body.contents,
      requestType: body.requestType,
      model: body.model,
      useGrounding: body.useGrounding
    });
    
    // Check if this is custom format (from aiService) or Gemini format (direct)
    let contents, systemInstruction, generationConfig, tools;
    
    if (body.prompt) {
      // Custom format from aiService - convert to Gemini format
      const { 
        prompt, 
        image, 
        systemPrompt, 
        temperature = 0.7, 
        maxTokens = 60000, // Default 60K for comprehensive game knowledge (can be overridden)
        model = 'gemini-2.5-flash',
        tools: requestTools = []
      } = body;
      
      const parts: any[] = [];
      parts.push({ text: prompt });
      
      if (image) {
        parts.push({ 
          inlineData: { 
            mimeType: 'image/jpeg', 
            data: image 
          } 
        });
      }
      
      contents = [{
        role: 'user',
        parts
      }];
      
      if (systemPrompt) {
        systemInstruction = { parts: [{ text: systemPrompt }] };
      }
      
      generationConfig = {
        temperature,
        maxOutputTokens: maxTokens,
        topP: 0.95,
        topK: 40
      };
      
      tools = requestTools;
    } else {
      // Already in Gemini format
      contents = body.contents;
      systemInstruction = body.systemInstruction;
      generationConfig = body.generationConfig || {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      };
      tools = body.tools;
    }

    if (!contents) {
      return new Response(JSON.stringify({ error: "Missing required field: prompt or contents" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 🔒 SECURITY: Validate grounding quota server-side
    // Client-side checks can be bypassed - enforce limits here
    let groundingAllowed = false;
    let usedGrounding = false;
    
    if (tools && tools.length > 0) {
      console.log('[ai-background] 🔍 Tools requested, validating grounding quota...');
      
      // Background uses 'game_knowledge' usage type (fetching info about unreleased games)
      const quotaCheck = await validateGroundingQuota(supabase, userId, 'game_knowledge');
      
      if (!quotaCheck.allowed) {
        console.log(`[ai-background] ⚠️ Grounding denied: ${quotaCheck.reason}`);
        // Strip tools to prevent grounded call - don't reject the entire request
        tools = [];
      } else {
        groundingAllowed = true;
        console.log(`[ai-background] ✅ Grounding approved (${quotaCheck.remaining} remaining)`);
      }
    }

    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const geminiPayload: any = {
      contents,
      generationConfig,
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
      ]
    };

    if (systemInstruction) {
      geminiPayload.systemInstruction = systemInstruction;
    }
    
    if (tools && tools.length > 0) {
      geminiPayload.tools = tools;
    }

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(geminiPayload),
    });

    const geminiData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini API error:", geminiData);
      return new Response(JSON.stringify({ error: "AI service error", details: geminiData }), {
        status: geminiResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract response text
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
    const groundingMetadata = geminiData.candidates?.[0]?.groundingMetadata;
    
    // Check if grounding was actually used
    usedGrounding = groundingAllowed && !!groundingMetadata;
    
    // 🔒 SECURITY: Increment usage server-side after successful grounded call
    // This prevents client-side manipulation of usage tracking
    if (usedGrounding) {
      const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      
      try {
        const { error: incrementError } = await supabase.rpc('increment_grounding_usage', {
          p_auth_user_id: userId,
          p_month_year: monthKey,
          p_usage_type: 'game_knowledge'
        });
        
        if (incrementError) {
          console.error('[ai-background] Failed to increment grounding usage:', incrementError);
        } else {
          console.log(`[ai-background] ✅ Incremented game_knowledge usage for ${userId}`);
        }
      } catch (err) {
        console.error('[ai-background] Error incrementing usage:', err);
      }
    }

    return new Response(JSON.stringify({ 
      response: responseText,
      success: true,
      groundingMetadata
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });

  } catch (error) {
    console.error("Error in ai-background function:", error);
    return new Response(JSON.stringify({ error: "Internal server error", message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
