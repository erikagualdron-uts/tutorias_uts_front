import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { TeacherChangeSheet } from '../components/TeacherChangeSheet';
import { detailOf, page } from '../test-fixtures';

jest.mock('@/api/client', () => ({ api: jest.fn() }));

const mockedApi = api as jest.Mock;
const onClose = jest.fn();
let patch: () => Promise<unknown>;
const luis = { id: 't2', firstName: 'Luis', lastName: 'Gómez', status: 'ACTIVE' };

const renderSheet = (enrolled: number) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
      <TeacherChangeSheet module={detailOf({ enrolled })} visible onClose={onClose} />
    </QueryClientProvider>,
  );

beforeEach(async () => {
  jest.clearAllMocks();
  patch = () => Promise.resolve(detailOf());
  mockedApi.mockImplementation((path: string) =>
    path.startsWith('/teachers') ? Promise.resolve(page([luis])) : patch(),
  );
  await i18n.changeLanguage('es');
});

const patched = () => mockedApi.mock.calls.filter(([, options]) => options?.method === 'PATCH');

describe('TeacherChangeSheet', () => {
  it('offers only active teachers', async () => {
    await renderSheet(0);
    expect(await screen.findByLabelText('Luis Gómez')).toBeTruthy();
    expect(mockedApi).toHaveBeenCalledWith('/teachers?limit=100&status=ACTIVE');
  });

  it('confirms with the students who will be told, then changes the teacher', async () => {
    await renderSheet(12);
    await fireEvent.press(await screen.findByLabelText('Luis Gómez'));
    expect(screen.getByText(/pasará a Luis Gómez/)).toBeTruthy();
    expect(screen.getByText(/12 inscritos serán avisados\./)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Cambiar docente'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(patched()).toEqual([['/modules/m1/teacher', { method: 'PATCH', body: { teacherId: 't2' } }]]);
  });

  it('says nothing about notifications when nobody is enrolled', async () => {
    await renderSheet(0);
    await fireEvent.press(await screen.findByLabelText('Luis Gómez'));
    expect(screen.queryByText(/serán avisados/)).toBeNull();
  });

  it('shows the clash returned by the server and stays open', async () => {
    patch = () =>
      Promise.reject(
        new ApiError(409, 'MODULE_TEACHER_CONFLICT', {
          conflict: { moduleName: 'Álgebra', dayOfWeek: 2, startTime: '15:00', endTime: '17:00' },
        }),
      );
    await renderSheet(0);
    await fireEvent.press(await screen.findByLabelText('Luis Gómez'));
    await fireEvent.press(screen.getByLabelText('Cambiar docente'));
    expect(await screen.findByText('El docente ya tiene el módulo Álgebra el martes de 15:00 a 17:00.')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });
});
