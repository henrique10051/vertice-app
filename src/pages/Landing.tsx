import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Sparkles, Timer, ShoppingCart, Brain, ArrowRight, Check, BarChart3 } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'Mentor IA',
    desc: 'Planos de estudo personalizados com IA para múltiplos objetivos.',
  },
  {
    icon: Timer,
    title: 'Pomodoro Automático',
    desc: 'Timer configurável com transições automáticas de sessão.',
  },
  {
    icon: ShoppingCart,
    title: 'Inventário Inteligente',
    desc: 'Controle doméstico com alertas e exportação para WhatsApp.',
  },
]

const details = [
  {
    icon: Brain,
    color: 'text-primary',
    bg: 'bg-primary/5',
    title: 'Mentor IA',
    desc: 'Defina múltiplos objetivos e receba um plano de ação personalizado. Nossa IA cria trilhas de estudo e hábitos sob medida.',
    points: [
      'Hábitos rastreados com gráficos de consistência',
      'Mentoria para múltiplos objetivos simultâneos',
    ],
  },
  {
    icon: Timer,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/5',
    title: 'Pomodoro Automático',
    desc: 'Personalize durações de foco, pausas curtas e longas. Transições automáticas entre sessões para máxima produtividade.',
    points: ['Durações totalmente configuráveis', 'Cronograma de estudo otimizado'],
  },
  {
    icon: ShoppingCart,
    color: 'text-amber-500',
    bg: 'bg-amber-500/5',
    title: 'Inventário Inteligente',
    desc: 'Controle itens de casa, receba alertas de estoque baixo e exporte sua lista de compras direto para o WhatsApp.',
    points: ['Alertas de estoque baixo', 'Exportação automática para WhatsApp'],
  },
]

const stats = [
  { v: '84', l: 'Dias rastreados' },
  { v: '12h', l: 'Foco total' },
  { v: '95%', l: 'Consistência' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <nav className="flex items-center justify-between px-6 lg:px-12 py-4 sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
            <Sparkles size={18} />
          </span>
          <span className="font-bold text-lg">Vértice</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link to="/auth">Entrar</Link>
          </Button>
          <Button asChild>
            <Link to="/auth">Começar Agora</Link>
          </Button>
        </div>
      </nav>

      <section className="px-6 lg:px-12 py-20 lg:py-32 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in-up">
          <Sparkles size={14} /> Plataforma de Crescimento Pessoal
        </div>
        <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6 animate-fade-in-up">
          Transforme sua rotina em <span className="text-primary">resultados</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in-up">
          Organize hábitos, finanças, estudos e saúde em um só lugar. Com IA mentor, Pomodoro
          automático e inventário inteligente.
        </p>
        <Button size="lg" className="gap-2 animate-fade-in-up" asChild>
          <Link to="/auth">
            Começar Gratuitamente <ArrowRight size={18} />
          </Link>
        </Button>
      </section>

      <section className="px-6 lg:px-12 py-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="glass-card border-none shadow-soft">
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                  <f.icon size={24} />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-6 lg:px-12 py-16 max-w-6xl mx-auto space-y-16">
        {details.map((f, i) => (
          <div key={f.title} className="grid md:grid-cols-2 gap-8 items-center">
            <div className={i % 2 === 1 ? 'md:order-2' : ''}>
              <div className={`inline-flex items-center gap-2 ${f.color} mb-3`}>
                <f.icon size={20} />
                <span className="font-medium">{f.title}</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-4">{f.title}</h2>
              <p className="text-muted-foreground mb-4">{f.desc}</p>
              <ul className="space-y-2">
                {f.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm">
                    <Check size={16} className={f.color} /> {p}
                  </li>
                ))}
              </ul>
            </div>
            <Card
              className={`glass-card border-none shadow-glass ${i % 2 === 1 ? 'md:order-1' : ''}`}
            >
              <CardContent
                className={`p-8 ${f.bg} rounded-2xl flex flex-col items-center justify-center min-h-[200px]`}
              >
                <f.icon size={48} className={f.color} />
                <p className="mt-4 text-sm text-muted-foreground text-center">{f.points[0]}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </section>

      <section className="px-6 lg:px-12 py-20 text-center max-w-3xl mx-auto">
        <BarChart3 size={48} className="mx-auto text-primary mb-4" />
        <h2 className="text-3xl font-bold mb-4">Acompanhe sua evolução</h2>
        <p className="text-muted-foreground mb-8">
          Dashboard com analytics completos: heatmap de hábitos, horas de foco e status do
          inventário.
        </p>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.l} className="text-center">
              <div className="text-3xl font-bold text-primary">{s.v}</div>
              <div className="text-xs text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
        <Button size="lg" className="gap-2" asChild>
          <Link to="/auth">
            Começar Agora <ArrowRight size={18} />
          </Link>
        </Button>
      </section>

      <footer className="px-6 lg:px-12 py-8 border-t">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground">
              <Sparkles size={14} />
            </span>
            <span className="font-bold">Vértice</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Vértice. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
