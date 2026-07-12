import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getProfile, updateProfile } from '@/services/profiles'

export type PomodoroSettings = {
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
}

export function usePomodoroSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    getProfile(user.id).then(({ data }) => {
      if (data) {
        setSettings({
          focusDuration: data.pomodoro_focus_duration ?? 25,
          shortBreakDuration: data.pomodoro_short_break ?? 5,
          longBreakDuration: data.pomodoro_long_break ?? 15,
        })
      }
      setLoading(false)
    })
  }, [user])

  const updateSettings = useCallback(
    async (newSettings: PomodoroSettings) => {
      setSettings(newSettings)
      if (!user) return
      await updateProfile(user.id, {
        pomodoro_focus_duration: newSettings.focusDuration,
        pomodoro_short_break: newSettings.shortBreakDuration,
        pomodoro_long_break: newSettings.longBreakDuration,
      })
    },
    [user],
  )

  return { settings, updateSettings, loading }
}
