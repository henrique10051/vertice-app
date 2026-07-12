export type Plan = {
  id: string
  name: string
  price: string
  description: string
  features: string[]
  highlight: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 'R$ 0',
    description: 'Rastreamento básico de hábitos e registros financeiros.',
    features: [
      'Rastreamento de hábitos diários',
      'Registros financeiros básicos',
      'Dashboard com visão geral',
      'Até 5 hábitos ativos',
    ],
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 19,90/mês',
    description: 'Análises avançadas, hábitos ilimitados e categorias personalizadas.',
    features: [
      'Hábitos ilimitados',
      'Categorias financeiras personalizadas',
      'Análises avançadas e relatórios',
      'Gráficos detalhados de progresso',
      'Exportação de dados',
    ],
    highlight: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 39,90/mês',
    description: 'Todos os recursos Pro mais insights personalizados do Mentor IA.',
    features: [
      'Tudo do plano Pro',
      'Mentor IA com insights personalizados',
      'Recomendações inteligentes de hábitos',
      'Análise preditiva de finanças',
      'Suporte prioritário',
    ],
    highlight: false,
  },
]
