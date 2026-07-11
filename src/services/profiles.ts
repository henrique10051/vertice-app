import { supabase } from '@/lib/supabase/client'

export type Profile = {
  id: string
  full_name: string
  avatar_url: string
  updated_at: string
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return { data: data as Profile | null, error }
}

export async function updateProfile(
  userId: string,
  updates: { full_name?: string; avatar_url?: string },
) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  return { data: data as Profile | null, error }
}
