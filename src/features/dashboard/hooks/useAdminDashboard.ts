import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Page } from '@/api/types';
import type { AdminOverview, AdminRooms, RecentChange } from '../types';

export const RECENT_CHANGES_LIMIT = 5;

// One query per block so a failing block never hides the others (FR-012).
export const useAdminOverview = () =>
  useQuery({ queryKey: ['dashboard', 'admin', 'overview'], queryFn: () => api<AdminOverview>('/dashboard/admin/overview') });

export const useAdminChanges = () =>
  useQuery({
    queryKey: ['dashboard', 'admin', 'changes', RECENT_CHANGES_LIMIT],
    queryFn: () => api<Page<RecentChange>>(`/dashboard/admin/changes?limit=${RECENT_CHANGES_LIMIT}`),
  });

export const useAdminRooms = () =>
  useQuery({ queryKey: ['dashboard', 'admin', 'rooms'], queryFn: () => api<AdminRooms>('/dashboard/admin/rooms') });

// Every recent change, a page at a time, for the "See all" list.
export const useAdminChangePages = () =>
  useInfiniteQuery({
    queryKey: ['dashboard', 'admin', 'changes', 'pages'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api<Page<RecentChange>>(`/dashboard/admin/changes?page=${pageParam}&limit=20`),
    getNextPageParam: ({ meta }) => (meta.page * meta.limit < meta.total ? meta.page + 1 : undefined),
  });
