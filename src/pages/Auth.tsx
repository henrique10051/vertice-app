import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mountain, Loader2, MailCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Auth() {
  const navigate = useNavigate()
  const { user, signIn, signUp, resendConfirmation, loading } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSignupSuccess(false)
    setEmailNotConfirmed(false)
    setResendSuccess(false)
    setSubmitting(true)
    if (mode === 'signup') {
      const { error } = await signUp(email, password, fullName)
      if (error) {
        setError(error.message)
      } else {
        setSignupSuccess(true)
      }
    } else {
      const { error } = await signIn(email, password)
      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setEmailNotConfirmed(true)
          setError(
            'Seu email ainda não foi confirmado. Verifique sua caixa de entrada ou clique abaixo para reenviar o email de confirmação.',
          )
        } else {
          setError(error.message)
        }
      }
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background topo-lines p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-glow">
            <Mountain size={30} strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Vértice</h1>
          <p className="text-muted-foreground mt-1">Seu sistema de crescimento pessoal</p>
        </div>

        <div className="bg-card rounded-2xl shadow-elevation p-8 border border-border/70">
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

            {mode === 'login' && (
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
            )}

            {error && (
              <p className="text-sm text-rose-500 bg-rose-500/10 rounded-lg p-3">{error}</p>
            )}

            {emailNotConfirmed && mode === 'login' && (
              <div className="space-y-2">
                {resendSuccess ? (
                  <p className="text-sm text-emerald-600 bg-emerald-500/10 rounded-lg p-3 flex items-center gap-2">
                    <MailCheck size={18} className="shrink-0" /> Email de confirmação reenviado!
                    Verifique sua caixa de entrada.
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={resending}
                    onClick={async () => {
                      setResending(true)
                      setResendSuccess(false)
                      const { error } = await resendConfirmation(email)
                      if (!error) {
                        setResendSuccess(true)
                      } else {
                        setError(error.message)
                      }
                      setResending(false)
                    }}
                  >
                    {resending ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      'Reenviar Email de Confirmação'
                    )}
                  </Button>
                )}
              </div>
            )}

            {signupSuccess && (
              <div className="flex items-start gap-2 text-sm text-emerald-600 bg-emerald-500/10 rounded-lg p-3">
                <MailCheck size={18} className="shrink-0 mt-0.5" />
                <span>
                  Conta criada! Verifique seu email para confirmar o cadastro, ou faça login se a
                  confirmação não for necessária.
                </span>
              </div>
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

          {signupSuccess && (
            <Button
              variant="outline"
              className="w-full mt-3"
              onClick={() => {
                setMode('login')
                setSignupSuccess(false)
              }}
            >
              Ir para o login
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
