import { useToastContext } from './ToastContext'

export default function useToast() {
  const ctx = useToastContext()
  if (!ctx) {
    return {
      success: (message) => console.log('toast success:', message),
      error: (message) => console.error('toast error:', message),
      info: (message) => console.info('toast info:', message),
    }
  }
  return ctx
}
