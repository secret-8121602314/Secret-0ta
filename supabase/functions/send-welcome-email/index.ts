// Deno-specific Supabase Edge Function - not compatible with TypeScript compilation
// This file is meant to run in Deno runtime, not Node.js

/*
// File: supabase/functions/send-welcome-email/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend";

// This line reads the RESEND_API_KEY you will set in the next step.
const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

console.log("Hello from send-welcome-email Function!");

serve(async (req) => {
  // Handle CORS/preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      }
    });
  }
  try {
    // Accept payload from either DB webhook ({ record: { email } }) or direct invoke ({ email })
    const payload = await req.json();
    const email: string | undefined = payload?.email || payload?.record?.email;
    if (!email) {
      return new Response(JSON.stringify({ error: 'Missing email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // ⬇️ *** CUSTOMIZE YOUR EMAIL HERE *** ⬇️
    const { data, error } = await resend.emails.send({
      // Replace with your verified domain email
      from: "Otagon <support@otagon.app>",
      // The email of the person who just signed up
      to: [email],
      // The subject of the email
      subject: "🎉 Welcome to Otagon! You're on the waitlist!",
      // The HTML content of the email
      html: `
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #111;">
            <h2 style="margin-bottom: 8px;">Thanks for joining the Otagon waitlist!</h2>
            <p style="margin: 0 0 8px 0;">We're excited to have you. You're all set—no further action needed.</p>
            <p style="margin: 0 0 8px 0;">We'll notify you as soon as we launch and when early access opens.</p>
            <p style="margin: 16px 0 0 0;">— The Otagon Team</p>
          </body>
        </html>
      `,
    });
    // ⬆️ *** END OF CUSTOMIZATION *** ⬆️

    if (error) {
      console.error({ error });
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
      });
    }

    console.log("Email sent successfully:", data);
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err) {
    console.error("Error sending email:", err);
    return new Response(String(err?.message ?? err), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
});
*/