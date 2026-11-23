import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { api } from '@/api/client';
import { useSession } from '@/store/session';
import { flushPending, useClearPendingOnSignOut, usePendingMessages, usePendingStore } from '../hooks/usePendingMessages';
import type { PendingMessage } from '../types';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
const mockedApi = api as jest.Mock;

const KEY = 'chat-pending';
const realStorage = { getItem: AsyncStorage.getItem, setItem: AsyncStorage.setItem };
const pending = (n: number, overrides: Partial<PendingMessage> = {}): PendingMessage => ({
  clientMessageId: `00000000-0000-4000-8000-00000000000${n}`,
  conversationId: n % 2 ? 'c1' : 'c2',
  body: `Mensaje ${n}`,
  kind: 'TEXT',
  createdAt: `2030-01-08T19:0${n}:00.000Z`,
  status: 'sending',
  userId: 'me',
  ...overrides,
});
const signIn = (id: string) =>
  useSession.setState({ status: 'signedIn', user: { id, role: 'STUDENT' } as never, accessToken: 'token', signOutReason: null });
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
);
const posts = () => mockedApi.mock.calls.filter(([path, o]) => String(path).endsWith('/messages') && o?.method === 'POST');
// What the device kept: the app closed and opened again, so the store reads the storage again.
const reopen = async (items: PendingMessage[]) => {
  await AsyncStorage.setItem(KEY, JSON.stringify({ state: { items }, version: 0 }));
  await usePendingStore.persist.rehydrate();
};
const stored = async (): Promise<PendingMessage[]> => JSON.parse((await AsyncStorage.getItem(KEY)) ?? '{"state":{"items":[]}}').state.items;

afterEach(() => {
  Object.assign(AsyncStorage, realStorage);
});

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  usePendingStore.setState({ items: [] });
  mockedApi.mockImplementation((path: string, o?: { body?: { clientMessageId: string; body: string } }) =>
    Promise.resolve({ id: `m-${o?.body?.clientMessageId}`, conversationId: String(path).split('/')[3], body: o?.body?.body, sender: { id: 'me' } }),
  );
  signIn('me');
});

describe('pending messages that survive the app closing', () => {
  it('keeps what is added in the storage and shows it again after reopening, with its state', async () => {
    usePendingStore.getState().add(pending(1));
    await waitFor(async () => expect(await stored()).toHaveLength(1));
    usePendingStore.setState({ items: [] });
    await reopen([pending(1), pending(2, { status: 'failed', errorCode: 'CHAT_NOT_FOUND' })]);
    const { result } = await renderHook(() => usePendingMessages('c1'), { wrapper });
    expect(result.current.pending.map((p) => [p.body, p.status])).toEqual([['Mensaje 1', 'sending']]);
    const other = await renderHook(() => usePendingMessages('c2'), { wrapper });
    expect(other.result.current.pending[0]).toMatchObject({ status: 'failed', errorCode: 'CHAT_NOT_FOUND' });
  });

  it('sends what was waiting once, in the order it was written, and clears it from the list and the storage', async () => {
    await reopen([pending(1), pending(2), pending(3)]);
    const client = new QueryClient();
    flushPending(client);
    await waitFor(() => expect(posts()).toHaveLength(3));
    expect(posts().map(([, o]) => o.body.clientMessageId)).toEqual([pending(1), pending(2), pending(3)].map((p) => p.clientMessageId));
    await waitFor(() => expect(usePendingStore.getState().items).toEqual([]));
    await waitFor(async () => expect(await stored()).toEqual([]));
    flushPending(client);
    expect(posts()).toHaveLength(3);
  });

  it('does not send a failed message by itself after reopening', async () => {
    await reopen([pending(1, { status: 'failed', errorCode: 'CHAT_NOT_FOUND' })]);
    flushPending(new QueryClient());
    expect(posts()).toHaveLength(0);
    expect(usePendingStore.getState().items[0].status).toBe('failed');
  });

  it('shows and sends only the messages of the signed-in user', async () => {
    await reopen([pending(1, { userId: 'someone-else' }), pending(3)]);
    const { result } = await renderHook(() => usePendingMessages('c1'), { wrapper });
    expect(result.current.pending.map((p) => p.body)).toEqual(['Mensaje 3']);
    flushPending(new QueryClient());
    await waitFor(() => expect(posts()).toHaveLength(1));
    expect(posts()[0][1].body.body).toBe('Mensaje 3');
  });

  it('writes the signed-in user on every message it queues', async () => {
    mockedApi.mockReturnValue(new Promise(() => undefined));
    const { result } = await renderHook(() => usePendingMessages('c1'), { wrapper });
    await act(async () => result.current.send('Hola', 'TEXT'));
    expect(usePendingStore.getState().items[0]).toMatchObject({ body: 'Hola', userId: 'me', status: 'sending' });
  });

  it('keeps sending in memory when the storage fails to read or to write', async () => {
    Object.assign(AsyncStorage, {
      setItem: jest.fn(() => Promise.reject(new Error('disk full'))),
      getItem: jest.fn(() => Promise.reject(new Error('unreadable'))),
    });
    await expect(usePendingStore.persist.rehydrate()).resolves.not.toThrow();
    usePendingStore.getState().add(pending(1));
    flushPending(new QueryClient());
    await waitFor(() => expect(posts()).toHaveLength(1));
    expect(usePendingStore.getState().items).toEqual([]);
  });
});

describe('discarding and signing out', () => {
  it('discards a sending or failed message from the list and the storage, and it is never sent', async () => {
    await reopen([pending(1), pending(3, { status: 'failed', errorCode: 'INTERNAL_ERROR' })]);
    const { result } = await renderHook(() => usePendingMessages('c1'), { wrapper });
    await act(async () => result.current.discard(pending(1).clientMessageId));
    await act(async () => result.current.discard(pending(3).clientMessageId));
    expect(result.current.pending).toEqual([]);
    await waitFor(async () => expect(await stored()).toEqual([]));
    flushPending(new QueryClient());
    expect(posts()).toHaveLength(0);
  });

  it('empties the pending messages when the session goes from signed in to signed out', async () => {
    await reopen([pending(1)]);
    await renderHook(() => useClearPendingOnSignOut());
    await act(async () => useSession.setState({ status: 'signedOut', user: null }));
    expect(usePendingStore.getState().items).toEqual([]);
    await waitFor(async () => expect(await stored()).toEqual([]));
  });

  it('does not empty them while the session is still being restored when the app starts', async () => {
    useSession.setState({ status: 'loading', user: null });
    await reopen([pending(1)]);
    await renderHook(() => useClearPendingOnSignOut());
    await act(async () => useSession.setState({ status: 'signedIn', user: { id: 'me', role: 'STUDENT' } as never }));
    expect(usePendingStore.getState().items).toHaveLength(1);
    await act(async () => useSession.setState({ status: 'signedOut', user: null }));
    expect(usePendingStore.getState().items).toHaveLength(0);
  });
});
