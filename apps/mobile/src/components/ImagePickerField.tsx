import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, StyleSheet, View } from 'react-native';

import { theme } from '@/theme';

import { Text, useToast } from './ui';

interface Props {
  uri: string | null;
  onChange: (uri: string) => void;
  /** 'avatar' renders a circle; 'cover' a wide rounded rectangle. */
  shape?: 'avatar' | 'cover';
  label?: string;
}

export async function pickImage(aspect: [number, number]): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.8,
  });
  if (result.canceled || result.assets.length === 0) return null;
  return result.assets[0]?.uri ?? null;
}

export function ImagePickerField({ uri, onChange, shape = 'cover', label }: Props) {
  const toast = useToast();
  const isAvatar = shape === 'avatar';

  const choose = async () => {
    try {
      const picked = await pickImage(isAvatar ? [1, 1] : [16, 9]);
      if (picked) onChange(picked);
      else toast.show('Photo access is needed to pick an image');
    } catch {
      toast.error('Could not open your photos');
    }
  };

  return (
    <View style={isAvatar ? styles.centered : undefined}>
      <Pressable onPress={choose} style={[styles.box, isAvatar ? styles.avatar : styles.cover]}>
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera-outline" size={28} color={theme.colors.primary} />
            {!isAvatar ? (
              <Text variant="small" tone="secondary">
                {label ?? 'Add a photo'}
              </Text>
            ) : null}
          </View>
        )}
        {uri ? (
          <View style={styles.edit}>
            <Ionicons name="pencil" size={14} color={theme.colors.white} />
          </View>
        ) : null}
      </Pressable>
      {isAvatar && label ? (
        <Text variant="small" tone="secondary" style={styles.avatarLabel}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', gap: 8 },
  box: { overflow: 'hidden', backgroundColor: theme.colors.accentSoft, borderWidth: 1, borderColor: theme.colors.border },
  avatar: { width: 112, height: 112, borderRadius: 56 },
  cover: { width: '100%', height: 160, borderRadius: theme.radius.card },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  edit: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: { textAlign: 'center' },
});
