import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@4.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { MagicLinkEmail } from "./_templates/magic-link.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    console.log("Received webhook payload for magic link email");
    
    // Check if required environment variables are set
    if (!Deno.env.get("RESEND_API_KEY")) {
      console.error("RESEND_API_KEY is not configured");
      throw new Error("RESEND_API_KEY is not configured");
    }
    
    const payload = await req.text();
    console.log("Payload received:", payload.substring(0, 200) + "...");

    // Parse the payload directly - webhook verification can be problematic
    const webhookData = JSON.parse(payload);
    console.log("Parsed webhook data:", JSON.stringify(webhookData, null, 2));
    
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type, site_url },
    } = webhookData as {
      user: {
        email: string;
      };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url: string;
      };
    };

    console.log(`Sending magic link email to: ${user.email}`);
    console.log(`Email action type: ${email_action_type}`);

    // Render the React email template
    const html = await renderAsync(
      React.createElement(MagicLinkEmail, {
        supabase_url: site_url,
        token,
        token_hash,
        redirect_to,
        email_action_type,
      })
    );

    console.log("About to send email via Resend...");
    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "CCMD <onboarding@resend.dev>",
      to: [user.email],
      subject: email_action_type === "signup" ? "Welcome to CCMD - Confirm your account" : "Sign in to CCMD",
      html,
    });
    
    console.log("Resend response:", emailResponse);

    if (emailResponse.error) {
      console.error("Error sending email:", emailResponse.error);
      throw emailResponse.error;
    }

    console.log("Email sent successfully:", emailResponse.data);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-magic-link function:", error);
    return new Response(
      JSON.stringify({ 
        error: {
          http_code: error.code || 500,
          message: error.message || "Internal server error"
        }
      }),
      {
        status: error.code || 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);