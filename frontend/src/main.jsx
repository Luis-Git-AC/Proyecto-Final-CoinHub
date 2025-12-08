import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import PortfolioProvider from './context/PortfolioProvider.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './components/Toasts/ToastProvider'
import { ConfirmProvider } from './components/Confirm/ConfirmProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <PortfolioProvider>
        <ToastProvider>
          <ConfirmProvider>
            <App />
          </ConfirmProvider>
        </ToastProvider>
      </PortfolioProvider>
    </AuthProvider>
  </StrictMode>,
)
