import { useState } from 'react'
import { Flame, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface CalorieTrackerCardProps {
  consumed: number
  goal: number
  onAdd: (cal: number) => void
}

export function CalorieTrackerCard({ consumed, goal, onAdd }: CalorieTrackerCardProps) {
  const [input, setInput] = useState('')
  const remaining = Math.max(goal - consumed, 0)
  const percentage = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0
  const over = consumed > goal

  const handleAdd = () => {
    const cal = Number(input)
    if (!cal || cal <= 0) return
    onAdd(cal)
    setInput('')
  }

  return (
    <Card className="glass-card rounded-2xl border-none shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Flame className="text-orange-500" />
          Calorias
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <span className={over ? 'text-2xl font-bold text-rose-500' : 'text-2xl font-bold'}>
              {remaining}
            </span>
            <span className="text-sm text-muted-foreground ml-1">kcal restantes</span>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {consumed} / {goal}
          </span>
        </div>
        <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
          <div
            className={
              over
                ? 'bg-rose-500 h-full rounded-full transition-all duration-500'
                : 'bg-gradient-to-r from-orange-400 to-orange-600 h-full rounded-full transition-all duration-500'
            }
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Calorias"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1"
          />
          <Button onClick={handleAdd} size="sm" className="gap-1">
            <Plus size={14} />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
