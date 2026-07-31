import { useEffect, useState, useCallback } from 'react'
import { getPosts } from '../../services/posts'
import PostCard from './PostCard'
import PostCardSkeleton from './PostCardSkeleton'
import BaseButton from '../../components/Button/BaseButton'
import useToast from '../../components/Toasts/useToast'
import StaggerChars from '../../components/ui/StaggerChars/StaggerChars'
import AnimatedTabs from '../../components/ui/AnimatedTabs/AnimatedTabs'
import Pagination from '../../components/ui/Pagination/Pagination'
import styles from './PostsList.module.css'
import type { Post } from '../../types/post'
import type { PostCategory } from '../../types/post'

type CategoryFilter = PostCategory | 'all'

const CATEGORY_TABS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'análisis', label: 'Análisis' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'experiencia', label: 'Experiencia' },
  { value: 'pregunta', label: 'Pregunta' },
]

export default function PostsList() {
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState<CategoryFilter>('all')
  const toast = useToast()

  const load = useCallback(async (p = 1, cat: CategoryFilter = category) => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page: p, limit: 10 }
      if (cat !== 'all') params['category'] = cat
      const res = await getPosts(params)
      setPosts(res.posts || [])
      setPage(res.pagination?.page || 1)
      setTotalPages(res.pagination?.pages || 1)
    } catch (err) {
      console.error(err)
      toast.error('Error cargando posts')
    } finally {
      setLoading(false)
    }
  }, [toast, category])

  useEffect(() => { load(1) }, [load])

  const handleCategoryChange = (value: CategoryFilter) => {
    setCategory(value)
    load(1, value)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <StaggerChars text="Foro" as="h2" className={styles.title} />
        <BaseButton as="link" to="/posts/new" variant="primary-action" size="md" className={styles.newPostButton} startIcon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.buttonIcon}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        }>
          <span className={styles.buttonText}>Abrir Hilo</span>
        </BaseButton>
      </div>

      <div className={styles.filters}>
        <AnimatedTabs
          tabs={CATEGORY_TABS}
          active={category}
          onChange={handleCategoryChange}
        />
      </div>

      {loading && posts.length === 0 && (
        <div className={styles.list} aria-label="Cargando posts">
          {Array.from({ length: 6 }).map((_, i) => <PostCardSkeleton key={i} />)}
        </div>
      )}

      {!loading && (
      <div className={styles.list}>
        {posts.map(post => <PostCard key={post._id} post={post} />)}
      </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => load(p)} />
    </div>
  )
}
