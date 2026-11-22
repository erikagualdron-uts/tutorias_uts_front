import { useTranslation } from 'react-i18next';
import { Banner } from '@/components/Banner';
import type { ReadOnlyReason } from '../types';

// The rule that blocks writing, in words (docs/Design.md: a blocked action always says why).
export function ReadOnlyNotice({ reason }: { reason: ReadOnlyReason | null }) {
  const { t } = useTranslation();
  return <Banner message={reason ? t(`chat.readOnly.${reason}`) : t('errors.CHAT_READ_ONLY')} severity="info" />;
}
