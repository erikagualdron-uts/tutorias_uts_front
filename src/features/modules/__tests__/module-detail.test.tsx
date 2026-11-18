import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { api } from '@/api/client';
import type { ModuleDetail } from '@/api/types';
import i18n from '@/i18n';
import { ModuleDetailScreen } from '../screens/ModuleDetailScreen';
import { detailOf, page, sessionOf } from '../test-fixtures';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() }, useLocalSearchParams: () => ({ id: 'm1' }) }));

const mockedApi = api as jest.Mock;
let detail: ModuleDetail;

const renderScreen = (ui: ReactElement) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>,
  );

beforeEach(async () => {
  detail = detailOf();
  mockedApi.mockImplementation((path: string) => {
    if (path.endsWith('/sessions?limit=100')) {
      return Promise.resolve(
        page([
          sessionOf(),
          sessionOf({ id: 'x2', startsAt: '2030-01-15T23:30:00.000Z', endsAt: '2030-01-16T01:30:00.000Z' }),
          sessionOf({ id: 'x3', startsAt: '2030-01-22T19:00:00.000Z', status: 'CANCELLED', cancelReason: 'HOLIDAY' }),
        ]),
      );
    }
    if (path.startsWith('/modules/m1')) return Promise.resolve(detail);
    return Promise.resolve(page([]));
  });
  await i18n.changeLanguage('es');
});

describe('ModuleDetailScreen', () => {
  it('shows the data, the cupo and the schedule', async () => {
    await renderScreen(<ModuleDetailScreen />);
    expect(await screen.findByText('Cálculo I')).toBeTruthy();
    expect(screen.getByText('Refuerzo de límites')).toBeTruthy();
    expect(screen.getByText('Docente: Ana Pérez')).toBeTruthy();
    expect(screen.getByText('Salón: Sede Central · A-101')).toBeTruthy();
    expect(screen.getByText('Cupo: 7 / 25')).toBeTruthy();
    expect(screen.getByText('Mar 14:00–16:00')).toBeTruthy();
  });

  it('shows each session in Bogota time, also when UTC is already the next day', async () => {
    await renderScreen(<ModuleDetailScreen />);
    expect(await screen.findByText('08/01/2030 · 14:00–16:00')).toBeTruthy();
    // 23:30 UTC is 18:30 in Bogota, the same calendar day
    expect(screen.getByText('15/01/2030 · 18:30–20:30')).toBeTruthy();
  });

  it('tells a cancelled session apart by text and says it was a holiday', async () => {
    await renderScreen(<ModuleDetailScreen />);
    expect(await screen.findByText('Cancelada por festivo')).toBeTruthy();
    expect(screen.getAllByText('Programada')).toHaveLength(2);
  });

  it('lists the dates left without a session because of a holiday', async () => {
    detail = detailOf({ holidayDates: ['2030-01-22', '2030-02-05'] });
    await renderScreen(<ModuleDetailScreen />);
    expect(await screen.findByText('Sin sesión por festivo: 22/01/2030, 05/02/2030')).toBeTruthy();
  });

  it('explains a teacher or a room that is no longer available', async () => {
    detail = detailOf({ teacherUnavailable: true, roomUnavailable: true });
    await renderScreen(<ModuleDetailScreen />);
    expect(await screen.findByText(/docente de este módulo ya no está disponible/)).toBeTruthy();
    expect(screen.getByText(/salón de este módulo ya no está disponible/)).toBeTruthy();
  });

  it('is read-only in a closed period: explains why and offers no actions', async () => {
    detail = detailOf({ readOnlyReason: 'PERIOD_CLOSED', periodStatus: 'CLOSED' });
    await renderScreen(<ModuleDetailScreen />);
    expect(await screen.findByText(/es de solo lectura/)).toBeTruthy();
    expect(screen.queryByLabelText('Cambiar salón')).toBeNull();
  });

  it('offers to change the room when the period is open', async () => {
    await renderScreen(<ModuleDetailScreen />);
    expect(await screen.findByLabelText('Cambiar salón')).toBeTruthy();
  });
});
