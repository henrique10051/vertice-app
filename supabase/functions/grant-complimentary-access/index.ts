import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Admin-only: grants a user a plan without going through AbacatePay checkout —
// used for the closed-beta cohort (complimentary premium access, no payment yet)
// and for unblocking accounts stuck in AbacatePay's pre-confirmation 'trialing'
// status while the webhook pipeline isn't fully wired in production.
// Protected by ADMIN_GRANT_SECRET (set via `supabase secrets set`), never exposed
// to the app's own client — call it directly with curl/service tooling only.
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const adminSecret = Deno.env.get('ADMIN_GRANT_SECRET')
    const providedSecret = req.headers.get('X-Admin-Secret')
    if (!adminSecret || providedSecret !== adminSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const { email, planType } = (await req.json()) as { email: string; planType: string }
    if (!email || !['pro', 'premium'].includes(planType)) {
      return new Response(JSON.stringify({ error: 'email and planType (pro|premium) required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const serviceClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: userList, error: userError } = await serviceClient.auth.admin.listUsers()
    if (userError) throw userError
    const user = userList.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (!user) {
      return new Response(JSON.stringify({ error: 'No user with that email' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const { error: upsertError } = await serviceClient.from('subscriptions').upsert(
      {
        user_id: user.id,
        plan_type: planType,
        status: 'active',
        access_source: 'complimentary',
        abacatepay_bill_id: null,
        abacatepay_status: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    if (upsertError) throw upsertError

    await serviceClient.from('profiles').update({ is_premium: true }).eq('id', user.id)

    return new Response(JSON.stringify({ success: true, userId: user.id, planType }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
