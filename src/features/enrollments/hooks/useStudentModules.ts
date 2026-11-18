import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type {
  Enrollment,
  EnrollmentPage,
  StudentModuleDetail,
  StudentModulePage,
  StudentSession,
} from '@/api/types';

export type EnrollmentFilter = 'ACTIVE' | 'CANCELLED' | 'ALL';

export function useStudentModules(search: string) {
  const params = new URLSearchParams({ limit: '100' });
  if (search.trim()) params.set('search', search.trim());
  return useQuery({
    queryKey: ['student', 'modules', search],
    queryFn: () => api<StudentModulePage>(`/student/modules?${params.toString()}`),
  });
}

export function useStudentModule(id: string) {
  return useQuery({
    queryKey: ['student', 'modules', id],
    queryFn: () => api<StudentModuleDetail>(`/student/modules/${id}`),
  });
}

export function useMyEnrollments(status: EnrollmentFilter) {
  return useQuery({
    queryKey: ['student', 'enrollments', status],
    queryFn: () => api<EnrollmentPage>(`/student/enrollments?status=${status}&limit=100`),
  });
}

// Every change moves seats, states and "my tutoring", so the three views refresh together.
function useInvalidateStudent() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ['student', 'modules'] }),
      client.invalidateQueries({ queryKey: ['student', 'enrollments'] }),
    ]);
}

export function useEnroll() {
  const invalidate = useInvalidateStudent();
  return useMutation({
    mutationFn: (moduleId: string) =>
      api<Enrollment>('/student/enrollments', { method: 'POST', body: { moduleId } }),
    onSuccess: invalidate,
  });
}

export function useCancelModule() {
  const invalidate = useInvalidateStudent();
  return useMutation({
    mutationFn: (enrollmentId: string) =>
      api<Enrollment>(`/student/enrollments/${enrollmentId}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}

interface SessionChange {
  enrollmentId: string;
  sessionId: string;
}

export function useCancelSession() {
  const invalidate = useInvalidateStudent();
  return useMutation({
    mutationFn: ({ enrollmentId, sessionId }: SessionChange) =>
      api<StudentSession>(`/student/enrollments/${enrollmentId}/sessions/${sessionId}/cancel`, { method: 'POST' }),
    onSuccess: invalidate,
  });
}

export function useRestoreSession() {
  const invalidate = useInvalidateStudent();
  return useMutation({
    mutationFn: ({ enrollmentId, sessionId }: SessionChange) =>
      api<StudentSession>(`/student/enrollments/${enrollmentId}/sessions/${sessionId}/restore`, { method: 'POST' }),
    onSuccess: invalidate,
  });
}
