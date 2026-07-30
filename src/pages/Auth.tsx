import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, MailCheck, Eye, EyeOff, TrendingUp, Wallet, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

const PILLARS = [
  { icon: TrendingUp, label: 'Hábitos' },
  { icon: Wallet, label: 'Finanças' },
  { icon: Target, label: 'Metas' },
]

export default function Auth() {
  const navigate = useNavigate()
  const { user, signIn, signUp, resendConfirmation, loading } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
      if (!consent) {
        setError('Você precisa aceitar a Política de Privacidade para criar uma conta.')
        setSubmitting(false)
        return
      }
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
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      {/* Brand panel — hidden on small screens, the calm-ascent story on md+ */}
      <div className="hidden md:flex relative flex-col justify-between overflow-hidden bg-[hsl(213_40%_8%)] text-[hsl(200_22%_92%)] p-12 topo-lines">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(circle at 20% 100%, hsl(var(--primary) / 0.35), transparent 60%)',
          }}
        />
        <div className="relative flex items-center gap-3">
          <img src="/logo.png" alt="Vértice" className="w-9 h-9 rounded-lg" />
          <span className="font-display text-lg font-bold tracking-tight">Vértice</span>
        </div>

        <div className="relative max-w-sm">
          <h1 className="font-display text-4xl font-bold tracking-tight text-balance leading-tight">
            Um só painel para enxergar sua subida inteira.
          </h1>
          <p className="mt-4 text-[hsl(200_22%_92%)]/70 leading-relaxed">
            Hábitos, finanças e metas, cruzados por um coach de IA que conecta os pontos que
            nenhum app isolado consegue ver.
          </p>
          <ul className="mt-8 flex flex-col gap-3">
            {PILLARS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-3 text-sm text-[hsl(200_22%_92%)]/80"
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[hsl(200_22%_92%)]/10">
                  <Icon size={16} strokeWidth={2.25} />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-[hsl(200_22%_92%)]/50">
          Progresso calmo, sem euforia. Feito para o dia a dia real.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 md:hidden flex items-center gap-3">
            <img src="/logo.png" alt="Vértice" className="w-10 h-10 rounded-xl" />
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight">Vértice</h1>
              <p className="text-sm text-muted-foreground">Seu sistema de crescimento pessoal</p>
            </div>
          </div>

          <div className="mb-6 hidden md:block">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              {mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === 'login'
                ? 'Entre para continuar sua subida.'
                : 'Leva menos de um minuto.'}
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Entrar ou cadastrar"
            className="flex gap-1 mb-7 border-b border-border"
          >
            <button
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => setMode('login')}
              className={cn(
                'flex-1 pb-3 text-sm font-medium transition-colors duration-150 ease-out-quart border-b-2 -mb-px',
                mode === 'login'
                  ? 'text-foreground border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground',
              )}
            >
              Entrar
            </button>
            <button
              role="tab"
              aria-selected={mode === 'signup'}
              onClick={() => setMode('signup')}
              className={cn(
                'flex-1 pb-3 text-sm font-medium transition-colors duration-150 ease-out-quart border-b-2 -mb-px',
                mode === 'signup'
                  ? 'text-foreground border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground',
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
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'login' && (
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
            )}

            {mode === 'signup' && (
              <div className="flex items-start gap-2">
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(checked === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="consent" className="text-sm font-normal leading-snug">
                  Li e aceito a{' '}
                  <Link to="/privacidade" target="_blank" className="text-primary hover:underline">
                    Política de Privacidade e Termos de Uso
                  </Link>
                  .
                </Label>
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

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || (mode === 'signup' && !consent)}
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : mode === 'login' ? (
                'Entrar'
              ) : (
                'Criar Conta'
              )}
            </Button>
          </form>

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
