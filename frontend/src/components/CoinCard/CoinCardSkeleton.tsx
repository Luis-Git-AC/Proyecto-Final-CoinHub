import Skeleton from '../ui/Skeleton/Skeleton'
import styles from './CoinCard.module.css'
import skStyles from './CoinCardSkeleton.module.css'

export default function CoinCardSkeleton() {
  return (
    <div className={`${styles.card} ${skStyles.card}`} aria-hidden>
      <div className={styles.header}>
        <div className={styles.identity}>
          <Skeleton width="42px" height="22px" borderRadius="var(--radius-full)" />
          <Skeleton width="48px" height="48px" borderRadius="50%" />
          <div className={skStyles.nameBlock}>
            <Skeleton width="80px" height="14px" />
            <Skeleton width="50px" height="12px" />
          </div>
        </div>
        <Skeleton width="28px" height="28px" borderRadius="50%" />
      </div>

      <div className={skStyles.priceRow}>
        <Skeleton width="110px" height="22px" />
        <Skeleton width="60px" height="18px" borderRadius="var(--radius-full)" />
      </div>

      <div className={skStyles.statsRow}>
        <Skeleton width="100%" height="14px" />
        <Skeleton width="80%" height="14px" />
      </div>
    </div>
  )
}
