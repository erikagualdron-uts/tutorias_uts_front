import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { create } from 'zustand';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import { newRequestId } from '@/features/pqrs/requestId';
import type { ChatMessage, MessageKind, PendingMessage } from '../types';
import { chatKeys, insertMessage } from './useChatData';

interface PendingState {
  items: PendingMessage[];
  add: (item: PendingMessage) => void;
  patch: (clientMessageId: string, change: Partial<PendingMessage>) => void;
  remove: (clientMessageId: string) => void;
}

// In memory only: a message that was not sent before the app closed is not kept.
export const usePendingStore = create<PendingState>((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })),
  patch: (id, change) => set((s) => ({ items: s.items.map((i) => (i.clientMessageId === id ? { ...i, ...change } : i)) })),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.clientMessageId !== id) })),
}));

const inFlight = new Set<string>();

// One attempt. A network failure leaves it "sending" for the next flush (reconnection or the app coming
// back to the front); any answer of the server that refuses it marks it "failed" for a manual retry. The
// same `clientMessageId` makes a repeated attempt safe: the server returns the message it already saved.
export async function attemptSend(client: QueryClient, item: PendingMessage) {
  if (inFlight.has(item.clientMessageId)) return;
  inFlight.add(item.clientMessageId);
  const { patch, remove } = usePendingStore.getState();
  try {
    const message = await api<ChatMessage>(`/chat/conversations/${item.conversationId}/messages`, {
      method: 'POST',
      body: { clientMessageId: item.clientMessageId, body: item.body, kind: item.kind },
    });
    remove(item.clientMessageId);
    insertMessage(client, message);
    // The list and the history are asked again so a fetch that was already in flight cannot hide the new message.
    void client.invalidateQueries({ queryKey: chatKeys.conversations });
    void client.invalidateQueries({ queryKey: chatKeys.messages(item.conversationId) });
  } catch (error) {
    const code = error instanceof ApiError ? error.code : 'UNKNOWN';
    patch(item.clientMessageId, code === 'NETWORK' ? { status: 'sending' } : { status: 'failed', errorCode: code });
  } finally {
    inFlight.delete(item.clientMessageId);
  }
}

// Tries again everything that is still "sending".
export function flushPending(client: QueryClient) {
  for (const item of usePendingStore.getState().items) if (item.status === 'sending') void attemptSend(client, item);
}

export function usePendingMessages(conversationId: string) {
  const client = useQueryClient();
  const items = usePendingStore((s) => s.items);
  const send = useCallback(
    (body: string, kind: MessageKind) => {
      const item: PendingMessage = {
        clientMessageId: newRequestId(),
        conversationId,
        body,
        kind,
        createdAt: new Date().toISOString(),
        status: 'sending',
      };
      usePendingStore.getState().add(item);
      void attemptSend(client, item);
    },
    [client, conversationId],
  );
  const retry = useCallback(
    (clientMessageId: string) => {
      usePendingStore.getState().patch(clientMessageId, { status: 'sending', errorCode: undefined });
      const item = usePendingStore.getState().items.find((i) => i.clientMessageId === clientMessageId);
      if (item) void attemptSend(client, item);
    },
    [client],
  );
  return { pending: items.filter((i) => i.conversationId === conversationId), send, retry };
}
