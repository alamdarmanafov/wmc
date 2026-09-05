import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/theme';

import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const background: Record<Variant, string> = {
  primary: theme.colors.primary,
  secondary: theme.colors.accent,
  ghost: 'transparent',
  danger: theme.colors.danger,
};

const foreground: Record<Variant, string> = {
  primary: theme.colors.white,
  secondary: theme.colors.primary,
  ghost: theme.colors.primary,
  danger: theme.colors.white,
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  icon,
  fullWidth = false,
}: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      onPress={inactive ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: background[variant], opacity: inactive ? 0.5 : pressed ? 0.85 : 1 },
        variant === 'ghost' && styles.ghost,
        fullWidth && styles.fullWidth,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={foreground[variant]} />
      ) : (
        <>
          {icon}
          <Text variant={size === 'sm' ? 'label' : 'bodyStrong'} style={{ color: foreground[variant] }}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: theme.radius.pill,
  },
  md: { paddingVertical: 14, paddingHorizontal: 22, minHeight: 50 },
  sm: { paddingVertical: 8, paddingHorizontal: 14, minHeight: 36 },
  ghost: { borderWidth: 1, borderColor: theme.colors.border },
  fullWidth: { alignSelf: 'stretch' },
});
