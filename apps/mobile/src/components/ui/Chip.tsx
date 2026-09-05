import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/theme';

import { Text } from './Text';

interface Props {
  label: string;
  emoji?: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  size?: 'md' | 'sm';
}

export function Chip({ label, emoji, selected = false, onPress, style, size = 'md' }: Props) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        size === 'sm' && styles.sm,
        selected ? styles.selected : styles.idle,
        pressed && onPress ? styles.pressed : null,
        style,
      ]}>
      <Text variant={size === 'sm' ? 'caption' : 'label'} style={{ color: selected ? theme.colors.white : theme.colors.text }}>
        {emoji ? `${emoji} ${label}` : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  sm: { paddingVertical: 5, paddingHorizontal: 10 },
  idle: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
  selected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  pressed: { opacity: 0.8 },
});
