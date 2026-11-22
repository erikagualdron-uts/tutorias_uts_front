import { useTranslation } from 'react-i18next';
import { Banner } from '@/components/Banner';
import { useChatConnection } from '../socket';

// "Reconnecting…" while the chat socket is down; lost messages are asked again when it comes back.
export function ReconnectBanner() {
  const { t } = useTranslation();
  const connected = useChatConnection((s) => s.connected);
  return connected ? null : <Banner message={t('chat.reconnecting')} severity="warning" />;
}
