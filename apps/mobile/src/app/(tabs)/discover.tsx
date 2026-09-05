import { Ionicons } from '@expo/vector-icons';
import { INTERESTS, LANGUAGES, LOOKING_FOR } from '@wmc/shared';
import { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PersonCard } from '@/components/cards/PersonCard';
import { Button, CardSkeleton, Chip, EmptyState, Input, Screen, Text } from '@/components/ui';
import { EMPTY_FILTERS, useDiscoverPeople, type DiscoverFilters } from '@/lib/queries';
import { theme } from '@/theme';

const DISTANCES: { label: string; km: number | null }[] = [
  { label: 'Any', km: null },
  { label: '2 km', km: 2 },
  { label: '5 km', km: 5 },
  { label: '10 km', km: 10 },
];

export default function DiscoverScreen() {
  const [filters, setFilters] = useState<DiscoverFilters>(EMPTY_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const people = useDiscoverPeople(filters);
  const activeCount = Object.values(filters).filter((v) => v != null).length;

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text variant="h1">Meet people</Text>
          <Text variant="small" tone="secondary">
            Muslims near you who share your interests.
          </Text>
        </View>
        <Pressable onPress={() => setSheetOpen(true)} style={styles.filterButton} hitSlop={6}>
          <Ionicons name="options-outline" size={22} color={theme.colors.primary} />
          {activeCount > 0 ? (
            <View style={styles.filterCount}>
              <Text variant="caption" tone="inverse" style={styles.filterCountText}>
                {activeCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <FlatList
        data={people.data ?? []}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PersonCard person={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        refreshing={people.isRefetching}
        onRefresh={() => people.refetch()}
        ListEmptyComponent={
          people.isLoading ? (
            <CardSkeleton count={4} />
          ) : (
            <EmptyState
              emoji="👋"
              title="No one matches yet"
              message={activeCount > 0 ? 'Try loosening your filters.' : 'More people join every day. Check back soon!'}
              actionLabel={activeCount > 0 ? 'Clear filters' : undefined}
              onAction={() => setFilters(EMPTY_FILTERS)}
            />
          )
        }
      />

      <FilterSheet visible={sheetOpen} filters={filters} onClose={() => setSheetOpen(false)} onApply={(f) => { setFilters(f); setSheetOpen(false); }} />
    </Screen>
  );
}

function FilterSheet({ visible, filters, onClose, onApply }: { visible: boolean; filters: DiscoverFilters; onClose: () => void; onApply: (f: DiscoverFilters) => void }) {
  const [draft, setDraft] = useState<DiscoverFilters>(filters);
  const set = <K extends keyof DiscoverFilters>(key: K, value: DiscoverFilters[K]) => setDraft({ ...draft, [key]: value });
  const toggle = (key: 'interest' | 'language' | 'lookingFor', value: string) => set(key, draft[key] === value ? null : value);
  const numberOrNull = (t: string) => (t.trim() === '' ? null : Number(t.replace(/[^0-9]/g, '')) || null);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} onShow={() => setDraft(filters)}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <Text variant="h2">Filters</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={26} color={theme.colors.text} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
          <Text variant="label" tone="secondary">Interest</Text>
          <View style={styles.chips}>
            {INTERESTS.map((i) => (
              <Chip key={i.slug} label={i.name} emoji={i.emoji} size="sm" selected={draft.interest === i.slug} onPress={() => toggle('interest', i.slug)} />
            ))}
          </View>
          <Text variant="label" tone="secondary">Language</Text>
          <View style={styles.chips}>
            {LANGUAGES.map((l) => (
              <Chip key={l.code} label={l.name} size="sm" selected={draft.language === l.code} onPress={() => toggle('language', l.code)} />
            ))}
          </View>
          <Text variant="label" tone="secondary">Looking for</Text>
          <View style={styles.chips}>
            {LOOKING_FOR.map((l) => (
              <Chip key={l.slug} label={l.name} emoji={l.emoji} size="sm" selected={draft.lookingFor === l.slug} onPress={() => toggle('lookingFor', l.slug)} />
            ))}
          </View>
          <Text variant="label" tone="secondary">Age range</Text>
          <View style={styles.ageRow}>
            <View style={styles.flex}>
              <Input placeholder="Min" keyboardType="number-pad" value={draft.minAge?.toString() ?? ''} onChangeText={(t) => set('minAge', numberOrNull(t))} />
            </View>
            <Text tone="muted">to</Text>
            <View style={styles.flex}>
              <Input placeholder="Max" keyboardType="number-pad" value={draft.maxAge?.toString() ?? ''} onChangeText={(t) => set('maxAge', numberOrNull(t))} />
            </View>
          </View>
          <Text variant="label" tone="secondary">Max distance</Text>
          <View style={styles.chips}>
            {DISTANCES.map((d) => (
              <Chip key={d.label} label={d.label} size="sm" selected={draft.maxKm === d.km} onPress={() => set('maxKm', d.km)} />
            ))}
          </View>
          <Text variant="caption" tone="muted">
            Distance filters only apply to people who share an approximate location.
          </Text>
        </ScrollView>
        <View style={styles.sheetFooter}>
          <Button title="Reset" variant="ghost" onPress={() => setDraft(EMPTY_FILTERS)} />
          <Button title="Show people" style={styles.flex} onPress={() => onApply(draft)} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: theme.spacing.lg, paddingTop: 8, paddingBottom: 12 },
  flex: { flex: 1 },
  filterButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
  filterCount: { position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  filterCountText: { fontSize: 10, fontWeight: '700', lineHeight: 12 },
  list: { paddingHorizontal: theme.spacing.lg, paddingBottom: 32, flexGrow: 1 },
  gap: { height: 12 },
  sheet: { flex: 1, backgroundColor: theme.colors.background },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.lg, paddingVertical: 16 },
  sheetBody: { paddingHorizontal: theme.spacing.lg, gap: 12, paddingBottom: 24 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  ageRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  sheetFooter: { flexDirection: 'row', gap: 12, paddingHorizontal: theme.spacing.lg, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
});
