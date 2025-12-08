const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/coins/markets'
const DEFAULT_PARAMS = {
  vs_currency: 'usd',
  order: 'market_cap_desc',
  per_page: 100,
  page: 1,
  sparkline: false,
  price_change_percentage: '24h'
}

async function fetchTopCoins({ signal, params = {} } = {}) {
  const searchParams = new URLSearchParams({ ...DEFAULT_PARAMS, ...params })

  const response = await fetch(`${COINGECKO_API_URL}?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      accept: 'application/json'
    },
    signal
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`CoinGecko request failed: ${response.status} ${errorBody}`)
  }

  const data = await response.json()

  if (!Array.isArray(data)) {
    throw new Error('CoinGecko response is not an array')
  }

  return data.map((coin) => ({
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    image: coin.image,
    currentPrice: coin.current_price,
    marketCap: coin.market_cap,
    marketCapRank: coin.market_cap_rank,
    priceChangePercentage24h: coin.price_change_percentage_24h,
    totalVolume: coin.total_volume
  }))
}

export { fetchTopCoins }
