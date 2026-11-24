import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { useSession } from '@/store/session';
import { ChatScreen } from '../screens/ChatScreen';
import { NewChatScreen } from '../screens/NewChatScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { useChatConnection } from '../socket';
import { usePendingStore } from '../hooks/usePendingMessages';
import { detail, message, mockedApi, page, paths, person, posts, renderWith, routes, summary } from '../testing/chatTestUtils';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), replace: (...a: unknown[]) => mockReplace(...a), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'c1' }),
}));

void api;

beforeEach(async () => {
  jest.clearAllMocks();
  usePendingStore.setState({ items: [] });
  useChatConnection.setState({ connected: true });
  useSession.setState({ status: 'signedIn', user: { id: 'me', role: 'STUDENT' } as never });
  await i18n.changeLanguage('es');
});

describe('ChatScreen', () => {
  // The server keeps what it saves, so the history asked again after a send still has it.
  const open = (overrides = {}, history = [message(1), message(2, { sender: person('me', 'STUDENT', 'Yo', 'Mismo') })]) => {
    const saved: ReturnType<typeof message>[] = [];
    routes({
      'GET /chat/conversations/c1': detail(overrides),
      'GET /chat/conversations/c1/messages': () => page([...saved, ...history]),
      'POST /chat/conversations/c1/read': { unread: 0 },
      'POST /chat/conversations/c1/messages': (o?: { body?: Record<string, unknown> }) => {
        const created = message(9, { body: String(o?.body?.body), sender: person('me', 'STUDENT') });
        saved.unshift(created);
        return created;
      },
    });
  };

  it('shows the history with the bubbles, the time, a date separator and marks the conversation read', async () => {
    open();
    await renderWith(<ChatScreen />);
    expect(await screen.findByText('Mensaje 1')).toBeTruthy();
    expect(screen.getByText('Mensaje 2')).toBeTruthy();
    expect(screen.getByText('Hoy')).toBeTruthy();
    expect(screen.getByText('Ana Pérez')).toBeTruthy();
    await waitFor(() => expect(posts('/chat/conversations/c1/read')).toHaveLength(1));
  });

  it('shows the avatar of the person with initials in the header, and the group icon in a module chat', async () => {
    open();
    await renderWith(<ChatScreen />);
    expect(await screen.findByText('AP', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0);
  });

  it('shows the group icon in the header of a module chat', async () => {
    open({ type: 'MODULE', partner: null, module: { id: 'm', name: 'Cálculo I' } });
    await renderWith(<ChatScreen />);
    await screen.findByText('Cálculo I');
    expect(screen.getAllByTestId('icon:solar:users-group-rounded-linear', { includeHiddenElements: true }).length).toBeGreaterThan(0);
  });

  it('shows what I wrote as sent and the module name with the writer of each message in a module chat', async () => {
    open({ type: 'MODULE', partner: null, module: { id: 'm', name: 'Cálculo I' } }, [message(1), message(2, { sender: person('me', 'STUDENT') })]);
    await renderWith(<ChatScreen />);
    expect(await screen.findByText('Mensaje 1')).toBeTruthy();
    expect(screen.getAllByText('Cálculo I').length).toBeGreaterThan(0);
    expect(screen.getByText('Chat del módulo')).toBeTruthy();
    expect(screen.getByLabelText('Enviado')).toBeTruthy();
    expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0);
  });

  it('renders an announcement as a card with its label and the name of the teacher', async () => {
    open({ type: 'MODULE', partner: null, module: { id: 'm', name: 'Cálculo I' } }, [message(1, { kind: 'ANNOUNCEMENT', body: 'Mañana no hay clase' })]);
    await renderWith(<ChatScreen />);
    expect(await screen.findByText('Mañana no hay clase')).toBeTruthy();
    expect(screen.getByText('Anuncio')).toBeTruthy();
    expect(screen.getByText('· Ana Pérez')).toBeTruthy();
  });

  it('disables "Enviar" while the text is empty and sends the trimmed text once', async () => {
    open();
    await renderWith(<ChatScreen />);
    await screen.findByText('Mensaje 1');
    const send = screen.getByLabelText('Enviar');
    expect(send.props.accessibilityState?.disabled).toBe(true);
    await fireEvent.changeText(screen.getByLabelText('Escribe un mensaje'), '   Hola profe   ');
    await fireEvent.press(screen.getByLabelText('Enviar'));
    await waitFor(() => expect(posts('/chat/conversations/c1/messages')).toHaveLength(1));
    const body = posts('/chat/conversations/c1/messages')[0][1].body;
    expect(body).toMatchObject({ body: 'Hola profe', kind: 'TEXT' });
    expect(body.clientMessageId).toMatch(/^[0-9a-f-]{36}$/);
    expect(await screen.findByText('Hola profe')).toBeTruthy();
  });

  it('shows a pending message in its conversation, with its state and a way to discard it', async () => {
    open();
    usePendingStore.getState().add({
      clientMessageId: '00000000-0000-4000-8000-0000000000aa',
      conversationId: 'c1',
      body: 'Sin enviar',
      kind: 'TEXT',
      createdAt: '2030-01-08T19:00:00.000Z',
      status: 'sending',
      userId: 'me',
    });
    usePendingStore.getState().add({
      clientMessageId: '00000000-0000-4000-8000-0000000000bb',
      conversationId: 'c1',
      body: 'Rechazado',
      kind: 'TEXT',
      createdAt: '2030-01-08T19:01:00.000Z',
      status: 'failed',
      errorCode: 'INTERNAL_ERROR',
      userId: 'me',
    });
    usePendingStore.getState().add({
      clientMessageId: '00000000-0000-4000-8000-0000000000cc',
      conversationId: 'c1',
      body: 'De otra cuenta',
      kind: 'TEXT',
      createdAt: '2030-01-08T19:02:00.000Z',
      status: 'sending',
      userId: 'someone-else',
    });
    await renderWith(<ChatScreen />);
    expect(await screen.findByText('Sin enviar')).toBeTruthy();
    expect(screen.getByText('Rechazado')).toBeTruthy();
    expect(screen.queryByText('De otra cuenta')).toBeNull();
    expect(screen.getByText('No se envió')).toBeTruthy();
    expect(screen.getByLabelText('Toca para reintentar')).toBeTruthy();
    expect(screen.getAllByLabelText('Descartar')).toHaveLength(2);

    await fireEvent.press(screen.getAllByLabelText('Descartar')[0]);
    await waitFor(() => expect(screen.getAllByLabelText('Descartar')).toHaveLength(1));
    await fireEvent.press(screen.getByLabelText('Descartar'));
    await waitFor(() => expect(screen.queryByText('Rechazado')).toBeNull());
    expect(screen.queryByText('Sin enviar')).toBeNull();
    expect(usePendingStore.getState().items.map((i) => i.body)).toEqual(['De otra cuenta']);
  });

  it('says "Discard" in English', async () => {
    await i18n.changeLanguage('en');
    open();
    usePendingStore.getState().add({
      clientMessageId: '00000000-0000-4000-8000-0000000000dd',
      conversationId: 'c1',
      body: 'Unsent',
      kind: 'TEXT',
      createdAt: '2030-01-08T19:00:00.000Z',
      status: 'failed',
      userId: 'me',
    });
    await renderWith(<ChatScreen />);
    expect(await screen.findByLabelText('Discard')).toBeTruthy();
    expect(screen.getByLabelText('Tap to retry')).toBeTruthy();
  });

  it('shows the counter with the limit that the API gives', async () => {
    open({ limits: { messageMaxLength: 500 } });
    await renderWith(<ChatScreen />);
    expect(await screen.findByText('0/500')).toBeTruthy();
  });

  it('offers the announcement switch only to whoever can announce', async () => {
    open({ canAnnounce: true, type: 'MODULE', partner: null, module: { id: 'm', name: 'Cálculo I' } });
    const first = await renderWith(<ChatScreen />);
    await screen.findByText('Mensaje 1');
    await fireEvent.press(screen.getByLabelText('Anuncio'));
    await fireEvent.changeText(screen.getByLabelText('Escribe un mensaje'), 'Traigan calculadora');
    await fireEvent.press(screen.getByLabelText('Enviar'));
    await waitFor(() => expect(posts('/chat/conversations/c1/messages')[0][1].body).toMatchObject({ kind: 'ANNOUNCEMENT' }));
    await first.unmount();

    jest.clearAllMocks();
    open({ canAnnounce: false });
    await renderWith(<ChatScreen />);
    await screen.findByText('Mensaje 1');
    expect(screen.queryByLabelText('Tipo de mensaje')).toBeNull();
  });

  it.each([
    ['NO_SHARED_MODULE', 'Ya no comparten un módulo, así que solo puedes leer esta conversación.'],
    ['PERIOD_CLOSED', 'El periodo de este módulo está cerrado, así que solo puedes leer el chat.'],
    ['PARTNER_UNAVAILABLE', 'La cuenta de la otra persona no está disponible, así que solo puedes leer esta conversación.'],
  ])('read-only (%s): hides the composer and says the rule', async (reason, text) => {
    open({ canWrite: false, readOnlyReason: reason });
    await renderWith(<ChatScreen />);
    expect(await screen.findByText(text)).toBeTruthy();
    expect(screen.queryByLabelText('Enviar')).toBeNull();
    expect(screen.getByText('Mensaje 1')).toBeTruthy();
  });

  it('says the rule in English', async () => {
    await i18n.changeLanguage('en');
    open({ canWrite: false, readOnlyReason: 'NO_SHARED_MODULE' });
    await renderWith(<ChatScreen />);
    expect(await screen.findByText('You no longer share a module, so you can only read this conversation.')).toBeTruthy();
  });

  it('shows the empty, loading and error-with-retry states', async () => {
    open({}, []);
    const empty = await renderWith(<ChatScreen />);
    expect(await screen.findByText('Aún no hay mensajes. Escribe el primero.')).toBeTruthy();
    await empty.unmount();

    mockedApi.mockReturnValue(new Promise(() => undefined));
    const loading = await renderWith(<ChatScreen />);
    expect(screen.queryByText('Aún no hay mensajes. Escribe el primero.')).toBeNull();
    await loading.unmount();

    mockedApi.mockRejectedValue(new ApiError(500, 'INTERNAL_ERROR'));
    await renderWith(<ChatScreen />);
    expect(await screen.findByText('No pudimos cargar la conversación')).toBeTruthy();
    expect(screen.getByLabelText('Intentar de nuevo')).toBeTruthy();
  });

  it('asks for the earlier messages with the cursor when the top is reached', async () => {
    routes({
      'GET /chat/conversations/c1': detail(),
      'GET /chat/conversations/c1/messages': () => page([message(1)], 'cursor-2'),
      'POST /chat/conversations/c1/read': { unread: 0 },
    });
    await renderWith(<ChatScreen />);
    await screen.findByText('Mensaje 1');
    await act(async () => screen.getByTestId('chat-messages').props.onEndReached());
    await waitFor(() => expect(paths().some((p) => p.includes('before=cursor-2'))).toBe(true));
  });
});

