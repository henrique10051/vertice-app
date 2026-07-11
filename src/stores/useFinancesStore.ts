import { createStore } from './main'
import { getTodayStr } from '@/lib/date-utils'

export type TransactionCategory =
  | 'Moradia'
  | 'Alimentação'
  | 'Transporte'
  | 'Educação/Crescimento'
  | 'Renda'
export type Transaction = {
  id: string
  amount: number
  description: string
  category: TransactionCategory
  type: 'income' | 'expense'
  date: string
}

const initialTransactions: Transaction[] = [
  {
    id: '1',
    amount: 5000,
    description: 'Salário',
    category: 'Renda',
    type: 'income',
    date: getTodayStr(),
  },
  {
    id: '2',
    amount: 1200,
    description: 'Aluguel',
    category: 'Moradia',
    type: 'expense',
    date: getTodayStr(),
  },
  {
    id: '3',
    amount: 300,
    description: 'Supermercado',
    category: 'Alimentação',
    type: 'expense',
    date: getTodayStr(),
  },
  {
    id: '4',
    amount: 150,
    description: 'Curso Online',
    category: 'Educação/Crescimento',
    type: 'expense',
    date: getTodayStr(),
  },
]

const financesStore = createStore<{ transactions: Transaction[] }>({
  transactions: initialTransactions,
})

export default function useFinancesStore() {
  const [state, setState] = financesStore.useStore()

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    setState((prev) => ({
      transactions: [{ ...transaction, id: Math.random().toString() }, ...prev.transactions],
    }))
  }

  return { transactions: state.transactions, addTransaction }
}
