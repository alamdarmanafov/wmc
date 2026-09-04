import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import type { CommunityRow } from '@/lib/database.types';
import { categoryEmoji, pluralize } from '@/lib/format';
import { theme } from '@/theme';

interface Props {
  community: CommunityRow;
  joined?: boolean;
  onJoin?: () => void;
  joining?: boolean;
}

export function CommunityCard({ community, joined = false, onJoin, joining = false }: Props) {
  const router = useRouter();
  return (
    <Card onPress={() => router.push({ pathname: '/community/[id]', params: { id: community.id } })}>
      <View style={styles.row}>
        {community.image_url ? (
          <Image source={{ uri: community.image_url }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.emoji}>{categoryEmoji(community.category)}</Text>
          </View>
        )}
        <View style={styles.flex}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {community.name}
          </Text>
          <Text variant="small" tone="secondary">
            {categoryEmoji(community.category)} {pluralize(community.member_count, 'member')}
          </Text>
          {community.description ? (
            <Text variant="small" tone="muted" numberOfLines={1}>
              {community.description}
            </Text>
          ) : null}
        </View>
        {onJoin ? (
          <Button
            title={joined ? 'Joined' : 'Join'}
            size="sm"
            variant={joined ? 'ghost' : 'secondary'}
            loading={joining}
            disabled={joined}
            onPress={onJoin}
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  image: { width: 56, height: 56, borderRadius: 14, backgroundColor: theme.colors.accentSoft },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 26 },
  flex: { flex: 1, gap: 2 },
});
