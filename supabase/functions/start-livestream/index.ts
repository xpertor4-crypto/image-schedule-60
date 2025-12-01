import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const streamApiKey = Deno.env.get('STREAM_API_KEY');
    const streamApiSecret = Deno.env.get('STREAM_API_SECRET');

    if (!streamApiKey || !streamApiSecret) {
      throw new Error('GetStream credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { title } = await req.json();

    if (!title) {
      throw new Error('Title is required');
    }

    console.log('Creating livestream for user:', user.id);

    // Generate unique call ID
    const callId = `livestream-${user.id}-${Date.now()}`;

    // Create GetStream user token
    const streamUserId = user.id;
    
    // Create GetStream token using HMAC-SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(streamApiSecret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const payload = JSON.stringify({
      user_id: streamUserId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    });

    const messageData = encoder.encode(payload);
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    const signatureArray = Array.from(new Uint8Array(signature));
    const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const streamToken = `${btoa(payload)}.${signatureHex}`;

    // Store livestream in database
    const { data: livestream, error: insertError } = await supabase
      .from('livestream')
      .insert({
        user_id: user.id,
        title,
        stream_call_id: callId,
        stream_token: streamToken,
        status: 'active'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    console.log('Livestream created successfully:', livestream.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        livestream,
        streamApiKey,
        callId,
        token: streamToken
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in start-livestream:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
