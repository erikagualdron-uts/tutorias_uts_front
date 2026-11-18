import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Location, Page, Room, RoomImpact, RoomStatus } from '@/api/types';

const ROOMS = 'rooms';
const LOCATIONS = 'locations';

export interface RoomFilters {
  search: string;
  locationId?: string;
  status?: RoomStatus;
}

export function useLocations() {
  return useQuery({
    queryKey: [LOCATIONS],
    queryFn: () => api<Page<Location>>('/locations?limit=100'),
  });
}

export function useLocation(id?: string) {
  return useQuery({
    queryKey: [LOCATIONS, id],
    queryFn: () => api<Location>(`/locations/${id}`),
    enabled: !!id,
  });
}

export function useRooms(filters: RoomFilters) {
  const params = new URLSearchParams({ limit: '100' });
  if (filters.search.trim()) params.set('search', filters.search.trim());
  if (filters.locationId) params.set('locationId', filters.locationId);
  if (filters.status) params.set('status', filters.status);
  return useQuery({
    queryKey: [ROOMS, filters],
    queryFn: () => api<Page<Room>>(`/rooms?${params.toString()}`),
  });
}

export function useRoom(id?: string) {
  return useQuery({
    queryKey: [ROOMS, id],
    queryFn: () => api<Room>(`/rooms/${id}`),
    enabled: !!id,
  });
}

// Fetched on demand: the numbers are only needed right before confirming a deactivation.
export function useRoomImpact(id: string, enabled: boolean) {
  return useQuery({
    queryKey: [ROOMS, id, 'impact'],
    queryFn: () => api<RoomImpact>(`/rooms/${id}/impact`),
    enabled,
    gcTime: 0,
  });
}

// Rooms embed their location name, so any change to one list refreshes both.
function useInvalidate() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: [ROOMS] }),
      client.invalidateQueries({ queryKey: [LOCATIONS] }),
    ]);
}

export function useSaveLocation(id?: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: { name: string }) =>
      api<Location>(id ? `/locations/${id}` : '/locations', {
        method: id ? 'PATCH' : 'POST',
        body: input,
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteLocation(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: () => api<void>(`/locations/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}

export function useSaveRoom(id?: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: {
      locationId: string;
      name: string;
      capacity: number;
    }) =>
      api<Room>(id ? `/rooms/${id}` : '/rooms', {
        method: id ? 'PATCH' : 'POST',
        body: input,
      }),
    onSuccess: invalidate,
  });
}

export function useToggleRoom(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (action: 'deactivate' | 'reactivate') =>
      api<Room>(`/rooms/${id}/${action}`, { method: 'POST' }),
    onSuccess: invalidate,
  });
}

export function useDeleteRoom(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: () => api<void>(`/rooms/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}
