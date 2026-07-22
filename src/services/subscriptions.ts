import { supabase } from '@/lib/supabase/client'

export type Subscription = {
  id: string
  user_id: string
  plan_type: 'free' | 'pro' | 'premium'
  status: string
  created_at: string
  updated_at: string
}

export async function getSubscription(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()
  return { data: data as Subscription | null, error }
}

export async function startCheckout(planId: string) {
  const { data, error } = await supabase.functions.invoke<{
    success: boolean
    init_point: string | null
  }>('mercadopago-checkout', { body: { planId } })
  if (error) return { initPoint: null, error }
  return { initPoint: data?.init_point ?? null, error: null }
}
