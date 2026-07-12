import { supabase } from '@/lib/supabase/client'

export interface VoiceCommandResult {
  success: boolean
  message: string
  action?: string
  transcription?: string
}

export async function processVoiceCommand(audioBlob: Blob): Promise<VoiceCommandResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return { success: false, message: 'Não autenticado.' }
  }

  const formData = new FormData()
  formData.append('audio', audioBlob, 'voice.webm')

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-command`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: formData,
  })

  const data = await response.json()
  return data as VoiceCommandResult
}
