import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

function mapStatus(mpStatus: string): 'active' | 'trialing' | 'canceled' {
  if (mpStatus === 'authorized') return 'active'
  if (mpStatus === 'pending') return 'trialing'
  return 'canceled'
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const body = await req.json().catch(() => ({}) as Record<string, unknown>)
    const type = url.searchParams.get('type') || (body?.type as string | undefined)
    const dataId =
      url.searchParams.get('data.id') ||
      (body?.data as { id?: string } | undefined)?.id ||
      undefined

    const mpAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')!
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const serviceClient = createClient(supabaseUrl, serviceRoleKey)

    if (type !== 'preapproval' || !dataId) {
      // Acknowledge other notification types (e.g. payment) without processing.
      return new Response('ok', { headers: corsHeaders })
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${dataId}`, {
      headers: { Authorization: `Bearer ${mpAccessToken}` },
    })
    if (!mpResponse.ok) {
      return new Response('failed to fetch preapproval', { status: 502, headers: corsHeaders })
    }
    const preapproval = await mpResponse.json()
    const userId = preapproval.external_reference as string
    if (!userId) {
      return new Response('missing external_reference', { status: 400, headers: corsHeaders })
    }

    const status = mapStatus(preapproval.status)
    const isPremiumPlan = status === 'active'

    const { data: existing } = await serviceClient
      .from('subscriptions')
      .select('plan_type')
      .eq('user_id', userId)
      .single()

    await serviceClient
      .from('subscriptions')
      .update({
        status,
        mp_status: preapproval.status,
        current_period_end: preapproval.next_payment_date || null,
        updated_at: new Date().toISOString(),
      })
      .eq('mp_preapproval_id', dataId)

    if (existing) {
      await serviceClient
        .from('profiles')
        .update({ is_premium: isPremiumPlan && existing.plan_type !== 'free' })
        .eq('id', userId)
    }

    return new Response('ok', { headers: corsHeaders })
  } catch (err) {
    return new Response(String(err), { status: 500, headers: corsHeaders })
  }
})
