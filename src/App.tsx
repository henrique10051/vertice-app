import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
import NotFound from '@/pages/NotFound'

const App = () => (
  <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/habitos" element={<Habits />} />
            <Route path="/objetivos" element={<Goals />} />
            <Route path="/financas" element={<Finances />} />
            <Route path="/mentor" element={<Mentor />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </NextThemesProvider>
)

export default App
