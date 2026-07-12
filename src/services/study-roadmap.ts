import { supabase } from '@/lib/supabase/client'

export type StudyStep = {
  id: string
  title: string
  completed: boolean
  order: number
}

export async function getStudyRoadmap(userId: string): Promise<StudyStep[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('study_roadmap')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return []
  return (data.study_roadmap as StudyStep[]) || []
}

export async function updateStudyRoadmap(
  userId: string,
  steps: StudyStep[],
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('profiles')
    .update({ study_roadmap: steps, updated_at: new Date().toISOString() })
    .eq('id', userId)
  return { error }
}
