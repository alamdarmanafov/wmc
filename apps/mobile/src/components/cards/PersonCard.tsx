import { sharedInterestsLabel } from '@wmc/shared';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ConnectButton } from '@/components/ConnectButton';
import { Avatar, Badge, Card, Chip, Text } from '@/components/ui';
import type { DiscoverPersonRow } from '@/lib/database.types';
import { theme } from '@/theme';

export function PersonCard({ person }: { person: DiscoverPersonRow }) {
  const router = useRouter();
  const sharedCount = person.shared_interests.length;
  return (
    <Card onPress={() => router.push({ pathname: '/user/[id]', params: { id: person.id } })}>
      <View style={styles.top}>
        <Avatar uri={person.photo_url} name={person.first_name} size={64} />
        <View style={styles.flex}>
          <Text variant="h3">
            {person.first_name}
            {person.age ? `, ${person.age}` : ''}
          </Text>
          {person.city_name ? (
            <Text variant="small" tone="secondary">
              📍 {person.city_name} · {person.distance_label}
            </Text>
          ) : null}
          {person.profession ? (
            <Text variant="small" tone="secondary">
              💼 {person.profession}
            </Text>
          ) : null}
        </View>
        {sharedCount > 0 ? <Badge label={`${sharedCount} shared`} /> : null}
      </View>

      {person.interests.length > 0 ? (
        <View style={styles.chips}>
          {person.interests.slice(0, 5).map((name) => (
            <Chip key={name} label={name} size="sm" selected={person.shared_interests.includes(name)} />
          ))}
        </View>
      ) : null}

      <Text variant="small" tone="primary" style={styles.shared}>
        {sharedInterestsLabel(person.shared_interests)}
      </Text>

      <View style={styles.footer}>
        <ConnectButton userId={person.id} status={person.connection_status} direction={person.connection_direction} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  flex: { flex: 1, gap: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  shared: { marginTop: 12, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border, paddingTop: 12 },
});
