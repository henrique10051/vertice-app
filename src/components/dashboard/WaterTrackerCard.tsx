import { Droplets, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface WaterTrackerCardProps {
  current: number
  goal: number
  onAdd: (ml: number) => void
}

export function WaterTrackerCard({ current, goal, onAdd }: WaterTrackerCardProps) {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0
  const quickAdd = [200, 500, 1000]

  return (
    <Card className="glass-card rounded-2xl border-none shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Droplets className="text-blue-500" />
          Água
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-2xl font-bold">{(current / 1000).toFixed(1)}L</span>
            <span className="text-sm text-muted-foreground ml-1">
              / {(goal / 1000).toFixed(1)}L
            </span>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {Math.round(percentage)}%
          </span>
        </div>
        <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex gap-2">
          {quickAdd.map((ml) => (
            <Button
              key={ml}
              variant="outline"
              size="sm"
              onClick={() => onAdd(ml)}
              className="flex-1 gap-1 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/30"
            >
              <Plus size={14} />
              {ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
