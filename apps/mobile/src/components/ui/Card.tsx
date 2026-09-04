import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/theme';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  tone?: 'surface' | 'accent' | 'primary';
  padded?: boolean;
}

export function Card({ children, onPress, style, tone = 'surface', padded = true }: Props) {
  const toneStyle = tone === 'accent' ? styles.accent : tone === 'primary' ? styles.primary : styles.surface;
  const content = [styles.card, toneStyle, padded && styles.padded, style];
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [content, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={content}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.card,
    overflow: 'hidden',
    ...theme.shadow.card,
  },
  padded: { padding: theme.spacing.lg },
  surface: { backgroundColor: theme.colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  accent: { backgroundColor: theme.colors.accentSoft },
  primary: { backgroundColor: theme.colors.primary },
  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
});
