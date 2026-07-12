import { useState, useRef, useCallback } from 'react'
import { Mic, Square, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { processVoiceCommand } from '@/services/voice-command'
import useHabitsStore from '@/stores/useHabitsStore'
import useFinancesStore from '@/stores/useFinancesStore'

export function VoiceCommandButton() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const { toast } = useToast()
  const { refetchHabits } = useHabitsStore()
  const { refetchTransactions } = useFinancesStore()

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach((t) => t.stop())
        await processAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch {
      toast({
        title: 'Microfone indisponível',
        description: 'Permita o acesso ao microfone para usar comandos de voz.',
        variant: 'destructive',
      })
    }
  }, [toast])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const processAudio = useCallback(
    async (blob: Blob) => {
      setIsProcessing(true)
      try {
        const result = await processVoiceCommand(blob)
        if (result.success) {
          toast({ title: 'Comando executado!', description: result.message })
          if (result.action === 'complete_habit') {
            await refetchHabits()
          } else if (result.action === 'add_expense') {
            await refetchTransactions()
          }
        } else {
          toast({
            title: 'Não foi possível processar',
            description: result.message,
            variant: 'destructive',
          })
        }
      } catch {
        toast({
          title: 'Erro',
          description: 'Falha ao processar o comando de voz.',
          variant: 'destructive',
        })
      } finally {
        setIsProcessing(false)
      }
    },
    [toast, refetchHabits, refetchTransactions],
  )

  const handleClick = () => {
    if (isProcessing) return
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing}
      className={cn(
        'fixed bottom-20 md:bottom-6 left-4 md:left-6 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center',
        isRecording
          ? 'bg-red-500 text-white animate-pulse'
          : 'bg-secondary text-secondary-foreground',
        isProcessing && 'opacity-70',
      )}
      title={isRecording ? 'Parar gravação' : 'Comando de voz'}
    >
      {isProcessing ? (
        <Loader2 size={24} className="animate-spin" />
      ) : isRecording ? (
        <Square size={20} />
      ) : (
        <Mic size={24} />
      )}
    </button>
  )
}
