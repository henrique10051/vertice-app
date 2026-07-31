import { supabase } from '@/lib/supabase/client'

export interface FeedbackData {
  user_id: string
  rating: number
  message: string
}

export interface FeedbackResponse {
  success: boolean
  error: string | null
}

/**
 * Sends user feedback (star rating and comment) to the Supabase database.
 */
export async function sendFeedback(feedback: FeedbackData): Promise<FeedbackResponse> {
  try {
    const { error } = await supabase.from('feedbacks').insert({
      user_id: feedback.user_id,
      rating: feedback.rating,
      message: feedback.message,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro desconhecido' }
  }
}
