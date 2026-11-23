import { screen } from '@testing-library/react-native';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { TeacherDashboardScreen } from '../screens/TeacherDashboardScreen';
import { page, pqrs, renderScreen, routes, session } from '../testing/personTestUtils';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
jest.mock('../hooks/useCountUp', () => ({ useCountUp: (value: unknown) => value })); // the count has its own tests
jest.mock('expo-router', () => ({ router: { push: jest.fn() }, useFocusEffect: jest.fn() }));

const dashboard = (overrides: object = {}) => ({
  nextSession: session({ attendees: 12 }),
  weekSessions: 3,
  modules: [
    { id: 'm1', name: 'Cálculo', enrolled: 18, capacity: 30 },
    { id: 'm2', name: 'Física', enrolled: 30, capacity: 30 },
  ],
  ...overrides,
});
const full = {
  '/dashboard/teacher': dashboard(),
  '/chat/unread-count': { unread: 4 },
  '/pqrs/mine': page([pqrs(1), pqrs(2, 'RESOLVED')]),
};

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('es');
});

describe('TeacherDashboardScreen', () => {
  it('shows the next session, the week, the unread messages, the seats and my PQRS', async () => {
    routes(full);
    await renderScreen(<TeacherDashboardScreen />);
    expect(await screen.findByText('Próxima tutoría')).toBeTruthy();
    expect(screen.getByText('08/01/2030 · 14:00–16:00')).toBeTruthy();
    expect(screen.getByText('Salón B-201 · 12 estudiantes')).toBeTruthy();
    expect(screen.getByText('Tutorías de la semana')).toBeTruthy();
    expect(await screen.findByText('4')).toBeTruthy(); // the same count as the Messages tab
    expect(screen.getByText('18/30')).toBeTruthy();
    expect(screen.getByText('30/30')).toBeTruthy();
    expect(await screen.findByText('Asunto 1')).toBeTruthy();
    expect(screen.getByText('Radicada')).toBeTruthy();
    expect(screen.getByText('Resuelta')).toBeTruthy();
  });

  it('shows the soft card without a next session and the empty states', async () => {
    routes({ ...full, '/dashboard/teacher': dashboard({ nextSession: null, weekSessions: 0, modules: [] }), '/pqrs/mine': page([]) });
    await renderScreen(<TeacherDashboardScreen />);
    expect(await screen.findByText('Sin sesiones próximas')).toBeTruthy();
    expect(screen.getByText('Aún no tienes módulos en el periodo vigente.')).toBeTruthy();
    expect(await screen.findByText('Aún no has radicado ninguna PQRS.')).toBeTruthy();
  });

  it('keeps the rest when my PQRS fail and writes in English', async () => {
    await i18n.changeLanguage('en');
    routes({ ...full, '/pqrs/mine': new ApiError(500, 'INTERNAL_ERROR') });
    await renderScreen(<TeacherDashboardScreen />);
    expect(await screen.findByText('Next tutoring')).toBeTruthy();
    expect(await screen.findByText('We could not load this block')).toBeTruthy();
    expect(screen.getByText('Room B-201 · 12 students')).toBeTruthy();
  });
});
