import { useEffect, useState, useCallback } from 'react'
import { getComments } from '../../services/comments'
import CommentItem from './CommentItem'
import BaseButton from '../../components/Button/BaseButton'
import useToast from '../../components/Toasts/useToast'

export default function CommentsList({ postId, onChange }) {
  const [comments, setComments] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)

  const toast = useToast()

  const load = useCallback(async (pageNumber = 1, append = false) => {
    setLoading(true)
    try {
      const response = await getComments({ postId, page: pageNumber, limit: 10 })
      const commentsList = response.comments || []
      setPages(response.pages || response.pagination?.pages || 1)
      setPage(response.page || pageNumber)
      setComments(prevComments => append ? [...prevComments, ...commentsList] : commentsList)
    } catch (error) {
      console.error(error)
      toast.error('Error cargando comentarios')
    } finally { setLoading(false) }
  }, [postId, toast])

  useEffect(() => { load(1, false) }, [postId, load])

  const handleReload = () => { load(1, false); if (onChange) onChange() }

  const handleLoadMore = () => {
    if (page >= pages) return
    const next = page + 1
    load(next, true)
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'grid', gap: '.5rem' }}>
        {comments.length === 0 && !loading && <div>No hay comentarios</div>}
        {comments.map(comment => (
          <CommentItem key={comment._id} comment={comment} onUpdated={handleReload} onDeleted={handleReload} />
        ))}
      </div>

      {loading && <div style={{ marginTop: '.5rem' }}>Cargando...</div>}

      {page < pages && (
        <div style={{ marginTop: '.75rem' }}>
          <BaseButton onClick={handleLoadMore} variant="ghost" size="sm">Cargar más</BaseButton>
        </div>
      )}
    </div>
  )
}
