import { act, renderHook } from '@testing-library/react-native';
import { io } from 'socket.io-client';
import { closeChatSocket } from '../socket';
import { usePartnerTyping, useTypingEmitter } from '../hooks/useTyping';

type Handler = (...args: unknown[]) => void;
const handlers: Record<string, Handler[]> = {};
const socket = {
  connected: true,
  on(event: string, handler: Handler) {
    (handlers[event] ??= []).push(handler);
    return socket;
  },
  off(event: string, handler: Handler) {
    handlers[event] = (handlers[event] ?? []).filter((h) => h !== handler);
    return socket;
  },
  emit: jest.fn(),
  close: jest.fn(),
};
const fire = (event: string, ...args: unknown[]) => act(() => void (handlers[event] ?? []).forEach((h) => h(...args)));
const step = (ms: number) => act(() => void jest.advanceTimersByTime(ms));

const C1 = 'c1';
const PARTNER = 'partner';
const typingOf = (conversationId = C1, userId = PARTNER) => ({ conversationId, userId });
const messageFrom = (senderId: string, conversationId = C1) => ({ id: 'm1', conversationId, sender: { id: senderId }, body: 'hola' });

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  for (const key of Object.keys(handlers)) delete handlers[key];
  socket.connected = true;
  (io as jest.Mock).mockReturnValue(socket);
  closeChatSocket();
});
afterEach(() => jest.useRealTimers());

describe('usePartnerTyping', () => {
  it('is false until the other person types, then true, and off by itself after 5 seconds', async () => {
    const { result } = await renderHook(() => usePartnerTyping(C1, PARTNER));
    expect(result.current).toBe(false);
    await fire('typing', typingOf());
    expect(result.current).toBe(true);
    await step(4_999);
    expect(result.current).toBe(true);
    await step(1);
    expect(result.current).toBe(false);
  });

  it('restarts the 5 seconds with every new signal', async () => {
    const { result } = await renderHook(() => usePartnerTyping(C1, PARTNER));
    await fire('typing', typingOf());
    await step(3_000);
    await fire('typing', typingOf());
    await step(3_000);
    expect(result.current).toBe(true);
    await step(2_000);
    expect(result.current).toBe(false);
  });

  it('turns off at once when a message of that person arrives in that conversation', async () => {
    const { result } = await renderHook(() => usePartnerTyping(C1, PARTNER));
    await fire('typing', typingOf());
    await fire('message:new', messageFrom('someone-else'));
    expect(result.current).toBe(true);
    await fire('message:new', messageFrom(PARTNER, 'c2'));
    expect(result.current).toBe(true);
    await fire('message:new', messageFrom(PARTNER));
    expect(result.current).toBe(false);
  });

  it('turns off when the connection is lost', async () => {
    const { result } = await renderHook(() => usePartnerTyping(C1, PARTNER));
    await fire('typing', typingOf());
    await fire('disconnect');
    expect(result.current).toBe(false);
  });

  it('ignores another conversation and another person', async () => {
    const { result } = await renderHook(() => usePartnerTyping(C1, PARTNER));
    await fire('typing', typingOf('c2'));
    await fire('typing', typingOf(C1, 'stranger'));
    expect(result.current).toBe(false);
  });

  it('listens to nothing in a module chat, which has no partner', async () => {
    const { result } = await renderHook(() => usePartnerTyping(C1, undefined));
    await fire('typing', typingOf());
    expect(result.current).toBe(false);
    expect(handlers.typing ?? []).toHaveLength(0);
  });

  it('stops listening when it unmounts', async () => {
    const { unmount } = await renderHook(() => usePartnerTyping(C1, PARTNER));
    expect(handlers.typing).toHaveLength(1);
    await unmount();
    expect(handlers.typing).toHaveLength(0);
  });
});

describe('useTypingEmitter', () => {
  it('emits typing with the conversation, at most once every 3 seconds', async () => {
    const { result } = await renderHook(() => useTypingEmitter(C1, true));
    result.current();
    result.current();
    expect(socket.emit).toHaveBeenCalledTimes(1);
    expect(socket.emit).toHaveBeenCalledWith('typing', { conversationId: C1 });
    await step(2_999);
    result.current();
    expect(socket.emit).toHaveBeenCalledTimes(1);
    await step(1);
    result.current();
    expect(socket.emit).toHaveBeenCalledTimes(2);
  });

  it('emits nothing when it is not a direct chat I can write in', async () => {
    const { result } = await renderHook(() => useTypingEmitter(C1, false));
    result.current();
    expect(socket.emit).not.toHaveBeenCalled();
  });

  it('emits nothing while the socket is disconnected', async () => {
    socket.connected = false;
    const { result } = await renderHook(() => useTypingEmitter(C1, true));
    result.current();
    expect(socket.emit).not.toHaveBeenCalled();
  });
});
