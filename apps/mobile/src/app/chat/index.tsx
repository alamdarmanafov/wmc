import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { DetailHeader } from '@/components/DetailHeader';
import { Avatar, CardSkeleton, EmptyState, Screen, Text } from '@/components/ui';
import { timeAgo } from '@/lib/format';
import { useConversations } from '@/lib/queries';
import { theme } from '@/theme';

export default function ChatInboxScreen() {
  const router = useRouter();
  const conversations = useConversations();

  return (
    <Screen scroll={false} padded={false}>
      <DetailHeader title="Chats" />
      <FlatList
        data={conversations.data ?? []}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        refreshing={conversations.isRefetching}
        onRefresh={() => conversations.refetch()}
        renderItem={({ item }) => {
          const unread = item.unread_count > 0;
          const typeEmoji = item.type === 'event' ? '📅' : item.type === 'activity' ? '⚡' : null;
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id, title: item.title ?? '' } })}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              {item.type === 'direct' ? (
                <Avatar uri={item.image_url} name={item.title} size={52} />
              ) : (
                <View style={styles.groupIcon}>
                  <Text style={styles.groupEmoji}>{typeEmoji}</Text>
                </View>
              )}
              <View style={styles.flex}>
                <View style={styles.titleRow}>
                  <Text variant={unread ? 'bodyStrong' : 'body'} numberOfLines={1} style={styles.flex}>
                    {item.title ?? 'Conversation'}
                  </Text>
                  {item.last_message_at ? (
                    <Text variant="caption" tone="muted">
                      {timeAgo(item.last_message_at)}
                    </Text>
                  ) : null}
                </View>
                <Text variant="small" tone={unread ? 'default' : 'muted'} numberOfLines={1} style={unread ? styles.unreadText : undefined}>
                  {item.last_message ?? 'Say salam 👋'}
                </Text>
              </View>
              {unread ? (
                <View style={styles.unreadDot}>
                  <Text variant="caption" tone="inverse" style={styles.unreadCount}>
                    {item.unread_count}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          conversations.isLoading ? (
            <View style={styles.skeleton}>
              <CardSkeleton count={4} />
            </View>
          ) : (
            <EmptyState emoji="💬" title="No chats yet" message="Connect with someone or join an event to start chatting." actionLabel="Meet people" onAction={() => router.push('/(tabs)/discover')} />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 32, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: theme.spacing.lg, paddingVertical: 14 },
  pressed: { backgroundColor: theme.colors.surfaceMuted },
  groupIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
  groupEmoji: { fontSize: 22 },
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unreadText: { fontWeight: '600' },
  unreadDot: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  unreadCount: { fontWeight: '700' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginLeft: 82 },
  skeleton: { paddingHorizontal: theme.spacing.lg },
});
