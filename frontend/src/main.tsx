import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import PortfolioProvider from './context/PortfolioProvider'
import { AuthProvider } from './context/AuthContext.tsx'
import { ToastProvider } from './components/Toasts/ToastProvider'
import { ConfirmProvider } from './components/Confirm/ConfirmProvider'
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PortfolioProvider>
          <ToastProvider>
            <ConfirmProvider>
              <App />
            </ConfirmProvider>
          </ToastProvider>
        </PortfolioProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>,
)
