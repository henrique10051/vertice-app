export interface AIMentorContext {
  habits: { title: string; is_completed: boolean; frequency: string }[]
  transactions: { amount: number; type: 'income' | 'expense'; category: string }[]
  goals: { title: string; status: string; subtasks: { completed: boolean }[] }[]
}

export const suggestedTopics = [
  'Como posso poupar mais?',
  'Como melhorar minha rotina matinal?',
  'Quais hábitos devo priorizar?',
  'Como atingir meus objetivos mais rápido?',
]

export function getAIMentorResponse(message: string, context: AIMentorContext): string {
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
