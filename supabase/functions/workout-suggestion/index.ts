import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface WorkoutSuggestionContext {
  recentSets: { exerciseName: string; weightKg: number; reps: number; date: string }[]
  muscleGroupsTrained: string[]
  activeGoals: string[]
  habitConsistencyRate: number
}

interface ProposedWorkoutHabit {
  title: string
  description: string
  frequency: string
  dayOfWeek: string
}

interface WorkoutSuggestion {
  summary: string
  habits: ProposedWorkoutHabit[]
}

const WEEKDAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

const SYSTEM_PROMPT = `You are a strength training coach embedded in Vértice, a personal growth app that also tracks habits, finances, and health.
You design a full weekly workout schedule and progressive overload plan based on the user's actual logged sets (weight, reps, exercise) and which muscle groups they already trained recently.

Rules:
- Suggest 3-5 workout sessions, each assigned to a specific day of the week (dayOfWeek) so the whole week is scheduled without overlapping muscle groups on consecutive days.
- dayOfWeek must be one of: Segunda, Terça, Quarta, Quinta, Sexta, Sábado, Domingo — spread sessions out and leave at least 1-2 rest days.
- Each session needs a "title" (e.g. "Treino de Pernas"), a "description" listing concrete exercises with sets x reps (e.g. "Agachamento Livre 4x8-10, Leg Press 3x12"), and "frequency" describing recurrence (e.g. "weekly").
- Use progressive overload: if the user's recent sets show a weight plateau or the exercise appears repeatedly at the same load, suggest a small increase (2.5-5kg) or a rep increase.
- Avoid scheduling a session for a muscle group trained in the last 2 days; prioritize recovery and balance.
- Respond in Portuguese.
- Respond ONLY with valid JSON: {"summary":"...","habits":[{"title":"...","description":"...","frequency":"weekly","dayOfWeek":"Segunda"}]}`

async function getOpenAISuggestion(
  context: WorkoutSuggestionContext,
): Promise<WorkoutSuggestion | null> {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) return null

  const setsSummary =
    context.recentSets.length > 0
      ? context.recentSets
          .map((s) => `${s.date}: ${s.exerciseName} — ${s.weightKg}kg x ${s.reps} reps`)
          .join('\n')
      : 'Nenhuma série registrada ainda.'

  const userContext = `Histórico recente de séries:\n${setsSummary}\n\nGrupos musculares treinados nos últimos 7 dias: ${context.muscleGroupsTrained.join(', ') || 'nenhum'}\nObjetivos ativos do usuário: ${context.activeGoals.join(', ') || 'nenhum'}\nTaxa de consistência de hábitos: ${context.habitConsistencyRate}%`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContext },
      ],
      temperature: 0.6,
      max_tokens: 800,
    }),
  })

  if (!response.ok) return null
  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) return null

  try {
    const parsed = JSON.parse(content)
    if (parsed.summary && Array.isArray(parsed.habits)) {
      return {
        summary: parsed.summary,
        habits: parsed.habits.map((h: any, i: number) => ({
          title: h.title || 'Treino',
          description: h.description || '',
          frequency: h.frequency || 'weekly',
          dayOfWeek: WEEKDAYS.includes(h.dayOfWeek) ? h.dayOfWeek : WEEKDAYS[i % WEEKDAYS.length],
        })),
      }
    }
  } catch {
    return null
  }
  return null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { context } = (await req.json()) as { context: WorkoutSuggestionContext }
    const suggestion = await getOpenAISuggestion(context)

    if (!suggestion) {
      return new Response(JSON.stringify({ error: 'AI unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    return new Response(JSON.stringify(suggestion), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
