import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import { getTodayStr } from '@/lib/date-utils'

export type Exercise = Database['public']['Tables']['exercises']['Row'] & {
  video_url?: string | null
}
export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row']
export type WorkoutSet = Database['public']['Tables']['workout_sets']['Row']

export type WorkoutPlanItem = {
  title: string
  description: string
  frequency: string
  dayOfWeek: string
}
export type WorkoutPlan = { summary: string; items: WorkoutPlanItem[] }

interface WorkoutContextType {
  exercises: Exercise[]
  sessions: WorkoutSession[]
  sets: WorkoutSet[]
  plan: WorkoutPlan | null
  loading: boolean
  addExercise: (name: string, muscleGroup?: string, videoUrl?: string) => Promise<Exercise | null>
  getOrCreateTodaySession: (notes?: string) => Promise<WorkoutSession | null>
  addSet: (
    sessionId: string,
    exerciseId: string,
    reps: number,
    weightKg: number,
    rpe?: number,
  ) => Promise<void>
  deleteSet: (id: string) => Promise<void>
  savePlan: (plan: WorkoutPlan) => Promise<void>
  refetchWorkouts: () => Promise<void>
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined)

export function useWorkout() {
  const ctx = useContext(WorkoutContext)
  if (!ctx) throw new Error('useWorkout must be used within WorkoutProvider')
  return ctx
}

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [sets, setSets] = useState<WorkoutSet[]>([])
  const [plan, setPlan] = useState<WorkoutPlan | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchWorkouts = useCallback(async () => {
    if (!user) return
    const [exercisesResult, sessionsResult, setsResult, planResult] = await Promise.all([
      supabase.from('exercises').select('*').order('name', { ascending: true }),
      supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false }),
      supabase
        .from('workout_sets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }),
      supabase.from('workout_plans').select('*').eq('user_id', user.id).maybeSingle(),
    ])

    setExercises(exercisesResult.data || [])
    setSessions(sessionsResult.data || [])
    setSets(setsResult.data || [])
    setPlan(
      planResult.data
        ? {
            summary: planResult.data.summary,
            items: (planResult.data.items as WorkoutPlanItem[]) || [],
          }
        : null,
    )
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (user) {
      fetchWorkouts()
    } else {
      setExercises([])
      setSessions([])
      setSets([])
      setPlan(null)
      setLoading(false)
    }
  }, [user, fetchWorkouts])

  const addExercise = useCallback(
    async (name: string, muscleGroup?: string, videoUrl?: string) => {
      if (!user) return null
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          user_id: user.id,
          name,
          muscle_group: muscleGroup || null,
          video_url: videoUrl || null,
        })
        .select()
        .single()
      if (error || !data) return null
      setExercises((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      return data
    },
    [user],
  )

  const getOrCreateTodaySession = useCallback(
    async (notes?: string) => {
      if (!user) return null
      const today = getTodayStr()
      const existing = sessions.find((s) => s.date === today)
      if (existing) return existing

      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({ user_id: user.id, date: today, notes: notes || null })
        .select()
        .single()
      if (error || !data) return null
      setSessions((prev) => [data, ...prev])
      return data
    },
    [user, sessions],
  )

  const addSet = useCallback(
    async (sessionId: string, exerciseId: string, reps: number, weightKg: number, rpe?: number) => {
      if (!user) return
      const setNumber =
        sets.filter((s) => s.session_id === sessionId && s.exercise_id === exerciseId).length + 1

      const { data, error } = await supabase
        .from('workout_sets')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          exercise_id: exerciseId,
          set_number: setNumber,
          reps,
          weight_kg: weightKg,
          rpe: rpe ?? null,
        })
        .select()
        .single()

      if (!error && data) setSets((prev) => [...prev, data])
    },
    [user, sets],
  )

  const deleteSet = useCallback(async (id: string) => {
    setSets((prev) => prev.filter((s) => s.id !== id))
    await supabase.from('workout_sets').delete().eq('id', id)
  }, [])

  const savePlan = useCallback(
    async (newPlan: WorkoutPlan) => {
      if (!user) return
      const { error } = await supabase
        .from('workout_plans')
        .upsert(
          { user_id: user.id, summary: newPlan.summary, items: newPlan.items },
          { onConflict: 'user_id' },
        )
      if (!error) setPlan(newPlan)
    },
    [user],
  )

  return (
    <WorkoutContext.Provider
      value={{
        exercises,
        sessions,
        sets,
        plan,
        loading,
        addExercise,
        getOrCreateTodaySession,
        addSet,
        deleteSet,
        savePlan,
        refetchWorkouts: fetchWorkouts,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  )
}
