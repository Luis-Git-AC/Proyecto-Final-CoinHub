import styles from './ShareButton.module.css'

export default function ShareButton({ post }) {
  const url = `${window.location.origin}/posts/${post._id}`
  const title = post.title || 'Post'

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
      } else {
        await navigator.clipboard.writeText(url)
      }
    } catch {
      //
    }
  }

  return (
    <button className={styles.button} type="button" aria-label="Compartir" onClick={handleShare}>
      <svg className={styles.icon} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 8.5L8.5 12L15 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="18" cy="6" r="3" stroke="currentColor" strokeWidth="2"/>
        <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
        <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
      </svg>
    </button>
  )
}
