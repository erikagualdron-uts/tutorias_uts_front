import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useSession } from '@/store/session';
import { chatSocket, closeChatSocket, openChatSocket } from '../socket';
import type { ChatMessage } from '../types';
import { chatKeys, insertMessage } from './useChatData';
import { flushPending, useClearPendingOnSignOut, usePendingStore } from './usePendingMessages';

// Mounted once while signed in: keeps the socket up, feeds the queries with what arrives and, when the
// connection comes back or the app returns to the front, asks again for what may have been missed and
// sends what was waiting.
export function useChatSocket() {
  const client = useQueryClient();
  const signedIn = useSession((s) => s.status === 'signedIn');
  useClearPendingOnSignOut();
  // The pending messages are read from the device after the app opens: what was waiting goes out as soon as they are here.
  useEffect(() => usePendingStore.persist.onFinishHydration(() => flushPending(client)), [client]);

  useEffect(() => {
    if (!signedIn) {
      closeChatSocket();
      return;
    }
    const socket = openChatSocket();
    let first = true;
    const onMessage = (message: ChatMessage) => {
      insertMessage(client, message);
      void client.invalidateQueries({ queryKey: chatKeys.conversations });
    };
    const onUnread = ({ unread }: { unread: number }) => client.setQueryData(chatKeys.unread, { unread });
    const onConnect = () => {
      if (!first) void client.invalidateQueries({ queryKey: chatKeys.all });
      first = false;
      flushPending(client);
    };
    socket.on('message:new', onMessage);
    socket.on('unread:changed', onUnread);
    socket.on('connect', onConnect);
    const app = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      if (!chatSocket()?.connected) chatSocket()?.connect();
      flushPending(client);
    });
    return () => {
      socket.off('message:new', onMessage);
      socket.off('unread:changed', onUnread);
      socket.off('connect', onConnect);
      app.remove();
    };
  }, [client, signedIn]);
}

// While a conversation is on screen the server must know, so it sends no push for it.
export function useOpenConversation(conversationId: string) {
  useEffect(() => {
    const socket = openChatSocket();
    const open = () => socket.emit('conversation:open', { conversationId });
    if (socket.connected) open();
    socket.on('connect', open);
    return () => {
      socket.off('connect', open);
      if (socket.connected) socket.emit('conversation:close', { conversationId });
    };
  }, [conversationId]);
}
