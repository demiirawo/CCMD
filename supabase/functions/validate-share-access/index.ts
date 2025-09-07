import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateAccessRequest {
  share_token: string;
  password?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { share_token, password }: ValidateAccessRequest = await req.json();

    // Get share link details
    const { data: shareLink, error: shareError } = await supabase
      .from('shared_tables')
      .select(`
        *,
        base_tables!inner (
          id,
          name,
          description,
          icon,
          color,
          company_id
        )
      `)
      .eq('share_token', share_token)
      .eq('is_active', true)
      .single();

    if (shareError || !shareLink) {
      return new Response(
        JSON.stringify({ error: 'Share link not found or expired' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Check if link has expired
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Share link has expired' }),
        {
          status: 410,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Check password if required
    if (shareLink.share_type === 'password') {
      if (!password) {
        return new Response(
          JSON.stringify({ 
            error: 'Password required',
            requires_password: true 
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          }
        );
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (hashedPassword !== shareLink.password_hash) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid password',
            requires_password: true 
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          }
        );
      }
    }

    // Get table fields
    const { data: fields, error: fieldsError } = await supabase
      .from('base_fields')
      .select('*')
      .eq('table_id', shareLink.table_id)
      .order('position');

    if (fieldsError) {
      throw fieldsError;
    }

    // Get table records
    const { data: records, error: recordsError } = await supabase
      .from('base_records')
      .select('*')
      .eq('table_id', shareLink.table_id)
      .is('deleted_at', null)
      .order('position');

    if (recordsError) {
      throw recordsError;
    }

    return new Response(
      JSON.stringify({
        table: shareLink.base_tables,
        fields: fields || [],
        records: records || [],
        share_type: shareLink.share_type
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('Error validating share access:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
});