import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ListChecks, Wallet, CreditCard, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: 'Início', icon: LayoutDashboard },
  { path: '/habitos', label: 'Hábitos', icon: ListChecks },
  { path: '/financas', label: 'Finanças', icon: Wallet },
  { path: '/planos', label: 'Planos', icon: CreditCard },
  { path: '/perfil', label: 'Perfil', icon: User },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t flex items-center justify-around px-2 py-2">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path
        const Icon = item.icon
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Icon size={22} />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
