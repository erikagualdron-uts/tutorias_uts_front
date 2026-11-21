import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { api } from '@/api/client';

const REFRESH_MS = 60_000;

// The counter of the bell (FR-010). There is no live channel yet (D-099), so it is asked again every
// minute while the app is open and whenever the app returns to the foreground.
export function useUnreadCount() {
  const query = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => api<{ unread: number }>('/notifications/unread-count'),
    refetchInterval: REFRESH_MS,
  });
  const { refetch } = query;
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refetch();
    });
    return () => subscription.remove();
  }, [refetch]);
  return query.data?.unread ?? 0;
}
