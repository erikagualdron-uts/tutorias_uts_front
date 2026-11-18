import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { TeacherScheduleScreen } from '../screens/TeacherScheduleScreen';
import { calendarPage, modulesPage, sessionsPage, teacherModuleOf, teacherSessionOf } from '../test-fixtures';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));

const mockedApi = api as jest.Mock;
let modules: () => Promise<unknown>;
let sessions: (path: string) => Promise<unknown>;

const renderScreen = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <TeacherScheduleScreen />
    </QueryClientProvider>,
  );

beforeEach(async () => {
  jest.clearAllMocks();
  modules = () => Promise.resolve(modulesPage([teacherModuleOf()]));
  sessions = () => Promise.resolve(sessionsPage([teacherSessionOf()]));
  mockedApi.mockImplementation((path: string) =>
    path.startsWith('/teacher/calendar')
      ? Promise.resolve(calendarPage([]))
      : path.startsWith('/teacher/modules')
        ? modules()
        : sessions(path),
  );
  await i18n.changeLanguage('es');
});

describe('teacher schedule', () => {
  it('lists the module with room, schedule and enrolled, and the session with hours in Bogota time', async () => {
    await renderScreen();
    expect(await screen.findByText('Cronograma')).toBeTruthy();
    expect(await screen.findByText('Mar 14:00–16:00 · A-101')).toBeTruthy();
    expect(screen.getByText('12 inscritos de 30')).toBeTruthy();
    // 2030-01-08T19:00Z is 14:00 in Bogota
    expect(await screen.findByText('14:00–16:00')).toBeTruthy();
    expect(screen.getByText('12 asistentes')).toBeTruthy();
    expect(screen.getByText('Programada')).toBeTruthy();
  });

  it('shows a rescheduled session with its original hour', async () => {
    sessions = () =>
      Promise.resolve(
        sessionsPage([
          teacherSessionOf({
            status: 'RESCHEDULED',
            startsAt: '2030-01-09T15:00:00.000Z',
            endsAt: '2030-01-09T17:00:00.000Z',
          }),
        ]),
      );
    await renderScreen();
    expect(await screen.findByText('Reprogramada')).toBeTruthy();
    expect(screen.getByText(/Antes: .* · 14:00/)).toBeTruthy();
  });

  it.each([
    ['HOLIDAY', 'Cancelada por festivo'],
    ['TEACHER', 'Cancelada por ti'],
  ] as const)('shows a session cancelled by %s with its reason', async (reason, text) => {
    sessions = () =>
      Promise.resolve(
        sessionsPage([teacherSessionOf({ status: 'CANCELLED', cancelReason: reason, attendees: 0, canCancel: false, canReschedule: false })]),
      );
    await renderScreen();
    expect(await screen.findByText(text)).toBeTruthy();
  });

  it('filters by module with chips when the teacher has several', async () => {
    modules = () =>
      Promise.resolve(modulesPage([teacherModuleOf(), teacherModuleOf({ id: 'm2', name: 'Física' })]));
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText('Física'));
    await screen.findByText('Próximas sesiones');
    expect(mockedApi.mock.calls.some(([p]) => String(p).includes('moduleId=m2'))).toBe(true);
  });

  it('opens the session sheet with the rule of the hour', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(/Cálculo I\. .*Programada/));
    expect(await screen.findByText(/hasta 120 minutos antes/)).toBeTruthy();
  });

  it('shows the blocking rule of a session that can no longer change', async () => {
    sessions = () =>
      Promise.resolve(sessionsPage([teacherSessionOf({ canCancel: false, canReschedule: false, blockReason: 'WINDOW_PASSED' })]));
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(/Cálculo I\. .*Programada/));
    expect(await screen.findByText('Ya no puedes cambiarla: faltan menos de 120 minutos.')).toBeTruthy();
  });

  it('shows a closed period without actions and with its reason', async () => {
    sessions = () =>
      Promise.resolve(sessionsPage([teacherSessionOf({ canCancel: false, canReschedule: false, blockReason: 'PERIOD_CLOSED' })]));
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(/Cálculo I\. .*Programada/));
    expect(await screen.findByText('Periodo cerrado, solo lectura.')).toBeTruthy();
    expect(screen.queryByLabelText('Reprogramar')).toBeNull();
  });

  it('shows the empty state', async () => {
    sessions = () => Promise.resolve(sessionsPage([]));
    await renderScreen();
    expect(await screen.findByText('Sin sesiones próximas')).toBeTruthy();
  });

  it('shows the error with a retry', async () => {
    sessions = () => Promise.reject(new ApiError(500, 'INTERNAL_ERROR'));
    await renderScreen();
    expect(await screen.findByText('No pudimos cargar tu cronograma')).toBeTruthy();
    sessions = () => Promise.resolve(sessionsPage([teacherSessionOf()]));
    await fireEvent.press(screen.getByLabelText('Intentar de nuevo'));
    expect(await screen.findByText('14:00–16:00')).toBeTruthy();
  });

  it('shows no sessions while loading', async () => {
    sessions = () => new Promise(() => undefined);
    await renderScreen();
    expect(screen.queryByText('Programada')).toBeNull();
    expect(screen.getByText('Próximas sesiones')).toBeTruthy();
  });

  it('speaks English', async () => {
    await i18n.changeLanguage('en');
    await renderScreen();
    expect(await screen.findByText('Schedule')).toBeTruthy();
    expect(await screen.findByText('Scheduled')).toBeTruthy();
    expect(screen.getByText('12 attending')).toBeTruthy();
  });
});
