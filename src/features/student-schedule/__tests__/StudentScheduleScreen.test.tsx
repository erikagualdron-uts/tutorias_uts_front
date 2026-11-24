import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { StudentScheduleScreen } from '../screens/StudentScheduleScreen';
import { calendarPage, studentSessionOf } from '../test-fixtures';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
const mockPush = jest.fn();
const mockFocus: { run?: () => void } = {};
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a) },
  useFocusEffect: (effect: () => void) => {
    mockFocus.run = effect;
  },
}));
// The clock of the screen: each test picks the instant.
let mockNow = new Date();
jest.mock('@/components/calendar/useNow', () => ({ useNow: () => mockNow }));

const mockedApi = api as jest.Mock;
const PHONE = 390;
const TABLET = 900;

// 2030-01-09 is a Wednesday; Tuesday and Thursday have a session each.
const TUE = studentSessionOf();
const THU = studentSessionOf({
  id: 's2',
  moduleId: 'm2',
  moduleName: 'Física',
  teacherName: 'Luis Gómez',
  startsAt: '2030-01-10T15:00:00.000Z', // 10:00 Bogota
  endsAt: '2030-01-10T17:00:00.000Z',
  originalStartsAt: '2030-01-10T15:00:00.000Z',
  room: { id: 'r2', name: 'B-202', location: 'Sede Central', capacity: 20 },
});

let calendar: (from: string) => Promise<unknown>;
const weekOf = (from: string) => (from === '2030-01-07' ? calendarPage([TUE, THU]) : calendarPage([], { from }));
const calendarCalls = () => mockedApi.mock.calls.map(([p]) => String(p)).filter((p) => p.startsWith('/student/calendar'));

const setWidth = (width: number) =>
  Dimensions.set({ window: { width, height: 900, scale: 2, fontScale: 1 }, screen: { width, height: 900, scale: 2, fontScale: 1 } });
const setNow = (iso: string) => {
  mockNow = new Date(iso);
};
const renderScreen = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <StudentScheduleScreen />
    </QueryClientProvider>,
  );
const range = (text: string) => screen.findByText(text);
const block = (name: string, hours: string, room: string, teacher: string, state: string) =>
  screen.findByLabelText(`${name}, ${hours}, ${room}, ${state}`, { exact: false });

beforeEach(async () => {
  jest.clearAllMocks();
  setNow('2030-01-09T19:00:00.000Z'); // Wednesday 14:00 in Bogota
  setWidth(PHONE);
  calendar = (from) => Promise.resolve(weekOf(from));
  mockedApi.mockImplementation((path: string) => calendar(/from=(\d{4}-\d{2}-\d{2})/.exec(path)![1]));
  await i18n.changeLanguage('es');
});

