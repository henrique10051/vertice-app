export function generateHabitConsistencyData(days: number) {
  const data: { date: string; day: string; rate: number; completed: number; total: number }[] = []
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const total = 3
    const baseRate = 0.4 + (1 - i / days) * 0.4
    const noise = (Math.sin(i * 0.7) + 1) * 0.12
    const rate = Math.min(100, Math.max(0, Math.round((baseRate + noise) * 100)))
    data.push({
      date: dateStr,
      day: dayNames[d.getDay()],
      rate,
      completed: Math.round((rate / 100) * total),
      total,
    })
  }
  return data
}

export function generateFinancialTrendData(months: number) {
  const data: { month: string; balance: number; savings: number }[] = []
  const monthNames = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ]
  let balance = 2000
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const income = 5000 + Math.sin(i * 0.5) * 300
    const expense = 2200 + Math.cos(i * 0.3) * 400
    balance += income - expense
    data.push({
      month: monthNames[d.getMonth()],
      balance: Math.round(balance),
      savings: Math.round(income - expense),
    })
  }
  return data
}
