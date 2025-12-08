import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getPost, deletePost } from '../../services/posts'
import CommentForm from './CommentForm'
import CommentsList from './CommentsList'
import { useAuth } from '../../context/useAuth'
import useToast from '../../components/Toasts/useToast'
import useConfirm from '../../components/Confirm/useConfirm'
import styles from './PostDetail.module.css'
import LikeButton from '../../components/LikeButton/LikeButton'
import BaseButton from '../../components/Button/BaseButton'

export default function PostDetail() {
  const { postId, id } = useParams()
  const resolvedPostId = postId || id
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const confirm = useConfirm()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getPost(resolvedPostId)
      setPost(res.post)
    } catch (err) {
      console.error(err)
      toast.error('Error cargando post')
    } finally { setLoading(false) }
  }, [resolvedPostId, toast])

  useEffect(() => { load() }, [resolvedPostId, load])

  const handleDelete = async () => {
    if (!token) { toast.error('No autorizado'); return }
    const confirmed = await confirm('Eliminar este post?')
    if (!confirmed) return
    try {
      await deletePost(token, resolvedPostId)
      toast.success('Post eliminado')
      navigate('/posts')
    } catch (err) {
      console.error(err)
      toast.error('Error eliminando post')
    }
  }

  if (loading || !post) return <div className={styles.container}>Cargando...</div>

  const isOwner = user && post.userId && user._id === post.userId._id
  const canManage = isOwner || (user && (user.role === 'admin' || user.role === 'owner'))

  return (
    <div className={styles.container}>
      <h2>{post.title}</h2>
      <div className={styles.meta}>por {post.userId?.username} • {new Date(post.createdAt).toLocaleString()}</div>
      {post.image && <img className={styles.image} src={post.image} alt={post.title} />}
      <div className={styles.content}>{post.content}</div>

      <div className={styles.actions}>
        <LikeButton post={post} showCount={false} />
        {canManage && (
          <BaseButton as="link" to={`/posts/${resolvedPostId}/edit`} variant="ghost" size="md" className={styles.btnGhost} aria-label="Editar post" title="Editar" iconOnly>
            <span className={styles.icon} aria-hidden>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
              </svg>
            </span>
          </BaseButton>
        )}
        {canManage && (
          <BaseButton type="button" onClick={handleDelete} variant="danger" size="md" className={styles.btnDanger} aria-label="Eliminar post" title="Eliminar" iconOnly>
            <span className={styles.icon} aria-hidden>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
            </span>
          </BaseButton>
        )}
      </div>

      <section className={styles.commentsSection}>
        <h3>Comentarios</h3>
        <CommentForm postId={resolvedPostId} onPosted={load} />
        <CommentsList postId={resolvedPostId} onChange={load} />
      </section>
    </div>
  )
}
