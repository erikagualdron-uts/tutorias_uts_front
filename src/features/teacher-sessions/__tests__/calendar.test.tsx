import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { TeacherScheduleScreen } from '../screens/TeacherScheduleScreen';
import { calendarPage, modulesPage, sessionsPage, teacherModuleOf, teacherSessionOf } from '../test-fixtures';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));
// The clock of the screen: each test picks the instant (the loader animations do not mix with fake timers).
let mockNow = new Date();
jest.mock('@/components/calendar/useNow', () => ({ useNow: () => mockNow }));

const mockedApi = api as jest.Mock;
const PHONE = 390;
const TABLET = 900;

// 2030-01-09 is a Wednesday; Tuesday and Thursday have a session each.
const TUE = teacherSessionOf();
const THU = teacherSessionOf({
  id: 's2',
  moduleName: 'Física',
  startsAt: '2030-01-10T15:00:00.000Z', // 10:00 Bogota
  endsAt: '2030-01-10T17:00:00.000Z',
  originalStartsAt: '2030-01-10T15:00:00.000Z',
  room: { id: 'r2', name: 'B-202', location: 'Sede Central', capacity: 20 },
  attendees: 5,
});

let calendar: (from: string) => Promise<unknown>;
const weekOf = (from: string) => (from === '2030-01-07' ? calendarPage([TUE, THU]) : calendarPage([], { from }));
const calendarCalls = () => mockedApi.mock.calls.map(([p]) => String(p)).filter((p) => p.startsWith('/teacher/calendar'));

const setWidth = (width: number) =>
  Dimensions.set({ window: { width, height: 900, scale: 2, fontScale: 1 }, screen: { width, height: 900, scale: 2, fontScale: 1 } });

const renderScreen = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <TeacherScheduleScreen />
    </QueryClientProvider>,
  );

const setNow = (iso: string) => {
  mockNow = new Date(iso);
};

beforeEach(async () => {
  jest.clearAllMocks();
  setNow('2030-01-09T19:00:00.000Z'); // Wednesday 14:00 in Bogota
  setWidth(PHONE);
  calendar = (from) => Promise.resolve(weekOf(from));
  mockedApi.mockImplementation((path: string, options?: { method?: string }) => {
    if (options?.method === 'POST') return Promise.resolve({ scope: 'SESSION', dryRun: false, sessions: [TUE] });
    if (path.startsWith('/teacher/calendar')) return calendar(/from=(\d{4}-\d{2}-\d{2})/.exec(path)![1]);
    if (path.startsWith('/teacher/modules')) return Promise.resolve(modulesPage([teacherModuleOf()]));
    return Promise.resolve(sessionsPage([]));
  });
  await i18n.changeLanguage('es');
});

const range = (text: string) => screen.findByText(text);
const block = (name: string, hours: string, room: string, state: string) =>
  screen.findByLabelText(`${name}, ${hours}, ${room}, ${state}`);

