import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { TeacherEditScreen } from '../screens/TeacherEditScreen';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  router: { back: (...a: unknown[]) => mockBack(...a), push: jest.fn() },
  useLocalSearchParams: () => ({ id: 't1' }),
}));

const mockedApi = api as jest.Mock;
const teacher = {
  id: 't1',
  firstName: 'Ana',
  lastName: 'Pérez',
  email: 'ana@correo.uts.edu.co',
  status: 'ACTIVE',
  modulesCount: 2,
  phone: '3001112233',
};

const renderScreen = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <TeacherEditScreen />
    </QueryClientProvider>,
  );

beforeEach(async () => {
  jest.clearAllMocks();
  mockedApi.mockReset();
  await i18n.changeLanguage('es');
});

describe('TeacherEditScreen', () => {
  it('loads the teacher, shows the email disabled with its reason, and saves going back', async () => {
    mockedApi
      .mockResolvedValueOnce(teacher)
      .mockResolvedValue({ ...teacher, lastName: 'Gómez' });
    const screen = await renderScreen();
    expect(await screen.findByDisplayValue('Ana')).toBeTruthy();
    expect(screen.getByDisplayValue('3001112233')).toBeTruthy();
    const email = screen.getByDisplayValue('ana@correo.uts.edu.co');
    expect(email.props.editable).toBe(false);
    expect(
      screen.getByText('El correo institucional no se puede cambiar.'),
    ).toBeTruthy();

    await fireEvent.changeText(screen.getByDisplayValue('Pérez'), 'Gómez');
    await fireEvent.press(screen.getByLabelText('Guardar cambios'));
    await waitFor(() =>
      expect(mockedApi).toHaveBeenCalledWith('/teachers/t1', {
        method: 'PATCH',
        body: { firstName: 'Ana', lastName: 'Gómez', phone: '3001112233' },
      }),
    );
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it('marks an empty field and does not save', async () => {
    mockedApi.mockResolvedValue(teacher);
    const screen = await renderScreen();
    await fireEvent.changeText(await screen.findByDisplayValue('Ana'), '   ');
    await fireEvent.press(screen.getByLabelText('Guardar cambios'));
    expect(await screen.findByText('Este campo es obligatorio.')).toBeTruthy();
    expect(mockedApi).toHaveBeenCalledTimes(1);
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('sends an emptied phone as null', async () => {
    mockedApi.mockResolvedValueOnce(teacher).mockResolvedValue(teacher);
    const screen = await renderScreen();
    await fireEvent.changeText(
      await screen.findByDisplayValue('3001112233'),
      '',
    );
    await fireEvent.press(screen.getByLabelText('Guardar cambios'));
    await waitFor(() =>
      expect(mockedApi).toHaveBeenCalledWith(
        '/teachers/t1',
        expect.objectContaining({
          body: expect.objectContaining({ phone: null }),
        }),
      ),
    );
  });

  it('shows a server field error next to its field', async () => {
    mockedApi.mockResolvedValueOnce(teacher).mockRejectedValue(
      new ApiError(400, 'VALIDATION_FAILED', {
        fields: { lastName: 'isNotEmpty' },
      }),
    );
    const screen = await renderScreen();
    await fireEvent.press(await screen.findByLabelText('Guardar cambios'));
    expect(await screen.findByText('Este campo es obligatorio.')).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });
});
