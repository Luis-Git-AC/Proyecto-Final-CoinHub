import { useCallback, useMemo, useState } from 'react'
import { ToastContext } from './ToastContext'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

let idCounter = 1

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((toastId: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== toastId))
  }, [])

  const show = useCallback((message: string, type: Toast['type'] = 'info', timeToLive = 4000): number => {
    const toastId = idCounter++
    setToasts(prevToasts => [{ id: toastId, message, type }, ...prevToasts])
    if (timeToLive > 0) setTimeout(() => remove(toastId), timeToLive)
    return toastId
  }, [remove])

  const value = useMemo(() => ({
    success: (message: string, timeToLive?: number) => show(message, 'success', timeToLive),
    error: (message: string, timeToLive?: number) => show(message, 'error', timeToLive),
    info: (message: string, timeToLive?: number) => show(message, 'info', timeToLive),
  }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{ minWidth: 220, marginBottom: 8, padding: '0.6rem 0.8rem', borderRadius: 6, color: 'var(--text-inverse)', boxShadow: '0 6px 18px rgba(0,0,0,0.18)', background: toast.type === 'error' ? 'var(--color-error)' : toast.type === 'success' ? 'var(--color-success)' : 'var(--color-info)' }}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
