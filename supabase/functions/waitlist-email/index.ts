import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

// Environment variables (configured in Supabase dashboard)
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const APP_URL = Deno.env.get('APP_URL') || 'https://otagon.app'; // Your production URL

if (!RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY environment variable');
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface WaitlistEmailRequest {
  email: string;
  source?: string;
  waitlistId?: string;
}

// Email template with Otagon branding
function createWelcomeEmailHTML(email: string, loginUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Otagon!</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #0A0A0A;
      color: #F5F5F5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      padding: 40px 0;
      background: linear-gradient(135deg, #E53A3A 0%, #D98C1F 100%);
      border-radius: 12px 12px 0 0;
    }
    .logo {
      font-size: 36px;
      font-weight: bold;
      color: white;
      letter-spacing: 2px;
    }
    .content {
      background-color: #1C1C1C;
      padding: 40px;
      border-radius: 0 0 12px 12px;
    }
    h1 {
      color: #F5F5F5;
      font-size: 28px;
      margin-bottom: 20px;
    }
    p {
      color: #CFCFCF;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .cta-button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #E53A3A 0%, #D98C1F 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      font-size: 18px;
      margin: 20px 0;
      text-align: center;
    }
    .features {
      background-color: #2E2E2E;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
    }
    .feature-item {
      display: flex;
      align-items: start;
      margin: 15px 0;
      color: #CFCFCF;
    }
    .feature-icon {
      color: #5CBB7B;
      margin-right: 12px;
      font-size: 20px;
    }
    .footer {
      text-align: center;
      padding: 30px 20px;
      color: #8A8A8A;
      font-size: 14px;
    }
    .footer a {
      color: #D98C1F;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OTAGON</div>
    </div>
    <div class="content">
      <h1>🎮 Welcome to Otagon!</h1>
      <p>Hey there, gamer!</p>
      <p>Thanks for joining the Otagon waitlist! We're thrilled to have you as one of our early adopters. You're now part of an exclusive community of gamers who are about to experience gaming assistance like never before.</p>
      
      <div style="text-align: center;">
        <a href="${loginUrl}" class="cta-button" style="color: #FFFFFF !important; text-decoration: none;">Access Your Account →</a>
      </div>

      <div class="features">
        <h3 style="color: #F5F5F5; margin-top: 0;">What You Get:</h3>
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          <span><strong>AI-Powered Game Assistant:</strong> Get unstuck without spoilers</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          <span><strong>Screenshot Analysis:</strong> Upload and get instant help</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          <span><strong>Multi-Game Support:</strong> Switch between games seamlessly</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          <span><strong>Free Tier:</strong> 55 text queries + 25 image queries monthly</span>
        </div>
      </div>

      <p><strong>Getting Started:</strong></p>
      <ol style="color: #CFCFCF; line-height: 1.8;">
        <li>Click the button above to access the login page</li>
        <li>Sign up with this email address: <strong style="color: #FFAB40;">${email}</strong></li>
        <li>Choose your preferred authentication method (Google, Discord, or Email)</li>
        <li>Complete the quick onboarding</li>
        <li>Start gaming smarter!</li>
      </ol>

      <p style="margin-top: 30px;">Need help? Just reply to this email – we're here for you!</p>
      <p style="color: #8A8A8A; font-size: 14px; margin-top: 30px;">
        P.S. Make sure to add us to your contacts so you never miss updates about new features, pro tips, and exclusive offers!
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Otagon. All rights reserved.</p>
      <p>
        <a href="${APP_URL}">Visit Website</a> · 
        <a href="${APP_URL}#about">About Us</a> · 
        <a href="${APP_URL}/privacy">Privacy Policy</a>
      </p>
      <p style="margin-top: 20px; font-size: 12px;">
        You received this email because you signed up for Otagon's waitlist.<br>
        Hyderabad, India
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Plain text version for email clients that don't support HTML
function createWelcomeEmailText(email: string, loginUrl: string): string {
  return `
Welcome to Otagon!

Hey there, gamer!

Thanks for joining the Otagon waitlist! We're thrilled to have you as one of our early adopters.

Access Your Account:
${loginUrl}

What You Get:
✓ AI-Powered Game Assistant: Get unstuck without spoilers
✓ Screenshot Analysis: Upload and get instant help
✓ Multi-Game Support: Switch between games seamlessly
✓ Free Tier: 55 text queries + 25 image queries monthly

Getting Started:
1. Visit the login page using the link above
2. Sign up with this email address: ${email}
3. Choose your preferred authentication method (Google, Discord, or Email)
4. Complete the quick onboarding
5. Start gaming smarter!

Need help? Just reply to this email – we're here for you!

© ${new Date().getFullYear()} Otagon. All rights reserved.
Visit: ${APP_URL}
  `.trim();
}

async function sendWelcomeEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📧 Sending welcome email to: ${email}`);

    // Create login URL (directs to your app's login page)
    const loginUrl = `${APP_URL}?source=waitlist_email&email=${encodeURIComponent(email)}`;

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Otagon <onboarding@resend.dev>', // Using Resend test domain - change to welcome@otagon.app after verifying domain
        to: email,
        subject: '🎮 Welcome to Otagon - Your Gaming Assistant Awaits!',
        html: createWelcomeEmailHTML(email, loginUrl),
        text: createWelcomeEmailText(email, loginUrl),
        reply_to: 'onboarding@resend.dev', // Change to support@otagon.app after verifying domain
        tags: [
          { name: 'category', value: 'waitlist' },
          { name: 'source', value: 'automated' }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Resend API error:', errorData);
      return { success: false, error: `Resend API error: ${errorData}` };
    }

    const data = await response.json();
    console.log('✅ Email sent successfully:', data);

    // Update waitlist record with email sent timestamp
    const { error: updateError } = await supabase
      .from('waitlist')
      .update({ 
        email_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email_status: 'sent'
      })
      .eq('email', email);

    if (updateError) {
      console.warn('⚠️ Failed to update waitlist record:', updateError);
      // Don't fail the request if this update fails
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
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
    // Parse request body
    const body: WaitlistEmailRequest = await req.json();
    const { email } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required', success: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format', success: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send welcome email
    const result = await sendWelcomeEmail(email);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error, success: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent successfully',
        email 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Function error:', error);
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
