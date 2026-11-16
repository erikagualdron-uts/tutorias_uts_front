import { useMutation } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { CodeSent } from './useRegister';

export function useVerifyEmail(email: string) {
  return useMutation({
    mutationFn: (code: string) =>
      api<void>('/auth/verify-email', {
        method: 'POST',
        body: { email, code },
        auth: false,
      }),
  });
}

export function useResendVerification(email: string) {
  return useMutation({
    mutationFn: () =>
      api<CodeSent>('/auth/resend-verification', {
        method: 'POST',
        body: { email },
        auth: false,
      }),
  });
}
