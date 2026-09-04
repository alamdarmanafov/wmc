import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { theme } from '@/theme';

import { Text } from './Text';

interface Props {
  uri?: string | null;
  name?: string | null;
  size?: number;
}

const palette = [theme.colors.primary, '#1E5F52', theme.colors.terracotta, theme.colors.gold, theme.colors.info];

export function Avatar({ uri, name, size = 48 }: Props) {
  const initial = (name ?? '').trim().charAt(0).toUpperCase() || '·';
  const color = palette[initial.charCodeAt(0) % palette.length];
  const radius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: theme.colors.surfaceMuted }}
        contentFit="cover"
        transition={150}
      />
    );
  }
  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: radius, backgroundColor: color }]}>
      <Text tone="inverse" style={{ fontSize: size * 0.42, fontWeight: '700' }}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
