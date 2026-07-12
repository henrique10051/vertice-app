import { useState, useEffect } from 'react'
import { Plus, Trash2, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { getStudyRoadmap, updateStudyRoadmap, type StudyStep } from '@/services/study-roadmap'

export function StudyRoadmap({ userId }: { userId: string }) {
  const [steps, setSteps] = useState<StudyStep[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    getStudyRoadmap(userId).then((data) => {
      setSteps(data)
      setLoading(false)
    })
  }, [userId])

  const persist = async (updated: StudyStep[]) => {
    setSteps(updated)
    await updateStudyRoadmap(userId, updated)
  }

  const addStep = async () => {
    if (!newTitle.trim()) return
    const newStep: StudyStep = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      completed: false,
      order: steps.length,
    }
    await persist([...steps, newStep])
    setNewTitle('')
  }

  const toggleStep = async (id: string) => {
    await persist(steps.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)))
  }

  const deleteStep = async (id: string) => {
    await persist(steps.filter((s) => s.id !== id))
  }

  const completedCount = steps.filter((s) => s.completed).length

  return (
    <Card className="glass-card rounded-3xl border-none shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="text-primary" size={20} />
          Roteiro de Estudos
          {steps.length > 0 && (
            <span className="text-sm text-muted-foreground ml-auto">
              {completedCount}/{steps.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Novo tópico de estudo..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addStep()}
          />
          <Button onClick={addStep} size="icon" disabled={!newTitle.trim()}>
            <Plus size={18} />
          </Button>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
        ) : steps.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Adicione tópicos para criar seu roteiro de estudos.
          </p>
        ) : (
          <div className="space-y-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl bg-muted/50 transition-all',
                  step.completed && 'opacity-60',
                )}
              >
                <Checkbox checked={step.completed} onCheckedChange={() => toggleStep(step.id)} />
                <span className={cn('flex-1 text-sm', step.completed && 'line-through')}>
                  {step.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteStep(step.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
