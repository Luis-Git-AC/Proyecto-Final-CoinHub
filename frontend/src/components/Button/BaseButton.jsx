import React from 'react'
import { Link } from 'react-router-dom'
import styles from './BaseButton.module.css'

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
}) {
  const Component = as === 'link' ? Link : 'button'

  const classNames = `${styles.btn} ${styles[variant] || ''} ${styles[size] || ''} ${iconOnly ? styles.iconOnly : ''} ${className}`.trim()

  const props = { ...rest }
  if (as === 'link') props.to = to
  else props.type = type || 'button'
  if (disabled) props.disabled = disabled

  return (
    <Component className={classNames} {...props}>
      {startIcon && <span className={styles.icon}>{startIcon}</span>}
      {children != null && (
        <span>{children}</span>
      )}
      {endIcon && <span className={styles.icon}>{endIcon}</span>}
    </Component>
  )
}
