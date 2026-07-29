import type { Transaction } from '@/stores/useFinancesStore'

export interface MonthlyProjection {
  projectedIncome: number
  projectedExpense: number
  projectedBalance: number
  monthsUsed: number
  byCategory: { category: string; avg: number }[]
}

const MONTHS_TO_AVERAGE = 3

function monthKey(dateStr: string) {
  return dateStr.slice(0, 7) // "YYYY-MM"
}

/**
 * Projects next month's income/expense as the average of the last N *complete*
 * calendar months. The current (in-progress) month is excluded so a projection
 * requested on day 3 isn't skewed toward near-zero.
 */
export function computeMonthlyProjection(transactions: Transaction[]): MonthlyProjection {
  const currentMonth = monthKey(new Date().toISOString())
  const monthTotals = new Map<string, { income: number; expense: number; categories: Map<string, number> }>()

  for (const t of transactions) {
    const key = monthKey(t.date)
    if (key >= currentMonth) continue
    if (!monthTotals.has(key)) monthTotals.set(key, { income: 0, expense: 0, categories: new Map() })
    const bucket = monthTotals.get(key)!
    if (t.type === 'income') {
      bucket.income += t.amount
    } else {
      bucket.expense += t.amount
      bucket.categories.set(t.category, (bucket.categories.get(t.category) || 0) + t.amount)
    }
  }

  const recentMonths = [...monthTotals.keys()].sort().slice(-MONTHS_TO_AVERAGE)
  const monthsUsed = recentMonths.length

  if (monthsUsed === 0) {
    return { projectedIncome: 0, projectedExpense: 0, projectedBalance: 0, monthsUsed: 0, byCategory: [] }
  }

  let incomeSum = 0
  let expenseSum = 0
  const categorySums = new Map<string, number>()

  for (const key of recentMonths) {
    const bucket = monthTotals.get(key)!
    incomeSum += bucket.income
    expenseSum += bucket.expense
    for (const [cat, amt] of bucket.categories) {
      categorySums.set(cat, (categorySums.get(cat) || 0) + amt)
    }
  }

  const projectedIncome = incomeSum / monthsUsed
  const projectedExpense = expenseSum / monthsUsed
  const byCategory = [...categorySums.entries()]
    .map(([category, total]) => ({ category, avg: total / monthsUsed }))
    .sort((a, b) => b.avg - a.avg)

  return {
    projectedIncome,
    projectedExpense,
    projectedBalance: projectedIncome - projectedExpense,
    monthsUsed,
    byCategory,
  }
}
