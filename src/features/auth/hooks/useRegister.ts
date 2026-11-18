import { useMutation } from '@tanstack/react-query';
import { api } from '@/api/client';
import { deviceLocale } from '@/i18n';
import type { RegisterForm } from '../schemas';

export interface CodeSent {
  resendAvailableAt: string;
}

export function useRegister() {
  return useMutation({
    mutationFn: (form: RegisterForm) =>
      api<CodeSent>('/auth/register', {
        method: 'POST',
        body: { ...form, locale: deviceLocale() },
        auth: false,
      }),
  });
}
