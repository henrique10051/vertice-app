import { supabase } from '@/lib/supabase/client'

export interface FoodAnalysisResult {
  estimated_calories: number
  food_description: string
}

export async function uploadMealPhoto(file: File): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const ext = file.name.split('.').pop() || 'jpg'
  const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage.from('meal-photos').upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) return null

  const { data: signedData } = await supabase.storage
    .from('meal-photos')
    .createSignedUrl(fileName, 3600)

  return signedData?.signedUrl || null
}

export async function analyzeFoodPhoto(imageUrl: string): Promise<FoodAnalysisResult> {
  const { data, error } = await supabase.functions.invoke('food-analysis', {
    body: { imageUrl },
  })

  if (error || !data) {
    throw new Error('Falha ao analisar foto da refeição')
  }

  return data as FoodAnalysisResult
}

export async function analyzeFoodText(text: string): Promise<FoodAnalysisResult> {
  const { data, error } = await supabase.functions.invoke('food-analysis', {
    body: { text },
  })

  if (error || !data) {
    throw new Error('Falha ao analisar descrição do alimento')
  }

  return data as FoodAnalysisResult
}
