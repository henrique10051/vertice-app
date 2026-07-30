import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Product IDs created once via `deno run scripts/setup-abacatepay-products.ts`
// (see that script for the price/cycle each maps to) and stored as env vars
// because AbacatePay generates the id when the product is created.
const PLAN_PRODUCT_ENV: Record<string, string> = {
  pro: 'ABACATEPAY_PRODUCT_PRO',
  premium: 'ABACATEPAY_PRODUCT_PREMIUM',
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
          abacatepay_bill_id: null,
          abacatepay_status: null,
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

    const productEnvVar = PLAN_PRODUCT_ENV[planId]
    const productId = productEnvVar ? Deno.env.get(productEnvVar) : undefined
    if (!productId) {
      return new Response(JSON.stringify({ error: 'Invalid plan or product not configured' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const abacatepayApiKey = Deno.env.get('ABACATEPAY_API_KEY')
    if (!abacatepayApiKey) {
      return new Response(
        JSON.stringify({ error: 'Billing not configured (missing ABACATEPAY_API_KEY)' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://vertice.app'

    const abacatepayResponse = await fetch('https://api.abacatepay.com/v2/subscriptions/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${abacatepayApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ id: productId, quantity: 1 }],
        externalId: user.id,
        returnUrl: `${appUrl}/planos`,
        completionUrl: `${appUrl}/planos`,
      }),
    })

    const result = await abacatepayResponse.json()
    if (!abacatepayResponse.ok || !result.success) {
      return new Response(
        JSON.stringify({ error: `AbacatePay error: ${result.error ?? (await abacatepayResponse.text())}` }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    const bill = result.data

    const { error: dbError } = await serviceClient.from('subscriptions').upsert(
      {
        user_id: user.id,
        plan_type: planId,
        status: 'trialing',
        abacatepay_bill_id: bill.id,
        abacatepay_status: bill.status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    if (dbError) throw dbError

    return new Response(JSON.stringify({ success: true, init_point: bill.url }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
