import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ListChecks, Wallet, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: 'Início', icon: LayoutDashboard },
  { path: '/habitos', label: 'Hábitos', icon: ListChecks },
  { path: '/financas', label: 'Finanças', icon: Wallet },
  { path: '/perfil', label: 'Perfil', icon: User },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-white/20 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon size={24} className={cn(isActive && 'animate-pop')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