describe('week of the teacher (day view)', () => {
  it('opens on the current week with today selected and a dot on the days with sessions', async () => {
    await renderScreen();
    expect(await range('07/01/2030 – 13/01/2030')).toBeTruthy();
    expect(calendarCalls()).toEqual(['/teacher/calendar?from=2030-01-07&to=2030-01-13']);
    expect(await screen.findByLabelText(/Mar 08\/01\/2030, 1 sesión/)).toBeTruthy();
    expect(screen.getByLabelText(/Jue 10\/01\/2030, 1 sesión/)).toBeTruthy();
    expect(screen.getByLabelText(/Lun 07\/01\/2030, sin sesiones/)).toBeTruthy();
    expect(screen.getByLabelText(/Mié 09\/01\/2030, sin sesiones, hoy, seleccionado/)).toBeTruthy();
  });

  it('says so when the selected day has no sessions', async () => {
    await renderScreen();
    expect(await screen.findByText('No hay sesiones este día')).toBeTruthy();
  });

  it('shows the sessions of another day by hour with module, room and attendees', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(/Mar 08\/01\/2030/));
    expect(await block('Cálculo I', '14:00–16:00', 'A-101', 'Programada')).toBeTruthy();
    expect(screen.getByText('12 asistentes')).toBeTruthy();
    expect(screen.queryByText('No hay sesiones este día')).toBeNull();
    await fireEvent.press(screen.getByLabelText(/Jue 10\/01\/2030/));
    expect(await block('Física', '10:00–12:00', 'B-202', 'Programada')).toBeTruthy();
  });

  it('draws the line of the current hour only today and inside the visible hours', async () => {
    setNow('2030-01-08T19:30:00.000Z'); // Tuesday 14:30
    await renderScreen();
    expect(await screen.findByLabelText('Ahora')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(/Jue 10\/01\/2030/));
    await block('Física', '10:00–12:00', 'B-202', 'Programada');
    expect(screen.queryByLabelText('Ahora')).toBeNull();
  });

  it('orders the screen: calendar, upcoming sessions and modules', async () => {
    await renderScreen();
    await range('07/01/2030 – 13/01/2030');
    await screen.findByText('Mis módulos');
    expect(screen.getAllByRole('header').map((h) => h.props.children)).toEqual([
      '07/01/2030 – 13/01/2030',
      'Próximas sesiones',
      'Mis módulos',
    ]);
  });

  it('explains a teacher without period', async () => {
    calendar = () => Promise.resolve(calendarPage([], { period: null }));
    await renderScreen();
    expect(await screen.findByText('Sin periodo académico')).toBeTruthy();
  });

  it('shows nothing of the week while it loads', async () => {
    calendar = () => new Promise(() => undefined);
    await renderScreen();
    expect(screen.queryByText('No hay sesiones este día')).toBeNull();
    expect(screen.getByText('07/01/2030 – 13/01/2030')).toBeTruthy();
  });

  it('shows the error with a retry', async () => {
    calendar = () => Promise.reject(new ApiError(500, 'INTERNAL_ERROR'));
    await renderScreen();
    expect(await screen.findByText('No pudimos cargar la semana')).toBeTruthy();
    calendar = (from) => Promise.resolve(weekOf(from));
    await fireEvent.press(screen.getByLabelText('Intentar de nuevo'));
    expect(await screen.findByText('No hay sesiones este día')).toBeTruthy();
  });

  it('speaks English', async () => {
    await i18n.changeLanguage('en');
    await renderScreen();
    expect(await screen.findByText('No sessions this day')).toBeTruthy();
    expect(screen.getByLabelText('Next week')).toBeTruthy();
    expect(screen.getByLabelText('Today')).toBeTruthy();
  });
});

