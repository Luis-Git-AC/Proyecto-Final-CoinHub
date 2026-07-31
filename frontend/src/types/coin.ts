export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number;
  priceChangePercentage24h: number;
  totalVolume: number;
}

export interface CoinEnriched extends Coin {
  tvCandidates?: string[];
  cantidad?: number;
}
