import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { getTodayStr } from '@/lib/date-utils'

export type HealthLog = {
  id: string
  user_id: string
  date: string
  calories_consumed: number
  water_intake_ml: number
}

export type HealthProfile = {
  weight_kg: number | null
  height_cm: number | null
  age: number | null
  gender: string | null
  activity_level: string | null
}

interface HealthContextType {
  healthLog: HealthLog | null
  healthProfile: HealthProfile | null
  loading: boolean
  addWater: (ml: number) => Promise<void>
  addCalories: (cal: number) => Promise<void>
  updateHealthProfile: (data: HealthProfile) => Promise<void>
  refetchHealth: () => Promise<void>
}

const HealthContext = createContext<HealthContextType | undefined>(undefined)

export function useHealth() {
  const ctx = useContext(HealthContext)
  if (!ctx) throw new Error('useHealth must be used within HealthProvider')
  return ctx
}

export function HealthProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [healthLog, setHealthLog] = useState<HealthLog | null>(null)
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchHealth = useCallback(async () => {
    if (!user) return
    const today = getTodayStr()

    const [logResult, profileResult] = await Promise.all([
      supabase
        .from('health_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('weight_kg, height_cm, age, gender, activity_level')
        .eq('id', user.id)
        .maybeSingle(),
    ])

    setHealthLog(logResult.data as HealthLog | null)
    setHealthProfile(profileResult.data as HealthProfile | null)
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (user) {
      fetchHealth()
    } else {
      setHealthLog(null)
      setHealthProfile(null)
      setLoading(false)
    }
  }, [user, fetchHealth])

  const addWater = useCallback(
    async (ml: number) => {
      if (!user) return
      const today = getTodayStr()
      const currentWater = healthLog?.water_intake_ml || 0
      const currentCalories = healthLog?.calories_consumed || 0

      const { data } = await supabase
        .from('health_logs')
        .upsert(
          {
            user_id: user.id,
            date: today,
            water_intake_ml: currentWater + ml,
            calories_consumed: currentCalories,
          },
          { onConflict: 'user_id,date' },
        )
        .select()
        .single()

      if (data) setHealthLog(data as HealthLog)
    },
    [user, healthLog],
  )

  const addCalories = useCallback(
    async (cal: number) => {
      if (!user) return
      const today = getTodayStr()
      const currentWater = healthLog?.water_intake_ml || 0
      const currentCalories = healthLog?.calories_consumed || 0

      const { data } = await supabase
        .from('health_logs')
        .upsert(
          {
            user_id: user.id,
            date: today,
            calories_consumed: currentCalories + cal,
            water_intake_ml: currentWater,
          },
          { onConflict: 'user_id,date' },
        )
        .select()
        .single()

      if (data) setHealthLog(data as HealthLog)
    },
    [user, healthLog],
  )

  const updateHealthProfile = useCallback(
    async (data: HealthProfile) => {
      if (!user) return
      const { error } = await supabase
        .from('profiles')
        .update({
          weight_kg: data.weight_kg,
          height_cm: data.height_cm,
          age: data.age,
          gender: data.gender,
          activity_level: data.activity_level,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
      if (!error) setHealthProfile(data)
    },
    [user],
  )

  return (
    <HealthContext.Provider
      value={{
        healthLog,
        healthProfile,
        loading,
        addWater,
        addCalories,
        updateHealthProfile,
        refetchHealth: fetchHealth,
      }}
    >
      {children}
    </HealthContext.Provider>
  )
}
