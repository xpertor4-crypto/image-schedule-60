import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const coaches = [
      { email: 'coach@app.com', password: 'coach123', displayName: 'Coach' },
      { email: 'mary@app.com', password: 'mary123', displayName: 'Mary' },
      { email: 'john@app.com', password: 'john123', displayName: 'John' },
      { email: 'martin@app.com', password: 'martin123', displayName: 'Martin' },
    ]

    const results = []

    for (const coach of coaches) {
      try {
        // Create user with admin API
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
          email: coach.email,
          password: coach.password,
          email_confirm: true,
          user_metadata: {
            display_name: coach.displayName,
          }
        })

        if (userError) {
          // User might already exist
          results.push({ email: coach.email, status: 'exists', error: userError.message })
          continue
        }

        if (userData.user) {
          // Assign coach role
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({ user_id: userData.user.id, role: 'coach' })
            .select()
            .single()

          if (roleError && !roleError.message.includes('duplicate')) {
            results.push({ email: coach.email, status: 'role_error', error: roleError.message })
            continue
          }

          // Update profile
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ 
              display_name: coach.displayName,
              is_online: true 
            })
            .eq('id', userData.user.id)

          if (profileError) {
            results.push({ email: coach.email, status: 'profile_error', error: profileError.message })
            continue
          }

          results.push({ email: coach.email, status: 'success', userId: userData.user.id })
        }
      } catch (error: any) {
        results.push({ email: coach.email, status: 'error', error: error.message })
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
