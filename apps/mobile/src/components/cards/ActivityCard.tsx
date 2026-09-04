import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Avatar, Button, Card, Text } from '@/components/ui';
import { categoryEmoji, formatTime, timeAgo } from '@/lib/format';
import type { ActivityListItem } from '@/lib/queries';

interface Props {
  activity: ActivityListItem;
  joined?: boolean;
  onJoin?: () => void;
  joining?: boolean;
}

export function ActivityCard({ activity, joined = false, onJoin, joining = false }: Props) {
  const router = useRouter();
  const isFull = activity.max_participants != null && activity.participant_count >= activity.max_participants;
  const meta = [
    activity.happens_at ? `⏰ ${formatTime(activity.happens_at)}` : null,
    activity.location_name ? `📍 ${activity.location_name}` : null,
    `👥 ${activity.participant_count}${activity.max_participants ? ` / ${activity.max_participants}` : ''}`,
  ].filter(Boolean);

  return (
    <Card onPress={() => router.push({ pathname: '/activity/[id]', params: { id: activity.id } })}>
      <View style={styles.header}>
        <Avatar uri={activity.creator.photo_url} name={activity.creator.first_name} size={36} />
        <View style={styles.flex}>
          <Text variant="label">{activity.creator.first_name}</Text>
          <Text variant="caption" tone="muted">
            {timeAgo(activity.created_at)}
          </Text>
        </View>
        <Text style={styles.emoji}>{categoryEmoji(activity.category)}</Text>
      </View>
      <Text variant="bodyStrong" style={styles.text}>
        {activity.text}
      </Text>
      <View style={styles.footer}>
        <Text variant="small" tone="secondary" style={styles.flex}>
          {meta.join(' · ')}
        </Text>
        {onJoin ? (
          <Button
            title={joined ? 'Joined' : isFull ? 'Full' : 'Join'}
            size="sm"
            variant={joined ? 'ghost' : 'primary'}
            disabled={joined || isFull}
            loading={joining}
            onPress={onJoin}
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
  emoji: { fontSize: 22 },
  text: { marginTop: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
});
