import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import { useFiledCount } from '../hooks/useFiledCount';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
const mockedApi = api as jest.Mock;

const setup = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
};

beforeEach(() => jest.clearAllMocks());

describe('useFiledCount', () => {
  it('asks for one FILED row and answers the total of the page', async () => {
    mockedApi.mockResolvedValue({ data: [{}], meta: { page: 1, limit: 1, total: 7 } });
    const { wrapper } = setup();
    const { result } = await renderHook(() => useFiledCount(), { wrapper });
    await waitFor(() => expect(result.current).toBe(7));
    expect(mockedApi).toHaveBeenCalledWith('/pqrs?status=FILED&limit=1');
  });

  it('answers 0 while loading and when the request fails, with no error to show', async () => {
    mockedApi.mockRejectedValue(new ApiError(500, 'INTERNAL_ERROR'));
    const { wrapper } = setup();
    const { result } = await renderHook(() => useFiledCount(), { wrapper });
    expect(result.current).toBe(0);
    await waitFor(() => expect(mockedApi).toHaveBeenCalled());
    expect(result.current).toBe(0);
  });

  it('is refreshed by the actions of the CAE: its key hangs from ["pqrs"], which they already invalidate', async () => {
    mockedApi.mockResolvedValue({ data: [], meta: { page: 1, limit: 1, total: 3 } });
    const { client, wrapper } = setup();
    const { result } = await renderHook(() => useFiledCount(), { wrapper });
    await waitFor(() => expect(result.current).toBe(3));
    mockedApi.mockResolvedValue({ data: [], meta: { page: 1, limit: 1, total: 2 } });
    await client.invalidateQueries({ queryKey: ['pqrs'] });
    await waitFor(() => expect(result.current).toBe(2));
  });
});
