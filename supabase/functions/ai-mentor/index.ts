import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface AIMentorContext {
  habits: { title: string; is_completed: boolean; frequency: string }[]
  transactions: { amount: number; type: 'income' | 'expense'; category: string }[]
  goals: { title: string; status: string; subtasks: { completed: boolean }[] }[]
}

const SYSTEM_PROMPT = `You are a personal growth mentor specialized in three foundational books:
1. "Atomic Habits" by James Clear — focus on identity-based habits, the habit loop (cue-craving-response-reward), the Two-Minute Rule, habit stacking, and the 1% improvement principle.
2. "The Power of Habit" by Charles Duhigg — focus on the habit loop (cue-routine-reward), keystone habits, and belief in change.
3. "The Richest Man in Babylon" by George S. Clason — focus on "pay yourself first" (save 10%), live below your means, make your money work for you, and the five laws of gold.

When giving advice, always reference the relevant methodology from these books. Keep responses practical, actionable, and in Portuguese.`

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

  if (
    msg.includes('poupar') ||
    msg.includes('econom') ||
    msg.includes('save') ||
    msg.includes('dinheiro')
  ) {
    return `Baseado em "O Homem Mais Rico da Babilônia" e no seu perfil financeiro:\n\n📊 Taxa de poupança atual: ${savingsRate}%. ${savingsRate > 20 ? 'Excelente!' : 'Há espaço para melhorar.'}\n\n🏛️ Lei de Ouro: "Pague a si mesmo primeiro" — reserve 10% de tudo que ganha antes de qualquer outra despesa.\n\n💡 Ações práticas:\n• Aplique a regra 50/30/20 (necessidades/desejos/poupança)\n• Automatize seus investimentos no início do mês\n• Faça seu dinheiro trabalhar por você (juros compostos)\n• Controle despesas: "viva com menos do que ganha"\n• Invista em oportunidades que conhece bem`
  }

  if (
    msg.includes('rotina') ||
    msg.includes('manhã') ||
    msg.includes('morning') ||
    msg.includes('habit')
  ) {
    return `Inspirado em "Hábitos Atômicos" (James Clear) e "O Poder do Hábito" (Charles Duhigg):\n\n🎯 ${totalHabits} hábitos ativos, ${completedToday} concluídos hoje.\n\n🔄 O Loop do Hábito: Gatilho → Rotina → Recompensa\n\n💡 Estratégias dos livros:\n• Regra dos 2 Minutos: comece pequeno (1 página, 1 agachamento)\n• Empilhamento de Hábitos: "Depois de [X], farei [Y]"\n• Identidade: "Eu sou alguém que..." em vez de "Eu quero..."\n• Hábitos âncora: escolha 1 hábito que transforma outros (keystone habit)\n• Melhore 1% por dia = 37x melhor em 1 ano\n• Projete seu ambiente para facilitar bons hábitos`
  }

  if (msg.includes('objetivo') || msg.includes('meta') || msg.includes('goal')) {
    return `Baseado em "Hábitos Atômicos" e seus objetivos:\n\n🎯 ${activeGoals} objetivo(s) em progresso.\n\n💡 Princípios de James Clear:\n• Sistemas > Metas: foque no processo, não só no resultado\n• Divida metas em micro-passos diários (regra dos 2 min)\n• Crie um sistema de marcos intermediários\n• Conecte cada hábito a um objetivo de identidade\n• "Você não alcança o nível dos seus objetivos, cai no nível dos seus sistemas"\n\n📈 Progresso, não perfeição!`
  }

  if (msg.includes('priorizar') || msg.includes('priorit')) {
    return `Com base em "O Poder do Hábito" e seus dados:\n\n📈 Hábitos concluídos hoje: ${completedToday} de ${totalHabits}.\n\n🔑 Hábitos Keystone (Duhigg):\n• Identifique 1 hábito que catalisa outros (ex: exercício)\n• Priorize hábitos matinais — definem o tom do dia\n• Foque em UM novo hábito por vez\n• Use a "cadeia" de hábitos: encadeie comportamentos\n\n⚡ Regra dos 2 Minutos (Clear): comece pela versão mais fácil do hábito.`
  }

  return `Olá! Sou seu mentor de crescimento, especialista em:\n\n📚 "Hábitos Atômicos" (James Clear) — sistemas e identidade\n📚 "O Poder do Hábito" (Charles Duhigg) — loop do hábito e hábitos âncora\n📚 "O Homem Mais Rico da Babilônia" (Clason) — finanças pessoais\n\nSeus dados: ${totalHabits} hábitos, ${activeGoals} objetivos ativos, taxa de poupança de ${savingsRate}%.\n\nPergunte sobre poupança, rotina, hábitos ou objetivos!`
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

  const userContext = `Dados do usuário:\n- Hábitos: ${totalHabits} total, ${completedToday} concluídos hoje\n- Renda: R$ ${income}, Despesas: R$ ${expense}, Taxa de poupança: ${savingsRate}%\n- Objetivos ativos: ${activeGoals}\n\nPergunta: ${message}`

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
    const { message, context } = (await req.json()) as { message: string; context: AIMentorContext }

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
