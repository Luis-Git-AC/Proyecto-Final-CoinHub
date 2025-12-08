import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getResource, deleteResource } from '../../services/resources'
import { API_URL } from '../../services/api'
import { useAuth } from '../../context/useAuth'
import useToast from '../../components/Toasts/useToast'
import useConfirm from '../../components/Confirm/useConfirm'
import BaseButton from '../../components/Button/BaseButton'
import btnStyles from '../../components/Button/BaseButton.module.css'
import styles from './Resources.module.css'

export default function ResourceDetail() {
  const { resourceId, id } = useParams()
  const resolvedResourceId = resourceId || id
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const [resource, setResource] = useState(null)
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const confirm = useConfirm()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getResource(resolvedResourceId)
      setResource(res.resource)
    } catch (err) { console.error(err); toast.error('Error cargando recurso') }
    finally { setLoading(false) }
  }, [resolvedResourceId, toast])

  useEffect(() => { load() }, [resolvedResourceId, load])

  const handleDelete = async () => {
    if (!token) {
      toast.error('No autorizado')
      return
    }
    const confirmed = await confirm('Eliminar recurso?')
    if (!confirmed) return
      try {
      await deleteResource(token, resolvedResourceId)
      toast.success('Recurso eliminado')
      navigate('/resources')
    } catch (err) {
      console.error(err)
      toast.error('Error eliminando recurso')
    }
  }

  if (loading || !resource) return <div className={`${styles.root} ${styles.containerNarrow}`}>Cargando...</div>

  const isOwner = user && resource.userId && user._id === resource.userId._id
  const canManage = isOwner || (user && (user.role === 'admin' || user.role === 'owner'))

  return (
    <div className={`${styles.root} ${styles.containerNarrow}`}>
      <h2>{resource.title}</h2>
      <div className={styles.detailMeta}>{resource.type} • {resource.category}</div>
      <p className={styles.detailDesc}>{resource.description}</p>
      <div className={styles.detailLinks}>
        <a href={`${API_URL}/resources/${resource._id}/open`} target="_blank" rel="noopener noreferrer" className={styles.detailLink}>Abrir</a>
        <a href={`${API_URL}/resources/${resource._id}/download`} className={styles.detailLink}>Descargar</a>
      </div>
      <div className={styles.detailActions}>
        {canManage && (
          <BaseButton as="link" to={`/resources/${resolvedResourceId}/edit`} variant="ghost" size="sm" className={`${btnStyles.btn} ${btnStyles.ghost}`} aria-label="Editar recurso" title="Editar" iconOnly>
            <span aria-hidden>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
              </svg>
            </span>
          </BaseButton>
        )}
        {canManage && (
          <BaseButton variant="danger" size="sm" onClick={handleDelete} aria-label="Eliminar recurso" title="Eliminar" iconOnly>
            <span aria-hidden>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
            </span>
          </BaseButton>
        )}
      </div>
    </div>
  )
}
