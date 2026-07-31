import Skeleton from '../../components/ui/Skeleton/Skeleton'
import styles from './ResourceCardSkeleton.module.css'

export default function ResourceCardSkeleton() {
  return (
    <article className={styles.card} aria-hidden>
      <Skeleton width="60%" height="18px" className={styles.mb} />
      <Skeleton width="35%" height="12px" className={styles.mb} />
      <Skeleton width="100%" height="12px" className={styles.mb} />
      <Skeleton width="85%"  height="12px" className={styles.mb} />
      <div className={styles.links}>
        <Skeleton width="56px" height="28px" borderRadius="var(--radius-md)" />
        <Skeleton width="80px" height="28px" borderRadius="var(--radius-md)" />
      </div>
    </article>
  )
}
