import { supabase } from '@/lib/supabase/client'

export type InventoryItem = {
  id: string
  user_id: string
  name: string
  category: string
  current_quantity: number
  min_quantity: number
  unit: string
  is_on_shopping_list: boolean
  created_at: string
}

export async function getInventoryItems(userId: string) {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })
  return { data: data as InventoryItem[] | null, error }
}

export async function createInventoryItem(userId: string, item: Partial<InventoryItem>) {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert({ user_id: userId, ...item })
    .select()
    .single()
  return { data: data as InventoryItem | null, error }
}

export async function updateInventoryItem(id: string, updates: Partial<InventoryItem>) {
  const { data, error } = await supabase
    .from('inventory_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data: data as InventoryItem | null, error }
}

export async function deleteInventoryItem(id: string) {
  const { error } = await supabase.from('inventory_items').delete().eq('id', id)
  return { error }
}
