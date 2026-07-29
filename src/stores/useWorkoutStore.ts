import {
  useWorkout,
  type Exercise,
  type WorkoutSession,
  type WorkoutSet,
  type WorkoutPlan,
  type WorkoutPlanItem,
} from '@/providers/workout-provider'

export type { Exercise, WorkoutSession, WorkoutSet, WorkoutPlan, WorkoutPlanItem }

export default function useWorkoutStore() {
  return useWorkout()
}
