import { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { fetchAIMentorInsight } from '@/services/ai-mentor'
import { suggestedTopics, type AIMentorContext } from '@/lib/ai-mentor'
import useHabitsStore from '@/stores/useHabitsStore'
import useFinancesStore from '@/stores/useFinancesStore'
import useGoalsStore from '@/stores/useGoalsStore'
import useHealthStore from '@/stores/useHealthStore'
import { calculateDailyCalories, calculateWaterGoal } from '@/lib/health-utils'

type Message = { role: 'user' | 'assistant'; content: string }

export function AIMentorChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { habits } = useHabitsStore()
  const { transactions } = useFinancesStore()
  const { goals } = useGoalsStore()
  const { healthLog, healthProfile } = useHealthStore()

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
  }, [messages])

  const buildContext = (): AIMentorContext => {
    const calorieGoal =
      healthProfile?.weight_kg && healthProfile?.height_cm && healthProfile?.age
        ? calculateDailyCalories(
            Number(healthProfile.weight_kg),
            Number(healthProfile.height_cm),
            Number(healthProfile.age),
            (healthProfile.gender as 'male' | 'female') || 'male',
            (healthProfile.activity_level as any) || 'sedentary',
          )
        : 0
    const waterGoal = healthProfile?.weight_kg
      ? calculateWaterGoal(Number(healthProfile.weight_kg))
      : 0

    return {
      habits: habits.map((h: any) => ({
        title: h.title,
        is_completed: h.is_completed,
        frequency: h.frequency,
      })),
      transactions: transactions.map((t: any) => ({
        amount: t.amount,
        type: t.type,
        category: t.category,
      })),
      goals: goals.map((g: any) => ({
        title: g.title,
        status: g.status,
        subtasks: g.subtasks,
      })),
      health:
        calorieGoal > 0
          ? {
              calories_consumed: healthLog?.calories_consumed || 0,
              calorie_goal: calorieGoal,
              water_intake_ml: healthLog?.water_intake_ml || 0,
              water_goal_ml: waterGoal,
            }
          : undefined,
    }
  }

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await fetchAIMentorInsight(text, buildContext())
      setMessages((prev) => [...prev, { role: 'assistant', content: response }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Desculpe, houve um erro. Tente novamente.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
      >
        <Sparkles size={24} />
      </button>
    )
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-[calc(100%-2rem)] md:w-96 h-[60vh] md:h-[500px] bg-background rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-fade-in-up">
      <div className="flex items-center justify-between p-4 border-b bg-primary/5">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-primary" />
          <span className="font-bold">Mentor IA</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-3" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center py-4">
              Olá! Sou seu mentor de crescimento. Pergunte sobre hábitos, finanças, saúde ou
              objetivos!
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => send(topic)}
                  className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'max-w-[85%] rounded-2xl p-3 text-sm',
                  msg.role === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted',
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
            {loading && (
              <div className="bg-muted rounded-2xl p-3 text-sm text-muted-foreground">
                Pensando...
              </div>
            )}
          </>
        )}
      </div>
      <div className="p-3 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder="Pergunte algo..."
          disabled={loading}
        />
        <Button onClick={() => send(input)} disabled={loading || !input.trim()} size="icon">
          <Send size={18} />
        </Button>
      </div>
    </div>
  )
}
