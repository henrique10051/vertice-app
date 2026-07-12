import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from '@/components/Layout'
import Index from '@/pages/Index'
import Habits from '@/pages/Habits'
import Goals from '@/pages/Goals'
import Finances from '@/pages/Finances'
import Mentor from '@/pages/Mentor'
import Profile from '@/pages/Profile'
import Auth from '@/pages/Auth'
import NotFound from '@/pages/NotFound'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { DataProvider } from '@/providers/data-provider'
import { HealthProvider } from '@/providers/health-provider'
import { ReactNode, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import Plans from '@/pages/Plans'
import Onboarding from '@/pages/Onboarding'
import Health from '@/pages/Health'
import Mercado from '@/pages/Mercado'
import Pomodoro from '@/pages/Pomodoro'
import { InventoryProvider } from '@/hooks/use-inventory'
import { AgendaProvider } from '@/hooks/use-agenda'
import { NotificationProvider } from '@/hooks/use-notifications'
import { NotificationGenerator } from '@/components/NotificationGenerator'
import { getProfile, type Profile as ProfileData } from '@/services/profiles'
import ForgotPassword from '@/pages/ForgotPassword'
import UpdatePassword from '@/pages/UpdatePassword'
import AgendaPage from '@/pages/Agenda'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/auth" replace />
  }
  return <>{children}</>
}

function RequireOnboarding({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!user) {
      setChecking(false)
      return
    }
    getProfile(user.id).then(({ data }) => {
      setProfile(data)
      setChecking(false)
    })
  }, [user])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  if (!profile?.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}

const App = () => (
  <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <AuthProvider>
      <DataProvider>
        <HealthProvider>
          <InventoryProvider>
            <AgendaProvider>
              <NotificationProvider>
                <NotificationGenerator />
                <BrowserRouter>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <Routes>
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/update-password" element={<UpdatePassword />} />
                      <Route
                        path="/onboarding"
                        element={
                          <ProtectedRoute>
                            <Onboarding />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        element={
                          <ProtectedRoute>
                            <RequireOnboarding>
                              <Layout />
                            </RequireOnboarding>
                          </ProtectedRoute>
                        }
                      >
                        <Route path="/" element={<Index />} />
                        <Route path="/habitos" element={<Habits />} />
                        <Route path="/objetivos" element={<Goals />} />
                        <Route path="/financas" element={<Finances />} />
                        <Route path="/mercado" element={<Mercado />} />
                        <Route path="/pomodoro" element={<Pomodoro />} />
                        <Route path="/planos" element={<Plans />} />
                        <Route path="/agenda" element={<AgendaPage />} />
                        <Route path="/saude" element={<Health />} />
                        <Route path="/mentor" element={<Mentor />} />
                        <Route path="/perfil" element={<Profile />} />
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </TooltipProvider>
                </BrowserRouter>
              </NotificationProvider>
            </AgendaProvider>
          </InventoryProvider>{' '}
        </HealthProvider>
      </DataProvider>
    </AuthProvider>
  </NextThemesProvider>
)

export default App