describe('NewChatScreen', () => {
  const contact = { ...person('t1'), modules: ['Cálculo I'] };

  it('lists who I can write to with their role and modules, and opens the conversation on a tap', async () => {
    routes({ 'GET /chat/contacts': [contact], 'POST /chat/conversations': detail({ id: 'c7' }) });
    await renderWith(<NewChatScreen />);
    expect(await screen.findByText('Ana Pérez')).toBeTruthy();
    expect(screen.getByText('Docente · Cálculo I')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Ana Pérez'));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith({ pathname: '/(student)/messages/[id]', params: { id: 'c7' } }));
    expect(posts('/chat/conversations')[0][1].body).toEqual({ userId: 't1' });
  });

  it('sends the search to the server', async () => {
    routes({ 'GET /chat/contacts': [contact] });
    await renderWith(<NewChatScreen />);
    await screen.findByText('Ana Pérez');
    await fireEvent.changeText(screen.getByLabelText('Buscar por nombre'), ' perez ');
    await waitFor(() => expect(paths()).toContain('GET /chat/contacts?search=perez'));
  });

  it('shows the empty and error states and the reason when opening fails', async () => {
    routes({ 'GET /chat/contacts': [] });
    const empty = await renderWith(<NewChatScreen />);
    expect(await screen.findByText('Todavía no hay con quién hablar')).toBeTruthy();
    await empty.unmount();

    routes({ 'GET /chat/contacts': () => Promise.reject(new ApiError(500, 'INTERNAL_ERROR')) });
    const failed = await renderWith(<NewChatScreen />);
    expect(await screen.findByText('No pudimos cargar a quién puedes escribir')).toBeTruthy();
    await failed.unmount();

    routes({ 'GET /chat/contacts': [contact], 'POST /chat/conversations': () => Promise.reject(new ApiError(403, 'CHAT_PARTNER_NOT_ALLOWED')) });
    await renderWith(<NewChatScreen />);
    await fireEvent.press(await screen.findByLabelText('Ana Pérez'));
    expect(await screen.findByText(/Solo se conversa con quien comparte un módulo contigo/)).toBeTruthy();
  });
});

describe('MessagesScreen', () => {
  const list = [
    summary({ id: 'c1', unread: 2, lastMessage: message(1, { body: 'Hola' }), lastMessageAt: new Date().toISOString() }),
    summary({ id: 'c2', type: 'MODULE', partner: null, module: { id: 'm', name: 'Cálculo I' }, lastMessage: message(2, { kind: 'ANNOUNCEMENT', body: 'Sin clase' }) }),
    summary({ id: 'c3', type: 'MODULE', partner: null, module: { id: 'n', name: 'Física' } }),
  ];

  it('opens with the brand header and no count', async () => {
    await renderWith(<MessagesScreen />);
    expect(await screen.findByRole('header', { name: i18n.t('tabs.messages') })).toBeTruthy();
  });

  it('has Alerts and Chats, lists the chats with the unread count as text and opens one', async () => {
    routes({ 'GET /chat/conversations': list });
    await renderWith(<MessagesScreen />);
    expect(await screen.findByText('Ana Pérez')).toBeTruthy();
    expect(screen.getByLabelText('Avisos')).toBeTruthy();
    expect(screen.getByLabelText('Chats')).toBeTruthy();
    expect(screen.getByText('2 sin leer')).toBeTruthy();
    expect(screen.getByText('Anuncio: Sin clase')).toBeTruthy();
    expect(screen.getByText('Sin mensajes')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(/^Ana Pérez/));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/(student)/messages/[id]', params: { id: 'c1' } });
    await fireEvent.press(screen.getByLabelText('Nuevo mensaje'));
    expect(mockPush).toHaveBeenCalledWith('/(student)/messages/new');
  });

  it('shows the initials of the person and the group icon of a module, never read aloud', async () => {
    routes({
      'GET /chat/conversations': [
        ...list,
        summary({ id: 'c4', partner: person('p4', 'TEACHER', 'Luis', ''), lastMessage: null }),
        summary({ id: 'c5', partner: person('p5', 'TEACHER', '', ''), lastMessage: null }),
      ],
    });
    await renderWith(<MessagesScreen />);
    await screen.findByText('Ana Pérez');
    expect(screen.getByText('AP', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText('L', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getAllByTestId('icon:solar:users-group-rounded-linear', { includeHiddenElements: true })).toHaveLength(2); // the two module chats
    expect(screen.getAllByTestId('icon:solar:user-linear', { includeHiddenElements: true })).toHaveLength(1); // the person without a name
    expect(screen.queryByText('AP')).toBeNull(); // hidden from the screen reader
  });

  it('shows the alerts of the notifications when "Avisos" is chosen', async () => {
    routes({ 'GET /chat/conversations': list, 'GET /notifications': { data: [], meta: { page: 1, limit: 20, total: 0 } } });
    await renderWith(<MessagesScreen />);
    await screen.findByText('Ana Pérez');
    await fireEvent.press(screen.getByLabelText('Avisos'));
    expect(await screen.findByText('No tienes notificaciones')).toBeTruthy();
    expect(screen.queryByText('Ana Pérez')).toBeNull();
  });

  it('shows the empty, loading and error-with-retry states', async () => {
    routes({ 'GET /chat/conversations': [] });
    const empty = await renderWith(<MessagesScreen />);
    expect(await screen.findByText('Aún no tienes conversaciones')).toBeTruthy();
    await empty.unmount();

    mockedApi.mockReturnValue(new Promise(() => undefined));
    const loading = await renderWith(<MessagesScreen />);
    expect(screen.queryByText('Aún no tienes conversaciones')).toBeNull();
    await loading.unmount();

    mockedApi.mockRejectedValueOnce(new ApiError(500, 'INTERNAL_ERROR')).mockResolvedValue(list);
    await renderWith(<MessagesScreen />);
    expect(await screen.findByText('No pudimos cargar tus chats')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Intentar de nuevo'));
    expect(await screen.findByText('Ana Pérez')).toBeTruthy();
  });

  it('warns "Reconectando…" while the socket is down', async () => {
    routes({ 'GET /chat/conversations': list });
    useChatConnection.setState({ connected: false });
    await renderWith(<MessagesScreen />);
    expect(await screen.findByText('Reconectando…')).toBeTruthy();
    await act(async () => useChatConnection.setState({ connected: true }));
    await waitFor(() => expect(screen.queryByText('Reconectando…')).toBeNull());
  });
});
