import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

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
}

const INTERVIEW_QUESTIONS = [
  'Olá! Sou seu Mentor de Crescimento Pessoal. Vou conduzir uma breve entrevista para montar um plano personalizado para você. Primeiro: O que você quer estudar ou desenvolver? (ex: programação, idiomas, liderança, finanças)',
  'Excelente! Quanto tempo você pode dedicar por dia a esses objetivos? (ex: 30 minutos, 1 hora, 2 horas)',
  'Ótimo! Quais habilidades específicas você quer melhorar? (ex: concentração, disciplina, comunicação, organização financeira)',
  'Perfeito! Qual é seu maior desafio atual em relação a esses objetivos? (ex: falta de rotina, procrastinação, gestão de tempo)',
  'Muito útil! Você prefere estudar/praticar de manhã, à tarde ou à noite? Isso me ajuda a sugerir a melhor rotina.',
]

const SYSTEM_PROMPT = `You are a personal growth mentor conducting a mini-interview to create a personalized study roadmap. You follow the principles of "Atomic Habits" (James Clear), "The Power of Habit" (Charles Duhigg), and "The Richest Man in Babylon" (George S. Clason).

Your job:
1. Ask 3-5 targeted questions one at a time to understand the user's goals, study interests, time availability, and areas for improvement.
2. After gathering enough information, generate a "Growth Roadmap" with 4-6 specific habits.

Each habit must have: title (string), description (string), frequency (string like "daily", "weekly", "3x per week").

Respond in Portuguese. Be encouraging and practical. Reference book principles when relevant.

When you have enough information, respond with a JSON object containing:
{
  "type": "roadmap",
  "content": "Summary of the plan",
  "habits": [{ "title": "...", "description": "...", "frequency": "..." }]
}

Until then, respond with:
{
  "type": "question",
  "content": "Your next question"
}`

function generateRoadmap(answers: string[]): { content: string; habits: ProposedHabit[] } {
  const combined = answers.join(' ').toLowerCase()

  const habits: ProposedHabit[] = []

  habits.push({
    title: 'Estudo Focado (25 min)',
    description:
      'Use a técnica Pomodoro: 25 min de estudo focado seguido de 5 min de pausa. Baseado na Regra dos 2 Minutos de James Clear — comece pequeno e expanda.',
    frequency: 'daily',
  })

  if (combined.includes('program') || combined.includes('código') || combined.includes('tech')) {
    habits.push({
      title: 'Prática de Código (30 min)',
      description:
        'Resolva um exercício ou construa um pequeno projeto diariamente. O empilhamento de hábitos: "Depois do café, pratico código por 30 min".',
      frequency: 'daily',
    })
  }

  if (
    combined.includes('idiom') ||
    combined.includes('inglês') ||
    combined.includes('english') ||
    combined.includes('espanhol')
  ) {
    habits.push({
      title: 'Estudo de Idioma (20 min)',
      description:
        'Pratique vocabulário e conversação. Use apps como Duolingo ou Anki. "Eu sou alguém que fala outro idioma" — identidade-based habits.',
      frequency: 'daily',
    })
  }

  if (
    combined.includes('financ') ||
    combined.includes('dinheiro') ||
    combined.includes('econom') ||
    combined.includes('invest')
  ) {
    habits.push({
      title: 'Revisão Financeira Semanal',
      description:
        'Reserve 10% de tudo que ganha (O Homem Mais Rico da Babilônia). Registre gastos e revise investimentos toda semana.',
      frequency: 'weekly',
    })
  }

  if (combined.includes('manhã') || combined.includes('manha') || combined.includes('acordar')) {
    habits.push({
      title: 'Rotina Matinal (15 min)',
      description:
        'Acorde e faça: água + leitura + planejamento do dia. Hábito âncora que define o tom do dia inteiro.',
      frequency: 'daily',
    })
  } else {
    habits.push({
      title: 'Planejamento Diário (10 min)',
      description:
        'No início do período escolhido, liste 3 prioridades do dia. Sistemas > Metas (James Clear).',
      frequency: 'daily',
    })
  }

  if (
    combined.includes('exercício') ||
    combined.includes('exercicio') ||
    combined.includes('saúde') ||
    combined.includes('saude') ||
    combined.includes('físico')
  ) {
    habits.push({
      title: 'Exercício Físico (30 min)',
      description:
        'Movimento diário — caminhada, musculação ou yoga. Hábito keystone que catalisa outras mudanças (Charles Duhigg).',
      frequency: '3x per week',
    })
  } else {
    habits.push({
      title: 'Caminhada (20 min)',
      description:
        'Movimento leve diário para clarear a mente. Hábito keystone que melhora foco e disciplina.',
      frequency: 'daily',
    })
  }

  habits.push({
    title: 'Reflexão Noturna (5 min)',
    description:
      'Antes de dormir, anote 1 vitória do dia e 1 melhoria para amanhã. Feche o loop do hábito: Gatilho → Rotina → Recompensa.',
    frequency: 'daily',
  })

  const content = `Baseado nas suas respostas, criei um plano de crescimento personalizado inspirado em "Hábitos Atômicos", "O Poder do Hábito" e "O Homem Mais Rico da Babilônia".\n\nO plano foca em construir sistemas (não apenas metas), usar hábitos âncora e melhorar 1% por dia. Comece com a Regra dos 2 Minutos e vá expandindo gradualmente.`

  return { content, habits }
}

async function getOpenAIResponse(
  messages: ChatMessage[],
  questionIndex: number,
): Promise<MentorResponse | null> {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) return null

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) return null
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return null

    const parsed = JSON.parse(content)
    if (parsed.type === 'roadmap' && Array.isArray(parsed.habits)) {
      return {
        type: 'roadmap',
        content: parsed.content,
        habits: parsed.habits.slice(0, 8).map((h: any) => ({
          title: String(h.title || ''),
          description: String(h.description || ''),
          frequency: String(h.frequency || 'daily'),
        })),
      }
    }
    return {
      type: 'question',
      content: parsed.content || INTERVIEW_QUESTIONS[questionIndex] || 'Pode me dizer mais?',
      questionIndex: questionIndex + 1,
    }
  } catch {
    return null
  }
}

function getScriptedResponse(messages: ChatMessage[]): MentorResponse {
  const userMessages = messages.filter((m) => m.role === 'user')
  const questionIndex = userMessages.length

  if (questionIndex < INTERVIEW_QUESTIONS.length) {
    return {
      type: 'question',
      content: INTERVIEW_QUESTIONS[questionIndex],
      questionIndex: questionIndex + 1,
    }
  }

  const answers = userMessages.map((m) => m.content)
  const { content, habits } = generateRoadmap(answers)

  return {
    type: 'roadmap',
    content,
    habits,
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, questionIndex } = (await req.json()) as {
      messages: ChatMessage[]
      questionIndex?: number
    }

    const qIndex = questionIndex ?? messages.filter((m) => m.role === 'user').length

    const aiResponse = await getOpenAIResponse(messages, qIndex)
    const response = aiResponse ?? getScriptedResponse(messages)

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch {
    return new Response(
      JSON.stringify({
        type: 'question',
        content: 'Desculpe, houve um erro. Pode repetir?',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    )
  }
})
