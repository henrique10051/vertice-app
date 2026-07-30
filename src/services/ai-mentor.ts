import { supabase } from '@/lib/supabase/client'
import { getAIMentorResponse, type AIMentorContext } from '@/lib/ai-mentor'

export interface AIMentorInsight {
  response: string
  limitReached?: boolean
  usage?: { used: number; limit: number; planType: string }
}

export async function fetchAIMentorInsight(
  message: string,
  context: AIMentorContext,
): Promise<AIMentorInsight> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-mentor', {
      body: { message, context },
    })
    if (error || !data) {
      return { response: getAIMentorResponse(message, context) }
    }
    if (data.limitReached) {
      return {
        response: 'Você atingiu o limite de mensagens da IA neste mês.',
        limitReached: true,
        usage: data.usage,
      }
    }
    if (!data.response) {
      return { response: getAIMentorResponse(message, context) }
    }
    return { response: data.response as string }
  } catch {
    return { response: getAIMentorResponse(message, context) }
  }
}
