import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Linking } from 'react-native';
import { api } from '@/api/client';
import type { NotificationPage } from '@/api/types';
import i18n from '@/i18n';
import { useSession } from '@/store/session';
import { PushRegistration } from '../components/PushRegistration';
import { NotificationsScreen } from '../screens/NotificationsScreen';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));
// `__esModule` keeps the namespace live, so a test can switch `isDevice` after the module is loaded.
jest.mock('expo-device', () => ({ __esModule: true, isDevice: true }));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: 'project-1' } } } },
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: 'ExponentPushToken[device-token]' })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponse: jest.fn(() => null),
  clearLastNotificationResponse: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
}));

const device = jest.requireMock('expo-device') as { isDevice: boolean };
const mockedApi = api as jest.Mock;
const permissions = Notifications.getPermissionsAsync as jest.Mock;
const requestPermission = Notifications.requestPermissionsAsync as jest.Mock;
const seen = SecureStore.getItemAsync as jest.Mock;

const status = (value: 'granted' | 'undetermined' | 'denied') => ({ status: value, granted: value === 'granted' });
const emptyPage: NotificationPage = { data: [], meta: { page: 1, limit: 20, total: 0 } };

const wrap = (node: React.ReactElement, client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) => (
  <QueryClientProvider client={client}>{node}</QueryClientProvider>
);
const registered = () => mockedApi.mock.calls.filter(([path]) => path === '/notifications/devices');

beforeEach(async () => {
  jest.clearAllMocks();
  device.isDevice = true;
  seen.mockResolvedValue(null);
  permissions.mockResolvedValue(status('undetermined'));
  requestPermission.mockResolvedValue(status('granted'));
  mockedApi.mockImplementation((path: string) =>
    Promise.resolve(path === '/notifications/unread-count' ? { unread: 0 } : path.startsWith('/notifications?') ? emptyPage : {}),
  );
  useSession.setState({
    status: 'signedIn',
    accessToken: 't',
    user: { id: 'u', email: 's@uts.edu.co', role: 'STUDENT', mustChangePassword: false } as never,
  });
  await i18n.changeLanguage('es');
});

describe('push registration', () => {
  it('explains the permission first and registers the device once it is granted (scenario 1)', async () => {
    await render(wrap(<PushRegistration />));
    expect(await screen.findByText('Activa las notificaciones')).toBeTruthy();
    expect(requestPermission).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Activar notificaciones'));

    await waitFor(() => expect(registered()).toHaveLength(1));
    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(registered()[0][1]).toEqual({
      method: 'PUT',
      body: { token: 'ExponentPushToken[device-token]', platform: expect.stringMatching(/^(ANDROID|IOS)$/) },
    });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('push-prompt-seen', '1');
  });

  it('registers nothing when the user refuses, and does not insist (scenario 3)', async () => {
    requestPermission.mockResolvedValue(status('denied'));
    await render(wrap(<PushRegistration />));
    fireEvent.press(await screen.findByText('Activar notificaciones'));
    await waitFor(() => expect(requestPermission).toHaveBeenCalled());
    expect(registered()).toHaveLength(0);
    expect(screen.queryByText('Activa las notificaciones')).toBeNull();
  });

  it('lets the user postpone without asking the system and remembers it', async () => {
    await render(wrap(<PushRegistration />));
    fireEvent.press(await screen.findByText('Ahora no'));
    await waitFor(() => expect(SecureStore.setItemAsync).toHaveBeenCalledWith('push-prompt-seen', '1'));
    expect(requestPermission).not.toHaveBeenCalled();
    expect(screen.queryByText('Activa las notificaciones')).toBeNull();
  });

  it('does not explain again after it was seen', async () => {
    seen.mockResolvedValue('1');
    await render(wrap(<PushRegistration />));
    await waitFor(() => expect(permissions).toHaveBeenCalled());
    expect(screen.queryByText('Activa las notificaciones')).toBeNull();
    expect(registered()).toHaveLength(0);
  });

  it('registers the device silently when the permission is already granted', async () => {
    permissions.mockResolvedValue(status('granted'));
    await render(wrap(<PushRegistration />));
    await waitFor(() => expect(registered()).toHaveLength(1));
    expect(screen.queryByText('Activa las notificaciones')).toBeNull();
  });

  it('does nothing on a device without push, like a simulator', async () => {
    device.isDevice = false;
    await render(wrap(<PushRegistration />));
    await act(async () => undefined);
    expect(screen.queryByText('Activa las notificaciones')).toBeNull();
    expect(registered()).toHaveLength(0);
  });

  it('keeps going when the push token cannot be obtained', async () => {
    permissions.mockResolvedValue(status('granted'));
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    await render(wrap(<PushRegistration />));
    await waitFor(() => expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalled());
    expect(registered()).toHaveLength(0);
  });
});

