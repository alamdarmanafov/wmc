import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AvatarStack } from '@/components/AvatarStack';
import { DetailHeader } from '@/components/DetailHeader';
import { Avatar, Badge, Button, EmptyState, Loading, Screen, SectionHeader, Text, useToast } from '@/components/ui';
import { useUserId } from '@/lib/auth';
import { categoryEmoji, categoryName, formatEventDate, formatTime } from '@/lib/format';
import { confirm, showMenu } from '@/lib/menu';
import { useCancelEvent, useEvent, useEventParticipants, useJoinEvent, useLeaveEvent } from '@/lib/queries';
import { errorMessage } from '@/lib/supabase';
import { theme } from '@/theme';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const userId = useUserId();
  const event = useEvent(id);
  const participants = useEventParticipants(id);
  const join = useJoinEvent();
  const leave = useLeaveEvent();
  const cancel = useCancelEvent();
  const fail = (e: unknown) => toast.error(errorMessage(e));

  if (event.isLoading) {
    return (
      <Screen scroll={false}>
        <DetailHeader />
        <Loading />
      </Screen>
    );
  }
  if (!event.data) {
    return (
      <Screen scroll={false}>
        <DetailHeader />
        <EmptyState emoji="🫥" title="Event not found" message="It may have been removed." />
      </Screen>
    );
  }

  const e = event.data;
  const isCreator = e.creator_id === userId;
  const joined = participants.data?.some((p) => p.id === userId) ?? false;
  const isFull = e.max_participants != null && e.participant_count >= e.max_participants;
  const cancelled = e.status === 'cancelled';
  const past = new Date(e.starts_at).getTime() < Date.now();

  const openMenu = () =>
    showMenu(e.title, [
      ...(isCreator && !cancelled
        ? [{ label: 'Cancel event', destructive: true, onPress: () => confirm('Cancel event', 'Everyone who joined will see it as cancelled.', 'Cancel event', () => cancel.mutate(id, { onError: fail, onSuccess: () => toast.show('Event cancelled') })) }]
        : []),
      { label: 'Report event', destructive: true, onPress: () => router.push({ pathname: '/report', params: { targetType: 'event', targetId: id } }) },
    ]);

  return (
    <Screen padded={false} edges={['left', 'right']} refreshing={event.isRefetching} onRefresh={() => void Promise.all([event.refetch(), participants.refetch()])}>
      <View>
        {e.image_url ? (
          <Image source={{ uri: e.image_url }} style={styles.hero} contentFit="cover" />
        ) : (
          <View style={[styles.hero, styles.heroPlaceholder]}>
            <Text style={styles.heroEmoji}>{categoryEmoji(e.category)}</Text>
          </View>
        )}
        <DetailHeader overlay onMenu={openMenu} />
      </View>

      <View style={styles.body}>
        <View style={styles.badges}>
          <Badge label={`${categoryEmoji(e.category)} ${categoryName(e.category)}`} />
          {cancelled ? <Badge label="Cancelled" tone="danger" /> : null}
          {isFull && !cancelled ? <Badge label="Full" tone="warning" /> : null}
        </View>
        <Text variant="h1" style={styles.title}>
          {e.title}
        </Text>

        <View style={styles.meta}>
          <Text>📅 {formatEventDate(e.starts_at)} · ⏰ {formatTime(e.starts_at)}{e.ends_at ? ` – ${formatTime(e.ends_at)}` : ''}</Text>
          {e.location_name ? <Text>📍 {e.location_name}</Text> : null}
          {e.location_address ? (
            <Text variant="small" tone="secondary" style={styles.address}>
              {e.location_address}
            </Text>
          ) : null}
          {e.communities ? (
            <Text tone="secondary" onPress={() => router.push({ pathname: '/community/[id]', params: { id: e.communities?.id ?? '' } })}>
              🌍 Hosted by <Text tone="primary" variant="bodyStrong">{e.communities.name}</Text>
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          {cancelled ? (
            <Button title="Event cancelled" variant="ghost" disabled style={styles.flex} />
          ) : isCreator ? (
            <Button title="You're hosting" variant="secondary" disabled style={styles.flex} />
          ) : joined ? (
            <Button title="Leave" variant="ghost" style={styles.flex} loading={leave.isPending} onPress={() => leave.mutate(id, { onError: fail })} />
          ) : (
            <Button title={isFull ? 'Full' : past ? 'Event started' : 'Join event'} disabled={isFull || past} style={styles.flex} loading={join.isPending} onPress={() => join.mutate(id, { onError: fail, onSuccess: () => toast.success('See you there!') })} />
          )}
          {joined && e.conversation_id && !cancelled ? (
            <Button title="Group chat" variant="secondary" onPress={() => router.push({ pathname: '/chat/[id]', params: { id: e.conversation_id ?? '', title: e.title } })} />
          ) : null}
        </View>

        <SectionHeader title="Who's going?" />
        {participants.data && participants.data.length > 0 ? (
          <View style={styles.members}>
            <AvatarStack people={participants.data} total={e.participant_count} size={40} max={8} />
            <Text variant="small" tone="secondary">
              {e.participant_count}{e.max_participants ? ` / ${e.max_participants}` : ''} joined
            </Text>
          </View>
        ) : (
          <Text tone="muted">Be the first to join.</Text>
        )}

        {e.description ? (
          <>
            <SectionHeader title="About" />
            <Text>{e.description}</Text>
          </>
        ) : null}

        <SectionHeader title="Organizer" />
        <View style={styles.organizer}>
          <Avatar uri={e.creator.photo_url} name={e.creator.first_name} size={40} />
          <Text variant="bodyStrong" onPress={() => router.push({ pathname: '/user/[id]', params: { id: e.creator.id } })}>
            {e.creator.first_name}
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 260, backgroundColor: theme.colors.accent },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 72 },
  body: { paddingHorizontal: theme.spacing.lg, paddingTop: 18 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  title: { marginTop: 10 },
  meta: { gap: 6, marginTop: 14 },
  address: { marginLeft: 24, marginTop: -4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  flex: { flex: 1 },
  members: { gap: 10 },
  organizer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
