import { useData, type Transaction } from '@/providers/data-provider'

export type { Transaction }

export default function useFinancesStore() {
  const {
    transactions,
    addTransaction,
    deleteTransaction,
    refetchTransactions,
    financeCategories,
    addFinanceCategory,
    deleteFinanceCategory,
  } = useData()
  return {
    transactions,
    addTransaction,
    deleteTransaction,
    refetchTransactions,
    financeCategories,
    addFinanceCategory,
    deleteFinanceCategory,
  }
}
