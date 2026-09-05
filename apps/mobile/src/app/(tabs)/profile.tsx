import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Card, Chip, Screen, Text } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useCityName, useMyInterests, useMyStats } from '@/lib/queries';
import { theme } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const MENU: { icon: IconName; label: string; href: Href }[] = [
  { icon: 'create-outline', label: 'Edit profile', href: '/profile/edit' },
  { icon: 'people-outline', label: 'Connections', href: '/connections' },
  { icon: 'chatbubbles-outline', label: 'Chats', href: '/chat' },
  { icon: 'notifications-outline', label: 'Notifications & privacy', href: '/settings' },
  { icon: 'ban-outline', label: 'Blocked users', href: '/settings/blocked' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const cityName = useCityName(profile?.city_id);
  const stats = useMyStats();
  const interests = useMyInterests();

  const confirmSignOut = () =>
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);

  return (
    <Screen refreshing={stats.isRefetching} onRefresh={() => void stats.refetch()}>
      <Text variant="h1" style={styles.title}>
        Profile
      </Text>
      <Card>
        <View style={styles.identity}>
          <Avatar uri={profile?.photo_url} name={profile?.first_name} size={72} />
          <View style={styles.flex}>
            <Text variant="h2">
              {profile?.first_name}
              {profile?.age ? `, ${profile.age}` : ''}
            </Text>
            {cityName ? (
              <Text variant="small" tone="secondary">
                📍 {cityName}
              </Text>
            ) : null}
            {profile?.profession ? (
              <Text variant="small" tone="secondary">
                💼 {profile.profession}
              </Text>
            ) : null}
          </View>
        </View>
        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        {interests.data && interests.data.length > 0 ? (
          <View style={styles.chips}>
            {interests.data.map((i) => (
              <Chip key={i.id} label={i.name} emoji={i.emoji ?? undefined} size="sm" />
            ))}
          </View>
        ) : null}
      </Card>

      <View style={styles.stats}>
        <Stat value={stats.data?.communities} label="Communities" />
        <Stat value={stats.data?.events} label="Events" />
        <Stat value={stats.data?.connections} label="Connections" />
      </View>

      <Card padded={false} style={styles.menu}>
        {MENU.map((item, i) => (
          <Pressable key={item.label} onPress={() => router.push(item.href)} style={({ pressed }) => [styles.menuItem, i > 0 && styles.menuDivider, pressed && styles.pressed]}>
            <Ionicons name={item.icon} size={22} color={theme.colors.primary} />
            <Text style={styles.flex}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </Pressable>
        ))}
        <Pressable onPress={confirmSignOut} style={({ pressed }) => [styles.menuItem, styles.menuDivider, pressed && styles.pressed]}>
          <Ionicons name="log-out-outline" size={22} color={theme.colors.danger} />
          <Text tone="danger" style={styles.flex}>
            Sign out
          </Text>
        </Pressable>
      </Card>
    </Screen>
  );
}

function Stat({ value, label }: { value: number | undefined; label: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="h2" tone="primary">
        {value ?? '–'}
      </Text>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { paddingTop: 8, marginBottom: 16 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  flex: { flex: 1 },
  bio: { marginTop: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 14 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: theme.radius.card, backgroundColor: theme.colors.accentSoft },
  menu: { marginTop: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16 },
  menuDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
  pressed: { backgroundColor: theme.colors.surfaceMuted },
});
