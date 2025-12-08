import { useState } from 'react'
import { createComment } from '../../services/comments'
import { useAuth } from '../../context/useAuth'
import useToast from '../../components/Toasts/useToast'
import styles from './CommentForm.module.css'
import BaseButton from '../../components/Button/BaseButton'

export default function CommentForm({ postId, onPosted }) {
  const { token } = useAuth()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!text.trim()) return
    if (!token) {
      toast.info('Inicia sesión para comentar')
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      await createComment(token, { postId, content: text })
      setText('')
      if (onPosted) onPosted()
    } catch (error) {
      console.error(error)
      toast.error('Error al publicar comentario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <textarea
        className={styles.textarea}
        value={text}
        onChange={event => setText(event.target.value)}
        rows={3}
      />
      <div className={styles.actions}>
        <BaseButton type="submit" variant="primary" size="md" disabled={loading}>
          {loading ? 'Publicando...' : 'Publicar'}
        </BaseButton>
      </div>
    </form>
  )
}
