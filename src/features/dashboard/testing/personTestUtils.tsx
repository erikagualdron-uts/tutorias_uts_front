import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { api } from '@/api/client';

export const mockedApi = api as jest.Mock;

export const session = (overrides: object = {}) => ({
  sessionId: 's1',
  moduleId: 'm1',
  moduleName: 'Cálculo',
  startsAt: '2030-01-08T19:00:00.000Z', // 14:00 Bogota
  endsAt: '2030-01-08T21:00:00.000Z',
  room: 'B-201',
  ...overrides,
});
export const pqrs = (n: number, status = 'FILED') => ({
  id: `p${n}`,
  type: { id: 't1', labelEs: 'Petición', labelEn: 'Request' },
  subject: `Asunto ${n}`,
  status,
  createdAt: '2030-01-08T19:00:00.000Z',
  updatedAt: '2030-01-08T19:00:00.000Z',
});
export const page = (data: unknown[]) => ({ data, meta: { page: 1, limit: 3, total: data.length } });

// Answers by path prefix; an Error value rejects.
export const routes = (handlers: Record<string, unknown>) =>
  mockedApi.mockImplementation((path: string) => {
    const hit = Object.entries(handlers).find(([pattern]) => path.startsWith(pattern));
    if (!hit) return Promise.reject(new Error(path));
    return hit[1] instanceof Error ? Promise.reject(hit[1]) : Promise.resolve(hit[1]);
  });

export const renderScreen = (ui: ReactElement) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);
