import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Bot,
  Send,
  Sparkles,
  User,
  CheckCircle2,
  Loader2,
  BookOpen,
  Target,
  Repeat,
  Rocket,
  Brain,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useData } from '@/providers/data-provider'
import {
  sendMentorMessage,
  createHabitsFromRoadmap,
  type ChatMessage,
  type ProposedHabit,
  type MentorResponse,
} from '@/services/mentor-chat'
import { Link } from 'react-router-dom'

const INTRO_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    'Olá! Sou seu Mentor de Crescimento Pessoal. Vou conduzir uma breve entrevista para montar um plano personalizado. Quando estiver pronto, responda à primeira pergunta abaixo!',
}

export default function Mentor() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { refetchHabits } = useData()

  const [interviewStarted, setInterviewStarted] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [roadmap, setRoadmap] = useState<{ content: string; habits: ProposedHabit[] } | null>(null)
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading])

  const handleResponse = useCallback(
    (resp: MentorResponse) => {
      if (resp.type === 'roadmap' && resp.habits && resp.habits.length > 0) {
        setRoadmap({ content: resp.content, habits: resp.habits })
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              resp.content +
              '\n\n📋 Seu Plano de Crescimento está pronto! Confira o resumo abaixo e confirme para criar os hábitos.',
          },
        ])
      } else {
        setQuestionIndex(resp.questionIndex ?? questionIndex + 1)
        setMessages((prev) => [...prev, { role: 'assistant', content: resp.content }])
      }
    },
    [questionIndex],
  )

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return
    const userMsg: ChatMessage = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const resp = await sendMentorMessage(newMessages, questionIndex)
      handleResponse(resp)
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Desculpe, houve um erro. Tente novamente.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartInterview = () => {
    setInterviewStarted(true)
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }

  const handleConfirm = async () => {
    if (!user || !roadmap) return
    setCreating(true)
    const result = await createHabitsFromRoadmap(user.id, roadmap.habits)
    setCreating(false)

    if (result.success) {
      setCreated(true)
      refetchHabits?.()
      toast({
        title: 'Hábitos criados com sucesso!',
        description: `${roadmap.habits.length} hábitos foram adicionados ao seu rastreador.`,
      })
    } else {
      toast({
        title: 'Erro ao criar hábitos',
        description: result.error || 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  const handleRestart = () => {
    setMessages([INTRO_MESSAGE])
    setRoadmap(null)
    setCreated(false)
    setQuestionIndex(0)
    setInput('')
    setInterviewStarted(false)
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
          Faça uma entrevista guiada e receba um plano de crescimento personalizado.
        </p>
      </div>

      <Card className="glass-card rounded-3xl border-none shadow-soft p-8 md:p-10 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-primary/10 rounded-2xl">
            <Brain className="text-primary" size={40} />
          </div>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 max-w-2xl mx-auto">
          Quer evoluir? Deixe nossa IA criar seu roteiro de estudos e hábitos personalizados.
        </h2>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          Responda algumas perguntas rápidas e receba um plano completo com hábitos sugeridos,
          baseado em metodologias comprovadas de desenvolvimento pessoal.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target size={16} className="text-primary" />
            Plano personalizado
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Repeat size={16} className="text-primary" />
            Hábitos automáticos
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp size={16} className="text-primary" />
            Baseado em livros
          </div>
        </div>
        <Button
          size="lg"
          className="rounded-full text-base font-semibold px-8"
          onClick={handleStartInterview}
          disabled={interviewStarted}
        >
          <Rocket size={20} className="mr-2" />
          Iniciar Entrevista de Crescimento
        </Button>
      </Card>

      {interviewStarted && (
        <Card className="glass-card rounded-3xl border-none shadow-soft flex flex-col h-[45vh] animate-fade-in-up">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'assistant' && (
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

          {!roadmap && (
            <div className="p-4 border-t flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                placeholder="Digite sua resposta..."
                className="rounded-full"
                disabled={isLoading}
              />
              <Button
                size="icon"
                className="rounded-full shrink-0"
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
              >
                <Send size={18} />
              </Button>
            </div>
          )}
        </Card>
      )}

      {roadmap && (
        <Card className="glass-card rounded-3xl border-none shadow-soft p-6 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Target className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Plano de Crescimento</h2>
              <p className="text-sm text-muted-foreground">
                {roadmap.habits.length} hábitos personalizados para você
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">{roadmap.content}</p>

          <div className="space-y-3 mb-6">
            {roadmap.habits.map((habit, i) => (
              <div
                key={i}
                className="flex gap-3 p-4 rounded-2xl bg-background/60 border border-border/50"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{habit.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                      <Repeat size={10} />
                      {habit.frequency}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{habit.description}</p>
                </div>
              </div>
            ))}
          </div>

          {created ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="text-green-500" size={48} />
              <p className="font-semibold text-center">
                Hábitos criados! Acesse seu rastreador para começar.
              </p>
              <div className="flex gap-2">
                <Button asChild>
                  <Link to="/habitos">Ir para Hábitos</Link>
                </Button>
                <Button variant="outline" onClick={handleRestart}>
                  Nova Entrevista
                </Button>
              </div>
            </div>
          ) : (
            <Button className="w-full" size="lg" onClick={handleConfirm} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Criando hábitos...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} className="mr-2" />
                  Confirmar e Criar Hábitos
                </>
              )}
            </Button>
          )}
        </Card>
      )}
    </div>
  )
}
