import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { api } from '@/api/client';
import type { Page } from '@/api/types';

const REFRESH_MS = 60_000;

// How many PQRS are waiting in "Filed", for the badge of the CAE's PQRS tab (spec 020). It asks the
// list the CAE already has for one row and reads the total. The key hangs from ['pqrs'], which the
// actions of the CAE invalidate; new PQRS arrive by asking again each minute and when the app returns.
export function useFiledCount(): number {
  const query = useQuery({
    queryKey: ['pqrs', 'admin', 'filed-count'],
    queryFn: () => api<Page<unknown>>('/pqrs?status=FILED&limit=1'),
    refetchInterval: REFRESH_MS,
  });
  const { refetch } = query;
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refetch();
    });
    return () => subscription.remove();
  }, [refetch]);
  return query.data?.meta.total ?? 0;
}
