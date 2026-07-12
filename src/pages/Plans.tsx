import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getSubscription, upsertSubscription } from '@/services/subscriptions'
import { PLANS } from '@/lib/plans'
import { PlanCard } from '@/components/PlanCard'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function Plans() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [currentPlan, setCurrentPlan] = useState<string>('free')
  const [selectedPlan, setSelectedPlan] = useState<string>('free')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!user) return
    getSubscription(user.id).then(({ data }) => {
      if (data) {
        setCurrentPlan(data.plan_type)
        setSelectedPlan(data.plan_type)
      }
      setLoading(false)
    })
  }, [user])

  const handleSelect = async (planId: string) => {
    setSelectedPlan(planId)
    if (!user || planId === currentPlan) return
    setUpdating(true)
    const { error } = await upsertSubscription(user.id, planId)
    setUpdating(false)
    if (error) {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' })
    } else {
      setCurrentPlan(planId)
      toast({
        title: 'Plano atualizado!',
        description: `Você está no plano ${planId.toUpperCase()}.`,
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Planos</h1>
        <p className="text-muted-foreground">Escolha o plano ideal para o seu crescimento.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isSelected={selectedPlan === plan.id}
            isCurrent={currentPlan === plan.id}
            onSelect={() => handleSelect(plan.id)}
          />
        ))}
      </div>
      {updating && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="animate-spin" size={16} />
          <span className="text-sm">Atualizando plano...</span>
        </div>
      )}
    </div>
  )
}
