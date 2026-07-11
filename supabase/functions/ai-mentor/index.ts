import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface AIMentorContext {
  habits: { title: string; is_completed: boolean; frequency: string }[]
  transactions: { amount: number; type: 'income' | 'expense'; category: string }[]
  goals: { title: string; status: string; subtasks: { completed: boolean }[] }[]
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

  if (
    msg.includes('poupar') ||
    msg.includes('econom') ||
    msg.includes('save') ||
    msg.includes('dinheiro')
  ) {
    return `Baseado no seu perfil financeiro:\n\n📊 Taxa de poupança atual: ${savingsRate}%. ${savingsRate > 20 ? 'Excelente trabalho!' : 'Há espaço para melhorar.'}\n\n💡 Sugestões:\n• Revise gastos em categorias não essenciais\n• Aplique a regra 50/30/20 (necessidades/desejos/poupança)\n• Automatize investimentos no início do mês\n• Mantenha o foco no seu "Fundo de Emergência"!`
  }

  if (
    msg.includes('rotina') ||
    msg.includes('manhã') ||
    msg.includes('morning') ||
    msg.includes('habit')
  ) {
    return `Analisando seus hábitos:\n\n🎯 ${totalHabits} hábitos ativos, ${completedToday} concluídos hoje.\n\n💡 Para melhorar sua rotina:\n• Comece com o hábito mais fácil pela manhã\n• Encadeie: "Depois de [X], farei [Y]"\n• Beber água e ler são ótimos pontos matinais\n• Consistência > intensidade`
  }

  if (msg.includes('objetivo') || msg.includes('meta') || msg.includes('goal')) {
    return `Seus objetivos:\n\n🎯 ${activeGoals} objetivo(s) em progresso.\n\n💡 Estratégias:\n• Divida metas em micro-passos semanais\n• Estabeleça prazos intermediários\n• Conecte hábitos diários aos objetivos\n• Celebre cada conquista!\n\nProgresso, não perfeição!`
  }

  if (msg.includes('priorizar') || msg.includes('priorit')) {
    return `Com base nos seus dados:\n\n📈 Hábitos concluídos hoje: ${completedToday} de ${totalHabits}.\n🔄 Hábitos não concluídos precisam de atenção.\n\n💡 Priorize:\n1. Hábitos que impactam seus objetivos\n2. Hábitos matinais (definem o tom do dia)\n3. Um novo hábito por vez`
  }

  return `Olá! Sou seu mentor de crescimento. Posso ajudar com:\n\n• Estratégias financeiras e poupança\n• Melhoria de hábitos e rotinas\n• Acompanhamento de objetivos\n\nVocê tem ${totalHabits} hábitos, ${activeGoals} objetivos ativos e taxa de poupança de ${savingsRate}%. Pergunte qualquer coisa!`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, context } = (await req.json()) as { message: string; context: AIMentorContext }
    const response = generateInsight(message, context)
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
