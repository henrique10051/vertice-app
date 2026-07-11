import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Sparkles, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { suggestedTopics, type AIMentorContext } from '@/lib/ai-mentor'
import { fetchAIMentorInsight } from '@/services/ai-mentor'
import useHabitsStore from '@/stores/useHabitsStore'
import useFinancesStore from '@/stores/useFinancesStore'
import useGoalsStore from '@/stores/useGoalsStore'

type Message = { role: 'user' | 'ai'; content: string }

export default function Mentor() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content:
        'Olá! Sou seu Mentor de Crescimento Pessoal com IA. Analiso seus hábitos, finanças e objetivos para oferecer conselhos personalizados. Como posso ajudar?',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { habits } = useHabitsStore()
  const { transactions } = useFinancesStore()
  const { goals } = useGoalsStore()

  const context: AIMentorContext = { habits, transactions, goals }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return
    const newMessages = [...messages, { role: 'user' as const, content: text }]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)
    const response = await fetchAIMentorInsight(text, context)
    setMessages([...newMessages, { role: 'ai', content: response }])
    setIsLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Bot className="text-primary" size={28} />
          </div>
          Mentor IA
        </h1>
        <p className="text-muted-foreground">
          Receba conselhos personalizados para seu crescimento.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestedTopics.map((topic) => (
          <button
            key={topic}
            onClick={() => sendMessage(topic)}
            className="text-sm px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1.5"
          >
            <Sparkles size={14} />
            {topic}
          </button>
        ))}
      </div>

      <Card className="glass-card rounded-3xl border-none shadow-soft flex flex-col h-[55vh]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'ai' && (
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Bot size={18} className="text-primary-foreground" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[75%] p-4 rounded-2xl text-sm whitespace-pre-wrap',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted rounded-bl-sm',
                )}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <User size={18} className="text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Bot size={18} className="text-primary-foreground" />
              </div>
              <div className="bg-muted p-4 rounded-2xl rounded-bl-sm">
                <Sparkles size={16} className="animate-pulse text-primary" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Digite sua pergunta..."
            className="rounded-full"
          />
          <Button
            size="icon"
            className="rounded-full shrink-0"
            onClick={() => sendMessage(input)}
            disabled={isLoading}
          >
            <Send size={18} />
          </Button>
        </div>
      </Card>
    </div>
  )
}
