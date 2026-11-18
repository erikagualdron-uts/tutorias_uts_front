import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { StudentModuleDetailScreen } from '../screens/StudentModuleDetailScreen';
import { detailOf, sessionOf } from '../test-fixtures';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: (...a: unknown[]) => mockBack(...a) },
  useLocalSearchParams: () => ({ id: 'm1' }),
}));

const mockedApi = api as jest.Mock;
const enrolled = { state: 'ENROLLED' as const, enrollment: { id: 'e1', enrolledAt: '2030-01-02T15:00:00.000Z' } };
let detail: () => Promise<unknown>;
let write: (path: string, method: string) => Promise<unknown>;

const renderDetail = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <StudentModuleDetailScreen />
    </QueryClientProvider>,
  );
const writes = () =>
  mockedApi.mock.calls.filter(([, o]) => o?.method).map(([path, o]) => `${o.method} ${path as string}`);

beforeEach(async () => {
  jest.clearAllMocks();
  detail = () => Promise.resolve(detailOf({ ...enrolled, sessions: [sessionOf()] }));
  write = () => Promise.resolve({});
  mockedApi.mockImplementation((path: string, options?: { method?: string }) =>
    options?.method ? write(path, options.method) : detail(),
  );
  await i18n.changeLanguage('es');
});

describe('cancel sheet', () => {
  it('offers this session or the whole module, with the rule of the hour visible', async () => {
    await renderDetail();
    await fireEvent.press(await screen.findByLabelText('Cancelar sesión'));
    expect(await screen.findByText('¿Qué quieres cancelar?')).toBeTruthy();
    expect(screen.getByLabelText('Solo esta sesión')).toBeTruthy();
    expect(screen.getByLabelText('Todo el módulo')).toBeTruthy();
    expect(screen.getByText(/hasta 60 minutos antes/)).toBeTruthy();
  });

  it('cancels only the session', async () => {
    await renderDetail();
    await fireEvent.press(await screen.findByLabelText('Cancelar sesión'));
    await fireEvent.press(await screen.findByLabelText('Solo esta sesión'));
    await waitFor(() => expect(writes()).toEqual(['POST /student/enrollments/e1/sessions/s1/cancel']));
  });

  it('asks for confirmation before cancelling the whole module, then goes back to the offer', async () => {
    await renderDetail();
    await fireEvent.press(await screen.findByLabelText('Cancelar inscripción'));
    await fireEvent.press(await screen.findByLabelText('Todo el módulo'));
    expect(await screen.findByText('¿Cancelar la inscripción?')).toBeTruthy();
    expect(writes()).toEqual([]);
    await fireEvent.press(screen.getAllByLabelText('Cancelar inscripción').at(-1)!);
    await waitFor(() => expect(writes()).toEqual(['DELETE /student/enrollments/e1']));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it('shows the translated server error when a cancellation fails', async () => {
    write = () => Promise.reject(new ApiError(409, 'ENROLLMENT_CANCEL_WINDOW_PASSED', { minutes: 60 }));
    await renderDetail();
    await fireEvent.press(await screen.findByLabelText('Cancelar sesión'));
    await fireEvent.press(await screen.findByLabelText('Solo esta sesión'));
    expect(await screen.findByText('Solo puedes cancelar hasta 60 minutos antes de la sesión.')).toBeTruthy();
  });
});

describe('session rows', () => {
  it.each([
    ['WINDOW_PASSED', 'Ya no puedes cambiarla: faltan menos de 60 minutos.'],
    ['SESSION_CANCELLED', 'La sesión está cancelada.'],
  ] as const)('disables the cancel action and shows %s', async (blockReason, text) => {
    detail = () =>
      Promise.resolve(
        detailOf({ ...enrolled, sessions: [sessionOf({ canCancel: false, blockReason })] }),
      );
    await renderDetail();
    expect((await screen.findByLabelText('Cancelar sesión')).props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText(text)).toBeTruthy();
  });

  it('offers to restore a session the student cancelled', async () => {
    detail = () =>
      Promise.resolve(
        detailOf({ ...enrolled, sessions: [sessionOf({ cancelledByStudent: true, canCancel: false, canRestore: true })] }),
      );
    await renderDetail();
    expect(await screen.findByText('Cancelada por ti')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Reactivar'));
    await waitFor(() => expect(writes()).toEqual(['POST /student/enrollments/e1/sessions/s1/restore']));
  });

  it('blocks the restore when there is no room and says why', async () => {
    detail = () =>
      Promise.resolve(
        detailOf({
          ...enrolled,
          sessions: [sessionOf({ cancelledByStudent: true, canCancel: false, canRestore: false, blockReason: 'NO_SEAT' })],
        }),
      );
    await renderDetail();
    expect((await screen.findByLabelText('Reactivar')).props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText('No hay lugar para reactivar esta sesión.')).toBeTruthy();
  });

  it('marks a session cancelled for a holiday and offers no action', async () => {
    detail = () =>
      Promise.resolve(
        detailOf({
          ...enrolled,
          sessions: [sessionOf({ status: 'CANCELLED', cancelReason: 'HOLIDAY', canCancel: false, blockReason: 'SESSION_CANCELLED' })],
        }),
      );
    await renderDetail();
    expect(await screen.findByText('Cancelada por festivo')).toBeTruthy();
    expect(screen.queryByLabelText('Cancelar sesión')).toBeNull();
  });

  it('marks a session the teacher cancelled and offers no action', async () => {
    detail = () =>
      Promise.resolve(
        detailOf({
          ...enrolled,
          sessions: [sessionOf({ status: 'CANCELLED', cancelReason: 'TEACHER', canCancel: false, blockReason: 'SESSION_CANCELLED' })],
        }),
      );
    await renderDetail();
    expect(await screen.findByText('Cancelada por el docente')).toBeTruthy();
    expect(screen.queryByLabelText('Cancelar sesión')).toBeNull();
  });

  it('shows a closed period as read only, without actions', async () => {
    detail = () => Promise.resolve(detailOf({ ...enrolled, readOnly: true, sessions: [] }));
    await renderDetail();
    expect(await screen.findByText('Periodo cerrado, solo lectura.')).toBeTruthy();
    expect(screen.queryByLabelText('Cancelar inscripción')).toBeNull();
    expect(screen.queryByLabelText('Cancelar sesión')).toBeNull();
  });
});

describe('after cancelling the module', () => {
  it('lets the student enroll again', async () => {
    detail = () => Promise.resolve(detailOf());
    await renderDetail();
    await fireEvent.press(await screen.findByLabelText('Inscribirme'));
    await waitFor(() => expect(writes()).toEqual(['POST /student/enrollments']));
  });

  it('speaks English', async () => {
    await i18n.changeLanguage('en');
    await renderDetail();
    await fireEvent.press(await screen.findByLabelText('Cancel session'));
    expect(await screen.findByText('What do you want to cancel?')).toBeTruthy();
    expect(screen.getByLabelText('Only this session')).toBeTruthy();
  });
});
