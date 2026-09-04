import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AvatarStack } from '@/components/AvatarStack';
import { DetailHeader } from '@/components/DetailHeader';
import { Avatar, Badge, Button, Card, EmptyState, Loading, Screen, SectionHeader, Text, useToast } from '@/components/ui';
import { useUserId } from '@/lib/auth';
import { categoryEmoji, categoryName, formatTime, timeAgo } from '@/lib/format';
import { confirm, showMenu } from '@/lib/menu';
import { useActivity, useActivityParticipants, useCloseActivity, useJoinActivity, useLeaveActivity } from '@/lib/queries';
import { errorMessage } from '@/lib/supabase';
import { theme } from '@/theme';

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const userId = useUserId();
  const activity = useActivity(id);
  const participants = useActivityParticipants(id);
  const join = useJoinActivity();
  const leave = useLeaveActivity();
  const close = useCloseActivity();
  const fail = (e: unknown) => toast.error(errorMessage(e));

  if (activity.isLoading) {
    return (
      <Screen scroll={false}>
        <DetailHeader />
        <Loading />
      </Screen>
    );
  }
  if (!activity.data) {
    return (
      <Screen scroll={false}>
        <DetailHeader />
        <EmptyState emoji="🫥" title="Activity not found" message="It may have expired." />
      </Screen>
    );
  }

  const a = activity.data;
  const isCreator = a.creator_id === userId;
  const joined = participants.data?.some((p) => p.id === userId) ?? false;
  const isOpen = a.status === 'open' && new Date(a.expires_at).getTime() > Date.now();
  const isFull = a.max_participants != null && a.participant_count >= a.max_participants;

  const openMenu = () =>
    showMenu('Activity', [
      ...(isCreator && isOpen ? [{ label: 'Close activity', destructive: true, onPress: () => confirm('Close activity', 'No one else will be able to join.', 'Close', () => close.mutate(id, { onError: fail })) }] : []),
      { label: 'Report activity', destructive: true, onPress: () => router.push({ pathname: '/report', params: { targetType: 'activity', targetId: id } }) },
    ]);

  return (
    <Screen padded={false} refreshing={activity.isRefetching} onRefresh={() => void Promise.all([activity.refetch(), participants.refetch()])}>
      <DetailHeader title="Join me" onMenu={openMenu} />
      <View style={styles.body}>
        <Card>
          <View style={styles.creator}>
            <Avatar uri={a.creator.photo_url} name={a.creator.first_name} size={44} />
            <View style={styles.flex}>
              <Text variant="bodyStrong" onPress={() => router.push({ pathname: '/user/[id]', params: { id: a.creator.id } })}>
                {a.creator.first_name}
              </Text>
              <Text variant="caption" tone="muted">
                {timeAgo(a.created_at)}
              </Text>
            </View>
            <Badge label={`${categoryEmoji(a.category)} ${categoryName(a.category)}`} />
          </View>
          <Text variant="h2" style={styles.text}>
            {a.text}
          </Text>
          <View style={styles.meta}>
            {a.happens_at ? <Text>⏰ Today at {formatTime(a.happens_at)}</Text> : null}
            {a.location_name ? <Text>📍 {a.location_name}</Text> : null}
            <Text>👥 {a.participant_count}{a.max_participants ? ` / ${a.max_participants}` : ''} in</Text>
            {!isOpen ? <Badge label={a.status === 'open' ? 'Expired' : a.status === 'closed' ? 'Closed' : 'Cancelled'} tone="muted" /> : null}
          </View>
        </Card>

        <View style={styles.actions}>
          {isCreator ? (
            <Button title="Your activity" variant="secondary" disabled style={styles.flex} />
          ) : joined ? (
            <Button title="Leave" variant="ghost" style={styles.flex} loading={leave.isPending} onPress={() => leave.mutate(id, { onError: fail })} />
          ) : (
            <Button title={!isOpen ? 'No longer open' : isFull ? 'Full' : "I'm in!"} disabled={!isOpen || isFull} style={styles.flex} loading={join.isPending} onPress={() => join.mutate(id, { onError: fail, onSuccess: () => toast.success("You're in!") })} />
          )}
          {joined && a.conversation_id ? (
            <Button title="Group chat" variant="secondary" onPress={() => router.push({ pathname: '/chat/[id]', params: { id: a.conversation_id ?? '', title: a.text } })} />
          ) : null}
        </View>

        <SectionHeader title="Who's in" />
        {participants.data && participants.data.length > 0 ? (
          <View style={styles.members}>
            <AvatarStack people={participants.data} total={a.participant_count} size={40} max={8} />
            <Text variant="small" tone="secondary">
              {participants.data.map((p) => p.first_name).join(', ')}
            </Text>
          </View>
        ) : (
          <Text tone="muted">No one yet.</Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: theme.spacing.lg, paddingTop: 8 },
  creator: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  text: { marginTop: 16 },
  meta: { gap: 6, marginTop: 16 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  members: { gap: 10 },
});
