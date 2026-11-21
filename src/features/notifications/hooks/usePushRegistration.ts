import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/api/client';
import { useSession } from '@/store/session';
import { targetFor } from '../openTarget';
import { configurePushHandler, pushPermission, registerDevice, requestPushPermission } from '../push';

const SEEN_KEY = 'push-prompt-seen';

const promptSeen = async () => (await SecureStore.getItemAsync(SEEN_KEY)) !== null;
const markPromptSeen = () => SecureStore.setItemAsync(SEEN_KEY, '1');

interface PushData {
  notificationId?: string;
  moduleId?: string;
}

// Push for the signed-in user (FR-014): registers the device when the permission is already given,
// explains and asks once when it is not, keeps the counter fresh when a push arrives with the app
// open, and opens the module when one is tapped, also when it started the app.
export function usePushRegistration() {
  const role = useSession((state) => state.user?.role);
  const client = useQueryClient();
  const [promptVisible, setPromptVisible] = useState(false);

  useEffect(() => {
    configurePushHandler();
  }, []);

  useEffect(() => {
    if (!role) return;
    let alive = true;
    void (async () => {
      const state = await pushPermission();
      if (!alive) return;
      if (state === 'granted') void registerDevice();
      else if (state === 'undetermined' && !(await promptSeen())) setPromptVisible(true);
    })();
    return () => {
      alive = false;
    };
  }, [role]);

  useEffect(() => {
    if (!role) return;
    const refresh = () => client.invalidateQueries({ queryKey: ['notifications'] });
    const open = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as PushData;
      if (data.notificationId) {
        void api(`/notifications/${data.notificationId}/read`, { method: 'POST' })
          .then(refresh)
          .catch(() => undefined);
      }
      if (data.moduleId) router.push(targetFor(role, data.moduleId));
      Notifications.clearLastNotificationResponse();
    };
    const received = Notifications.addNotificationReceivedListener(() => void refresh());
    const tapped = Notifications.addNotificationResponseReceivedListener(open);
    const initial = Notifications.getLastNotificationResponse();
    if (initial) open(initial);
    return () => {
      received.remove();
      tapped.remove();
    };
  }, [role, client]);

  const accept = useCallback(async () => {
    setPromptVisible(false);
    await markPromptSeen();
    if (await requestPushPermission()) await registerDevice();
  }, []);

  const dismiss = useCallback(async () => {
    setPromptVisible(false);
    await markPromptSeen();
  }, []);

  return { promptVisible, accept, dismiss };
}
