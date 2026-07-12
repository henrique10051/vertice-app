import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface AIMentorContext {
  habits: { title: string; is_completed: boolean; frequency: string }[]
  transactions: { amount: number; type: 'income' | 'expense'; category: string }[]
  goals: { title: string; status: string; subtasks: { completed: boolean }[] }[]
  health?: {
    calories_consumed: number
    calorie_goal: number
    water_intake_ml: number
    water_goal_ml: number
  }
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ProposedHabit {
  title: string
  description: string
  frequency: string
  pomodoroSessions?: number
  pomodoroMinutes?: number
  breakMinutes?: number
}

interface MentorResponse {
  type: 'question' | 'roadmap'
  content: string
  habits?: ProposedHabit[]
  questionIndex?: number
  suggestedOptions?: string[]
}

const SYSTEM_PROMPT = `You are a personal growth mentor specialized in three foundational books:
1. "Atomic Habits" by James Clear — focus on identity-based habits, the habit loop (cue-craving-response-reward), the Two-Minute Rule, habit stacking, and the 1% improvement principle.
2. "The Power of Habit" by Charles Duhigg — focus on the habit loop (cue-routine-reward), keystone habits, and belief in change.
3. "The Richest Man in Babylon" by George S. Clason — focus on "pay yourself first" (save 10%), live below your means, make your money work for you, and the five laws of gold.

When giving advice, always reference the relevant methodology from these books. Keep responses practical, actionable, and in Portuguese.

IMPORTANT - Pomodoro Integration:
- Structure study routines using the Pomodoro Method (25 minutes study / 5 minutes break)
- For each study topic, specify the number of Pomodoro sessions (1-4 sessions)
- Include Pomodoro timing in habit descriptions (e.g., "25/5 min cycles, 2 sessions")
- The description field MUST contain specific Pomodoro instructions
- Create one habit per study topic with its own Pomodoro sessions

When health data is available, also consider the user's calorie and water intake, relating it to habit formation and discipline principles from the books.`

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

    habits.push({
      title: `Estudar ${topic} (${sessions}× Pomodoro)`,
      description: `Estude ${topic} usando o método Pomodoro: ${sessions} ciclos de 25 min de estudo focado + 5 min de pausa (25/5 min cycles). Baseado na Regra dos 2 Minutos de James Clear. Empilhamento de hábitos: "Depois do café, estudo ${topic}".`,
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
          'Resolva um exercício ou projeto. 2 ciclos de 25/5 min (Pomodoro). Empilhamento: "Depois do café, pratico código".',
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
          'Pratique vocabulário e conversação. 2 ciclos de 25/5 min (Pomodoro). Identity-based habits.',
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
          '2 ciclos de 25 min estudo + 5 min pausa (25/5 min cycles). Regra dos 2 Minutos de James Clear.',
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
        'Reserve 10% de tudo que ganha (Babilônia). Registre gastos. 1 ciclo de 25/5 min (Pomodoro).',
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
      'Movimento leve diário. Hábito keystone (Duhigg). Ideal entre sessões de Pomodoro.',
    frequency: 'daily',
  })

  habits.push({
    title: 'Reflexão Noturna (5 min)',
    description:
      'Anote 1 vitória do dia e 1 melhoria. Feche o loop: Gatilho → Rotina → Recompensa. Revise Pomodoros.',
    frequency: 'daily',
  })

  return {
    type: 'roadmap',
    content: `Baseado nas suas respostas, criei um plano personalizado com ${topics.length || habits.length} tópico(s) integrando o método Pomodoro (25/5 min). Inspirado em "Hábitos Atômicos", "O Poder do Hábito" e "O Homem Mais Rico da Babilônia". Foque em construir sistemas, usar hábitos âncora e melhorar 1% por dia.`,
    habits,
  }
}

