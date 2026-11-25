import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { UserSummary } from '@/api/types';
import { useSession } from '@/store/session';
import type { OwnNameForm } from '../schemas';

export function useUpdateOwnName() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (form: OwnNameForm) =>
      api<UserSummary>('/students/me', { method: 'PATCH', body: form }),
    // Other people's screens show this name (chat, PQRS); the session keeps its own copy.
    onSuccess: (user) => {
      useSession.getState().setUser(user);
      void client.invalidateQueries({ queryKey: ['chat'] });
      void client.invalidateQueries({ queryKey: ['pqrs'] });
    },
  });
}
