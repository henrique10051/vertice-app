import { useData, type Transaction } from '@/providers/data-provider'

export type { Transaction }

export default function useFinancesStore() {
  const { transactions, addTransaction, deleteTransaction, refetchTransactions } = useData()
  return { transactions, addTransaction, deleteTransaction, refetchTransactions }
}
