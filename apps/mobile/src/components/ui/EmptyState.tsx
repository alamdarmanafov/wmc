import { StyleSheet, View } from 'react-native';

import { Button } from './Button';
import { Text } from './Text';

interface Props {
  emoji?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji = '🌙', title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text variant="h3" style={styles.center}>
        {title}
      </Text>
      {message ? (
        <Text tone="secondary" style={styles.center}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} variant="secondary" style={styles.action} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 8 },
  emoji: { fontSize: 40, marginBottom: 4 },
  center: { textAlign: 'center' },
  action: { marginTop: 12 },
});
