import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { usePushRegistration } from '../hooks/usePushRegistration';

// Mounted once for the signed-in user: registers the device and, the first time, explains why the
// phone will ask for the notifications permission (FR-014) before the system dialog appears.
export function PushRegistration() {
  const { t } = useTranslation();
  const { promptVisible, accept, dismiss } = usePushRegistration();
  if (!promptVisible) return null;
  return (
    <ConfirmDialog
      title={t('notifications.push.title')}
      message={t('notifications.push.description')}
      confirmLabel={t('notifications.push.enable')}
      confirmIcon="notifications"
      cancelLabel={t('notifications.push.later')}
      onConfirm={() => void accept()}
      onCancel={() => void dismiss()}
    />
  );
}
