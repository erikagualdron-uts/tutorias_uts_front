import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import { newRequestId } from '@/features/pqrs/requestId';
import { useSession } from '@/store/session';
import type { ChatMessage, MessageKind, PendingMessage } from '../types';
import { chatKeys, insertMessage } from './useChatData';

interface PendingState {
  items: PendingMessage[];
  add: (item: PendingMessage) => void;
  patch: (clientMessageId: string, change: Partial<PendingMessage>) => void;
  // Takes it out for good: a sent message and a discarded one leave the same way.
  remove: (clientMessageId: string) => void;
  clear: () => void;
}

// A storage that never throws: if the device cannot read or write, sending still works from memory and the
// messages only lose the way to survive the app closing (spec 022, FR-006).
const safeStorage = createJSONStorage(() => ({
  getItem: (key) => AsyncStorage.getItem(key).catch(() => null),
  setItem: (key, value) => AsyncStorage.setItem(key, value).catch(() => undefined),
  removeItem: (key) => AsyncStorage.removeItem(key).catch(() => undefined),
}));

// Kept on the device (AsyncStorage, key `chat-pending`): a message that was not sent before the app closed goes
// out when it opens again with a connection (spec 022). Only the list is saved.
export const usePendingStore = create<PendingState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) => set((s) => ({ items: [...s.items, item] })),
      patch: (id, change) => set((s) => ({ items: s.items.map((i) => (i.clientMessageId === id ? { ...i, ...change } : i)) })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.clientMessageId !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'chat-pending', storage: safeStorage, partialize: (s) => ({ items: s.items }) },
  ),
);

// The pending messages are of whoever wrote them. When the session goes from signed in to signed out they are
// emptied; while it is still restored at start ("loading") nothing is touched.
export function useClearPendingOnSignOut() {
  const status = useSession((s) => s.status);
  const previous = useRef(status);
  useEffect(() => {
    if (previous.current === 'signedIn' && status !== 'signedIn') usePendingStore.getState().clear();
    previous.current = status;
  }, [status]);
}

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

// Tries again everything of the signed-in user that is still "sending", in the order it was written.
export function flushPending(client: QueryClient) {
  const me = useSession.getState().user?.id;
  for (const item of usePendingStore.getState().items) {
    if (item.userId === me && item.status === 'sending') void attemptSend(client, item);
  }
}

export function usePendingMessages(conversationId: string) {
  const client = useQueryClient();
  const items = usePendingStore((s) => s.items);
  const me = useSession((s) => s.user?.id);
  const send = useCallback(
    (body: string, kind: MessageKind) => {
      if (!me) return;
      const item: PendingMessage = {
        userId: me,
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
    [client, conversationId, me],
  );
  const retry = useCallback(
    (clientMessageId: string) => {
      usePendingStore.getState().patch(clientMessageId, { status: 'sending', errorCode: undefined });
      const item = usePendingStore.getState().items.find((i) => i.clientMessageId === clientMessageId);
      if (item) void attemptSend(client, item);
    },
    [client],
  );
  const discard = useCallback((clientMessageId: string) => usePendingStore.getState().remove(clientMessageId), []);
  return { pending: items.filter((i) => i.userId === me && i.conversationId === conversationId), send, retry, discard };
}