describe('moving between weeks', () => {
  it('goes to the next week and back to today', async () => {
    await renderScreen();
    await screen.findByLabelText(/Mar 08\/01\/2030, 1 sesión/);
    await fireEvent.press(screen.getByLabelText('Semana siguiente'));
    expect(await range('14/01/2030 – 20/01/2030')).toBeTruthy();
    expect(calendarCalls().at(-1)).toBe('/teacher/calendar?from=2030-01-14&to=2030-01-20');
    // the same weekday as before stays selected
    expect(await screen.findByLabelText(/Mié 16\/01\/2030, sin sesiones, seleccionado/)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Hoy'));
    expect(await range('07/01/2030 – 13/01/2030')).toBeTruthy();
    expect(await screen.findByLabelText(/Mié 09\/01\/2030, .*hoy, seleccionado/)).toBeTruthy();
  });

  it('waits for the period before the arrows move and does not blame the period meanwhile', async () => {
    calendar = () => new Promise(() => undefined);
    await renderScreen();
    await fireEvent.press(screen.getByLabelText('Semana siguiente'));
    expect(screen.queryByText('Fuera del periodo académico')).toBeNull();
    expect(screen.getByText('07/01/2030 – 13/01/2030')).toBeTruthy();
  });

  it('does not move before the first week of the period and says why', async () => {
    await renderScreen();
    await screen.findByLabelText(/Mar 08\/01\/2030, 1 sesión/); // the period is known once the week arrived
    const calls = calendarCalls().length;
    await fireEvent.press(screen.getByLabelText('Semana anterior'));
    expect(await screen.findByText('Fuera del periodo académico')).toBeTruthy();
    expect(screen.getByText('07/01/2030 – 13/01/2030')).toBeTruthy();
    expect(calendarCalls()).toHaveLength(calls);
  });

  it('does not move after the last week of the period', async () => {
    calendar = () => Promise.resolve(calendarPage([], { period: { id: 'p1', name: '2030-1', startsOn: '2030-01-07', endsOn: '2030-01-13', status: 'ACTIVE' } }));
    await renderScreen();
    await screen.findByText('No hay sesiones este día'); // the period is known once the week arrived
    await fireEvent.press(screen.getByLabelText('Semana siguiente'));
    expect(await screen.findByText('Fuera del periodo académico')).toBeTruthy();
    expect(screen.getByText('07/01/2030 – 13/01/2030')).toBeTruthy();
  });

  it('opens on the closest week of the period when today is outside it', async () => {
    setNow('2029-06-06T19:00:00.000Z');
    await renderScreen();
    expect(await range('07/01/2030 – 13/01/2030')).toBeTruthy();
    expect(calendarCalls().at(-1)).toBe('/teacher/calendar?from=2030-01-07&to=2030-01-13');
    expect(screen.queryByLabelText('Ahora')).toBeNull();
  });

  it('shows a past week read only', async () => {
    calendar = () => Promise.resolve(calendarPage([teacherSessionOf({ canCancel: false, canReschedule: false, blockReason: 'PAST' })]));
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(/Mar 08\/01\/2030/));
    await fireEvent.press(await block('Cálculo I', '14:00–16:00', 'A-101', 'Programada'));
    expect(await screen.findByText('La sesión ya pasó.')).toBeTruthy();
    expect(screen.queryByLabelText('Reprogramar')).toBeNull();
  });

  it('does not show the previous week as the new one when the change fails', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(/Mar 08\/01\/2030/));
    await block('Cálculo I', '14:00–16:00', 'A-101', 'Programada');
    calendar = (from) => (from === '2030-01-14' ? Promise.reject(new ApiError(500, 'INTERNAL_ERROR')) : Promise.resolve(weekOf(from)));
    await fireEvent.press(screen.getByLabelText('Semana siguiente'));
    expect(await screen.findByText('No pudimos cargar la semana')).toBeTruthy();
    expect(screen.queryByLabelText('Cálculo I, 14:00–16:00, A-101, Programada')).toBeNull();
    expect(screen.getByText('14/01/2030 – 20/01/2030')).toBeTruthy();
  });
});

describe('state of each session', () => {
  const open = async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(/Mar 08\/01\/2030/));
  };

  it('shows a rescheduled session at its new hour with its original hour', async () => {
    calendar = () =>
      Promise.resolve(
        calendarPage([
          teacherSessionOf({
            status: 'RESCHEDULED',
            startsAt: '2030-01-08T15:00:00.000Z',
            endsAt: '2030-01-08T17:00:00.000Z',
          }),
        ]),
      );
    await open();
    expect(await block('Cálculo I', '10:00–12:00', 'A-101', 'Reprogramada')).toBeTruthy();
    expect(screen.getByText(/Antes: .* · 14:00/)).toBeTruthy();
  });

  it.each([
    ['HOLIDAY', 'Cancelada por festivo'],
    ['TEACHER', 'Cancelada por ti'],
  ] as const)('keeps a session cancelled by %s visible, struck through and with its reason', async (reason, text) => {
    calendar = () =>
      Promise.resolve(calendarPage([teacherSessionOf({ status: 'CANCELLED', cancelReason: reason, attendees: 0, canCancel: false, canReschedule: false })]));
    await open();
    const cancelled = await block('Cálculo I', '14:00–16:00', 'A-101', text);
    expect(within(cancelled).getByText('Cálculo I')).toHaveStyle({ textDecorationLine: 'line-through' });
    expect(within(cancelled).getByText(text)).toBeTruthy();
  });

  it('marks a day whose sessions are all cancelled', async () => {
    calendar = () => Promise.resolve(calendarPage([teacherSessionOf({ status: 'CANCELLED', cancelReason: 'HOLIDAY', attendees: 0 })]));
    await renderScreen();
    expect(await screen.findByLabelText(/Mar 08\/01\/2030, 1 sesión/)).toBeTruthy();
  });
});

