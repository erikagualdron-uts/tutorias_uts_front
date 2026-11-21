import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { SmtpSettings, SmtpTestResult } from '@/api/types';
import i18n from '@/i18n';
import { SmtpSettingsScreen } from '../screens/SmtpSettingsScreen';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));

const mockedApi = api as jest.Mock;

const none: SmtpSettings = { status: 'NOT_CONFIGURED', usingEnvironment: false, host: null, port: null, user: null, from: null, hasPassword: false };
const saved: SmtpSettings = {
  status: 'CONFIGURED',
  usingEnvironment: false,
  host: 'smtp.uts.edu.co',
  port: 587,
  user: 'cae',
  from: 'cae@uts.edu.co',
  hasPassword: true,
};

let current: SmtpSettings;
let testResult: () => Promise<SmtpTestResult>;

const renderScreen = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SmtpSettingsScreen />
    </QueryClientProvider>,
  );
const call = (path: string) => mockedApi.mock.calls.find(([p]) => p === path);
const fill = async (label: string, value: string) => fireEvent.changeText(await screen.findByLabelText(label), value);

beforeEach(async () => {
  jest.clearAllMocks();
  current = saved;
  testResult = () => Promise.resolve({ ok: true, cause: null });
  mockedApi.mockImplementation((path: string, options?: { method?: string; body?: Record<string, unknown> }) => {
    if (path === '/settings/smtp/test') return testResult();
    if (path === '/settings/smtp' && options?.method === 'PUT') {
      const { password: _omit, port, ...rest } = options.body as Record<string, unknown> & { port: number };
      current = { ...current, ...(rest as Partial<SmtpSettings>), port, status: 'CONFIGURED', usingEnvironment: false, hasPassword: true };
      return Promise.resolve(current);
    }
    return Promise.resolve(current);
  });
  await i18n.changeLanguage('es');
});

