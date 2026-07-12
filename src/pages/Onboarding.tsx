import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { getProfile, updateProfile } from '@/services/profiles'
import { upsertSubscription } from '@/services/subscriptions'
import { PLANS } from '@/lib/plans'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Wallet,
  ListChecks,
  Target,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const goals = [
  { id: 'financial', label: 'Controle Financeiro', desc: 'Organize suas finanças.', icon: Wallet },
  {
    id: 'habits',
    label: 'Construção de Hábitos',
    desc: 'Desenvolva rotinas saudáveis.',
    icon: ListChecks,
  },
  { id: 'both', label: 'Ambos', desc: 'Equilibre finanças e hábitos.', icon: Target },
]

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [goal, setGoal] = useState('')
  const [fullName, setFullName] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('free')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) return
    getProfile(user.id).then(({ data }) => {
      if (data?.full_name) setFullName(data.full_name)
    })
  }, [user])

  const handleFinish = async () => {
    if (!user) return
    setSubmitting(true)
    await updateProfile(user.id, { full_name: fullName, onboarding_completed: true })
    await upsertSubscription(user.id, selectedPlan)
    setSubmitting(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-slate-50 to-indigo-50 dark:from-primary/10 dark:via-slate-950 dark:to-indigo-950 p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                s === step ? 'w-8 bg-primary' : s < step ? 'w-2 bg-primary' : 'w-2 bg-muted',
              )}
            />
          ))}
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-border/50">
          {step === 1 && (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4">
                <Sparkles size={32} />
              </div>
              <h1 className="text-2xl font-bold">Bem-vindo ao Vértice!</h1>
              <p className="text-muted-foreground">
                Vamos configurar seu perfil para uma experiência personalizada.
              </p>
              <Button onClick={() => setStep(2)} className="gap-2 mt-4">
                Começar <ArrowRight size={18} />
              </Button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Quais são seus principais objetivos?</h2>
              <div className="space-y-3">
                {goals.map((g) => {
                  const Icon = g.icon
                  return (
                    <button
                      key={g.id}
                      onClick={() => setGoal(g.id)}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left',
                        goal === g.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50',
                      )}
                    >
                      <Icon
                        size={24}
                        className={goal === g.id ? 'text-primary' : 'text-muted-foreground'}
                      />
                      <div>
                        <p className="font-medium">{g.label}</p>
                        <p className="text-sm text-muted-foreground">{g.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                  <ArrowLeft size={18} /> Voltar
                </Button>
                <Button onClick={() => setStep(3)} disabled={!goal} className="gap-2 flex-1">
                  Continuar <ArrowRight size={18} />
                </Button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Como você se chama?</h2>
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                  <ArrowLeft size={18} /> Voltar
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  disabled={!fullName.trim()}
                  className="gap-2 flex-1"
                >
                  Continuar <ArrowRight size={18} />
                </Button>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Escolha seu plano</h2>
              <p className="text-sm text-muted-foreground">Você pode alterar a qualquer momento.</p>
              <div className="space-y-3">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={cn(
                      'w-full p-4 rounded-xl border text-left transition-all',
                      selectedPlan === plan.id
                        ? 'border-primary bg-primary/5 ring-2 ring-primary'
                        : 'border-border hover:bg-muted/50',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{plan.name}</p>
                        <p className="text-sm text-muted-foreground">{plan.price}</p>
                      </div>
                      {selectedPlan === plan.id && <Check size={20} className="text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{plan.description}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(3)} className="gap-2">
                  <ArrowLeft size={18} /> Voltar
                </Button>
                <Button onClick={handleFinish} disabled={submitting} className="gap-2 flex-1">
                  {submitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      Finalizar <ArrowRight size={18} />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
