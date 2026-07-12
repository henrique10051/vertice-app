import { supabase } from '@/lib/supabase/client'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ProposedHabit {
  title: string
  description: string
  frequency: string
  pomodoroSessions?: number
  pomodoroMinutes?: number
  breakMinutes?: number
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
      'Olá! Sou seu Mentor de Crescimento Pessoal. Quais tópicos você quer estudar ou desenvolver? Você pode selecionar vários e também adicionar novos!',
    options: ['Programação', 'Idiomas', 'Liderança', 'Finanças', 'Saúde e Fitness', 'Medicina'],
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
      'Muito útil! Você prefere estudar/praticar de manhã, à tarde ou à noite? Isso me ajuda a sugerir a melhor rotina com Pomodoro.',
    options: ['Manhã', 'Tarde', 'Noite', 'Horários variados'],
  },
]

function parseTopics(answer: string): string[] {
  return answer
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}

function generateFallbackRoadmap(answers: string[]): MentorResponse {
  const topicsAnswer = answers[0] || ''
  const combined = answers.join(' ').toLowerCase()
  const topics = parseTopics(topicsAnswer)

  const habits: ProposedHabit[] = []

  topics.forEach((topic) => {
    const topicLower = topic.toLowerCase()
    let sessions = 2
    if (
      topicLower.includes('medic') ||
      topicLower.includes('anatom') ||
      topicLower.includes('biolog')
    ) {
      sessions = 3
    }
    if (
      topicLower.includes('program') ||
      topicLower.includes('código') ||
      topicLower.includes('tech')
    ) {
      sessions = 2
    }
    if (
      topicLower.includes('idiom') ||
      topicLower.includes('inglês') ||
      topicLower.includes('english')
    ) {
      sessions = 2
    }

    habits.push({
      title: `Estudar ${topic} (${sessions}× Pomodoro)`,
      description: `Estude ${topic} usando o método Pomodoro: ${sessions} ciclos de 25 min de estudo focado + 5 min de pausa (25/5 min cycles). Baseado na Regra dos 2 Minutos de James Clear para iniciar e no loop de hábitos de Duhigg. Empilhamento de hábitos: "Depois do café, estudo ${topic}".`,
      frequency: 'daily',
      pomodoroSessions: sessions,
      pomodoroMinutes: 25,
      breakMinutes: 5,
    })
  })

  if (habits.length === 0) {
    if (combined.includes('program') || combined.includes('código') || combined.includes('tech')) {
      habits.push({
        title: 'Prática de Código (2× Pomodoro)',
        description:
          'Resolva um exercício ou construa um pequeno projeto. 2 ciclos de 25/5 min (Pomodoro). Empilhamento de hábitos: "Depois do café, pratico código".',
        frequency: 'daily',
        pomodoroSessions: 2,
        pomodoroMinutes: 25,
        breakMinutes: 5,
      })
    }
    if (combined.includes('idiom') || combined.includes('inglês') || combined.includes('english')) {
      habits.push({
        title: 'Estudo de Idioma (2× Pomodoro)',
        description:
          'Pratique vocabulário e conversação. 2 ciclos de 25/5 min (Pomodoro). "Eu sou alguém que fala outro idioma" — identity-based habits.',
        frequency: 'daily',
        pomodoroSessions: 2,
        pomodoroMinutes: 25,
        breakMinutes: 5,
      })
    }
    if (habits.length === 0) {
      habits.push({
        title: 'Estudo Focado (2× Pomodoro)',
        description:
          'Use a técnica Pomodoro: 2 ciclos de 25 min de estudo focado + 5 min de pausa (25/5 min cycles). Baseado na Regra dos 2 Minutos de James Clear.',
        frequency: 'daily',
        pomodoroSessions: 2,
        pomodoroMinutes: 25,
        breakMinutes: 5,
      })
    }
  }

  if (combined.includes('financ') || combined.includes('dinheiro') || combined.includes('econom')) {
    habits.push({
      title: 'Revisão Financeira Semanal',
      description:
        'Reserve 10% de tudo que ganha (O Homem Mais Rico da Babilônia). Registre gastos e revise investimentos. 1 ciclo de 25/5 min (Pomodoro).',
      frequency: 'weekly',
      pomodoroSessions: 1,
      pomodoroMinutes: 25,
      breakMinutes: 5,
    })
  }

  habits.push({
    title: 'Planejamento Diário (10 min)',
    description:
      'Liste 3 prioridades do dia e organize os blocos de Pomodoro. Sistemas > Metas (James Clear).',
    frequency: 'daily',
  })

  habits.push({
    title: 'Caminhada (20 min)',
    description:
      'Movimento leve diário. Hábito keystone que melhora foco e disciplina (Charles Duhigg). Ideal entre sessões de Pomodoro.',
    frequency: 'daily',
  })

  habits.push({
    title: 'Reflexão Noturna (5 min)',
    description:
      'Anote 1 vitória do dia e 1 melhoria. Feche o loop: Gatilho → Rotina → Recompensa. Revise os Pomodoros completados.',
    frequency: 'daily',
  })

  return {
    type: 'roadmap',
    content: `Baseado nas suas respostas, criei um plano personalizado com ${topics.length || habits.length} tópico(s) de estudo integrando o método Pomodoro (25/5 min). Inspirado em "Hábitos Atômicos", "O Poder do Hábito" e "O Homem Mais Rico da Babilônia". O plano foca em construir sistemas, usar hábitos âncora e melhorar 1% por dia.`,
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
