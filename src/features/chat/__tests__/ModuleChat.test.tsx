import { screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { useSession } from '@/store/session';
import { AnnouncementCard } from '../components/AnnouncementCard';
import { ConversationRow } from '../components/ConversationRow';
import { MessageBubble } from '../components/MessageBubble';
import { usePendingStore } from '../hooks/usePendingMessages';
import { useChatConnection } from '../socket';
import { message, person, renderWith, summary } from '../testing/chatTestUtils';

jest.mock('@/api/client', () => ({ api: jest.fn() }));

beforeEach(async () => {
  usePendingStore.setState({ items: [] });
  useChatConnection.setState({ connected: true });
  useSession.setState({ status: 'signedIn', user: { id: 'me', role: 'STUDENT' } as never });
  await i18n.changeLanguage('es');
});

describe('module chat pieces', () => {
  it('shows the module row with the group icon, the module name and "Sin mensajes" when empty', async () => {
    await renderWith(<ConversationRow conversation={summary({ type: 'MODULE', partner: null, module: { id: 'm', name: 'Cálculo I' } })} onPress={() => undefined} />);
    expect(screen.getByText('Cálculo I')).toBeTruthy();
    expect(screen.getByText('Sin mensajes')).toBeTruthy();
    expect(screen.queryAllByTestId(/users-group/).length).toBeGreaterThan(0);
  });

  it('shows a direct row with the person icon, and an announcement preview with its prefix', async () => {
    await renderWith(<ConversationRow conversation={summary({ unread: 3, lastMessage: message(1, { kind: 'ANNOUNCEMENT', body: 'Sin clase' }) })} onPress={() => undefined} />);
    expect(screen.getByText('Ana Pérez')).toBeTruthy();
    expect(screen.getByText('Anuncio: Sin clase')).toBeTruthy();
    expect(screen.getByText('3 sin leer')).toBeTruthy();
    expect(screen.queryAllByTestId(/users-group/)).toHaveLength(0);
  });

  it('renders an announcement as a card with its label, the teacher and the time, not as a bubble', async () => {
    await renderWith(<AnnouncementCard message={message(1, { body: 'Traigan calculadora', sender: person('t1', 'TEACHER', 'Luis', 'Gómez') })} />);
    expect(screen.getByText('Anuncio')).toBeTruthy();
    expect(screen.getByText('· Luis Gómez')).toBeTruthy();
    expect(screen.getByText('Traigan calculadora')).toBeTruthy();
  });

  it('shows the writer of a message of someone else in a module chat, and never for my own', async () => {
    const m = message(1, { sender: person('t2', 'STUDENT', 'Marta', 'Ruiz') });
    const first = await renderWith(<MessageBubble message={m} mine={false} showSender />);
    expect(screen.getByText('Marta Ruiz')).toBeTruthy();
    await first.unmount();
    await renderWith(<MessageBubble message={m} mine showSender />);
    expect(screen.queryByText('Marta Ruiz')).toBeNull();
  });

  it('says the state of what I sent with text and an icon, never only with color', async () => {
    const view = await renderWith(<MessageBubble message={message(1)} mine state="sending" />);
    expect(screen.getByLabelText('Enviando…')).toBeTruthy();
    await view.unmount();
    const sent = await renderWith(<MessageBubble message={message(1)} mine state="sent" />);
    expect(screen.getByLabelText('Enviado')).toBeTruthy();
    await sent.unmount();
    await renderWith(<MessageBubble message={message(1)} mine state="failed" onRetry={() => undefined} />);
    expect(screen.getByText('No se envió')).toBeTruthy();
    expect(screen.getByLabelText('Toca para reintentar')).toBeTruthy();
  });
});
