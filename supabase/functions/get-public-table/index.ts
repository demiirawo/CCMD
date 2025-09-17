import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const tableId = url.pathname.split('/').pop();
    
    if (!tableId) {
      return new Response(
        JSON.stringify({ error: 'Table ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching table data for ID:', tableId);

    // Get table info
    const { data: table, error: tableError } = await supabase
      .from('base_tables')
      .select('id, name, description, icon, color')
      .eq('id', tableId)
      .single();

    if (tableError) {
      console.error('Table error:', tableError);
      return new Response(
        JSON.stringify({ error: 'Table not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Get fields
    const { data: fields, error: fieldsError } = await supabase
      .from('base_fields')
      .select('*')
      .eq('table_id', tableId)
      .order('position');

    if (fieldsError) {
      console.error('Fields error:', fieldsError);
      throw fieldsError;
    }

    // Get records
    const { data: records, error: recordsError } = await supabase
      .from('base_records')
      .select('*')
      .eq('table_id', tableId)
      .is('deleted_at', null)
      .order('position');

    if (recordsError) {
      console.error('Records error:', recordsError);
      throw recordsError;
    }

    const responseData = {
      table,
      fields: fields || [],
      records: records || []
    };

    console.log('Successfully fetched table data:', {
      table: table?.name,
      fieldsCount: fields?.length || 0,
      recordsCount: records?.length || 0
    });

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('Error in get-public-table function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
});