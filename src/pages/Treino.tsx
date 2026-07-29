import { useState, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import useWorkoutStore from '@/stores/useWorkoutStore'
import useHabitsStore from '@/stores/useHabitsStore'
import useGoalsStore from '@/stores/useGoalsStore'
import { WorkoutEvolutionChart } from '@/components/WorkoutEvolutionChart'
import { fetchWorkoutSuggestion } from '@/services/workout-suggestion'
import { WEEKDAYS } from '@/lib/workout-suggestion-fallback'
import { addDays, getTodayStr, strToDate } from '@/lib/date-utils'
import { useToast } from '@/hooks/use-toast'
import {
  Dumbbell,
  Plus,
  Sparkles,
  Trash2,
  Loader2,
  CalendarClock,
  Check,
  Video,
  ExternalLink,
  Play,
  Upload,
  X,
  FileVideo,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

export default function Treino() {
  const { user } = useAuth()
  const {
    exercises,
    sessions,
    sets,
    plan,
    addExercise,
    getOrCreateTodaySession,
    addSet,
    deleteSet,
    savePlan,
  } = useWorkoutStore()
  const { habits } = useHabitsStore()
  const { goals } = useGoalsStore()
  const { toast } = useToast()

  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [rpe, setRpe] = useState('')
  const [newExerciseName, setNewExerciseName] = useState('')
  const [savingSet, setSavingSet] = useState(false)

  // Advanced Exercise States
  const [dialogOpen, setDialogOpen] = useState(false)
  const [exerciseName, setExerciseName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('Peito')
  const [videoUrlInput, setVideoUrlInput] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [creatingExercise, setCreatingExercise] = useState(false)

  // Video expand/collapse
  const [videoExpanded, setVideoExpanded] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedExercise = useMemo(() => {
    return exercises.find((e) => e.id === selectedExerciseId)
  }, [exercises, selectedExerciseId])

  const [suggestion, setSuggestion] = useState<Awaited<
    ReturnType<typeof fetchWorkoutSuggestion>
  > | null>(null)
  const [loadingSuggestion, setLoadingSuggestion] = useState(false)
  const [savingPlan, setSavingPlan] = useState(false)

  const today = getTodayStr()
  const todaySession = sessions.find((s) => s.date === today)
  const todaySets = todaySession ? sets.filter((s) => s.session_id === todaySession.id) : []

  const chartExerciseId = selectedExerciseId || exercises[0]?.id || ''
  const chartExercise = exercises.find((e) => e.id === chartExerciseId)

  const getYoutubeEmbedUrl = (url: string | null | undefined): string | null => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    const videoId = match && match[2].length === 11 ? match[2] : null

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`
    }

    if (url.includes('/shorts/')) {
      const shortsMatch = url.split('/shorts/')[1]?.split('?')[0]
      if (shortsMatch) {
        return `https://www.youtube.com/embed/${shortsMatch}`
      }
    }

    return null
  }

  const handleUploadVideo = async (file: File): Promise<string | null> => {
    if (!user) return null
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('exercise-videos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('exercise-videos')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (err: any) {
      toast({
        title: 'Erro no upload',
        description: err.message || 'Não foi possível fazer o upload do vídeo.',
        variant: 'destructive',
      })
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleCreateAdvancedExercise = async () => {
    if (!exerciseName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Dê um nome para o exercício.',
        variant: 'destructive',
      })
      return
    }

    setCreatingExercise(true)
    try {
      let finalVideoUrl = videoUrlInput.trim() || null

      if (videoFile) {
        const uploadedUrl = await handleUploadVideo(videoFile)
        if (uploadedUrl) {
          finalVideoUrl = uploadedUrl
        } else {
          setCreatingExercise(false)
          return
        }
      }

      const created = await addExercise(exerciseName.trim(), muscleGroup, finalVideoUrl)
      if (created) {
        setSelectedExerciseId(created.id)
        setExerciseName('')
        setVideoUrlInput('')
        setVideoFile(null)
        setDialogOpen(false)
        toast({
          title: 'Exercício criado!',
          description: `"${created.name}" foi adicionado com sucesso.`,
        })
      }
    } catch {
      toast({
        title: 'Erro ao criar',
        description: 'Não foi possível salvar o exercício.',
        variant: 'destructive',
      })
    } finally {
      setCreatingExercise(false)
    }
  }

  const evolutionData = useMemo(() => {
    if (!chartExerciseId) return []
    const byDate = new Map<string, number>()
    sets
      .filter((s) => s.exercise_id === chartExerciseId)
      .forEach((s) => {
        const session = sessions.find((sess) => sess.id === s.session_id)
        if (!session) return
        const current = byDate.get(session.date) || 0
        byDate.set(session.date, Math.max(current, Number(s.weight_kg)))
      })
    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, maxWeight]) => ({
        date,
        label: strToDate(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        maxWeight,
      }))
  }, [sets, sessions, chartExerciseId])

  const handleAddSet = async () => {
    if (!selectedExerciseId || !reps || !weight) return
    setSavingSet(true)
    const session = await getOrCreateTodaySession()
    if (session) {
      await addSet(
        session.id,
        selectedExerciseId,
        Number(reps),
        Number(weight),
        rpe ? Number(rpe) : undefined,
      )
      setReps('')
      setWeight('')
      setRpe('')
      toast({ title: 'Série registrada!' })
    }
    setSavingSet(false)
  }

  const handleAddExerciseClick = () => {
    if (newExerciseName.trim()) {
      setExerciseName(newExerciseName.trim())
      setNewExerciseName('')
    } else {
      setExerciseName('')
    }
    setMuscleGroup('Peito')
    setVideoUrlInput('')
    setVideoFile(null)
    setDialogOpen(true)
  }

  const handleAddExercise = async () => {
    handleAddExerciseClick()
  }

  const last7Days = addDays(today, -7)
  const muscleGroupsTrained = useMemo(() => {
    const groups = new Set<string>()
    sets.forEach((s) => {
      const session = sessions.find((sess) => sess.id === s.session_id)
      if (!session || session.date < last7Days) return
      const ex = exercises.find((e) => e.id === s.exercise_id)
      if (ex?.muscle_group) groups.add(ex.muscle_group)
    })
    return [...groups]
  }, [sets, sessions, exercises, last7Days])

  const habitConsistencyRate =
    habits.length > 0
      ? Math.round((habits.filter((h) => h.is_completed).length / habits.length) * 100)
      : 0

  const handleGenerateSuggestion = async () => {
    setLoadingSuggestion(true)
    setSuggestion(null)
    const recentSets = sets
      .filter((s) => {
        const session = sessions.find((sess) => sess.id === s.session_id)
        return session && session.date >= last7Days
      })
      .map((s) => {
        const ex = exercises.find((e) => e.id === s.exercise_id)
        const session = sessions.find((sess) => sess.id === s.session_id)
        return {
          exerciseName: ex?.name || 'Exercício',
          weightKg: Number(s.weight_kg),
          reps: s.reps,
          date: session?.date || today,
        }
      })

    const result = await fetchWorkoutSuggestion({
      recentSets,
      muscleGroupsTrained,
      activeGoals: goals.filter((g) => g.status === 'Em Progresso').map((g) => g.title),
      habitConsistencyRate,
    })
    setSuggestion(result)
    setLoadingSuggestion(false)
  }

  const sortByWeekday = <T extends { dayOfWeek: string }>(items: T[]) =>
    [...items].sort(
      (a, b) =>
        (WEEKDAYS as readonly string[]).indexOf(a.dayOfWeek) -
        (WEEKDAYS as readonly string[]).indexOf(b.dayOfWeek),
    )

  const handleSavePlan = async () => {
    if (!suggestion) return
    setSavingPlan(true)
    await savePlan({ summary: suggestion.summary, items: suggestion.habits })
    setSuggestion(null)
    setSavingPlan(false)
    toast({ title: 'Cronograma salvo!' })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Dumbbell className="text-primary" size={28} />
          Treino
        </h1>
        <p className="text-muted-foreground">Registre suas cargas e acompanhe sua progressão.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card rounded-2xl border-none shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Registrar Série</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Exercício</Label>
              <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um exercício" />
                </SelectTrigger>
                <SelectContent>
                  {exercises.map((ex) => (
                    <SelectItem key={ex.id} value={ex.id}>
                      {ex.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="Novo exercício"
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddExercise()}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={handleAddExercise} className="gap-1">
                  <Plus size={14} /> Criar
                </Button>
              </div>
            </div>

            {/* Exercise Demo Video Player */}
            {selectedExercise && selectedExercise.video_url && (
              <div className="border border-border/50 rounded-xl p-3 bg-muted/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
                    <Video size={14} className="text-primary animate-pulse" />
                    Guia de Execução do Exercício
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-primary hover:text-primary/80 flex items-center gap-1.5 px-2 hover:bg-primary/5 rounded-full"
                    onClick={() => setVideoExpanded(!videoExpanded)}
                  >
                    {videoExpanded ? (
                      <>
                        Ocultar Vídeo <ChevronUp size={12} />
                      </>
                    ) : (
                      <>
                        Ver Vídeo <ChevronDown size={12} />
                      </>
                    )}
                  </Button>
                </div>

                {videoExpanded && (
                  <div className="rounded-lg overflow-hidden border border-border/60 bg-black/5 animate-in slide-in-from-top-1 duration-200">
                    {(() => {
                      const embedUrl = getYoutubeEmbedUrl(selectedExercise.video_url)
                      if (embedUrl) {
                        return (
                          <div className="aspect-video w-full">
                            <iframe
                              src={embedUrl}
                              title={`Como fazer ${selectedExercise.name}`}
                              className="w-full h-full border-none"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          </div>
                        )
                      }

                      const isDirectVideo =
                        selectedExercise.video_url?.includes('supabase.co/storage') ||
                        /\.(mp4|webm|ogg)/i.test(selectedExercise.video_url || '')

                      if (isDirectVideo) {
                        return (
                          <div className="aspect-video w-full flex bg-black">
                            <video
                              src={selectedExercise.video_url || ''}
                              controls
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )
                      }

                      return (
                        <div className="p-4 flex flex-col items-center justify-center text-center space-y-3 bg-muted/30">
                          <Play size={24} className="text-primary/70" />
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold">Demonstração Externa</p>
                            <p className="text-[11px] text-muted-foreground">Esta demonstração está hospedada em uma plataforma externa.</p>
                          </div>
                          <a
                            href={selectedExercise.video_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full hover:bg-primary/95 transition-all shadow-soft"
                          >
                            Abrir Vídeo Externo <ExternalLink size={12} />
                          </a>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Reps</Label>
                <Input type="number" value={reps} onChange={(e) => setReps(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Peso (kg)</Label>
                <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>RPE (opcional)</Label>
                <Input
                  type="number"
                  value={rpe}
                  onChange={(e) => setRpe(e.target.value)}
                  min={1}
                  max={10}
                />
              </div>
            </div>

            <Button
              onClick={handleAddSet}
              disabled={!selectedExerciseId || !reps || !weight || savingSet}
              className="w-full gap-2"
            >
              {savingSet ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Adicionar Série
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl border-none shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Sessão de Hoje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todaySets.length > 0 ? (
              todaySets.map((s) => {
                const ex = exercises.find((e) => e.id === s.exercise_id)
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <span className="font-medium text-sm">{ex?.name || 'Exercício'}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        série {s.set_number} — {s.reps} reps × {s.weight_kg}kg
                        {s.rpe ? ` — RPE ${s.rpe}` : ''}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteSet(s.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Nenhuma série registrada hoje.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {exercises.length > 0 && (
        <div className="space-y-3">
          <div className="max-w-xs">
            <Select value={chartExerciseId} onValueChange={setSelectedExerciseId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha o exercício do gráfico" />
              </SelectTrigger>
              <SelectContent>
                {exercises.map((ex) => (
                  <SelectItem key={ex.id} value={ex.id}>
                    {ex.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <WorkoutEvolutionChart exerciseName={chartExercise?.name || ''} data={evolutionData} />
        </div>
      )}

      {plan && (
        <Card className="glass-card rounded-2xl border-none shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CalendarClock className="text-primary" size={20} />
              Cronograma de Treino
            </CardTitle>
            <p className="text-sm text-muted-foreground italic">{plan.summary}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortByWeekday(plan.items).map((item, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                <div className="shrink-0 w-20 text-xs font-semibold uppercase tracking-wide text-primary pt-0.5">
                  {item.dayOfWeek}
                </div>
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="glass-card rounded-2xl border-none shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="text-primary" size={20} />
            Sugestão de Treino com IA
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Baseado no seu histórico de cargas, grupos musculares recentes e objetivos.
            {plan ? ' Gerar uma nova sugestão substitui o cronograma atual.' : ''}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGenerateSuggestion} disabled={loadingSuggestion} className="gap-2">
            {loadingSuggestion ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            Gerar Sugestão
          </Button>

          {suggestion && (
            <div className="space-y-3 pt-2">
              <p className="text-sm text-muted-foreground italic">{suggestion.summary}</p>
              {sortByWeekday(suggestion.habits).map((h, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="shrink-0 w-20 text-xs font-semibold uppercase tracking-wide text-primary pt-0.5">
                    {h.dayOfWeek}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{h.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{h.description}</p>
                  </div>
                </div>
              ))}
              <Button
                onClick={handleSavePlan}
                disabled={savingPlan}
                variant="outline"
                className="gap-2"
              >
                {savingPlan ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Salvar como Cronograma
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Create Exercise Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell size={20} className="text-primary" />
              Criar Novo Exercício
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="adv-ex-name">Nome do Exercício *</Label>
              <Input
                id="adv-ex-name"
                placeholder="Ex: Agachamento Búlgaro, Crossover"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adv-ex-muscle">Grupo Muscular</Label>
              <Select value={muscleGroup} onValueChange={setMuscleGroup}>
                <SelectTrigger id="adv-ex-muscle">
                  <SelectValue placeholder="Selecione o grupo muscular" />
                </SelectTrigger>
                <SelectContent>
                  {['Peito', 'Costas', 'Pernas', 'Ombro', 'Bíceps', 'Tríceps', 'Core', 'Posterior', 'Outro'].map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vídeo Demonstrativo / Execução (Opcional)</Label>
              
              <Tabs defaultValue="link" className="w-full border rounded-xl overflow-hidden p-1 bg-background/50 border-border/40">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="link" className="text-xs py-1.5">Link Web</TabsTrigger>
                  <TabsTrigger value="upload" className="text-xs py-1.5">Fazer Upload</TabsTrigger>
                </TabsList>

                <TabsContent value="link" className="p-3 space-y-2 bg-background/20">
                  <Label htmlFor="adv-ex-link" className="text-[11px] text-muted-foreground">Cole o link do YouTube, Shorts, Instagram ou TikTok</Label>
                  <Input
                    id="adv-ex-link"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={videoUrlInput}
                    onChange={(e) => {
                      setVideoUrlInput(e.target.value)
                      setVideoFile(null)
                    }}
                  />
                </TabsContent>

                <TabsContent value="upload" className="p-3 space-y-2 bg-background/20">
                  <Label className="text-[11px] text-muted-foreground">Faça o upload do seu próprio vídeo (.mp4 ou .mov, máx 50MB)</Label>
                  
                  {videoFile ? (
                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-primary/20 bg-primary/5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileVideo size={18} className="text-primary shrink-0" />
                        <span className="text-xs font-medium truncate max-w-[200px]">{videoFile.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 hover:bg-primary/10 rounded-full"
                        onClick={() => {
                          setVideoFile(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border/70 hover:border-primary/50 rounded-lg p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/30 transition-all text-center"
                    >
                      <Upload size={22} className="text-muted-foreground group-hover:text-primary transition-colors" />
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold">Clique para selecionar</p>
                        <p className="text-[10px] text-muted-foreground">Arraste um vídeo ou selecione da galeria</p>
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 52428800) {
                          toast({
                            title: 'Arquivo muito grande',
                            description: 'O vídeo não deve passar de 50MB.',
                            variant: 'destructive',
                          })
                          return
                        }
                        setVideoFile(file)
                        setVideoUrlInput('')
                      }
                    }}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => {
                setDialogOpen(false)
                setVideoFile(null)
                setVideoUrlInput('')
              }}
              disabled={creatingExercise || uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateAdvancedExercise}
              disabled={creatingExercise || uploading}
              className="gap-1.5"
            >
              {creatingExercise || uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {uploading ? 'Enviando vídeo...' : 'Salvando...'}
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Criar Exercício
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
