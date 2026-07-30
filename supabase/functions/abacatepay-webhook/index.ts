import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

function mapStatus(event: string): 'active' | 'trialing' | 'canceled' | null {
  if (event === 'subscription.completed' || event === 'subscription.renewed') return 'active'
  if (event === 'subscription.trial_started') return 'trialing'
  if (event === 'subscription.cancelled') return 'canceled'
  return null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const expectedSecret = Deno.env.get('ABACATEPAY_WEBHOOK_SECRET')
    if (!expectedSecret || url.searchParams.get('webhookSecret') !== expectedSecret) {
      return new Response('unauthorized', { status: 401, headers: corsHeaders })
    }

    const body = (await req.json().catch(() => ({}))) as {
      event?: string
      data?: { id?: string; externalId?: string; status?: string }
    }

    const status = body.event ? mapStatus(body.event) : null
    if (!status) {
      // Acknowledge event types we don't act on (payouts, transfers, checkout, etc.)
      return new Response('ok', { headers: corsHeaders })
    }

    const billId = body.data?.id
    const userId = body.data?.externalId
    if (!billId && !userId) {
      return new Response('missing bill id / externalId', { status: 400, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const serviceClient = createClient(supabaseUrl, serviceRoleKey)

    const query = serviceClient
      .from('subscriptions')
      .select('user_id, plan_type')
      .maybeSingle()
    const { data: existing } = billId
      ? await query.eq('abacatepay_bill_id', billId)
      : await query.eq('user_id', userId!)

    if (!existing) {
      return new Response('subscription not found', { status: 404, headers: corsHeaders })
    }

    const isPremiumPlan = status === 'active'

    const updateQuery = serviceClient.from('subscriptions').update({
      status,
      abacatepay_status: body.data?.status ?? body.event,
      abacatepay_bill_id: billId ?? undefined,
      updated_at: new Date().toISOString(),
    })
    if (billId) await updateQuery.eq('abacatepay_bill_id', billId)
    else await updateQuery.eq('user_id', existing.user_id)

    await serviceClient
      .from('profiles')
      .update({ is_premium: isPremiumPlan && existing.plan_type !== 'free' })
      .eq('id', existing.user_id)

    return new Response('ok', { headers: corsHeaders })
  } catch (err) {
    return new Response(String(err), { status: 500, headers: corsHeaders })
  }
})
