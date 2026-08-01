import {
  useData,
  type Transaction,
  type Budget,
  type InstallmentPurchase,
} from '@/providers/data-provider'

export type { Transaction, Budget, InstallmentPurchase }

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
    budgets,
    addBudget,
    deleteBudget,
    installmentPurchases,
    addInstallmentPurchase,
    deleteInstallmentPurchase,
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
    budgets,
    addBudget,
    deleteBudget,
    installmentPurchases,
    addInstallmentPurchase,
    deleteInstallmentPurchase,
  }
}
