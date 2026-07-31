import { createContext, useContext } from 'react'

export type ConfirmOptions = string | { message: string; requiredText?: string }

export interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

export const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function useConfirmContext(): ConfirmContextValue | null {
  return useContext(ConfirmContext)
}
