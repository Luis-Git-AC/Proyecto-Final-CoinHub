import CoinCardSkeleton from '../../components/CoinCard/CoinCardSkeleton'
import styles from './Portfolio.module.css'

interface Props {
  rows?: number
}

export default function PortfolioGridSkeleton({ rows = 4 }: Props) {
  return (
    <section className={styles.cryptoGrid} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <CoinCardSkeleton key={i} />
      ))}
    </section>
  )
}
