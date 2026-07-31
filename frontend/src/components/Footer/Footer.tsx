import styles from './Footer.module.css'

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p className={styles.credit}>CoinHub • Luis</p>
        <p className={styles.apis}>
          Agradecimientos:{' '}
          <a
            href="https://www.coingecko.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            CoinGecko
          </a>
          {' | '}
          <a
            href="https://www.coindesk.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            CoinDesk
          </a>
          {' | '}
          <a
            href="https://cointelegraph.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Cointelegraph
          </a>
          {' | '}
          <a
            href="https://decrypt.co"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Decrypt
          </a>
        </p>
      </div>
    </footer>
  )
}

export default Footer
