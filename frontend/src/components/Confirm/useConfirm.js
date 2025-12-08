import { useConfirmContext } from './ConfirmContext'

export default function useConfirm() {
  const ctx = useConfirmContext()
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx.confirm
}