function getInterviewResponse(messages: ChatMessage[], questionIndex: number): MentorResponse {
  const userMessages = messages.filter((m) => m.role === 'user')
  const currentIndex = questionIndex

  if (currentIndex < FALLBACK_QUESTIONS.length) {
    return {
      type: 'question',
      content: FALLBACK_QUESTIONS[currentIndex].content,
      suggestedOptions: FALLBACK_QUESTIONS[currentIndex].options,
      questionIndex: currentIndex + 1,
    }
  }

  return generateFallbackRoadmap(userMessages.map((m) => m.content))
}

async function getOpenAIInterviewResponse(
  messages: ChatMessage[],
  questionIndex: number,
): Promise<MentorResponse | null> {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) return null

  const userAnswers = messages.filter((m) => m.role === 'user').map((m) => m.content)
  const isLastQuestion = questionIndex >= FALLBACK_QUESTIONS.length

  if (isLastQuestion) {
    const promptMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `O usuário respondeu as seguintes perguntas da entrevista:\n${userAnswers.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\nCom base nessas respostas, crie um plano de crescimento personalizado integrando o método Pomodoro (25 min estudo / 5 min pausa). Para CADA tópico de estudo mencionado, crie um hábito separado com sessões de Pomodoro. A descrição de cada hábito deve incluir as instruções de Pomodoro (ex: "2 ciclos de 25/5 min"). Responda APENAS com JSON válido no formato:\n{"type":"roadmap","content":"resumo do plano","habits":[{"title":"...","description":"instruções com Pomodoro (ex: 25/5 min cycles, 2 sessions)","frequency":"daily|weekly","pomodoroSessions":2,"pomodoroMinutes":25,"breakMinutes":5}]}`,
      },
    ]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: promptMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) return null
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return null

    try {
      const parsed = JSON.parse(content)
      if (parsed.type === 'roadmap' && Array.isArray(parsed.habits)) {
        return {
          type: 'roadmap',
          content: parsed.content || 'Plano de crescimento personalizado com Pomodoro.',
          habits: parsed.habits.map((h: any) => ({
            title: h.title || 'Hábito',
            description: h.description || '',
            frequency: h.frequency || 'daily',
            pomodoroSessions: h.pomodoroSessions,
            pomodoroMinutes: h.pomodoroMinutes,
            breakMinutes: h.breakMinutes,
          })) as ProposedHabit[],
        }
      }
    } catch {
      return null
    }
    return null
  }

  const answersStr =
    userAnswers.length > 0
      ? userAnswers.map((a, i) => `${i + 1}. ${a}`).join('\n')
      : 'Nenhuma ainda (esta é a primeira pergunta)'

  const isFirstQuestion = questionIndex === 0

  const interviewInstructions = isFirstQuestion
    ? 'You are conducting a brief 5-question interview in Portuguese. The FIRST question must ask the user about ALL topics/subjects they want to study — encourage them to list multiple topics (e.g., "Inglês", "Medicina", "Programação"). Provide 4-6 suggested answer options as short phrases in Portuguese.'
    : 'You are conducting a brief 5-question interview in Portuguese to create a personalized growth plan with Pomodoro integration. Ask one question at a time. Also provide 3-5 suggested answer options as short phrases in Portuguese.'

  const promptMessages = [
    { role: 'system', content: SYSTEM_PROMPT + '\n\n' + interviewInstructions },
    {
      role: 'user',
      content: `Respostas anteriores:\n${answersStr}\n\nNúmero da pergunta: ${questionIndex + 1} de ${FALLBACK_QUESTIONS.length}\n\nResponda APENAS com JSON: {"type":"question","content":"sua pergunta em português","suggestedOptions":["opção1","opção2","opção3"],"questionIndex":${questionIndex + 1}}`,
    },
  ]

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: promptMessages,
      temperature: 0.7,
      max_tokens: 400,
    }),
  })

  if (!response.ok) return null
  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) return null

  try {
    const parsed = JSON.parse(content)
    if (parsed.type === 'question' && parsed.content) {
      return {
        type: 'question',
        content: parsed.content,
        suggestedOptions: Array.isArray(parsed.suggestedOptions)
          ? parsed.suggestedOptions
          : FALLBACK_QUESTIONS[questionIndex]?.options || [],
        questionIndex: questionIndex + 1,
      } as MentorResponse
    }
  } catch {
    return null
  }
  return null
}

