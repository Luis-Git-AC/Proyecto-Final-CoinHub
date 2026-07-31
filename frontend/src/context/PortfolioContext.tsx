import { createContext } from 'react';
import type { LocalPortfolioEntry } from '../types/portfolio';
import type { Coin, CoinEnriched } from '../types/coin';

export interface PortfolioContextValue {
  portfolio: LocalPortfolioEntry[];
  addCoin: (coin: Coin | CoinEnriched) => void;
  removeCoin: (coinId: string) => void;
  toggleCoin: (coin: Coin | CoinEnriched) => void;
  clearPortfolio: () => void;
  updateCoinQuantity: (coinId: string, newQuantity: number | string) => void;
  isInPortfolio: (coinId: string, coin?: Coin | CoinEnriched) => boolean;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export default PortfolioContext;
