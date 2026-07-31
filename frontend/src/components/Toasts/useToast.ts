import { useToastContext } from './ToastContext'
import type { ToastContextValue } from './ToastContext'

export default function useToast(): ToastContextValue {
  const ctx = useToastContext()
  if (!ctx) {
    return {
      success: (message) => { console.log('toast success:', message); return 0 },
      error: (message) => { console.error('toast error:', message); return 0 },
      info: (message) => { console.info('toast info:', message); return 0 },
    }
  }
  return ctx
}
