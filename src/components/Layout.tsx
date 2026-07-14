import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Header } from './Header'
import { AIMentorChat } from './AIMentorChat'
import { VoiceCommandButton } from './VoiceCommandButton'
import useMainStore from '@/stores/main'
import { cn } from '@/lib/utils'

export default function Layout() {
  const { sidebarCollapsed } = useMainStore()

  return (
    <div className="min-h-screen bg-background topo-lines flex flex-col md:flex-row">
      <Sidebar />
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300 ease-in-out min-h-screen',
          sidebarCollapsed ? 'md:ml-20' : 'md:ml-64',
        )}
      >
        <Header />
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 animate-fade-in-up">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <AIMentorChat />
      <VoiceCommandButton />
    </div>
  )
}
