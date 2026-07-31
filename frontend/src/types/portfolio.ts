/** Item de portfolio tal como lo devuelve el backend */
export interface PortfolioItem {
  _id: string;
  symbol: string;
  amount: number;
  avgPrice: number;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Entrada de portfolio enriquecida con datos de CoinGecko, almacenada localmente */
export interface LocalPortfolioEntry {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number;
  priceChangePercentage24h: number;
  totalVolume: number;
  cantidad: number;
  addedAt: number;
  metadata?: {
    coinGeckoId: string;
    [key: string]: unknown;
  };
}
