import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ListChecks, Wallet, CalendarDays, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: 'Início', icon: LayoutDashboard },
  { path: '/habitos', label: 'Hábitos', icon: ListChecks },
  { path: '/agenda', label: 'Agenda', icon: CalendarDays },
  { path: '/financas', label: 'Finanças', icon: Wallet },
  { path: '/perfil', label: 'Perfil', icon: User },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/85 backdrop-blur-xl border-t border-border/70 flex items-center justify-around px-2 py-2">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path
        const Icon = item.icon
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'flex items-center justify-center rounded-full px-4 py-1 transition-colors',
                isActive ? 'bg-primary/12' : 'bg-transparent',
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            </span>
            <span className="text-[11px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
