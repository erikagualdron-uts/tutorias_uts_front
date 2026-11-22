import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Page, PqrsAdminDetail, PqrsAdminSummary, PqrsMessage, PqrsStatus } from '@/api/types';

const PAGE_SIZE = 20;

export interface AdminPqrsFilters {
  status?: PqrsStatus;
  typeId?: string;
  authorRole?: 'TEACHER' | 'STUDENT';
}

// Pages of every PQRS for the CAE; the three filters go to the server and combine.
export function useAdminPqrs({ status, typeId, authorRole }: AdminPqrsFilters) {
  return useInfiniteQuery({
    queryKey: ['pqrs', 'admin', { status, typeId, authorRole }],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ page: String(pageParam), limit: String(PAGE_SIZE) });
      if (status) params.set('status', status);
      if (typeId) params.set('typeId', typeId);
      if (authorRole) params.set('authorRole', authorRole);
      return api<Page<PqrsAdminSummary>>(`/pqrs?${params.toString()}`);
    },
    getNextPageParam: ({ meta }) => (meta.page * meta.limit < meta.total ? meta.page + 1 : undefined),
  });
}

export const useAdminPqrsDetail = (id: string) =>
  useQuery({ queryKey: ['pqrs', 'admin', 'detail', id], queryFn: () => api<PqrsAdminDetail>(`/pqrs/${id}`) });

// Every action of the CAE changes the PQRS, so all the PQRS queries are asked again afterwards.
function usePqrsAction<T>(id: string, path: string, body?: object) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input?: object) => api<T>(`/pqrs/${id}/${path}`, { method: 'POST', body: input ?? body }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['pqrs'] }),
  });
}

export const useReviewPqrs = (id: string) => usePqrsAction<PqrsAdminDetail>(id, 'review');
export const useResolvePqrs = (id: string) => usePqrsAction<PqrsAdminDetail>(id, 'resolve');
export const useRespondPqrs = (id: string) => usePqrsAction<PqrsMessage>(id, 'responses');
