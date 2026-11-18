import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { errorMessage } from '@/api/errors';
import type { ModuleDetail } from '@/api/types';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useChangeTeacher } from '../hooks/useModules';
import { useTeachers } from '../hooks/useTeachers';
import { PickerSheet } from './PickerSheet';

interface TeacherChangeSheetProps {
  module: ModuleDetail;
  visible: boolean;
  onClose: () => void;
}

// Only active teachers are offered; the server also checks that the new one is free at the slots.
export function TeacherChangeSheet({ module, visible, onClose }: TeacherChangeSheetProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [chosen, setChosen] = useState<string | null>(null);
  const teachers = useTeachers(search, visible);
  const change = useChangeTeacher(module.id);
  const target = teachers.data?.data.find((x) => x.id === chosen);

  const close = () => {
    setChosen(null);
    setSearch('');
    onClose();
  };

  return (
    <>
      <PickerSheet
        visible={visible && !target}
        title={t('modules.changeTeacher.title')}
        search={{ label: t('modules.form.searchTeacher'), value: search, onChange: setSearch }}
        options={(teachers.data?.data ?? []).map((x) => ({ value: x.id, label: `${x.firstName} ${x.lastName}` }))}
        selected={module.teacher.id}
        loading={teachers.isPending}
        error={teachers.error || change.error ? errorMessage(t, teachers.error ?? change.error) : undefined}
        emptyText={t('modules.form.noTeachers')}
        onClose={close}
        onSelect={(id) => (id === module.teacher.id ? close() : setChosen(id))}
      />
      {visible && target ? (
        <ConfirmDialog
          title={t('modules.changeTeacher.confirmTitle')}
          message={[
            t('modules.changeTeacher.confirmMessage', { teacher: `${target.firstName} ${target.lastName}` }),
            module.enrolled > 0 ? t('modules.notify', { count: module.enrolled }) : '',
          ]
            .filter(Boolean)
            .join(' ')}
          confirmLabel={t('modules.changeTeacher.confirm')}
          confirmIcon="swapTeacher"
          loading={change.isPending}
          onConfirm={() => change.mutate(target.id, { onSuccess: close, onError: () => setChosen(null) })}
          onCancel={() => setChosen(null)}
        />
      ) : null}
    </>
  );
}
