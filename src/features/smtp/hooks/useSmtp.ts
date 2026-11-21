import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { SmtpSettings, SmtpTestResult } from '@/api/types';

const SMTP = ['smtp'];

export function useSmtpSettings() {
  return useQuery({ queryKey: SMTP, queryFn: () => api<SmtpSettings>('/settings/smtp') });
}

export interface SaveSmtpInput {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}

export function useSaveSmtp() {
  const client = useQueryClient();
  return useMutation({
    // An empty password is left out so the server keeps the saved one.
    mutationFn: ({ password, ...rest }: SaveSmtpInput) =>
      api<SmtpSettings>('/settings/smtp', { method: 'PUT', body: password ? { ...rest, password } : rest }),
    onSuccess: (settings) => client.setQueryData(SMTP, settings),
  });
}

export function useSmtpTest() {
  return useMutation({ mutationFn: () => api<SmtpTestResult>('/settings/smtp/test', { method: 'POST' }) });
}
