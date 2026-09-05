import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { EventCard } from '@/components/cards/EventCard';
import { CardSkeleton, EmptyState, Screen, Text, useToast } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useJoinEvent, useMyEvents, useMyParticipation, useUpcomingEvents } from '@/lib/queries';
import { errorMessage } from '@/lib/supabase';
import { theme } from '@/theme';

type Segment = 'upcoming' | 'mine';

export default function EventsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { profile } = useAuth();
  const [segment, setSegment] = useState<Segment>('upcoming');
  const upcoming = useUpcomingEvents(profile?.city_id ?? null, 50);
  const mine = useMyEvents();
  const participation = useMyParticipation();
  const join = useJoinEvent();
  const active = segment === 'upcoming' ? upcoming : mine;

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.header}>
        <Text variant="h1">Events</Text>
        <View style={styles.segments}>
          {(['upcoming', 'mine'] as const).map((s) => (
            <Pressable key={s} onPress={() => setSegment(s)} style={[styles.segment, segment === s && styles.segmentActive]}>
              <Text variant="label" style={segment === s ? styles.segmentTextActive : undefined}>
                {s === 'upcoming' ? 'Upcoming' : 'My events'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={active.data ?? []}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        refreshing={active.isRefetching}
        onRefresh={() => active.refetch()}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            joined={segment === 'mine' || (participation.data?.eventIds.has(item.id) ?? false)}
            joining={join.isPending && join.variables === item.id}
            onJoin={() => join.mutate(item.id, { onError: (e) => toast.error(errorMessage(e)), onSuccess: () => toast.success('See you there!') })}
          />
        )}
        ListEmptyComponent={
          active.isLoading ? (
            <CardSkeleton count={3} />
          ) : segment === 'upcoming' ? (
            <EmptyState emoji="📅" title="No upcoming events" message="Be the one who brings people together." actionLabel="Create event" onAction={() => router.push('/event/create')} />
          ) : (
            <EmptyState emoji="🎟️" title="You haven't joined any events" message="Browse upcoming events and join one." actionLabel="Browse events" onAction={() => setSegment('upcoming')} />
          )
        }
      />

      <Pressable onPress={() => router.push('/event/create')} style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]} accessibilityLabel="Create event">
        <Ionicons name="add" size={30} color={theme.colors.white} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: theme.spacing.lg, paddingTop: 8, gap: 14, paddingBottom: 12 },
  segments: { flexDirection: 'row', backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radius.pill, padding: 4 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: theme.radius.pill },
  segmentActive: { backgroundColor: theme.colors.primary },
  segmentTextActive: { color: theme.colors.white },
  list: { paddingHorizontal: theme.spacing.lg, paddingBottom: 100, flexGrow: 1 },
  gap: { height: 14 },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', ...theme.shadow.card, shadowOpacity: 0.2 },
  fabPressed: { opacity: 0.85 },
});
