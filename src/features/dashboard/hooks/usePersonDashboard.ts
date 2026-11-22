import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Page, PqrsSummary } from '@/api/types';
import type { StudentDashboard, TeacherDashboard } from '../types';

export const useTeacherDashboard = () =>
  useQuery({ queryKey: ['dashboard', 'teacher'], queryFn: () => api<TeacherDashboard>('/dashboard/teacher') });

export const useStudentDashboard = () =>
  useQuery({ queryKey: ['dashboard', 'student'], queryFn: () => api<StudentDashboard>('/dashboard/student') });

// The 3 latest PQRS of the signed-in author (the same endpoint as the PQRS tab; no copy in the dashboard API).
export const useRecentPqrs = () =>
  useQuery({ queryKey: ['pqrs', 'mine', 'recent'], queryFn: () => api<Page<PqrsSummary>>('/pqrs/mine?limit=3') });
