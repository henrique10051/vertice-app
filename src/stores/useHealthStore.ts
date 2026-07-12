import { useHealth, type HealthLog, type HealthProfile } from '@/providers/health-provider'

export type { HealthLog, HealthProfile }

export default function useHealthStore() {
  const {
    healthLog,
    healthProfile,
    loading,
    addWater,
    addCalories,
    updateHealthProfile,
    refetchHealth,
  } = useHealth()
  return {
    healthLog,
    healthProfile,
    loading,
    addWater,
    addCalories,
    updateHealthProfile,
    refetchHealth,
  }
}
