import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type {
  AccountActionResult,
  StudentAccount,
  TeacherDetail,
} from '@/api/types';
import type { AccountKind } from './useAccountList';

export type AccountAction = 'deactivate' | 'reactivate' | 'delete';
const PATH = { teacher: '/teachers', student: '/students' } as const;

// The detail is asked again every time the sheet opens: the counts it shows are the effect of the closure.
export function useAccountDetail<K extends AccountKind>(kind: K, id: string) {
  return useQuery({
    queryKey: [`${kind}-account`, id],
    queryFn: () =>
      api<K extends 'teacher' ? TeacherDetail : StudentAccount>(
        `${PATH[kind]}/${id}`,
      ),
    gcTime: 0,
  });
}

export function useAccountAction(kind: AccountKind, id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (action: AccountAction) =>
      api<AccountActionResult>(
        action === 'delete'
          ? `${PATH[kind]}/${id}`
          : `${PATH[kind]}/${id}/${action}`,
        { method: action === 'delete' ? 'DELETE' : 'POST' },
      ),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: [`${kind}-accounts`] }),
  });
}

export interface TeacherEditInput {
  firstName: string;
  lastName: string;
  phone: string | null;
}

export function useUpdateTeacher(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: TeacherEditInput) =>
      api<TeacherDetail>(`/teachers/${id}`, { method: 'PATCH', body: input }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ['teacher-accounts'] }),
  });
}

// The password comes back once; the caller keeps it in state only until the dialog closes.
export function useRegeneratePassword(id: string) {
  return useMutation({
    mutationFn: () =>
      api<{ temporaryPassword: string }>(`/teachers/${id}/temporary-password`, {
        method: 'POST',
      }),
  });
}
