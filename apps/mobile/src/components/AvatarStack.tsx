import { StyleSheet, View } from 'react-native';

import type { PersonPreview } from '@/lib/queries';
import { theme } from '@/theme';

import { Avatar, Text } from './ui';

interface Props {
  people: PersonPreview[];
  total?: number;
  size?: number;
  max?: number;
}

export function AvatarStack({ people, total, size = 32, max = 5 }: Props) {
  const shown = people.slice(0, max);
  const count = total ?? people.length;
  const extra = count - shown.length;
  return (
    <View style={styles.row}>
      {shown.map((p, i) => (
        <View key={p.id} style={[styles.item, { marginLeft: i === 0 ? 0 : -size * 0.3 }]}>
          <Avatar uri={p.photo_url} name={p.first_name} size={size} />
        </View>
      ))}
      {extra > 0 ? (
        <View style={[styles.item, styles.extra, { width: size, height: size, borderRadius: size / 2, marginLeft: -size * 0.3 }]}>
          <Text variant="caption" tone="primary" style={{ fontWeight: '700' }}>
            +{extra}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  item: { borderWidth: 2, borderColor: theme.colors.surface, borderRadius: 999 },
  extra: { backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
});
