import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import useHealthStore from '@/stores/useHealthStore'
import {
  calculateDailyCalories,
  calculateWaterGoal,
  ACTIVITY_LEVELS,
  type Gender,
  type ActivityLevel,
} from '@/lib/health-utils'
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
import { WaterTrackerCard } from '@/components/dashboard/WaterTrackerCard'
import { CalorieTrackerCard } from '@/components/dashboard/CalorieTrackerCard'
import { ArrowLeft, Save, Activity } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function HealthPage() {
  const { healthLog, healthProfile, loading, addWater, addCalories, updateHealthProfile } =
    useHealthStore()
  const { toast } = useToast()

  const [editing, setEditing] = useState(false)
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<Gender>('male')
  const [activity, setActivity] = useState<ActivityLevel>('sedentary')

  const isConfigured = healthProfile?.weight_kg && healthProfile?.height_cm && healthProfile?.age

  useEffect(() => {
    if (healthProfile) {
      setWeight(healthProfile.weight_kg?.toString() || '')
      setHeight(healthProfile.height_cm?.toString() || '')
      setAge(healthProfile.age?.toString() || '')
      setGender((healthProfile.gender as Gender) || 'male')
      setActivity((healthProfile.activity_level as ActivityLevel) || 'sedentary')
    }
  }, [healthProfile])

  const calorieGoal = isConfigured
    ? calculateDailyCalories(Number(weight), Number(height), Number(age), gender, activity)
    : 0
  const waterGoal = isConfigured ? calculateWaterGoal(Number(weight)) : 2000

  const handleSave = async () => {
    await updateHealthProfile({
      weight_kg: Number(weight),
      height_cm: Number(height),
      age: Number(age),
      gender,
      activity_level: activity,
    })
    setEditing(false)
    toast({
      title: 'Perfil de saúde salvo!',
      description: `Meta calórica: ${calorieGoal} kcal/dia`,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Activity className="animate-pulse text-primary" size={32} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft size={16} /> Voltar
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Saúde</h1>
        <p className="text-muted-foreground">Acompanhe suas calorias e hidratação diárias.</p>
      </div>

      {!isConfigured || editing ? (
        <Card className="glass-card rounded-3xl border-none shadow-soft">
          <CardHeader>
            <CardTitle>Configurar Perfil de Saúde</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Peso (kg)</Label>
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="70"
                />
              </div>
              <div className="space-y-2">
                <Label>Altura (cm)</Label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="170"
                />
              </div>
              <div className="space-y-2">
                <Label>Idade</Label>
                <Input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label>Gênero</Label>
                <Select value={gender} onValueChange={(v: any) => setGender(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nível de Atividade</Label>
              <Select value={activity} onValueChange={(v: any) => setActivity(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_LEVELS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isConfigured && (
              <div className="bg-primary/10 text-primary p-4 rounded-xl text-sm">
                Meta calórica diária: <strong>{calorieGoal} kcal</strong> · Meta de água:{' '}
                <strong>{(waterGoal / 1000).toFixed(1)}L</strong>
              </div>
            )}
            <Button onClick={handleSave} className="w-full gap-2">
              <Save size={18} /> Salvar Perfil
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CalorieTrackerCard
              consumed={healthLog?.calories_consumed || 0}
              goal={calorieGoal}
              onAdd={addCalories}
            />
            <WaterTrackerCard
              current={healthLog?.water_intake_ml || 0}
              goal={waterGoal}
              onAdd={addWater}
            />
          </div>
          <Card className="glass-card rounded-2xl border-none shadow-soft">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="text-sm">
                <p className="font-medium">
                  Perfil: {weight}kg · {height}cm · {age} anos
                </p>
                <p className="text-muted-foreground">
                  Meta: {calorieGoal} kcal · {(waterGoal / 1000).toFixed(1)}L água
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Editar
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
