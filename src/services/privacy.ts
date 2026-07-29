import { supabase } from '@/lib/supabase/client'

export async function exportUserData() {
  const { data, error } = await supabase.functions.invoke<Record<string, unknown>>(
    'export-user-data',
    { method: 'POST' },
  )
  if (error || !data) return { error: error ?? new Error('Falha ao exportar dados') }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'vertice-meus-dados.json'
  link.click()
  URL.revokeObjectURL(url)
  return { error: null }
}

export async function deleteAccount() {
  const { data, error } = await supabase.functions.invoke<{ success: boolean; error?: string }>(
    'delete-account',
    { method: 'POST' },
  )
  if (error) return { error }
  if (data?.error) return { error: new Error(data.error) }
  return { error: null }
}
