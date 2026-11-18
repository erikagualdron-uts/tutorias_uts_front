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
let session = teacherSessionOf();
let write: () => Promise<unknown>;

const renderScreen = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <TeacherScheduleScreen />
    </QueryClientProvider>,
  );
const posts = () =>
  mockedApi.mock.calls.filter(([, o]) => o?.method === 'POST').map(([path, o]) => ({ path: path as string, body: o.body }));

beforeEach(async () => {
  jest.clearAllMocks();
  session = teacherSessionOf();
  write = () => Promise.resolve({ scope: 'SESSION', dryRun: false, sessions: [session] });
  mockedApi.mockImplementation((path: string, options?: { method?: string }) => {
    if (options?.method === 'POST') return write();
    if (path.startsWith('/teacher/calendar')) return Promise.resolve(calendarPage([]));
    return path.startsWith('/teacher/modules') ? Promise.resolve(modulesPage([teacherModuleOf()])) : Promise.resolve(sessionsPage([session]));
  });
  await i18n.changeLanguage('es');
});

async function openSheet(label: RegExp) {
  await renderScreen();
  await fireEvent.press(await screen.findByLabelText(label));
}

describe('cancel from the sheet', () => {
  it('offers the scope and asks for confirmation before cancelling', async () => {
    await openSheet(/Cálculo I\. .*Programada/);
    await fireEvent.press(await screen.findByLabelText('Cancelar sesión'));
    expect(screen.getByLabelText('Solo esta sesión')).toBeTruthy();
    expect(screen.getByLabelText('Esta y las futuras')).toBeTruthy();
    await fireEvent.press(screen.getAllByLabelText('Cancelar sesión').at(-1)!);
    expect(await screen.findByText('¿Cancelar la sesión?')).toBeTruthy();
    expect(posts()).toEqual([]);
    await fireEvent.press(screen.getAllByLabelText('Cancelar sesión').at(-1)!);
    await waitFor(() => expect(posts()).toEqual([{ path: '/teacher/sessions/s1/cancel', body: { scope: 'SESSION' } }]));
  });

  it('cancels the series when the teacher chooses it', async () => {
    await openSheet(/Cálculo I\. .*Programada/);
    await fireEvent.press(await screen.findByLabelText('Cancelar sesión'));
    await fireEvent.press(screen.getByLabelText('Esta y las futuras'));
    await fireEvent.press(screen.getAllByLabelText('Cancelar sesión').at(-1)!);
    expect(await screen.findByText(/las futuras de su horario semanal/)).toBeTruthy();
    await fireEvent.press(screen.getAllByLabelText('Cancelar sesión').at(-1)!);
    await waitFor(() => expect(posts()[0]?.body).toEqual({ scope: 'SERIES' }));
  });

  it('shows the translated server error when the cancellation fails', async () => {
    write = () => Promise.reject(new ApiError(409, 'SESSION_CHANGE_WINDOW_PASSED', { minutes: 120 }));
    await openSheet(/Cálculo I\. .*Programada/);
    await fireEvent.press(await screen.findByLabelText('Cancelar sesión'));
    await fireEvent.press(screen.getAllByLabelText('Cancelar sesión').at(-1)!);
    await fireEvent.press(screen.getAllByLabelText('Cancelar sesión').at(-1)!);
    expect(await screen.findByText(/Solo puedes cambiar una sesión hasta 120 minutos/)).toBeTruthy();
  });
});

describe('restore from the sheet', () => {
  beforeEach(() => {
    session = teacherSessionOf({ status: 'CANCELLED', cancelReason: 'TEACHER', attendees: 0, canReschedule: false, canCancel: false, canRestore: true });
  });

  it('offers to restore a session the teacher cancelled, not to cancel or reschedule it', async () => {
    await openSheet(/Cálculo I\. .*Cancelada por ti/);
    expect(await screen.findByLabelText('Reactivar sesión')).toBeTruthy();
    expect(screen.queryByLabelText('Reprogramar')).toBeNull();
    expect(screen.queryByLabelText('Cancelar sesión')).toBeNull();
  });

  it('restores with the chosen scope', async () => {
    await openSheet(/Cálculo I\. .*Cancelada por ti/);
    await fireEvent.press(await screen.findByLabelText('Reactivar sesión'));
    await fireEvent.press(screen.getByLabelText('Esta y las futuras'));
    await fireEvent.press(screen.getAllByLabelText('Reactivar sesión').at(-1)!);
    await waitFor(() => expect(posts()).toEqual([{ path: '/teacher/sessions/s1/restore', body: { scope: 'SERIES' } }]));
  });

  it('shows why a restore is refused', async () => {
    write = () => Promise.reject(new ApiError(409, 'MODULE_ROOM_CONFLICT', { conflict: { moduleName: 'Física', dayOfWeek: 2, startTime: '14:00', endTime: '16:00' } }));
    await openSheet(/Cálculo I\. .*Cancelada por ti/);
    await fireEvent.press(await screen.findByLabelText('Reactivar sesión'));
    await fireEvent.press(screen.getAllByLabelText('Reactivar sesión').at(-1)!);
    expect(await screen.findByText(/ocupado por el módulo Física/)).toBeTruthy();
  });
});

describe('sessions the teacher cannot restore', () => {
  it('shows a holiday cancellation with its rule and no actions', async () => {
    session = teacherSessionOf({ status: 'CANCELLED', cancelReason: 'HOLIDAY', attendees: 0, canReschedule: false, canCancel: false, canRestore: false, blockReason: 'CANCELLED_BY_OTHER' });
    await openSheet(/Cálculo I\. .*Cancelada por festivo/);
    expect(await screen.findByText('La canceló un festivo: no se puede reactivar desde aquí.')).toBeTruthy();
    expect(screen.queryByLabelText('Reactivar sesión')).toBeNull();
  });

  it('shows the window rule when it is too late', async () => {
    session = teacherSessionOf({ canReschedule: false, canCancel: false, blockReason: 'WINDOW_PASSED' });
    await openSheet(/Cálculo I\. .*Programada/);
    expect(await screen.findByText('Ya no puedes cambiarla: faltan menos de 120 minutos.')).toBeTruthy();
    expect(screen.queryByLabelText('Cancelar sesión')).toBeNull();
  });

  it('speaks English', async () => {
    await i18n.changeLanguage('en');
    await openSheet(/Cálculo I\. .*Scheduled/);
    expect(await screen.findByLabelText('Cancel session')).toBeTruthy();
  });
});
