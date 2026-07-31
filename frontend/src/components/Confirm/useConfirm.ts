import { useConfirmContext } from './ConfirmContext'
import type { ConfirmOptions } from './ConfirmContext'

export default function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const ctx = useConfirmContext()
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx.confirm
}
