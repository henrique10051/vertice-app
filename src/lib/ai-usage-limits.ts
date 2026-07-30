// Mirrors supabase/functions/_shared/ai-usage.ts AI_USAGE_LIMITS — keep both in sync.
// Messages/month by plan. Free has no Mentor IA access; it's a paid-tier feature.
export const AI_USAGE_LIMITS: Record<string, number> = {
  free: 0,
  pro: 150,
  premium: 500,
}
