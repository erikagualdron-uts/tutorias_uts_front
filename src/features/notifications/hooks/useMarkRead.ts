import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { AppNotification } from '@/api/types';

// Reading changes the list and the counter, so both are asked again.
function useRefresh() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ['notifications'] });
}

export function useMarkRead() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: string) => api<AppNotification>(`/notifications/${id}/read`, { method: 'POST' }),
    onSuccess: refresh,
  });
}

export function useMarkAllRead() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: () => api<{ updated: number }>('/notifications/read-all', { method: 'POST' }),
    onSuccess: refresh,
  });
}
