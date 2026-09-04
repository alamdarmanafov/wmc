import { Text as RNText, StyleSheet, type TextProps } from 'react-native';

import { theme } from '@/theme';

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodyStrong' | 'small' | 'caption' | 'label';
type Tone = 'default' | 'secondary' | 'muted' | 'primary' | 'inverse' | 'danger';

interface Props extends TextProps {
  variant?: Variant;
  tone?: Tone;
}

const tones: Record<Tone, string> = {
  default: theme.colors.text,
  secondary: theme.colors.textSecondary,
  muted: theme.colors.textMuted,
  primary: theme.colors.primary,
  inverse: theme.colors.white,
  danger: theme.colors.danger,
};

export function Text({ variant = 'body', tone = 'default', style, ...rest }: Props) {
  return <RNText {...rest} style={[styles[variant], { color: tones[tone] }, style]} />;
}

const styles = StyleSheet.create({
  display: { fontSize: theme.font.display, fontWeight: '700', letterSpacing: -0.8, lineHeight: 40 },
  h1: { fontSize: theme.font.h1, fontWeight: '700', letterSpacing: -0.5, lineHeight: 34 },
  h2: { fontSize: theme.font.h2, fontWeight: '700', letterSpacing: -0.3, lineHeight: 28 },
  h3: { fontSize: theme.font.h3, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: theme.font.body, lineHeight: 22 },
  bodyStrong: { fontSize: theme.font.body, fontWeight: '600', lineHeight: 22 },
  small: { fontSize: theme.font.small, lineHeight: 20 },
  caption: { fontSize: theme.font.caption, lineHeight: 16 },
  label: { fontSize: theme.font.small, fontWeight: '600', lineHeight: 18 },
});
