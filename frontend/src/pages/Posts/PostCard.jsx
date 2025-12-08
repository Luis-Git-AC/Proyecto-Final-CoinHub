import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import LikeButton from '../../components/LikeButton/LikeButton'
import ShareButton from '../../components/ShareButton/ShareButton'
import styles from './PostCard.module.css'

export default function PostCard({ post }) {
  const [limit, setLimit] = useState(180)
  const excerptRef = useRef(null)
  const [overflowing, setOverflowing] = useState(false)

  useEffect(() => {
    const updateLimit = () => {
      const isMobile = window.innerWidth <= 768
      setLimit(isMobile ? 120 : 180)
    }
    updateLimit()
    window.addEventListener('resize', updateLimit)
    return () => window.removeEventListener('resize', updateLimit)
  }, [])

  useEffect(() => {
    const excerptElement = excerptRef.current
    if (!excerptElement) return
    const isOverflow = excerptElement.scrollHeight > excerptElement.clientHeight + 1
    setOverflowing(isOverflow)
  }, [limit, post.content])

  const isLong = !!post.content && post.content.length > limit
  const excerpt = post.content ? post.content.slice(0, limit) : ''
  const showReadMore = isLong || overflowing

  const avatarUrl = post.userId?.avatar || `https://ui-avatars.com/api/?name=${(post.userId?.username || 'U').replace(/\s+/g, '+')}&background=667eea&color=fff`

  return (
    <article className={styles.card}>
      <div className={styles.avatar}>
        <div className={styles.avatarTile}>
          <img className={styles.avatarImg} src={avatarUrl} alt={post.userId?.username || 'Avatar'} />
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}><Link to={`/posts/${post._id}`}>{post.title}</Link></h3>
        </div>
        <div className={styles.meta}>por {post.userId?.username || 'Anónimo'} • {new Date(post.createdAt).toLocaleString()} {post.category ? `• ${post.category}` : ''}</div>
        {showReadMore ? (
          <div className={styles.excerptRow}>
            <p className={styles.excerpt} ref={excerptRef}>
              {excerpt}{isLong ? '…' : ''}
            </p>
            <Link to={`/posts/${post._id}`} className={styles.readMore}>Leer más</Link>
          </div>
        ) : (
          <p className={styles.excerpt} ref={excerptRef}>
            {excerpt}
          </p>
        )}
        <div className={styles.footerBar}>
          <div className={styles.footerInner}>
            <LikeButton post={post} interactive={true} showCount={true} variant="pill" />
            <ShareButton post={post} />
          </div>
        </div>
      </div>
    </article>
  )
}
