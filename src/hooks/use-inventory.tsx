import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  type InventoryItem,
} from '@/services/inventory'

interface InventoryContextType {
  items: InventoryItem[]
  loading: boolean
  addItem: (item: Partial<InventoryItem>) => Promise<void>
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>
  removeItem: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined)

export const useInventory = () => {
  const context = useContext(InventoryContext)
  if (!context) throw new Error('useInventory must be used within InventoryProvider')
  return context
}

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await getInventoryItems(user.id)
    setItems(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    refetch()
  }, [refetch])

  const addItem = useCallback(
    async (item: Partial<InventoryItem>) => {
      if (!user) return
      await createInventoryItem(user.id, item)
      await refetch()
    },
    [user, refetch],
  )

  const updateItem = useCallback(
    async (id: string, updates: Partial<InventoryItem>) => {
      await updateInventoryItem(id, updates)
      await refetch()
    },
    [refetch],
  )

  const removeItem = useCallback(
    async (id: string) => {
      await deleteInventoryItem(id)
      await refetch()
    },
    [refetch],
  )

  return (
    <InventoryContext.Provider value={{ items, loading, addItem, updateItem, removeItem, refetch }}>
      {children}
    </InventoryContext.Provider>
  )
}
