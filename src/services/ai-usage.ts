import { supabase } from '@/lib/supabase/client'
import { AI_USAGE_LIMITS } from '@/lib/ai-usage-limits'

export interface AiUsageStatus {
  used: number
  limit: number
  planType: string
}

function currentPeriodMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

/** Read-only snapshot of the caller's Mentor IA quota — does not consume it. */
export async function fetchAiUsage(userId: string): Promise<AiUsageStatus> {
  const [{ data: subscription }, { data: usage }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('plan_type, status')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('ai_usage')
      .select('message_count')
      .eq('user_id', userId)
      .eq('period_month', currentPeriodMonth())
      .maybeSingle(),
  ])

  const planType =
    subscription?.status === 'active' && subscription.plan_type ? subscription.plan_type : 'free'
  const limit = AI_USAGE_LIMITS[planType] ?? AI_USAGE_LIMITS.free

  return { used: usage?.message_count ?? 0, limit, planType }
}
