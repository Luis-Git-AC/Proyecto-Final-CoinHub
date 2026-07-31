import type { Coin } from '../types/coin';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/coins/markets';

interface FetchTopCoinsOptions {
  signal?: AbortSignal;
  params?: Record<string, string | number | boolean>;
}

const DEFAULT_PARAMS: Record<string, string | number | boolean> = {
  vs_currency: 'usd',
  order: 'market_cap_desc',
  per_page: 100,
  page: 1,
  sparkline: false,
  price_change_percentage: '24h',
};

export async function fetchTopCoins({ signal, params = {} }: FetchTopCoinsOptions = {}): Promise<Coin[]> {
  const searchParams = new URLSearchParams(
    Object.entries({ ...DEFAULT_PARAMS, ...params }).map(([k, v]) => [k, String(v)])
  );

  const response = await fetch(`${COINGECKO_API_URL}?${searchParams.toString()}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`CoinGecko request failed: ${response.status} ${errorBody}`);
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('CoinGecko response is not an array');
  }

  return (data as Record<string, unknown>[]).map((coin) => ({
    id: coin['id'] as string,
    symbol: coin['symbol'] as string,
    name: coin['name'] as string,
    image: coin['image'] as string,
    currentPrice: coin['current_price'] as number,
    marketCap: coin['market_cap'] as number,
    marketCapRank: coin['market_cap_rank'] as number,
    priceChangePercentage24h: coin['price_change_percentage_24h'] as number,
    totalVolume: coin['total_volume'] as number,
  }));
}
