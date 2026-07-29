import { useData, type Transaction } from '@/providers/data-provider'

export type { Transaction }

export default function useFinancesStore() {
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetchTransactions,
    financeCategories,
    addFinanceCategory,
    deleteFinanceCategory,
  } = useData()
  return {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetchTransactions,
    financeCategories,
    addFinanceCategory,
    deleteFinanceCategory,
  }
}
