import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { useSession } from '@/store/session';
import { AccountNameScreen } from '../screens/AccountNameScreen';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

const mockedApi = api as jest.Mock;
const student = { id: 'u', email: 'ana@uts.edu.co', role: 'STUDENT', mustChangePassword: false };

const open = async () => {
  await render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
      <AccountNameScreen />
    </QueryClientProvider>,
  );
};
const field = (key: string) => screen.getByLabelText(i18n.t(key));
const type = async (key: string, value: string) => fireEvent.changeText(field(key), value);
const save = async () => fireEvent.press(screen.getByRole('button', { name: 'Guardar nombre' }));

beforeEach(async () => {
  jest.clearAllMocks();
  useSession.setState({
    status: 'signedIn',
    accessToken: 't',
    user: { ...student, firstName: 'Ana', lastName: 'Ruiz' } as never,
  });
  await i18n.changeLanguage('es');
});

describe('AccountNameScreen', () => {
  it('starts with the current name', async () => {
    await open();
    expect(field('account.name.firstName').props.value).toBe('Ana');
    expect(field('account.name.lastName').props.value).toBe('Ruiz');
  });

  it('saves a valid name, updates the session and goes back to the account with a confirmation', async () => {
    mockedApi.mockResolvedValue({ ...student, firstName: 'María José', lastName: 'Ruiz' });
    await open();
    await type('account.name.firstName', '  María José ');
    await save();
    await waitFor(() =>
      expect(mockedApi).toHaveBeenCalledWith('/students/me', {
        method: 'PATCH',
        body: { firstName: 'María José', lastName: 'Ruiz' },
      }),
    );
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith({
        pathname: '/(student)/account',
        params: { nameChanged: '1' },
      }),
    );
    expect(useSession.getState().user?.firstName).toBe('María José');
    expect(useSession.getState().status).toBe('signedIn');
  });

  it('sends nothing and goes back when the name did not change', async () => {
    await open();
    await save();
    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(mockedApi).not.toHaveBeenCalled();
  });

  it('shows a field error for an empty name and keeps what was typed', async () => {
    await open();
    await type('account.name.firstName', '   ');
    await type('account.name.lastName', 'Pérez');
    await save();
    await waitFor(() => expect(screen.getByText(i18n.t('validation.required'))).toBeTruthy());
    expect(field('account.name.lastName').props.value).toBe('Pérez');
    expect(mockedApi).not.toHaveBeenCalled();
  });

  it('shows a field error for a name over 100 characters', async () => {
    await open();
    await type('account.name.lastName', 'a'.repeat(101));
    await save();
    await waitFor(() => expect(screen.getByText(i18n.t('validation.tooLong'))).toBeTruthy());
    expect(mockedApi).not.toHaveBeenCalled();
  });

  it('shows the backend error in a banner and keeps what was typed', async () => {
    mockedApi.mockRejectedValue(new ApiError(400, 'VALIDATION_FAILED'));
    await open();
    await type('account.name.firstName', 'Luisa');
    await save();
    await waitFor(() => expect(screen.getByText(i18n.t('errors.VALIDATION_FAILED'))).toBeTruthy());
    expect(field('account.name.firstName').props.value).toBe('Luisa');
    expect(router.replace).not.toHaveBeenCalled();
  });
});
