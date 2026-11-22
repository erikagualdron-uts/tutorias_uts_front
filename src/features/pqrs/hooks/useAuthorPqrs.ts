import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Page, PqrsDetail, PqrsLimits, PqrsStatus, PqrsSummary } from '@/api/types';

const PAGE_SIZE = 20;

export const usePqrsLimits = () => useQuery({ queryKey: ['pqrs', 'limits'], queryFn: () => api<PqrsLimits>('/pqrs/limits') });

// Pages of my own PQRS, loaded as the end is reached; the status goes to the server.
export function useMyPqrs(status?: PqrsStatus) {
  return useInfiniteQuery({
    queryKey: ['pqrs', 'mine', { status }],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ page: String(pageParam), limit: String(PAGE_SIZE) });
      if (status) params.set('status', status);
      return api<Page<PqrsSummary>>(`/pqrs/mine?${params.toString()}`);
    },
    getNextPageParam: ({ meta }) => (meta.page * meta.limit < meta.total ? meta.page + 1 : undefined),
  });
}

export const useMyPqrsDetail = (id: string) =>
  useQuery({ queryKey: ['pqrs', 'mine', 'detail', id], queryFn: () => api<PqrsDetail>(`/pqrs/mine/${id}`) });

export interface CreatePqrsInput {
  clientRequestId: string;
  typeId: string;
  subject: string;
  description: string;
}

export function useCreatePqrs() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePqrsInput) => api<PqrsSummary>('/pqrs', { method: 'POST', body: input }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['pqrs'] }),
  });
}
