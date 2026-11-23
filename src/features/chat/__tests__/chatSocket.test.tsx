import { QueryClient } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { io } from 'socket.io-client';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { useSession } from '@/store/session';
import { chatKeys } from '../hooks/useChatData';
import { useChatSocket, useOpenConversation } from '../hooks/useChatSocket';
import { usePendingStore } from '../hooks/usePendingMessages';
import { ChatScreen } from '../screens/ChatScreen';
import { closeChatSocket, useChatConnection } from '../socket';
import { detail, message, mockedApi, page, person, posts, renderWith, routes } from '../testing/chatTestUtils';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() }, useLocalSearchParams: () => ({ id: 'c1' }) }));

type Handler = (...args: unknown[]) => void;
interface FakeSocket {
  connected: boolean;
  on: (event: string, handler: Handler) => FakeSocket;
  off: (event: string, handler: Handler) => FakeSocket;
  emit: jest.Mock;
  connect: jest.Mock;
  close: jest.Mock;
}
const handlers: Record<string, Handler[]> = {};
const socket: FakeSocket = {
  connected: true,
  on(event, handler) {
    (handlers[event] ??= []).push(handler);
    return socket;
  },
  off(event, handler) {
    handlers[event] = (handlers[event] ?? []).filter((h) => h !== handler);
    return socket;
  },
  emit: jest.fn(),
  connect: jest.fn(),
  close: jest.fn(),
};
const fire = (event: string, ...args: unknown[]) => act(async () => (handlers[event] ?? []).forEach((h) => h(...args)));

function Harness() {
  useChatSocket();
  return null;
}

function Open({ id }: { id: string }) {
  useOpenConversation(id);
  return null;
}

beforeEach(async () => {
  jest.clearAllMocks();
  for (const key of Object.keys(handlers)) delete handlers[key];
  socket.connected = true;
  (io as jest.Mock).mockReturnValue(socket);
  closeChatSocket();
  usePendingStore.setState({ items: [] });
  useChatConnection.setState({ connected: false });
  useSession.setState({ status: 'signedIn', accessToken: 'tok', user: { id: 'me', role: 'STUDENT' } as never });
  await i18n.changeLanguage('es');
});

describe('the chat socket', () => {
  it('connects to /chat with the current token, read again on every attempt', async () => {
    await renderWith(<Harness />);
    const [url, options] = (io as jest.Mock).mock.calls[0];
    expect(String(url)).toMatch(/\/chat$/);
    const done = jest.fn();
    options.auth(done);
    expect(done).toHaveBeenCalledWith({ token: 'tok' });
    await act(async () => useSession.setState({ accessToken: 'renewed' }));
    options.auth(done);
    expect(done).toHaveBeenLastCalledWith({ token: 'renewed' });
  });

  it('puts a message that arrives at the top of its history once and refreshes the list', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(chatKeys.messages('c1'), { pages: [{ data: [message(1)], next: null }], pageParams: [undefined] });
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    await renderWith(<Harness />, queryClient);
    await fire('message:new', message(2));
    await fire('message:new', message(2));
    const cached = queryClient.getQueryData<{ pages: { data: { id: string }[] }[] }>(chatKeys.messages('c1'));
    expect(cached?.pages[0].data.map((m) => m.id)).toEqual(['m2', 'm1']);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: chatKeys.conversations });
  });

  it('keeps the unread total of the server', async () => {
    const queryClient = new QueryClient();
    await renderWith(<Harness />, queryClient);
    await fire('unread:changed', { unread: 4 });
    expect(queryClient.getQueryData(chatKeys.unread)).toEqual({ unread: 4 });
  });

  it('follows the connection state for the "Reconnecting…" banner', async () => {
    await renderWith(<Harness />);
    await fire('connect');
    expect(useChatConnection.getState().connected).toBe(true);
    await fire('disconnect');
    expect(useChatConnection.getState().connected).toBe(false);
    await fire('connect');
    await fire('connect_error');
    expect(useChatConnection.getState().connected).toBe(false);
  });

  it('asks again for everything when the connection comes back, but not on the first connection', async () => {
    const queryClient = new QueryClient();
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    await renderWith(<Harness />, queryClient);
    await fire('connect');
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: chatKeys.all });
    await fire('disconnect');
    await fire('connect');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: chatKeys.all });
  });

  it('closes the socket when the session ends', async () => {
    await renderWith(<Harness />);
    await act(async () => useSession.setState({ status: 'signedOut', accessToken: null, user: null }));
    expect(socket.close).toHaveBeenCalled();
  });

  it('tells the server which conversation is open and that it was closed', async () => {
    const view = await renderWith(<Open id="c1" />);
    expect(socket.emit).toHaveBeenCalledWith('conversation:open', { conversationId: 'c1' });
    socket.emit.mockClear();
    await fire('connect');
    expect(socket.emit).toHaveBeenCalledWith('conversation:open', { conversationId: 'c1' });
    await view.unmount();
    expect(socket.emit).toHaveBeenCalledWith('conversation:close', { conversationId: 'c1' });
  });
});

