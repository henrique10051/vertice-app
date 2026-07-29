import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const USER_TABLES = [
  'profiles',
  'habits',
  'habit_logs',
  'transactions',
  'finance_categories',
  'agenda_tasks',
  'health_logs',
  'inventory_items',
  'notifications',
  'pomodoro_logs',
  'subscriptions',
]

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey)
    const filterColumn: Record<string, string> = { profiles: 'id' }

    const exportData: Record<string, unknown> = {
      exported_at: new Date().toISOString(),
      user: { id: user.id, email: user.email, created_at: user.created_at },
    }

    for (const table of USER_TABLES) {
      const column = filterColumn[table] || 'user_id'
      const { data, error } = await serviceClient.from(table).select('*').eq(column, user.id)
      exportData[table] = error ? [] : data
    }

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="vertice-meus-dados.json"',
        ...corsHeaders,
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
