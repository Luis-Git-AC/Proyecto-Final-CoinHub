import Tooltip from '../ui/Tooltip/Tooltip'
import styles from './PortfolioAllocationChart.module.css'

const SERIES_COLORS = [
  'var(--series-1)',
  'var(--series-2)',
  'var(--series-3)',
  'var(--series-4)',
  'var(--series-5)',
  'var(--series-6)',
  'var(--series-7)',
]
const MAX_SLOTS = SERIES_COLORS.length

export interface AllocationItem {
  label: string
  value: number
}

interface Slice {
  label: string
  value: number
  percent: number
  color: string
}

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value)
}

function buildSlices(items: AllocationItem[]): Slice[] {
  const positive = items.filter((item) => item.value > 0)
  const total = positive.reduce((acc, item) => acc + item.value, 0)
  if (total <= 0) return []

  const sorted = [...positive].sort((a, b) => b.value - a.value)
  const head = sorted.slice(0, MAX_SLOTS)
  const tail = sorted.slice(MAX_SLOTS)

  const slices: Slice[] = head.map((item, index) => ({
    label: item.label,
    value: item.value,
    percent: (item.value / total) * 100,
    color: SERIES_COLORS[index] ?? 'var(--series-7)',
  }))

  if (tail.length) {
    const otherValue = tail.reduce((acc, item) => acc + item.value, 0)
    slices.push({
      label: `Otros (${tail.length})`,
      value: otherValue,
      percent: (otherValue / total) * 100,
      color: 'var(--series-other)',
    })
  }

  return slices
}

interface PortfolioAllocationChartProps {
  items: AllocationItem[]
}

export default function PortfolioAllocationChart({ items }: PortfolioAllocationChartProps) {
  const slices = buildSlices(items)
  if (!slices.length) return null

  return (
    <div className={styles.chart}>
      <p className={styles.title}>Distribución del portfolio por activo</p>
      <div className={styles.bar} role="img" aria-label={`Distribución del portfolio: ${slices.map((s) => `${s.label} ${s.percent.toFixed(1)}%`).join(', ')}`}>
        {slices.map((slice) => (
          <Tooltip
            key={slice.label}
            content={`${slice.label}: ${formatUSD(slice.value)} (${slice.percent.toFixed(1)}%)`}
            style={{ flex: `${slice.percent} 0 0%`, minWidth: '2px' }}
          >
            <span className={styles.segment} style={{ background: slice.color }} />
          </Tooltip>
        ))}
      </div>
      <ul className={styles.legend}>
        {slices.map((slice) => (
          <li key={slice.label} className={styles['legend-item']}>
            <span className={styles.swatch} style={{ background: slice.color }} aria-hidden />
            {slice.label} <span className={styles['legend-value']}>({slice.percent.toFixed(1)}%)</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
