import { createContext, useContext } from 'react'

export interface ToastContextValue {
  success: (message: string, timeToLive?: number) => number
  error: (message: string, timeToLive?: number) => number
  info: (message: string, timeToLive?: number) => number
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToastContext(): ToastContextValue | null {
  return useContext(ToastContext)
}
