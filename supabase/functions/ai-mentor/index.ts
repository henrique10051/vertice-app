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

When giving advice, always reference the relevant methodology from these books. Keep responses practical, actionable, and in Portuguese. When health data is available, also consider the user's calorie and water intake, relating it to habit formation and discipline principles from the books.`

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
        content: `O usuário respondeu as seguintes perguntas da entrevista:\n${userAnswers.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\nCom base nessas respostas, crie um plano de crescimento personalizado. Responda APENAS com JSON válido no formato:\n{"type":"roadmap","content":"resumo do plano","habits":[{"title":"...","description":"...","frequency":"daily|weekly"}]}`,
      },
    ]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: promptMessages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    })

    if (!response.ok) return null
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return null

    try {
      const parsed = JSON.parse(content)
      if (parsed.type === 'roadmap' && Array.isArray(parsed.habits)) {
        return parsed as MentorResponse
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

  const promptMessages = [
    {
      role: 'system',
      content:
        SYSTEM_PROMPT +
        '\n\nYou are conducting a brief 5-question interview in Portuguese to create a personalized growth plan. Ask one question at a time. Also provide 3-5 suggested answer options as short phrases in Portuguese.',
    },
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
    return `Baseado em "Hábitos Atômicos" e seus dados de saúde:\n\n💧 Água hoje: ${(healthInfo.water_intake_ml / 1000).toFixed(1)}L de ${(healthInfo.water_goal_ml / 1000).toFixed(1)}L (${waterPct}%)\n🔥 Calorias: ${healthInfo.calories_consumed} / ${healthInfo.calorie_goal} kcal\n\n💡 Estratégias dos livros:\n• Empilhamento de Hábitos: "Depois de acordar, bebo um copo de água"\n• Regra dos 2 Minutos: comece com um gole, não o litro todo\n• Projete o ambiente: deixe uma garrafa visível na mesa\n• Identidade: "Eu sou alguém que se cuida"\n• "Você não alcança o nível dos seus objetivos, cai no nível dos seus sistemas"\n\n📊 ${waterPct >= 100 ? 'Meta de hidratação concluída! Mantenha o ritmo!' : 'Progresso consistente vence perfeição!'}`
  }

  if (
    msg.includes('poupar') ||
    msg.includes('econom') ||
    msg.includes('save') ||
    msg.includes('dinheiro')
  ) {
    return `Baseado em "O Homem Mais Rico da Babilônia" e no seu perfil financeiro:\n\n📊 Taxa de poupança atual: ${savingsRate}%. ${savingsRate > 20 ? 'Excelente!' : 'Há espaço para melhorar.'}\n\n🏛️ Lei de Ouro: "Pague a si mesmo primeiro" — reserve 10% de tudo que ganha antes de qualquer outra despesa.\n\n💡 Ações práticas:\n• Aplique a regra 50/30/20 (necessidades/desejos/poupança)\n• Automatize seus investimentos no início do mês\n• Faça seu dinheiro trabalhar por você (juros compostos)\n• Controle despesas: "viva com menos do que ganha"`
  }

  if (
    msg.includes('rotina') ||
    msg.includes('manhã') ||
    msg.includes('morning') ||
    msg.includes('habit')
  ) {
    return `Inspirado em "Hábitos Atômicos" (James Clear) e "O Poder do Hábito" (Charles Duhigg):\n\n🎯 ${totalHabits} hábitos ativos, ${completedToday} concluídos hoje.\n\n🔄 O Loop do Hábito: Gatilho → Rotina → Recompensa\n\n💡 Estratégias dos livros:\n• Regra dos 2 Minutos: comece pequeno (1 página, 1 agachamento)\n• Empilhamento de Hábitos: "Depois de [X], farei [Y]"\n• Identidade: "Eu sou alguém que..." em vez de "Eu quero..."\n• Melhore 1% por dia = 37x melhor em 1 ano`
  }

  if (msg.includes('objetivo') || msg.includes('meta') || msg.includes('goal')) {
    return `Baseado em "Hábitos Atômicos" e seus objetivos:\n\n🎯 ${activeGoals} objetivo(s) em progresso.\n\n💡 Princípios de James Clear:\n• Sistemas > Metas: foque no processo, não só no resultado\n• Divida metas em micro-passos diários (regra dos 2 min)\n• "Você não alcança o nível dos seus objetivos, cai no nível dos seus sistemas"\n\n📈 Progresso, não perfeição!`
  }

  if (msg.includes('prioritar') || msg.includes('priorit')) {
    return `Com base em "O Poder do Hábito" e seus dados:\n\n📈 Hábitos concluídos hoje: ${completedToday} de ${totalHabits}.\n\n🔑 Hábitos Keystone (Duhigg):\n• Identifique 1 hábito que catalisa outros (ex: exercício)\n• Priorize hábitos matinais — definem o tom do dia\n• Foque em UM novo hábito por vez\n\n⚡ Regra dos 2 Minutos (Clear): comece pela versão mais fácil do hábito.`
  }

  const healthStr = healthInfo ? `, ${waterPct}% da meta de água` : ''
  return `Olá! Sou seu mentor de crescimento, especialista em:\n\n📚 "Hábitos Atômicos" (James Clear) — sistemas e identidade\n📚 "O Poder do Hábito" (Charles Duhigg) — loop do hábito e hábitos âncora\n📚 "O Homem Mais Rico da Babilônia" (Clason) — finanças pessoais\n\nSeus dados: ${totalHabits} hábitos, ${activeGoals} objetivos ativos, taxa de poupança de ${savingsRate}%${healthStr}.\n\nPergunte sobre poupança, rotina, hábitos, saúde ou objetivos!`
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
