import { supabase } from '@/lib/supabase/client'
import {
  generateFallbackWorkoutSuggestion,
  type WorkoutSuggestion,
  type WorkoutSuggestionContext,
} from '@/lib/workout-suggestion-fallback'

export async function fetchWorkoutSuggestion(
  context: WorkoutSuggestionContext,
): Promise<WorkoutSuggestion> {
  try {
    const { data, error } = await supabase.functions.invoke('workout-suggestion', {
      body: { context },
    })
    if (error || !data?.summary || !Array.isArray(data?.habits)) {
      return generateFallbackWorkoutSuggestion(context)
    }
    return data as WorkoutSuggestion
  } catch {
    return generateFallbackWorkoutSuggestion(context)
  }
}
