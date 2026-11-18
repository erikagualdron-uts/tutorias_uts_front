import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Page, Teacher } from '@/api/types';

// Active teachers the CAE can assign to a module, filtered by name on the server.
export function useTeachers(search: string, enabled = true) {
  const params = new URLSearchParams({ limit: '100', status: 'ACTIVE' });
  if (search.trim()) params.set('search', search.trim());
  return useQuery({
    queryKey: ['teachers', { search: search.trim() }],
    queryFn: () => api<Page<Teacher>>(`/teachers?${params.toString()}`),
    enabled,
  });
}