function generateInsight(message: string, context: AIMentorContext): string {
  const msg = message.toLowerCase()

  const totalHabits = context.habits.length
  const completedToday = context.habits.filter((h) => h.is_completed).length
  const income = context.transactions
    .filter((t) => t.type === 'income')
    .reduce((a, b) => a + b.amount, 0)
  const expense = context.transactions
    .filter((t) => t.type === 'expense')
    .reduce((a, b) => a + b.amount, 0)
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0
  const activeGoals = context.goals.filter((g) => g.status === 'Em Progresso').length
  const healthInfo = context.health
  const waterPct =
    healthInfo && healthInfo.water_goal_ml > 0
      ? Math.round((healthInfo.water_intake_ml / healthInfo.water_goal_ml) * 100)
      : 0

  if (
    healthInfo &&
    (msg.includes('água') ||
      msg.includes('water') ||
      msg.includes('hidrat') ||
      msg.includes('caloria') ||
      msg.includes('calor') ||
      msg.includes('dieta') ||
      msg.includes('alimentação') ||
      msg.includes('saúde'))
  ) {
    return `Baseado em "Hábitos Atômicos" e seus dados de saúde:\n\n💧 Água hoje: ${(healthInfo.water_intake_ml / 1000).toFixed(1)}L de ${(healthInfo.water_goal_ml / 1000).toFixed(1)}L (${waterPct}%)\n🔥 Calorias: ${healthInfo.calories_consumed} / ${healthInfo.calorie_goal} kcal\n\n💡 Estratégias dos livros + Pomodoro:\n• Empilhamento: "Depois de acordar, bebo um copo de água"\n• Regra dos 2 Minutos: comece com um gole\n• Projete o ambiente: garrafa visível na mesa\n• Use Pomodoro para refeições conscientes (25 min sem tela)\n• Identidade: "Eu sou alguém que se cuida"\n\n📊 ${waterPct >= 100 ? 'Meta de hidratação concluída!' : 'Progresso consistente vence perfeição!'}`
  }

  if (
    msg.includes('poupar') ||
    msg.includes('econom') ||
    msg.includes('save') ||
    msg.includes('dinheiro')
  ) {
    return `Baseado em "O Homem Mais Rico da Babilônia" e seu perfil:\n\n📊 Taxa de poupança: ${savingsRate}%. ${savingsRate > 20 ? 'Excelente!' : 'Há espaço para melhorar.'}\n\n🏛️ "Pague a si mesmo primeiro" — reserve 10% antes de qualquer despesa.\n\n💡 Ações:\n• Regra 50/30/20 (necessidades/desejos/poupança)\n• Automatize investimentos no início do mês\n• Juros compostos: faça seu dinheiro trabalhar\n• Controle despesas: "viva com menos do que ganha"`
  }

  if (
    msg.includes('rotina') ||
    msg.includes('manhã') ||
    msg.includes('morning') ||
    msg.includes('habit') ||
    msg.includes('pomodoro') ||
    msg.includes('pomodore')
  ) {
    return `Inspirado em "Hábitos Atômicos" e "O Poder do Hábito":\n\n🎯 ${totalHabits} hábitos ativos, ${completedToday} concluídos hoje.\n\n🍅 Método Pomodoro:\n• 25 min de foco + 5 min de pausa\n• 4 ciclos = 1 sessão completa (descanso longo de 15-30 min)\n• Ideal para cada tópico de estudo\n\n🔄 Loop do Hábito: Gatilho → Rotina → Recompensa\n\n💡 Estratégias:\n• Regra dos 2 Minutos: comece pequeno\n• Empilhamento: "Depois de [X], faço [Y]"\n• Identidade: "Eu sou alguém que..." vs "Eu quero..."\n• Melhore 1% por dia = 37x melhor em 1 ano`
  }

  if (msg.includes('objetivo') || msg.includes('meta') || msg.includes('goal')) {
    return `Baseado em "Hábitos Atômicos" e seus objetivos:\n\n🎯 ${activeGoals} objetivo(s) em progresso.\n\n💡 Princípios de James Clear:\n• Sistemas > Metas: foque no processo\n• Divida metas em micro-passos diários (regra dos 2 min)\n• Use Pomodoro para cada micro-passo (25/5 min)\n• "Você não alcança o nível dos seus objetivos, cai no nível dos seus sistemas"\n\n📈 Progresso, não perfeição!`
  }

  if (msg.includes('prioritar') || msg.includes('priorit')) {
    return `Com base em "O Poder do Hábito" e seus dados:\n\n📈 Hábitos concluídos hoje: ${completedToday} de ${totalHabits}.\n\n🔑 Hábitos Keystone (Duhigg):\n• Identifique 1 hábito que catalisa outros\n• Priorize hábitos matinais — definem o tom do dia\n• Foque em UM novo hábito por vez\n• Use Pomodoro: 25 min de foco total no hábito prioritário\n\n⚡ Regra dos 2 Minutos (Clear): comece pela versão mais fácil.`
  }

  const healthStr = healthInfo ? `, ${waterPct}% da meta de água` : ''
  return `Olá! Sou seu mentor de crescimento, especialista em:\n\n📚 "Hábitos Atômicos" (James Clear) — sistemas e identidade\n📚 "O Poder do Hábito" (Charles Duhigg) — loop do hábito e hábitos âncora\n📚 "O Homem Mais Rico da Babilônia" (Clason) — finanças pessoais\n🍅 Método Pomodoro — 25 min foco / 5 min pausa\n\nSeus dados: ${totalHabits} hábitos, ${activeGoals} objetivos ativos, taxa de poupança de ${savingsRate}%${healthStr}.\n\nPergunte sobre poupança, rotina, hábitos, Pomodoro, saúde ou objetivos!`
}

