import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Page, Period, PeriodInput, PeriodStatus } from '@/api/types';

const KEY = 'periods';

export function usePeriods(status?: PeriodStatus) {
  return useQuery({
    queryKey: [KEY, { status }],
    queryFn: () =>
      api<Page<Period>>(
        `/academic-periods?limit=100${status ? `&status=${status}` : ''}`,
      ),
  });
}

export function usePeriod(id?: string) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => api<Period>(`/academic-periods/${id}`),
    enabled: !!id,
  });
}

function useInvalidate() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: [KEY] });
}

export function useSavePeriod(id?: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: PeriodInput) =>
      api<Period>(id ? `/academic-periods/${id}` : '/academic-periods', {
        method: id ? 'PATCH' : 'POST',
        body: input,
      }),
    onSuccess: invalidate,
  });
}

export function useActivatePeriod(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (confirmCloseActive: boolean) =>
      api<Period>(`/academic-periods/${id}/activate`, {
        method: 'POST',
        body: { confirmCloseActive },
      }),
    onSuccess: invalidate,
  });
}

export function useClosePeriod(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: () =>
      api<Period>(`/academic-periods/${id}/close`, { method: 'POST' }),
    onSuccess: invalidate,
  });
}

export function useDeletePeriod(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: () =>
      api<void>(`/academic-periods/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}
