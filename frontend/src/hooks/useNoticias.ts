import { useQuery } from '@tanstack/react-query';
import { fetchNews } from '../services/news';

const STALE_TIME_MS = 60 * 60 * 1000;

function useNoticias() {
  const {
    data: noticias = [],
    isFetching,
    error,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: ['news'],
    queryFn: ({ signal }) => fetchNews({ signal }),
    staleTime: STALE_TIME_MS,
  });

  const refresh = (): void => {
    void refetch();
  };

  const lastUpdated = dataUpdatedAt || null;
  const nextUpdate = lastUpdated ? lastUpdated + STALE_TIME_MS : null;

  return {
    noticias,
    loading: isFetching,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refresh,
    lastUpdated,
    nextUpdate,
  };
}

export default useNoticias;
