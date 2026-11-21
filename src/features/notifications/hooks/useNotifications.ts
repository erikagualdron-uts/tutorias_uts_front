import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { NotificationPage } from '@/api/types';

const PAGE_SIZE = 20;

// Pages are loaded as the user reaches the end of the list (FR-009); newest first from the server.
export function useNotifications() {
  return useInfiniteQuery({
    queryKey: ['notifications'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api<NotificationPage>(`/notifications?page=${pageParam}&limit=${PAGE_SIZE}`),
    getNextPageParam: ({ meta }) => (meta.page * meta.limit < meta.total ? meta.page + 1 : undefined),
  });
}
