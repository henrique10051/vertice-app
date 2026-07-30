import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { fetchAiUsage, type AiUsageStatus } from '@/services/ai-usage'

export function useAiUsage() {
  const { user } = useAuth()
  const [status, setStatus] = useState<AiUsageStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) {
      setStatus(null)
      setLoading(false)
      return
    }
    const data = await fetchAiUsage(user.id)
    setStatus(data)
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Optimistic bump right after a message is sent, so the counter doesn't lag
  // behind the server round-trip that already happened inside the Edge Function.
  const consumeLocal = useCallback(() => {
    setStatus((prev) => (prev ? { ...prev, used: Math.min(prev.used + 1, prev.limit) } : prev))
  }, [])

  return { status, loading, refresh, consumeLocal }
}
