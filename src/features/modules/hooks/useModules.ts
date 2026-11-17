import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { ModuleDetail, ModuleInput, ModulePage, Page, Session } from '@/api/types';

export const MODULES = 'modules';

// Any change to a module can alter the lists, the detail, the sessions and what the periods and
// rooms screens know about their modules, so they are all refreshed together.
export function useInvalidateModules() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: [MODULES] }),
      client.invalidateQueries({ queryKey: ['periods'] }),
      client.invalidateQueries({ queryKey: ['rooms'] }),
    ]);
}

export function useCreateModule() {
  const invalidate = useInvalidateModules();
  return useMutation({
    mutationFn: (input: ModuleInput) =>
      api<ModuleDetail>('/modules', { method: 'POST', body: input }),
    onSuccess: invalidate,
  });
}

export interface ModuleFilters {
  periodId?: string;
  search: string;
  teacherId?: string;
  roomId?: string;
}

export function useModuleList(filters: ModuleFilters) {
  const params = new URLSearchParams({ limit: '100' });
  if (filters.periodId) params.set('periodId', filters.periodId);
  if (filters.search.trim()) params.set('search', filters.search.trim());
  if (filters.teacherId) params.set('teacherId', filters.teacherId);
  if (filters.roomId) params.set('roomId', filters.roomId);
  return useQuery({
    queryKey: [MODULES, 'list', filters],
    queryFn: () => api<ModulePage>(`/modules?${params.toString()}`),
  });
}

export function useModule(id: string) {
  return useQuery({
    queryKey: [MODULES, 'detail', id],
    queryFn: () => api<ModuleDetail>(`/modules/${id}`),
  });
}

export function useModuleSessions(id: string) {
  return useQuery({
    queryKey: [MODULES, 'sessions', id],
    queryFn: () => api<Page<Session>>(`/modules/${id}/sessions?limit=100`),
  });
}

export function useChangeRoom(id: string) {
  const invalidate = useInvalidateModules();
  return useMutation({
    mutationFn: (roomId: string) =>
      api<ModuleDetail>(`/modules/${id}/room`, { method: 'PATCH', body: { roomId } }),
    onSuccess: invalidate,
  });
}
