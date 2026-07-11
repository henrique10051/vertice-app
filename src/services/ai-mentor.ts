import { supabase } from '@/lib/supabase/client'
import { getAIMentorResponse, type AIMentorContext } from '@/lib/ai-mentor'

export async function fetchAIMentorInsight(
  message: string,
  context: AIMentorContext,
): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-mentor', {
      body: { message, context },
    })
    if (error || !data?.response) {
      return getAIMentorResponse(message, context)
    }
    return data.response as string
  } catch {
    return getAIMentorResponse(message, context)
  }
}