describe('open a session from the calendar', () => {
  const openBlock = async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(/Mar 08\/01\/2030/));
    await fireEvent.press(await block('Cálculo I', '14:00–16:00', 'A-101', 'Programada'));
  };

  it('opens the sheet of the session with the rule of the hour', async () => {
    await openBlock();
    expect(await screen.findByText(/hasta 120 minutos antes/)).toBeTruthy();
    expect(screen.getByLabelText('Reprogramar')).toBeTruthy();
  });

  it('shows the blocking rule and no actions of a session that can no longer change', async () => {
    calendar = () => Promise.resolve(calendarPage([teacherSessionOf({ canCancel: false, canReschedule: false, blockReason: 'WINDOW_PASSED' })]));
    await openBlock();
    expect(await screen.findByText('Ya no puedes cambiarla: faltan menos de 120 minutos.')).toBeTruthy();
    expect(screen.queryByLabelText('Reprogramar')).toBeNull();
  });

  it('shows a closed period without actions', async () => {
    calendar = () =>
      Promise.resolve(calendarPage([teacherSessionOf({ canCancel: false, canReschedule: false, blockReason: 'PERIOD_CLOSED' })], {
        period: { id: 'p1', name: '2030-1', startsOn: '2030-01-07', endsOn: '2030-03-03', status: 'CLOSED' },
      }));
    await openBlock();
    expect(await screen.findByText('Periodo cerrado, solo lectura.')).toBeTruthy();
    expect(screen.queryByLabelText('Cancelar sesión')).toBeNull();
  });

  it('refreshes the calendar after a change, without reloading by hand', async () => {
    await openBlock();
    const before = calendarCalls().length;
    await fireEvent.press(await screen.findByLabelText('Cancelar sesión'));
    await fireEvent.press(screen.getAllByLabelText('Cancelar sesión').at(-1)!);
    await fireEvent.press(screen.getAllByLabelText('Cancelar sesión').at(-1)!);
    await waitFor(() => expect(calendarCalls().length).toBeGreaterThan(before));
  });
});

describe('day and week views', () => {
  it('opens on the day view on a phone', async () => {
    await renderScreen();
    expect(await screen.findByLabelText(/Mar 08\/01\/2030, 1 sesión/)).toBeTruthy();
    expect(screen.getByLabelText('Día').props.accessibilityState.selected).toBe(true);
  });

  it('opens on the week view on a tablet', async () => {
    setWidth(TABLET);
    await renderScreen();
    await screen.findByText('07/01/2030 – 13/01/2030');
    expect(screen.getByLabelText('Semana', { exact: true }).props.accessibilityState.selected).toBe(true);
    expect(screen.queryByLabelText(/Mar 08\/01\/2030, 1 sesión/)).toBeNull();
  });

  it('shows seven columns with compact blocks and opens the same sheet', async () => {
    setWidth(TABLET);
    await renderScreen();
    expect(await block('Cálculo I', '14:00–16:00', 'A-101', 'Programada')).toBeTruthy();
    expect(screen.getByLabelText('Física, 10:00–12:00, B-202, Programada')).toBeTruthy();
    expect(screen.getAllByText('Lun')).toHaveLength(1);
    expect(screen.getByText('Dom')).toBeTruthy();
    expect(screen.queryByText('12 asistentes')).toBeNull(); // compact: hours, room and state only
    await fireEvent.press(screen.getByLabelText('Cálculo I, 14:00–16:00, A-101, Programada'));
    expect(await screen.findByText(/hasta 120 minutos antes/)).toBeTruthy();
  });

  it('switches the view and keeps it when moving between weeks and pressing Today', async () => {
    await renderScreen();
    await screen.findByLabelText(/Mar 08\/01\/2030, 1 sesión/);
    await fireEvent.press(screen.getByLabelText('Semana', { exact: true }));
    expect(await block('Cálculo I', '14:00–16:00', 'A-101', 'Programada')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Semana siguiente'));
    await screen.findByText('14/01/2030 – 20/01/2030');
    expect(screen.getByLabelText('Semana', { exact: true }).props.accessibilityState.selected).toBe(true);
    await fireEvent.press(screen.getByLabelText('Hoy'));
    await screen.findByText('07/01/2030 – 13/01/2030');
    expect(screen.getByLabelText('Semana', { exact: true }).props.accessibilityState.selected).toBe(true);
  });
});
