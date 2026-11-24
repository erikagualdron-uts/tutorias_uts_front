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
import type { DropdownItem, DropdownListDetail } from '@/api/types';
import i18n from '@/i18n';
import { labelFor } from '../schemas';
import { DropdownItemFormScreen } from '../screens/DropdownItemFormScreen';
import { DropdownItemsScreen } from '../screens/DropdownItemsScreen';

jest.mock('@/api/client', () => ({ api: jest.fn() }));

const mockParams: { key: string; itemId?: string } = { key: 'PQRS_TYPE' };
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: () => mockBack() },
  useLocalSearchParams: () => mockParams,
}));

const mockedApi = api as jest.Mock;

const item = (overrides: Partial<DropdownItem> = {}): DropdownItem => ({
  id: 'i1',
  labelEs: 'Petición',
  labelEn: 'Request',
  sortOrder: 1,
  status: 'ACTIVE',
  inUse: false,
  ...overrides,
});
const list = (items: DropdownItem[]): DropdownListDetail => ({
  key: 'PQRS_TYPE',
  nameEs: 'Tipos de PQRS',
  nameEn: 'PQRS types',
  items,
});

const serve = (handlers: Record<string, unknown>) =>
  mockedApi.mockImplementation((path: string) => {
    const key = Object.keys(handlers).find((k) => path.startsWith(k));
    const value = key ? handlers[key] : undefined;
    return value instanceof Error
      ? Promise.reject(value)
      : Promise.resolve(value);
  });

const renderWithProviders = (ui: ReactElement) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      {ui}
    </QueryClientProvider>,
  );

beforeEach(async () => {
  jest.clearAllMocks();
  mockParams.itemId = undefined;
  await i18n.changeLanguage('es');
});

describe('labelFor', () => {
  it('follows the device language and falls back to Spanish', () => {
    expect(labelFor(item(), 'en')).toBe('Request');
    expect(labelFor(item(), 'en-US')).toBe('Request');
    expect(labelFor(item(), 'es')).toBe('Petición');
    expect(labelFor(item(), 'fr')).toBe('Petición');
  });
});

describe('DropdownItemsScreen', () => {
  const two = [
    item(),
    item({ id: 'i2', labelEs: 'Queja', labelEn: 'Complaint', sortOrder: 2 }),
  ];

  it('opens with the brand header and the item count', async () => {
    serve({ '/dropdown-lists/PQRS_TYPE': list(two) });
    await renderWithProviders(<DropdownItemsScreen />);
    expect(await screen.findByRole('header')).toBeTruthy();
    expect(await screen.findByText('2')).toBeTruthy();
  });

  it('moves an item down by sending the whole new order', async () => {
    serve({
      '/dropdown-lists/PQRS_TYPE/items/order': list(two),
      '/dropdown-lists/PQRS_TYPE': list(two),
    });
    await renderWithProviders(<DropdownItemsScreen />);
    await fireEvent.press(await screen.findByLabelText('Bajar Petición'));
    await waitFor(() =>
      expect(mockedApi).toHaveBeenCalledWith(
        '/dropdown-lists/PQRS_TYPE/items/order',
        { method: 'PUT', body: { itemIds: ['i2', 'i1'] } },
      ),
    );
  });

  it('disables moving the first item up and the last one down', async () => {
    serve({ '/dropdown-lists/PQRS_TYPE': list(two) });
    await renderWithProviders(<DropdownItemsScreen />);
    const up = await screen.findByLabelText('Subir Petición');
    const down = screen.getByLabelText('Bajar Queja');
    expect(up.props.accessibilityState.disabled).toBe(true);
    expect(down.props.accessibilityState.disabled).toBe(true);
  });

  it('shows the empty state', async () => {
    serve({ '/dropdown-lists/PQRS_TYPE': list([]) });
    await renderWithProviders(<DropdownItemsScreen />);
    expect(
      await screen.findByText('Esta lista no tiene elementos'),
    ).toBeTruthy();
  });

  it('shows the error state', async () => {
    serve({ '/dropdown-lists/PQRS_TYPE': new ApiError(0, 'NETWORK') });
    await renderWithProviders(<DropdownItemsScreen />);
    expect(
      await screen.findByText('No pudimos cargar las listas.'),
    ).toBeTruthy();
  });
});

describe('DropdownItemFormScreen', () => {
  it('requires both labels', async () => {
    serve({ '/dropdown-lists/PQRS_TYPE': list([]) });
    await renderWithProviders(<DropdownItemFormScreen />);
    await fireEvent.press(await screen.findByLabelText('Guardar elemento'));
    expect(
      await screen.findAllByText('Este campo es obligatorio.'),
    ).toHaveLength(2);
  });

  it('creates an item with both labels', async () => {
    serve({
      '/dropdown-lists/PQRS_TYPE/items': item(),
      '/dropdown-lists/PQRS_TYPE': list([]),
    });
    await renderWithProviders(<DropdownItemFormScreen />);
    await fireEvent.changeText(
      await screen.findByLabelText('Etiqueta en español'),
      'Felicitación',
    );
    await fireEvent.changeText(
      screen.getByLabelText('Etiqueta en inglés'),
      'Compliment',
    );
    await fireEvent.press(screen.getByLabelText('Guardar elemento'));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(mockedApi).toHaveBeenCalledWith('/dropdown-lists/PQRS_TYPE/items', {
      method: 'POST',
      body: { labelEs: 'Felicitación', labelEn: 'Compliment' },
    });
  });

  it('explains that an item in use can only be deactivated', async () => {
    mockParams.itemId = 'i1';
    serve({ '/dropdown-lists/PQRS_TYPE': list([item({ inUse: true })]) });
    await renderWithProviders(<DropdownItemFormScreen />);
    expect(
      await screen.findByText(
        'Este elemento está en uso: solo se puede desactivar.',
      ),
    ).toBeTruthy();
    expect(
      screen.getByLabelText('Eliminar elemento').props.accessibilityState
        .disabled,
    ).toBe(true);
  });

  it('asks before deactivating', async () => {
    mockParams.itemId = 'i1';
    serve({
      '/dropdown-lists/PQRS_TYPE/items/i1': item({ status: 'INACTIVE' }),
      '/dropdown-lists/PQRS_TYPE': list([item()]),
    });
    await renderWithProviders(<DropdownItemFormScreen />);
    await fireEvent.press(await screen.findByLabelText('Desactivar elemento'));
    expect(await screen.findByText('¿Desactivar el elemento?')).toBeTruthy();
    await fireEvent.press(
      (await screen.findAllByLabelText('Desactivar elemento')).at(-1)!,
    );
    await waitFor(() =>
      expect(mockedApi).toHaveBeenCalledWith(
        '/dropdown-lists/PQRS_TYPE/items/i1',
        {
          method: 'PATCH',
          body: { status: 'INACTIVE' },
        },
      ),
    );
  });
});
