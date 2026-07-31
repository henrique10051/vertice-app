import { useState } from 'react'
import { Star, Send, Loader2, MessageSquare } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { sendFeedback } from '@/services/feedback'
import { cn } from '@/lib/utils'

export function FeedbackModal() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!message.trim()) {
      toast({
        title: 'Mensagem vazia',
        description: 'Por favor, escreva seu feedback antes de enviar.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    const { success, error } = await sendFeedback({
      user_id: user.id,
      rating,
      message: message.trim(),
    })
    setLoading(false)

    if (success) {
      toast({
        title: 'Feedback enviado!',
        description: 'Muito obrigado por nos ajudar a melhorar o Vértice.',
      })
      setMessage('')
      setRating(5)
      setOpen(false)
    } else {
      toast({
        title: 'Erro ao enviar',
        description: error || 'Não foi possível enviar seu feedback no momento.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 h-10 w-10 flex items-center justify-center transition-colors"
          title="Enviar feedback"
        >
          <MessageSquare size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-xl">Enviar Feedback</DialogTitle>
          <DialogDescription>
            Sua opinião é fundamental para evoluirmos o Vértice. Conta pra gente o que está achando!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Star Rating Panel */}
          <div className="flex flex-col items-center gap-2 py-4 border border-border/50 rounded-xl bg-muted/20">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Sua nota para o Vértice
            </span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="transition-all hover:scale-110 active:scale-95 duration-100 p-1 focus:outline-none"
                >
                  <Star
                    size={32}
                    className={cn(
                      'transition-colors duration-100',
                      star <= (hoverRating ?? rating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-muted-foreground/30',
                    )}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-medium text-muted-foreground mt-1">
              {rating === 1 && 'Pode melhorar bastante 😕'}
              {rating === 2 && 'Regular 😐'}
              {rating === 3 && 'Bom, mas faltam coisas 🙂'}
              {rating === 4 && 'Muito bom! 😀'}
              {rating === 5 && 'Excelente, estou adorando! 🚀'}
            </span>
          </div>

          {/* Feedback Textarea */}
          <div className="space-y-2">
            <Textarea
              placeholder="Sua sugestão, relato de problema ou elogio..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-28 resize-none bg-muted/30 focus-visible:ring-primary border-border/50 rounded-lg text-sm"
              maxLength={1000}
            />
            <div className="text-right text-[11px] text-muted-foreground">
              {message.length}/1000 caracteres
            </div>
          </div>

          <DialogFooter className="sm:justify-end gap-2 border-t border-border/50 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="rounded-lg"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="gap-2 rounded-lg">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={16} />}
              Enviar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
