import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTopCoins } from '../services/coinGecko';
import type { CoinEnriched } from '../types/coin';

const STALE_TIME_MS = 60 * 1000;
const POLL_INTERVAL_MS = 60 * 1000;

function useCriptos() {
  const [query, setQuery] = useState<string>('');

  const {
    data: coins = [],
    isFetching,
    error,
    dataUpdatedAt,
    refetch,
  } = useQuery<CoinEnriched[]>({
    queryKey: ['topCoins'],
    queryFn: async ({ signal }) => {
      const data = await fetchTopCoins({ signal });
      return data.map((coin) => ({ ...coin, tvCandidates: [] }));
    },
    staleTime: STALE_TIME_MS,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    // Refresco inmediato al volver a la pestaña, igual que el listener de
    // visibilitychange que sustituye esta query.
    refetchOnWindowFocus: true,
  });

  const refresh = (): void => {
    void refetch();
  };

  const filteredCoins = useMemo<CoinEnriched[]>(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return coins;
    return coins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(normalizedQuery) ||
        coin.symbol.toLowerCase().includes(normalizedQuery)
    );
  }, [coins, query]);

  return {
    coins,
    filteredCoins,
    loading: isFetching,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    query,
    setQuery,
    refresh,
    lastUpdated: dataUpdatedAt || null,
  };
}

export default useCriptos;
