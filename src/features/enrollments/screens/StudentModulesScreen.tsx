import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { FilterChips } from '@/components/FilterChips';
import { SearchField } from '@/components/SearchField';
import { ScreenHeader } from '@/components/ScreenHeader';
import { spacing, usePalette } from '@/theme';
import { OfferCard } from '../components/OfferCard';
import { useStudentModules } from '../hooks/useStudentModules';
import { MyEnrollmentsScreen } from './MyEnrollmentsScreen';

type Segment = 'available' | 'mine';

// The student "Tutoring" tab: what can be taken this period and what the student already takes.
export function StudentModulesScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const [segment, setSegment] = useState<Segment>('available');
  const [search, setSearch] = useState('');
  const offer = useStudentModules(search);
  const filtered = search.trim().length > 0;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader title={t('student.modules.title')} count={segment === 'available' ? offer.data?.data.length : undefined} />
        <FilterChips<Segment>
          options={[
            { value: 'available', label: t('student.modules.segments.available') },
            { value: 'mine', label: t('student.modules.segments.mine') },
          ]}
          value={segment}
          onChange={(value) => setSegment(value ?? 'available')}
        />
        {segment === 'mine' ? (
          <MyEnrollmentsScreen onBrowse={() => setSegment('available')} />
        ) : (
          <>
            <SearchField
              label={t('student.modules.search')}
              onCard={false}
              value={search}
              onChangeText={setSearch}
              onClear={() => setSearch('')}
            />
            {offer.isPending ? (
              <BrandLoader />
            ) : offer.isError ? (
              <EmptyState
                title={t('student.modules.loadError')}
                description={errorMessage(t, offer.error)}
                action={<Button label={t('common.tryAgain')} icon="restart" variant="tonal" onPress={() => offer.refetch()} />}
              />
            ) : offer.data.data.length === 0 ? (
              <EmptyState
                title={t(filtered ? 'student.modules.emptyFiltered.title' : 'student.modules.empty.title')}
                description={t(filtered ? 'student.modules.emptyFiltered.description' : 'student.modules.empty.description')}
              />
            ) : (
              offer.data.data.map((module) => (
                <OfferCard
                  key={module.id}
                  module={module}
                  onPress={() => router.push({ pathname: '/modules/[id]', params: { id: module.id } })}
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
});
