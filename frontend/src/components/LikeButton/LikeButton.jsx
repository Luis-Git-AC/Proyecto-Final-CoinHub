import { useState } from 'react'
import { toggleLike } from '../../services/posts'
import { useAuth } from '../../context/useAuth'
import useToast from '../Toasts/useToast'
import styles from './LikeButton.module.css'
import BaseButton from '../Button/BaseButton'

export default function LikeButton({ post, interactive = true, showCount = true, variant = 'default' }) {
  const { token, user } = useAuth()
  const [likes, setLikes] = useState(post.likes || [])
  const userId = user?._id
  const toast = useToast()

  const hasLiked = userId ? likes.includes(userId) : false

  const handleToggle = async () => {
    if (!interactive) return
    if (!token) {
      toast.info('Necesitas iniciar sesión para dar like')
      return
    }
    try {
      await toggleLike(token, post._id)
      setLikes(prev => {
        if (!userId) return prev
        return prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
      })
    } catch (err) {
      console.error(err)
      toast.error('Error al procesar like')
    }
  }



  if (!interactive) return null

  const className = variant === 'pill' ? `${styles.button} ${styles.pill}` : styles.button

  return (
    <BaseButton onClick={handleToggle} className={className} aria-pressed={hasLiked} aria-label={`${likes.length} me gusta`} variant="like" size="sm" iconOnly={!showCount}>
      <span className={styles.icon} aria-hidden="true">
        {hasLiked ? (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M12 21s-7-4.534-9-7.033C1.6 11.76 2.1 8.5 4.5 6.8 6.8 5.2 9.3 6 12 8.1c2.7-2.1 5.2-2.9 7.5-1.3 2.4 1.7 2.9 4.96 1.5 7.15C19 16.466 12 21 12 21z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M12 21s-7-4.534-9-7.033C1.6 11.76 2.1 8.5 4.5 6.8 6.8 5.2 9.3 6 12 8.1c2.7-2.1 5.2-2.9 7.5-1.3 2.4 1.7 2.9 4.96 1.5 7.15C19 16.466 12 21 12 21z"/>
          </svg>
        )}
      </span>
      {showCount && <span className={styles.count}>{likes.length}</span>}
    </BaseButton>
  )
}
