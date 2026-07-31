import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ListChecks,
  Target,
  Wallet,
  CreditCard,
  User,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingCart,
  Timer,
  CalendarDays,
  Dumbbell,
  BookOpen,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import useMainStore from '@/stores/main'
import { Button } from '@/components/ui/button'

const navItems = [
  { path: '/', label: 'Início', icon: LayoutDashboard },
  { path: '/habitos', label: 'Hábitos', icon: ListChecks },
  { path: '/agenda', label: 'Agenda', icon: CalendarDays },
  { path: '/objetivos', label: 'Objetivos', icon: Target },
  { path: '/financas', label: 'Finanças', icon: Wallet },
  { path: '/treino', label: 'Treino', icon: Dumbbell },
  { path: '/leitura', label: 'Leitura', icon: BookOpen },
  { path: '/mercado', label: 'Mercado', icon: ShoppingCart },
  { path: '/pomodoro', label: 'Pomodoro', icon: Timer },
  { path: '/planos', label: 'Planos', icon: CreditCard },
  { path: '/mentor', label: 'Mentor IA', icon: Bot },
  { path: '/perfil', label: 'Perfil', icon: User },
]

export function Sidebar() {
  const location = useLocation()
  const { sidebarCollapsed, toggleSidebar } = useMainStore()

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out border-r border-sidebar-border bg-sidebar hidden md:flex flex-col',
        sidebarCollapsed ? 'w-20' : 'w-64',
      )}
    >
      <div className="flex items-center justify-between p-6 h-20">
        {!sidebarCollapsed && (
          <span className="font-display text-lg font-bold flex items-center gap-2.5 tracking-tight">
            <img src="/logo.png" alt="Vértice" className="w-8 h-8 rounded-lg" />
            Vértice
          </span>
        )}
        {sidebarCollapsed && <img src="/logo.png" alt="Vértice" className="w-8 h-8 rounded-lg" />}
        <button
          onClick={toggleSidebar}
          className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted/50"
        >
          {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'relative flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground',
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary" />
              )}
              <Icon
                size={22}
                className={cn(
                  'transition-transform group-hover:scale-110',
                  isActive && 'animate-pop',
                )}
              />
              {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border/60 shrink-0 flex flex-col items-center gap-2">
        {!sidebarCollapsed ? (
          <div className="p-4 w-full border border-border/50 rounded-xl bg-muted/20 flex flex-col items-center text-center gap-2">
            <span className="text-xs font-semibold text-foreground">Gostando do Vértice?</span>
            <p className="text-[11px] text-muted-foreground leading-normal">
              Sua opinião nos ajuda a melhorar constantemente.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.dispatchEvent(new CustomEvent('open-feedback'))}
              className="w-full text-xs font-semibold mt-1 bg-background hover:bg-muted/80"
            >
              Deixar Feedback
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.dispatchEvent(new CustomEvent('open-feedback'))}
            className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 h-10 w-10 flex items-center justify-center transition-colors"
            title="Deixar Feedback"
          >
            <MessageSquare size={20} />
          </Button>
        )}
      </div>
    </aside>
  )
}
