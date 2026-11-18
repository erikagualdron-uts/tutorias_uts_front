import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type {
  DropdownItem,
  DropdownList,
  DropdownListDetail,
} from '@/api/types';

const KEY = 'dropdown-lists';

export function useDropdownLists() {
  return useQuery({
    queryKey: [KEY],
    queryFn: () => api<DropdownList[]>('/dropdown-lists'),
  });
}

// Admin view: every item, active or not.
export function useDropdownList(key: string) {
  return useQuery({
    queryKey: [KEY, key],
    queryFn: () => api<DropdownListDetail>(`/dropdown-lists/${key}`),
  });
}

// What any app selector uses: active items only. A short staleTime makes a change made by the
// CAE show up the next time a selector opens (SC-006).
export function useDropdownItems(key: string) {
  return useQuery({
    queryKey: [KEY, key, 'active'],
    queryFn: () => api<DropdownItem[]>(`/dropdown-lists/${key}/items`),
    staleTime: 5_000,
  });
}

function useInvalidate() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: [KEY] });
}

export function useSaveItem(key: string, itemId?: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: {
      labelEs?: string;
      labelEn?: string;
      status?: 'ACTIVE' | 'INACTIVE';
    }) =>
      api<DropdownItem>(
        itemId
          ? `/dropdown-lists/${key}/items/${itemId}`
          : `/dropdown-lists/${key}/items`,
        { method: itemId ? 'PATCH' : 'POST', body: input },
      ),
    onSuccess: invalidate,
  });
}

export function useReorderItems(key: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (itemIds: string[]) =>
      api<DropdownListDetail>(`/dropdown-lists/${key}/items/order`, {
        method: 'PUT',
        body: { itemIds },
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteItem(key: string, itemId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: () =>
      api<void>(`/dropdown-lists/${key}/items/${itemId}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}
