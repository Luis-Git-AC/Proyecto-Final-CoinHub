import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import PortfolioContext from './PortfolioContext';
import type { PortfolioContextValue } from './PortfolioContext';
import { useAuth } from './useAuth';
import { getPortfolio, putPortfolio } from '../services/portfolio';
import type { LocalPortfolioEntry } from '../types/portfolio';
import type { Coin, CoinEnriched } from '../types/coin';

const STORAGE_KEY = 'portfolio_v1';

function storageKeyFor(userId: string | undefined): string {
  if (!userId) return STORAGE_KEY;
  return `portfolio_${userId}_v1`;
}

function readStorage(userId: string | undefined): LocalPortfolioEntry[] {
  try {
    const key = storageKeyFor(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as LocalPortfolioEntry[];
  } catch (err) {
    console.warn('No se pudo leer el portfolio desde localStorage:', err);
    return [];
  }
}

function writeStorage(portfolio: LocalPortfolioEntry[], userId: string | undefined): void {
  try {
    const key = storageKeyFor(userId);
    localStorage.setItem(key, JSON.stringify(portfolio));
  } catch (err) {
    console.warn('No se pudo guardar el portfolio en localStorage:', err);
  }
}

function sanitizeCoin(coin: Coin | CoinEnriched): LocalPortfolioEntry {
  return {
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    image: coin.image,
    currentPrice: coin.currentPrice,
    marketCap: coin.marketCap,
    marketCapRank: coin.marketCapRank,
    priceChangePercentage24h: coin.priceChangePercentage24h,
    totalVolume: coin.totalVolume,
    cantidad: (coin as CoinEnriched).cantidad ?? 1,
    addedAt: Date.now(),
    metadata: { coinGeckoId: coin.id },
  };
}

function PortfolioProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<LocalPortfolioEntry[]>([]);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSynced = useRef<number>(0);

  useEffect(() => {
    writeStorage(portfolio, user?._id);
  }, [portfolio, user]);

  useEffect(() => {
    if (!user) {
      setPortfolio([]);
      return;
    }
    const local = readStorage(user._id);
    if (Array.isArray(local) && local.length) setPortfolio(local);
  }, [user]);

  const { data: serverPortfolio } = useQuery({
    queryKey: ['portfolio', user?._id],
    queryFn: () => getPortfolio(),
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!serverPortfolio) return;
    const items = Array.isArray(serverPortfolio.items) ? serverPortfolio.items : [];
    const mapped: LocalPortfolioEntry[] = items.map((item) => {
      const coinGeckoId = (item.metadata?.['coinGeckoId'] as string | undefined) ?? item.symbol;
      const meta: Record<string, unknown> = {
        name: (item.metadata?.['name'] as string | undefined) ?? item.symbol,
        image: (item.metadata?.['image'] as string | undefined) ?? '',
        currentPrice: item.avgPrice,
        marketCap: (item.metadata?.['marketCap'] as number | undefined) ?? 0,
        marketCapRank: (item.metadata?.['marketCapRank'] as number | undefined) ?? 0,
        priceChangePercentage24h: (item.metadata?.['priceChangePercentage24h'] as number | undefined) ?? 0,
        totalVolume: (item.metadata?.['totalVolume'] as number | undefined) ?? 0,
        coinGeckoId,
      };
      if (item.metadata) Object.assign(meta, item.metadata, { coinGeckoId });
      return {
        id: coinGeckoId,
        symbol: item.symbol,
        name: (item.metadata?.['name'] as string | undefined) ?? item.symbol,
        image: (item.metadata?.['image'] as string | undefined) ?? '',
        currentPrice: item.avgPrice,
        marketCap: (item.metadata?.['marketCap'] as number | undefined) ?? 0,
        marketCapRank: (item.metadata?.['marketCapRank'] as number | undefined) ?? 0,
        priceChangePercentage24h: (item.metadata?.['priceChangePercentage24h'] as number | undefined) ?? 0,
        totalVolume: (item.metadata?.['totalVolume'] as number | undefined) ?? 0,
        cantidad: item.amount,
        addedAt: Date.now(),
        metadata: { ...meta, coinGeckoId } as { coinGeckoId: string; [key: string]: unknown },
      };
    });
    setPortfolio(mapped);
  }, [serverPortfolio]);

  const syncMutation = useMutation({
    mutationFn: (payload: Parameters<typeof putPortfolio>[0]) => putPortfolio(payload),
    onSuccess: () => {
      lastSynced.current = Date.now();
    },
    onError: (err: unknown) => {
      console.warn('Error sincronizando portfolio al servidor:', err instanceof Error ? err.message : err);
    },
  });

  useEffect(() => {
    if (!user) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      const payload = portfolio.map((item) => {
        const coinGeckoId = item.metadata?.coinGeckoId ?? item.id;
        const meta: Record<string, unknown> = {
          name: item.name,
          image: item.image,
          currentPrice: item.currentPrice,
          marketCap: item.marketCap,
          marketCapRank: item.marketCapRank,
          priceChangePercentage24h: item.priceChangePercentage24h,
          totalVolume: item.totalVolume,
          coinGeckoId,
        };
        if (item.metadata) Object.assign(meta, item.metadata, { coinGeckoId });
        return {
          symbol: (item.symbol || item.id).toUpperCase(),
          amount: item.cantidad,
          avgPrice: item.currentPrice,
          metadata: meta,
        };
      });
      syncMutation.mutate(payload);
    }, 1000);
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
    // syncMutation se recrea cada render (useMutation no memoiza su
    // identidad), no debe disparar el debounce por sí sola.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolio, user]);

  const isInPortfolio = useCallback(
    (coinId: string, coin?: Coin | CoinEnriched): boolean => {
      return portfolio.some((item) => {
        if (item.id && item.id === coinId) return true;
        if (coin && item.symbol && item.symbol.toLowerCase() === coin.symbol.toLowerCase()) return true;
        if (item.metadata?.coinGeckoId && item.metadata.coinGeckoId === coinId) return true;
        return false;
      });
    },
    [portfolio]
  );

  const addCoin = useCallback((coin: Coin | CoinEnriched): void => {
    setPortfolio((prev) => {
      const exists = prev.some((item) => {
        if (item.id && item.id === coin.id) return true;
        if (item.symbol && item.symbol.toLowerCase() === coin.symbol.toLowerCase()) return true;
        if (item.metadata?.coinGeckoId && item.metadata.coinGeckoId === coin.id) return true;
        return false;
      });
      if (exists) return prev;
      return [...prev, sanitizeCoin(coin)];
    });
  }, []);

  const removeCoin = useCallback((coinId: string): void => {
    setPortfolio((prev) => prev.filter((item) => item.id !== coinId));
  }, []);

  const toggleCoin = useCallback((coin: Coin | CoinEnriched): void => {
    setPortfolio((prev) => {
      const exists = prev.some((item) => {
        if (item.id && item.id === coin.id) return true;
        if (item.symbol && item.symbol.toLowerCase() === coin.symbol.toLowerCase()) return true;
        if (item.metadata?.coinGeckoId && item.metadata.coinGeckoId === coin.id) return true;
        return false;
      });
      if (exists) {
        return prev.filter((item) => {
          if (item.id && item.id === coin.id) return false;
          if (item.metadata?.coinGeckoId && item.metadata.coinGeckoId === coin.id) return false;
          if (item.symbol && item.symbol.toLowerCase() === coin.symbol.toLowerCase()) return false;
          return true;
        });
      }
      return [...prev, sanitizeCoin(coin)];
    });
  }, []);

  const clearPortfolio = useCallback((): void => {
    setPortfolio([]);
  }, []);

  const updateCoinQuantity = useCallback((coinId: string, newQuantity: number | string): void => {
    setPortfolio((prev) =>
      prev.map((coin) => {
        if (coin.id === coinId) {
          const parsedValue = parseFloat(String(newQuantity));
          const cantidad = isNaN(parsedValue) ? 0 : Math.max(0, parsedValue);
          return { ...coin, cantidad };
        }
        return coin;
      })
    );
  }, []);

  const value = useMemo<PortfolioContextValue>(
    () => ({
      portfolio,
      addCoin,
      removeCoin,
      toggleCoin,
      clearPortfolio,
      updateCoinQuantity,
      isInPortfolio,
    }),
    [portfolio, addCoin, removeCoin, toggleCoin, clearPortfolio, updateCoinQuantity, isInPortfolio]
  );

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export default PortfolioProvider;
