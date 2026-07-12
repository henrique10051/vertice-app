import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Auth() {
  const navigate = useNavigate()
  const { user, signIn, signUp, loading } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    if (mode === 'signup') {
      const { error } = await signUp(email, password, fullName)
      if (error) setError(error.message)
    } else {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-slate-50 to-indigo-50 dark:from-primary/10 dark:via-slate-950 dark:to-indigo-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg">
            <Sparkles size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Vértice</h1>
          <p className="text-muted-foreground mt-1">Seu sistema de crescimento pessoal</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-border/50">
          <div className="flex gap-2 mb-6 bg-muted/50 rounded-xl p-1">
            <button
              onClick={() => setMode('login')}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                mode === 'login'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground',
              )}
            >
              Entrar
            </button>
            <button
              onClick={() => setMode('signup')}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                mode === 'signup'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground',
              )}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-rose-500 bg-rose-500/10 rounded-lg p-3">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : mode === 'login' ? (
                'Entrar'
              ) : (
                'Criar Conta'
              )}
            </Button>
          </form>

          {mode === 'login' && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Demo: hlima10051@gmail.com / Skip@Pass
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
