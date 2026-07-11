import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Plus, Sparkles, User, LogOut } from 'lucide-react'
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
import { useAuth } from '@/hooks/use-auth'

export function Header() {
  const [modalOpen, setModalOpen] = useState(false)
  const { user, signOut } = useAuth()

  return (
    <header className="h-20 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
      <div>
        <h1 className="text-2xl font-bold md:hidden flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground">
            <Sparkles size={16} />
          </span>
          Lumi
        </h1>
        <h2 className="text-xl font-semibold hidden md:block text-foreground">Visão Geral</h2>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <ThemeToggle />
        <Button
          variant="outline"
          size="icon"
          className="rounded-full shadow-sm hover:shadow-md transition-shadow relative"
        >
          <Bell size={20} className="text-muted-foreground" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
        </Button>
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
