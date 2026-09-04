import { Ionicons } from '@expo/vector-icons';
import { greeting, QUICK_ACTIVITIES } from '@wmc/shared';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ActivityCard } from '@/components/cards/ActivityCard';
import { CommunityCard } from '@/components/cards/CommunityCard';
import { EventCard } from '@/components/cards/EventCard';
import { Card, CardSkeleton, CountDot, EmptyState, Screen, SectionHeader, Text, useToast } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import {
  useCityName,
  useHomeSummary,
  useJoinActivity,
  useJoinCommunity,
  useJoinEvent,
  useMyMemberships,
  useMyParticipation,
  useOpenActivities,
  useRecommendedCommunities,
  useUnreadNotificationCount,
  useUpcomingEvents,
} from '@/lib/queries';
import { errorMessage } from '@/lib/supabase';
import { theme } from '@/theme';

export default function HomeScreen() {
  const router = useRouter();
  const toast = useToast();
  const { profile } = useAuth();
  const cityId = profile?.city_id ?? null;
  const cityName = useCityName(cityId);

  const summary = useHomeSummary();
  const activities = useOpenActivities(cityId, 5);
  const events = useUpcomingEvents(cityId, 5);
  const communities = useRecommendedCommunities(cityId, 5);
  const participation = useMyParticipation();
  const memberships = useMyMemberships();
  const unread = useUnreadNotificationCount();

  const joinActivity = useJoinActivity();
  const joinEvent = useJoinEvent();
  const joinCommunity = useJoinCommunity();

  const [refreshing, setRefreshing] = useState(false);
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([summary.refetch(), activities.refetch(), events.refetch(), communities.refetch(), participation.refetch(), unread.refetch()]);
    setRefreshing(false);
  }, [summary, activities, events, communities, participation, unread]);

  const fail = (e: unknown) => toast.error(errorMessage(e));
  const joinedCommunityIds = new Set((memberships.data ?? []).map((m) => m.id));

  return (
    <Screen padded={false} refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.header}>
        <Image source={require('@/assets/images/logo.png')} style={styles.mark} contentFit="contain" />
        <View style={styles.flex}>
          <Text variant="h2" numberOfLines={1}>
            {greeting(profile?.first_name)}
          </Text>
          {cityName ? (
            <View style={styles.cityPill}>
              <Ionicons name="location" size={12} color={theme.colors.primary} />
              <Text variant="caption" tone="primary" style={styles.cityText}>
                {cityName}
              </Text>
            </View>
          ) : null}
        </View>
        <Pressable onPress={() => router.push('/notifications')} hitSlop={10} style={styles.bell}>
          <Ionicons name="notifications-outline" size={26} color={theme.colors.text} />
          <CountDot count={unread.data ?? 0} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <Card tone="primary">
          <Text variant="h3" tone="inverse">
            You are never alone.
          </Text>
          <Text tone="inverse" style={styles.heroText}>
            Find communities, activities and friends near you.
          </Text>
        </Card>
      </View>

      <View style={styles.sectionHeaderInset}>
        <SectionHeader title="What do you want to do?" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
        {QUICK_ACTIVITIES.map((q) => (
          <Pressable
            key={q.slug}
            onPress={() => router.push({ pathname: '/activity/create', params: { category: q.category, label: q.label } })}
            style={({ pressed }) => [styles.quick, pressed && styles.pressed]}>
            <Text style={styles.quickEmoji}>{q.emoji}</Text>
            <Text variant="label">{q.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sectionHeaderInset}>
        <SectionHeader title="Near you" />
      </View>
      <View style={styles.statsRow}>
        <Stat value={summary.data?.people_count} label="people" onPress={() => router.push('/(tabs)/discover')} />
        <Stat value={summary.data?.community_count} label="communities" onPress={() => router.push('/(tabs)/communities')} />
        <Stat value={summary.data?.event_count} label="events" onPress={() => router.push('/(tabs)/events')} />
        <Stat value={summary.data?.activity_count} label="join me" />
      </View>

      <View style={styles.sectionHeaderInset}>
        <SectionHeader title="Join me" actionLabel="Post" onAction={() => router.push('/activity/create')} />
      </View>
      <View style={styles.list}>
        {activities.isLoading ? <CardSkeleton count={2} /> : null}
        {activities.data?.map((a) => (
          <ActivityCard
            key={a.id}
            activity={a}
            joined={participation.data?.activityIds.has(a.id) ?? false}
            joining={joinActivity.isPending && joinActivity.variables === a.id}
            onJoin={() => joinActivity.mutate(a.id, { onError: fail, onSuccess: () => toast.success("You're in!") })}
          />
        ))}
        {activities.data?.length === 0 ? (
          <EmptyState emoji="⚽" title="Nothing happening right now" message="Be the first — post what you want to do today." actionLabel="Post an activity" onAction={() => router.push('/activity/create')} />
        ) : null}
      </View>

      <View style={styles.sectionHeaderInset}>
        <SectionHeader title="Upcoming events" actionLabel="See all" onAction={() => router.push('/(tabs)/events')} />
      </View>
      <View style={styles.list}>
        {events.isLoading ? <CardSkeleton count={2} /> : null}
        {events.data?.map((e) => (
          <EventCard
            key={e.id}
            event={e}
            compact
            joined={participation.data?.eventIds.has(e.id) ?? false}
            joining={joinEvent.isPending && joinEvent.variables === e.id}
            onJoin={() => joinEvent.mutate(e.id, { onError: fail, onSuccess: () => toast.success('See you there!') })}
          />
        ))}
        {events.data?.length === 0 ? <EmptyState emoji="📅" title="No upcoming events yet" message="Create one and invite your community." actionLabel="Create event" onAction={() => router.push('/event/create')} /> : null}
      </View>

      <View style={styles.sectionHeaderInset}>
        <SectionHeader title="Recommended communities" actionLabel="See all" onAction={() => router.push('/(tabs)/communities')} />
      </View>
      <View style={styles.list}>
        {communities.isLoading ? <CardSkeleton count={2} /> : null}
        {communities.data?.map((c) => (
          <CommunityCard
            key={c.id}
            community={c}
            joined={joinedCommunityIds.has(c.id)}
            joining={joinCommunity.isPending && joinCommunity.variables === c.id}
            onJoin={() => joinCommunity.mutate(c.id, { onError: fail, onSuccess: () => toast.success(`Welcome to ${c.name}`) })}
          />
        ))}
        {communities.data?.length === 0 ? <EmptyState emoji="🌍" title="No communities in your city yet" message="Start one — it takes a minute." actionLabel="Create community" onAction={() => router.push('/community/create')} /> : null}
      </View>
    </Screen>
  );
}

function Stat({ value, label, onPress }: { value: number | undefined; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.stat, pressed && onPress ? styles.pressed : null]}>
      <Text variant="h2" tone="primary">
        {value ?? '–'}
      </Text>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: theme.spacing.lg, paddingTop: 8, paddingBottom: 4 },
  mark: { width: 40, height: 40, borderRadius: 10 },
  flex: { flex: 1 },
  cityPill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: theme.colors.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.radius.pill, marginTop: 4 },
  cityText: { fontWeight: '600' },
  bell: { padding: 4 },
  section: { paddingHorizontal: theme.spacing.lg, marginTop: 16 },
  heroText: { marginTop: 6, opacity: 0.9 },
  sectionHeaderInset: { paddingHorizontal: theme.spacing.lg },
  quickRow: { paddingHorizontal: theme.spacing.lg, gap: 10 },
  quick: { alignItems: 'center', gap: 6, paddingVertical: 14, paddingHorizontal: 16, borderRadius: theme.radius.card, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, minWidth: 110 },
  quickEmoji: { fontSize: 26 },
  pressed: { opacity: 0.8 },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: theme.spacing.lg },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: theme.radius.card, backgroundColor: theme.colors.accentSoft },
  list: { paddingHorizontal: theme.spacing.lg, gap: 12 },
});
