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

export async function upsertSubscription(userId: string, planType: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        plan_type: planType,
        status: 'active',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single()
  return { data: data as Subscription | null, error }
}