describe('week of the student (day view)', () => {
  it('opens with the brand header above the calendar', async () => {
    await renderScreen();
    await range('07/01/2030 – 13/01/2030');
    expect(screen.getByRole('header', { name: i18n.t('tabs.schedule') })).toBeTruthy();
  });

  it('opens on the current week with today selected and a dot on the days with sessions', async () => {
    await renderScreen();
    expect(await range('07/01/2030 – 13/01/2030')).toBeTruthy();
    expect(calendarCalls()).toEqual(['/student/calendar?from=2030-01-07&to=2030-01-13']);
    expect(await screen.findByLabelText(/Mar 08\/01\/2030, 1 sesión/)).toBeTruthy();
    expect(screen.getByLabelText(/Jue 10\/01\/2030, 1 sesión/)).toBeTruthy();
    expect(screen.getByLabelText(/Mié 09\/01\/2030, sin sesiones, hoy, seleccionado/)).toBeTruthy();
    expect(screen.getByLabelText('Hoy')).toBeTruthy();
    expect(screen.getByLabelText('Semana anterior')).toBeTruthy();
  });

  it('says so when the selected day has no sessions', async () => {
    await renderScreen();
    expect(await screen.findByText('No hay sesiones este día')).toBeTruthy();
  });

  it('shows the sessions of a day by hour with module, room and teacher, and nothing from a module that is not mine', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(/Mar 08\/01\/2030/));
    expect(await block('Cálculo I', '14:00–16:00', 'A-101', 'Ana Pérez', 'Programada')).toBeTruthy();
    expect(screen.getByText('Ana Pérez')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(/Jue 10\/01\/2030/));
    expect(await block('Física', '10:00–12:00', 'B-202', 'Luis Gómez', 'Programada')).toBeTruthy();
    expect(screen.getByText('Luis Gómez')).toBeTruthy();
  });

  it('draws the line of the current hour only today', async () => {
    setNow('2030-01-08T19:30:00.000Z'); // Tuesday 14:30
    await renderScreen();
    expect(await screen.findByLabelText('Ahora')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(/Jue 10\/01\/2030/));
    await block('Física', '10:00–12:00', 'B-202', 'Luis Gómez', 'Programada');
    expect(screen.queryByLabelText('Ahora')).toBeNull();
  });

  it('opens on the week view from 600 dp', async () => {
    setWidth(TABLET);
    await renderScreen();
    expect(await screen.findByLabelText(/Cálculo I, 14:00–16:00, A-101/)).toBeTruthy();
    expect(screen.getByLabelText(/Física, 10:00–12:00, B-202/)).toBeTruthy();
  });

  it('speaks English', async () => {
    await i18n.changeLanguage('en');
    await renderScreen();
    expect(await screen.findByText('No sessions this day')).toBeTruthy();
    expect(screen.getByLabelText('Next week')).toBeTruthy();
    expect(screen.getByLabelText('Today')).toBeTruthy();
  });
});

describe('the state of each session', () => {
  it('names every state in text, strikes the cancelled ones and keeps the original hour of the moved one', async () => {
    calendar = () =>
      Promise.resolve(
        calendarPage([
          studentSessionOf({ id: 'a', moduleName: 'Reprogramada A', status: 'RESCHEDULED', startsAt: '2030-01-08T15:00:00.000Z', endsAt: '2030-01-08T17:00:00.000Z' }),
          studentSessionOf({ id: 'b', moduleName: 'Festivo B', status: 'CANCELLED', cancelReason: 'HOLIDAY', startsAt: '2030-01-08T17:00:00.000Z', endsAt: '2030-01-08T18:00:00.000Z' }),
          studentSessionOf({ id: 'c', moduleName: 'Docente C', status: 'CANCELLED', cancelReason: 'TEACHER', startsAt: '2030-01-08T18:00:00.000Z', endsAt: '2030-01-08T19:00:00.000Z' }),
          studentSessionOf({ id: 'd', moduleName: 'Omitida D', absent: true, startsAt: '2030-01-08T21:00:00.000Z', endsAt: '2030-01-08T22:00:00.000Z' }),
        ]),
      );
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(/Mar 08\/01\/2030/));
    expect(await screen.findByLabelText(/Reprogramada A, 10:00–12:00, A-101, Reprogramada/)).toBeTruthy();
    expect(screen.getByText(/Antes: .* · 14:00/)).toBeTruthy();
    expect(screen.getByLabelText(/Festivo B, .*Cancelada por festivo/)).toBeTruthy();
    expect(screen.getByLabelText(/Docente C, .*Cancelada por el docente/)).toBeTruthy();
    expect(screen.getByLabelText(/Omitida D, .*Cancelada por ti/)).toBeTruthy();
  });
});

