import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import { categoryEmoji, formatEventDate, formatTime } from '@/lib/format';
import type { EventListItem } from '@/lib/queries';
import { theme } from '@/theme';

interface Props {
  event: EventListItem;
  joined?: boolean;
  onJoin?: () => void;
  joining?: boolean;
  compact?: boolean;
}

export function EventCard({ event, joined = false, onJoin, joining = false, compact = false }: Props) {
  const router = useRouter();
  const isFull = event.max_participants != null && event.participant_count >= event.max_participants;
  const capacity = event.max_participants ? `${event.participant_count} / ${event.max_participants} joined` : `${event.participant_count} joined`;

  return (
    <Card padded={false} onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}>
      {event.image_url ? (
        <Image source={{ uri: event.image_url }} style={[styles.hero, compact && styles.heroCompact]} contentFit="cover" />
      ) : (
        <View style={[styles.hero, styles.heroPlaceholder, compact && styles.heroCompact]}>
          <Text style={styles.heroEmoji}>{categoryEmoji(event.category)}</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text variant="h3" numberOfLines={2}>
          {event.title}
        </Text>
        <Text variant="small" tone="secondary">
          📅 {formatEventDate(event.starts_at)} · ⏰ {formatTime(event.starts_at)}
        </Text>
        {event.location_name ? (
          <Text variant="small" tone="secondary" numberOfLines={1}>
            📍 {event.location_name}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <View style={styles.flex}>
            <Text variant="small" tone="secondary">
              👥 {capacity}
            </Text>
            {event.communities?.name ? (
              <Text variant="caption" tone="muted" numberOfLines={1}>
                Hosted by {event.communities.name}
              </Text>
            ) : null}
          </View>
          {onJoin ? (
            <Button
              title={joined ? 'Joined' : isFull ? 'Full' : 'Join'}
              size="sm"
              variant={joined ? 'ghost' : 'secondary'}
              disabled={joined || isFull}
              loading={joining}
              onPress={onJoin}
            />
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 140, backgroundColor: theme.colors.accent },
  heroCompact: { height: 96 },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.accent },
  heroEmoji: { fontSize: 40 },
  body: { padding: theme.spacing.lg, gap: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  flex: { flex: 1, gap: 2 },
});
