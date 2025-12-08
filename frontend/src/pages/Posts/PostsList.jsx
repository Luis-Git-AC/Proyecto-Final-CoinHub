import { useEffect, useState, useCallback } from 'react'
import { getPosts } from '../../services/posts'
import PostCard from './PostCard'
import { Link } from 'react-router-dom'
import BaseButton from '../../components/Button/BaseButton'
import useToast from '../../components/Toasts/useToast'
import styles from './PostsList.module.css'

export default function PostsList() {
  const [posts, setPosts] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const res = await getPosts({ page: p, limit: 10 })
      setPosts(res.posts || [])
      setPage(res.pagination?.page || 1)
      setTotalPages(res.pagination?.pages || 1)
    } catch (err) {
      console.error(err)
      toast.error('Error cargando posts')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load(1) }, [load])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Foro</h2>
        <BaseButton as="link" to="/posts/new" variant="primary-action" size="md" className={styles.newPostButton}>Nuevo Post</BaseButton>
      </div>

      {loading && <div>Cargando...</div>}

      <div className={styles.list}>
        {posts.map(post => <PostCard key={post._id} post={post} />)}
      </div>

      <div className={styles.pagination}>
        <BaseButton variant="ghost" size="sm" onClick={() => load(Math.max(1, page - 1))} disabled={page <= 1} className={styles.pageButton}>Anterior</BaseButton>
        <div className={styles.pageInfo}>{page} / {totalPages}</div>
        <BaseButton variant="ghost" size="sm" onClick={() => load(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className={styles.pageButton}>Siguiente</BaseButton>
      </div>
    </div>
  )
}
