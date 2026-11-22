import { useCallback, useEffect, useRef, useState } from 'react';
import { openChatSocket } from '../socket';
import type { ChatMessage } from '../types';

// The "is typing" notice of a direct chat (spec 022). It is ephemeral: the server only relays it while the other
// person has the conversation open, and the receiver turns it off by itself, so there is no "stopped" event.
const EMIT_EVERY_MS = 3_000;
const SHOW_FOR_MS = 5_000;

// Whether the other person is typing in this conversation. A module chat has no partner: nothing is listened to.
export function usePartnerTyping(conversationId: string, partnerId: string | undefined): boolean {
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    if (!partnerId) return;
    const socket = openChatSocket();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      clearTimeout(timer);
      setTyping(false);
    };
    const onTyping = (notice: { conversationId: string; userId: string }) => {
      if (notice.conversationId !== conversationId || notice.userId !== partnerId) return;
      setTyping(true);
      clearTimeout(timer);
      timer = setTimeout(stop, SHOW_FOR_MS);
    };
    const onMessage = (message: ChatMessage) => {
      if (message.conversationId === conversationId && message.sender.id === partnerId) stop();
    };
    socket.on('typing', onTyping);
    socket.on('message:new', onMessage);
    socket.on('disconnect', stop);
    return () => {
      clearTimeout(timer);
      socket.off('typing', onTyping);
      socket.off('message:new', onMessage);
      socket.off('disconnect', stop);
    };
  }, [conversationId, partnerId]);
  return typing;
}

// The function to call when the text of the composer changes: it tells the server, at most every 3 seconds, and
// only in a direct chat the user can write in.
export function useTypingEmitter(conversationId: string, enabled: boolean): () => void {
  const last = useRef(0);
  return useCallback(() => {
    if (!enabled) return;
    const now = Date.now();
    if (now - last.current < EMIT_EVERY_MS) return;
    const socket = openChatSocket();
    if (!socket.connected) return;
    last.current = now;
    socket.emit('typing', { conversationId });
  }, [conversationId, enabled]);
}
