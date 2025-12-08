import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createPost, updatePost, getPost } from '../../services/posts'
import { useAuth } from '../../context/useAuth'
import useToast from '../../components/Toasts/useToast'
import styles from './PostForm.module.css'
import BaseButton from '../../components/Button/BaseButton'

export default function PostForm() {
  const { postId, id } = useParams()
  const resolvedPostId = postId || id
  const navigate = useNavigate()
  const { token } = useAuth()
  const [form, setForm] = useState({ title: '', content: '', category: 'análisis' })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({ title: '', content: '' })
  const toast = useToast()

  const MIN_TITLE = 5
  const MIN_CONTENT = 20

  useEffect(() => {
    if (resolvedPostId) {
        (async () => {
          try {
            const res = await getPost(resolvedPostId)
            if (res.post) setForm({ title: res.post.title || '', content: res.post.content || '', category: res.post.category || 'análisis' })
          } catch (err) { console.error(err) }
        })()
      }
  }, [resolvedPostId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!token) return toast.error('Inicia sesión para crear/editar posts')

    const newErrors = {}
    if (!form.title || form.title.trim().length < MIN_TITLE) newErrors.title = `El campo «Título» debe tener al menos ${MIN_TITLE} caracteres.`
    if (!form.content || form.content.trim().length < MIN_CONTENT) newErrors.content = `El campo «Contenido» debe tener al menos ${MIN_CONTENT} caracteres.`
    if (Object.keys(newErrors).length) {
      setErrors(prev => ({ ...prev, ...newErrors }))
      toast.info('Corrige los errores del formulario antes de continuar')
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('content', form.content)
      formData.append('category', form.category)
      if (file) formData.append('image', file)

      if (resolvedPostId) {
        await updatePost(token, resolvedPostId, formData)
        toast.success('Post actualizado')
        navigate(`/posts/${resolvedPostId}`)
      } else {
        const res = await createPost(token, formData)
        toast.success('Post creado')
        navigate(`/posts/${res.post._id}`)
      }
    } catch (err) {
      console.error(err)
      toast.error('Error al guardar post')
    } finally { setLoading(false) }
  }

  const validateField = (name, value) => {
    if (name === 'title') {
      if (!value || value.trim().length < MIN_TITLE) return `El campo «Título» debe tener al menos ${MIN_TITLE} caracteres.`
      return ''
    }
    if (name === 'content') {
      if (!value || value.trim().length < MIN_CONTENT) return `El campo «Contenido» debe tener al menos ${MIN_CONTENT} caracteres.`
      return ''
    }
    return ''
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }))
  }

  return (
    <div className={styles.formContainer}>
      <h2>{id ? 'Editar Post' : 'Crear Post'}</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label>Título</label>
          <input name="title" className={styles.input} value={form.title} onChange={handleChange} required />
          {errors.title ? <div className={styles.error}>{errors.title}</div> : null}
        </div>
        <div className={styles.field}>
          <label>Contenido</label>
          <textarea name="content" className={styles.textarea} value={form.content} onChange={handleChange} rows={8} required />
          {errors.content ? <div className={styles.error}>{errors.content}</div> : null}
        </div>
        <div className={styles.field}>
          <label>Categoría</label>
          <select className={styles.select} value={form.category} onChange={event => setForm(prev => ({ ...prev, category: event.target.value }))}>
            <option value="análisis">análisis</option>
            <option value="tutorial">tutorial</option>
            <option value="experiencia">experiencia</option>
            <option value="pregunta">pregunta</option>
          </select>
        </div>
        <div className={styles.field}>
          <label>Imagen (opcional)</label>
          <input type="file" accept="image/*" onChange={event => setFile(event.target.files && event.target.files[0] ? event.target.files[0] : null)} />
        </div>
        <div className={styles.actions}>
          <BaseButton type="submit" className={styles.submitButton} variant="primary-action" size="md" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</BaseButton>
          <BaseButton type="button" variant="cancel-action" size="md" onClick={() => navigate('/posts')}>Cancelar</BaseButton>
        </div>
      </form>
    </div>
  )
}
