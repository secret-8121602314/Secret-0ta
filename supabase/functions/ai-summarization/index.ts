// AI Summarization Edge Function - Handles context summarization
// Rate Limit: 10 requests per minute per user (lowest priority background task)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_KEY_SUMMARIZATION");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_KEY_SUMMARIZATION not set in Supabase secrets");
}

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute for summarization

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

serve(async (req) => {
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
    // Get user ID from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Rate limiting check
    const now = Date.now();
    const userLimit = rateLimitMap.get(userId);

    if (userLimit) {
      if (now < userLimit.resetTime) {
        if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
          return new Response(
            JSON.stringify({ 
              error: "Rate limit exceeded for context summarization. Please wait a moment.",
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
    
    // Check if this is custom format (from aiService) or Gemini format (direct)
    let contents, systemInstruction, generationConfig, tools;
    
    if (body.prompt) {
      // Custom format from aiService - convert to Gemini format
      const { 
        prompt, 
        image, 
        systemPrompt, 
        temperature = 0.7, 
        maxTokens = 8192,
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
    console.error("Error in ai-summarization function:", error);
    return new Response(JSON.stringify({ error: "Internal server error", message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