describe('mail settings', () => {
  it('says the server is not configured (scenario 1)', async () => {
    current = none;
    await renderScreen();
    expect(await screen.findByText('Sin configurar')).toBeTruthy();
  });

  it('warns that the environment settings are in use until the CAE saves (scenario 1)', async () => {
    current = { ...none, status: 'CONFIGURED', usingEnvironment: true, host: 'localhost', port: 1025, from: 'no-reply@uts.edu.co' };
    await renderScreen();
    expect(await screen.findByText(/configuración del servidor de la app/)).toBeTruthy();
    expect(screen.getByDisplayValue('localhost')).toBeTruthy();
  });

  it('shows the saved server, port, user and sender, with the password hidden (scenario 3)', async () => {
    await renderScreen();
    expect(await screen.findByText('Configurado')).toBeTruthy();
    expect(screen.getByDisplayValue('smtp.uts.edu.co')).toBeTruthy();
    expect(screen.getByDisplayValue('587')).toBeTruthy();
    expect(screen.getByDisplayValue('cae')).toBeTruthy();
    expect(screen.getByDisplayValue('cae@uts.edu.co')).toBeTruthy();
    expect(screen.getByLabelText('Clave').props.value).toBe('');
    expect(screen.getByPlaceholderText('Déjala vacía para conservar la actual.')).toBeTruthy();
  });

  it('blocks a save with invalid data and says what to fix (scenario 6)', async () => {
    current = none;
    await renderScreen();
    await fill('Servidor', 'smtp.uts.edu.co');
    await fill('Puerto', '70000');
    await fill('Usuario', 'cae');
    await fill('Clave', 'secreta');
    await fill('Remitente', 'no-es-correo');
    await fireEvent.press(screen.getByText('Guardar'));
    expect(await screen.findByText('El puerto debe ser un número entre 1 y 65535.')).toBeTruthy();
    expect(screen.getByText('Escribe un correo válido.')).toBeTruthy();
    expect(mockedApi.mock.calls.some(([, o]) => o?.method === 'PUT')).toBe(false);
  });

  it('rejects empty fields and a port that is not a number (scenario 6)', async () => {
    current = none;
    await renderScreen();
    await fill('Puerto', 'abc');
    await fireEvent.press(await screen.findByText('Guardar'));
    expect(await screen.findByText('El puerto debe ser un número entre 1 y 65535.')).toBeTruthy();
    expect(screen.getAllByText('Este campo es obligatorio.').length).toBeGreaterThanOrEqual(3);
    expect(mockedApi.mock.calls.some(([, o]) => o?.method === 'PUT')).toBe(false);
  });

  it('requires the password when nothing is saved yet', async () => {
    current = none;
    await renderScreen();
    await fill('Servidor', 'smtp.uts.edu.co');
    await fill('Puerto', '587');
    await fill('Usuario', 'cae');
    await fill('Remitente', 'cae@uts.edu.co');
    await fireEvent.press(screen.getByText('Guardar'));
    expect(await screen.findByText('Este campo es obligatorio.')).toBeTruthy();
    expect(mockedApi.mock.calls.some(([, o]) => o?.method === 'PUT')).toBe(false);
  });

  it('saves valid data with the port as a number and then shows "Configurado" (scenario 2)', async () => {
    current = none;
    await renderScreen();
    await fill('Servidor', 'smtp.uts.edu.co');
    await fill('Puerto', '587');
    await fill('Usuario', 'cae');
    await fill('Clave', 'secreta');
    await fill('Remitente', 'cae@uts.edu.co');
    await fireEvent.press(screen.getByText('Guardar'));
    await waitFor(() => expect(mockedApi.mock.calls.some(([, o]) => o?.method === 'PUT')).toBe(true));
    const put = mockedApi.mock.calls.find(([, o]) => o?.method === 'PUT');
    expect(put?.[1].body).toEqual({ host: 'smtp.uts.edu.co', port: 587, user: 'cae', from: 'cae@uts.edu.co', password: 'secreta' });
    expect(await screen.findByText('Configuración guardada.')).toBeTruthy();
    expect(await screen.findByText('Configurado')).toBeTruthy();
  });

  it('keeps the saved password when it is left empty: the body has no password (scenario 4)', async () => {
    await renderScreen();
    await fill('Servidor', 'otro.uts.edu.co');
    await fireEvent.press(await screen.findByText('Guardar'));
    await waitFor(() => expect(mockedApi.mock.calls.some(([, o]) => o?.method === 'PUT')).toBe(true));
    const put = mockedApi.mock.calls.find(([, o]) => o?.method === 'PUT');
    expect(put?.[1].body).toEqual({ host: 'otro.uts.edu.co', port: 587, user: 'cae', from: 'cae@uts.edu.co' });
    expect(put?.[1].body).not.toHaveProperty('password');
  });

  it('asks to write the password again when the saved one cannot be read', async () => {
    current = { ...saved, status: 'NEEDS_RECONFIGURATION' };
    await renderScreen();
    expect(await screen.findByText('Requiere configurar de nuevo')).toBeTruthy();
    expect(screen.getByText(/No se puede leer la clave guardada/)).toBeTruthy();
    await fireEvent.press(screen.getByText('Guardar'));
    expect(await screen.findByText('Este campo es obligatorio.')).toBeTruthy();
    expect(mockedApi.mock.calls.some(([, o]) => o?.method === 'PUT')).toBe(false);
  });

  it('shows the error of the server when saving fails', async () => {
    mockedApi.mockImplementation((path: string, options?: { method?: string }) =>
      options?.method === 'PUT' ? Promise.reject(new ApiError(422, 'SMTP_PASSWORD_REQUIRED')) : Promise.resolve(current),
    );
    await renderScreen();
    await fill('Servidor', 'otro.uts.edu.co');
    await fireEvent.press(await screen.findByText('Guardar'));
    expect(await screen.findByText('Escribe la clave del servidor de correo.')).toBeTruthy();
  });

  describe('test email', () => {
    it('sends it and says it worked (scenario 5)', async () => {
      await renderScreen();
      await fireEvent.press(await screen.findByText('Enviar correo de prueba'));
      expect(await screen.findByText('El correo de prueba se envió a tu correo.')).toBeTruthy();
      expect(mockedApi).toHaveBeenCalledWith('/settings/smtp/test', { method: 'POST' });
    });

    it.each([
      ['AUTH_FAILED', 'Usuario o clave incorrectos.'],
      ['CONNECTION_FAILED', 'No se pudo conectar con el servidor. Revisa el servidor y el puerto.'],
      ['TIMEOUT', 'El servidor tardó demasiado en responder.'],
      ['SENDER_REJECTED', 'El servidor rechazó el remitente.'],
      ['UNKNOWN', 'No se pudo enviar el correo.'],
    ] as const)('explains the failure %s in plain words, with no technical text (scenario 5)', async (cause, reason) => {
      testResult = () => Promise.resolve({ ok: false, cause });
      await renderScreen();
      await fireEvent.press(await screen.findByText('Enviar correo de prueba'));
      expect(await screen.findByText(`La prueba falló. ${reason}`)).toBeTruthy();
    });

    it('shows the rule that blocks the test when there is nothing saved', async () => {
      current = none;
      await renderScreen();
      expect(await screen.findByText('Guarda la configuración para poder probarla.')).toBeTruthy();
      await fireEvent.press(screen.getByText('Enviar correo de prueba'));
      expect(call('/settings/smtp/test')).toBeUndefined();
    });

    it('shows the error when the test request itself fails', async () => {
      testResult = () => Promise.reject(new ApiError(409, 'SMTP_NOT_CONFIGURED'));
      await renderScreen();
      await fireEvent.press(await screen.findByText('Enviar correo de prueba'));
      expect(await screen.findByText('El correo aún no está configurado. Guarda primero los datos del servidor.')).toBeTruthy();
    });
  });

  it('shows the error with a retry when the settings do not load', async () => {
    mockedApi.mockImplementation(() => Promise.reject(new ApiError(0, 'NETWORK')));
    await renderScreen();
    expect(await screen.findByText('No pudimos cargar la configuración del correo')).toBeTruthy();
    mockedApi.mockImplementation(() => Promise.resolve(saved));
    await fireEvent.press(screen.getByText('Intentar de nuevo'));
    expect(await screen.findByText('Configurado')).toBeTruthy();
  });

  it('writes the texts in English when the device is in English', async () => {
    await i18n.changeLanguage('en');
    current = none;
    await renderScreen();
    expect(await screen.findByText('Not configured')).toBeTruthy();
    expect(screen.getByText('Save the settings to be able to test them.')).toBeTruthy();
  });
});
