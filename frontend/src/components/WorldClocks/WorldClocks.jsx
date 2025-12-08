import { useState, useEffect } from 'react'
import styles from './WorldClocks.module.css'

function WorldClocks({ timezones, title = '🌍 Zonas Horarias' }) {
  const [times, setTimes] = useState({})

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date()
      const newTimes = {}

      timezones.forEach(({ zone }) => {
        const formatter = new Intl.DateTimeFormat('es-ES', {
          timeZone: zone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
        newTimes[zone] = formatter.format(now)
      })

      setTimes(newTimes)
    }

    updateTimes()
    const interval = setInterval(updateTimes, 1000)

    return () => clearInterval(interval)
  }, [timezones])

  return (
    <aside className={styles.sidebar}>
      <h3 className={styles.title}>{title}</h3>
      <ul className={styles.list}>
        {timezones.map(({ city, zone, flag }) => (
          <li key={zone} className={styles.clock}>
            <div className={styles.clockHeader}>
              <span className={styles.flag}>{flag}</span>
              <span className={styles.city}>{city}</span>
            </div>
            <div className={styles.time}>
              {times[zone] || '00:00:00'}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
}

export default WorldClocks