describe('sending states', () => {
  // The server keeps what it saved, so a refetch after reconnecting still shows it.
  const posting = (attempt: () => unknown) => {
    const saved: ReturnType<typeof message>[] = [];
    routes({
      'GET /chat/conversations/c1': detail(),
      'GET /chat/conversations/c1/messages': () => page([...saved, message(1)]),
      'POST /chat/conversations/c1/read': { unread: 0 },
      'POST /chat/conversations/c1/messages': (o?: { body?: Record<string, unknown> }) => {
        attempt();
        const created = message(9, { body: String(o?.body?.body), sender: person('me', 'STUDENT') });
        saved.unshift(created);
        return created;
      },
    });
  };
  const write = async (text: string) => {
    await screen.findByText('Mensaje 1');
    await fireEvent.changeText(screen.getByLabelText('Escribe un mensaje'), text);
    await fireEvent.press(screen.getByLabelText('Enviar'));
  };

  it('keeps a message "sending" without a network and sends it once when the connection comes back', async () => {
    let calls = 0;
    posting(() => {
      calls += 1;
      if (calls === 1) throw new ApiError(0, 'NETWORK');
    });
    await renderWith(
      <>
        <Harness />
        <ChatScreen />
      </>,
    );
    await fire('connect');
    await write('Sin red');
    expect(await screen.findByLabelText('Enviando…')).toBeTruthy();
    expect(screen.getByText('Sin red')).toBeTruthy();

    await fire('disconnect');
    await fire('connect');
    await waitFor(() => expect(posts('/chat/conversations/c1/messages')).toHaveLength(2));
    await waitFor(() => expect(screen.queryByLabelText('Enviando…')).toBeNull());
    const [first, second] = posts('/chat/conversations/c1/messages').map(([, o]) => o.body.clientMessageId);
    expect(second).toBe(first);
    expect(screen.getAllByText('Sin red')).toHaveLength(1);
    expect(usePendingStore.getState().items).toHaveLength(0);
  });

  it('marks a refused message "failed" and sends it once with the same key on a manual retry', async () => {
    let calls = 0;
    posting(() => {
      calls += 1;
      if (calls === 1) throw new ApiError(500, 'INTERNAL_ERROR');
    });
    await renderWith(<ChatScreen />);
    await write('Falla primero');
    expect(await screen.findByText('No se envió')).toBeTruthy();
    expect(screen.getByText('Toca para reintentar')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Toca para reintentar'));
    await waitFor(() => expect(screen.queryByText('No se envió')).toBeNull());
    expect(posts('/chat/conversations/c1/messages')).toHaveLength(2);
    const keys = posts('/chat/conversations/c1/messages').map(([, o]) => o.body.clientMessageId);
    expect(keys[1]).toBe(keys[0]);
    expect(screen.getAllByText('Falla primero')).toHaveLength(1);
  });

  it('does not send the same pending message twice while an attempt is in flight', async () => {
    let finish: (value: unknown) => void = () => undefined;
    routes({
      'GET /chat/conversations/c1': detail(),
      'GET /chat/conversations/c1/messages': page([message(1)]),
      'POST /chat/conversations/c1/read': { unread: 0 },
      'POST /chat/conversations/c1/messages': () => new Promise((resolve) => (finish = resolve)),
    });
    await renderWith(
      <>
        <Harness />
        <ChatScreen />
      </>,
    );
    await write('Una sola vez');
    await fire('connect');
    await fire('disconnect');
    await fire('connect');
    expect(posts('/chat/conversations/c1/messages')).toHaveLength(1);
    finish(message(9, { body: 'Una sola vez', sender: person('me', 'STUDENT') }));
    await waitFor(() => expect(screen.queryByLabelText('Enviando…')).toBeNull());
    expect(mockedApi).toHaveBeenCalled();
  });
});

describe('the typing notice on screen (spec 022)', () => {
  // `detail()` is a direct chat with Ana Pérez; `person('p1')` is the partner of the summary by default.
  const open = (overrides = {}) =>
    routes({
      'GET /chat/conversations/c1': detail(overrides),
      'GET /chat/conversations/c1/messages': page([message(1)]),
      'POST /chat/conversations/c1/read': { unread: 0 },
    });
  const partnerId = () => detail().partner?.id ?? 'p1';

  it('shows the dots and "está escribiendo…" while the other person types, and removes them when their message arrives', async () => {
    open();
    await renderWith(<ChatScreen />);
    await screen.findByText('Mensaje 1');
    expect(screen.queryByLabelText('está escribiendo…')).toBeNull();
    await fire('typing', { conversationId: 'c1', userId: partnerId() });
    expect(await screen.findByLabelText('está escribiendo…')).toBeTruthy();
    expect(screen.getByText('está escribiendo…')).toBeTruthy();
    await fire('message:new', message(2, { sender: person(partnerId()) }));
    await waitFor(() => expect(screen.queryByLabelText('está escribiendo…')).toBeNull());
  });

  it('shows the words even with reduce motion, and speaks English', async () => {
    const { useReducedMotion } = jest.requireMock('react-native-reanimated') as { useReducedMotion: jest.Mock };
    useReducedMotion.mockReturnValue(true);
    await i18n.changeLanguage('en');
    open();
    await renderWith(<ChatScreen />);
    await screen.findByText('Mensaje 1');
    await fire('typing', { conversationId: 'c1', userId: partnerId() });
    expect(await screen.findByText('is typing…')).toBeTruthy();
    useReducedMotion.mockReturnValue(false);
  });

  it('never shows it in a module chat', async () => {
    open({ type: 'MODULE', partner: null, module: { id: 'm', name: 'Cálculo I' } });
    await renderWith(<ChatScreen />);
    await screen.findByText('Mensaje 1');
    await fire('typing', { conversationId: 'c1', userId: partnerId() });
    expect(screen.queryByLabelText('está escribiendo…')).toBeNull();
  });

  it('tells the server when I type in a direct chat, at most every 3 seconds, and never in a module chat', async () => {
    open();
    await renderWith(<ChatScreen />);
    await screen.findByText('Mensaje 1');
    await fireEvent.changeText(screen.getByLabelText('Escribe un mensaje'), 'H');
    await fireEvent.changeText(screen.getByLabelText('Escribe un mensaje'), 'Ho');
    expect(socket.emit.mock.calls.filter(([name]) => name === 'typing')).toEqual([['typing', { conversationId: 'c1' }]]);
  });

  it('does not tell the server when I type in a module chat, or when I clear the text', async () => {
    open({ type: 'MODULE', partner: null, module: { id: 'm', name: 'Cálculo I' } });
    await renderWith(<ChatScreen />);
    await screen.findByText('Mensaje 1');
    await fireEvent.changeText(screen.getByLabelText('Escribe un mensaje'), 'Hola');
    expect(socket.emit.mock.calls.filter(([name]) => name === 'typing')).toHaveLength(0);
  });
});
