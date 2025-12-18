import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent'

interface Message {
  id: string
  role: string
  content: string
  timestamp: number
}

console.log('📝 Context Summarization Edge Function loaded')

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const geminiApiKey = Deno.env.get('VITE_GEMINI_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔍 Fetching conversations needing summarization...')

    // Find conversations with >50 messages that need summarization
    // Either: no summary yet OR summary older than 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: conversations, error: fetchError } = await supabase
      .from('conversations')
      .select('id, title, auth_user_id, context_summary_updated_at')
      .or(`context_summary.is.null,context_summary_updated_at.lt.${sevenDaysAgo.toISOString()}`)

    if (fetchError) {
      console.error('❌ Error fetching conversations:', fetchError)
      throw fetchError
    }

    console.log(`📊 Found ${conversations?.length || 0} conversations to check`)

    let summarized = 0
    let skipped = 0

    for (const conv of conversations || []) {
      // Get message count for this conversation
      const { count: messageCount, error: countError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)

      if (countError) {
        console.error(`❌ Error counting messages for ${conv.id}:`, countError)
        continue
      }

      // Skip if less than 50 messages
      if (!messageCount || messageCount < 50) {
        skipped++
        continue
      }

      console.log(`📝 Summarizing conversation: ${conv.title} (${messageCount} messages)`)

      // Fetch all messages for this conversation
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true })

      if (messagesError || !messages || messages.length === 0) {
        console.error(`❌ Error fetching messages for ${conv.id}:`, messagesError)
        continue
      }

      // Build conversation text (limit to last 100 messages for token efficiency)
      const recentMessages = messages.slice(-100)
      const conversationText = recentMessages
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n')

      // Call Gemini API to summarize
      const prompt = `You are a helpful AI assistant that summarizes gaming conversations. 

Summarize the following conversation between a user and a gaming assistant in 300-500 words. Focus on:
1. Main topics discussed
2. Key questions asked by the user
3. Important advice or information provided
4. Current game progress or objectives mentioned
5. Any unresolved issues or ongoing challenges

Keep the summary factual, concise, and helpful for continuing the conversation later.

CONVERSATION:
${conversationText}

SUMMARY:`

      try {
        const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1000,
            },
          }),
        })

        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text()
          console.error(`❌ Gemini API error for ${conv.id}:`, errorText)
          continue
        }

        const geminiData = await geminiResponse.json()
        const summary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

        if (!summary) {
          console.error(`❌ No summary generated for ${conv.id}`)
          continue
        }

        // Update conversation with summary
        const { error: updateError } = await supabase
          .from('conversations')
          .update({
            context_summary: summary,
            context_summary_updated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', conv.id)

        if (updateError) {
          console.error(`❌ Error updating summary for ${conv.id}:`, updateError)
          continue
        }

        console.log(`✅ Summarized: ${conv.title}`)
        summarized++

      } catch (error) {
        console.error(`❌ Error processing ${conv.id}:`, error)
        continue
      }

      // Rate limit: wait 1 second between API calls
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    const result = {
      success: true,
      summarized,
      skipped,
      total: conversations?.length || 0,
      message: `Processed ${conversations?.length || 0} conversations: ${summarized} summarized, ${skipped} skipped`,
    }

    console.log('📊 Summary job complete:', result)

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )

  } catch (error) {
    console.error('❌ Fatal error in summarize-conversations:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  }
})
