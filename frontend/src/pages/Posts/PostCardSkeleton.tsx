import Skeleton from '../../components/ui/Skeleton/Skeleton'
import postCardStyles from './PostCard.module.css'
import styles from './PostCardSkeleton.module.css'

export default function PostCardSkeleton() {
  return (
    <article className={`${postCardStyles.card} ${styles.card}`} aria-hidden>
      <div className={postCardStyles.avatar}>
        <Skeleton width="48px" height="48px" borderRadius="50%" />
      </div>

      <div className={styles.content}>
        <Skeleton width="65%" height="18px" className={styles.mb} />
        <Skeleton width="40%" height="13px" className={styles.mb} />
        <Skeleton width="100%" height="13px" className={styles.mb} />
        <Skeleton width="90%"  height="13px" className={styles.mb} />
        <Skeleton width="75%"  height="13px" />
      </div>
    </article>
  )
}
