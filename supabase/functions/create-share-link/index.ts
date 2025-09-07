import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";
import { createHash } from "https://deno.land/std@0.168.0/hash/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShareLinkRequest {
  table_id: string;
  share_type: 'public' | 'password' | 'embed';
  password?: string;
  expires_in_hours?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { table_id, share_type, password, expires_in_hours = 24 }: ShareLinkRequest = await req.json();

    // Verify user has access to this table
    const { data: table, error: tableError } = await supabase
      .from('base_tables')
      .select('id, name, company_id')
      .eq('id', table_id)
      .single();

    if (tableError || !table) {
      throw new Error('Table not found or access denied');
    }

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expires_in_hours);

    // Prepare share data
    const shareData: any = {
      table_id,
      share_type,
      expires_at: expiresAt.toISOString(),
      created_by: user.id,
    };

    // Hash password if provided
    if (share_type === 'password' && password) {
      const hasher = createHash('sha256');
      hasher.update(password);
      shareData.password_hash = hasher.toString();
    }

    // Create share link
    const { data: shareLink, error: shareError } = await supabase
      .from('shared_tables')
      .insert(shareData)
      .select('*')
      .single();

    if (shareError) {
      throw shareError;
    }

    console.log('Share link created:', shareLink);

    return new Response(
      JSON.stringify({
        share_token: shareLink.share_token,
        expires_at: shareLink.expires_at,
        share_type: shareLink.share_type
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('Error creating share link:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
});