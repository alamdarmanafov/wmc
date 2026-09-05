import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/theme';

import { Text } from './Text';

type Tone = 'accent' | 'primary' | 'warning' | 'danger' | 'muted';

const tones: Record<Tone, { bg: string; fg: string }> = {
  accent: { bg: theme.colors.accent, fg: theme.colors.primary },
  primary: { bg: theme.colors.primary, fg: theme.colors.white },
  warning: { bg: '#FBEFD9', fg: theme.colors.warning },
  danger: { bg: '#F9E2DF', fg: theme.colors.danger },
  muted: { bg: theme.colors.surfaceMuted, fg: theme.colors.textSecondary },
};

export function Badge({ label, tone = 'accent', style }: { label: string; tone?: Tone; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.badge, { backgroundColor: tones[tone].bg }, style]}>
      <Text variant="caption" style={{ color: tones[tone].fg, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}

/** Small numeric dot, e.g. unread count on the bell icon. */
export function CountDot({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={styles.dot}>
      <Text variant="caption" tone="inverse" style={styles.dotText}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.pill },
  dot: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: theme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: { fontSize: 10, fontWeight: '700', lineHeight: 12 },
});
