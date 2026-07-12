import { supabase } from '@/lib/supabase/client'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ProposedHabit {
  title: string
  description: string
  frequency: string
}

export interface MentorResponse {
  type: 'question' | 'roadmap'
  content: string
  habits?: ProposedHabit[]
  questionIndex?: number
  suggestedOptions?: string[]
}

const FALLBACK_QUESTIONS: { content: string; options: string[] }[] = [
  {
    content:
      'Olá! Sou seu Mentor de Crescimento Pessoal. Primeiro: O que você quer estudar ou desenvolver?',
    options: ['Programação', 'Idiomas', 'Liderança', 'Finanças', 'Saúde e Fitness'],
  },
  {
    content: 'Excelente! Quanto tempo você pode dedicar por dia a esses objetivos?',
    options: ['30 minutos', '1 hora', '2 horas', 'Mais de 2 horas'],
  },
  {
    content: 'Ótimo! Quais habilidades específicas você quer melhorar?',
    options: [
      'Concentração',
      'Disciplina',
      'Comunicação',
      'Organização financeira',
      'Gestão de tempo',
    ],
  },
  {
    content: 'Perfeito! Qual é seu maior desafio atual em relação a esses objetivos?',
    options: [
      'Falta de rotina',
      'Procrastinação',
      'Gestão de tempo',
      'Falta de motivação',
      'Distrações',
    ],
  },
  {
    content:
      'Muito útil! Você prefere estudar/praticar de manhã, à tarde ou à noite? Isso me ajuda a sugerir a melhor rotina.',
    options: ['Manhã', 'Tarde', 'Noite', 'Horários variados'],
  },
]

function generateFallbackRoadmap(answers: string[]): MentorResponse {
  const combined = answers.join(' ').toLowerCase()
  const habits: ProposedHabit[] = [
    {
      title: 'Estudo Focado (25 min)',
      description:
        'Use a técnica Pomodoro: 25 min de estudo focado seguido de 5 min de pausa. Baseado na Regra dos 2 Minutos de James Clear.',
      frequency: 'daily',
    },
  ]

  if (combined.includes('program') || combined.includes('código') || combined.includes('tech')) {
    habits.push({
      title: 'Prática de Código (30 min)',
      description:
        'Resolva um exercício ou construa um pequeno projeto diariamente. Empilhamento de hábitos: "Depois do café, pratico código".',
      frequency: 'daily',
    })
  }

  if (combined.includes('idiom') || combined.includes('inglês') || combined.includes('english')) {
    habits.push({
      title: 'Estudo de Idioma (20 min)',
      description:
        'Pratique vocabulário e conversação. "Eu sou alguém que fala outro idioma" — identidade-based habits.',
      frequency: 'daily',
    })
  }

  if (combined.includes('financ') || combined.includes('dinheiro') || combined.includes('econom')) {
    habits.push({
      title: 'Revisão Financeira Semanal',
      description:
        'Reserve 10% de tudo que ganha (O Homem Mais Rico da Babilônia). Registre gastos e revise investimentos.',
      frequency: 'weekly',
    })
  }

  habits.push({
    title: 'Planejamento Diário (10 min)',
    description: 'Liste 3 prioridades do dia. Sistemas > Metas (James Clear).',
    frequency: 'daily',
  })

  habits.push({
    title: 'Caminhada (20 min)',
    description:
      'Movimento leve diário. Hábito keystone que melhora foco e disciplina (Charles Duhigg).',
    frequency: 'daily',
  })

  habits.push({
    title: 'Reflexão Noturna (5 min)',
    description:
      'Anote 1 vitória do dia e 1 melhoria. Feche o loop: Gatilho → Rotina → Recompensa.',
    frequency: 'daily',
  })

  return {
    type: 'roadmap',
    content:
      'Baseado nas suas respostas, criei um plano personalizado inspirado em "Hábitos Atômicos", "O Poder do Hábito" e "O Homem Mais Rico da Babilônia". O plano foca em construir sistemas, usar hábitos âncora e melhorar 1% por dia.',
    habits,
  }
}

export function getFallbackResponse(messages: ChatMessage[]): MentorResponse {
  const userMessages = messages.filter((m) => m.role === 'user')
  const questionIndex = userMessages.length

  if (questionIndex < FALLBACK_QUESTIONS.length) {
    return {
      type: 'question',
      content: FALLBACK_QUESTIONS[questionIndex].content,
      suggestedOptions: FALLBACK_QUESTIONS[questionIndex].options,
      questionIndex: questionIndex + 1,
    }
  }

  return generateFallbackRoadmap(userMessages.map((m) => m.content))
}

export async function sendMentorMessage(
  messages: ChatMessage[],
  questionIndex: number,
): Promise<MentorResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-mentor', {
      body: { mode: 'interview', messages, questionIndex },
    })

    if (error || !data) {
      return getFallbackResponse(messages)
    }

    const resp = data as MentorResponse

    if (resp.type === 'question' && !resp.suggestedOptions) {
      const fallbackQ = FALLBACK_QUESTIONS[questionIndex]
      if (fallbackQ) {
        resp.suggestedOptions = fallbackQ.options
      }
    }

    return resp
  } catch {
    return getFallbackResponse(messages)
  }
}

export async function createHabitsFromRoadmap(
  userId: string,
  habits: ProposedHabit[],
): Promise<{ success: boolean; error: string | null }> {
  try {
    const rows = habits.map((h) => ({
      user_id: userId,
      title: h.title,
      description: h.description,
      frequency: h.frequency,
      is_completed: false,
    }))

    const { error } = await supabase.from('habits').insert(rows)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro desconhecido' }
  }
}
