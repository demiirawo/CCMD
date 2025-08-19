import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return new Response("Missing url parameter", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Validate URL to prevent abuse - only allow specific domains
    const allowedDomains = [
      "airtable.com",
      "docs.google.com",
      "sheets.google.com",
      "forms.google.com"
    ];

    const targetDomain = new URL(targetUrl).hostname;
    const isAllowed = allowedDomains.some(domain => 
      targetDomain === domain || targetDomain.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      return new Response("Domain not allowed", {
        status: 403,
        headers: corsHeaders,
      });
    }

    console.log("Fetching content from:", targetUrl);

    // Fetch the external content
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const content = await response.text();

    // Return the content with modified headers to allow iframe embedding
    return new Response(content, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": response.headers.get("Content-Type") || "text/html",
        // Remove X-Frame-Options to allow iframe embedding
        "X-Frame-Options": "ALLOWALL",
        // Add headers to allow embedding
        "Content-Security-Policy": "frame-ancestors *;",
      },
    });

  } catch (error: any) {
    console.error("Error in iframe-proxy function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);