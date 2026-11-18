import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { TeacherScheduleScreen } from '../screens/TeacherScheduleScreen';
import { calendarPage, modulesPage, sessionsPage, teacherModuleOf, teacherSessionOf } from '../test-fixtures';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));

const mockedApi = api as jest.Mock;
let sessions: () => Promise<unknown>;
let write: (body: { dryRun?: boolean; scope: string; startsAt: string }) => Promise<unknown>;

const renderScreen = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <TeacherScheduleScreen />
    </QueryClientProvider>,
  );
const posts = () =>
  mockedApi.mock.calls
    .filter(([, o]) => o?.method === 'POST')
    .map(([path, o]) => ({ path: path as string, body: o.body as { dryRun?: boolean; scope: string; startsAt: string } }));

beforeEach(async () => {
  jest.clearAllMocks();
  sessions = () => Promise.resolve(sessionsPage([teacherSessionOf()]));
  write = (body) => Promise.resolve({ scope: body.scope, dryRun: !!body.dryRun, sessions: [teacherSessionOf()] });
  mockedApi.mockImplementation((path: string, options?: { method?: string; body?: never }) => {
    if (options?.method === 'POST') return write(options.body as never);
    if (path.startsWith('/teacher/calendar')) return Promise.resolve(calendarPage([]));
    return path.startsWith('/teacher/modules') ? Promise.resolve(modulesPage([teacherModuleOf()])) : sessions();
  });
  await i18n.changeLanguage('es');
});

// Opens the sheet of the only session and goes to the reschedule form.
async function openForm() {
  await renderScreen();
  await fireEvent.press(await screen.findByLabelText(/Cálculo I\. .*Programada/));
  await fireEvent.press(await screen.findByLabelText('Reprogramar'));
}

// Picks 16:00 (the session is at 14:00), which is 21:00Z.
async function pickSixteen() {
  await fireEvent.press(await screen.findByLabelText(/Nueva hora/));
  await fireEvent.press(await screen.findByLabelText('16:00'));
}

describe('reschedule sheet', () => {
  it('offers the scope, the date limited to the week and the time', async () => {
    await openForm();
    expect(screen.getByLabelText('Solo esta sesión')).toBeTruthy();
    expect(screen.getByLabelText('Esta y las futuras')).toBeTruthy();
    expect(screen.getByText('Solo puedes moverla dentro de su misma semana.')).toBeTruthy();
    expect(screen.getByLabelText('Confirmar cambio').props.accessibilityState.disabled).toBe(true);
  });

  it('asks the API with dryRun when a new hour is chosen, and then lets the change be confirmed', async () => {
    await openForm();
    await pickSixteen();
    await waitFor(() =>
      expect(posts()).toContainEqual({
        path: '/teacher/sessions/s1/reschedule',
        body: { scope: 'SESSION', startsAt: '2030-01-08T21:00:00.000Z', dryRun: true },
      }),
    );
    expect(await screen.findByText('Hora disponible. Sesiones que se mueven: 1.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Confirmar cambio'));
    await waitFor(() =>
      expect(posts()).toContainEqual({
        path: '/teacher/sessions/s1/reschedule',
        body: { scope: 'SESSION', startsAt: '2030-01-08T21:00:00.000Z' },
      }),
    );
  });

  it('asks again with the new scope', async () => {
    await openForm();
    await pickSixteen();
    await fireEvent.press(screen.getByLabelText('Esta y las futuras'));
    await waitFor(() => expect(posts().some((p) => p.body.scope === 'SERIES' && p.body.dryRun)).toBe(true));
  });

  it.each([
    [new ApiError(409, 'MODULE_ROOM_CONFLICT', { conflict: { moduleName: 'Física', dayOfWeek: 2, startTime: '16:00', endTime: '18:00' } }), 'ocupado por el módulo Física'],
    [new ApiError(409, 'MODULE_TEACHER_CONFLICT', { conflict: { moduleName: 'Física', dayOfWeek: 2, startTime: '16:00', endTime: '18:00' } }), 'ya tiene el módulo Física'],
    [new ApiError(422, 'SESSION_RESCHEDULE_INVALID_DATE', { reason: 'HOLIDAY', date: '2030-01-10' }), 'festivo'],
    [new ApiError(422, 'SESSION_RESCHEDULE_INVALID_DATE', { reason: 'OUT_OF_WEEK' }), 'mover la sesión dentro de su misma semana'],
    [new ApiError(422, 'MODULE_SCHEDULE_OUT_OF_HOURS', { earliest: '06:00', latest: '18:00' }), 'entre las 06:00 y las 18:00'],
    [new ApiError(409, 'SESSION_STUDENT_CONFLICT', { students: 2 }), '2 estudiantes inscritos'],
  ])('shows the reason of a rejection and keeps the confirmation off (%#)', async (error, text) => {
    write = () => Promise.reject(error);
    await openForm();
    await pickSixteen();
    expect(await screen.findByText(new RegExp(text))).toBeTruthy();
    expect(screen.getByLabelText('Confirmar cambio').props.accessibilityState.disabled).toBe(true);
    expect(posts().every((p) => p.body.dryRun)).toBe(true);
  });

  it('shows the server error when the confirmation fails', async () => {
    write = (body) =>
      body.dryRun
        ? Promise.resolve({ scope: body.scope, dryRun: true, sessions: [teacherSessionOf()] })
        : Promise.reject(new ApiError(409, 'SESSION_CHANGE_WINDOW_PASSED', { minutes: 120 }));
    await openForm();
    await pickSixteen();
    await fireEvent.press(await screen.findByLabelText('Confirmar cambio'));
    expect(await screen.findByText(/hasta 120 minutos antes/)).toBeTruthy();
  });

  it('does not offer to reschedule a session that is blocked, and shows why', async () => {
    sessions = () =>
      Promise.resolve(sessionsPage([teacherSessionOf({ canReschedule: false, canCancel: false, blockReason: 'WINDOW_PASSED' })]));
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(/Cálculo I\. .*Programada/));
    expect(await screen.findByText('Ya no puedes cambiarla: faltan menos de 120 minutos.')).toBeTruthy();
    expect(screen.queryByLabelText('Reprogramar')).toBeNull();
  });

  it('speaks English', async () => {
    await i18n.changeLanguage('en');
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(/Cálculo I\. .*Scheduled/));
    await fireEvent.press(await screen.findByLabelText('Reschedule'));
    expect(screen.getByLabelText('Only this session')).toBeTruthy();
    expect(screen.getByText('You can only move it within its own week.')).toBeTruthy();
  });
});
