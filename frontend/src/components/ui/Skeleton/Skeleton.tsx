import styles from './Skeleton.module.css'

interface SkeletonProps {
  width?: string
  height?: string
  borderRadius?: string
  className?: string
}

export default function Skeleton({ width, height, borderRadius, className = '' }: SkeletonProps) {
  return (
    <span
      className={`${styles.skeleton} ${className}`}
      style={{ width, height, borderRadius }}
      aria-hidden
    />
  )
}
