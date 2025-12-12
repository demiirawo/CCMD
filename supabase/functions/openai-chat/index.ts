import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
const { messages, model = 'gpt-5-2025-08-07' } = await req.json();

    console.log('OpenAI function called with model:', model);
    console.log('Messages count:', messages?.length);

    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY is not configured');
      throw new Error('OPENAI_API_KEY is not configured');
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages array is required and must not be empty');
    }

    // Determine if this is a newer model that requires max_completion_tokens
    const isNewerModel =
      model.includes('gpt-5') ||
      model.includes('gpt-4.1') ||
      model.includes('o3') ||
      model.includes('o4');
    
    console.log('Calling OpenAI API...');
    const requestBody: any = {
      model,
      messages,
    };
    
    // Newer models (GPT-5, GPT-4.1, O3, O4) use max_completion_tokens and don't support temperature
    if (isNewerModel) {
      // Give the model enough headroom to perform internal reasoning *and* return user-visible content
      requestBody.max_completion_tokens = 16000;
    } else {
      requestBody.temperature = 0.7;
      requestBody.max_tokens = 4000;
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      console.error('No content in OpenAI response:', data);
      throw new Error('No content returned from OpenAI');
    }

    console.log('OpenAI response successful, content length:', generatedText.length);

    return new Response(JSON.stringify({ 
      content: generatedText,
      usage: data.usage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in openai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});