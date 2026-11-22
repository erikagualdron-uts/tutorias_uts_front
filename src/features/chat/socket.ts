import { io, type Socket } from 'socket.io-client';
import { create } from 'zustand';
import { useSession } from '@/store/session';

interface ConnectionState {
  connected: boolean;
  set: (connected: boolean) => void;
}

// Whether the chat socket is connected: the "Reconnecting…" banner reads it.
export const useChatConnection = create<ConnectionState>((set) => ({ connected: false, set: (connected) => set({ connected }) }));

let socket: Socket | null = null;

// The token is read again on every attempt, so a reconnection after the session was renewed uses the new one.
export function openChatSocket(): Socket {
  if (socket) return socket;
  const created = io(`${process.env.EXPO_PUBLIC_API_URL ?? ''}/chat`, {
    transports: ['websocket'],
    auth: (done) => done({ token: useSession.getState().accessToken }),
  });
  created.on('connect', () => useChatConnection.getState().set(true));
  created.on('disconnect', () => useChatConnection.getState().set(false));
  created.on('connect_error', () => useChatConnection.getState().set(false));
  socket = created;
  return created;
}

export function closeChatSocket() {
  socket?.close();
  socket = null;
  useChatConnection.getState().set(false);
}

export const chatSocket = () => socket;