async function getOpenAIResponse(
  message: string,
  context: AIMentorContext,
): Promise<string | null> {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) return null

  const totalHabits = context.habits.length
  const completedToday = context.habits.filter((h) => h.is_completed).length
  const income = context.transactions
    .filter((t) => t.type === 'income')
    .reduce((a, b) => a + b.amount, 0)
  const expense = context.transactions
    .filter((t) => t.type === 'expense')
    .reduce((a, b) => a + b.amount, 0)
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0
  const activeGoals = context.goals.filter((g) => g.status === 'Em Progresso').length

  const healthStr = context.health
    ? `\n- Água: ${(context.health.water_intake_ml / 1000).toFixed(1)}L / ${(context.health.water_goal_ml / 1000).toFixed(1)}L\n- Calorias: ${context.health.calories_consumed} / ${context.health.calorie_goal} kcal`
    : ''
  const userContext = `Dados do usuário:\n- Hábitos: ${totalHabits} total, ${completedToday} concluídos hoje\n- Renda: R$ ${income}, Despesas: R$ ${expense}, Taxa de poupança: ${savingsRate}%\n- Objetivos ativos: ${activeGoals}${healthStr}\n\nPergunta: ${message}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContext },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  })

  if (!response.ok) return null
  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    if (body.mode === 'interview') {
      const { messages, questionIndex } = body as {
        messages: ChatMessage[]
        questionIndex: number
      }

      const aiResponse = await getOpenAIInterviewResponse(messages, questionIndex)
      const response = aiResponse ?? getInterviewResponse(messages, questionIndex)

      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const { message, context } = body as { message: string; context: AIMentorContext }

    const aiResponse = await getOpenAIResponse(message, context)
    const response = aiResponse ?? generateInsight(message, context)

    return new Response(JSON.stringify({ response }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
