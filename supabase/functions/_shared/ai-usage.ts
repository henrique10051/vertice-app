import { createClient } from 'jsr:@supabase/supabase-js@2'

// Messages/month by plan. Generous during the closed beta (all users start on 'free').
export const AI_USAGE_LIMITS: Record<string, number> = {
  free: 40,
  pro: 150,
  premium: 500,
}

export interface UsageResult {
  allowed: boolean
  used: number
  limit: number
  planType: string
}

export type UsageCheck =
  | { ok: true; result: UsageResult }
  | { ok: false; status: number; error: string }

/**
 * Authenticates the caller from the request's Authorization header, resolves
 * their plan, and atomically consumes one unit of their monthly AI quota via
 * consume_ai_usage(). Must run before any OpenAI call so blocked users never
 * incur API cost.
 */
export async function checkAndConsumeAiUsage(req: Request): Promise<UsageCheck> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { ok: false, status: 401, error: 'Missing Authorization header' }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()

  if (userError || !user) {
    return { ok: false, status: 401, error: 'Invalid session' }
  }

  const { data: subscription } = await userClient
    .from('subscriptions')
    .select('plan_type, status')
    .eq('user_id', user.id)
    .maybeSingle()

  const planType =
    subscription?.status === 'active' && subscription.plan_type ? subscription.plan_type : 'free'
  const limit = AI_USAGE_LIMITS[planType] ?? AI_USAGE_LIMITS.free

  const { data, error } = await userClient
    .rpc('consume_ai_usage', { p_limit: limit })
    .single<{ allowed: boolean; used: number; limit: number }>()

  if (error || !data) {
    return { ok: false, status: 500, error: 'Failed to check AI usage' }
  }

  return {
    ok: true,
    result: { allowed: data.allowed, used: data.used, limit: data.limit, planType },
  }
}
