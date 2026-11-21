import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { enablePush, pushPermission, type PushPermission } from '../push';

// The permission of the phone for the inbox banner. It is read again when the app comes back, since
// the user may have changed it in the phone settings.
export function usePushPermission() {
  const [state, setState] = useState<PushPermission>('unavailable');

  useEffect(() => {
    let alive = true;
    const read = () =>
      pushPermission().then((next) => {
        if (alive) setState(next);
      });
    void read();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void read();
    });
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);

  const enable = useCallback(async () => {
    await enablePush();
    setState(await pushPermission());
  }, []);

  return { state, enable };
}
