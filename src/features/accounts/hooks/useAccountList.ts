import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { AccountStatus, Page, StudentAccount, Teacher } from '@/api/types';

const PAGE_SIZE = 20;

export type AccountKind = 'teacher' | 'student';
export interface AccountFilters {
  search: string;
  status?: AccountStatus;
}
type AccountOf<K extends AccountKind> = K extends 'teacher'
  ? Teacher
  : StudentAccount;

const PATH = { teacher: '/teachers', student: '/students' } as const;

// Pages of the CAE account list, loaded as the user reaches the end; search and status go to the server.
export function useAccountList<K extends AccountKind>(
  kind: K,
  { search, status }: AccountFilters,
) {
  const term = search.trim();
  return useInfiniteQuery({
    queryKey: [`${kind}-accounts`, { search: term, status }],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: String(PAGE_SIZE),
      });
      if (term) params.set('search', term);
      if (status) params.set('status', status);
      return api<Page<AccountOf<K>>>(`${PATH[kind]}?${params.toString()}`);
    },
    getNextPageParam: ({ meta }) =>
      meta.page * meta.limit < meta.total ? meta.page + 1 : undefined,
  });
}
