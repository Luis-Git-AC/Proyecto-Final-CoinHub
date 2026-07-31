import { useContext } from 'react';
import PortfolioContext from '../context/PortfolioContext';
import type { PortfolioContextValue } from '../context/PortfolioContext';

export default function usePortfolio(): PortfolioContextValue {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio debe usarse dentro de un PortfolioProvider');
  }
  return context;
}
