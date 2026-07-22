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
  Mountain,
  ShoppingCart,
  Timer,
  CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import useMainStore from '@/stores/main'

const navItems = [
  { path: '/', label: 'Início', icon: LayoutDashboard },
  { path: '/habitos', label: 'Hábitos', icon: ListChecks },
  { path: '/agenda', label: 'Agenda', icon: CalendarDays },
  { path: '/objetivos', label: 'Objetivos', icon: Target },
  { path: '/financas', label: 'Finanças', icon: Wallet },
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
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
              <Mountain size={18} strokeWidth={2.5} />
            </span>
            Vértice
          </span>
        )}
        {sidebarCollapsed && (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
            <Mountain size={18} strokeWidth={2.5} />
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted/50"
        >
          {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
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
    </aside>
  )
}
