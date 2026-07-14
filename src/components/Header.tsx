import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Plus, Mountain, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { QuickAddModal } from './QuickAddModal'
import { ThemeToggle } from './ThemeToggle'
import { NotificationBell } from './NotificationBell'
import { useAuth } from '@/hooks/use-auth'

const pageTitles: Record<string, string> = {
  '/': 'Visão Geral',
  '/habitos': 'Hábitos',
  '/objetivos': 'Objetivos',
  '/financas': 'Finanças',
  '/mercado': 'Mercado',
  '/pomodoro': 'Foco',
  '/planos': 'Planos',
  '/mentor': 'Mentor IA',
  '/perfil': 'Perfil',
  '/saude': 'Saúde',
  '/agenda': 'Agenda',
}

export function Header() {
  const [modalOpen, setModalOpen] = useState(false)
  const { user, signOut } = useAuth()
  const location = useLocation()
  const title = pageTitles[location.pathname] ?? 'Vértice'

  return (
    <header className="h-20 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 bg-background/70 backdrop-blur-xl border-b border-border/70">
      <div>
        <h1 className="font-display text-2xl font-bold md:hidden flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground">
            <Mountain size={16} strokeWidth={2.5} />
          </span>
          Vértice
        </h1>
        <div className="hidden md:block">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Vértice
          </p>
          <h2 className="font-display text-xl font-semibold text-foreground leading-tight">
            {title}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <ThemeToggle />
        <NotificationBell />
        <Button
          onClick={() => setModalOpen(true)}
          className="rounded-full gap-2 shadow-soft hover:shadow-elevation transition-all group px-4"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="hidden sm:inline">Adicionar</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full focus:outline-none">
              <Avatar className="h-10 w-10 border-2 border-primary/20 cursor-pointer">
                <AvatarImage
                  src="https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1"
                  alt="Usuário"
                />
                <AvatarFallback>{user?.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Minha Conta</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/perfil" className="flex items-center gap-2 cursor-pointer">
                <User size={16} />
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="flex items-center gap-2 cursor-pointer text-rose-500"
            >
              <LogOut size={16} />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <QuickAddModal open={modalOpen} setOpen={setModalOpen} />
    </header>
  )
}
