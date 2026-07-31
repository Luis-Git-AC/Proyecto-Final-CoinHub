import React from 'react'
import { Link } from 'react-router-dom'
import styles from './BaseButton.module.css'

interface BaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode
  variant?: string
  size?: string
  as?: 'button' | 'link'
  to?: string
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  className?: string
  iconOnly?: boolean
}

export default function BaseButton({
  children,
  variant = 'primary',
  size = 'md',
  as = 'button',
  to,
  startIcon,
  endIcon,
  className = '',
  disabled,
  type,
  iconOnly = false,
  ...rest
}: BaseButtonProps) {
  const classNames = `${styles.btn} ${styles[variant] ?? ''} ${styles[size] ?? ''} ${iconOnly ? styles.iconOnly : ''} ${className}`.trim()

  if (as === 'link') {
    const { onClick, ...linkRest } = rest as React.AnchorHTMLAttributes<HTMLAnchorElement> & typeof rest
    return (
      <Link
        to={to ?? '/'}
        className={classNames}
        onClick={onClick as React.MouseEventHandler<HTMLAnchorElement>}
        {...(linkRest as object)}
      >
        {startIcon && <span className={styles.icon}>{startIcon}</span>}
        {children != null && <span>{children}</span>}
        {endIcon && <span className={styles.icon}>{endIcon}</span>}
      </Link>
    )
  }

  return (
    <button
      className={classNames}
      type={type ?? 'button'}
      disabled={disabled}
      {...rest}
    >
      {startIcon && <span className={styles.icon}>{startIcon}</span>}
      {children != null && <span>{children}</span>}
      {endIcon && <span className={styles.icon}>{endIcon}</span>}
    </button>
  )
}
