import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { TeacherModulePage, TeacherSessionPage } from '@/api/types';

export function useTeacherModules() {
  return useQuery({
    queryKey: ['teacher', 'modules'],
    queryFn: () => api<TeacherModulePage>('/teacher/modules?limit=100'),
  });
}

export function useTeacherSessions(moduleId?: string) {
  const params = new URLSearchParams({ limit: '100' });
  if (moduleId) params.set('moduleId', moduleId);
  return useQuery({
    queryKey: ['teacher', 'sessions', moduleId ?? null],
    queryFn: () => api<TeacherSessionPage>(`/teacher/sessions?${params.toString()}`),
  });
}

// A change moves sessions, attendees and what students see, so teacher and student views refresh.
export function useInvalidateTeacher() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ['teacher'] }),
      client.invalidateQueries({ queryKey: ['student', 'modules'] }),
      client.invalidateQueries({ queryKey: ['student', 'enrollments'] }),
    ]);
}
