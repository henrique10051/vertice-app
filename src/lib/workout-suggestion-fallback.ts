export const WEEKDAYS = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo',
] as const

export interface ProposedWorkoutHabit {
  title: string
  description: string
  frequency: string
  dayOfWeek: string
}

export interface WorkoutSuggestion {
  summary: string
  habits: ProposedWorkoutHabit[]
}

export interface WorkoutSuggestionContext {
  recentSets: { exerciseName: string; weightKg: number; reps: number; date: string }[]
  muscleGroupsTrained: string[]
  activeGoals: string[]
  habitConsistencyRate: number
}

const SPLITS: Record<string, Omit<ProposedWorkoutHabit, 'dayOfWeek'>[]> = {
  default: [
    {
      title: 'Treino de Peito e Tríceps',
      description: 'Supino Reto 4x8-10, Supino Inclinado 3x10-12, Tríceps Corda 3x12-15.',
      frequency: 'weekly',
    },
    {
      title: 'Treino de Costas e Bíceps',
      description: 'Puxada Alta 4x8-10, Remada Curvada 3x10-12, Rosca Direta 3x12-15.',
      frequency: 'weekly',
    },
    {
      title: 'Treino de Pernas',
      description: 'Agachamento Livre 4x8-10, Leg Press 3x12, Levantamento Terra 3x6-8.',
      frequency: 'weekly',
    },
    {
      title: 'Treino de Ombro e Core',
      description:
        'Desenvolvimento Militar 4x8-10, Elevação Lateral 3x12-15, Abdominal Supra 3x15-20.',
      frequency: 'weekly',
    },
  ],
}

const DEFAULT_DAYS = ['Segunda', 'Quarta', 'Sexta', 'Sábado']

/** Rule-based fallback used when the AI edge function is unavailable. */
export function generateFallbackWorkoutSuggestion(
  ctx: WorkoutSuggestionContext,
): WorkoutSuggestion {
  const trained = new Set(ctx.muscleGroupsTrained.map((m) => m.toLowerCase()))
  const filtered = SPLITS.default.filter((h) => {
    if (trained.size === 0) return true
    const key = h.title.toLowerCase()
    return !(
      (key.includes('peito') && trained.has('peito')) ||
      (key.includes('costas') && trained.has('costas')) ||
      (key.includes('perna') && trained.has('pernas')) ||
      (key.includes('ombro') && trained.has('ombro'))
    )
  })

  const base = filtered.length > 0 ? filtered : SPLITS.default
  const habits = base.map((h, i) => ({ ...h, dayOfWeek: DEFAULT_DAYS[i % DEFAULT_DAYS.length] }))

  return {
    summary:
      trained.size > 0
        ? `Você já treinou ${[...trained].join(', ')} nos últimos dias. Sugiro focar nos grupos musculares restantes para manter o equilíbrio semanal.`
        : 'Comece com uma divisão clássica de 4 dias para trabalhar todos os grupos musculares na semana.',
    habits,
  }
}
