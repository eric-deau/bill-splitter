import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/hooks/useAuth'
import { Layout } from '@/components/layout/Layout'
import { ToastContainer } from '@/components/ui/Toast'
import { LandingPage } from '@/pages/LandingPage'
import { NewReceiptPage } from '@/pages/NewReceiptPage'
import { ReceiptPage } from '@/pages/ReceiptPage'
import { AuthPage } from '@/pages/AuthPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { AccountSettingsPage } from '@/pages/AccountSettingsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/new" element={<NewReceiptPage />} />
              <Route path="/r/:slug" element={<ReceiptPage />} />
              {/* Auth routes — mode covers: login | signup | forgot-password | reset-password */}
              <Route path="/auth/:mode" element={<AuthPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/account" element={<AccountSettingsPage />} />
            </Routes>
          </Layout>
          <ToastContainer />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