describe('push received and tapped', () => {
  const responseFor = (data: object) => ({ notification: { request: { content: { data } } } });

  it('opens the module and marks the notice as read when a push is tapped (scenario 2)', async () => {
    permissions.mockResolvedValue(status('granted'));
    await render(wrap(<PushRegistration />));
    const tapped = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0];

    await act(async () => tapped(responseFor({ notificationId: 'n-1', moduleId: 'm-1' })));

    expect(router.push).toHaveBeenCalledWith({ pathname: '/(student)/modules/[id]', params: { id: 'm-1' } });
    expect(mockedApi).toHaveBeenCalledWith('/notifications/n-1/read', { method: 'POST' });
  });

  it('opens the PQRS when the tapped push is about a PQRS', async () => {
    permissions.mockResolvedValue(status('granted'));
    await render(wrap(<PushRegistration />));
    const tapped = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0];

    await act(async () => tapped(responseFor({ notificationId: 'n-3', pqrsId: 'p-1' })));

    expect(router.push).toHaveBeenCalledWith({ pathname: '/(student)/pqrs/[id]', params: { id: 'p-1' } });
    expect(mockedApi).toHaveBeenCalledWith('/notifications/n-3/read', { method: 'POST' });
  });

  it('opens the conversation when the tapped push is about a chat', async () => {
    permissions.mockResolvedValue(status('granted'));
    await render(wrap(<PushRegistration />));
    const tapped = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0];

    await act(async () => tapped(responseFor({ conversationId: 'c-1' })));

    expect(router.push).toHaveBeenCalledWith({ pathname: '/(student)/messages/[id]', params: { id: 'c-1' } });
  });

  it('opens the module of the push that started the app', async () => {
    permissions.mockResolvedValue(status('granted'));
    (Notifications.getLastNotificationResponse as jest.Mock).mockReturnValue(responseFor({ notificationId: 'n-2', moduleId: 'm-2' }));
    await render(wrap(<PushRegistration />));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/(student)/modules/[id]', params: { id: 'm-2' } });
    expect(Notifications.clearLastNotificationResponse).toHaveBeenCalled();
  });

  it('refreshes the inbox and the counter when a push arrives with the app open', async () => {
    permissions.mockResolvedValue(status('granted'));
    const client = new QueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    await render(wrap(<PushRegistration />, client));
    const received = (Notifications.addNotificationReceivedListener as jest.Mock).mock.calls[0][0];
    await act(async () => received({}));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['notifications'] });
  });
});

describe('enabling push from the inbox', () => {
  it('offers to enable it and asks the system when it was never asked', async () => {
    await render(wrap(<NotificationsScreen />));
    fireEvent.press(await screen.findByText('Activar notificaciones'));
    await waitFor(() => expect(requestPermission).toHaveBeenCalled());
  });

  it('sends the user to the phone settings when it was denied', async () => {
    permissions.mockResolvedValue(status('denied'));
    const open = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    await render(wrap(<NotificationsScreen />));
    expect(await screen.findByText(/desactivadas/)).toBeTruthy();
    fireEvent.press(screen.getByText('Activar notificaciones'));
    await waitFor(() => expect(open).toHaveBeenCalled());
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it('shows nothing about push when it is already on', async () => {
    permissions.mockResolvedValue(status('granted'));
    await render(wrap(<NotificationsScreen />));
    await screen.findByText('No tienes notificaciones');
    expect(screen.queryByText('Activar notificaciones')).toBeNull();
  });
});
