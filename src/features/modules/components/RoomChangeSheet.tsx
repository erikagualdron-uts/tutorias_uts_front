import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { errorMessage } from '@/api/errors';
import type { ModuleDetail } from '@/api/types';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useRooms } from '@/features/rooms/hooks/useRooms';
import { useChangeRoom } from '../hooks/useModules';
import { PickerSheet } from './PickerSheet';

interface RoomChangeSheetProps {
  module: ModuleDetail;
  visible: boolean;
  onClose: () => void;
}

// Rooms that cannot hold the enrolled students are listed but disabled, with the rule that blocks
// them (docs/Design.md, "Module management"). The server enforces it as well.
export function RoomChangeSheet({ module, visible, onClose }: RoomChangeSheetProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [chosen, setChosen] = useState<string | null>(null);
  const rooms = useRooms({ search: visible ? search : '', status: 'ACTIVE' });
  const change = useChangeRoom(module.id);
  const target = rooms.data?.data.find((r) => r.id === chosen);

  const close = () => {
    setChosen(null);
    setSearch('');
    onClose();
  };

  return (
    <>
      <PickerSheet
        visible={visible && !target}
        title={t('modules.changeRoom.title')}
        search={{ label: t('modules.form.searchRoom'), value: search, onChange: setSearch }}
        options={(rooms.data?.data ?? []).map((room) => ({
          value: room.id,
          label: `${room.locationName} · ${room.name}`,
          hint:
            room.capacity < module.enrolled
              ? t('modules.changeRoom.insufficient', { enrolled: module.enrolled, capacity: room.capacity })
              : t('rooms.capacity', { count: room.capacity }),
          disabled: room.capacity < module.enrolled,
        }))}
        selected={module.room.id}
        loading={rooms.isPending}
        error={rooms.error || change.error ? errorMessage(t, rooms.error ?? change.error) : undefined}
        emptyText={t('modules.form.noRooms')}
        onClose={close}
        onSelect={(id) => (id === module.room.id ? close() : setChosen(id))}
      />
      {visible && target ? (
        <ConfirmDialog
          title={t('modules.changeRoom.confirmTitle')}
          message={[
            t('modules.changeRoom.confirmMessage', {
              room: `${target.locationName} · ${target.name}`,
              capacity: target.capacity,
            }),
            module.enrolled > 0 ? t('modules.notify', { count: module.enrolled }) : '',
          ]
            .filter(Boolean)
            .join(' ')}
          confirmLabel={t('modules.changeRoom.confirm')}
          confirmIcon="swapRoom"
          loading={change.isPending}
          onConfirm={() => change.mutate(target.id, { onSuccess: close, onError: () => setChosen(null) })}
          onCancel={() => setChosen(null)}
        />
      ) : null}
    </>
  );
}
