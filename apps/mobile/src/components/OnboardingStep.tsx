import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { theme } from '@/theme';

import { Button, Screen, Text } from './ui';

interface Props {
  step: number;
  total?: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  cta?: string;
  onNext?: () => void;
  nextDisabled?: boolean;
  loading?: boolean;
  canGoBack?: boolean;
  scroll?: boolean;
}

export function OnboardingStep({
  step,
  total = 5,
  title,
  subtitle,
  children,
  cta = 'Continue',
  onNext,
  nextDisabled = false,
  loading = false,
  canGoBack = true,
  scroll = true,
}: Props) {
  const router = useRouter();
  return (
    <Screen scroll={scroll} keyboard edges={['top', 'left', 'right']} contentStyle={styles.content}>
      <View style={styles.topRow}>
        {canGoBack && router.canGoBack() ? (
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </Pressable>
        ) : (
          <View style={styles.back} />
        )}
        <View style={styles.progress}>
          {Array.from({ length: total }).map((_, i) => (
            <View key={i} style={[styles.dot, i < step && styles.dotActive]} />
          ))}
        </View>
        <View style={styles.back} />
      </View>
      <Text variant="h1" style={styles.title}>
        {title}
      </Text>
      {subtitle ? (
        <Text tone="secondary" style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
      <View style={styles.body}>{children}</View>
      {onNext ? (
        <View style={styles.footer}>
          <Button title={cta} fullWidth onPress={onNext} disabled={nextDisabled} loading={loading} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  back: { width: 40, height: 40, justifyContent: 'center', marginLeft: -8 },
  progress: { flexDirection: 'row', gap: 6 },
  dot: { width: 24, height: 4, borderRadius: 2, backgroundColor: theme.colors.border },
  dotActive: { backgroundColor: theme.colors.primary },
  title: { marginTop: 12 },
  subtitle: { marginTop: 6 },
  body: { flex: 1, marginTop: 24 },
  footer: { paddingTop: 16, paddingBottom: 24 },
});
