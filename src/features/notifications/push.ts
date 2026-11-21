import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Linking, Platform } from 'react-native';
import { api } from '@/api/client';
import i18n from '@/i18n';

export type PushPermission = 'granted' | 'undetermined' | 'denied' | 'unavailable';

// A notice that arrives with the app open is shown like any other, without sound (D-099).
export function configurePushHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

// Simulators and emulators have no push token: nothing to ask for there.
export async function pushPermission(): Promise<PushPermission> {
  if (!Device.isDevice) return 'unavailable';
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted' ? 'granted' : status === 'undetermined' ? 'undetermined' : 'denied';
}

export async function requestPushPermission(): Promise<boolean> {
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
}

// Registers this device for push (FR-014). Idempotent on the server, so it runs at every start.
// A device without a token (no network, no EAS project in development) simply stays without push:
// the notice still reaches the inbox and the email (FR-017).
export async function registerDevice(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: i18n.t('notifications.channel'),
        importance: AndroidImportance.DEFAULT,
      });
    }
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    await api<void>('/notifications/devices', {
      method: 'PUT',
      body: { token: data, platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID' },
    });
  } catch {
    // Nothing to show: push is an extra channel.
  }
}

// From the inbox: ask for the permission if it can still be asked, otherwise open the phone settings.
export async function enablePush(): Promise<void> {
  const state = await pushPermission();
  if (state === 'undetermined') {
    if (await requestPushPermission()) await registerDevice();
  } else if (state === 'denied') {
    await Linking.openSettings();
  }
}
