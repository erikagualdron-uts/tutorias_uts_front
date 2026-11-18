import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Holiday, HolidayInput, HolidayPreview, HolidayRemoval, HolidayResult } from '@/api/types';

const HOLIDAYS = 'holidays';

// A holiday cancels or gives back sessions, so the module screens refresh with it.
function useInvalidate() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: [HOLIDAYS] }),
      client.invalidateQueries({ queryKey: ['modules'] }),
    ]);
}

export function useHolidays(year: number) {
  return useQuery({
    queryKey: [HOLIDAYS, year],
    queryFn: () => api<{ data: Holiday[] }>(`/holidays?year=${year}`),
  });
}

export function useSaveHoliday(id?: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: HolidayInput) =>
      api<HolidayResult>(id ? `/holidays/${id}` : '/holidays', { method: id ? 'PATCH' : 'POST', body: input }),
    onSuccess: invalidate,
  });
}

export function useDeleteHoliday(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: () => api<HolidayRemoval>(`/holidays/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}

// Nothing is saved by the preview; `gcTime: 0` so the list is asked again each time.
export function useImportPreview(year: number) {
  return useQuery({
    queryKey: [HOLIDAYS, 'preview', year],
    queryFn: () => api<{ data: HolidayPreview[] }>(`/holidays/import-preview?year=${year}`),
    gcTime: 0,
    retry: false,
  });
}

export function useImportHolidays() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: { year: number; dates: string[] }) =>
      api<{ created: number; skipped: number; cancelledSessions: number }>('/holidays/import', {
        method: 'POST',
        body: input,
      }),
    onSuccess: invalidate,
  });
}
