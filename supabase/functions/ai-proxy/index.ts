// ✅ SECURE AI PROXY - Gemini API calls from server-side
// Date: November 3, 2025
// Purpose: Proxy Gemini API requests to prevent API key exposure

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

// ✅ SECURITY: API key stored in Supabase secrets (not exposed to client)
const GEMINI_KEY = Deno.env.get('GEMINI_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!GEMINI_KEY) {
  throw new Error('GEMINI_KEY not set in Supabase secrets');
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Initialize Supabase client (server-side)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Rate limiting map (per-user)
const rateLimits = new Map<string, { count: number; resetTime: number }>();

interface AIRequest {
  prompt: string;
  image?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  requestType: 'text' | 'image';
  model?: string;
  tools?: any[];
}

serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ✅ SECURITY: Verify user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract and verify JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token', success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ SECURITY: Server-side rate limiting (10 requests per minute)
    const userId = user.id;
    const now = Date.now();
    const userLimit = rateLimits.get(userId);

    if (userLimit) {
      if (now < userLimit.resetTime) {
        if (userLimit.count >= 10) {
          return new Response(
            JSON.stringify({ 
              error: 'Rate limit exceeded. Try again in 1 minute.', 
              success: false 
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        userLimit.count++;
      } else {
        rateLimits.set(userId, { count: 1, resetTime: now + 60000 });
      }
    } else {
      rateLimits.set(userId, { count: 1, resetTime: now + 60000 });
    }

    // Parse request body
    const body: AIRequest = await req.json();
    const { 
      prompt, 
      image, 
      systemPrompt, 
      temperature = 0.7, 
      maxTokens = 2048, 
      requestType,
      model = 'gemini-2.5-flash-preview-09-2025',
      tools = []
    } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required', success: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ BUSINESS LOGIC: Check user query limits (server-side)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('text_count, image_count, text_limit, image_limit, tier, auth_user_id')
      .eq('auth_user_id', userId)
      .single();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'User not found', success: false }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check query limits
    if (requestType === 'text' && userData.text_count >= userData.text_limit) {
      return new Response(
        JSON.stringify({ 
          error: 'Text query limit reached. Upgrade to continue.', 
          success: false,
          tier: userData.tier,
          limit: userData.text_limit
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (requestType === 'image' && userData.image_count >= userData.image_limit) {
      return new Response(
        JSON.stringify({ 
          error: 'Image query limit reached. Upgrade to continue.', 
          success: false,
          tier: userData.tier,
          limit: userData.image_limit
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build request for Gemini API
    const parts: any[] = [];
    
    if (systemPrompt) {
      parts.push({ text: systemPrompt });
    }
    
    parts.push({ text: prompt });
    
    if (image) {
      parts.push({ 
        inlineData: { 
          mimeType: 'image/jpeg', 
          data: image 
        } 
      });
    }

    // ✅ SECURITY: Call Gemini API from server-side (key not exposed)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
    
    const requestBody: any = {
      contents: [{
        role: 'user',
        parts
      }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        topP: 0.95,
        topK: 40
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    };

    // Add tools if provided (for Google Search grounding)
    if (tools && tools.length > 0) {
      // Ensure tools are properly formatted for Gemini API
      try {
        requestBody.tools = tools;
        console.log('Adding Google Search grounding to request');
      } catch (error) {
        console.error('Error adding tools to request:', error);
        // Continue without tools if there's an error
      }
    }

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', {
        status: geminiResponse.status,
        statusText: geminiResponse.statusText,
        errorText: errorText,
        model: model,
        hasTools: tools && tools.length > 0,
        requestType: requestType
      });
      return new Response(
        JSON.stringify({ 
          error: 'AI service error', 
          success: false,
          details: errorText
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();

    // Extract response text
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
                        'No response generated';

    // Extract grounding metadata if available
    const groundingMetadata = geminiData.candidates?.[0]?.groundingMetadata;

    // ✅ BUSINESS LOGIC: Increment usage counter (server-side)
    const { error: updateError } = await supabase.rpc('increment_user_usage', {
      p_auth_user_id: userId,
      p_query_type: requestType,
      p_increment: 1
    });

    if (updateError) {
      console.error('Failed to update usage:', updateError);
      // Don't fail the request, just log the error
    }

    // Return successful response
    return new Response(
      JSON.stringify({
        response: responseText,
        success: true,
        groundingMetadata: groundingMetadata || null,
        usage: {
          textCount: requestType === 'text' ? userData.text_count + 1 : userData.text_count,
          imageCount: requestType === 'image' ? userData.image_count + 1 : userData.image_count
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('AI proxy error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        success: false,
        message: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
