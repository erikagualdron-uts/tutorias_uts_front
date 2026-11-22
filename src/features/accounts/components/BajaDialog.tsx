import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { AccountKind } from '../hooks/useAccountList';

interface BajaDialogProps {
  kind: AccountKind;
  action: 'deactivate' | 'delete';
  // Modules (teacher) or enrollments (student) the closure affects, from the detail just asked for.
  count: number;
  loading: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Confirmation that states the effect in numbers before anything happens (FR-006).
export function BajaDialog({
  kind,
  action,
  count,
  loading,
  error,
  onConfirm,
  onCancel,
}: BajaDialogProps) {
  const { t } = useTranslation();
  const effect =
    count === 0
      ? t(`accounts.baja.noEffect.${kind}`)
      : t(`accounts.baja.${kind}`, { count });
  const message =
    action === 'delete'
      ? `${effect}\n${t('accounts.baja.deleteWarning')}`
      : effect;
  return (
    <ConfirmDialog
      title={t(`accounts.baja.title.${action}`)}
      message={error ? `${message}\n${error}` : message}
      confirmLabel={t(`accounts.actions.${action}`)}
      confirmIcon={action === 'delete' ? 'trash' : 'power'}
      variant={action === 'delete' ? 'destructive' : 'warning'}
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
