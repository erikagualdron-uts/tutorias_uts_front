import { useMutation } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { UserSummary } from '@/api/types';
import type { CreateTeacherForm } from '../schemas';

export function useCreateTeacher() {
  return useMutation({
    mutationFn: (form: CreateTeacherForm) =>
      api<{ user: UserSummary; temporaryPassword: string }>('/teachers', {
        method: 'POST',
        body: form,
      }),
  });
}
