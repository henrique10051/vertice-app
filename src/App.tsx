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
import { getProfile, type Profile as ProfileData } from '@/services/profiles'

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
          <BrowserRouter>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/auth" element={<Auth />} />
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
                  <Route path="/planos" element={<Plans />} />
                  <Route path="/saude" element={<Health />} />
                  <Route path="/mentor" element={<Mentor />} />
                  <Route path="/perfil" element={<Profile />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </BrowserRouter>
        </HealthProvider>
      </DataProvider>{' '}
    </AuthProvider>
  </NextThemesProvider>
)

export default App
