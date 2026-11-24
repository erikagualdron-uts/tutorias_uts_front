import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import en from '@/i18n/en.json';
import es from '@/i18n/es.json';
import { StudentsScreen } from '../screens/StudentsScreen';
import { TeachersScreen } from '../screens/TeachersScreen';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
}));

const mockedApi = api as jest.Mock;
const teacher = (n: number, overrides: object = {}) => ({
  id: `t${n}`,
  firstName: 'Ana',
  lastName: `Pérez ${n}`,
  email: `ana${n}@correo.uts.edu.co`,
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
  status: 'INACTIVE',
  enrolledCount: 1,
  ...overrides,
});
const page = (data: unknown[], meta: object = {}) => ({
  data,
  meta: { page: 1, limit: 20, total: data.length, ...meta },
});
const renderScreen = (ui: ReactElement) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      {ui}
    </QueryClientProvider>,
  );
const paths = () => mockedApi.mock.calls.map(([path]) => path as string);

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('es');
});

describe('TeachersScreen', () => {
  it('shows each card with name, email, status text and module count', async () => {
    mockedApi.mockResolvedValue(
      page([teacher(1), teacher(2, { status: 'INACTIVE', modulesCount: 1 })]),
    );
    await renderScreen(<TeachersScreen />);
    expect(await screen.findByText('Ana Pérez 1')).toBeTruthy();
    expect(screen.getByText('ana1@correo.uts.edu.co')).toBeTruthy();
    expect(screen.getByText('Activa')).toBeTruthy();
    expect(screen.getByText('· 2 módulos')).toBeTruthy();
    expect(screen.getByText('Desactivada')).toBeTruthy();
    expect(screen.getByText('· 1 módulo')).toBeTruthy();
  });

  it('opens with the brand header and the total', async () => {
    mockedApi.mockResolvedValue(page([teacher(1), teacher(2)]));
    await renderScreen(<TeachersScreen />);
    expect(await screen.findByRole('header', { name: i18n.t('more.teachers') })).toBeTruthy();
    expect(await screen.findByText('2')).toBeTruthy();
  });

  it('shows the loading, empty, and error-with-retry states', async () => {
    mockedApi.mockReturnValue(new Promise(() => undefined));
    const loading = await renderScreen(<TeachersScreen />);
    expect(screen.queryByText('Aún no hay docentes')).toBeNull();
    await loading.unmount();

    mockedApi.mockResolvedValue(page([]));
    const empty = await renderScreen(<TeachersScreen />);
    expect(await screen.findByText('Aún no hay docentes')).toBeTruthy();
    expect(
      screen.getByText(es.accounts.empty.teachers.description),
    ).toBeTruthy();
    await empty.unmount();

    mockedApi
      .mockRejectedValueOnce(new ApiError(500, 'INTERNAL_ERROR'))
      .mockResolvedValue(page([teacher(1)]));
    await renderScreen(<TeachersScreen />);
    expect(
      await screen.findByText('No pudimos cargar las cuentas'),
    ).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Intentar de nuevo'));
    expect(await screen.findByText('Ana Pérez 1')).toBeTruthy();
  });

  it('sends the search and the status filter to the server', async () => {
    mockedApi.mockResolvedValue(page([teacher(1)]));
    await renderScreen(<TeachersScreen />);
    await screen.findByText('Ana Pérez 1');
    await fireEvent.changeText(
      screen.getByLabelText('Buscar por nombre o correo'),
      ' josé ',
    );
    await waitFor(() =>
      expect(paths()).toContain('/teachers?page=1&limit=20&search=jos%C3%A9'),
    );
    await fireEvent.press(screen.getByLabelText('Desactivadas'));
    await waitFor(() =>
      expect(paths()).toContain(
        '/teachers?page=1&limit=20&search=jos%C3%A9&status=INACTIVE',
      ),
    );
  });

  it('explains an empty result of a search instead of the first-use message', async () => {
    mockedApi
      .mockResolvedValueOnce(page([teacher(1)]))
      .mockResolvedValue(page([]));
    await renderScreen(<TeachersScreen />);
    await screen.findByText('Ana Pérez 1');
    await fireEvent.press(screen.getByLabelText('Activas'));
    expect(await screen.findByText('Sin resultados')).toBeTruthy();
  });

  it('loads the next page when the list reaches the end', async () => {
    mockedApi
      .mockResolvedValueOnce(page([teacher(1)], { limit: 1, total: 2 }))
      .mockResolvedValueOnce(
        page([teacher(2)], { page: 2, limit: 1, total: 2 }),
      );
    await renderScreen(<TeachersScreen />);
    await screen.findByText('Ana Pérez 1');
    await fireEvent(screen.getByTestId('accounts-list'), 'endReached');
    expect(await screen.findByText('Ana Pérez 2')).toBeTruthy();
    expect(paths()).toContain('/teachers?page=2&limit=20');
  });
});

describe('StudentsScreen', () => {
  it('shows the student with status text and enrollment count', async () => {
    mockedApi.mockResolvedValue(page([student()]));
    await renderScreen(<StudentsScreen />);
    expect(await screen.findByText('Luis Gómez')).toBeTruthy();
    expect(screen.getByText('luis@uts.edu.co')).toBeTruthy();
    expect(screen.getByText('Desactivada')).toBeTruthy();
    expect(screen.getByText('· 1 inscripción')).toBeTruthy();
    expect(paths()[0]).toBe('/students?page=1&limit=20');
  });

  it('shows its own empty message', async () => {
    mockedApi.mockResolvedValue(page([]));
    await renderScreen(<StudentsScreen />);
    expect(await screen.findByText('Aún no hay estudiantes')).toBeTruthy();
  });
});

describe('account translations', () => {
  it('exist in Spanish and English', () => {
    expect(Object.keys(en.accounts).sort()).toEqual(
      Object.keys(es.accounts).sort(),
    );
    expect(en.accounts.status.INACTIVE).not.toBe(es.accounts.status.INACTIVE);
  });
});
