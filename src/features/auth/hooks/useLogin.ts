import { useMutation } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { api } from '@/api/client';
import type { AuthTokens } from '@/api/types';
import { useSession } from '@/store/session';
import type { LoginForm } from '../schemas';

export function useLogin() {
  const signIn = useSession((state) => state.signIn);
  return useMutation({
    mutationFn: (form: LoginForm) =>
      api<AuthTokens>('/auth/login', {
        method: 'POST',
        body: { ...form, deviceLabel: Platform.OS },
        auth: false,
      }),
    onSuccess: signIn,
  });
}
