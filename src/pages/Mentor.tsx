import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Target, Repeat, Rocket, Brain, TrendingUp, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
import { MentorMultiTopicInput } from '@/components/MentorMultiTopicInput'
import { MentorRoadmapPreview } from '@/components/MentorRoadmapPreview'

const TOTAL_QUESTIONS = 5

const INTRO_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    'Olá! Sou seu Mentor de Crescimento Pessoal. Vou conduzir uma breve entrevista para montar um plano personalizado com técnica Pomodoro. Quando estiver pronto, clique no botão abaixo para começar!',
}

export default function Mentor() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { refetchHabits } = useData()

  const [interviewStarted, setInterviewStarted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const [currentOptions, setCurrentOptions] = useState<string[]>([])
  const [showOtherInput, setShowOtherInput] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([INTRO_MESSAGE])
  const [roadmap, setRoadmap] = useState<{ content: string; habits: ProposedHabit[] } | null>(null)
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState(false)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showOtherInput) inputRef.current?.focus()
  }, [showOtherInput])

  const isMultiTopicQuestion = questionIndex === 1

  const processResponse = (resp: MentorResponse, currentMessages: ChatMessage[]) => {
    const updatedMessages: ChatMessage[] = [
      ...currentMessages,
      { role: 'assistant', content: resp.content },
    ]
    setConversationHistory(updatedMessages)

    if (resp.type === 'roadmap' && resp.habits && resp.habits.length > 0) {
      setRoadmap({ content: resp.content, habits: resp.habits })
      setCurrentQuestion(null)
      setCurrentOptions([])
    } else {
      setCurrentQuestion(resp.content)
      setCurrentOptions(resp.suggestedOptions ?? [])
      setQuestionIndex(resp.questionIndex ?? 1)
      setShowOtherInput(false)
      setInput('')
    }
    setIsLoading(false)
  }

  const handleStartInterview = async () => {
    setInterviewStarted(true)
    setIsLoading(true)
    const initialMessages: ChatMessage[] = [INTRO_MESSAGE]
    setConversationHistory(initialMessages)
    try {
      const resp = await sendMentorMessage(initialMessages, 0)
      processResponse(resp, initialMessages)
    } catch {
      setCurrentQuestion('Desculpe, houve um erro. Tente novamente.')
      setIsLoading(false)
    }
  }

  const selectOption = async (option: string) => {
    if (isLoading || !option.trim()) return
    const userMsg: ChatMessage = { role: 'user', content: option }
    const newHistory = [...conversationHistory, userMsg]
    setConversationHistory(newHistory)
    setIsLoading(true)
    setShowOtherInput(false)
    setInput('')
    setCurrentQuestion(null)
    setCurrentOptions([])
    try {
      const resp = await sendMentorMessage(newHistory, questionIndex)
      processResponse(resp, newHistory)
    } catch {
      setCurrentQuestion('Desculpe, houve um erro. Tente novamente.')
      setIsLoading(false)
    }
  }

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    )
  }

  const addCustomTopic = (topic: string) => {
    setSelectedTopics((prev) => (prev.includes(topic) ? prev : [...prev, topic]))
  }

  const handleMultiTopicContinue = () => {
    if (selectedTopics.length === 0) return
    const combined = selectedTopics.join(', ')
    setSelectedTopics([])
    selectOption(combined)
  }

  const sendCustomInput = () => {
    if (!input.trim()) return
    selectOption(input.trim())
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
    setConversationHistory([INTRO_MESSAGE])
    setRoadmap(null)
    setCreated(false)
    setQuestionIndex(0)
    setInput('')
    setSelectedTopics([])
    setCurrentQuestion(null)
    setCurrentOptions([])
    setShowOtherInput(false)
    setInterviewStarted(false)
  }

  const progressStep = Math.min(questionIndex, TOTAL_QUESTIONS)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Bot className="text-primary" size={28} />
          </div>
          Mentor IA
        </h1>
        <p className="text-muted-foreground">
          Faça uma entrevista guiada e receba um plano de crescimento personalizado com técnica
          Pomodoro.
        </p>
      </div>

      {!interviewStarted && !roadmap && (
        <Card className="rounded-xl p-8 md:p-10 text-center animate-fade-in-up">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-xl">
              <Brain className="text-primary" size={40} />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 max-w-2xl mx-auto">
            Quer evoluir? Deixe nossa IA criar seu roteiro de estudos com Pomodoro e hábitos
            personalizados.
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Responda algumas perguntas rápidas e receba um plano completo com hábitos sugeridos e
            cronograma Pomodoro, baseado em metodologias comprovadas de desenvolvimento pessoal.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target size={16} className="text-primary" />
              Plano personalizado
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Repeat size={16} className="text-primary" />
              Múltiplos tópicos
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp size={16} className="text-primary" />
              Técnica Pomodoro
            </div>
          </div>
          <Button
            size="lg"
            className="rounded-full text-base font-semibold px-8"
            onClick={handleStartInterview}
          >
            <Rocket size={20} className="mr-2" />
            Iniciar Entrevista de Crescimento
          </Button>
        </Card>
      )}

      {interviewStarted && !roadmap && (
        <Card className="rounded-xl p-6 md:p-8 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Bot size={18} className="text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {isLoading
                  ? 'Gerando pergunta...'
                  : `Pergunta ${progressStep} de ${TOTAL_QUESTIONS}`}
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i < progressStep ? 'bg-primary w-6' : 'bg-muted w-4',
                  )}
                />
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4 py-6">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <div className="flex flex-wrap gap-2 pt-4">
                <Skeleton className="h-9 w-32 rounded-full" />
                <Skeleton className="h-9 w-28 rounded-full" />
                <Skeleton className="h-9 w-36 rounded-full" />
              </div>
            </div>
          ) : currentQuestion ? (
            <div className="py-2">
              <p className="text-lg md:text-xl font-medium leading-relaxed mb-6">
                {currentQuestion}
              </p>

              {isMultiTopicQuestion ? (
                <MentorMultiTopicInput
                  options={currentOptions}
                  selectedTopics={selectedTopics}
                  onToggleOption={toggleTopic}
                  onAddCustom={addCustomTopic}
                  onRemoveTopic={(t) => setSelectedTopics((prev) => prev.filter((x) => x !== t))}
                  onContinue={handleMultiTopicContinue}
                  isLoading={isLoading}
                />
              ) : (
                <>
                  {currentOptions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {currentOptions.map((option, i) => (
                        <button
                          key={i}
                          onClick={() => selectOption(option)}
                          disabled={isLoading}
                          className="px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {option}
                        </button>
                      ))}
                      <button
                        onClick={() => setShowOtherInput(true)}
                        disabled={isLoading || showOtherInput}
                        className={cn(
                          'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95 flex items-center gap-1.5',
                          showOtherInput
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80',
                        )}
                      >
                        <Pencil size={14} />
                        Outro...
                      </button>
                    </div>
                  )}
                  {showOtherInput && (
                    <div className="flex gap-2 animate-fade-in-up">
                      <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendCustomInput()}
                        placeholder="Digite sua resposta..."
                        className="rounded-full"
                        disabled={isLoading}
                      />
                      <Button
                        size="icon"
                        className="rounded-full shrink-0"
                        onClick={sendCustomInput}
                        disabled={isLoading || !input.trim()}
                      >
                        <Send size={18} />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : null}
        </Card>
      )}

      {roadmap && (
        <MentorRoadmapPreview
          content={roadmap.content}
          habits={roadmap.habits}
          created={created}
          creating={creating}
          onConfirm={handleConfirm}
          onRestart={handleRestart}
        />
      )}
    </div>
  )
}
