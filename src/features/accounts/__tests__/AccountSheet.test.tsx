import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { AccountSheet } from '../components/AccountSheet';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a) },
}));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));

const mockedApi = api as jest.Mock;
const teacher = (overrides: object = {}) => ({
  id: 't1',
  firstName: 'Ana',
  lastName: 'Pérez',
  email: 'ana@correo.uts.edu.co',
  status: 'ACTIVE',
  modulesCount: 2,
  ...overrides,
});
const student = (overrides: object = {}) => ({
  id: 's1',
  firstName: 'Luis',
  lastName: 'Gómez',
  email: 'luis@uts.edu.co',
  program: null,
  status: 'ACTIVE',
  enrolledCount: 3,
  ...overrides,
});

const renderSheet = async (kind: 'teacher' | 'student', id: string) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidate = jest.spyOn(client, 'invalidateQueries');
  const onClose = jest.fn();
  await render(
    <QueryClientProvider client={client}>
      <AccountSheet kind={kind} id={id} onClose={onClose} />
    </QueryClientProvider>,
  );
  return { invalidate, onClose };
};

beforeEach(async () => {
  jest.clearAllMocks();
  mockedApi.mockReset();
  await i18n.changeLanguage('es');
});

describe('AccountSheet', () => {
  it('asks for the detail on open and states the effect on modules before confirming', async () => {
    mockedApi.mockResolvedValueOnce(teacher()).mockResolvedValue({
      id: 't1',
      status: 'INACTIVE',
      unavailableModules: 2,
    });
    const { invalidate, onClose } = await renderSheet('teacher', 't1');
    expect(await screen.findByText('Ana Pérez')).toBeTruthy();
    expect(mockedApi).toHaveBeenCalledWith('/teachers/t1');

    await fireEvent.press(screen.getByLabelText('Desactivar'));
    expect(
      await screen.findByText('2 módulos quedarán con docente no disponible.'),
    ).toBeTruthy();
    expect(mockedApi).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getAllByLabelText('Desactivar')[1]);
    await waitFor(() =>
      expect(mockedApi).toHaveBeenCalledWith('/teachers/t1/deactivate', {
        method: 'POST',
      }),
    );
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: ['teacher-accounts'],
      }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('states the cancelled enrollments and freed seats for a student', async () => {
    mockedApi.mockResolvedValue(student());
    await renderSheet('student', 's1');
    await fireEvent.press(await screen.findByLabelText('Desactivar'));
    expect(
      await screen.findByText(
        '3 inscripciones se cancelarán y se liberarán 3 cupos.',
      ),
    ).toBeTruthy();
  });

  it('offers Reactivar instead of Desactivar on a deactivated account and applies it', async () => {
    mockedApi
      .mockResolvedValueOnce(teacher({ status: 'INACTIVE' }))
      .mockResolvedValue({ id: 't1', status: 'ACTIVE' });
    const { onClose } = await renderSheet('teacher', 't1');
    expect(await screen.findByLabelText('Reactivar')).toBeTruthy();
    expect(screen.queryByLabelText('Desactivar')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Reactivar'));
    await waitFor(() =>
      expect(mockedApi).toHaveBeenCalledWith('/teachers/t1/reactivate', {
        method: 'POST',
      }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('shows a translated server error', async () => {
    mockedApi
      .mockResolvedValueOnce(teacher())
      .mockRejectedValue(new ApiError(404, 'ACCOUNT_NOT_FOUND'));
    await renderSheet('teacher', 't1');
    await fireEvent.press(await screen.findByLabelText('Desactivar'));
    await screen.findByText('¿Desactivar esta cuenta?');
    await fireEvent.press(screen.getAllByLabelText('Desactivar')[1]);
    expect(await screen.findByText(/No encontramos esa cuenta\./)).toBeTruthy();
  });

  it('deletes only after a confirmation that warns it cannot be undone from the app', async () => {
    mockedApi.mockResolvedValueOnce(teacher()).mockResolvedValue({
      id: 't1',
      status: 'ACTIVE',
      deleted: true,
      unavailableModules: 2,
    });
    const { invalidate, onClose } = await renderSheet('teacher', 't1');
    await fireEvent.press(await screen.findByLabelText('Eliminar'));
    expect(
      await screen.findByText(/no se puede deshacer desde la app/),
    ).toBeTruthy();
    expect(mockedApi).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getAllByLabelText('Eliminar')[1]);
    await waitFor(() =>
      expect(mockedApi).toHaveBeenCalledWith('/teachers/t1', {
        method: 'DELETE',
      }),
    );
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: ['teacher-accounts'],
      }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('shows a retry when the detail cannot be loaded', async () => {
    mockedApi
      .mockRejectedValueOnce(new ApiError(500, 'INTERNAL_ERROR'))
      .mockResolvedValue(student());
    await renderSheet('student', 's1');
    await fireEvent.press(await screen.findByLabelText('Intentar de nuevo'));
    expect(await screen.findByText('Luis Gómez')).toBeTruthy();
  });

  it('opens the edit screen for a teacher and closes the sheet', async () => {
    mockedApi.mockResolvedValue(teacher());
    const { onClose } = await renderSheet('teacher', 't1');
    await fireEvent.press(await screen.findByLabelText('Editar'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/more/teacher-edit',
      params: { id: 't1' },
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows the regenerated password once, and closing drops it', async () => {
    mockedApi
      .mockResolvedValueOnce(teacher())
      .mockResolvedValue({ temporaryPassword: 'Nueva12345Ab' });
    const { onClose } = await renderSheet('teacher', 't1');
    await fireEvent.press(await screen.findByLabelText('Regenerar clave'));
    expect(await screen.findByText('Nueva12345Ab')).toBeTruthy();
    expect(mockedApi).toHaveBeenCalledWith('/teachers/t1/temporary-password', {
      method: 'POST',
    });
    expect(
      screen.getByText('Cópiala ahora: no se volverá a mostrar.'),
    ).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Cerrar'));
    await waitFor(() => expect(screen.queryByText('Nueva12345Ab')).toBeNull());
    expect(onClose).toHaveBeenCalled();
  });

  it('disables regenerating on a deactivated account and says why', async () => {
    mockedApi.mockResolvedValue(teacher({ status: 'INACTIVE' }));
    await renderSheet('teacher', 't1');
    const button = await screen.findByLabelText('Regenerar clave');
    expect(button.props.accessibilityState?.disabled).toBe(true);
    expect(
      screen.getByText('Reactiva la cuenta para regenerar su clave.'),
    ).toBeTruthy();
  });

  it('offers neither edit nor regenerate for a student', async () => {
    mockedApi.mockResolvedValue(student());
    await renderSheet('student', 's1');
    await screen.findByText('Luis Gómez');
    expect(screen.queryByLabelText('Editar')).toBeNull();
    expect(screen.queryByLabelText('Regenerar clave')).toBeNull();
  });
});
