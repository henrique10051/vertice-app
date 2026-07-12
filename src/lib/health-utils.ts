export type Gender = 'male' | 'female'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra'

export const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; multiplier: number }[] = [
  { value: 'sedentary', label: 'Sedentário', multiplier: 1.2 },
  { value: 'light', label: 'Levemente Ativo', multiplier: 1.375 },
  { value: 'moderate', label: 'Moderadamente Ativo', multiplier: 1.55 },
  { value: 'very', label: 'Muito Ativo', multiplier: 1.725 },
  { value: 'extra', label: 'Extremamente Ativo', multiplier: 1.9 },
]

export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return gender === 'male' ? base + 5 : base - 161
}

export function calculateDailyCalories(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
  activityLevel: ActivityLevel,
): number {
  const bmr = calculateBMR(weightKg, heightCm, age, gender)
  const multiplier = ACTIVITY_LEVELS.find((a) => a.value === activityLevel)?.multiplier ?? 1.2
  return Math.round(bmr * multiplier)
}

export function calculateWaterGoal(weightKg: number): number {
  return Math.round(weightKg * 35)
}
