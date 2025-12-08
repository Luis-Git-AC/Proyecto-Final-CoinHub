const CRYPTOPANIC_API_URL = 'https://cryptopanic.com/api/developer/v2/posts/'
const API_KEY = import.meta.env.VITE_CRYPTOPANIC_API_KEY

const DEFAULT_PARAMS = {
  auth_token: API_KEY,
  kind: 'news', 
  currencies: 'BTC,ETH,ADA,SOL', 
  regions: 'en', 
  per_page: 20 
}

async function fetchCryptoPanicNews({ signal, params = {} } = {}) {
  if (!API_KEY) {
    throw new Error('CryptoPanic API key not found. Check your .env file.')
  }

  const searchParams = new URLSearchParams({ ...DEFAULT_PARAMS, ...params })

  try {
    const response = await fetch(`${CRYPTOPANIC_API_URL}?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`CryptoPanic API failed: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    
    console.log('CryptoPanic response:', data)

    if (!data.results || !Array.isArray(data.results)) {
      throw new Error('Invalid CryptoPanic response format')
    }

    return data.results.map((post) => ({
      id: post.id,
      titulo: post.title,
      descripcion: post.title, 
      fecha: post.created_at,
      fuente: post.source?.title || 'CryptoPanic',
      url: post.url || (post.id ? `https://cryptopanic.com/news/${post.id}` : undefined),
      imagen: null, 
      moneda: post.currencies?.[0]?.code || 'General',
      esEspecializada: true 
    }))

  } catch (error) {
    if (error.name === 'AbortError') {
      throw error
    }
    console.error('CryptoPanic fetch error:', error)
    throw new Error(`Error fetching crypto news: ${error.message}`)
  }
}

export { fetchCryptoPanicNews }