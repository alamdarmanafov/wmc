import type { LocationVisibility, NotificationPrefs } from '@wmc/shared';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Switch, Pressable, View } from 'react-native';

import { DetailHeader } from '@/components/DetailHeader';
import { Button, Card, Screen, SectionHeader, Text, useToast } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { confirm } from '@/lib/menu';
import { useUpdateLocation, useUpdateProfile } from '@/lib/queries';
import { errorMessage } from '@/lib/supabase';
import { theme } from '@/theme';

const PREFS: { key: keyof NotificationPrefs; label: string; hint: string }[] = [
  { key: 'connections', label: 'Connections', hint: 'Requests and accepted connections' },
  { key: 'messages', label: 'Messages', hint: 'New chat messages' },
  { key: 'events', label: 'Events', hint: 'Joins, reminders and updates' },
  { key: 'activities', label: 'Join me', hint: 'When someone joins your activity' },
  { key: 'communities', label: 'Communities', hint: 'New communities in your city' },
  { key: 'nearby', label: 'People nearby', hint: 'Occasional suggestions of people near you' },
];

const VISIBILITY: { value: LocationVisibility; label: string; hint: string }[] = [
  { value: 'city_only', label: 'City only', hint: 'Others only see your city.' },
  { value: 'approximate', label: 'Approximate distance', hint: 'Show a rough distance like “~2 km away”. Never your exact spot.' },
  { value: 'hidden', label: 'Hidden', hint: "Don't show distance and don't use my location for matching." },
];

export default function SettingsScreen() {
  const toast = useToast();
  const { profile } = useAuth();
  const updateProfile = useUpdateProfile();
  const updateLocation = useUpdateLocation();
  const prefs = profile?.notification_prefs;
  const fail = (e: unknown) => toast.error(errorMessage(e));

  const togglePref = (key: keyof NotificationPrefs, value: boolean) => {
    if (!prefs) return;
    updateProfile.mutate({ notification_prefs: { ...prefs, [key]: value } }, { onError: fail });
  };

  const setVisibility = (value: LocationVisibility) => updateProfile.mutate({ location_visibility: value }, { onError: fail });

  const deleteLocation = () =>
    confirm('Delete location data', 'We will remove your stored coordinates. You can share them again any time from onboarding or by allowing location access.', 'Delete', () =>
      updateLocation.mutate(null, { onError: fail, onSuccess: () => toast.success('Location data deleted') }),
    );

  return (
    <Screen padded={false}>
      <DetailHeader title="Notifications & privacy" />
      <View style={styles.body}>
        <SectionHeader title="Notifications" />
        <Card padded={false}>
          {PREFS.map((p, i) => (
            <View key={p.key} style={[styles.row, i > 0 && styles.divider]}>
              <View style={styles.flex}>
                <Text variant="bodyStrong">{p.label}</Text>
                <Text variant="caption" tone="muted">
                  {p.hint}
                </Text>
              </View>
              <Switch value={prefs?.[p.key] ?? true} onValueChange={(v) => togglePref(p.key, v)} trackColor={{ true: theme.colors.primary }} />
            </View>
          ))}
        </Card>

        <SectionHeader title="Location visibility" />
        <Card padded={false}>
          {VISIBILITY.map((v, i) => {
            const active = profile?.location_visibility === v.value;
            return (
              <Pressable key={v.value} onPress={() => setVisibility(v.value)} style={({ pressed }) => [styles.row, i > 0 && styles.divider, pressed && styles.pressed]}>
                <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={22} color={active ? theme.colors.primary : theme.colors.textMuted} />
                <View style={styles.flex}>
                  <Text variant="bodyStrong">{v.label}</Text>
                  <Text variant="caption" tone="muted">
                    {v.hint}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </Card>
        <Text variant="caption" tone="muted" style={styles.note}>
          Your exact location is stored privately and is never shown to other users.
        </Text>
        <Button title="Delete location data" variant="ghost" onPress={deleteLocation} loading={updateLocation.isPending} style={styles.delete} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: theme.spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
  flex: { flex: 1, gap: 2 },
  pressed: { backgroundColor: theme.colors.surfaceMuted },
  note: { marginTop: 12 },
  delete: { marginTop: 16 },
});
