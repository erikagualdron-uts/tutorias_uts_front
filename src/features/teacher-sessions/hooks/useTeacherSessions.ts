import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { SessionChange, SessionScope, TeacherModulePage, TeacherSessionPage } from '@/api/types';

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

export interface RescheduleInput {
  sessionId: string;
  scope: SessionScope;
  startsAt: string;
}

// Asks the API whether the new hour would be accepted, without changing anything (dryRun).
export function useRescheduleCheck() {
  return useMutation({
    mutationFn: ({ sessionId, scope, startsAt }: RescheduleInput) =>
      api<SessionChange>(`/teacher/sessions/${sessionId}/reschedule`, {
        method: 'POST',
        body: { scope, startsAt, dryRun: true },
      }),
  });
}

export function useReschedule() {
  const invalidate = useInvalidateTeacher();
  return useMutation({
    mutationFn: ({ sessionId, scope, startsAt }: RescheduleInput) =>
      api<SessionChange>(`/teacher/sessions/${sessionId}/reschedule`, { method: 'POST', body: { scope, startsAt } }),
    onSuccess: invalidate,
  });
}

interface ScopeInput {
  sessionId: string;
  scope: SessionScope;
}

export function useCancelSession() {
  const invalidate = useInvalidateTeacher();
  return useMutation({
    mutationFn: ({ sessionId, scope }: ScopeInput) =>
      api<SessionChange>(`/teacher/sessions/${sessionId}/cancel`, { method: 'POST', body: { scope } }),
    onSuccess: invalidate,
  });
}

export function useRestoreSession() {
  const invalidate = useInvalidateTeacher();
  return useMutation({
    mutationFn: ({ sessionId, scope }: ScopeInput) =>
      api<SessionChange>(`/teacher/sessions/${sessionId}/restore`, { method: 'POST', body: { scope } }),
    onSuccess: invalidate,
  });
}
