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
            href="https://cryptopanic.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.link}
          >
            CryptoPanic
          </a>
        </p>
      </div>
    </footer>
  )
}

export default Footer
