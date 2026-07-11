import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Bot, Send, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { getAIMentorResponse, suggestedTopics, type AIMentorContext } from '@/lib/ai-mentor'
import useHabitsStore from '@/stores/useHabitsStore'
import useFinancesStore from '@/stores/useFinancesStore'
import useGoalsStore from '@/stores/useGoalsStore'

type Message = { role: 'user' | 'ai'; content: string }

export function AIMentorChat() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Olá! Sou seu Mentor IA. Como posso ajudar no seu crescimento hoje?' },
  ])
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { habits } = useHabitsStore()
  const { transactions } = useFinancesStore()
  const { goals } = useGoalsStore()

  const context: AIMentorContext = { habits, transactions, goals }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    const newMessages = [...messages, { role: 'user' as const, content: text }]
    setMessages(newMessages)
    setInput('')
    setTimeout(() => {
      const response = getAIMentorResponse(text, context)
      setMessages([...newMessages, { role: 'ai', content: response }])
    }, 600)
  }

  if (location.pathname === '/mentor') return null

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center group"
      >
        <Bot size={24} className="group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary rounded-full flex items-center justify-center">
          <Sparkles size={12} className="text-white" />
        </span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-[calc(100%-2rem)] md:w-96 h-[500px] max-h-[70vh] glass-card rounded-2xl flex flex-col overflow-hidden shadow-xl animate-fade-in-up">
      <div className="flex items-center justify-between p-4 border-b bg-primary/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Bot size={18} className="text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-sm">Mentor IA</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-8 w-8"
          onClick={() => setOpen(false)}
        >
          <X size={18} />
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted rounded-bl-sm',
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {suggestedTopics.map((topic) => (
            <button
              key={topic}
              onClick={() => sendMessage(topic)}
              className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              {topic}
            </button>
          ))}
        </div>
      )}

      <div className="p-3 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          placeholder="Pergunte algo..."
          className="rounded-full"
        />
        <Button size="icon" className="rounded-full shrink-0" onClick={() => sendMessage(input)}>
          <Send size={18} />
        </Button>
      </div>
    </div>
  )
}
