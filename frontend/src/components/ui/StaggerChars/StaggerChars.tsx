import styles from './StaggerChars.module.css'

interface StaggerCharsProps {
  text: string
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span'
  staggerMs?: number
}

export default function StaggerChars({
  text,
  className,
  as: Tag = 'span',
  staggerMs = 30,
}: StaggerCharsProps) {
  const chars = text.split('')

  return (
    <Tag className={className} aria-label={text}>
      {chars.map((char, i) => (
        <span
          key={i}
          aria-hidden
          className={char === ' ' ? styles.space : styles.char}
          style={{ animationDelay: `${i * staggerMs}ms` }}
        >
          {char === ' ' ? '\u00a0' : char}
        </span>
      ))}
    </Tag>
  )
}
