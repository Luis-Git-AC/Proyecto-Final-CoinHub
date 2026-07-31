import { useState } from 'react'
import { createComment } from '../../services/comments'
import { useAuth } from '../../context/useAuth'
import useToast from '../../components/Toasts/useToast'
import useConfirm from '../../components/Confirm/useConfirm'
import styles from './CommentForm.module.css'
import BaseButton from '../../components/Button/BaseButton'

interface CommentFormProps {
  postId: string
  onPosted?: () => void
}

export default function CommentForm({ postId, onPosted }: CommentFormProps) {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const confirm = useConfirm()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!text.trim()) return
    if (!user) {
      toast.info('Inicia sesión para comentar')
      return
    }

    const confirmed = await confirm('¿Publicar este comentario?')
    if (!confirmed) return

    setLoading(true)
    try {
      await createComment({ postId, content: text })
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
        <BaseButton type="submit" variant="primary-action" size="md" disabled={loading}>
          {loading ? 'Publicando...' : 'Publicar'}
        </BaseButton>
      </div>
    </form>
  )
}
