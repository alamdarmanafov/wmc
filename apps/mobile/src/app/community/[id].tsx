import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AvatarStack } from '@/components/AvatarStack';
import { DetailHeader } from '@/components/DetailHeader';
import { EventCard } from '@/components/cards/EventCard';
import { Badge, Button, EmptyState, Loading, Screen, SectionHeader, Text, useToast } from '@/components/ui';
import { useUserId } from '@/lib/auth';
import { categoryEmoji, categoryName, pluralize } from '@/lib/format';
import { confirm, showMenu } from '@/lib/menu';
import { useCommunity, useCommunityEvents, useCommunityMembers, useJoinCommunity, useLeaveCommunity, useMyParticipation } from '@/lib/queries';
import { errorMessage } from '@/lib/supabase';
import { theme } from '@/theme';

export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const userId = useUserId();
  const community = useCommunity(id);
  const members = useCommunityMembers(id);
  const events = useCommunityEvents(id);
  const participation = useMyParticipation();
  const join = useJoinCommunity();
  const leave = useLeaveCommunity();

  const isMember = members.data?.some((m) => m.id === userId) ?? false;
  const isOwner = community.data?.owner_id === userId;
  const fail = (e: unknown) => toast.error(errorMessage(e));

  const openMenu = () =>
    showMenu(community.data?.name ?? 'Community', [
      { label: 'Report community', destructive: true, onPress: () => router.push({ pathname: '/report', params: { targetType: 'community', targetId: id } }) },
    ]);

  if (community.isLoading) {
    return (
      <Screen scroll={false}>
        <DetailHeader />
        <Loading />
      </Screen>
    );
  }
  if (!community.data) {
    return (
      <Screen scroll={false}>
        <DetailHeader />
        <EmptyState emoji="🫥" title="Community not found" message="It may have been removed." />
      </Screen>
    );
  }
  const c = community.data;

  return (
    <Screen padded={false} edges={['left', 'right']} refreshing={community.isRefetching} onRefresh={() => void Promise.all([community.refetch(), members.refetch(), events.refetch()])}>
      <View>
        {c.image_url ? (
          <Image source={{ uri: c.image_url }} style={styles.hero} contentFit="cover" />
        ) : (
          <View style={[styles.hero, styles.heroPlaceholder]}>
            <Text style={styles.heroEmoji}>{categoryEmoji(c.category)}</Text>
          </View>
        )}
        <DetailHeader overlay onMenu={openMenu} />
      </View>

      <View style={styles.body}>
        <View style={styles.badges}>
          <Badge label={`${categoryEmoji(c.category)} ${categoryName(c.category)}`} />
          {c.status === 'pending' ? <Badge label="Pending approval" tone="warning" /> : null}
          {c.cities?.name ? <Badge label={`📍 ${c.cities.name}`} tone="muted" /> : null}
        </View>
        <Text variant="h1" style={styles.title}>
          {c.name}
        </Text>
        <Text tone="secondary">{pluralize(c.member_count, 'member')}</Text>
        {c.description ? <Text style={styles.description}>{c.description}</Text> : null}

        <View style={styles.actions}>
          {isOwner ? (
            <Button title="You own this community" variant="secondary" disabled style={styles.flex} />
          ) : isMember ? (
            <Button
              title="Leave"
              variant="ghost"
              style={styles.flex}
              loading={leave.isPending}
              onPress={() => confirm('Leave community', `Leave ${c.name}?`, 'Leave', () => leave.mutate(id, { onError: fail }))}
            />
          ) : (
            <Button title="Join community" style={styles.flex} loading={join.isPending} onPress={() => join.mutate(id, { onError: fail, onSuccess: () => toast.success(`Welcome to ${c.name}`) })} />
          )}
          {isMember && c.status === 'approved' ? (
            <Button title="Create event" variant="secondary" onPress={() => router.push({ pathname: '/event/create', params: { communityId: id } })} />
          ) : null}
        </View>

        <SectionHeader title="Upcoming" />
        <View style={styles.list}>
          {events.data?.map((e) => (
            <EventCard key={e.id} event={e} compact joined={participation.data?.eventIds.has(e.id) ?? false} />
          ))}
          {events.data?.length === 0 ? (
            <Text tone="muted">No upcoming events yet.</Text>
          ) : null}
        </View>

        <SectionHeader title="Members" />
        {members.data && members.data.length > 0 ? (
          <View style={styles.members}>
            <AvatarStack people={members.data} total={c.member_count} size={40} max={8} />
            <Text variant="small" tone="secondary">
              {members.data
                .slice(0, 3)
                .map((m) => m.first_name)
                .join(', ')}
              {c.member_count > 3 ? ` and ${c.member_count - 3} others` : ''}
            </Text>
          </View>
        ) : (
          <Text tone="muted">Be the first to join.</Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 240, backgroundColor: theme.colors.accent },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 72 },
  body: { paddingHorizontal: theme.spacing.lg, paddingTop: 18 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  title: { marginTop: 10 },
  description: { marginTop: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  flex: { flex: 1 },
  list: { gap: 12 },
  members: { gap: 10 },
});
