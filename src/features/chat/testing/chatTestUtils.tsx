import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { api } from '@/api/client';
import type { ChatMessage, ChatPerson, ConversationDetail, ConversationSummary } from '../types';

export const mockedApi = api as jest.Mock;

export const person = (id: string, role: ChatPerson['role'] = 'TEACHER', firstName = 'Ana', lastName = 'Pérez'): ChatPerson => ({ id, role, firstName, lastName });

export const message = (n: number, overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: `m${n}`,
  conversationId: 'c1',
  sender: person('t1'),
  kind: 'TEXT',
  body: `Mensaje ${n}`,
  clientMessageId: `00000000-0000-4000-8000-00000000000${n}`,
  createdAt: new Date(Date.now() - (10 - n) * 60_000).toISOString(),
  ...overrides,
});

export const summary = (overrides: Partial<ConversationSummary> = {}): ConversationSummary => ({
  id: 'c1',
  type: 'DIRECT',
  partner: person('t1'),
  module: null,
  unread: 0,
  lastMessage: null,
  lastMessageAt: null,
  ...overrides,
});

export const detail = (overrides: Partial<ConversationDetail> = {}): ConversationDetail => ({
  ...summary(),
  canWrite: true,
  readOnlyReason: null,
  canAnnounce: false,
  limits: { messageMaxLength: 2000 },
  ...overrides,
});

export const page = (data: ChatMessage[], next: string | null = null) => ({ data, next });

type Handler = unknown | ((options?: { body?: Record<string, unknown> }) => unknown);

// Answers each `METHOD /path` (without the query) from a map; any other call fails the test loudly.
export function routes(map: Record<string, Handler>) {
  mockedApi.mockImplementation((path: string, options?: { method?: string; body?: Record<string, unknown> }) => {
    const key = `${options?.method ?? 'GET'} ${path.split('?')[0]}`;
    if (!(key in map)) return Promise.reject(new Error(`no route for ${key}`));
    const handler = map[key];
    return Promise.resolve().then(() => (typeof handler === 'function' ? (handler as (o?: unknown) => unknown)(options) : handler));
  });
}

export const paths = () => mockedApi.mock.calls.map(([path, options]) => `${options?.method ?? 'GET'} ${path as string}`);
export const posts = (path: string) => mockedApi.mock.calls.filter(([p, o]) => p === path && o?.method === 'POST');

export const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

export const renderWith = (ui: ReactElement, queryClient = client()) => render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
