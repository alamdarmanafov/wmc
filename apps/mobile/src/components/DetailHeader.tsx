import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { theme } from '@/theme';

import { Text } from './ui';

interface Props {
  title?: string;
  right?: ReactNode;
  onMenu?: () => void;
  /** Render over an image (white icons on translucent circles). */
  overlay?: boolean;
}

export function DetailHeader({ title, right, onMenu, overlay = false }: Props) {
  const router = useRouter();
  const iconColor = overlay ? theme.colors.white : theme.colors.text;
  const circle = overlay ? styles.overlayCircle : styles.circle;
  return (
    <View style={[styles.row, overlay && styles.overlayRow]}>
      <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} hitSlop={10} style={circle}>
        <Ionicons name="chevron-back" size={24} color={iconColor} />
      </Pressable>
      {title ? (
        <Text variant="h3" numberOfLines={1} style={[styles.title, overlay && styles.overlayTitle]}>
          {title}
        </Text>
      ) : (
        <View style={styles.title} />
      )}
      {right ??
        (onMenu ? (
          <Pressable onPress={onMenu} hitSlop={10} style={circle}>
            <Ionicons name="ellipsis-horizontal" size={22} color={iconColor} />
          </Pressable>
        ) : (
          <View style={styles.spacer} />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6 },
  overlayRow: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  circle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  overlayCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  title: { flex: 1, textAlign: 'center' },
  overlayTitle: { color: theme.colors.white },
  spacer: { width: 40 },
});
