import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { StudentCalendar } from '@/api/types';

// The sessions of the student in a week (spec 021). The previous week stays on screen while the next one loads.
export function useStudentCalendar(from: string, to: string) {
  return useQuery({
    queryKey: ['student', 'calendar', from],
    queryFn: () => api<StudentCalendar>(`/student/calendar?from=${from}&to=${to}`),
    placeholderData: keepPreviousData,
  });
}
