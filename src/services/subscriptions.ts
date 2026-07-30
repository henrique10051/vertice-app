import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

export type Subscription = Database['public']['Tables']['subscriptions']['Row']

export async function getSubscription(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()
  return { data, error }
}

export async function startCheckout(planId: string) {
  const { data, error } = await supabase.functions.invoke<{
    success: boolean
    init_point: string | null
  }>('abacatepay-checkout', { body: { planId } })
  if (error) return { initPoint: null, error }
  return { initPoint: data?.init_point ?? null, error: null }
}
