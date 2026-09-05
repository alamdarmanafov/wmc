import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { DetailHeader } from '@/components/DetailHeader';
import { CardSkeleton, EmptyState, Screen, Text } from '@/components/ui';
import type { NotificationRow } from '@/lib/database.types';
import { timeAgo } from '@/lib/format';
import { useMarkAllNotificationsRead, useNotifications } from '@/lib/queries';
import { theme } from '@/theme';

const ICONS: Record<NotificationRow['type'], string> = {
  connection_request: '🤝',
  connection_accepted: '✅',
  event_joined: '📅',
  event_reminder: '⏰',
  activity_joined: '⚡',
  new_community: '🌍',
  nearby_people: '📍',
  message: '💬',
  system: '🔔',
};

function readString(data: unknown, key: string): string | null {
  if (data && typeof data === 'object' && key in data) {
    const v = (data as Record<string, unknown>)[key];
    return typeof v === 'string' ? v : null;
  }
  return null;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const notifications = useNotifications();
  const markAll = useMarkAllNotificationsRead();

  useEffect(() => {
    if (notifications.data?.some((n) => !n.read_at)) markAll.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.data]);

  const open = (n: NotificationRow) => {
    const conversationId = readString(n.data, 'conversation_id');
    const eventId = readString(n.data, 'event_id');
    const activityId = readString(n.data, 'activity_id');
    const communityId = readString(n.data, 'community_id');
    const userId = readString(n.data, 'user_id');
    if (conversationId) router.push({ pathname: '/chat/[id]', params: { id: conversationId } });
    else if (eventId) router.push({ pathname: '/event/[id]', params: { id: eventId } });
    else if (activityId) router.push({ pathname: '/activity/[id]', params: { id: activityId } });
    else if (communityId) router.push({ pathname: '/community/[id]', params: { id: communityId } });
    else if (n.type === 'connection_request') router.push('/connections');
    else if (userId) router.push({ pathname: '/user/[id]', params: { id: userId } });
  };

  return (
    <Screen scroll={false} padded={false}>
      <DetailHeader title="Notifications" />
      <FlatList
        data={notifications.data ?? []}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        refreshing={notifications.isRefetching}
        onRefresh={() => notifications.refetch()}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <Pressable onPress={() => open(item)} style={({ pressed }) => [styles.row, !item.read_at && styles.unread, pressed && styles.pressed]}>
            <View style={styles.icon}>
              <Text style={styles.iconText}>{ICONS[item.type] ?? '🔔'}</Text>
            </View>
            <View style={styles.flex}>
              <Text variant="bodyStrong">{item.title}</Text>
              {item.body ? (
                <Text variant="small" tone="secondary" numberOfLines={2}>
                  {item.body}
                </Text>
              ) : null}
              <Text variant="caption" tone="muted" style={styles.time}>
                {timeAgo(item.created_at)}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          notifications.isLoading ? (
            <View style={styles.skeleton}>
              <CardSkeleton count={4} />
            </View>
          ) : (
            <EmptyState emoji="🔔" title="You're all caught up" message="We'll let you know when something happens." />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 32, flexGrow: 1 },
  row: { flexDirection: 'row', gap: 14, paddingHorizontal: theme.spacing.lg, paddingVertical: 14 },
  unread: { backgroundColor: theme.colors.accentSoft },
  pressed: { opacity: 0.8 },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 20 },
  flex: { flex: 1, gap: 2 },
  time: { marginTop: 2 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border },
  skeleton: { paddingHorizontal: theme.spacing.lg },
});
