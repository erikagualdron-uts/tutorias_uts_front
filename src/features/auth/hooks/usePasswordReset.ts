import { useMutation } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { CodeSent } from './useRegister';

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) =>
      api<CodeSent>('/auth/forgot-password', {
        method: 'POST',
        body: { email },
        auth: false,
      }),
  });
}

export function useResetPassword(email: string) {
  return useMutation({
    mutationFn: (form: { code: string; newPassword: string }) =>
      api<void>('/auth/reset-password', {
        method: 'POST',
        body: { email, ...form },
        auth: false,
      }),
  });
}
