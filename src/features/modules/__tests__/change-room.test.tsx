import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { RoomChangeSheet } from '../components/RoomChangeSheet';
import { detailOf, page, roomOf } from '../test-fixtures';

jest.mock('@/api/client', () => ({ api: jest.fn() }));

const mockedApi = api as jest.Mock;
const onClose = jest.fn();
let patch: () => Promise<unknown>;

const renderSheet = (enrolled: number) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
      <RoomChangeSheet module={detailOf({ enrolled })} visible onClose={onClose} />
    </QueryClientProvider> as ReactElement,
  );

beforeEach(async () => {
  jest.clearAllMocks();
  patch = () => Promise.resolve(detailOf());
  mockedApi.mockImplementation((path: string) =>
    path.startsWith('/rooms')
      ? Promise.resolve(page([roomOf({ id: 'r3', name: 'C-5', capacity: 30 }), roomOf()]))
      : patch(),
  );
  await i18n.changeLanguage('es');
});

const patched = () => mockedApi.mock.calls.filter(([, options]) => options?.method === 'PATCH');

describe('RoomChangeSheet', () => {
  it('disables a room that cannot hold the enrolled students and shows the rule', async () => {
    await renderSheet(32);
    expect(await screen.findByText('Capacidad insuficiente: 32 inscritos, este salón tiene capacidad para 30')).toBeTruthy();
    const small = screen.getByLabelText(/Sede Central · C-5/);
    expect(small.props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(small);
    expect(screen.queryByText('Cambiar el salón')).toBeNull();
    expect(screen.getByLabelText(/Sede Central · B-201/).props.accessibilityState.disabled).toBeFalsy();
  });

  it('asks for confirmation with the students who will be told, then changes the room', async () => {
    await renderSheet(25);
    await fireEvent.press(await screen.findByLabelText(/Sede Central · B-201/));
    expect(screen.getByText('Cambiar el salón')).toBeTruthy();
    expect(screen.getByText(/B-201 \(capacidad 40\)/)).toBeTruthy();
    expect(screen.getByText(/25 inscritos serán avisados\./)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Cambiar salón'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(patched()).toEqual([['/modules/m1/room', { method: 'PATCH', body: { roomId: 'r2' } }]]);
  });

  it('does not mention notifications when nobody is enrolled', async () => {
    await renderSheet(0);
    await fireEvent.press(await screen.findByLabelText(/Sede Central · B-201/));
    expect(screen.queryByText(/serán avisados/)).toBeNull();
  });

  it('can be cancelled without changing anything', async () => {
    await renderSheet(0);
    await fireEvent.press(await screen.findByLabelText(/Sede Central · B-201/));
    await fireEvent.press(screen.getByLabelText('Cancelar'));
    expect(patched()).toHaveLength(0);
    expect(await screen.findByText('Elige el nuevo salón')).toBeTruthy();
  });

  it('shows the rule the server applies when the room is taken, and stays open', async () => {
    patch = () =>
      Promise.reject(
        new ApiError(409, 'MODULE_ROOM_CONFLICT', {
          conflict: { moduleName: 'Física', dayOfWeek: 2, startTime: '15:00', endTime: '17:00' },
        }),
      );
    await renderSheet(0);
    await fireEvent.press(await screen.findByLabelText(/Sede Central · B-201/));
    await fireEvent.press(screen.getByLabelText('Cambiar salón'));
    expect(await screen.findByText('El salón ya está ocupado por el módulo Física el martes de 15:00 a 17:00.')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });
});
