import { useState } from 'react'
import { useAuth } from '../../context/useAuth'
import { updateComment, deleteComment } from '../../services/comments'
import useToast from '../../components/Toasts/useToast'
import useConfirm from '../../components/Confirm/useConfirm'
import BaseButton from '../../components/Button/BaseButton'

export default function CommentItem({ comment, onUpdated, onDeleted }) {
  const { user, token } = useAuth()
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(comment.content || '')
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const confirm = useConfirm()

  const ownerId = comment.userId && (comment.userId._id || comment.userId)
  const isOwner = user && user._id && ownerId && user._id === ownerId
  const isAdmin = user && (user.role === 'admin' || user.role === 'owner')

  const handleSave = async () => {
    if (!token) {
      toast.error('No autorizado')
      return
    }
    if (!text.trim()) {
      toast.error('El comentario no puede estar vacío')
      return
    }
    setLoading(true)
    try {
      await updateComment(token, comment._id, { content: text })
      setEditing(false)
      if (onUpdated) onUpdated()
    } catch (err) {
      console.error(err)
      toast.error('Error actualizando comentario')
    } finally { setLoading(false) }
  }

  const handleDelete = async () => {
    if (!token) {
      toast.error('No autorizado')
      return
    }
    const confirmed = await confirm('Eliminar este comentario?')
    if (!confirmed) return
    setLoading(true)
    try {
      await deleteComment(token, comment._id)
      if (onDeleted) onDeleted()
    } catch (err) {
      console.error(err)
      toast.error('Error eliminando comentario')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ border: '1px solid #eee', padding: '.5rem', borderRadius: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem' }}>
        <div style={{ flex: 1 }}>
          {editing ? (
            <textarea value={text} onChange={event => setText(event.target.value)} rows={3} style={{ width: '100%', padding: '.4rem' }} />
          ) : (
            <div style={{ fontSize: '.9rem', color: '#cececeff' }}>{comment.content}</div>
          )}
          <div style={{ fontSize: '.8rem', color: '#777', marginTop: '.5rem' }}>por {comment.userId?.username || 'Usuario'} • {new Date(comment.createdAt).toLocaleString()}</div>
        </div>

        {(isOwner || isAdmin) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.25rem', marginLeft: '.5rem' }}>
            {editing ? (
              <>
                <BaseButton variant="primary-action" size="sm" onClick={handleSave} disabled={loading}>Guardar</BaseButton>
                <BaseButton variant="cancel-action" size="sm" onClick={() => { setEditing(false); setText(comment.content || '') }}>Cancelar</BaseButton>
              </>
            ) : (
                <>
                <BaseButton variant="ghost" size="sm" onClick={() => setEditing(true)} aria-label="Editar comentario" iconOnly>
                  <span className="" aria-hidden>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
                    </svg>
                  </span>
                </BaseButton>
                <BaseButton variant="danger" size="sm" onClick={handleDelete} disabled={loading} aria-label="Eliminar comentario" iconOnly>
                  <span className="" aria-hidden>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                  </span>
                </BaseButton>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
