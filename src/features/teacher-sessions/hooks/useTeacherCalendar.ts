import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { TeacherCalendar } from '@/api/types';

// One week of sessions (past and future). The key sits under ['teacher'], so every change of a session
// that invalidates the teacher queries refreshes the calendar too. While another week loads, the data of
// the previous one is kept only for the period and the hours (`isPlaceholderData`): never shown as the new week.
export function useTeacherCalendar(from: string, to: string) {
  return useQuery({
    queryKey: ['teacher', 'calendar', from],
    queryFn: () => api<TeacherCalendar>(`/teacher/calendar?from=${from}&to=${to}`),
    placeholderData: keepPreviousData,
  });
}
