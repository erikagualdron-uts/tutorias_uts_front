import { useMutation } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useSession } from '@/store/session';
import type { ChangePasswordForm } from '../schemas';

export function useChangePassword() {
  return useMutation({
    mutationFn: (form: ChangePasswordForm) =>
      api<void>('/auth/change-password', { method: 'POST', body: form }),
    // The route gate then sends the user to the tabs of their role.
    onSuccess: () => {
      const { user, setUser } = useSession.getState();
      if (user) setUser({ ...user, mustChangePassword: false });
    },
  });
}
