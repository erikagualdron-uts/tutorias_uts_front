import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { SearchField } from '@/components/SearchField';
import { SelectField } from '@/components/SelectField';
import { usePeriods } from '@/features/periods/hooks/usePeriods';
import { useRooms } from '@/features/rooms/hooks/useRooms';
import { spacing, typography, usePalette } from '@/theme';
import { ModuleCard } from '../components/ModuleCard';
import { PickerSheet, type PickerOption } from '../components/PickerSheet';
import { useModuleList } from '../hooks/useModules';
import { useTeachers } from '../hooks/useTeachers';

type Sheet = 'period' | 'teacher' | 'room' | null;
const ALL = 'all';

// The CAE "Modules" tab: modules of one period with search and teacher and room filters. Rooms and
// locations (spec 006) are one button away.
export function ModulesScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const [periodId, setPeriodId] = useState<string>();
  const [teacherId, setTeacherId] = useState<string>();
  const [roomId, setRoomId] = useState<string>();
  const [search, setSearch] = useState('');
  const [sheet, setSheet] = useState<Sheet>(null);

  const modules = useModuleList({ periodId, search, teacherId, roomId });
  const periods = usePeriods();
  const teachers = useTeachers('', sheet === 'teacher');
  const rooms = useRooms({ search: '', status: 'ACTIVE' });
  const shownPeriod = periods.data?.data.find((p) => p.id === (periodId ?? modules.data?.meta.periodId));
  const filtered = !!(search.trim() || teacherId || roomId);

  const all: PickerOption = { value: ALL, label: t('modules.filter.all') };
  const pick = (set: (id?: string) => void) => (id: string) => {
    set(id === ALL ? undefined : id);
    setSheet(null);
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>{t('modules.title')}</Text>
        <SelectField
          label={t('modules.form.period')}
          leadingIcon="dateRange"
          onCard={false}
          placeholder={t('modules.form.periodPlaceholder')}
          value={shownPeriod ? `${shownPeriod.name} · ${t(`periods.status.${shownPeriod.status}`)}` : undefined}
          onPress={() => setSheet('period')}
        />
        <SearchField
          label={t('modules.search')}
          onCard={false}
          value={search}
          onChangeText={setSearch}
          onClear={() => setSearch('')}
        />
        <SelectField
          label={t('modules.form.teacher')}
          leadingIcon="teacher"
          onCard={false}
          placeholder={t('modules.filter.all')}
          value={teachers.data?.data.find((x) => x.id === teacherId)?.lastName ?? (teacherId ? '…' : undefined)}
          onPress={() => setSheet('teacher')}
        />
        <SelectField
          label={t('modules.form.room')}
          leadingIcon="building"
          onCard={false}
          placeholder={t('modules.filter.all')}
          value={rooms.data?.data.find((x) => x.id === roomId)?.name}
          onPress={() => setSheet('room')}
        />

        {modules.isPending ? (
          <BrandLoader />
        ) : modules.isError ? (
          <EmptyState
            title={t('modules.loadError')}
            description={errorMessage(t, modules.error)}
            action={<Button label={t('common.tryAgain')} icon="restart" variant="tonal" onPress={() => modules.refetch()} />}
          />
        ) : modules.data.data.length === 0 ? (
          <EmptyState
            title={t(filtered ? 'modules.emptyFiltered.title' : 'modules.empty.title')}
            description={t(filtered ? 'modules.emptyFiltered.description' : 'modules.empty.description')}
          />
        ) : (
          modules.data.data.map((module) => <ModuleCard key={module.id} module={module} />)
        )}

        {shownPeriod?.status === 'CLOSED' ? null : (
          <Button label={t('modules.create')} icon="add" onPress={() => router.push('/modules/module-form')} />
        )}
        <Button label={t('modules.roomsLink')} icon="building" variant="tonal" onPress={() => router.push('/modules/rooms')} />
      </ScrollView>

      <PickerSheet
        visible={sheet === 'period'}
        title={t('modules.form.period')}
        options={(periods.data?.data ?? []).map((p) => ({
          value: p.id,
          label: p.name,
          hint: t(`periods.status.${p.status}`),
        }))}
        selected={periodId ?? modules.data?.meta.periodId ?? undefined}
        loading={periods.isPending}
        emptyText={t('modules.form.noPeriods')}
        onClose={() => setSheet(null)}
        onSelect={(id) => {
          setPeriodId(id);
          setSheet(null);
        }}
      />
      <PickerSheet
        visible={sheet === 'teacher'}
        title={t('modules.form.teacher')}
        options={[all, ...(teachers.data?.data ?? []).map((x) => ({ value: x.id, label: `${x.firstName} ${x.lastName}` }))]}
        selected={teacherId ?? ALL}
        loading={teachers.isPending}
        emptyText={t('modules.form.noTeachers')}
        onClose={() => setSheet(null)}
        onSelect={pick(setTeacherId)}
      />
      <PickerSheet
        visible={sheet === 'room'}
        title={t('modules.form.room')}
        options={[all, ...(rooms.data?.data ?? []).map((x) => ({ value: x.id, label: `${x.locationName} · ${x.name}` }))]}
        selected={roomId ?? ALL}
        loading={rooms.isPending}
        emptyText={t('modules.form.noRooms')}
        onClose={() => setSheet(null)}
        onSelect={pick(setRoomId)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
});
