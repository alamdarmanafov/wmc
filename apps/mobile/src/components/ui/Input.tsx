import { forwardRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { theme } from '@/theme';

import { Text } from './Text';

interface Props extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string | null;
}

export const Input = forwardRef<TextInput, Props>(function Input({ label, hint, error, style, multiline, ...rest }, ref) {
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="label" tone="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={theme.colors.textMuted}
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline, error ? styles.errorBorder : null, style]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" tone="danger" style={styles.hint}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted" style={styles.hint}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { marginLeft: 4 },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: theme.font.body,
    color: theme.colors.text,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  errorBorder: { borderColor: theme.colors.danger },
  hint: { marginLeft: 4 },
});