describe('moving between weeks', () => {
  it('goes to the next week and back to today', async () => {
    await renderScreen();
    await screen.findByLabelText(/Mar 08\/01\/2030, 1 sesión/);
    await fireEvent.press(screen.getByLabelText('Semana siguiente'));
    expect(await range('14/01/2030 – 20/01/2030')).toBeTruthy();
    expect(calendarCalls().at(-1)).toBe('/student/calendar?from=2030-01-14&to=2030-01-20');
    await fireEvent.press(screen.getByLabelText('Hoy'));
    expect(await range('07/01/2030 – 13/01/2030')).toBeTruthy();
    expect(await screen.findByLabelText(/Mié 09\/01\/2030, .*hoy, seleccionado/)).toBeTruthy();
  });

  it('waits for the period before the arrows move', async () => {
    calendar = () => new Promise(() => undefined);
    await renderScreen();
    await fireEvent.press(screen.getByLabelText('Semana siguiente'));
    expect(screen.queryByText('Fuera del periodo académico')).toBeNull();
    expect(screen.getByText('07/01/2030 – 13/01/2030')).toBeTruthy();
  });

  it('does not move before the first week of the period and says why', async () => {
    await renderScreen();
    await screen.findByLabelText(/Mar 08\/01\/2030, 1 sesión/);
    const calls = calendarCalls().length;
    await fireEvent.press(screen.getByLabelText('Semana anterior'));
    expect(await screen.findByText('Fuera del periodo académico')).toBeTruthy();
    expect(calendarCalls()).toHaveLength(calls);
  });

  it('does not move after the last week of the period', async () => {
    calendar = () => Promise.resolve(calendarPage([], { period: { id: 'p1', name: '2030-1', startsOn: '2030-01-07', endsOn: '2030-01-13', status: 'ACTIVE' } }));
    await renderScreen();
    await screen.findByText('No hay sesiones este día');
    await fireEvent.press(screen.getByLabelText('Semana siguiente'));
    expect(await screen.findByText('Fuera del periodo académico')).toBeTruthy();
  });

  it('opens on the closest week of the period when today is outside it', async () => {
    setNow('2029-06-06T19:00:00.000Z');
    await renderScreen();
    expect(await range('07/01/2030 – 13/01/2030')).toBeTruthy();
    expect(screen.queryByLabelText('Ahora')).toBeNull();
  });

  it('shows a past week with its sessions and offers no action on them', async () => {
    setNow('2030-01-16T19:00:00.000Z');
    await renderScreen();
    await screen.findByText('No hay sesiones este día'); // the arrows wait until the period is known
    await fireEvent.press(screen.getByLabelText('Semana anterior'));
    await fireEvent.press(await screen.findByLabelText(/Mar 08\/01\/2030/));
    expect(await block('Cálculo I', '14:00–16:00', 'A-101', 'Ana Pérez', 'Programada')).toBeTruthy();
    for (const action of ['Cancelar sesión', 'Restaurar sesión', 'Reprogramar']) expect(screen.queryByLabelText(action)).toBeNull();
  });

  it('explains a student without period, and shows the error with a retry that keeps the week', async () => {
    calendar = () => Promise.resolve(calendarPage([], { period: null, hasEnrollments: false }));
    await renderScreen();
    expect(await screen.findByText('Sin periodo académico')).toBeTruthy();
    calendar = () => Promise.reject(new ApiError(500, 'INTERNAL_ERROR'));
    await renderScreen();
    expect(await screen.findByText('No pudimos cargar la semana')).toBeTruthy();
  });
});

describe('opening the module and the empty states', () => {
  it('opens the module of a session and offers no action to change it', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(/Mar 08\/01\/2030/));
    await fireEvent.press(await block('Cálculo I', '14:00–16:00', 'A-101', 'Ana Pérez', 'Programada'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/(student)/modules/[id]', params: { id: 'm1' } });
    for (const action of ['Cancelar sesión', 'Restaurar sesión', 'Reprogramar', 'Cancelar inscripción']) expect(screen.queryByLabelText(action)).toBeNull();
  });

  it('invites to explore modules instead of an empty calendar when the student has no enrollments', async () => {
    calendar = () => Promise.resolve(calendarPage([], { hasEnrollments: false }));
    await renderScreen();
    expect(await screen.findByText('Aún no estás inscrito en ningún módulo')).toBeTruthy();
    expect(screen.queryByLabelText('Semana siguiente')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Explorar módulos'));
    expect(mockPush).toHaveBeenCalledWith('/(student)/modules');
  });

  it('asks the week again when the tab regains focus', async () => {
    await renderScreen();
    await screen.findByLabelText(/Mar 08\/01\/2030, 1 sesión/);
    const before = calendarCalls().length;
    mockFocus.run?.(); // first focus: the week just loaded
    mockFocus.run?.(); // the student comes back to the tab
    await screen.findByLabelText(/Mar 08\/01\/2030, 1 sesión/);
    expect(calendarCalls().length).toBeGreaterThan(before);
  });
});
