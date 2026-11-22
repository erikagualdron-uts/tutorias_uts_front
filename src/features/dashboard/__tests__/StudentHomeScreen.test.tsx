import { fireEvent, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { StudentHomeScreen } from '../screens/StudentHomeScreen';
import { page, pqrs, renderScreen, routes, session } from '../testing/personTestUtils';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
jest.mock('../hooks/useCountUp', () => ({ useCountUp: (value: unknown) => value })); // the count has its own tests
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...a: unknown[]) => mockPush(...a) }, useFocusEffect: jest.fn() }));

const change = (n: number, kind = 'CANCELLED') => ({
  sessionId: `c${n}`,
  moduleId: 'm1',
  moduleName: `Módulo ${n}`,
  kind,
  originalStartsAt: '2030-01-08T19:00:00.000Z',
  startsAt: '2030-01-08T19:00:00.000Z',
  changedAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
});
const full = {
  '/dashboard/student': { nextSession: session(), weekSessions: 2, changes: [change(1), change(2, 'RESCHEDULED')] },
  '/notifications/unread-count': { unread: 3 },
  '/chat/unread-count': { unread: 5 },
  '/pqrs/mine': page([pqrs(1, 'IN_REVIEW')]),
};

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('es');
});

describe('StudentHomeScreen', () => {
  it('shows the next session without a student count, the week, the unread alerts and messages, the changes and my PQRS', async () => {
    routes(full);
    await renderScreen(<StudentHomeScreen />);
    expect(await screen.findByText('Próxima tutoría')).toBeTruthy();
    expect(screen.getByText('Salón B-201')).toBeTruthy();
    expect(screen.getByText('Tutorías esta semana')).toBeTruthy();
    expect(await screen.findByText('Avisos sin leer')).toBeTruthy();
    expect(await screen.findByText('3')).toBeTruthy();
    expect(await screen.findByText('5')).toBeTruthy();
    expect(screen.getByText('Cancelada · hace 2 h')).toBeTruthy();
    expect(screen.getByText('Reprogramada · hace 2 h')).toBeTruthy();
    expect(await screen.findByText('Asunto 1')).toBeTruthy();
    expect(screen.getByText('En revisión')).toBeTruthy();
  });

  it('invites to explore modules when there is no next session', async () => {
    routes({ ...full, '/dashboard/student': { nextSession: null, weekSessions: 0, changes: [] }, '/pqrs/mine': page([]) });
    await renderScreen(<StudentHomeScreen />);
    expect(await screen.findByText('Sin sesiones próximas')).toBeTruthy();
    expect(screen.getByText('No hay cambios recientes en tus módulos.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Explorar módulos'));
    expect(mockPush).toHaveBeenCalledWith('/(student)/modules');
  });

  it('writes in English', async () => {
    await i18n.changeLanguage('en');
    routes(full);
    await renderScreen(<StudentHomeScreen />);
    expect(await screen.findByText('Next tutoring')).toBeTruthy();
    expect(screen.getByText('Sessions this week')).toBeTruthy();
    expect(await screen.findByText('Unread alerts')).toBeTruthy();
    expect(screen.getByText('Cancelled · 2 h ago')).toBeTruthy();
  });
});
