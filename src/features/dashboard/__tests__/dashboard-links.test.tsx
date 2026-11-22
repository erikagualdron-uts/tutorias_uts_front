import { fireEvent, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { StudentHomeScreen } from '../screens/StudentHomeScreen';
import { TeacherDashboardScreen } from '../screens/TeacherDashboardScreen';
import { page, pqrs, renderScreen, routes, session } from '../testing/personTestUtils';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
jest.mock('../hooks/useCountUp', () => ({ useCountUp: (value: unknown) => value })); // the count has its own tests
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...a: unknown[]) => mockPush(...a) }, useFocusEffect: jest.fn() }));

const change = {
  sessionId: 'c1',
  moduleId: 'm9',
  moduleName: 'Redes',
  kind: 'RESCHEDULED',
  originalStartsAt: '2030-01-08T19:00:00.000Z',
  startsAt: '2030-01-09T19:00:00.000Z',
  changedAt: new Date(Date.now() - 3_600_000).toISOString(),
};
const common = { '/chat/unread-count': { unread: 4 }, '/notifications/unread-count': { unread: 2 }, '/pqrs/mine': page([pqrs(1)]) };

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('es');
});

describe('dashboard links', () => {
  it('sends the CAE blocks to modules, accounts, the PQRS list with the state tapped, the module of a change and "See all"', async () => {
    routes({
      '/dashboard/admin/overview': {
        occupancy: { enrolled: 5, capacity: 10, percent: 50 },
        modules: { active: 1, full: 0, lowEnrollment: 0 },
        lowEnrollmentPercent: 30,
        accounts: { students: 7, teachers: 2 },
        pqrs: { filed: 3, inReview: 1, resolved: 1, avgResponseSeconds: 60 },
      },
      '/dashboard/admin/changes': { data: [change], meta: { page: 1, limit: 5, total: 1 } },
      '/dashboard/admin/rooms': { most: [], least: [] },
    });
    await renderScreen(<AdminDashboardScreen />);
    await screen.findByText('Redes', { exact: false });
    await fireEvent.press(screen.getByLabelText('1 Módulos activos'));
    expect(mockPush).toHaveBeenLastCalledWith('/(admin)/modules');
    await fireEvent.press(screen.getByLabelText('7 Estudiantes activos'));
    expect(mockPush).toHaveBeenLastCalledWith('/(admin)/more/students');
    await fireEvent.press(screen.getByLabelText('2 Docentes activos'));
    expect(mockPush).toHaveBeenLastCalledWith('/(admin)/more/teachers');
    await fireEvent.press(screen.getByLabelText('3 PQRS radicadas'));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/(admin)/pqrs', params: { status: 'FILED' } });
    await fireEvent.press(screen.getByLabelText('En revisión 1'));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/(admin)/pqrs', params: { status: 'IN_REVIEW' } });
    await fireEvent.press(screen.getByLabelText('Redes, Reprogramada'));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/(admin)/modules/[id]', params: { id: 'm9' } });
    await fireEvent.press(screen.getByLabelText('Ver todo'));
    expect(mockPush).toHaveBeenLastCalledWith('/(admin)/changes');
  });

  it('sends the teacher blocks to the schedule, the messages and the PQRS', async () => {
    routes({ ...common, '/dashboard/teacher': { nextSession: session({ attendees: 2 }), weekSessions: 1, modules: [] } });
    await renderScreen(<TeacherDashboardScreen />);
    await fireEvent.press(await screen.findByLabelText('Ver detalle'));
    expect(mockPush).toHaveBeenLastCalledWith('/(teacher)/schedule');
    await fireEvent.press(await screen.findByLabelText('4 Mensajes sin leer'));
    expect(mockPush).toHaveBeenLastCalledWith('/(teacher)/messages');
    await fireEvent.press(await screen.findByLabelText('Asunto 1'));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/(teacher)/pqrs/[id]', params: { id: 'p1' } });
    await fireEvent.press(screen.getByLabelText('Ver todas'));
    expect(mockPush).toHaveBeenLastCalledWith('/(teacher)/pqrs');
  });

  it('sends the student blocks to the module, the inbox, the messages, the changed module and the PQRS', async () => {
    routes({ ...common, '/dashboard/student': { nextSession: session(), weekSessions: 1, changes: [change] } });
    await renderScreen(<StudentHomeScreen />);
    await fireEvent.press(await screen.findByLabelText('Ver detalle'));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/(student)/modules/[id]', params: { id: 'm1' } });
    await fireEvent.press(await screen.findByLabelText('2 Avisos sin leer'));
    expect(mockPush).toHaveBeenLastCalledWith('/(student)/notifications');
    await fireEvent.press(await screen.findByLabelText('4 Mensajes sin leer'));
    expect(mockPush).toHaveBeenLastCalledWith('/(student)/messages');
    await fireEvent.press(screen.getByLabelText('Redes, Reprogramada'));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/(student)/modules/[id]', params: { id: 'm9' } });
    await fireEvent.press(await screen.findByLabelText('Asunto 1'));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/(student)/pqrs/[id]', params: { id: 'p1' } });
    await fireEvent.press(screen.getByLabelText('Ver todas'));
    expect(mockPush).toHaveBeenLastCalledWith('/(student)/pqrs');
  });
});
