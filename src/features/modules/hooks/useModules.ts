import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { ModuleDetail, ModuleInput } from '@/api/types';

export const MODULES = 'modules';

// Any change to a module can alter the lists, the detail, the sessions and what the periods and
// rooms screens know about their modules, so they are all refreshed together.
export function useInvalidateModules() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: [MODULES] }),
      client.invalidateQueries({ queryKey: ['periods'] }),
      client.invalidateQueries({ queryKey: ['rooms'] }),
    ]);
}

export function useCreateModule() {
  const invalidate = useInvalidateModules();
  return useMutation({
    mutationFn: (input: ModuleInput) =>
      api<ModuleDetail>('/modules', { method: 'POST', body: input }),
    onSuccess: invalidate,
  });
}
