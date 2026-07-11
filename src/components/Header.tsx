import { useState } from 'react'
import { Bell, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { QuickAddModal } from './QuickAddModal'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <header className="h-20 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
      <div>
        <h1 className="text-2xl font-bold md:hidden bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Crescimento
        </h1>
        <h2 className="text-xl font-semibold hidden md:block text-foreground">Visão Geral</h2>
      </div>

      <div className="flex items-center gap-4">
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
        <Avatar className="h-10 w-10 border-2 border-primary/20">
          <AvatarImage
            src="https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1"
            alt="Usuário"
          />
          <AvatarFallback>US</AvatarFallback>
        </Avatar>
      </div>

      <QuickAddModal open={modalOpen} setOpen={setModalOpen} />
    </header>
  )
}
