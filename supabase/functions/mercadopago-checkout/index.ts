import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const PLAN_PRICES: Record<string, number> = {
  pro: 19.9,
  premium: 39.9,
}

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

    const { planId } = (await req.json()) as { planId: string }
    const serviceClient = createClient(supabaseUrl, serviceRoleKey)

    if (planId === 'free') {
      const { error } = await serviceClient.from('subscriptions').upsert(
        {
          user_id: user.id,
          plan_type: 'free',
          status: 'active',
          mp_preapproval_id: null,
          mp_status: null,
          current_period_end: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      if (error) throw error
      await serviceClient.from('profiles').update({ is_premium: false }).eq('id', user.id)
      return new Response(JSON.stringify({ success: true, init_point: null }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const price = PLAN_PRICES[planId]
    if (!price) {
      return new Response(JSON.stringify({ error: 'Invalid plan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const mpAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    if (!mpAccessToken) {
      return new Response(
        JSON.stringify({ error: 'Billing not configured (missing MERCADOPAGO_ACCESS_TOKEN)' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://vertice.app'

    const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: `Vértice ${planId === 'premium' ? 'Premium' : 'Pro'}`,
        external_reference: user.id,
        payer_email: user.email,
        back_url: `${appUrl}/planos`,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: price,
          currency_id: 'BRL',
        },
        status: 'pending',
      }),
    })

    if (!mpResponse.ok) {
      const errText = await mpResponse.text()
      return new Response(JSON.stringify({ error: `Mercado Pago error: ${errText}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const preapproval = await mpResponse.json()

    const { error: dbError } = await serviceClient.from('subscriptions').upsert(
      {
        user_id: user.id,
        plan_type: planId,
        status: 'trialing',
        mp_preapproval_id: preapproval.id,
        mp_status: preapproval.status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    if (dbError) throw dbError

    return new Response(JSON.stringify({ success: true, init_point: preapproval.init_point }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
