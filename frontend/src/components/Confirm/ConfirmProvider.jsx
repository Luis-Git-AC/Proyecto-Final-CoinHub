import { useRef, useState } from 'react'
import { ConfirmContext } from './ConfirmContext'
import BaseButton from '../Button/BaseButton'

export function ConfirmProvider({ children }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [requiredText, setRequiredText] = useState(null)
  const [typed, setTyped] = useState('')
  const resolveRef = useRef(null)

  const confirm = (options) => {
    if (typeof options === 'string') {
      setMessage(options)
      setRequiredText(null)
    } else {
      setMessage(options.message || '')
      setRequiredText(options.requiredText || null)
    }
    setTyped('')
    setOpen(true)
    return new Promise((resolve) => {
      resolveRef.current = resolve
    })
  }

  const handleCancel = () => {
    setOpen(false)
    setTyped('')
    setRequiredText(null)
    if (resolveRef.current) resolveRef.current(false)
  }

  const handleConfirm = () => {

    const confirmed = !requiredText || (typed === requiredText)
    setOpen(false)
    setTyped('')
    setRequiredText(null)
    if (resolveRef.current) resolveRef.current(Boolean(confirmed))
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {open && (
        <div className="modal-overlay">
          <div className="modal modal--confirm">
            <div className="modal__message">{message}</div>
            {requiredText && (
              <div className="modal__required">
                <div className="modal__required-note">Para confirmar escribe: <strong>{requiredText}</strong></div>
                <input className="modal__input" value={typed} onChange={e => setTyped(e.target.value)} />
              </div>
            )}
            <div className="modal__actions">
              <BaseButton variant="cancel-action" size="sm" onClick={handleCancel}>Cancelar</BaseButton>
              <BaseButton variant="primary-action" size="sm" onClick={handleConfirm} disabled={requiredText ? typed !== requiredText : false}>Confirmar</BaseButton>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}


